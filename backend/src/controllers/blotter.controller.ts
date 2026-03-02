import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, createAuditLog } from '../middleware/auth.middleware';
import { generateBlotterNumber } from '../utils/generateDocumentNumber';
import XLSX from 'xlsx';

const prisma = new PrismaClient();

export const getBlotterEntries = async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '50', category, status, search, residentType } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const user = req.user!;

    const where: any = {};
    if (category) where.category = category;
    if (status) where.status = status;
    if (residentType === 'RESIDENT') {
      where.resident = {
        ...(where.resident || {}),
        residencyStatus: 'RESIDENT'
      };
    } else if (residentType === 'NON_RESIDENT') {
      where.resident = {
        ...(where.resident || {}),
        residencyStatus: 'INSTITUTIONAL_HOUSEHOLD'
      };
    }

    if (user.role !== 'ADMIN') {
      if (user.barangay) {
        where.resident = { barangay: user.barangay };
      } else {
        where.id = '00000000-0000-0000-0000-000000000000';
      }
    }
    
    if (search) {
      where.OR = [
        { entryNumber: { contains: search as string, mode: 'insensitive' } },
        { narrative: { contains: search as string, mode: 'insensitive' } },
        { resident: { 
          OR: [
            { firstName: { contains: search as string, mode: 'insensitive' } },
            { lastName: { contains: search as string, mode: 'insensitive' } }
          ]
        } }
      ];
    }

    const [entries, total] = await Promise.all([
      prisma.blotterEntry.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        include: {
          resident: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              address: true
            }
          },
          creator: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { incidentDate: 'desc' }
      }),
      prisma.blotterEntry.count({ where })
    ]);

    res.json({
      entries,
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

export const getBlotterEntry = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const entry = await prisma.blotterEntry.findUnique({
      where: { id },
      include: {
        resident: true,
        creator: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!entry) {
      return res.status(404).json({ message: 'Blotter entry not found' });
    }

    if (user.role !== 'ADMIN' && entry.resident.barangay !== user.barangay) {
      return res.status(403).json({ message: 'You can only view blotter entries from your barangay' });
    }

    res.json(entry);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createBlotterEntry = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const {
      residentId,
      residentType,
      nonResidentName,
      nonResidentAddress,
      category,
      narrative,
      incidentDate,
      actionsTaken,
      status
    } = req.body;

    const entryNumber = generateBlotterNumber();

    let residentRecordId = residentId as string | undefined;
    const isNonResident = residentType === 'NON_RESIDENT';

    if (isNonResident) {
      if (!nonResidentName || !String(nonResidentName).trim()) {
        return res.status(400).json({ message: 'Non-resident name is required' });
      }

      const [firstName, ...lastNameParts] = String(nonResidentName).trim().split(/\s+/);
      const lastName = lastNameParts.join(' ') || 'Unknown';
      const assignedBarangay = user.role === 'ADMIN' ? null : user.barangay;
      if (user.role !== 'ADMIN' && !assignedBarangay) {
        return res.status(403).json({ message: 'Your account has no assigned barangay' });
      }

      const tempResident = await prisma.resident.create({
        data: {
          firstName,
          lastName,
          middleName: null,
          suffix: null,
          // Placeholder values required by schema for non-resident blotter entries
          dateOfBirth: new Date('1970-01-01'),
          sex: 'UNKNOWN',
          civilStatus: 'SINGLE',
          barangay: assignedBarangay,
          address: (nonResidentAddress && String(nonResidentAddress).trim()) || 'Non-resident address not provided',
          contactNo: 'N/A',
          residencyStatus: 'INSTITUTIONAL_HOUSEHOLD',
          isArchived: false,
        },
      });
      residentRecordId = tempResident.id;
    } else {
      const resident = await prisma.resident.findUnique({
        where: { id: residentId },
        select: { id: true, barangay: true }
      });
      if (!resident) {
        return res.status(404).json({ message: 'Resident not found' });
      }
      if (user.role !== 'ADMIN' && resident.barangay !== user.barangay) {
        return res.status(403).json({ message: 'You can only create blotter entries for your barangay' });
      }
    }

    const entry = await prisma.blotterEntry.create({
      data: {
        entryNumber,
        residentId: residentRecordId!,
        category,
        narrative,
        incidentDate: new Date(incidentDate),
        actionsTaken: actionsTaken || null,
        status: status || 'OPEN',
        createdBy: req.user!.id
      },
      include: {
        resident: true
      }
    });

    await createAuditLog(
      req.user!.id,
      'CREATE',
      'BLOTTER',
      entry.id,
      { action: 'Created blotter entry', entryNumber },
      req
    );

    res.status(201).json(entry);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateBlotterEntry = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;
    const updateData: any = { ...req.body };

    if (updateData.incidentDate) {
      updateData.incidentDate = new Date(updateData.incidentDate);
    }

    const oldEntry = await prisma.blotterEntry.findUnique({
      where: { id },
      include: {
        resident: {
          select: { barangay: true }
        }
      }
    });
    
    if (!oldEntry) {
      return res.status(404).json({ message: 'Blotter entry not found' });
    }

    if (user.role !== 'ADMIN' && oldEntry.resident.barangay !== user.barangay) {
      return res.status(403).json({ message: 'You can only update blotter entries from your barangay' });
    }

    const entry = await prisma.blotterEntry.update({
      where: { id },
      data: updateData,
      include: {
        resident: true
      }
    });

    await createAuditLog(
      req.user!.id,
      'UPDATE',
      'BLOTTER',
      entry.id,
      { 
        action: 'Updated blotter entry',
        changes: { old: oldEntry, new: entry }
      },
      req
    );

    res.json(entry);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateBlotterStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const user = req.user!;

    const existingEntry = await prisma.blotterEntry.findUnique({
      where: { id },
      include: {
        resident: {
          select: { barangay: true }
        }
      }
    });

    if (!existingEntry) {
      return res.status(404).json({ message: 'Blotter entry not found' });
    }

    if (user.role !== 'ADMIN' && existingEntry.resident.barangay !== user.barangay) {
      return res.status(403).json({ message: 'You can only update blotter entries from your barangay' });
    }

    const entry = await prisma.blotterEntry.update({
      where: { id },
      data: { status }
    });

    await createAuditLog(
      req.user!.id,
      'UPDATE_STATUS',
      'BLOTTER',
      entry.id,
      { action: 'Updated blotter status', status },
      req
    );

    res.json(entry);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const exportBlotterReport = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, format = 'xlsx', category, status, residentType } = req.query;
    const user = req.user!;

    const where: any = {};
    if (startDate || endDate) {
      where.incidentDate = {};
      if (startDate) where.incidentDate.gte = new Date(startDate as string);
      if (endDate) where.incidentDate.lte = new Date(endDate as string);
    }
    if (category) where.category = category;
    if (status) where.status = status;
    if (residentType === 'RESIDENT') {
      where.resident = {
        ...(where.resident || {}),
        residencyStatus: 'RESIDENT'
      };
    } else if (residentType === 'NON_RESIDENT') {
      where.resident = {
        ...(where.resident || {}),
        residencyStatus: 'INSTITUTIONAL_HOUSEHOLD'
      };
    }

    if (user.role !== 'ADMIN') {
      if (user.barangay) {
        where.resident = {
          ...(where.resident || {}),
          barangay: user.barangay
        };
      } else {
        where.id = '00000000-0000-0000-0000-000000000000';
      }
    }

    const entries = await prisma.blotterEntry.findMany({
      where,
      include: {
        resident: true
      },
      orderBy: { incidentDate: 'desc' }
    });

    if (format === 'xlsx') {
      const data = entries.map((entry: typeof entries[number]) => ({
        'Entry Number': entry.entryNumber,
        'Date': entry.incidentDate.toLocaleDateString(),
        'Resident': `${entry.resident.firstName} ${entry.resident.lastName}`,
        'Category': entry.category.replace(/_/g, ' '),
        'Status': entry.status,
        'Narrative': entry.narrative,
        'Actions Taken': entry.actionsTaken || ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Blotter Entries');

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=blotter-report-${Date.now()}.xlsx`);
      res.send(buffer);
    } else {
      res.json(entries);
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

