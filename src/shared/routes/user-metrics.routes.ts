import express from 'express';
import { getFame } from '../../modules/user/controllers/user-metrics.controller';

const router = express.Router();

router.get('/', getFame);
export default router;
