import express from 'express';
import { 
  getAllEvents, 
  getEventById,
  createEvent,
  updateEvent,
  getEventsBySociety,
  updateEventStatus,
  getCompletedEventsByEmail,
  markEventAsCompleted
} from '../controllers/eventController.mjs';

const router = express.Router();

// Public routes
router.get('/', getAllEvents);
router.get('/:id', getEventById);
router.get('/society/:societyId', getEventsBySociety);
router.get('/completed/email/:email', getCompletedEventsByEmail);
router.put('/:id/status', updateEventStatus); 
router.put('/:id/complete', markEventAsCompleted); // New route for marking events as completed
router.post('/', createEvent); 
router.put('/:id', updateEvent);

export default router;
