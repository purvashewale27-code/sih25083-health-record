import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';

export const getPrescriptions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { visitId } = req.query;

    const prescriptions = await prisma.prescription.findMany({
      where: visitId ? { visitId: String(visitId) } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        visit: {
          select: {
            id: true,
            visitDate: true,
            patient: { select: { id: true, fullName: true, healthId: true } },
          },
        },
      },
    });

    res.json({
      success: true,
      data: prescriptions,
    });
  } catch (error) {
    next(error);
  }
};

export const createPrescription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { visitId, medicineName, dosage, frequency, duration } = req.body;

    if (!visitId || !medicineName || !dosage || !frequency || !duration) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: visitId, medicineName, dosage, frequency, and duration are required.',
      });
    }

    const visitExists = await prisma.visit.findUnique({ where: { id: String(visitId) } });
    if (!visitExists) {
      return res.status(404).json({
        success: false,
        error: 'Visit record not found.',
      });
    }

    const newPrescription = await prisma.prescription.create({
      data: {
        visitId: String(visitId),
        medicineName: String(medicineName),
        dosage: String(dosage),
        frequency: String(frequency),
        duration: String(duration),
      },
    });

    res.status(201).json({
      success: true,
      data: newPrescription,
    });
  } catch (error) {
    next(error);
  }
};
