import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { Severity } from '@prisma/client';

export const getPatientAllergies = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patientId = req.params.patientId as string;

    const patientExists = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patientExists) {
      return res.status(404).json({
        success: false,
        error: 'Patient not found',
      });
    }

    const allergies = await prisma.allergy.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: allergies,
    });
  } catch (error) {
    next(error);
  }
};

export const createPatientAllergy = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patientId = req.params.patientId as string;
    const { allergen, severity } = req.body;

    if (!allergen || !severity) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: allergen and severity are required.',
      });
    }

    if (!Object.values(Severity).includes(severity)) {
      return res.status(400).json({
        success: false,
        error: `Invalid severity level. Allowed values: ${Object.values(Severity).join(', ')}`,
      });
    }

    const patientExists = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patientExists) {
      return res.status(404).json({
        success: false,
        error: 'Patient not found',
      });
    }

    const newAllergy = await prisma.allergy.create({
      data: {
        patientId,
        allergen: String(allergen),
        severity: severity as Severity,
      },
    });

    res.status(201).json({
      success: true,
      data: newAllergy,
    });
  } catch (error) {
    next(error);
  }
};
