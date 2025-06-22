import express from 'express';
import { getAllReports, updateReportRating, getReportsBySocietyId, getReportsBySocietyEmail, getCompletedEventsBySocietyEmail, submitReport } from '../controllers/reportController.mjs';

const router = express.Router();

// Get all reports
router.get('/', getAllReports);

// Add a new route to get ALL reports
router.get('/all', getAllReports);

// Submit a new report
router.post('/', submitReport);

// Important: Make this PUT instead of other methods to match the client's expectation
router.put('/:id/rating', updateReportRating);

// Get reports for a specific society
router.get('/society/:societyId', getReportsBySocietyId);

// Get reports for a specific society using email
router.get('/society/email/:email', getReportsBySocietyEmail);

// Ensure this route matches the frontend API call
router.get('/events/completed/email/:email', getCompletedEventsBySocietyEmail);

export default router;
