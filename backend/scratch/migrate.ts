import pg from 'pg';
import 'dotenv/config';

const { Client } = pg;

async function migrateSupabase() {
  console.log('Connecting directly to Supabase PostgreSQL...');
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('Connected!');

  // 1. User table migrations
  await client.query(`
    DO $$ BEGIN
      CREATE TYPE "DoctorSpecialization" AS ENUM ('GENERAL_MEDICINE', 'PULMONOLOGY', 'DERMATOLOGY', 'INFECTIOUS_DISEASE', 'ORTHOPEDICS', 'OCCUPATIONAL_HEALTH', 'PEDIATRICS');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  await client.query(`
    DO $$ BEGIN
      CREATE TYPE "AppointmentStatus" AS ENUM ('SCHEDULED', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED', 'NO_SHOW');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  await client.query(`
    DO $$ BEGIN
      CREATE TYPE "PaymentStatus" AS ENUM ('INITIATED', 'SUCCESS', 'FAILED', 'WAIVED');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  await client.query(`
    DO $$ BEGIN
      CREATE TYPE "PaymentMethod" AS ENUM ('UPI', 'CARD', 'CASH_AT_DESK', 'AWAZ_INSURANCE_WAIVER');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  await client.query(`
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordHash" TEXT DEFAULT '$2a$10$eW6Y0xQn4zO3J6w7K/8k1.4bB5LzF8O0h5e0C9u4zX.6cWq2oM5i6';
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "specialization" "DoctorSpecialization";
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "consultationFee" INTEGER DEFAULT 0;
    
    ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "insuranceScheme" TEXT;
    ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "insuranceCardNumber" TEXT;

    ALTER TABLE "HealthcareFacility" ADD COLUMN IF NOT EXISTS "address" TEXT;
    ALTER TABLE "HealthcareFacility" ADD COLUMN IF NOT EXISTS "contactPhone" TEXT;
  `);

  // 2. Create DoctorAvailability table
  await client.query(`
    CREATE TABLE IF NOT EXISTS "DoctorAvailability" (
      "id" TEXT PRIMARY KEY,
      "doctorId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
      "facilityId" TEXT NOT NULL REFERENCES "HealthcareFacility"("id") ON DELETE CASCADE,
      "dayOfWeek" INTEGER NOT NULL,
      "startTime" TEXT NOT NULL,
      "endTime" TEXT NOT NULL,
      "slotDurationMinutes" INTEGER NOT NULL DEFAULT 20,
      "maxPatientsPerSlot" INTEGER NOT NULL DEFAULT 1,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 3. Create Appointment table
  await client.query(`
    CREATE TABLE IF NOT EXISTS "Appointment" (
      "id" TEXT PRIMARY KEY,
      "appointmentNumber" TEXT UNIQUE NOT NULL,
      "patientId" TEXT NOT NULL REFERENCES "Patient"("id") ON DELETE CASCADE,
      "doctorId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT,
      "facilityId" TEXT NOT NULL REFERENCES "HealthcareFacility"("id") ON DELETE RESTRICT,
      "appointmentDate" TIMESTAMP(3) NOT NULL,
      "slotTime" TEXT NOT NULL,
      "status" "AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
      "reason" TEXT NOT NULL,
      "priority" "Severity" NOT NULL DEFAULT 'MEDIUM',
      "notes" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "appointment_doctor_date_slot_unique" UNIQUE ("doctorId", "appointmentDate", "slotTime")
    );
  `);

  // 4. Create Payment table
  await client.query(`
    CREATE TABLE IF NOT EXISTS "Payment" (
      "id" TEXT PRIMARY KEY,
      "appointmentId" TEXT REFERENCES "Appointment"("id") ON DELETE SET NULL,
      "patientId" TEXT NOT NULL REFERENCES "Patient"("id") ON DELETE CASCADE,
      "amount" INTEGER NOT NULL,
      "currency" TEXT NOT NULL DEFAULT 'INR',
      "orderId" TEXT UNIQUE NOT NULL,
      "paymentId" TEXT,
      "signature" TEXT,
      "status" "PaymentStatus" NOT NULL DEFAULT 'INITIATED',
      "method" "PaymentMethod" NOT NULL DEFAULT 'UPI',
      "waivedReason" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('✅ Supabase Schema Migrated Successfully!');
  await client.end();
}

migrateSupabase().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
