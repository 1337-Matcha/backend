import * as profileService from '../services/profile.service';
import { ProfileDto, ProfileUpdateDto } from '../dto/profile.dto';
import { Response } from 'express';
import HttpStatus from 'http-status';

export const saveProfile = async (req: any, res: Response) => {
	try {
		req.body.user_id = req.userId;
		const newUser = await profileService.save(req.body as ProfileDto);
		res.status(HttpStatus.CREATED).json({
			message: 'Profile created successfully',
			user: newUser,
		});
	} catch (err: any) {
		res.status(HttpStatus.BAD_REQUEST).json({
			error: err.message,
		});
	}
};

export const getProfile = async (req: any, res: Response) => {
	try {
		const profile = await profileService.get(req.userId);
		res.status(HttpStatus.OK).json(profile);
	} catch (err: any) {
		res.status(HttpStatus.BAD_REQUEST).json({
			error: err.message,
		});
	}
};

export const updateProfile = async (req: any, res: Response) => {
	try {
		req.body.id = req.userId;
		const updatedProfile = await profileService.update(
			req.body as ProfileUpdateDto,
		);
		res.status(HttpStatus.OK).json(updatedProfile);
	} catch (err: any) {
		res.status(HttpStatus.BAD_REQUEST).json({
			error: err.message,
		});
	}
};
