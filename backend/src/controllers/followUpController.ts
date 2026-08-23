import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';

export const getFollowUps = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const followUps = await prisma.followUp.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json({
      success: true,
      data: followUps,
    });
  } catch (error) {
    next(error);
  }
};

export const updateFollowUpStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const followUpId = req.params.followUpId as string;
    const { patientId, status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status field is required (PENDING, IN_PROGRESS, COMPLETED).',
      });
    }

    const completedAt = status === 'COMPLETED' ? new Date() : null;

    const followUp = await prisma.followUp.upsert({
      where: { followUpId },
      update: {
        status: String(status),
        completedAt,
      },
      create: {
        followUpId: String(followUpId),
        patientId: patientId ? String(patientId) : 'unknown',
        status: String(status),
        completedAt,
      },
    });

    res.json({
      success: true,
      data: followUp,
    });
  } catch (error) {
    next(error);
  }
};
