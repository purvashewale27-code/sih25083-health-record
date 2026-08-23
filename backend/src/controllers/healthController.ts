import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

export const getHealthStatus = async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      success: true,
      message: 'Backend is running',
      database: 'Connected',
    });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({
      success: false,
      message: 'Backend is running, but database connection failed',
      dbError: err.message,
    });
  }
};
