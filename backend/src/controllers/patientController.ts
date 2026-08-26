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
        appointments: {
          orderBy: { appointmentDate: 'desc' },
          include: {
            doctor: { select: { id: true, name: true, role: true, specialization: true } },
            facility: { select: { id: true, name: true, type: true, district: true } },
            payments: true,
          },
        },
        visits: {
          orderBy: { visitDate: 'desc' },
          include: {
            doctor: { select: { id: true, name: true, role: true, specialization: true } },
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

export const verifyPatientByHealthId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const healthIdParam = (req.params.healthId as string) || '';
    const rawInput = decodeURIComponent(healthIdParam).trim();

    if (!rawInput) {
      return res.status(400).json({
        success: false,
        error: 'Health ID is required for verification.',
      });
    }

    // Support direct healthId match (e.g. KMH-2026-00001 or MIG-2025-0001) or UUID or URL query format
    let patient = await prisma.patient.findUnique({
      where: { healthId: rawInput },
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
      },
    });

    // If not found directly, extract trailing digits if KMH format
    if (!patient) {
      const match = rawInput.match(/\d+$/);
      if (match) {
        const numPart = match[0];
        const allPatients = await prisma.patient.findMany({
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
          },
        });
        const matched = allPatients.find((p) => p.healthId.endsWith(numPart));
        if (matched) {
          patient = matched;
        }
      }
    }

    if (!patient) {
      return res.status(404).json({
        success: false,
        error: `No registered migrant health record matching ID "${rawInput}" was found.`,
      });
    }

    res.json({
      success: true,
      message: 'Official Health Record Verified',
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
      insuranceScheme,
      insuranceCardNumber,
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
        insuranceScheme: insuranceScheme ? String(insuranceScheme) : null,
        insuranceCardNumber: insuranceCardNumber ? String(insuranceCardNumber) : null,
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
      insuranceScheme,
      insuranceCardNumber,
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
    if (insuranceScheme !== undefined) updateData.insuranceScheme = insuranceScheme ? String(insuranceScheme) : null;
    if (insuranceCardNumber !== undefined) updateData.insuranceCardNumber = insuranceCardNumber ? String(insuranceCardNumber) : null;

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
