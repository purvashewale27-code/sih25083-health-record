import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';

/**
 * Standard ICD-10 and Clinical Symptom Rule-Based Diagnostic Triage Mapping
 * Maps patient chief complaints to appropriate clinical department & doctor specialization.
 */
interface SpecializationMatch {
  specialization: string;
  departmentName: string;
  reasoning: string;
  confidenceScore: number;
}

export const triageSymptomToSpecialization = (query: string): SpecializationMatch => {
  const q = query.toLowerCase();

  // Respiratory & Pulmonary
  if (
    q.includes('cough') ||
    q.includes('sawdust') ||
    q.includes('chest') ||
    q.includes('breath') ||
    q.includes('wheez') ||
    q.includes('asthma') ||
    q.includes('bronchitis') ||
    q.includes('tb') ||
    q.includes('tuberculosis')
  ) {
    return {
      specialization: 'PULMONOLOGY',
      departmentName: 'Chest Medicine & Pulmonology',
      reasoning: 'Symptoms indicate occupational respiratory irritation, chronic cough, or bronchial inflammation.',
      confidenceScore: 0.95,
    };
  }

  // Dermatology & Occupational Skin Rashes
  if (
    q.includes('rash') ||
    q.includes('itch') ||
    q.includes('skin') ||
    q.includes('dermatitis') ||
    q.includes('resin') ||
    q.includes('chemical') ||
    q.includes('fungal') ||
    q.includes('lesion')
  ) {
    return {
      specialization: 'DERMATOLOGY',
      departmentName: 'Dermatology & Occupational Skin Care',
      reasoning: 'Erythematous rashes or chemical resin contact exposure requires dermatological evaluation.',
      confidenceScore: 0.92,
    };
  }

  // Infectious Disease & Febrile Surveillance
  if (
    q.includes('dengue') ||
    q.includes('malaria') ||
    q.includes('fever') ||
    q.includes('chills') ||
    q.includes('diarrhea') ||
    q.includes('vomit') ||
    q.includes('cholera') ||
    q.includes('jaundice') ||
    q.includes('stomach') ||
    q.includes('water')
  ) {
    return {
      specialization: 'INFECTIOUS_DISEASE',
      departmentName: 'Infectious Diseases & Epidemic Surveillance',
      reasoning: 'Acute febrile illness or waterborne gastrointestinal symptoms require infectious disease screening.',
      confidenceScore: 0.94,
    };
  }

  // Orthopedics & Industrial Trauma
  if (
    q.includes('pain') ||
    q.includes('bone') ||
    q.includes('joint') ||
    q.includes('fall') ||
    q.includes('injury') ||
    q.includes('fracture') ||
    q.includes('back') ||
    q.includes('muscle') ||
    q.includes('strain')
  ) {
    return {
      specialization: 'ORTHOPEDICS',
      departmentName: 'Orthopedics & Physical Trauma',
      reasoning: 'Musculoskeletal strain, mechanical work injury, or joint pain assessment.',
      confidenceScore: 0.88,
    };
  }

  // Default: General Medicine
  return {
    specialization: 'GENERAL_MEDICINE',
    departmentName: 'General Medicine & Primary Triage',
    reasoning: 'Comprehensive general clinical evaluation and multi-system medical examination.',
    confidenceScore: 0.85,
  };
};

export const recommendDoctors = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { complaint, district } = req.body;

    if (!complaint || typeof complaint !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid chief complaint or symptoms description.',
      });
    }

    const triage = triageSymptomToSpecialization(complaint);

    // Find doctors matching the specialized field, plus general medicine fallback
    const doctors = await prisma.user.findMany({
      where: {
        role: 'DOCTOR',
        OR: [
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          { specialization: triage.specialization as any },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          { specialization: 'GENERAL_MEDICINE' as any },
          { specialization: null },
        ],
      },
      include: {
        availabilities: {
          include: {
            facility: true,
          },
        },
      },
    });

    // Score and rank doctors based on district matching and specialization
    const rankedDoctors = doctors.map((doc) => {
      const isExactSpecialist = doc.specialization === triage.specialization;
      const worksInDistrict = district
        ? doc.availabilities.some((a) => a.facility.district.toLowerCase() === String(district).toLowerCase())
        : true;

      let score = isExactSpecialist ? 100 : 50;
      if (worksInDistrict) score += 30;

      return {
        id: doc.id,
        name: doc.name,
        email: doc.email,
        specialization: doc.specialization || 'GENERAL_MEDICINE',
        consultationFee: doc.consultationFee,
        score,
        isExactSpecialist,
        worksInDistrict,
        facilities: doc.availabilities.map((a) => ({
          facilityId: a.facility.id,
          facilityName: a.facility.name,
          district: a.facility.district,
          dayOfWeek: a.dayOfWeek,
          startTime: a.startTime,
          endTime: a.endTime,
        })),
      };
    });

    rankedDoctors.sort((a, b) => b.score - a.score);

    res.json({
      success: true,
      data: {
        triageResult: triage,
        recommendedSpecialization: triage.specialization,
        department: triage.departmentName,
        reasoning: triage.reasoning,
        doctors: rankedDoctors,
      },
    });
  } catch (error) {
    next(error);
  }
};
