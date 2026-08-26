import { prisma } from '../src/lib/prisma.js';
import {
  UserRole,
  FacilityType,
  Severity,
  DoctorSpecialization,
  AppointmentStatus,
  PaymentStatus,
  PaymentMethod,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🌱 Seeding authentic Kerala Migrant Worker Health Portal data into Supabase PostgreSQL...');

  // Hash standard password for medical officers
  const salt = await bcrypt.genSalt(10);
  const defaultPasswordHash = await bcrypt.hash('Kerala@123', salt);

  // Clear existing records in reverse dependency order
  await prisma.payment.deleteMany({});
  await prisma.appointment.deleteMany({});
  await prisma.doctorAvailability.deleteMany({});
  await prisma.followUp.deleteMany({});
  await prisma.prescription.deleteMany({});
  await prisma.labReport.deleteMany({});
  await prisma.allergy.deleteMany({});
  await prisma.visit.deleteMany({});
  await prisma.patient.deleteMany({});
  await prisma.healthcareFacility.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('🧹 Cleaned existing database tables.');

  // 1. SEED HEALTHCARE FACILITIES
  const perumbavoorPhc = await prisma.healthcareFacility.create({
    data: {
      name: 'Perumbavoor Taluk Hospital & Migrant Clinic',
      type: FacilityType.PHC,
      district: 'Ernakulam',
      address: 'Main Central Rd, Perumbavoor, Kerala 683542',
      contactPhone: '0484-2522244',
    },
  });

  const aluvaHospital = await prisma.healthcareFacility.create({
    data: {
      name: 'Aluva District Hospital',
      type: FacilityType.HOSPITAL,
      district: 'Ernakulam',
      address: 'Bank Junction, Aluva, Kerala 683101',
      contactPhone: '0484-2624020',
    },
  });

  const kanjikodeCamp = await prisma.healthcareFacility.create({
    data: {
      name: 'Kanjikode Industrial Zone Mobile Medical Camp',
      type: FacilityType.MOBILE_CAMP,
      district: 'Palakkad',
      address: 'Industrial Belt Sector 2, Kanjikode, Kerala 678621',
      contactPhone: '0491-2566100',
    },
  });

  const payyannurPhc = await prisma.healthcareFacility.create({
    data: {
      name: 'Payyannur Taluk Headquarters Hospital',
      type: FacilityType.PHC,
      district: 'Kannur',
      address: 'Payyannur Town, Kannur, Kerala 670307',
      contactPhone: '0497-2805244',
    },
  });

  const kozhikodeHospital = await prisma.healthcareFacility.create({
    data: {
      name: 'Kozhikode Beach General Hospital',
      type: FacilityType.HOSPITAL,
      district: 'Kozhikode',
      address: 'Beach Rd, Vellayil, Kozhikode, Kerala 673032',
      contactPhone: '0495-2365367',
    },
  });

  console.log('✅ Seeded 5 Healthcare Facilities.');

  // 2. SEED SYSTEM USERS / DOCTORS WITH SPECIALIZATIONS & PASSWORDS
  const drRajesh = await prisma.user.create({
    data: {
      name: 'Dr. Rajesh V. Nambiar',
      email: 'dr.rajesh.nambiar@dhs.kerala.gov.in',
      passwordHash: defaultPasswordHash,
      role: UserRole.DOCTOR,
      specialization: DoctorSpecialization.PULMONOLOGY,
      consultationFee: 0,
    },
  });

  const drPriya = await prisma.user.create({
    data: {
      name: 'Dr. Priya S. Kurup',
      email: 'dr.priya.kurup@dhs.kerala.gov.in',
      passwordHash: defaultPasswordHash,
      role: UserRole.DOCTOR,
      specialization: DoctorSpecialization.INFECTIOUS_DISEASE,
      consultationFee: 0,
    },
  });

  const drAnoop = await prisma.user.create({
    data: {
      name: 'Dr. Anoop Kumar P.',
      email: 'dr.anoop.kumar@dhs.kerala.gov.in',
      passwordHash: defaultPasswordHash,
      role: UserRole.DOCTOR,
      specialization: DoctorSpecialization.DERMATOLOGY,
      consultationFee: 0,
    },
  });

  const sunilInspector = await prisma.user.create({
    data: {
      name: 'Sunil Kumar K. V.',
      email: 'sunil.health@kerala.gov.in',
      passwordHash: defaultPasswordHash,
      role: UserRole.HEALTH_WORKER,
    },
  });

  const adminUser = await prisma.user.create({
    data: {
      name: 'Kerala Migrant Health Cell Admin',
      email: 'admin.migranthealth@kerala.gov.in',
      passwordHash: defaultPasswordHash,
      role: UserRole.ADMIN,
    },
  });

  console.log('✅ Seeded 5 System Users & Doctors with passwords (Default: Kerala@123).');

  // 3. SEED DOCTOR AVAILABILITIES (Mon-Fri 09:00 - 13:00)
  for (let day = 1; day <= 5; day++) {
    await prisma.doctorAvailability.create({
      data: {
        doctorId: drRajesh.id,
        facilityId: perumbavoorPhc.id,
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '13:00',
        slotDurationMinutes: 20,
      },
    });

    await prisma.doctorAvailability.create({
      data: {
        doctorId: drPriya.id,
        facilityId: kanjikodeCamp.id,
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '13:00',
        slotDurationMinutes: 20,
      },
    });

    await prisma.doctorAvailability.create({
      data: {
        doctorId: drAnoop.id,
        facilityId: aluvaHospital.id,
        dayOfWeek: day,
        startTime: '10:00',
        endTime: '14:00',
        slotDurationMinutes: 20,
      },
    });
  }

  console.log('✅ Seeded Doctor Weekly Availability Schedules.');

  // 4. SEED REAL MIGRANT WORKER HEALTH RECORDS WITH AWAZ/PMJAY INSURANCE
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
      insuranceScheme: 'AWAZ Health Insurance Scheme for Interstate Guest Workers',
      insuranceCardNumber: 'AWAZ-2026-KL-88219',
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
      insuranceScheme: 'Ayushman Bharat - PM-JAY',
      insuranceCardNumber: 'PMJAY-BR-KL-00918',
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
      insuranceScheme: 'AWAZ Health Insurance Scheme for Interstate Guest Workers',
      insuranceCardNumber: 'AWAZ-2026-KL-44012',
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
      insuranceScheme: 'Karunya Benevolent Fund (KBF)',
      insuranceCardNumber: 'KBF-2026-EKM-3310',
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
      insuranceScheme: 'AWAZ Health Insurance Scheme for Interstate Guest Workers',
      insuranceCardNumber: 'AWAZ-2026-KL-77621',
    },
  });

  console.log('✅ Seeded 5 Migrant Worker Profiles with authentic Insurance metadata.');

  // 5. SEED ALLERGIES
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

  // 6. SEED CLINICAL VISITS
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

  // 7. SEED PRESCRIPTIONS
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

  // 8. SEED LAB REPORTS
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

  // 9. SEED ACTIONABLE FOLLOW-UPS
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

  // 10. SEED APPOINTMENTS & PAYMENTS (ONLINE BOOKING ENGINE)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const apt1 = await prisma.appointment.create({
    data: {
      appointmentNumber: 'APT-2026-00001',
      patientId: patient1.id,
      doctorId: drRajesh.id,
      facilityId: perumbavoorPhc.id,
      appointmentDate: tomorrow,
      slotTime: '10:00',
      reason: 'Post-bronchitis occupational recovery review',
      priority: Severity.HIGH,
      status: AppointmentStatus.SCHEDULED,
      notes: 'Check chest auscultation and pulse oximetry.',
    },
  });

  await prisma.payment.create({
    data: {
      appointmentId: apt1.id,
      patientId: patient1.id,
      amount: 0,
      orderId: `order_seed_001`,
      status: PaymentStatus.WAIVED,
      method: PaymentMethod.AWAZ_INSURANCE_WAIVER,
      waivedReason: 'AWAZ Health Scheme 100% Cashless Camp Coverage',
    },
  });

  const apt2 = await prisma.appointment.create({
    data: {
      appointmentNumber: 'APT-2026-00002',
      patientId: patient2.id,
      doctorId: drPriya.id,
      facilityId: kanjikodeCamp.id,
      appointmentDate: tomorrow,
      slotTime: '11:20',
      reason: 'Waterborne infection follow-up examination',
      priority: Severity.MEDIUM,
      status: AppointmentStatus.SCHEDULED,
    },
  });

  await prisma.payment.create({
    data: {
      appointmentId: apt2.id,
      patientId: patient2.id,
      amount: 50,
      orderId: `order_seed_002`,
      paymentId: `pay_sih_test_99812`,
      signature: `sandbox_signature_verified`,
      status: PaymentStatus.SUCCESS,
      method: PaymentMethod.UPI,
    },
  });

  console.log('✅ Seeded Online Appointments & Verified Payments.');
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
