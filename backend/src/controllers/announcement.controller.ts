import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, createAuditLog } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

export const getActiveAnnouncements = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const { barangay } = req.query;

    const announcements = await prisma.announcement.findMany({
      where: {
        OR: [
          { startDate: null, endDate: null },
          { startDate: { lte: now }, endDate: { gte: now } },
          { startDate: { lte: now }, endDate: null },
          { startDate: null, endDate: { gte: now } }
        ]
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 10
    });

    // Filter by barangay if provided
    let filteredAnnouncements = announcements;
    if (barangay && typeof barangay === 'string') {
      filteredAnnouncements = announcements.filter(announcement => {
        // If targetBarangays is empty, show to all barangays
        if (!announcement.targetBarangays || announcement.targetBarangays.length === 0) {
          return true;
        }
        // Otherwise, check if the resident's barangay is in the target list
        return announcement.targetBarangays.includes(barangay);
      });
    }

    res.json(filteredAnnouncements);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getAnnouncements = async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '50', type } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {};
    if (type) where.type = type;

    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
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
        orderBy: [
          { isPinned: 'desc' },
          { createdAt: 'desc' }
        ]
      }),
      prisma.announcement.count({ where })
    ]);

    res.json({
      announcements,
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

export const getAnnouncement = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const announcement = await prisma.announcement.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    res.json(announcement);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createAnnouncement = async (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      content,
      type,
      isPinned,
      startDate,
      endDate,
      targetBarangays
    } = req.body;

    const attachments = req.files
      ? (req.files as Express.Multer.File[]).map(file => `/uploads/announcements/${file.filename}`)
      : [];

    // Parse targetBarangays if it's a string
    let barangayList: string[] = [];
    if (targetBarangays) {
      if (typeof targetBarangays === 'string') {
        try {
          barangayList = JSON.parse(targetBarangays);
        } catch {
          barangayList = targetBarangays.split(',').map((b: string) => b.trim()).filter(Boolean);
        }
      } else if (Array.isArray(targetBarangays)) {
        barangayList = targetBarangays;
      }
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        type: type || 'GENERAL',
        isPinned: isPinned === 'true' || isPinned === true,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        attachments,
        targetBarangays: barangayList,
        createdBy: req.user!.id
      }
    });

    await createAuditLog(
      req.user!.id,
      'CREATE',
      'ANNOUNCEMENT',
      announcement.id,
      { action: 'Created announcement', title },
      req
    );

    res.status(201).json(announcement);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateAnnouncement = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData: any = { ...req.body };

    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
    if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);
    if (updateData.isPinned !== undefined) {
      updateData.isPinned = updateData.isPinned === 'true' || updateData.isPinned === true;
    }

    // Parse targetBarangays if present
    if (updateData.targetBarangays) {
      if (typeof updateData.targetBarangays === 'string') {
        try {
          updateData.targetBarangays = JSON.parse(updateData.targetBarangays);
        } catch {
          updateData.targetBarangays = updateData.targetBarangays.split(',').map((b: string) => b.trim()).filter(Boolean);
        }
      }
    }

    if (req.files && (req.files as Express.Multer.File[]).length > 0) {
      const newAttachments = (req.files as Express.Multer.File[]).map(
        file => `/uploads/announcements/${file.filename}`
      );
      const existingAnnouncement = await prisma.announcement.findUnique({ where: { id } });
      updateData.attachments = [...(existingAnnouncement?.attachments || []), ...newAttachments];
    }

    const oldAnnouncement = await prisma.announcement.findUnique({ where: { id } });
    
    if (!oldAnnouncement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    const announcement = await prisma.announcement.update({
      where: { id },
      data: updateData
    });

    await createAuditLog(
      req.user!.id,
      'UPDATE',
      'ANNOUNCEMENT',
      announcement.id,
      { 
        action: 'Updated announcement',
        changes: { old: oldAnnouncement, new: announcement }
      },
      req
    );

    res.json(announcement);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteAnnouncement = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.announcement.delete({
      where: { id }
    });

    await createAuditLog(
      req.user!.id,
      'DELETE',
      'ANNOUNCEMENT',
      id,
      { action: 'Deleted announcement' },
      req
    );

    res.json({ message: 'Announcement deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

