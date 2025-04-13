import { repository } from '../../../repository';
import { SexualPreferencesDTO } from '../../../shared/dtos';

export const save = async (sexualPref: SexualPreferencesDTO) => {
	return await repository.updateOrInsert('sexual_preferences', sexualPref, {
		user_id: sexualPref.user_id,
	})
};

