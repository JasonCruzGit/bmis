import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { generateCertificatePDF } from '../utils/pdfGenerator';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();
const DIRECT_MESSAGE_TAG = '[DIRECT_MESSAGE]';
type MessageMeta = { viewedAt: string | null };

// Generate request number
const generateRequestNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `REQ-${year}-${random}`;
};

const parseDirectMessageNarrative = (narrative: string) => {
  const lines = narrative.split('\n');
  const subjectLine = lines.find((line) => line.startsWith('Subject: ')) || 'Subject: No subject';
  const subject = subjectLine.replace('Subject: ', '').trim() || 'No subject';
  const messageStartIndex = lines.findIndex((line) => line.startsWith('Subject: '));
  const message = lines.slice(messageStartIndex + 1).join('\n').trim();
  return { subject, message };
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

const serializeMessageMeta = (meta: MessageMeta) => JSON.stringify(meta);

// Resident login/verification
export const residentLogin = async (req: Request, res: Response) => {
  try {
    const { contactNo, dateOfBirth, password } = req.body;

    if (!contactNo) {
      return res.status(400).json({ message: 'Contact number is required' });
    }

    // Find resident by contact number
    const resident = await prisma.resident.findFirst({
      where: {
        contactNo,
        isArchived: false,
      },
    });

    if (!resident) {
      return res.status(401).json({ message: 'Invalid credentials or resident not found' });
    }

    // Check if resident has a password set
    const hasPassword = !!resident.password;
    
    // Debug logging
    console.log('Resident login check:', {
      residentId: resident.id,
      hasPassword,
      passwordField: resident.password ? 'exists' : 'null/undefined'
    });

    // If password is set, require password for login
    if (hasPassword) {
      if (!password) {
        return res.status(400).json({ 
          message: 'Password is required',
          requiresPassword: true 
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, resident.password!);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid password' });
      }
    } else {
      // If no password is set, require date of birth for initial login
      if (!dateOfBirth) {
        return res.status(400).json({ 
          message: 'Date of birth is required for first-time login',
          requiresPassword: false 
        });
      }

      // Verify date of birth
      const residentDob = new Date(resident.dateOfBirth);
      const providedDob = new Date(dateOfBirth);
      
      // Compare dates (ignore time)
      if (
        residentDob.getFullYear() !== providedDob.getFullYear() ||
        residentDob.getMonth() !== providedDob.getMonth() ||
        residentDob.getDate() !== providedDob.getDate()
      ) {
        return res.status(401).json({ message: 'Invalid date of birth' });
      }
    }

    // Generate token for resident session
    const token = jwt.sign(
      { residentId: resident.id, type: 'resident' },
      process.env.JWT_SECRET!,
      { expiresIn: '30d' }
    );

    const response = {
      token,
      resident: {
        id: resident.id,
        firstName: resident.firstName,
        middleName: resident.middleName,
        lastName: resident.lastName,
        suffix: resident.suffix,
        dateOfBirth: resident.dateOfBirth,
        sex: resident.sex,
        civilStatus: resident.civilStatus,
        barangay: resident.barangay,
        address: resident.address,
        contactNo: resident.contactNo,
        occupation: resident.occupation,
        education: resident.education,
        lengthOfStay: resident.lengthOfStay,
        isPWD: resident.isPWD,
        idPhoto: resident.idPhoto,
        residencyStatus: resident.residencyStatus,
      },
      requiresPasswordSetup: !hasPassword, // Flag to indicate if password needs to be set
    };
    
    // Debug logging
    console.log('Login response:', {
      residentId: resident.id,
      requiresPasswordSetup: response.requiresPasswordSetup,
      hasPassword
    });
    
    res.json(response);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Set password for resident (after initial login)
export const setResidentPassword = async (req: Request, res: Response) => {
  try {
    const residentId = (req as any).residentId;
    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword) {
      return res.status(400).json({ message: 'Password and confirmation are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Get resident to check if password is already set
    const resident = await prisma.resident.findUnique({
      where: { id: residentId },
      select: { id: true, password: true },
    });

    if (!resident) {
      return res.status(404).json({ message: 'Resident not found' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update resident with password
    await prisma.resident.update({
      where: { id: residentId },
      data: { password: hashedPassword },
    });

    res.json({ message: 'Password set successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Get resident's own documents
export const getMyDocuments = async (req: Request, res: Response) => {
  try {
    const residentId = (req as any).residentId;
    const { page = '1', limit = '20' } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where: { residentId },
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          documentNumber: true,
          documentType: true,
          issuedDate: true,
          purpose: true,
          filePath: true,
        },
      }),
      prisma.document.count({ where: { residentId } }),
    ]);

    res.json({
      documents,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Get resident's document requests
export const getMyRequests = async (req: Request, res: Response) => {
  try {
    const residentId = (req as any).residentId;
    if (!residentId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { page = '1', limit = '20', status } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = { residentId };
    if (status) where.status = status;

    const [requests, total] = await Promise.all([
      prisma.documentRequest.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' },
        include: {
          document: {
            select: {
              id: true,
              documentNumber: true,
              filePath: true,
            },
          },
        },
      }),
      prisma.documentRequest.count({ where }),
    ]);

    res.json({
      requests,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error: any) {
    console.error('Error in getMyRequests:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

// Create document request
export const createDocumentRequest = async (req: Request, res: Response) => {
  try {
    const residentId = (req as any).residentId;
    if (!residentId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { documentType, purpose } = req.body;

    if (!documentType) {
      return res.status(400).json({ message: 'Document type is required' });
    }

    // Check if resident exists
    const resident = await prisma.resident.findUnique({
      where: { id: residentId },
    });

    if (!resident || resident.isArchived) {
      return res.status(404).json({ message: 'Resident not found' });
    }

    // Create request
    const request = await prisma.documentRequest.create({
      data: {
        requestNumber: generateRequestNumber(),
        residentId,
        documentType,
        purpose: purpose || null,
        status: 'PENDING',
        paymentStatus: 'UNPAID',
      },
    });

    res.status(201).json({
      message: 'Document request submitted successfully',
      request,
    });
  } catch (error: any) {
    console.error('Error in createDocumentRequest:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

// Get request details
export const getRequestDetails = async (req: Request, res: Response) => {
  try {
    const residentId = (req as any).residentId;
    if (!residentId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { id } = req.params;

    const request = await prisma.documentRequest.findFirst({
      where: {
        id,
        residentId,
      },
      include: {
        resident: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            address: true,
          },
        },
        document: {
          select: {
            id: true,
            documentNumber: true,
            filePath: true,
            issuedDate: true,
            issuedBy: true,
          },
        },
        processor: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // If document exists but doesn't have a filePath, generate it
    if (request.document && !request.document.filePath && (request.status === 'APPROVED' || request.status === 'COMPLETED')) {
      try {
        // Get issuer information - use processedBy or document's issuedBy
        const issuerId = request.processedBy || request.document.issuedBy;
        if (!issuerId) {
          console.error('No issuer found for document:', request.document.id);
        } else {
          const issuer = await prisma.user.findUnique({
            where: { id: issuerId },
            select: {
              firstName: true,
              lastName: true,
            },
          });

          if (issuer && request.resident) {
            const outputDir = path.join(__dirname, '../../uploads/documents');
            if (!fs.existsSync(outputDir)) {
              fs.mkdirSync(outputDir, { recursive: true });
            }

          const outputPath = path.join(outputDir, `${request.document.documentNumber}.pdf`);

          console.log('Generating PDF for document:', request.document.documentNumber);
          console.log('Output path:', outputPath);
          console.log('Resident:', `${request.resident.firstName} ${request.resident.lastName}`);
          console.log('Issuer:', `${issuer.firstName} ${issuer.lastName}`);
            
          await generateCertificatePDF({
            documentNumber: request.document.documentNumber,
            documentType: request.documentType,
            residentName: `${request.resident.firstName} ${request.resident.lastName}`,
            residentAddress: request.resident.address,
            purpose: request.purpose || undefined,
            issuedDate: request.document.issuedDate,
            issuedBy: `${issuer.firstName} ${issuer.lastName}`,
            template: undefined,
          }, outputPath);

          // Verify file was created
          if (fs.existsSync(outputPath)) {
            // Update document with file path
            await prisma.document.update({
              where: { id: request.document.id },
              data: { filePath: `/uploads/documents/${request.document.documentNumber}.pdf` },
            });

            console.log('✅ PDF generated and saved:', `/uploads/documents/${request.document.documentNumber}.pdf`);
          } else {
            console.error('❌ PDF file was not created at:', outputPath);
            throw new Error('PDF file was not created');
          }

            // Refetch request with updated document
            const updatedRequest = await prisma.documentRequest.findFirst({
              where: {
                id,
                residentId,
              },
              include: {
                resident: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    address: true,
                  },
                },
                document: {
                  select: {
                    id: true,
                    documentNumber: true,
                    filePath: true,
                    issuedDate: true,
                  },
                },
                processor: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            });

            if (updatedRequest) {
              return res.json(updatedRequest);
            }
          } else {
            console.error('Missing issuer or resident data:', { issuer: !!issuer, resident: !!request.resident });
          }
        }
      } catch (pdfError: any) {
        console.error('Error generating PDF in getRequestDetails:', pdfError);
        console.error('Error stack:', pdfError.stack);
        // Continue and return request even if PDF generation fails
      }
    }

    res.json(request);
  } catch (error: any) {
    console.error('Error in getRequestDetails:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

// Submit complaint/request
export const submitComplaint = async (req: Request, res: Response) => {
  try {
    const residentId = (req as any).residentId;
    const { subject, description, category, attachments } = req.body;

    if (!subject || !description) {
      return res.status(400).json({ message: 'Subject and description are required' });
    }

    // Get system user (first admin)
    const systemUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!systemUser) {
      return res.status(500).json({ message: 'System configuration error' });
    }

    // Create incident as complaint
    const incident = await prisma.incident.create({
      data: {
        incidentNumber: `COMP-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`,
        complainantId: residentId,
        narrative: `[COMPLAINT/REQUEST]\nSubject: ${subject}\nCategory: ${category || 'General'}\n\n${description}`,
        incidentDate: new Date(),
        status: 'PENDING',
        attachments: attachments || [],
        createdBy: systemUser.id,
      },
    });

    res.status(201).json({
      message: 'Complaint/request submitted successfully',
      incident: {
        id: incident.id,
        incidentNumber: incident.incidentNumber,
        status: incident.status,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Get resident complaints
export const getMyComplaints = async (req: Request, res: Response) => {
  try {
    const residentId = (req as any).residentId;
    if (!residentId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { page = '1', limit = '100' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [complaints, total] = await Promise.all([
      prisma.incident.findMany({
        where: {
          complainantId: residentId,
          narrative: { contains: '[COMPLAINT/REQUEST]', mode: 'insensitive' },
        },
        skip,
        take: parseInt(limit as string),
        orderBy: { incidentDate: 'desc' },
        select: {
          id: true,
          incidentNumber: true,
          narrative: true,
          status: true,
          incidentDate: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.incident.count({
        where: {
          complainantId: residentId,
          narrative: { contains: '[COMPLAINT/REQUEST]', mode: 'insensitive' },
        },
      }),
    ]);

    res.json({
      complaints,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error: any) {
    console.error('Error in getMyComplaints:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

// Get resident direct messages from admin
export const getMyDirectMessages = async (req: Request, res: Response) => {
  try {
    const residentId = (req as any).residentId;
    if (!residentId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {
      complainantId: residentId,
      narrative: { startsWith: DIRECT_MESSAGE_TAG },
    };

    const [messages, total] = await Promise.all([
      prisma.incident.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        include: {
          creator: {
            select: {
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.incident.count({ where }),
    ]);

    res.json({
      messages: messages.map((msg) => {
        const parsed = parseDirectMessageNarrative(msg.narrative);
        const meta = parseMessageMeta(msg.actionsTaken);
        return {
          id: msg.id,
          messageNumber: msg.incidentNumber,
          subject: parsed.subject,
          message: parsed.message,
          sentAt: msg.createdAt,
          sender: msg.creator,
          isViewed: !!meta.viewedAt,
          viewedAt: meta.viewedAt,
          attachments: msg.attachments || [],
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
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

// Mark a direct message as viewed by the resident
export const markMyDirectMessageViewed = async (req: Request, res: Response) => {
  try {
    const residentId = (req as any).residentId;
    if (!residentId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { id } = req.params;

    const message = await prisma.incident.findFirst({
      where: {
        id,
        complainantId: residentId,
        narrative: { startsWith: DIRECT_MESSAGE_TAG },
      },
      select: { id: true, actionsTaken: true },
    });

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const meta = parseMessageMeta(message.actionsTaken);
    if (!meta.viewedAt) {
      await prisma.incident.update({
        where: { id: message.id },
        data: {
          actionsTaken: serializeMessageMeta({ viewedAt: new Date().toISOString() }),
        },
      });
    }

    return res.json({ message: 'Marked as viewed' });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

// Get public announcements
export const getPublicAnnouncements = async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '10', barangay } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const now = new Date();

    // Build where clause for date filtering
    const dateWhere: any = {
      OR: [
        { startDate: null },
        { startDate: { lte: now } },
      ],
      AND: [
        {
          OR: [
            { endDate: null },
            { endDate: { gte: now } },
          ],
        },
      ],
    };

    // Add barangay filtering to where clause if provided
    if (barangay && typeof barangay === 'string') {
      dateWhere.AND.push({
        OR: [
          // Show announcements with no target barangays (for all)
          { targetBarangays: { equals: [] } },
          // Show announcements where the barangay is in the target list
          { targetBarangays: { has: barangay } },
        ],
      });
    }

    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        where: dateWhere,
        skip,
        take: parseInt(limit as string),
        orderBy: [
          { isPinned: 'desc' },
          { createdAt: 'desc' },
        ],
        select: {
          id: true,
          title: true,
          content: true,
          type: true,
          isPinned: true,
          attachments: true,
          targetBarangays: true,
          startDate: true,
          endDate: true,
          createdAt: true,
        },
      }),
      prisma.announcement.count({
        where: dateWhere,
      }),
    ]);

    res.json({
      announcements,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Get document types
export const getDocumentTypes = async (req: Request, res: Response) => {
  res.json({
    types: [
      { value: 'INDIGENCY', label: 'Certificate of Indigency' },
      { value: 'RESIDENCY', label: 'Certificate of Residency' },
      { value: 'CLEARANCE', label: 'Barangay Clearance' },
      { value: 'SOLO_PARENT', label: 'Solo Parent Certificate' },
      { value: 'GOOD_MORAL', label: 'Certificate of Good Moral Character' },
    ],
  });
};

// Payment callback removed - all payments are now made over the counter at the barangay hall office

