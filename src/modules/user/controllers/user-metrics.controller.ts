import * as viewersService from './../services/user-metrics.service';
import { Response } from 'express';
import HttpStatus from 'http-status';

export const getFame = async (req: any, res: Response) => {
	try {
		const user_id = req.query.id;
		const fame = await viewersService.getFame(user_id);
		console.log(fame);
		res.status(HttpStatus.OK).json({ fame });
	} catch (err: any) {
		res.status(HttpStatus.BAD_REQUEST).json({
			error: err.message,
		});
	}
};
