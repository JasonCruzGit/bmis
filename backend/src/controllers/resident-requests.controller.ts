import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, createAuditLog } from '../middleware/auth.middleware';
import { generateDocumentNumber } from '../utils/generateDocumentNumber';
import { generateCertificatePDF } from '../utils/pdfGenerator';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

// Get all document requests (for admin)
export const getAllDocumentRequests = async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '50', status, search, barangay } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const user = req.user!;

    // CRITICAL: For non-ADMIN users, ALWAYS filter by their barangay - no exceptions
    const where: any = {};
    
    // Determine barangay filter based on user role
    // CRITICAL: Check role explicitly - BARANGAY_CHAIRMAN and STAFF must be filtered
    const isAdmin = user.role === 'ADMIN';
    let barangayFilter: string | null = null;
    console.log(`[getAllDocumentRequests] User role check: role="${user.role}", isAdmin=${isAdmin}, barangay="${user.barangay}"`);
    
    if (!isAdmin) {
      barangayFilter = user.barangay || null;
      console.log(`[getAllDocumentRequests] Non-ADMIN user: role=${user.role}, barangay=${barangayFilter}`);
      
      if (!barangayFilter) {
        // If user has no barangay assigned, they shouldn't see any requests
        // Use an impossible condition to return no results
        where.id = '00000000-0000-0000-0000-000000000000';
        console.log(`[getAllDocumentRequests] User has no barangay assigned - returning no results`);
      } else {
        // FORCE barangay filter - this is mandatory and non-negotiable for non-ADMIN users
        // Start with barangay filter as the base - everything else builds on top
        where.resident = {
          barangay: barangayFilter
        };
        console.log(`[getAllDocumentRequests] FORCING barangay filter: ${barangayFilter}`);
      }
    } else {
      // ADMIN can filter by specific barangay if provided, or see all
      barangayFilter = barangay ? (barangay as string) : null;
      if (barangayFilter) {
        where.resident = {
          barangay: barangayFilter
        };
      }
    }

    // Add status filter if provided
    if (status) where.status = status;

    // Add search filter if provided - must work WITH the barangay filter
    if (search) {
      if (barangayFilter) {
        // We have both barangay filter and search - combine them with AND
        const searchConditions = [
          { requestNumber: { contains: search as string, mode: 'insensitive' } },
          { resident: {
            barangay: barangayFilter, // Ensure barangay is still applied in search
            OR: [
              { firstName: { contains: search as string, mode: 'insensitive' } },
              { lastName: { contains: search as string, mode: 'insensitive' } }
            ]
          } }
        ];

        // Rebuild where clause to ensure barangay filter is always applied
        const statusFilter = where.status;
        where.AND = [
          { resident: { barangay: barangayFilter } },
          { OR: searchConditions }
        ];
        if (statusFilter) where.AND.push({ status: statusFilter });
        delete where.resident; // Remove from top level since it's now in AND
        delete where.status; // Remove from top level since it's now in AND
      } else {
        // No barangay filter (ADMIN without barangay filter), just search
        where.OR = [
          { requestNumber: { contains: search as string, mode: 'insensitive' } },
          { resident: {
            OR: [
              { firstName: { contains: search as string, mode: 'insensitive' } },
              { lastName: { contains: search as string, mode: 'insensitive' } }
            ]
          } }
        ];
      }
    }

    // FINAL SAFETY CHECK: For non-ADMIN users, verify barangay filter is in place
    if (!isAdmin && barangayFilter) {
      if (where.AND) {
        // Check if barangay filter exists in AND clause
        const hasBarangayFilter = where.AND.some((condition: any) => 
          condition.resident?.barangay === barangayFilter
        );
        if (!hasBarangayFilter) {
          console.error(`[getAllDocumentRequests] ERROR: Barangay filter missing in AND clause! Adding it now.`);
          where.AND.unshift({ resident: { barangay: barangayFilter } });
        }
      } else if (!where.resident || where.resident.barangay !== barangayFilter) {
        console.error(`[getAllDocumentRequests] ERROR: Barangay filter missing! Forcing it now.`);
        where.resident = { barangay: barangayFilter };
      }
    }

    // FINAL VERIFICATION: For non-ADMIN users, the barangay filter MUST be present
    if (user.role !== 'ADMIN' && barangayFilter) {
      let hasFilter = false;
      if (where.resident?.barangay === barangayFilter) {
        hasFilter = true;
      } else if (where.AND) {
        hasFilter = where.AND.some((c: any) => c.resident?.barangay === barangayFilter);
      }
      
      if (!hasFilter) {
        console.error(`[getAllDocumentRequests] CRITICAL ERROR: Barangay filter missing! User: ${user.email}, Expected: ${barangayFilter}`);
        // Force it - rebuild the entire query
        const statusFilter = where.status;
        where.resident = { barangay: barangayFilter };
        if (statusFilter) where.status = statusFilter;
        delete where.AND;
        delete where.OR;
      }
    }

    console.log(`[getAllDocumentRequests] Final where clause:`, JSON.stringify(where, null, 2));
    console.log(`[getAllDocumentRequests] User: ${user.email}, Role: ${user.role}, Barangay: ${user.barangay}, Filter: ${barangayFilter}`);

    // FINAL SAFETY CHECK: For non-ADMIN users, ensure barangay filter is ALWAYS applied
    if (!isAdmin && barangayFilter) {
      // Double-check the where clause structure
      const hasBarangayInWhere = where.resident?.barangay === barangayFilter;
      const hasBarangayInAnd = where.AND?.some((c: any) => c.resident?.barangay === barangayFilter);
      
      if (!hasBarangayInWhere && !hasBarangayInAnd) {
        console.error(`[getAllDocumentRequests] CRITICAL: Barangay filter not found in where clause! Rebuilding...`);
        // Rebuild with barangay filter as the base
        const statusFilter = where.status;
        const searchFilter = where.OR;
        where.resident = { barangay: barangayFilter };
        if (statusFilter) where.status = statusFilter;
        if (searchFilter) {
          // Combine search with barangay filter using AND
          where.AND = [
            { resident: { barangay: barangayFilter } },
            { OR: searchFilter }
          ];
          delete where.resident;
          delete where.OR;
        }
      }
    }

    const [requests, total] = await Promise.all([
      prisma.documentRequest.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' },
        include: {
          resident: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              address: true,
              contactNo: true,
              barangay: true, // Include barangay in the response
            },
          },
          processor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
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
    console.error('Error in getAllDocumentRequests:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

// Get all resident complaints (incidents submitted via portal)
export const getAllResidentComplaints = async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '50', status, search, barangay } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const user = req.user!;

    // CRITICAL: For non-ADMIN users, ALWAYS filter by their barangay - no exceptions
    const where: any = {
      // Filter incidents that contain [COMPLAINT/REQUEST] in narrative
      narrative: { contains: '[COMPLAINT/REQUEST]', mode: 'insensitive' },
    };
    
    // Determine barangay filter based on user role
    // CRITICAL: Check role explicitly - BARANGAY_CHAIRMAN and STAFF must be filtered
    let barangayFilter: string | null = null;
    const isAdmin = user.role === 'ADMIN';
    console.log(`[getAllResidentComplaints] User role check: role="${user.role}", isAdmin=${isAdmin}, barangay="${user.barangay}"`);
    
    if (!isAdmin) {
      barangayFilter = user.barangay || null;
      console.log(`[getAllResidentComplaints] Non-ADMIN user: role=${user.role}, barangay=${barangayFilter}`);
      
      if (!barangayFilter) {
        // If user has no barangay assigned, they shouldn't see any complaints
        // Use an impossible condition to return no results
        where.id = '00000000-0000-0000-0000-000000000000';
        console.log(`[getAllResidentComplaints] User has no barangay assigned - returning no results`);
      } else {
        // FORCE barangay filter - this is mandatory and non-negotiable for non-ADMIN users
        // Start with barangay filter as the base - everything else builds on top
        where.complainant = {
          barangay: barangayFilter
        };
        console.log(`[getAllResidentComplaints] FORCING barangay filter: ${barangayFilter}`);
      }
    } else {
      // ADMIN can filter by specific barangay if provided, or see all
      barangayFilter = barangay ? (barangay as string) : null;
      if (barangayFilter) {
        where.complainant = {
          barangay: barangayFilter
        };
      }
    }

    // Add status filter if provided
    if (status) where.status = status;

    // Add search filter if provided - must work WITH the barangay filter
    if (search) {
      if (barangayFilter) {
        // We have both barangay filter and search - combine them with AND
        const searchConditions = [
          { incidentNumber: { contains: search as string, mode: 'insensitive' } },
          { narrative: { contains: search as string, mode: 'insensitive' } },
          { complainant: {
            barangay: barangayFilter, // Ensure barangay is still applied in search
            OR: [
              { firstName: { contains: search as string, mode: 'insensitive' } },
              { lastName: { contains: search as string, mode: 'insensitive' } }
            ]
          } }
        ];

        // Rebuild where clause to ensure barangay filter is always applied
        const statusFilter = where.status;
        where.AND = [
          { narrative: { contains: '[COMPLAINT/REQUEST]', mode: 'insensitive' } },
          { complainant: { barangay: barangayFilter } },
          { OR: searchConditions }
        ];
        if (statusFilter) where.AND.push({ status: statusFilter });
        delete where.complainant; // Remove from top level since it's now in AND
        delete where.narrative; // Remove from top level since it's now in AND
        delete where.status; // Remove from top level since it's now in AND
      } else {
        // No barangay filter (ADMIN without barangay filter), just search (narrative filter stays at top level)
        where.OR = [
          { incidentNumber: { contains: search as string, mode: 'insensitive' } },
          { narrative: { contains: search as string, mode: 'insensitive' } },
          { complainant: {
            OR: [
              { firstName: { contains: search as string, mode: 'insensitive' } },
              { lastName: { contains: search as string, mode: 'insensitive' } }
            ]
          } }
        ];
      }
    }

    // FINAL VERIFICATION: For non-ADMIN users, the barangay filter MUST be present
    if (!isAdmin && barangayFilter) {
      let hasFilter = false;
      if (where.complainant?.barangay === barangayFilter) {
        hasFilter = true;
      } else if (where.AND) {
        hasFilter = where.AND.some((c: any) => c.complainant?.barangay === barangayFilter);
      }
      
      if (!hasFilter) {
        console.error(`[getAllResidentComplaints] CRITICAL ERROR: Barangay filter missing! User: ${user.email}, Expected: ${barangayFilter}`);
        // Force it - rebuild the entire query
        const statusFilter = where.status;
        where.narrative = { contains: '[COMPLAINT/REQUEST]', mode: 'insensitive' };
        where.complainant = { barangay: barangayFilter };
        if (statusFilter) where.status = statusFilter;
        delete where.AND;
        delete where.OR;
      }
    }

    // FINAL VERIFICATION: For non-ADMIN users, the barangay filter MUST be present
    if (user.role !== 'ADMIN' && barangayFilter) {
      let hasFilter = false;
      if (where.complainant?.barangay === barangayFilter) {
        hasFilter = true;
      } else if (where.AND) {
        hasFilter = where.AND.some((c: any) => c.complainant?.barangay === barangayFilter);
      }
      
      if (!hasFilter) {
        console.error(`[getAllResidentComplaints] CRITICAL ERROR: Barangay filter missing! User: ${user.email}, Expected: ${barangayFilter}`);
        // Force it - rebuild the entire query
        const statusFilter = where.status;
        where.narrative = { contains: '[COMPLAINT/REQUEST]', mode: 'insensitive' };
        where.complainant = { barangay: barangayFilter };
        if (statusFilter) where.status = statusFilter;
        delete where.AND;
        delete where.OR;
      }
    }

    console.log(`[getAllResidentComplaints] Final where clause:`, JSON.stringify(where, null, 2));
    console.log(`[getAllResidentComplaints] User: ${user.email}, Role: ${user.role}, Barangay: ${user.barangay}, Filter: ${barangayFilter}`);

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
              address: true,
              contactNo: true,
              barangay: true, // Include barangay in the response
            },
          },
          creator: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { incidentDate: 'desc' },
      }),
      prisma.incident.count({ where }),
    ]);

    res.json({
      complaints: incidents,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error: any) {
    console.error('Error in getAllResidentComplaints:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

// Update document request status
export const updateDocumentRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes, rejectedReason, fee, paymentStatus } = req.body;
    const userId = req.user?.id;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    // Get the request first to check if document already exists
    const existingRequest = await prisma.documentRequest.findUnique({
      where: { id },
      include: {
        document: true,
        resident: true,
      },
    });

    if (!existingRequest) {
      return res.status(404).json({ message: 'Document request not found' });
    }

    // CRITICAL: For non-ADMIN users, verify they can only update requests from their barangay
    const user = req.user!;
    if (user.role !== 'ADMIN') {
      const userBarangay = user.barangay;
      const residentBarangay = existingRequest.resident.barangay;
      
      if (!userBarangay || userBarangay !== residentBarangay) {
        console.error(`[updateDocumentRequest] Access denied: User ${user.email} (barangay: ${userBarangay}) attempted to update request from barangay ${residentBarangay}`);
        return res.status(403).json({ 
          message: 'Access denied. You can only update requests from your barangay.' 
        });
      }
    }

    const updateData: any = {
      status,
      processedBy: userId,
      processedAt: new Date(),
    };

    if (notes) updateData.notes = notes;
    if (rejectedReason) updateData.rejectedReason = rejectedReason;
    if (fee !== undefined) updateData.fee = fee;
    // Allow manual update of payment status (for over-the-counter payments)
    if (paymentStatus) {
      updateData.paymentStatus = paymentStatus;
      // Set payment method to "Over the Counter" when marked as paid
      if (paymentStatus === 'PAID') {
        updateData.paymentMethod = 'Over the Counter';
      }
    }

    // If status is APPROVED or COMPLETED, ensure document exists and has PDF
    if (status === 'APPROVED' || status === 'COMPLETED') {
      let document = existingRequest.document;
      let issuer: { firstName: string; lastName: string } | null = null;
      
      // Create document if it doesn't exist
      if (!document) {
        const documentNumber = generateDocumentNumber(existingRequest.documentType);
        
        // Get issuer information for PDF
        issuer = await prisma.user.findUnique({
          where: { id: userId! },
          select: {
            firstName: true,
            lastName: true,
          },
        });

        if (!issuer) {
          return res.status(404).json({ message: 'User not found' });
        }

        // Create document record
        document = await prisma.document.create({
          data: {
            documentNumber,
            documentType: existingRequest.documentType,
            residentId: existingRequest.residentId,
            issuedBy: userId!,
            issuedDate: new Date(),
            purpose: existingRequest.purpose || null,
            requestId: id, // Link document to request
          },
          include: {
            resident: true,
          },
        });
      }

      // Generate PDF if document doesn't have a filePath
      if (!document.filePath) {
        try {
          // Get issuer information if not already available
          if (!issuer) {
            issuer = await prisma.user.findUnique({
              where: { id: userId! },
              select: {
                firstName: true,
                lastName: true,
              },
            });
            if (!issuer) {
              throw new Error('User not found');
            }
          }

          const outputDir = path.join(__dirname, '../../uploads/documents');
          if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
          }

          const outputPath = path.join(outputDir, `${document.documentNumber}.pdf`);

          await generateCertificatePDF({
            documentNumber: document.documentNumber,
            documentType: document.documentType,
            residentName: `${existingRequest.resident.firstName} ${existingRequest.resident.lastName}`,
            residentAddress: existingRequest.resident.address,
            purpose: existingRequest.purpose || undefined,
            issuedDate: document.issuedDate,
            issuedBy: `${issuer.firstName} ${issuer.lastName}`,
            template: undefined,
          }, outputPath);

          // Update document with file path
          document = await prisma.document.update({
            where: { id: document.id },
            data: { filePath: `/uploads/documents/${document.documentNumber}.pdf` },
          });
          
          console.log(`✅ PDF generated successfully: /uploads/documents/${document.documentNumber}.pdf`);
        } catch (pdfError: any) {
          console.error('Error generating PDF:', pdfError);
          // Continue even if PDF generation fails - document is still created
        }
      }

      // Create audit log (only if document was just created)
      if (!existingRequest.document) {
        await createAuditLog(
          userId!,
          'CREATE',
          'DOCUMENT',
          document.id,
          { 
            action: 'Document created from request', 
            documentType: existingRequest.documentType, 
            documentNumber: document.documentNumber,
            requestNumber: existingRequest.requestNumber 
          },
          req
        );
      }
    }

    // Update the request
    const request = await prisma.documentRequest.update({
      where: { id },
      data: updateData,
      include: {
        resident: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            address: true,
            contactNo: true,
          },
        },
        processor: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        document: {
          select: {
            id: true,
            documentNumber: true,
            filePath: true,
          },
        },
      },
    });

    // Create audit log for request update
    await createAuditLog(
      userId!,
      'UPDATE',
      'DOCUMENT_REQUEST',
      id,
      { 
        action: 'Document request updated', 
        status,
        requestNumber: request.requestNumber 
      },
      req
    );

    res.json({
      message: 'Document request updated successfully',
      request,
    });
  } catch (error: any) {
    console.error('Error in updateDocumentRequest:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

