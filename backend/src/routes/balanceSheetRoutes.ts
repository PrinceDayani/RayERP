import { Router } from 'express';
import { scheduleReport, getSchedules, deleteSchedule } from '../controllers/reportScheduleController';
import { addAccountNote, getAccountNotes, deleteAccountNote } from '../controllers/financialReportController';

const router = Router();

// Schedule routes
router.post('/schedule', scheduleReport);
router.get('/schedules', getSchedules);
router.delete('/schedule/:id', deleteSchedule);

// Notes routes
router.post('/notes', addAccountNote);
router.get('/notes/:accountId', getAccountNotes);
router.delete('/notes/:id', deleteAccountNote);

export default router;
