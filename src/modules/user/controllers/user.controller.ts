import * as userService from './../services/user.service';
import { Response } from 'express';
import HttpStatus from 'http-status';

export const getUsersWithRelations = async (req: any, res: Response) => {
	try {
		const users = await userService.getAllUsersWithRelations();
		res.status(HttpStatus.OK).json(users);
	} catch (err: any) {
		res.status(HttpStatus.BAD_REQUEST).json({
			error: err.message,
		});
	}
};

export const getUserWithRelations = async (req: any, res: Response) => {
	try {
		const targetUserId = req.params.id || req.userId;
		const user = await userService.getUserWithRelations(targetUserId);

		res.status(HttpStatus.OK).json(user);
	} catch (err: any) {
		res.status(err.statusCode || 500).json({
			error: err.message,
		});
	}
};

export const saveUserWithRelations = async (req: any, res: Response) => {
	try {
		const user = await userService.saveUserWithRelations(req.body);
		res.status(HttpStatus.OK).json(user);
	} catch (err: any) {
		res.status(err.statusCode).json({
			error: err.message,
		});
	}
};

export const searchUsersProfile = async (req: any, res: Response) => {
	try {
		const query = req.query.query;
		const users = await userService.searchUsersProfile(query);
		res.status(HttpStatus.OK).json(users);
	} catch (err: any) {
		res.status(err.statusCode).json({
			error: err.message,
		});
	}
};
