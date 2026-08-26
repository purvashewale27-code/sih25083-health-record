import http from 'http';

const BASE_URL = 'http://localhost:5000/api';

function request(path: string, method = 'GET', body: any = null, token: string | null = null): Promise<any> {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options: http.RequestOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTestSuite() {
  console.log('🧪 Starting Full Comprehensive End-to-End System Integration Test Suite...\n');
  let passedCount = 0;
  let totalCount = 0;

  async function test(name: string, fn: () => Promise<void>) {
    totalCount++;
    try {
      await fn();
      console.log(`✅ [PASS] ${name}`);
      passedCount++;
    } catch (err: any) {
      console.error(`❌ [FAIL] ${name}:`, err.message || err);
    }
  }

  // TEST 1: Health Check Endpoint
  await test('1. Health Check GET /api/health', async () => {
    const res = await request('/health');
    if (res.status !== 200 || !res.body.success) {
      throw new Error(`Expected HTTP 200, got status ${res.status}`);
    }
  });

  // TEST 2: Staff Login & JWT Token Generation
  let authToken = '';
  await test('2. Auth Login POST /api/auth/login', async () => {
    const payload = {
      email: 'dr.rajesh.nambiar@dhs.kerala.gov.in',
      password: 'Kerala@123',
    };
    const res = await request('/auth/login', 'POST', payload);
    if (res.status !== 200 || !res.body.token) {
      throw new Error(`Failed to login doctor: ${JSON.stringify(res.body)}`);
    }
    authToken = res.body.token;
  });

  // TEST 3: Get Authenticated User Profile
  await test('3. Auth Profile GET /api/auth/me', async () => {
    const res = await request('/auth/me', 'GET', null, authToken);
    if (res.status !== 200 || !res.body.data || res.body.data.role !== 'DOCTOR') {
      throw new Error(`Expected authenticated doctor profile.`);
    }
  });

  // TEST 4: Fetch Patients List
  let samplePatientId = '';
  await test('4. Fetch Patients GET /api/patients', async () => {
    const res = await request('/patients');
    if (res.status !== 200 || !Array.isArray(res.body.data) || res.body.data.length === 0) {
      throw new Error(`Expected array of patients.`);
    }
    samplePatientId = res.body.data[0].id;
  });

  // TEST 5: Verify Patient by Health ID
  await test('5. Instant QR/Health ID Verify GET /api/patients/verify/KMH-2026-00001', async () => {
    const res = await request('/patients/verify/KMH-2026-00001');
    if (res.status !== 200 || !res.body.data || !res.body.data.fullName) {
      throw new Error(`Failed to verify health ID KMH-2026-00001`);
    }
  });

  // TEST 6: Doctor Recommendation Engine
  let recommendedDocId = '';
  await test('6. Doctor Recommendation POST /api/doctors/recommend', async () => {
    const payload = {
      complaint: 'Acute cough, wheezing and sawdust irritation',
      district: 'Ernakulam',
    };
    const res = await request('/doctors/recommend', 'POST', payload);
    if (
      res.status !== 200 ||
      !res.body.data ||
      res.body.data.recommendedSpecialization !== 'PULMONOLOGY' ||
      res.body.data.doctors.length === 0
    ) {
      throw new Error(`Doctor recommendation failed: ${JSON.stringify(res.body)}`);
    }
    recommendedDocId = res.body.data.doctors[0].id;
  });

  // TEST 7: Doctor Slot Availability
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split('T')[0];

  await test(`7. Available Slots GET /api/appointments/slots?doctorId=&date=`, async () => {
    const res = await request(`/appointments/slots?doctorId=${recommendedDocId}&date=${dateStr}`);
    if (res.status !== 200 || !res.body.data || !Array.isArray(res.body.data.slots)) {
      throw new Error(`Failed to fetch doctor availability slots.`);
    }
  });

  // TEST 8: Fetch Facilities
  let sampleFacilityId = '';
  await test('8. Facilities GET /api/facilities', async () => {
    const res = await request('/facilities');
    if (res.status !== 200 || !Array.isArray(res.body.data) || res.body.data.length === 0) {
      throw new Error(`Expected array of facilities.`);
    }
    sampleFacilityId = res.body.data[0].id;
  });

  // TEST 9: Book Appointment with Double-Booking Lock
  let bookedAptId = '';
  const testSlotTime = `1${Math.floor(Math.random() * 4) + 2}:${Math.floor(Math.random() * 5)}0`;
  await test('9. Book Appointment POST /api/appointments', async () => {
    const payload = {
      patientId: samplePatientId,
      doctorId: recommendedDocId,
      facilityId: sampleFacilityId,
      appointmentDate: dateStr,
      slotTime: testSlotTime,
      reason: 'Respiratory cough checkup',
      priority: 'MEDIUM',
    };
    const res = await request('/appointments', 'POST', payload);
    if (res.status !== 201 || !res.body.data) {
      throw new Error(`Failed to book appointment: ${JSON.stringify(res.body)}`);
    }
    bookedAptId = res.body.data.id;
  });

  // TEST 10: Double-Booking Conflict Prevention
  await test('10. Double-Booking Conflict Prevention (409 Conflict)', async () => {
    const payload = {
      patientId: samplePatientId,
      doctorId: recommendedDocId,
      facilityId: sampleFacilityId,
      appointmentDate: dateStr,
      slotTime: testSlotTime,
      reason: 'Duplicate attempt on same slot',
    };
    const res = await request('/appointments', 'POST', payload);
    if (res.status !== 409) {
      throw new Error(`Expected HTTP 409 conflict on double-booking, got ${res.status}`);
    }
  });

  // TEST 11: Payment Order Creation & BPL Waiver
  await test('11. Payment Waiver POST /api/payments/create-order', async () => {
    const payload = {
      patientId: samplePatientId,
      appointmentId: bookedAptId,
      isBplWaiver: true,
      waiverReason: 'AWAZ Cashless Free Triage',
    };
    const res = await request('/payments/create-order', 'POST', payload);
    if (res.status !== 201 || !res.body.data?.isWaived) {
      throw new Error(`Failed to apply AWAZ payment waiver.`);
    }
  });

  // TEST 12: Insurance Eligibility Evaluation
  await test(`12. AWAZ / PM-JAY Eligibility GET /api/insurance/eligibility/:patientId`, async () => {
    const res = await request(`/insurance/eligibility/${samplePatientId}`);
    if (res.status !== 200 || !res.body.data || !Array.isArray(res.body.data.evaluations)) {
      throw new Error(`Failed to evaluate insurance eligibility.`);
    }
  });

  console.log(`\n========================================`);
  console.log(`📊 TEST SUITE RESULTS: ${passedCount} / ${totalCount} TESTS PASSED CLEANLY!`);
  console.log(`========================================\n`);

  if (passedCount !== totalCount) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
