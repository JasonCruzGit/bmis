import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, createAuditLog } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

export const login = async (req: Request, res: Response) => {
  console.log('[LOGIN] Request received');
  try {
    console.log('[LOGIN] Parsing body...');
    const { email, password } = req.body;
    console.log('[LOGIN] Email:', email);

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        firstName: true,
        lastName: true,
        role: true,
        barangay: true,
        isActive: true
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not configured');
    }

    const expiresInEnv = process.env.JWT_EXPIRES_IN ?? '7d';
    const expiresIn: SignOptions['expiresIn'] =
      /^\d+$/.test(expiresInEnv) ? Number(expiresInEnv) : (expiresInEnv as SignOptions['expiresIn']);

    const signOptions: SignOptions = {
      expiresIn,
    };

    // Include barangay in token (can be null for ADMIN users)
    const tokenPayload: any = {
      userId: user.id,
      email: user.email,
      role: user.role
    };
    
    // Only include barangay if it's not null
    if (user.barangay) {
      tokenPayload.barangay = user.barangay;
    }

    const token = jwt.sign(tokenPayload, jwtSecret, signOptions);

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        barangay: user.barangay
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    if (!res.headersSent) {
      return res.status(500).json({ message: error.message || 'Internal server error' });
    }
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: role || 'STAFF'
      }
    });

    await createAuditLog(user.id, 'REGISTER', 'USER', user.id, null, req);

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        barangay: true,
        isActive: true,
        lastLogin: true
      }
    });

    res.json(user);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new passwords are required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    await createAuditLog(user.id, 'CHANGE_PASSWORD', 'USER', user.id, null, req);

    res.json({ message: 'Password changed successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};



