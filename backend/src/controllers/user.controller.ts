import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, createAuditLog } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

// Get all users
export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '20', search = '' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search as string, mode: 'insensitive' } },
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          barangay: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Get single user
export const getUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Create user
export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, firstName, lastName, role, barangay, isActive } = req.body;

    if (!email || !password || !firstName || !lastName || !role) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    // Validate role
    const validRoles = ['ADMIN', 'BARANGAY_CHAIRMAN', 'BARANGAY_EVALUATOR', 'SECRETARY', 'CPDO', 'TREASURER', 'SK', 'STAFF'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role,
        barangay: barangay || null,
        isActive: isActive !== undefined ? isActive : true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Create audit log
    await createAuditLog(
      req.user!.id,
      'CREATE',
      'USER',
      user.id,
      { email, firstName, lastName, role },
      req
    );

    res.status(201).json({
      message: 'User created successfully',
      user,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Update user
export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { email, firstName, lastName, role, barangay, isActive, password } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent updating own role or status (unless admin)
    if (id === req.user!.id && (role !== existingUser.role || isActive !== existingUser.isActive)) {
      return res.status(400).json({ message: 'You cannot change your own role or status' });
    }

    const updateData: any = {};

    if (email && email !== existingUser.email) {
      // Check if new email already exists
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });

      if (emailExists) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      updateData.email = email;
    }

    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (role) {
      const validRoles = ['ADMIN', 'BARANGAY_CHAIRMAN', 'BARANGAY_EVALUATOR', 'SECRETARY', 'CPDO', 'TREASURER', 'SK', 'STAFF'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
      }
      updateData.role = role;
    }
    if (barangay !== undefined) updateData.barangay = barangay;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    // Create audit log
    await createAuditLog(
      req.user!.id,
      'UPDATE',
      'USER',
      user.id,
      updateData,
      req
    );

    res.json({
      message: 'User updated successfully',
      user,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Delete user (soft delete by setting isActive to false)
export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Prevent deleting own account
    if (id === req.user!.id) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Soft delete by setting isActive to false
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    // Create audit log
    await createAuditLog(
      req.user!.id,
      'DELETE',
      'USER',
      user.id,
      { email: user.email },
      req
    );

    res.json({ message: 'User deactivated successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

