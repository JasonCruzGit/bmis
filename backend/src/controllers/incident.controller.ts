import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, createAuditLog } from '../middleware/auth.middleware';
import { generateIncidentNumber } from '../utils/generateDocumentNumber';
import XLSX from 'xlsx';

const prisma = new PrismaClient();

export const getIncidents = async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '50', status } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const user = req.user!;

    const where: any = {
      NOT: [{ narrative: { startsWith: '[DIRECT_MESSAGE]' } }],
    };
    if (status) where.status = status;

    if (user.role !== 'ADMIN') {
      if (user.barangay) {
        where.complainant = { barangay: user.barangay };
      } else {
        where.id = '00000000-0000-0000-0000-000000000000';
      }
    }

    const [incidents, total] = await Promise.all([
      prisma.incident.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        include: {
          complainant: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              address: true
            }
          },
          respondent: {
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
      prisma.incident.count({ where })
    ]);

    res.json({
      incidents,
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

export const getIncident = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const incident = await prisma.incident.findUnique({
      where: { id },
      include: {
        complainant: true,
        respondent: true,
        creator: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    if (user.role !== 'ADMIN' && incident.complainant.barangay !== user.barangay) {
      return res.status(403).json({ message: 'You can only view incidents from your barangay' });
    }

    res.json(incident);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createIncident = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const {
      complainantId,
      respondentId,
      narrative,
      incidentDate,
      actionsTaken,
      status,
      hearingDate
    } = req.body;

    const attachments = req.files
      ? (req.files as Express.Multer.File[]).map(file => `/uploads/incidents/${file.filename}`)
      : [];

    const complainant = await prisma.resident.findUnique({
      where: { id: complainantId },
      select: { id: true, barangay: true }
    });
    if (!complainant) {
      return res.status(404).json({ message: 'Complainant not found' });
    }
    if (user.role !== 'ADMIN' && complainant.barangay !== user.barangay) {
      return res.status(403).json({ message: 'You can only create incidents for your barangay' });
    }

    const incidentNumber = generateIncidentNumber();

    const incident = await prisma.incident.create({
      data: {
        incidentNumber,
        complainantId,
        respondentId: respondentId || null,
        narrative,
        incidentDate: new Date(incidentDate),
        actionsTaken: actionsTaken || null,
        status: status || 'PENDING',
        hearingDate: hearingDate ? new Date(hearingDate) : null,
        attachments,
        createdBy: req.user!.id
      },
      include: {
        complainant: true,
        respondent: true
      }
    });

    await createAuditLog(
      req.user!.id,
      'CREATE',
      'INCIDENT',
      incident.id,
      { action: 'Created incident', incidentNumber },
      req
    );

    res.status(201).json(incident);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateIncident = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;
    const updateData: any = { ...req.body };

    if (updateData.incidentDate) {
      updateData.incidentDate = new Date(updateData.incidentDate);
    }
    if (updateData.hearingDate) {
      updateData.hearingDate = new Date(updateData.hearingDate);
    }

    if (req.files && (req.files as Express.Multer.File[]).length > 0) {
      const newAttachments = (req.files as Express.Multer.File[]).map(
        file => `/uploads/incidents/${file.filename}`
      );
      const existingIncident = await prisma.incident.findUnique({ where: { id } });
      updateData.attachments = [...(existingIncident?.attachments || []), ...newAttachments];
    }

    const oldIncident = await prisma.incident.findUnique({
      where: { id },
      include: {
        complainant: {
          select: { barangay: true }
        }
      }
    });
    
    if (!oldIncident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    if (user.role !== 'ADMIN' && oldIncident.complainant.barangay !== user.barangay) {
      return res.status(403).json({ message: 'You can only update incidents from your barangay' });
    }

    const incident = await prisma.incident.update({
      where: { id },
      data: updateData,
      include: {
        complainant: true,
        respondent: true
      }
    });

    await createAuditLog(
      req.user!.id,
      'UPDATE',
      'INCIDENT',
      incident.id,
      { 
        action: 'Updated incident',
        changes: { old: oldIncident, new: incident }
      },
      req
    );

    res.json(incident);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateIncidentStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const user = req.user!;

    const existingIncident = await prisma.incident.findUnique({
      where: { id },
      include: {
        complainant: {
          select: { barangay: true }
        }
      }
    });

    if (!existingIncident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    if (user.role !== 'ADMIN' && existingIncident.complainant.barangay !== user.barangay) {
      return res.status(403).json({ message: 'You can only update incidents from your barangay' });
    }

    const incident = await prisma.incident.update({
      where: { id },
      data: { status }
    });

    await createAuditLog(
      req.user!.id,
      'UPDATE_STATUS',
      'INCIDENT',
      incident.id,
      { action: 'Updated incident status', status },
      req
    );

    res.json(incident);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const exportIncidentsReport = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, status, format = 'xlsx' } = req.query;
    const user = req.user!;

    const where: any = {
      NOT: [{ narrative: { startsWith: '[DIRECT_MESSAGE]' } }],
    };
    if (status) where.status = status;

    if (startDate || endDate) {
      where.incidentDate = {};
      if (startDate) where.incidentDate.gte = new Date(startDate as string);
      if (endDate) where.incidentDate.lte = new Date(endDate as string);
    }

    if (user.role !== 'ADMIN') {
      if (user.barangay) {
        where.complainant = { barangay: user.barangay };
      } else {
        where.id = '00000000-0000-0000-0000-000000000000';
      }
    }

    const incidents = await prisma.incident.findMany({
      where,
      include: {
        complainant: true,
        respondent: true,
      },
      orderBy: { incidentDate: 'desc' },
    });

    if (format === 'xlsx') {
      const data = incidents.map((incident: typeof incidents[number]) => ({
        'Incident Number': incident.incidentNumber,
        'Incident Date': incident.incidentDate.toLocaleString(),
        'Complainant': `${incident.complainant.firstName} ${incident.complainant.lastName}`,
        'Complainant Address': incident.complainant.address || '',
        'Respondent': incident.respondent ? `${incident.respondent.firstName} ${incident.respondent.lastName}` : 'N/A',
        'Status': incident.status,
        'Narrative': incident.narrative,
        'Actions Taken': incident.actionsTaken || '',
        'Hearing Date': incident.hearingDate ? incident.hearingDate.toLocaleString() : '',
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Incidents');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=incidents-report-${Date.now()}.xlsx`);
      return res.send(buffer);
    }

    res.json(incidents);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};



