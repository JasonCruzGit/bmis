import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, createAuditLog } from '../middleware/auth.middleware';
import { generateQRCodeDataURL } from '../utils/qrGenerator';

const prisma = new PrismaClient();

// Helper function to generate QR code data for resident
const generateResidentQRCode = (qrCode: string): string => {
  // Always use production URL for QR codes so they work when scanned
  // QR codes should point to the deployed site, not localhost
  const productionUrl = 'https://frontend-blush-chi-30.vercel.app';
  
  // Remove trailing slash if present
  const cleanUrl = productionUrl.replace(/\/$/, '');
  return `${cleanUrl}/public/resident/${qrCode}`;
};

export const getResidents = async (req: AuthRequest, res: Response) => {
  try {
    const { 
      page = '1', 
      limit = '50', 
      archived = 'false',
      residencyStatus,
      civilStatus,
      isPWD,
      youth,
      barangay
    } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {
      isArchived: archived === 'true'
    };

    // Filter by residency status
    if (residencyStatus) {
      where.residencyStatus = residencyStatus as string;
    }

    // Filter by civil status
    if (civilStatus) {
      where.civilStatus = civilStatus as string;
    }

    // Filter by PWD status
    if (isPWD !== undefined) {
      const isPWDValue = typeof isPWD === 'string' ? isPWD === 'true' : Boolean(isPWD);
      where.isPWD = isPWDValue;
    }

    // Filter by Youth (15-30 years old)
    if (youth === 'true') {
      const today = new Date();
      const maxDate = new Date(today.getFullYear() - 15, today.getMonth(), today.getDate());
      const minDate = new Date(today.getFullYear() - 30, today.getMonth(), today.getDate());
      where.dateOfBirth = {
        gte: minDate,
        lte: maxDate
      };
    }

    // Filter by Barangay
    if (barangay) {
      where.barangay = barangay as string;
    }

    const [residents, total] = await Promise.all([
      prisma.resident.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        include: {
          household: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.resident.count({ where })
    ]);

    res.json({
      residents,
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

export const getResident = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const resident = await prisma.resident.findUnique({
      where: { id },
      include: {
        household: true,
        documents: {
          orderBy: { issuedDate: 'desc' },
          take: 10
        }
      }
    });

    if (!resident) {
      return res.status(404).json({ message: 'Resident not found' });
    }

    res.json(resident);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createResident = async (req: AuthRequest, res: Response) => {
  try {
    const {
      firstName,
      middleName,
      lastName,
      suffix,
      dateOfBirth,
      sex,
      civilStatus,
      barangay,
      address,
      contactNo,
      occupation,
      education,
      householdId,
      residencyStatus,
      lengthOfStay,
      isPWD
    } = req.body;

    const idPhoto = req.file ? `/uploads/residents/${req.file.filename}` : null;

    // Generate unique QR code identifier
    const qrCodeId = `RES-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Try to create with qrCode, fallback if column doesn't exist
    let resident;
    try {
      resident = await prisma.resident.create({
        data: {
          firstName,
          middleName: middleName || null,
          lastName,
          suffix: suffix || null,
          dateOfBirth: new Date(dateOfBirth),
          sex,
          civilStatus,
          barangay: barangay || null,
          address,
          contactNo,
          occupation: occupation || null,
          education: education || null,
          lengthOfStay: lengthOfStay || null,
          isPWD: isPWD === 'true' || isPWD === true,
          householdId: householdId || null,
          residencyStatus: residencyStatus || 'NEW',
          idPhoto,
          qrCode: qrCodeId
        },
        include: {
          household: true
        }
      });
    } catch (error: any) {
      // If qrCode column doesn't exist, create without it
      if (error.message?.includes('qr_code') || error.message?.includes('Unknown column')) {
        console.warn('QR code column not found, creating resident without QR code. Please run migration.');
        resident = await prisma.resident.create({
          data: {
            firstName,
            middleName: middleName || null,
            lastName,
            suffix: suffix || null,
            dateOfBirth: new Date(dateOfBirth),
            sex,
            civilStatus,
            barangay: barangay || null,
            address,
            contactNo,
            occupation: occupation || null,
            education: education || null,
            lengthOfStay: lengthOfStay || null,
            isPWD: isPWD === 'true' || isPWD === true,
            householdId: householdId || null,
            residencyStatus: residencyStatus || 'NEW',
            idPhoto
          },
          include: {
            household: true
          }
        });
      } else {
        throw error;
      }
    }

    await createAuditLog(
      req.user!.id,
      'CREATE',
      'RESIDENT',
      resident.id,
      { action: 'Created resident', residentName: `${firstName} ${lastName}` },
      req
    );

    res.status(201).json(resident);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateResident = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData: any = { ...req.body };

    if (req.file) {
      updateData.idPhoto = `/uploads/residents/${req.file.filename}`;
    }

    if (updateData.dateOfBirth) {
      updateData.dateOfBirth = new Date(updateData.dateOfBirth);
    }

    // Handle isPWD boolean conversion
    if (updateData.isPWD !== undefined) {
      updateData.isPWD = updateData.isPWD === 'true' || updateData.isPWD === true;
    }

    const oldResident = await prisma.resident.findUnique({ where: { id } });
    
    if (!oldResident) {
      return res.status(404).json({ message: 'Resident not found' });
    }

    const resident = await prisma.resident.update({
      where: { id },
      data: updateData,
      include: {
        household: true
      }
    });

    await createAuditLog(
      req.user!.id,
      'UPDATE',
      'RESIDENT',
      resident.id,
      { 
        action: 'Updated resident',
        changes: { old: oldResident, new: resident }
      },
      req
    );

    res.json(resident);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const archiveResident = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const resident = await prisma.resident.update({
      where: { id },
      data: { isArchived: true }
    });

    await createAuditLog(
      req.user!.id,
      'ARCHIVE',
      'RESIDENT',
      resident.id,
      { action: 'Archived resident' },
      req
    );

    res.json({ message: 'Resident archived successfully', resident });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const searchResidents = async (req: AuthRequest, res: Response) => {
  try {
    const { q, householdNumber } = req.query;

    if (!q && !householdNumber) {
      return res.status(400).json({ message: 'Search query or household number is required' });
    }

    const where: any = {
      isArchived: false
    };

    if (q) {
      where.OR = [
        { firstName: { contains: q as string, mode: 'insensitive' } },
        { lastName: { contains: q as string, mode: 'insensitive' } },
        { middleName: { contains: q as string, mode: 'insensitive' } },
        { address: { contains: q as string, mode: 'insensitive' } }
      ];
    }

    if (householdNumber) {
      where.household = {
        householdNumber: householdNumber as string
      };
    }

    const residents = await prisma.resident.findMany({
      where,
      include: {
        household: true
      },
      take: 50
    });

    res.json(residents);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Get QR code for a resident
export const getResidentQRCode = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const resident = await prisma.resident.findUnique({ 
      where: { id },
      select: { id: true, qrCode: true, firstName: true, lastName: true }
    });

    if (!resident) {
      return res.status(404).json({ message: 'Resident not found' });
    }

    // Generate QR code if it doesn't exist
    let qrCodeId = resident.qrCode;
    if (!qrCodeId) {
      qrCodeId = `RES-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await prisma.resident.update({
        where: { id },
        data: { qrCode: qrCodeId }
      });
    }

    // Generate QR code data URL
    const qrCodeUrl = generateResidentQRCode(qrCodeId);
    const qrCodeDataURL = await generateQRCodeDataURL(qrCodeUrl);

    res.json({ 
      qrCode: qrCodeDataURL, 
      qrCodeId,
      qrCodeUrl,
      residentName: `${resident.firstName} ${resident.lastName}` 
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Public endpoint to get resident info by QR code (no auth required)
export const getResidentByQRCode = async (req: Request, res: Response) => {
  try {
    const { qrCode } = req.params;

    const resident = await prisma.resident.findUnique({
      where: { qrCode },
      include: {
        household: true,
        documents: {
          orderBy: { issuedDate: 'desc' },
          take: 5
        }
      }
    });

    if (!resident) {
      return res.status(404).json({ message: 'Resident not found' });
    }

    // Return public-safe information (exclude sensitive data)
    res.json({
      id: resident.id,
      firstName: resident.firstName,
      middleName: resident.middleName,
      lastName: resident.lastName,
      suffix: resident.suffix,
      dateOfBirth: resident.dateOfBirth,
      sex: resident.sex,
      civilStatus: resident.civilStatus,
      address: resident.address,
      contactNo: resident.contactNo,
      occupation: resident.occupation,
      education: resident.education,
      residencyStatus: resident.residencyStatus,
      idPhoto: resident.idPhoto,
      household: resident.household ? {
        householdNumber: resident.household.householdNumber,
        headName: resident.household.headName,
        address: resident.household.address
      } : null,
      documents: resident.documents.map(doc => ({
        documentNumber: doc.documentNumber,
        documentType: doc.documentType,
        issuedDate: doc.issuedDate,
        purpose: doc.purpose
      }))
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};



