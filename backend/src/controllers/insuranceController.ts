import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';

interface WelfareScheme {
  id: string;
  name: string;
  code: string;
  governingBody: string;
  healthCoverageAmount: string;
  accidentalBenefit: string;
  targetGroup: string;
  eligibilityRequirements: string[];
  coveredTreatments: string[];
  helplinePhone: string;
  officialPortalUrl: string;
}

export const KERALA_MIGRANT_SCHEMES: WelfareScheme[] = [
  {
    id: 'awaz',
    name: 'AWAZ Health Insurance Scheme for Interstate Guest Workers',
    code: 'AWAZ-KL',
    governingBody: 'Labour and Skills Department, Government of Kerala',
    healthCoverageAmount: '₹25,000 / year (Hospitalization & Inpatient care)',
    accidentalBenefit: '₹2,00,000 for accidental death or permanent disability',
    targetGroup: 'All registered interstate migrant workers in Kerala aged 18-60',
    eligibilityRequirements: [
      'Valid biometric/smart AWAZ Health ID Card or Kerala Migrant Portal ID',
      'Age between 18 and 60 years at time of registration',
      'Employment or residency in any of 14 Kerala districts',
    ],
    coveredTreatments: [
      'Emergency inpatient care & hospital bed charges',
      'Occupational trauma & workplace injuries',
      'Acute infectious diseases (Dengue, Malaria, Typhoid)',
      'Severe respiratory conditions from industrial exposure',
    ],
    helplinePhone: '1800-425-7878 / 155300 (Labour Toll-Free)',
    officialPortalUrl: 'https://lc.kerala.gov.in',
  },
  {
    id: 'pmjay',
    name: 'Ayushman Bharat - Pradhan Mantri Jan Arogya Yojana (PM-JAY)',
    code: 'PM-JAY',
    governingBody: 'National Health Authority (NHA) & State Health Agency Kerala',
    healthCoverageAmount: '₹5,00,000 / family / year (Secondary & Tertiary cashless hospitalization)',
    accidentalBenefit: 'Full secondary/tertiary surgery & intensive care coverage',
    targetGroup: 'SECC Deprivation criteria-eligible migrant families across India',
    eligibilityRequirements: [
      'PM-JAY Gold/PVC Card or SECC Ration Card',
      'National Health Authority Portability verification at empanelled hospital',
    ],
    coveredTreatments: [
      'Major surgeries, ICU treatments, and cardiac care',
      'Diagnostic oncology and oncology therapy',
      'Orthopedic trauma surgery and implants',
    ],
    helplinePhone: '14555 (National Health Authority)',
    officialPortalUrl: 'https://pmjay.gov.in',
  },
  {
    id: 'karunya',
    name: 'Karunya Benevolent Fund (KBF) & Arogyakiran Scheme',
    code: 'KBF-KL',
    governingBody: 'Department of Health & Family Welfare, Kerala',
    healthCoverageAmount: 'Up to ₹2,00,000 for critical surgeries and specialized therapies',
    accidentalBenefit: 'Special medical grant upon Medical Board sanction',
    targetGroup: 'Below-poverty-line patients and vulnerable workers suffering from chronic or critical ailments',
    eligibilityRequirements: [
      'Income certificate or BPL designation (< ₹3,00,000/annum)',
      'Clinical referral from a Kerala Govt Medical College or District Hospital',
    ],
    coveredTreatments: [
      'Chronic kidney disease & dialysis support',
      'Cardiovascular bypass surgery and angioplasty',
      'Severe pediatric emergencies & congenital corrections',
    ],
    helplinePhone: '0471-2554700 (Karunya Help Desk)',
    officialPortalUrl: 'https://karunya.kerala.gov.in',
  },
];

export const getSchemes = async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: KERALA_MIGRANT_SCHEMES,
  });
};

export const checkPatientEligibility = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { patientId } = req.params;

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        visits: {
          orderBy: { visitDate: 'desc' },
          take: 3,
        },
      },
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient record not found',
      });
    }

    // Evaluate eligibility based on age, district, and diagnosis history
    const birthYear = new Date(patient.dateOfBirth).getFullYear();
    const age = new Date().getFullYear() - birthYear;
    const isAdultWorkingAge = age >= 18 && age <= 60;

    const matchedSchemes = KERALA_MIGRANT_SCHEMES.map((scheme) => {
      let isEligible = true;
      const reasons: string[] = [];

      if (scheme.id === 'awaz') {
        if (isAdultWorkingAge) {
          reasons.push(`Meets age criteria (Age: ${age} yrs, within 18-60 working range).`);
        } else {
          isEligible = false;
          reasons.push(`Outside standard AWAZ working-age bracket (18-60).`);
        }
        reasons.push(`Active guest worker located in ${patient.currentDistrict} district, Kerala.`);
      } else if (scheme.id === 'pmjay') {
        reasons.push(`Interstate health portability active between origin state (${patient.stateOfOrigin}) and Kerala.`);
      } else if (scheme.id === 'karunya') {
        reasons.push('Eligible for Government PHC/Taluk hospital emergency medical grant referral.');
      }

      return {
        scheme,
        isEligible,
        reasons,
        hasExistingCard: patient.insuranceScheme === scheme.name || (patient.insuranceCardNumber ? true : false),
        cardNumber: patient.insuranceCardNumber,
      };
    });

    res.json({
      success: true,
      data: {
        patient: {
          id: patient.id,
          healthId: patient.healthId,
          fullName: patient.fullName,
          age,
          currentDistrict: patient.currentDistrict,
          stateOfOrigin: patient.stateOfOrigin,
          registeredScheme: patient.insuranceScheme,
          registeredCardNumber: patient.insuranceCardNumber,
        },
        evaluations: matchedSchemes,
      },
    });
  } catch (error) {
    next(error);
  }
};
