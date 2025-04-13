import { repository } from '../../../repository';
import { ProfileDto, ProfileUpdateDto } from '../dto/profile.dto';

const save = async (profile: ProfileDto) => {
	return await repository.updateOrInsert('profile', profile, {
		user_id: profile.user_id,
	});
};

const get = async (user_id: string): Promise<any> => {
	const res = await repository.findOneByCondition('profile', { user_id });
	if (!res) throw new Error('Profile not found');
	delete res.id;
	return res;
};

const update = async (profileUpdateDto: ProfileUpdateDto) => {
	const user_id = profileUpdateDto.user_id;
	delete profileUpdateDto.user_id;

	const res: boolean = await repository.update(
		'profile',
		profileUpdateDto,
		{
			user_id,
		},
		false,
	);
	if (!res)
		throw new Error('Profile not updated, try to update existing data');
	return { message: 'Profile updated successfully' };
};

export { save, get, update };
