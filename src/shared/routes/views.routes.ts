import express from 'express';
import {
	saveUserViewer,
	getUserViewersCount,
	getUserViewersWithRelations,
} from './../../modules/user/controllers/viewers.controller';
const router = express.Router();

router.post('/', saveUserViewer);
router.get('/count', getUserViewersCount);
router.get('/relations', getUserViewersWithRelations);
export default router;
