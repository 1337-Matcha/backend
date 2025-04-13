import { repository } from '../../../repository';
import { UserConvStatus } from '../../../shared/enums/conversation.enum';
import * as userService from '../../user/services/user.service';

interface CreateConversationDTO {
	user_1: string;
	user_2: string;
	last_message_id: string | null;
	is_active: boolean;
	user_1_status: UserConvStatus;
	user_2_status: UserConvStatus;
	deactivated_by: string | null;
	deactivation_reason: UserConvStatus;
}

export const findOrCreateConversation = async (body: CreateConversationDTO) => {
	try {
		const [user_1, user_2] = [body.user_1, body.user_2].sort();
		const existing = await getConversationByUsers(user_1, user_2);
		if (existing) return existing;

		const result = await repository.save('conversations', {
			...body,
			user_1,
			user_2,
			user_1_status: UserConvStatus.ACTIVE,
			user_2_status: UserConvStatus.ACTIVE,
			deactivation_reason: UserConvStatus.ACTIVE,
			deactivated_by: null,
		});
		return result;
	} catch (err: any) {
		console.error(err);
		throw new Error('Failed to create or retrieve conversation');
	}
};

export const findConversation = async (body: any) => {
	try {
		const [user_1, user_2] = [body.user_1, body.user_2];
		const existing = await getConversationByUsers(user_1, user_2);
		if (existing) return existing;
		else return null;
	} catch (err: any) {
		throw new Error('Error on retrieving Conversation');
	}
};

export const getConversationByUsers = async (user1: string, user2: string) => {
	try {
		const conv1 = await repository.findOneByCondition('conversations', {
			user_1: user1,
			user_2: user2,
		});

		if (conv1) return conv1;

		const conv2 = await repository.findOneByCondition('conversations', {
			user_1: user2,
			user_2: user1,
		});

		return conv2 ?? null;
	} catch (err) {
		console.error('DB error fetching conversation:', err);
		throw new Error('DB error during fetch');
	}
};

export const updateConversation = async (body: any) => {
	try {
		const { id, ...fieldsToUpdate } = body;

		if (!id) {
			throw new Error('id is required');
		}

		const keys = Object.keys(fieldsToUpdate);

		if (keys.length === 0) {
			throw new Error('No fields to update');
		}

		// Dynamically build the SET clause
		const setClauses = keys.map((key, index) => `${key} = $${index + 1}`);
		const values = keys.map(key => fieldsToUpdate[key]);

		const query = `
			UPDATE conversations
			SET ${setClauses.join(', ')}
			WHERE id = $${keys.length + 1}
			RETURNING *
		`;

		values.push(id); // add WHERE id = $n

		const result = await repository.executeSqlQuery(query, values);

		if (result.rows.length > 0) {
			return result.rows[0];
		} else {
			throw new Error('Conversation not found or update failed');
		}
	} catch (err: any) {
		throw err;
	}
};
