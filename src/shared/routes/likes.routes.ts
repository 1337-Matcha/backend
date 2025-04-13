import express from 'express';
import {
	save,
	remove,
	getLikes,
	getLikesWithRelation,
	hasLikedUser,
} from '../../modules/like/like.controller';

const router = express.Router();

router.post('/', save);
router.post('/remove', remove);
router.get('/', getLikes);
router.post('/hasLiked', hasLikedUser);
router.get('/relations', getLikesWithRelation);
export default router;
