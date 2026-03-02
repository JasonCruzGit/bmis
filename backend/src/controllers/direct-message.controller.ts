import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, createAuditLog } from '../middleware/auth.middleware';

const prisma = new PrismaClient();
const DIRECT_MESSAGE_TAG = '[DIRECT_MESSAGE]';
type MessageMeta = { viewedAt: string | null };

const formatNarrative = (subject: string, message: string) =>
  `${DIRECT_MESSAGE_TAG}\nSubject: ${subject}\n\n${message}`;

const parseNarrative = (narrative: string) => {
  const lines = narrative.split('\n');
  const subjectLine = lines.find((line) => line.startsWith('Subject: ')) || 'Subject: No subject';
  const subject = subjectLine.replace('Subject: ', '').trim() || 'No subject';
  const messageStartIndex = lines.findIndex((line) => line.startsWith('Subject: '));
  const message = lines.slice(messageStartIndex + 1).join('\n').trim();
  return { subject, message };
};

const generateMessageNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, '0');
  return `MSG-${year}-${random}`;
};

const parseMessageMeta = (value: string | null | undefined): MessageMeta => {
  if (!value) return { viewedAt: null };
  try {
    const parsed = JSON.parse(value);
    return {
      viewedAt: typeof parsed?.viewedAt === 'string' ? parsed.viewedAt : null,
    };
  } catch {
    return { viewedAt: null };
  }
};

export const sendDirectMessage = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { residentId, residentIds: residentIdsRaw, subject, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ message: 'subject and message are required' });
    }

    if (!['ADMIN', 'BARANGAY_CHAIRMAN'].includes(user.role)) {
      return res.status(403).json({ message: 'Only admin accounts can send direct messages' });
    }

    let residentIds: string[] = [];
    if (Array.isArray(residentIdsRaw)) {
      residentIds = residentIdsRaw.map((id) => String(id).trim()).filter(Boolean);
    } else if (typeof residentIdsRaw === 'string' && residentIdsRaw.trim()) {
      try {
        const parsed = JSON.parse(residentIdsRaw);
        if (Array.isArray(parsed)) {
          residentIds = parsed.map((id) => String(id).trim()).filter(Boolean);
        } else {
          residentIds = [residentIdsRaw.trim()];
        }
      } catch {
        residentIds = residentIdsRaw.split(',').map((id) => id.trim()).filter(Boolean);
      }
    } else if (residentId) {
      residentIds = [String(residentId).trim()];
    }

    residentIds = Array.from(new Set(residentIds));
    if (residentIds.length === 0) {
      return res.status(400).json({ message: 'At least one resident recipient is required' });
    }

    const residents = await prisma.resident.findMany({
      where: { id: { in: residentIds } },
      select: { id: true, firstName: true, lastName: true, barangay: true, isArchived: true },
    });

    if (residents.length !== residentIds.length) {
      return res.status(404).json({ message: 'One or more residents were not found' });
    }

    if (residents.some((r) => r.isArchived)) {
      return res.status(400).json({ message: 'Cannot send message to archived resident(s)' });
    }

    if (user.role !== 'ADMIN' && residents.some((r) => r.barangay !== user.barangay)) {
      return res.status(403).json({ message: 'You can only message residents from your barangay' });
    }

    const attachments = req.files
      ? (req.files as Express.Multer.File[]).map((file) => `/uploads/general/${file.filename}`)
      : [];

    const createdMessages = await prisma.$transaction(
      residents.map((resident) =>
        prisma.incident.create({
          data: {
            incidentNumber: generateMessageNumber(),
            complainantId: resident.id,
            narrative: formatNarrative(subject, message),
            incidentDate: new Date(),
            status: 'CLOSED',
            actionsTaken: JSON.stringify({ viewedAt: null }),
            attachments,
            createdBy: user.id,
          },
          include: {
            complainant: {
              select: { id: true, firstName: true, lastName: true, barangay: true },
            },
          },
        })
      )
    );

    await createAuditLog(
      user.id,
      'CREATE',
      'DIRECT_MESSAGE',
      createdMessages[0]?.id,
      { action: 'Sent direct message', residentCount: residents.length, subject },
      req
    );

    return res.status(201).json({
      message: `Direct message sent to ${createdMessages.length} resident(s)`,
      count: createdMessages.length,
      messages: createdMessages.map((incident) => ({
        id: incident.id,
        messageNumber: incident.incidentNumber,
        sentAt: incident.createdAt,
        subject,
        message,
        recipient: incident.complainant,
        attachments,
      })),
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const getDirectMessages = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { page = '1', limit = '20', residentId, q } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    if (!['ADMIN', 'BARANGAY_CHAIRMAN'].includes(user.role)) {
      return res.status(403).json({ message: 'Only admin accounts can view direct messages' });
    }

    const where: any = {
      narrative: { startsWith: DIRECT_MESSAGE_TAG },
    };

    if (residentId) {
      where.complainantId = residentId as string;
    }

    if (q) {
      where.OR = [
        { narrative: { contains: q as string, mode: 'insensitive' } },
        { complainant: { firstName: { contains: q as string, mode: 'insensitive' } } },
        { complainant: { lastName: { contains: q as string, mode: 'insensitive' } } },
      ];
    }

    if (user.role !== 'ADMIN') {
      if (user.barangay) {
        where.complainant = { barangay: user.barangay };
      } else {
        where.id = '00000000-0000-0000-0000-000000000000';
      }
    }

    const [messages, total] = await Promise.all([
      prisma.incident.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        include: {
          complainant: {
            select: { id: true, firstName: true, lastName: true, barangay: true },
          },
          creator: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.incident.count({ where }),
    ]);

    return res.json({
      messages: messages.map((m) => {
        const parsed = parseNarrative(m.narrative);
        const meta = parseMessageMeta(m.actionsTaken);
        return {
          id: m.id,
          messageNumber: m.incidentNumber,
          sentAt: m.createdAt,
          subject: parsed.subject,
          message: parsed.message,
          recipient: m.complainant,
          sender: m.creator,
          isViewed: !!meta.viewedAt,
          viewedAt: meta.viewedAt,
          attachments: m.attachments || [],
        };
      }),
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

