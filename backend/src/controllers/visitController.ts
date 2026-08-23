import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';

export const getVisits = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const visits = await prisma.visit.findMany({
      orderBy: { visitDate: 'desc' },
      include: {
        patient: { select: { id: true, healthId: true, fullName: true, createdAt: true } },
        doctor: { select: { id: true, name: true, role: true } },
        facility: { select: { id: true, name: true, type: true, district: true } },
        prescriptions: true,
      },
    });
    res.json({
      success: true,
      data: visits,
    });
  } catch (error) {
    next(error);
  }
};

export const getVisitById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const visit = await prisma.visit.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: { select: { id: true, name: true, role: true, email: true } },
        facility: true,
        prescriptions: true,
        labReports: true,
      },
    });

    if (!visit) {
      return res.status(404).json({
        success: false,
        error: 'Visit record not found',
      });
    }

    res.json({
      success: true,
      data: visit,
    });
  } catch (error) {
    next(error);
  }
};

export const createVisit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      patientId,
      doctorId,
      facilityId,
      chiefComplaint,
      diagnosis,
      bloodPressure,
      temperature,
      pulse,
      weight,
      doctorNotes,
    } = req.body;

    if (!patientId || !doctorId || !facilityId || !chiefComplaint) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: patientId, doctorId, facilityId, and chiefComplaint are required.',
      });
    }

    const patientExists = await prisma.patient.findUnique({ where: { id: String(patientId) } });
    if (!patientExists) {
      return res.status(404).json({ success: false, error: 'Patient does not exist.' });
    }

    const doctorExists = await prisma.user.findUnique({ where: { id: String(doctorId) } });
    if (!doctorExists) {
      return res.status(404).json({ success: false, error: 'Doctor/User does not exist.' });
    }

    const facilityExists = await prisma.healthcareFacility.findUnique({ where: { id: String(facilityId) } });
    if (!facilityExists) {
      return res.status(404).json({ success: false, error: 'Healthcare Facility does not exist.' });
    }

    const newVisit = await prisma.visit.create({
      data: {
        patientId: String(patientId),
        doctorId: String(doctorId),
        facilityId: String(facilityId),
        chiefComplaint: String(chiefComplaint),
        diagnosis: diagnosis ? String(diagnosis) : null,
        bloodPressure: bloodPressure ? String(bloodPressure) : null,
        temperature: temperature ? String(temperature) : null,
        pulse: pulse ? String(pulse) : null,
        weight: weight ? String(weight) : null,
        doctorNotes: doctorNotes ? String(doctorNotes) : null,
      },
      include: {
        patient: { select: { id: true, healthId: true, fullName: true, createdAt: true } },
        doctor: { select: { id: true, name: true, role: true } },
        facility: { select: { id: true, name: true, type: true, district: true } },
        prescriptions: true,
      },
    });

    res.status(201).json({
      success: true,
      data: newVisit,
    });
  } catch (error) {
    next(error);
  }
};
