import * as viewersService from './../services/viewers.service';
import { Response } from 'express';
import HttpStatus from 'http-status';

export const getUserViewers = async (req: any, res: Response) => {
	try {
		const viewers = await viewersService.getViewers(req.userId);
		res.status(HttpStatus.OK).json(viewers);
	} catch (err: any) {
		res.status(HttpStatus.BAD_REQUEST).json({
			error: err.message,
		});
	}
};

export const getUserViewersCount = async (req: any, res: Response) => {
	try {
		const viewers = await viewersService.getViewersCount(req.userId);
		res.status(HttpStatus.OK).json(viewers);
	} catch (err: any) {
		res.status(HttpStatus.BAD_REQUEST).json({
			error: err.message,
		});
	}
};

export const getUserViewersWithRelations = async (req: any, res: Response) => {
	try {
		const queries = req.query;
		const viewers = await viewersService.getViewersWithRelations(
			req.userId,
			queries.offset,
			queries.limit,
		);
		res.status(HttpStatus.OK).json(viewers);
	} catch (err: any) {
		res.status(HttpStatus.BAD_REQUEST).json({
			error: err.message,
		});
	}
};

export const saveUserViewer = async (req: any, res: Response) => {
	try {
		req.body.user_id = req.userId;
		const now = new Date();
		const nowUTC = new Date(
			now.getTime() + now.getTimezoneOffset() * 60000,
		);
		const existingViews = await viewersService.findRecentView(
			req.body.user_id,
			req.body.viewerid,
		);

		// Check for views within the last 10 minutes
		const recentView = existingViews?.find((view: any) => {
			// Parse the DB timestamp as UTC (assuming it's stored as UTC)
			const viewedAtUTC = new Date(view.viewed_at);

			// Calculate difference in minutes
			const diffMinutes =
				(nowUTC.getTime() - viewedAtUTC.getTime()) / (1000 * 60);

			return diffMinutes <= 10;
		});
		if (recentView) {
			return res.status(HttpStatus.CONFLICT).json({
				message: 'View already recorded within the last 10 minutes.',
			});
		}
		const viewer = await viewersService.save({
			viewerid: req.body.user_id,
			user_id: req.body.viewerid,
		});
		res.status(HttpStatus.CREATED).json({
			message: 'Viewer created successfully',
			viewer,
		});
	} catch (err: any) {
		res.status(HttpStatus.BAD_REQUEST).json({
			error: err.message,
		});
	}
};
export const deleteUserViewer = async (req: any, res: Response) => {};
export const updateUserViewer = async (req: any, res: Response) => {};
