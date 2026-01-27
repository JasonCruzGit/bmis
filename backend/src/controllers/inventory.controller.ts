import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, createAuditLog } from '../middleware/auth.middleware';
import { generateQRCode as generateQR, generateQRCodeDataURL } from '../utils/qrGenerator';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

export const getInventoryItems = async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '50', category, lowStock, search } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {};
    if (category) where.category = { contains: category as string, mode: 'insensitive' };
    
    if (search) {
      where.OR = [
        { itemName: { contains: search as string, mode: 'insensitive' } },
        { category: { contains: search as string, mode: 'insensitive' } },
        { location: { contains: search as string, mode: 'insensitive' } },
        { qrCode: { contains: search as string, mode: 'insensitive' } }
      ];
    }
    
    // For low stock filtering, we need to fetch all items and filter in memory
    // because Prisma doesn't support comparing two fields directly in WHERE clause
    if (lowStock === 'true') {
      // Fetch all items matching other filters to properly filter by low stock
      const allItems = await prisma.inventoryItem.findMany({
        where,
        include: {
          _count: {
            select: { logs: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      
      // Filter for low stock items (quantity <= minStock)
      const lowStockItems = allItems.filter(
        (item) => item.quantity <= item.minStock
      );
      
      // Apply pagination to filtered results
      const total = lowStockItems.length;
      const paginatedItems = lowStockItems.slice(skip, skip + parseInt(limit as string));
      
      return res.json({
        items: paginatedItems,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string))
        }
      });
    }
    
    // Normal query when lowStock is not requested
    const items = await prisma.inventoryItem.findMany({
      where,
      skip,
      take: parseInt(limit as string),
      include: {
        _count: {
          select: { logs: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.inventoryItem.count({ where });

    res.json({
      items,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getInventoryItem = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const item = await prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        logs: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            creator: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    res.json(item);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createInventoryItem = async (req: AuthRequest, res: Response) => {
  try {
    const {
      itemName,
      category,
      quantity,
      unit,
      minStock,
      location,
      notes
    } = req.body;

    // Handle photo upload
    let photoPath = null;
    if (req.file) {
      photoPath = `/uploads/inventory/${req.file.filename}`;
    }

    // Generate QR code
    const qrData = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const qrCodePath = path.join(__dirname, '../../uploads/qrcodes', `${qrData}.png`);
    
    if (!fs.existsSync(path.dirname(qrCodePath))) {
      fs.mkdirSync(path.dirname(qrCodePath), { recursive: true });
    }

    // Generate QR code with URL pointing to public page
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const qrCodeUrl = `${frontendUrl}/public/inventory/${qrData}`;
    await generateQR(qrCodeUrl, qrCodePath);

    const item = await prisma.inventoryItem.create({
      data: {
        itemName,
        category,
        quantity: parseInt(quantity) || 0,
        unit: unit || 'pcs',
        minStock: parseInt(minStock) || 0,
        location: location || null,
        notes: notes || null,
        qrCode: qrData,
        ...(photoPath && { photo: photoPath })
      }
    });

    await createAuditLog(
      req.user!.id,
      'CREATE',
      'INVENTORY',
      item.id,
      { action: 'Created inventory item', itemName },
      req
    );

    res.status(201).json(item);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateInventoryItem = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData: any = { ...req.body };

    if (updateData.quantity) updateData.quantity = parseInt(updateData.quantity);
    if (updateData.minStock) updateData.minStock = parseInt(updateData.minStock);

    // Handle photo upload
    if (req.file) {
      updateData.photo = `/uploads/inventory/${req.file.filename}`;
      
      // Delete old photo if exists
      const oldItem = await prisma.inventoryItem.findUnique({ where: { id } });
      if (oldItem?.photo) {
        const oldPhotoPath = path.join(__dirname, '../../', oldItem.photo);
        if (fs.existsSync(oldPhotoPath)) {
          fs.unlinkSync(oldPhotoPath);
        }
      }
    }

    const oldItem = await prisma.inventoryItem.findUnique({ where: { id } });
    
    if (!oldItem) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    const item = await prisma.inventoryItem.update({
      where: { id },
      data: updateData
    });

    await createAuditLog(
      req.user!.id,
      'UPDATE',
      'INVENTORY',
      item.id,
      { 
        action: 'Updated inventory item',
        changes: { old: oldItem, new: item }
      },
      req
    );

    res.json(item);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteInventoryItem = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.inventoryItem.delete({
      where: { id }
    });

    await createAuditLog(
      req.user!.id,
      'DELETE',
      'INVENTORY',
      id,
      { action: 'Deleted inventory item' },
      req
    );

    res.json({ message: 'Inventory item deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const addInventoryLog = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      type,
      quantity,
      notes,
      releasedTo
    } = req.body;

    const item = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    // Validate that RELEASE type requires a valid official
    if (type === 'RELEASE') {
      if (!releasedTo) {
        return res.status(400).json({ message: 'Released to (official ID) is required for releases' });
      }
      
      // Verify that releasedTo is a valid official
      const official = await prisma.official.findUnique({
        where: { id: releasedTo },
        select: { id: true, isActive: true }
      });
      
      if (!official) {
        return res.status(400).json({ message: 'Invalid official ID. Items can only be released to barangay officials.' });
      }
      
      if (!official.isActive) {
        return res.status(400).json({ message: 'Cannot release item to inactive official' });
      }
    }

    // Update quantity based on log type
    let newQuantity = item.quantity;
    if (type === 'ADD' || type === 'RETURN') {
      newQuantity += parseInt(quantity);
    } else if (type === 'REMOVE' || type === 'RELEASE') {
      newQuantity -= parseInt(quantity);
      if (newQuantity < 0) {
        return res.status(400).json({ message: 'Insufficient quantity' });
      }
    } else if (type === 'ADJUSTMENT') {
      newQuantity = parseInt(quantity);
    }

    // Create log and update item in transaction
    const [log, updatedItem] = await prisma.$transaction([
      prisma.inventoryLog.create({
        data: {
          itemId: id,
          type,
          quantity: parseInt(quantity),
          notes: notes || null,
          releasedTo: releasedTo || null,
          createdBy: req.user!.id
        }
      }),
      prisma.inventoryItem.update({
        where: { id },
        data: { quantity: newQuantity }
      })
    ]);

    await createAuditLog(
      req.user!.id,
      'CREATE',
      'INVENTORY_LOG',
      log.id,
      { action: 'Added inventory log', type, quantity },
      req
    );

    res.status(201).json({ log, item: updatedItem });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getInventoryLogs = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { page = '1', limit = '50' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [logs, total] = await Promise.all([
      prisma.inventoryLog.findMany({
        where: { itemId: id },
        skip,
        take: parseInt(limit as string),
        include: {
          creator: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.inventoryLog.count({ where: { itemId: id } })
    ]);

    res.json({
      logs,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const generateQRCode = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const item = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    if (!item.qrCode) {
      return res.status(400).json({ message: 'Item does not have a QR code' });
    }

    // Generate QR code with URL that points to public page
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const qrCodeUrl = `${frontendUrl}/public/inventory/${item.qrCode}`;
    const qrCodeDataURL = await generateQRCodeDataURL(qrCodeUrl);
    res.json({ qrCode: qrCodeDataURL, itemName: item.itemName, qrCodeUrl });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Public endpoint to get inventory item by QR code (no auth required)
export const getInventoryItemByQRCode = async (req: any, res: Response) => {
  try {
    const { qrCode } = req.params;

    const item = await prisma.inventoryItem.findUnique({
      where: { qrCode },
      include: {
        logs: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            creator: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    res.json(item);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

