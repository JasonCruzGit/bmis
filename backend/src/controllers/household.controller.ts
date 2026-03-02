import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, createAuditLog } from '../middleware/auth.middleware';
import { generateHouseholdNumber } from '../utils/generateDocumentNumber';

const prisma = new PrismaClient();

export const getHouseholds = async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '50' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const user = req.user!;
    const where: any = {};

    if (user.role !== 'ADMIN') {
      if (user.barangay) {
        where.barangay = user.barangay;
      } else {
        where.id = '00000000-0000-0000-0000-000000000000';
      }
    }

    const [households, total] = await Promise.all([
      prisma.household.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        include: {
          residents: {
            where: { isArchived: false }
          },
          _count: {
            select: { residents: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.household.count({ where })
    ]);

    res.json({
      households,
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

export const getHousehold = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const household = await prisma.household.findUnique({
      where: { id },
      include: {
        residents: {
          where: { isArchived: false }
        }
      }
    });

    if (!household) {
      return res.status(404).json({ message: 'Household not found' });
    }

    if (user.role !== 'ADMIN' && household.barangay !== user.barangay) {
      return res.status(403).json({ message: 'You can only view households from your barangay' });
    }

    res.json(household);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createHousehold = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const {
      headName,
      headFirstName,
      headMiddleName,
      headLastName,
      headOfFamilyName,
      address,
      houseNumber,
      province,
      purokSitio,
      streetSubdivision,
      barangay,
      zone,
      municipality,
      houseBuildingNumber,
      unitNumber,
      latitude,
      longitude,
      income,
      livingConditions,
      householdSize,
      ownerMainFamily,
      extendedFamily,
      mainFamilyHeadId,
      numberOfFamilyMembers,
      yearFirstResided,
      placeOfOriginMunicipality,
      placeOfOriginProvince,
      // Health Information
      threeMealsDaily,
      hasMedicinalPlants,
      medicinalPlantTypes,
      hasVegetableGarden,
      usesIodizedSalt,
      usesFamilyPlanning,
      familyPlanningMethod,
      // Natural Family Planning Methods
      basalBodyTemperature,
      cervicalMucus,
      lactationalMucus,
      rhythm,
      standardDaysMethod,
      symptoThermalMethod,
      withdrawal,
      // Artificial Family Planning Methods
      condom,
      depoInjection,
      iud,
      tubalLigation,
      pills,
      vasectomy,
      subdermalImplants
    } = req.body;

    const householdNumber = generateHouseholdNumber();

    // Construct headName from first/middle/last name if provided, otherwise use headName or default
    let finalHeadName = '';
    if (headFirstName && headLastName) {
      finalHeadName = `${headFirstName}${headMiddleName ? ' ' + headMiddleName : ''} ${headLastName}`.trim();
    } else if (headName && headName.trim()) {
      finalHeadName = headName.trim();
    } else {
      finalHeadName = 'Unknown'; // Default value if no name provided
    }

    // Construct address from components if address is empty
    let finalAddress = address?.trim() || '';
    if (!finalAddress) {
      const addressParts = [
        houseNumber,
        houseBuildingNumber,
        unitNumber,
        streetSubdivision,
        zone,
        purokSitio,
        barangay,
        municipality,
        province
      ].filter(part => part && part.trim());
      
      if (addressParts.length > 0) {
        finalAddress = addressParts.join(', ');
      } else {
        finalAddress = 'Address not provided'; // Default value if no address provided
      }
    }

    const assignedBarangay = user.role === 'ADMIN' ? (barangay || null) : user.barangay;
    if (user.role !== 'ADMIN' && !assignedBarangay) {
      return res.status(403).json({ message: 'Your account has no assigned barangay' });
    }

    const household = await prisma.household.create({
      data: {
        householdNumber,
        headName: finalHeadName,
        headFirstName: headFirstName || null,
        headMiddleName: headMiddleName || null,
        headLastName: headLastName || null,
        headOfFamilyName: headOfFamilyName || null,
        address: finalAddress,
        houseNumber: houseNumber || null,
        province: province || null,
        purokSitio: purokSitio || null,
        streetSubdivision: streetSubdivision || null,
        barangay: assignedBarangay,
        zone: zone || null,
        municipality: municipality || null,
        houseBuildingNumber: houseBuildingNumber || null,
        unitNumber: unitNumber || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        income: income ? parseFloat(income) : null,
        livingConditions: livingConditions || null,
        householdSize: householdSize || 1,
        ownerMainFamily: ownerMainFamily || null,
        extendedFamily: extendedFamily || null,
        mainFamilyHeadId: mainFamilyHeadId || null,
        numberOfFamilyMembers: numberOfFamilyMembers ? parseInt(numberOfFamilyMembers) : null,
        yearFirstResided: yearFirstResided ? parseInt(yearFirstResided) : null,
        placeOfOriginMunicipality: placeOfOriginMunicipality || null,
        placeOfOriginProvince: placeOfOriginProvince || null,
        // Health Information
        threeMealsDaily: threeMealsDaily || null,
        hasMedicinalPlants: hasMedicinalPlants || null,
        medicinalPlantTypes: medicinalPlantTypes || null,
        hasVegetableGarden: hasVegetableGarden || null,
        usesIodizedSalt: usesIodizedSalt || null,
        usesFamilyPlanning: usesFamilyPlanning || null,
        familyPlanningMethod: familyPlanningMethod || null,
        // Natural Family Planning Methods
        basalBodyTemperature: basalBodyTemperature || false,
        cervicalMucus: cervicalMucus || false,
        lactationalMucus: lactationalMucus || false,
        rhythm: rhythm || false,
        standardDaysMethod: standardDaysMethod || false,
        symptoThermalMethod: symptoThermalMethod || false,
        withdrawal: withdrawal || false,
        // Artificial Family Planning Methods
        condom: condom || false,
        depoInjection: depoInjection || false,
        iud: iud || false,
        tubalLigation: tubalLigation || false,
        pills: pills || false,
        vasectomy: vasectomy || false,
        subdermalImplants: subdermalImplants || false,
      }
    });

    // Auto-create head of household as a resident record linked to this household
    let headResidentCreated = false;
    if (finalHeadName && finalHeadName.toLowerCase() !== 'unknown') {
      let residentFirstName = (headFirstName || '').trim();
      let residentMiddleName = (headMiddleName || '').trim();
      let residentLastName = (headLastName || '').trim();

      // If split name parts are not provided, derive from headName
      if (!residentFirstName || !residentLastName) {
        const nameParts = finalHeadName.trim().split(/\s+/).filter(Boolean);
        if (nameParts.length === 1) {
          residentFirstName = nameParts[0];
          residentLastName = 'Unknown';
        } else {
          residentFirstName = nameParts[0];
          residentLastName = nameParts[nameParts.length - 1];
          if (!residentMiddleName && nameParts.length > 2) {
            residentMiddleName = nameParts.slice(1, -1).join(' ');
          }
        }
      }

      const existingHeadResident = await prisma.resident.findFirst({
        where: {
          householdId: household.id,
          firstName: { equals: residentFirstName, mode: 'insensitive' },
          lastName: { equals: residentLastName, mode: 'insensitive' },
          isArchived: false,
        },
        select: { id: true },
      });

      if (!existingHeadResident) {
        await prisma.resident.create({
          data: {
            firstName: residentFirstName || 'Unknown',
            middleName: residentMiddleName || null,
            lastName: residentLastName || 'Unknown',
            suffix: null,
            // Fallback values; can be updated later from Residents page
            dateOfBirth: new Date('1970-01-01'),
            sex: 'UNKNOWN',
            civilStatus: 'SINGLE',
            barangay: assignedBarangay,
            address: finalAddress,
            contactNo: 'N/A',
            residencyStatus: 'RESIDENT',
            householdId: household.id,
          },
        });
        headResidentCreated = true;
      }
    }

    await createAuditLog(
      req.user!.id,
      'CREATE',
      'HOUSEHOLD',
      household.id,
      { action: 'Created household', householdNumber, headResidentCreated },
      req
    );

    res.status(201).json(household);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateHousehold = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;
    const updateData: any = { ...req.body };

    if (updateData.latitude) updateData.latitude = parseFloat(updateData.latitude);
    if (updateData.longitude) updateData.longitude = parseFloat(updateData.longitude);
    if (updateData.income) updateData.income = parseFloat(updateData.income);
    if (updateData.numberOfFamilyMembers) updateData.numberOfFamilyMembers = parseInt(updateData.numberOfFamilyMembers);
    if (updateData.yearFirstResided) updateData.yearFirstResided = parseInt(updateData.yearFirstResided);
    if (updateData.householdSize) updateData.householdSize = parseInt(updateData.householdSize);

    const oldHousehold = await prisma.household.findUnique({ where: { id } });
    
    if (!oldHousehold) {
      return res.status(404).json({ message: 'Household not found' });
    }

    if (user.role !== 'ADMIN') {
      if (oldHousehold.barangay !== user.barangay) {
        return res.status(403).json({ message: 'You can only update households from your barangay' });
      }
      delete updateData.barangay;
    }

    const household = await prisma.household.update({
      where: { id },
      data: updateData,
      include: {
        residents: true
      }
    });

    await createAuditLog(
      req.user!.id,
      'UPDATE',
      'HOUSEHOLD',
      household.id,
      { 
        action: 'Updated household',
        changes: { old: oldHousehold, new: household }
      },
      req
    );

    res.json(household);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteHousehold = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const existingHousehold = await prisma.household.findUnique({
      where: { id },
      select: { id: true, barangay: true }
    });

    if (!existingHousehold) {
      return res.status(404).json({ message: 'Household not found' });
    }

    if (user.role !== 'ADMIN' && existingHousehold.barangay !== user.barangay) {
      return res.status(403).json({ message: 'You can only delete households from your barangay' });
    }

    await prisma.household.delete({
      where: { id }
    });

    await createAuditLog(
      req.user!.id,
      'DELETE',
      'HOUSEHOLD',
      id,
      { action: 'Deleted household' },
      req
    );

    res.json({ message: 'Household deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};



