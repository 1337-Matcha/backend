import * as locationService from './../services/location.service';
import HttpStatus from 'http-status';
import { Response } from 'express';

export const updateOrInsertLocation = async (req: any, res: Response) => {
	try {
		req.body.user_id = req.userId;
		const newLocation = await locationService.updateOrInsert(req.body);
		res.status(HttpStatus.CREATED).json({
			message: 'Location updated successfully',
			location: newLocation,
		});
	} catch (err: any) {
		res.status(HttpStatus.BAD_REQUEST).json({
			error: err.message,
		});
	}
};
