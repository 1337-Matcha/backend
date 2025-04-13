import HttpStatus from 'http-status';
import * as userService from '../services/user.service';
import * as profileService from '../services/profile.service';
import * as locationService from '../services/location.service';
import * as sexualPreferencesService from '../services/sexual-preferences.service';
import { Response } from 'express';
import { GetUserWithRelationsDTO } from '../dto/user.dto';

export const uploadUserProfile = async (req: any, res: Response) => {
	try {
		const userId = req.userId;
		const mainPicture = (req.files as any)?.['mainPicture']?.[0] || null;
		const pictures = (req.files as any)?.['pictures'] || [];

		// Profile data (as JSON string)
		let userProfile: GetUserWithRelationsDTO = req.body.profile
			? JSON.parse(req.body.profile)
			: {};
		const existingPictures = userProfile.existingPictures || [];

		// Handle main picture
		if (mainPicture) {
			userProfile.mainPicture = mainPicture.path;
		}

		// Handle additional pictures
		if (pictures.length > 0) {
			userProfile.pictures = pictures.map(
				(file: Express.Multer.File) => file.path,
			);
			// add the existingPictures to the pictures
			userProfile.pictures = [
				...(userProfile.pictures || []),
				...existingPictures,
			];
		}

		// If location data is provided, update it
		if (userProfile.location) {
			userProfile.location.address = userProfile.location?.address;
			userProfile.location.lat = userProfile.location?.lat;
			userProfile.location.lng = userProfile.location?.lng;
		}

		// Now, update the user profile in the database. You can selectively update fields if they are provided.
		await Promise.all([
			userService.update(
				{
					firstname: userProfile.firstname,
					lastname: userProfile.lastname,
					username: userProfile.username,
				},
				{ id: userId },
				false,
				false,
			),
			profileService.save({
				bio: userProfile.bio,
				...(userProfile.pictures && { pictures: userProfile.pictures }),
				...(userProfile.mainPicture && {
					mainPicture: userProfile.mainPicture,
				}),
				gender: userProfile.gender,
				interests: userProfile.interests,
				user_id: userId,
				birthdate: userProfile.birthdate,
			}),
			locationService.save({
				user_id: userId,
				lat: userProfile.location?.lat,
				lng: userProfile.location?.lng,
				address: userProfile.location?.address,
			}),
			sexualPreferencesService.save({
				preferences: userProfile.sexualPreferences,
				user_id: userId,
				sexual_orientation: userProfile.sexualOrientation,
			}),
		]);

		// Response indicating successful update
		res.status(HttpStatus.OK).json({
			pictures: userProfile.pictures?.map((pic: string) => 
				{
					const apiURL = process.env.API_URL + '/api/';
					return apiURL + pic;
				}
			) || [],
		});
	} catch (err: any) {
		console.log(err);
		res.status(HttpStatus.BAD_REQUEST).json({
			error: err.message,
		});
	}
};
