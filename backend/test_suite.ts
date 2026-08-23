import http from 'http';

const BASE_URL = 'http://localhost:5000/api';

function request(path: string, method = 'GET', body: any = null): Promise<any> {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options: http.RequestOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (err) {
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

  // TEST 2: Fetch Patients
  let samplePatientId = '';
  await test('2. Patients GET /api/patients', async () => {
    const res = await request('/patients');
    if (res.status !== 200 || !Array.isArray(res.body.data)) {
      throw new Error(`Expected HTTP 200 with patient array, got status ${res.status}`);
    }
    if (res.body.data.length === 0) {
      throw new Error('No patient records found in Supabase DB.');
    }
    samplePatientId = res.body.data[0].id;
  });

  // TEST 3: Fetch Single Patient Graph by ID
  await test('3. Patient Health Record Graph GET /api/patients/:id', async () => {
    if (!samplePatientId) throw new Error('No sample patient ID available.');
    const res = await request(`/patients/${samplePatientId}`);
    if (res.status !== 200 || !res.body.data || res.body.data.id !== samplePatientId) {
      throw new Error(`Failed to load patient health record graph.`);
    }
  });

  // TEST 4: Create Patient
  let createdPatientId = '';
  await test('4. Add Patient POST /api/patients', async () => {
    const payload = {
      healthId: `KMH-TEST-${Date.now().toString().substring(7)}`,
      fullName: 'Integration Test Worker',
      dateOfBirth: '1996-05-10',
      gender: 'Male',
      phone: '+91 99999 88888',
      stateOfOrigin: 'Assam',
      currentDistrict: 'Ernakulam',
      preferredLanguage: 'Assamese',
      emergencyContactName: 'Test Contact',
      emergencyContactPhone: '+91 99999 77777',
    };
    const res = await request('/patients', 'POST', payload);
    if (res.status !== 201 || !res.body.data || !res.body.data.id) {
      throw new Error(`Failed to create patient record: ${JSON.stringify(res.body)}`);
    }
    createdPatientId = res.body.data.id;
  });

  // TEST 5: Fetch Facilities
  let sampleFacilityId = '';
  await test('5. Healthcare Facilities GET /api/facilities', async () => {
    const res = await request('/facilities');
    if (res.status !== 200 || !Array.isArray(res.body.data)) {
      throw new Error(`Expected HTTP 200 with facilities array.`);
    }
    if (res.body.data.length === 0) {
      throw new Error('No facility records found in Supabase DB.');
    }
    sampleFacilityId = res.body.data[0].id;
  });

  // TEST 6: Add Facility
  await test('6. Add Facility POST /api/facilities', async () => {
    const payload = {
      name: `Test PHC ${Date.now().toString().substring(8)}`,
      type: 'PHC',
      district: 'Palakkad',
    };
    const res = await request('/facilities', 'POST', payload);
    if (res.status !== 201 || !res.body.data) {
      throw new Error(`Failed to create facility.`);
    }
  });

  // TEST 7: Fetch Users / Doctors
  let sampleDoctorId = '';
  await test('7. Staff / Users GET /api/users', async () => {
    const res = await request('/users');
    if (res.status !== 200 || !Array.isArray(res.body.data)) {
      throw new Error(`Expected HTTP 200 with users array.`);
    }
    if (res.body.data.length === 0) {
      throw new Error('No user records found in Supabase DB.');
    }
    sampleDoctorId = res.body.data[0].id;
  });

  // TEST 8: Add Staff Member
  await test('8. Add Staff Member POST /api/users', async () => {
    const payload = {
      name: 'Dr. Test Integration Officer',
      email: `dr.test.${Date.now()}@dhs.kerala.gov.in`,
      role: 'DOCTOR',
    };
    const res = await request('/users', 'POST', payload);
    if (res.status !== 201 || !res.body.data) {
      throw new Error(`Failed to create staff member.`);
    }
  });

  // TEST 9: Fetch Clinical Visits
  await test('9. Clinical Visits GET /api/visits', async () => {
    const res = await request('/visits');
    if (res.status !== 200 || !Array.isArray(res.body.data)) {
      throw new Error(`Expected HTTP 200 with visits array.`);
    }
  });

  // TEST 10: Create Clinical Visit Linked to Patient
  let createdVisitId = '';
  await test('10. Log Clinical Visit POST /api/visits', async () => {
    const payload = {
      patientId: createdPatientId || samplePatientId,
      doctorId: sampleDoctorId,
      facilityId: sampleFacilityId,
      chiefComplaint: 'Routine wellness & respiratory checkup for integration testing',
      diagnosis: 'Normal Clinical Examination (ICD-10 Z00.00)',
      bloodPressure: '120/80',
      temperature: '98.6°F',
      pulse: '72 bpm',
      weight: '68 kg',
    };
    const res = await request('/visits', 'POST', payload);
    if (res.status !== 201 || !res.body.data) {
      throw new Error(`Failed to create clinical visit: ${JSON.stringify(res.body)}`);
    }
    createdVisitId = res.body.data.id;
  });

  // TEST 11: Create Prescription Linked to Visit
  await test('11. Add Prescription POST /api/prescriptions', async () => {
    if (!createdVisitId) throw new Error('No created visit ID available.');
    const payload = {
      visitId: createdVisitId,
      medicineName: 'Tab Vitamin C',
      dosage: '500 mg',
      frequency: 'Once Daily (OD)',
      duration: '7 Days',
    };
    const res = await request('/prescriptions', 'POST', payload);
    if (res.status !== 201 || !res.body.data) {
      throw new Error(`Failed to create prescription.`);
    }
  });

  // TEST 12: Persistent Follow-Up Status Update
  await test('12. Update Follow-up Status PUT /api/followups/:id/status', async () => {
    const payload = {
      patientId: createdPatientId || samplePatientId,
      status: 'COMPLETED',
    };
    const res = await request(`/followups/fu-test-${Date.now()}/status`, 'PUT', payload);
    if (res.status !== 200 || !res.body.data || res.body.data.status !== 'COMPLETED') {
      throw new Error(`Failed to update follow-up status in PostgreSQL.`);
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
