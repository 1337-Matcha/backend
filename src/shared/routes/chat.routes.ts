import express from 'express';
import {
	save,
	getLastConversations,
} from './../../modules/chat/chat.controller';
const router = express.Router();

router.post('/', save);
router.get('/last', getLastConversations);
// router.get('/relations', getUserViewersWithRelations);
export default router;
