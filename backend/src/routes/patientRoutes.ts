import { Router } from 'express';
import {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
} from '../controllers/patientController.js';
import {
  getPatientAllergies,
  createPatientAllergy,
} from '../controllers/allergyController.js';
import {
  getPatientLabReports,
  createPatientLabReport,
} from '../controllers/labReportController.js';

const router = Router();

// Patient CRUD
router.get('/', getPatients);
router.post('/', createPatient);
router.get('/:id', getPatientById);
router.put('/:id', updatePatient);
router.delete('/:id', deletePatient);

// Nested Patient Allergy APIs
router.get('/:patientId/allergies', getPatientAllergies);
router.post('/:patientId/allergies', createPatientAllergy);

// Nested Patient Lab Report APIs
router.get('/:patientId/lab-reports', getPatientLabReports);
router.post('/:patientId/lab-reports', createPatientLabReport);

export default router;
