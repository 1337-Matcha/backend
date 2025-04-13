import * as likeService from './like.service';
import { Response } from 'express';
import HttpStatus from 'http-status';

export const save = async (req: any, res: Response) => {
	try {
		req.body.liked_id = req.userId;
		const result = await likeService.save(req.body);
		res.status(HttpStatus.CREATED).json({ status: result ? true : false });
	} catch (err: any) {
		throw err;
	}
};

export const remove = async (req: any, res: Response) => {
	try {
		req.body.liked_id = req.userId;
		await likeService.remove(req.body);
		res.status(HttpStatus.OK).json('Like removed');
	} catch (err: any) {
		res.status(HttpStatus.NOT_FOUND).json({
			error: err.message,
		});
	}
};

export const getLikes = async (req: any, res: Response) => {
	try {
		const result = await likeService.getLikes(req.userId);
		res.status(HttpStatus.OK).json(result);
	} catch (err: any) {
		res.status(HttpStatus.NOT_FOUND).json({
			error: err.message,
		});
	}
};

export const getLikesWithRelation = async (req: any, res: Response) => {
	try {
		const queries = req.query;
		const likers = await likeService.getLikesWithRelation(
			req.userId,
			queries.offset,
			queries.limit,
		);
		res.status(HttpStatus.OK).json(likers);
	} catch (err: any) {
		res.status(HttpStatus.BAD_REQUEST).json({
			error: err.message,
		});
	}
};

export const hasLikedUser = async (req: any, res: Response) => {
	try {
		const hasLiked = await likeService.hasLikedUser(
			req.body.user_id,
			req.userId,
		);
		res.status(200).json({ status: hasLiked });
	} catch (err: any) {
		res.status(HttpStatus.BAD_REQUEST).json({
			error: err.message,
		});
	}
};
