import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { UserRole } from '@prisma/client';

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, role } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, email, and role are required.',
      });
    }

    if (!Object.values(UserRole).includes(role)) {
      return res.status(400).json({
        success: false,
        error: `Invalid role. Allowed values: ${Object.values(UserRole).join(', ')}`,
      });
    }

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        role,
      },
    });

    res.status(201).json({
      success: true,
      data: newUser,
    });
  } catch (error) {
    next(error);
  }
};
