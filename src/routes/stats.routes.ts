import express from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { StatsController } from '../controllers/stats.controller';

const router = express.Router();

router.use(authenticate);

router.get('/monthly', StatsController.getMonthlyStats);

router.get('/summary', StatsController.getSummary);

export default router;