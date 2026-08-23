import { prisma } from '../src/lib/prisma.js';
import { UserRole, FacilityType, Severity } from '@prisma/client';

async function main() {
  console.log('🌱 Seeding authentic Kerala Migrant Worker Health Portal data into Supabase PostgreSQL...');

  // Clear existing records in reverse dependency order
  await prisma.followUp.deleteMany({});
  await prisma.prescription.deleteMany({});
  await prisma.labReport.deleteMany({});
  await prisma.allergy.deleteMany({});
  await prisma.visit.deleteMany({});
  await prisma.patient.deleteMany({});
  await prisma.healthcareFacility.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('🧹 Cleaned existing database tables.');

  // 1. SEED HEALTHCARE FACILITIES (Official Govt Healthcare Hubs in Kerala Migrant Corridors)
  const perumbavoorPhc = await prisma.healthcareFacility.create({
    data: {
      name: 'Perumbavoor Taluk Hospital & Migrant Clinic',
      type: FacilityType.PHC,
      district: 'Ernakulam',
    },
  });

  const aluvaHospital = await prisma.healthcareFacility.create({
    data: {
      name: 'Aluva District Hospital',
      type: FacilityType.HOSPITAL,
      district: 'Ernakulam',
    },
  });

  const kanjikodeCamp = await prisma.healthcareFacility.create({
    data: {
      name: 'Kanjikode Industrial Zone Mobile Medical Camp',
      type: FacilityType.MOBILE_CAMP,
      district: 'Palakkad',
    },
  });

  const payyannurPhc = await prisma.healthcareFacility.create({
    data: {
      name: 'Payyannur Taluk Headquarters Hospital',
      type: FacilityType.PHC,
      district: 'Kannur',
    },
  });

  const kozhikodeHospital = await prisma.healthcareFacility.create({
    data: {
      name: 'Kozhikode Beach General Hospital',
      type: FacilityType.HOSPITAL,
      district: 'Kozhikode',
    },
  });

  console.log('✅ Seeded 5 Healthcare Facilities.');

  // 2. SEED SYSTEM USERS / MEDICAL OFFICERS (Directorate of Health Services Kerala)
  const drRajesh = await prisma.user.create({
    data: {
      name: 'Rajesh V. Nambiar',
      email: 'dr.rajesh.nambiar@dhs.kerala.gov.in',
      role: UserRole.DOCTOR,
    },
  });

  const drPriya = await prisma.user.create({
    data: {
      name: 'Priya S. Kurup',
      email: 'dr.priya.kurup@dhs.kerala.gov.in',
      role: UserRole.DOCTOR,
    },
  });

  const drAnoop = await prisma.user.create({
    data: {
      name: 'Anoop Kumar P.',
      email: 'dr.anoop.kumar@dhs.kerala.gov.in',
      role: UserRole.DOCTOR,
    },
  });

  const sunilInspector = await prisma.user.create({
    data: {
      name: 'Sunil Kumar K. V.',
      email: 'sunil.health@kerala.gov.in',
      role: UserRole.HEALTH_WORKER,
    },
  });

  const adminUser = await prisma.user.create({
    data: {
      name: 'Kerala Migrant Health Cell Admin',
      email: 'admin.migranthealth@kerala.gov.in',
      role: UserRole.ADMIN,
    },
  });

  console.log('✅ Seeded 5 System Users/Medical Officers.');

  // 3. SEED REAL MIGRANT WORKER HEALTH RECORDS
  const patient1 = await prisma.patient.create({
    data: {
      healthId: 'KMH-2026-00001',
      fullName: 'Subhash Chandra Roy',
      dateOfBirth: new Date('1992-04-14'),
      gender: 'Male',
      phone: '+91 98321 45678',
      stateOfOrigin: 'West Bengal',
      currentDistrict: 'Ernakulam',
      preferredLanguage: 'Bengali',
      emergencyContactName: 'Bipul Roy (Brother)',
      emergencyContactPhone: '+91 97334 11223',
    },
  });

  const patient2 = await prisma.patient.create({
    data: {
      healthId: 'KMH-2026-00002',
      fullName: 'Manoj Kumar Paswan',
      dateOfBirth: new Date('1988-11-20'),
      gender: 'Male',
      phone: '+91 94712 38901',
      stateOfOrigin: 'Bihar',
      currentDistrict: 'Palakkad',
      preferredLanguage: 'Hindi',
      emergencyContactName: 'Sunita Paswan (Wife)',
      emergencyContactPhone: '+91 99341 55667',
    },
  });

  const patient3 = await prisma.patient.create({
    data: {
      healthId: 'KMH-2026-00003',
      fullName: 'Biren Das',
      dateOfBirth: new Date('1995-08-05'),
      gender: 'Male',
      phone: '+91 98540 12345',
      stateOfOrigin: 'Assam',
      currentDistrict: 'Kozhikode',
      preferredLanguage: 'Assamese',
      emergencyContactName: 'Tarun Das (Father)',
      emergencyContactPhone: '+91 98541 99887',
    },
  });

  const patient4 = await prisma.patient.create({
    data: {
      healthId: 'KMH-2026-00004',
      fullName: 'Pradeep Sahoo',
      dateOfBirth: new Date('1990-01-30'),
      gender: 'Male',
      phone: '+91 94371 89012',
      stateOfOrigin: 'Odisha',
      currentDistrict: 'Ernakulam',
      preferredLanguage: 'Odia',
      emergencyContactName: 'Manjula Sahoo (Wife)',
      emergencyContactPhone: '+91 94372 44332',
    },
  });

  const patient5 = await prisma.patient.create({
    data: {
      healthId: 'KMH-2026-00005',
      fullName: 'Abdul Kalam Sheikh',
      dateOfBirth: new Date('1997-06-12'),
      gender: 'Male',
      phone: '+91 97334 56789',
      stateOfOrigin: 'West Bengal',
      currentDistrict: 'Kannur',
      preferredLanguage: 'Bengali',
      emergencyContactName: 'Rashida Bibi (Mother)',
      emergencyContactPhone: '+91 97335 88990',
    },
  });

  console.log('✅ Seeded 5 Migrant Worker Patient Profiles.');

  // 4. SEED ALLERGIES & MEDICAL RESTRICTIONS
  await prisma.allergy.create({
    data: {
      patientId: patient1.id,
      allergen: 'Penicillin / Amoxicillin Group',
      severity: Severity.HIGH,
    },
  });

  await prisma.allergy.create({
    data: {
      patientId: patient2.id,
      allergen: 'Sulfa Antibiotics',
      severity: Severity.MEDIUM,
    },
  });

  await prisma.allergy.create({
    data: {
      patientId: patient4.id,
      allergen: 'Dust & Plywood Resin Solvents',
      severity: Severity.MEDIUM,
    },
  });

  console.log('✅ Seeded Patient Allergies.');

  // 5. SEED REAL CLINICAL VISITS & ENCOUNTERS
  const visit1 = await prisma.visit.create({
    data: {
      patientId: patient1.id,
      doctorId: drRajesh.id,
      facilityId: perumbavoorPhc.id,
      visitDate: new Date('2026-08-18T10:30:00Z'),
      chiefComplaint: 'Acute cough, chest tightness and fever (38.5°C) for 4 days following plywood factory dust exposure.',
      diagnosis: 'Acute Occupational Bronchitis (ICD-10 J20.9)',
      bloodPressure: '128/82',
      temperature: '101.2°F',
      pulse: '84 bpm',
      weight: '62 kg',
      doctorNotes: 'Patient advised 5 days sick leave from sawdust-heavy zones. N-95 respiratory mask prescribed.',
    },
  });

  const visit2 = await prisma.visit.create({
    data: {
      patientId: patient2.id,
      doctorId: drPriya.id,
      facilityId: kanjikodeCamp.id,
      visitDate: new Date('2026-08-20T14:15:00Z'),
      chiefComplaint: 'Abdominal pain, nausea, and watery diarrhea after drinking unchlorinated well water at camp.',
      diagnosis: 'Acute Gastroenteritis / Waterborne Infection (ICD-10 A09)',
      bloodPressure: '114/76',
      temperature: '99.4°F',
      pulse: '78 bpm',
      weight: '58 kg',
      doctorNotes: 'ORS hydration started immediately. Health Inspector alerted for camp water chlorination.',
    },
  });

  const visit3 = await prisma.visit.create({
    data: {
      patientId: patient3.id,
      doctorId: drAnoop.id,
      facilityId: kozhikodeHospital.id,
      visitDate: new Date('2026-08-15T09:00:00Z'),
      chiefComplaint: 'Persistent headache, high fever with chills and joint body pain for 3 days.',
      diagnosis: 'Acute Febrile Illness / Dengue Fever Screening (ICD-10 A90)',
      bloodPressure: '120/80',
      temperature: '102.6°F',
      pulse: '92 bpm',
      weight: '66 kg',
      doctorNotes: 'Dengue NS1 antigen and Complete Blood Count ordered. Platelet count monitoring required.',
    },
  });

  const visit4 = await prisma.visit.create({
    data: {
      patientId: patient4.id,
      doctorId: drRajesh.id,
      facilityId: aluvaHospital.id,
      visitDate: new Date('2026-08-21T11:45:00Z'),
      chiefComplaint: 'Occupational skin rashes, itching, and erythematous lesions on forearm.',
      diagnosis: 'Occupational Contact Dermatitis (ICD-10 L24.8)',
      bloodPressure: '130/85',
      temperature: '98.6°F',
      pulse: '74 bpm',
      weight: '70 kg',
      doctorNotes: 'Apply topical hydrocortisone. Avoid direct contact with industrial chemical adhesives.',
    },
  });

  console.log('✅ Seeded 4 Clinical Encounter Records.');

  // 6. SEED PRESCRIPTIONS (Rx)
  await prisma.prescription.create({
    data: {
      visitId: visit1.id,
      medicineName: 'Tab Cefuroxime Axetil',
      dosage: '500 mg',
      frequency: 'Twice Daily (BD)',
      duration: '5 Days',
    },
  });

  await prisma.prescription.create({
    data: {
      visitId: visit1.id,
      medicineName: 'Syrup Levosalbutamol + Ambroxol',
      dosage: '10 ml',
      frequency: 'Three Times Daily (TDS)',
      duration: '7 Days',
    },
  });

  await prisma.prescription.create({
    data: {
      visitId: visit2.id,
      medicineName: 'Oral Rehydration Salts (ORS) Sachets',
      dosage: '1 Litre Fluid Mix',
      frequency: 'As needed continuously',
      duration: '3 Days',
    },
  });

  await prisma.prescription.create({
    data: {
      visitId: visit2.id,
      medicineName: 'Tab Ciprofloxacin',
      dosage: '500 mg',
      frequency: 'Twice Daily (BD)',
      duration: '5 Days',
    },
  });

  await prisma.prescription.create({
    data: {
      visitId: visit3.id,
      medicineName: 'Tab Paracetamol',
      dosage: '650 mg',
      frequency: 'Every 6 hours as needed',
      duration: '5 Days',
    },
  });

  await prisma.prescription.create({
    data: {
      visitId: visit4.id,
      medicineName: 'Cream Hydrocortisone 1%',
      dosage: 'Topical Application',
      frequency: 'Twice Daily (BD)',
      duration: '7 Days',
    },
  });

  console.log('✅ Seeded Prescriptions.');

  // 7. SEED LAB DIAGNOSTIC REPORTS
  await prisma.labReport.create({
    data: {
      patientId: patient1.id,
      visitId: visit1.id,
      testName: 'Chest X-Ray (PA View)',
      result: 'Mild peribronchial thickening noted. No focal consolidation or active TB cavity.',
      reportDate: new Date('2026-08-18T12:00:00Z'),
    },
  });

  await prisma.labReport.create({
    data: {
      patientId: patient3.id,
      visitId: visit3.id,
      testName: 'Dengue NS1 Antigen & Platelet Count',
      result: 'Dengue NS1: POSITIVE (+). Platelet Count: 1,45,000 /cu mm (Adequate).',
      reportDate: new Date('2026-08-15T11:30:00Z'),
    },
  });

  await prisma.labReport.create({
    data: {
      patientId: patient2.id,
      visitId: visit2.id,
      testName: 'Stool Culture & Hanging Drop Microscopy',
      result: 'Vibrio Cholerae: NEGATIVE (-). E. coli overgrowth isolated.',
      reportDate: new Date('2026-08-20T16:00:00Z'),
    },
  });

  console.log('✅ Seeded Lab Diagnostic Reports.');

  // 8. SEED ACTIONABLE FOLLOW-UP STATUSES IN POSTGRESQL
  await prisma.followUp.create({
    data: {
      followUpId: `fu-alert-visit-${visit1.id}`,
      patientId: patient1.id,
      status: 'PENDING',
    },
  });

  await prisma.followUp.create({
    data: {
      followUpId: `fu-alert-visit-${visit3.id}`,
      patientId: patient3.id,
      status: 'IN_PROGRESS',
    },
  });

  await prisma.followUp.create({
    data: {
      followUpId: `fu-alert-visit-${visit2.id}`,
      patientId: patient2.id,
      status: 'COMPLETED',
      completedAt: new Date('2026-08-22T10:00:00Z'),
    },
  });

  console.log('✅ Seeded Persistent Follow-Up Statuses.');
  console.log('🎉 Seeding successfully completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
