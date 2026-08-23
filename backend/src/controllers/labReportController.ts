import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';

export const getPatientLabReports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patientId = req.params.patientId as string;

    const patientExists = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patientExists) {
      return res.status(404).json({
        success: false,
        error: 'Patient not found',
      });
    }

    const labReports = await prisma.labReport.findMany({
      where: { patientId },
      orderBy: { reportDate: 'desc' },
    });

    res.json({
      success: true,
      data: labReports,
    });
  } catch (error) {
    next(error);
  }
};

export const createPatientLabReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patientId = req.params.patientId as string;
    const { testName, result, reportDate, visitId } = req.body;

    if (!testName || !result) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: testName and result are required.',
      });
    }

    const patientExists = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patientExists) {
      return res.status(404).json({
        success: false,
        error: 'Patient not found',
      });
    }

    if (visitId) {
      const visitExists = await prisma.visit.findUnique({ where: { id: String(visitId) } });
      if (!visitExists) {
        return res.status(404).json({
          success: false,
          error: 'Specified visit record not found',
        });
      }
    }

    const parsedDate = reportDate ? new Date(reportDate) : new Date();

    const newLabReport = await prisma.labReport.create({
      data: {
        patientId,
        testName: String(testName),
        result: String(result),
        reportDate: parsedDate,
        visitId: visitId ? String(visitId) : null,
      },
    });

    res.status(201).json({
      success: true,
      data: newLabReport,
    });
  } catch (error) {
    next(error);
  }
};
