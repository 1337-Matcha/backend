import { repository } from '../../../repository';
import { LocationDTO } from '../../../shared/dtos';

export const save = async (location: LocationDTO) => {
	return await repository.updateOrInsert('locations', location, {
		user_id: location.user_id,
	});
};

export const updateOrInsert = async (location: LocationDTO) => {
	return await repository.updateOrInsert('locations', location, {
		user_id: location.user_id,
	});
};
