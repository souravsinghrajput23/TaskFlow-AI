import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db';
import { AuthRequest } from '../middleware/auth';
import { registerSchema, loginSchema, updateProfileSchema } from '../utils/validators';

const JWT_SECRET = process.env.JWT_SECRET || 'taskflow-dev-secret-key-12345';
const JWT_EXPIRES_IN = '7d';

const generateToken = (payload: { id: string; email: string; role: string; name: string }) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const register = async (req: AuthRequest, res: Response) => {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ message: 'Validation failed', errors: parseResult.error.errors });
    }

    const { name, email, password, role } = parseResult.data;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user. If it's the very first user in the database, make them an ADMIN.
    const userCount = await prisma.user.count();
    const resolvedRole = userCount === 0 ? 'ADMIN' : (role || 'MEMBER');

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: resolvedRole as any,
      },
    });

    const token = generateToken({ id: user.id, email: user.email, role: user.role, name: user.name });

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        photoUrl: user.photoUrl,
      },
    });
  } catch (error: any) {
    console.error('Register error:', error);
    return res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};

export const login = async (req: AuthRequest, res: Response) => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ message: 'Validation failed', errors: parseResult.error.errors });
    }

    const { email, password } = parseResult.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = generateToken({ id: user.id, email: user.email, role: user.role, name: user.name });

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        photoUrl: user.photoUrl,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        photoUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json(user);
  } catch (error: any) {
    console.error('Get profile error:', error);
    return res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const parseResult = updateProfileSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ message: 'Validation failed', errors: parseResult.error.errors });
    }

    const { name, email, photoUrl, password } = parseResult.data;
    const dataToUpdate: any = {};

    if (name) dataToUpdate.name = name;
    if (email) {
      // Check if email taken by another user
      const duplicateUser = await prisma.user.findFirst({
        where: {
          email,
          id: { not: req.user.id },
        },
      });
      if (duplicateUser) {
        return res.status(400).json({ message: 'Email is already taken by another account' });
      }
      dataToUpdate.email = email;
    }
    if (photoUrl !== undefined) dataToUpdate.photoUrl = photoUrl;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      dataToUpdate.passwordHash = await bcrypt.hash(password, salt);
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: dataToUpdate,
    });

    return res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        photoUrl: updatedUser.photoUrl,
      },
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    return res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};
