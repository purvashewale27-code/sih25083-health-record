import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';

export const getPatients = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patients = await prisma.patient.findMany({
      orderBy: { healthId: 'asc' },
    });
    res.json({
      success: true,
      data: patients,
    });
  } catch (error) {
    next(error);
  }
};

export const getPatientById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        allergies: true,
        followUps: true,
        visits: {
          orderBy: { visitDate: 'desc' },
          include: {
            doctor: { select: { id: true, name: true, role: true } },
            facility: { select: { id: true, name: true, type: true, district: true } },
            prescriptions: true,
          },
        },
        labReports: {
          orderBy: { reportDate: 'desc' },
        },
      },
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient not found',
      });
    }

    res.json({
      success: true,
      data: patient,
    });
  } catch (error) {
    next(error);
  }
};

export const createPatient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      healthId,
      fullName,
      dateOfBirth,
      gender,
      phone,
      stateOfOrigin,
      currentDistrict,
      preferredLanguage,
      emergencyContactName,
      emergencyContactPhone,
    } = req.body;

    if (!healthId || !fullName || !dateOfBirth || !gender || !stateOfOrigin || !currentDistrict || !preferredLanguage) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: healthId, fullName, dateOfBirth, gender, stateOfOrigin, currentDistrict, preferredLanguage are required.',
      });
    }

    const parsedDob = new Date(dateOfBirth);
    if (isNaN(parsedDob.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format for dateOfBirth. Use YYYY-MM-DD format.',
      });
    }

    const newPatient = await prisma.patient.create({
      data: {
        healthId: String(healthId),
        fullName: String(fullName),
        dateOfBirth: parsedDob,
        gender: String(gender),
        phone: phone ? String(phone) : null,
        stateOfOrigin: String(stateOfOrigin),
        currentDistrict: String(currentDistrict),
        preferredLanguage: String(preferredLanguage),
        emergencyContactName: emergencyContactName ? String(emergencyContactName) : null,
        emergencyContactPhone: emergencyContactPhone ? String(emergencyContactPhone) : null,
      },
    });

    res.status(201).json({
      success: true,
      data: newPatient,
    });
  } catch (error) {
    next(error);
  }
};

export const updatePatient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const {
      fullName,
      dateOfBirth,
      gender,
      phone,
      stateOfOrigin,
      currentDistrict,
      preferredLanguage,
      emergencyContactName,
      emergencyContactPhone,
    } = req.body;

    const existing = await prisma.patient.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Patient not found',
      });
    }

    const updateData: Record<string, unknown> = {};
    if (fullName !== undefined) updateData.fullName = String(fullName);
    if (gender !== undefined) updateData.gender = String(gender);
    if (phone !== undefined) updateData.phone = phone ? String(phone) : null;
    if (stateOfOrigin !== undefined) updateData.stateOfOrigin = String(stateOfOrigin);
    if (currentDistrict !== undefined) updateData.currentDistrict = String(currentDistrict);
    if (preferredLanguage !== undefined) updateData.preferredLanguage = String(preferredLanguage);
    if (emergencyContactName !== undefined) updateData.emergencyContactName = emergencyContactName ? String(emergencyContactName) : null;
    if (emergencyContactPhone !== undefined) updateData.emergencyContactPhone = emergencyContactPhone ? String(emergencyContactPhone) : null;

    if (dateOfBirth) {
      const parsedDob = new Date(dateOfBirth);
      if (isNaN(parsedDob.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid date format for dateOfBirth.',
        });
      }
      updateData.dateOfBirth = parsedDob;
    }

    const updatedPatient = await prisma.patient.update({
      where: { id },
      data: updateData,
    });

    res.json({
      success: true,
      data: updatedPatient,
    });
  } catch (error) {
    next(error);
  }
};

export const deletePatient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const existing = await prisma.patient.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Patient not found',
      });
    }

    await prisma.patient.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Patient record deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
