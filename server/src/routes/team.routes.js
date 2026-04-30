import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import teamController from '../controllers/team.controller.js';

const router = express.Router();

router.use(authMiddleware);
router.get('/', teamController.listMyTeams);
router.post('/', teamController.createTeam);
router.post('/join', teamController.joinTeam);

export default router;
