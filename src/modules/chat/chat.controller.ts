import * as chatService from './services/chat.service';
import { Response } from 'express';
import HttpStatus from 'http-status';

export const save = async (req: any, res: Response) => {
	try {
		// {
		// target_id: string;
		// content: string;
		// type: 'TEXT' || 'AUDIO' || 'PICTURE' || 'DOCUMENT'
		// }
		// req.body.sender1_id = req.userId;
		const result = await chatService.save(req.body);
		res.status(HttpStatus.CREATED).json({ status: result ? true : false });
	} catch (err: any) {
		console.log(err);
		res.status(HttpStatus.BAD_REQUEST).json(err);
	}
};

export const getLastConversations = async (req: any, res: Response) => {
	try {
		const queries = req.query;
		const result = await chatService.getLastConversations(
			req.userId,
			queries.offset,
			queries.limit,
		);
		res.status(HttpStatus.OK).json(result);
	} catch (err: any) {
		res.status(HttpStatus.NOT_FOUND).json({
			error: err.message,
		});
	}
};
