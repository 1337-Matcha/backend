import { repository } from '../../repository';
import { IRelations } from '../../shared/utils/interfaces';
import * as userMetrics from './../user/services/user-metrics.service';
import * as conversationService from './../chat/services/conversation.service';
import { UserConvStatus } from '../../shared/enums/conversation.enum';
import { cond } from 'lodash';
async function reactivateConversation(
	conversation: any,
	currentUserId: string,
): Promise<void> {
	const updates: any = {
		id: conversation.id,
		is_active: true,
		updated_at: new Date(),
		deactivation_reason: UserConvStatus.ACTIVE,
		deactivated_by: null,
		user_1_status: conversation.user_1_status,
		user_2_status: conversation.user_2_status,
	};

	// Determine which user's status to update
	if (conversation.user_1 === currentUserId) {
		updates.user_1_status = UserConvStatus.ACTIVE;
	} else if (conversation.user_2 === currentUserId) {
		updates.user_2_status = UserConvStatus.ACTIVE;
	}
	await conversationService.updateConversation(updates);
}
export const save = async (body: any) => {
	try {
		const result = await repository.save('likes', body);
		await userMetrics.updateOrInsert(body.user_id);
		const existingConversation = await conversationService.findConversation(
			{ user_1: body.liked_id, user_2: body.user_id },
		);
		if (existingConversation) {
			if (
				existingConversation.is_active === false &&
				existingConversation.deactivation_reason ===
					UserConvStatus.UNLIKED
			) {
				await reactivateConversation(
					{
						...existingConversation,
						deactivation_reason: UserConvStatus.ACTIVE,
					},
					body.liked_id,
				);
			}
			return result;
		}
		const newConversation =
			await conversationService.findOrCreateConversation({
				user_1: body.user_id,
				user_2: body.liked_id,
				is_active: true,
				last_message_id: null,
				user_1_status: UserConvStatus.ACTIVE,
				user_2_status: UserConvStatus.ACTIVE,
				deactivation_reason: UserConvStatus.ACTIVE,
				deactivated_by: null,
			});
		return result;
	} catch (err: any) {
		console.error('Error in like save operation:', err);
		throw new Error('Failed to process like');
	}
};

export const remove = async (condition: any) => {
	try {
		const conditionKeys = Object.keys(condition);
		const conditionValues = Object.values(condition);
		const conditionclause = conditionKeys
			.map((key, index) => `${key} = '${conditionValues[index]}'`)
			.join(' AND ');
		const result = await repository.deleteByCondition(
			'likes',
			conditionclause,
		);
		const updateMetric = await userMetrics.updateOrInsert(
			condition.user_id,
		);
		const existingConversation = await conversationService.findConversation(
			{ user_1: condition.liked_id, user_2: condition.user_id },
		);
		if (existingConversation) {
			// 3. Reactivate conversation if it was unliked (but not blocked)
			if (
				existingConversation.is_active === true &&
				existingConversation.deactivation_reason ===
					UserConvStatus.ACTIVE
			) {
				await conversationService.updateConversation({
					last_message_id: existingConversation.last_message_id,
					id: existingConversation.id,
					deactivation_reason: UserConvStatus.UNLIKED,
					is_active: false,
					updated_at: new Date(),
					deactivated_by: condition.liked_id, // condition.liked_id is the loggedin user
					user_1_status:
						existingConversation.user_1 === condition.liked_id
							? UserConvStatus.UNLIKED
							: existingConversation.user_1_status,
					user_2_status:
						existingConversation.user_2 === condition.user_id
							? existingConversation.user_1_status
							: UserConvStatus.UNLIKED,
				});
			}
			return result;
		}
		if (!result) {
			throw new Error('Like not found');
		}
	} catch (err: any) {
		throw err;
	}
};

export const getLikesCount = async (userId: string) => {
	try {
		const result = await repository.findByCondition('likes', {
			user_id: userId,
		});
		return result?.length || 0;
	} catch (err: any) {
		throw err;
	}
};

export const getLikes = async (userId: string) => {
	try {
		const result = await repository.findByCondition('likes', {
			user_id: userId,
		});
		if (!result) {
			throw new Error('No likes found');
		}
		return result;
	} catch (err: any) {
		throw err;
	}
};

export const getLikesWithRelation = async (
	userId: string,
	offset: number,
	limit: number,
) => {
	try {
		const relations: IRelations[] = [
			{
				tableName: 'users',
				foreignKey: 'id',
			},
			{
				tableName: 'profile',
				foreignKey: 'user_id', // users.id -> profiles.user_id
			},
			{
				tableName: 'locations',
				foreignKey: 'user_id',
			},
		];
		const conditions = [
			{
				liked_id: userId,
			},
		];
		const keys = `likes.liked_id = '${userId}'`;
		const likedUsers =
			await repository.findWithRelationsAndConditionsPagination(
				'likes',
				'user_id',
				relations,
				keys,
				offset,
				limit,
			);
		if (!likedUsers) {
			throw new Error('No likes found');
		}
		const apiURL = process.env.API_URL + '/api/';
		likedUsers.forEach(likedUser => {
			likedUser.mainPicture = apiURL + likedUser.mainpicture;
			(likedUser.location = {
				address: likedUser.address,
				lat: likedUser.lat,
				lng: likedUser.lng,
				visibility: likedUser.visibility,
				searchradius: likedUser.searchradius,
				sharelocation: likedUser.sharelocation,
			}),
				[
					'user_id',
					'rtoken',
					'password',
					'otp',
					'otp_expiry',
					'created_at',
					'updated_at',
					'verified',
					'provider',
					'pictures',
					'visibility',
					'address',
					'lat',
					'lng',
					'visibility',
					'searchradius',
					'sharelocation',
					'mainpicture',
				].forEach(key => {
					delete likedUser[key];
				});
		});
		return likedUsers;
	} catch (err: any) {
		throw err;
	}
};

export const hasLikedUser = async (user_id: string, liked_id: string) => {
	try {
		const result = await repository.findByCondition('likes', {
			liked_id,
			user_id,
		});
		if (!result) {
			return false;
		}
		return true;
	} catch (err: any) {
		throw err;
	}
};
