import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { FacilityType } from '@prisma/client';

export const getFacilities = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const facilities = await prisma.healthcareFacility.findMany({
      orderBy: { name: 'asc' },
    });
    res.json({
      success: true,
      data: facilities,
    });
  } catch (error) {
    next(error);
  }
};

export const createFacility = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, type, district } = req.body;

    if (!name || !type || !district) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, type, and district are required.',
      });
    }

    if (!Object.values(FacilityType).includes(type)) {
      return res.status(400).json({
        success: false,
        error: `Invalid facility type. Allowed values: ${Object.values(FacilityType).join(', ')}`,
      });
    }

    const newFacility = await prisma.healthcareFacility.create({
      data: {
        name,
        type,
        district,
      },
    });

    res.status(201).json({
      success: true,
      data: newFacility,
    });
  } catch (error) {
    next(error);
  }
};
