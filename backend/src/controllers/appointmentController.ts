import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { AppointmentStatus, Severity } from '@prisma/client';

export const getAppointments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { doctorId, patientId, facilityId, date } = req.query;

    const whereClause: Record<string, unknown> = {};
    if (doctorId) whereClause.doctorId = String(doctorId);
    if (patientId) whereClause.patientId = String(patientId);
    if (facilityId) whereClause.facilityId = String(facilityId);
    if (date) {
      const targetDate = new Date(String(date));
      if (!isNaN(targetDate.getTime())) {
        const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
        whereClause.appointmentDate = {
          gte: startOfDay,
          lte: endOfDay,
        };
      }
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        patient: {
          select: {
            id: true,
            healthId: true,
            fullName: true,
            phone: true,
            preferredLanguage: true,
            insuranceScheme: true,
            currentDistrict: true,
          },
        },
        doctor: {
          select: {
            id: true,
            name: true,
            role: true,
            specialization: true,
            consultationFee: true,
          },
        },
        facility: {
          select: {
            id: true,
            name: true,
            type: true,
            district: true,
          },
        },
        payments: true,
      },
      orderBy: [{ appointmentDate: 'asc' }, { slotTime: 'asc' }],
    });

    res.json({
      success: true,
      data: appointments,
    });
  } catch (error) {
    next(error);
  }
};

export const getAvailableSlots = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { doctorId, facilityId, date } = req.query;

    if (!doctorId || !date) {
      return res.status(400).json({
        success: false,
        error: 'doctorId and date (YYYY-MM-DD) are required query parameters.',
      });
    }

    const targetDate = new Date(String(date));
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date provided.',
      });
    }

    const dayOfWeek = targetDate.getDay(); // 0 = Sunday

    // Get doctor availability rule for that day
    const availabilityWhere: Record<string, unknown> = {
      doctorId: String(doctorId),
      dayOfWeek: dayOfWeek,
    };
    if (facilityId) availabilityWhere.facilityId = String(facilityId);

    const availabilities = await prisma.doctorAvailability.findMany({
      where: availabilityWhere,
      include: { facility: true },
    });

    // Generate standard 20-minute slots if no specific rule is configured, or use configured slots
    const standardSlots = [
      '09:00', '09:20', '09:40', '10:00', '10:20', '10:40',
      '11:00', '11:20', '11:40', '12:00', '14:00', '14:20',
      '14:40', '15:00', '15:20', '15:40', '16:00'
    ];

    // Find all currently booked appointments on that day for this doctor
    const startOfDay = new Date(new Date(targetDate).setHours(0, 0, 0, 0));
    const endOfDay = new Date(new Date(targetDate).setHours(23, 59, 59, 999));

    const bookedAppointments = await prisma.appointment.findMany({
      where: {
        doctorId: String(doctorId),
        appointmentDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          notIn: [AppointmentStatus.CANCELLED],
        },
      },
      select: {
        slotTime: true,
        appointmentNumber: true,
      },
    });

    const bookedSlotTimes = new Set(bookedAppointments.map((a) => a.slotTime));

    const slots = standardSlots.map((slot) => ({
      slotTime: slot,
      isAvailable: !bookedSlotTimes.has(slot),
    }));

    res.json({
      success: true,
      data: {
        date: String(date),
        dayOfWeek,
        doctorId,
        availabilities,
        slots,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createAppointment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      patientId,
      doctorId,
      facilityId,
      appointmentDate,
      slotTime,
      reason,
      priority,
      notes,
    } = req.body;

    if (!patientId || !doctorId || !facilityId || !appointmentDate || !slotTime || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: patientId, doctorId, facilityId, appointmentDate, slotTime, reason are required.',
      });
    }

    const parsedDate = new Date(appointmentDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid appointmentDate format.',
      });
    }

    const startOfDay = new Date(new Date(parsedDate).setHours(0, 0, 0, 0));
    const endOfDay = new Date(new Date(parsedDate).setHours(23, 59, 59, 999));

    // Double-Booking Lock using transaction
    const newAppointment = await prisma.$transaction(async (tx) => {
      const existing = await tx.appointment.findFirst({
        where: {
          doctorId: String(doctorId),
          appointmentDate: {
            gte: startOfDay,
            lte: endOfDay,
          },
          slotTime: String(slotTime),
          status: { notIn: [AppointmentStatus.CANCELLED] },
        },
      });

      if (existing) {
        throw new Error('SLOT_ALREADY_BOOKED');
      }

      // Generate sequential appointment number (APT-2026-XXXXX)
      const count = await tx.appointment.count();
      const numStr = String(count + 1).padStart(5, '0');
      const appointmentNumber = `APT-2026-${numStr}`;

      return tx.appointment.create({
        data: {
          appointmentNumber,
          patientId: String(patientId),
          doctorId: String(doctorId),
          facilityId: String(facilityId),
          appointmentDate: parsedDate,
          slotTime: String(slotTime),
          reason: String(reason),
          priority: (priority as Severity) || Severity.MEDIUM,
          notes: notes ? String(notes) : null,
          status: AppointmentStatus.SCHEDULED,
        },
        include: {
          patient: true,
          doctor: true,
          facility: true,
        },
      });
    });

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      data: newAppointment,
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'SLOT_ALREADY_BOOKED') {
      return res.status(409).json({
        success: false,
        error: 'This appointment slot has already been booked for this doctor. Please choose a different slot.',
      });
    }
    next(error);
  }
};

export const updateAppointmentStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { status, notes } = req.body;

    const existing = await prisma.appointment.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found',
      });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        status: status as AppointmentStatus,
        notes: notes !== undefined ? String(notes) : existing.notes,
      },
    });

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};
