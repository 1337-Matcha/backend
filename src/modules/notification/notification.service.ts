import { repository } from '../../repository';

export type NotificationT = 'MESSAGE' | 'LIKE' | 'PROFILE_VIEW';
export interface CreateNotificationDTO {
	sender_id: string;
	receiver_id: string;
	type: NotificationT;
	content: Object;
	is_read: Boolean;
}
interface Notification {
	id: string;
	sender_id: string;
	receiver_id: string;
	type: NotificationT;
	content: any; // Use more specific type if possible
	is_read: boolean;
	created_at: Date;
	updated_at: Date;
	sender_profile?: {
		id: string;
		fullName: string;
		mainPicture: string;
	};
}

export const saveNotification = async (body: CreateNotificationDTO) => {
	try {
		const result = await repository.save('notifications', body);
		const profileQuery = `
			SELECT u.id, u.username, u.firstname, u.lastname, p.mainpicture
			FROM users u
			LEFT JOIN profile p ON u.id = p.user_id
			WHERE u.id = $1
			`;

		const profileResult = await repository.executeSqlQuery(profileQuery, [
			result.sender_id,
		]);
		const userRow = profileResult.rows[0];
		const apiURL = process.env.API_URL + '/api/';

		const notification: Notification = {
			...result,
			created_at: new Date(result.created_at),
			updated_at: new Date(result.updated_at),
			sender_profile: {
				id: userRow.id,
				fullName: `${userRow.firstname} ${userRow.lastname}`,
				mainPicture: apiURL + userRow.mainpicture,
			},
		};

		return notification;
	} catch (err: any) {
		console.error(err);
		throw new Error('Failed to create a notification');
	}
};

export const getUserNotifications = async (
	userId: string,
): Promise<Notification[]> => {
	try {
		const query = `
        SELECT 
          n.*,
          json_build_object(
            'id', u.id,
            'username', u.username,
            'firstname', u.firstname,
            'lastname', u.lastname,
            'main_picture', p.main_picture
          ) as sender_profile
        FROM notifications n
        JOIN users u ON n.sender_id = u.id
        LEFT JOIN profile p ON u.id = p.user_id
        WHERE n.receiver_id = $1
        ORDER BY n.created_at DESC
        LIMIT 50
      `;

		const result = await repository.executeSqlQuery(query, [userId]);

		// Transform the result to proper TypeScript objects
		const notifications: Notification[] = result.rows.map(row => ({
			...row,
			sender_profile: {
				id: row.id,
				fullName: row.firstname + ' ' + row.lastname,
				mainPicture: row.main_picture,
			},
			created_at: new Date(row.created_at),
			updated_at: new Date(row.updated_at),
		}));
		console.log(notifications);

		return notifications;
	} catch (err) {
		console.error('DB error fetching notifications:', err);
		throw new Error('Failed to fetch notifications');
	}
};

export const updateNotification = async (data: {
	id: string;
	is_read: boolean;
}): Promise<any> => {
	try {
		// Build dynamic SET clause based on provided fields
		const setClauses = [];
		const values = [];
		let paramIndex = 1;

		if (data.is_read !== undefined) {
			setClauses.push(`is_read = $${paramIndex++}`);
			values.push(data.is_read);
		}

		// Always update the updated_at timestamp
		setClauses.push(`updated_at = CURRENT_TIMESTAMP`);

		// Add notification ID to values for WHERE clause
		values.push(data.id);

		const query = `
		UPDATE notifications
		SET ${setClauses.join(', ')}
		WHERE id = $${paramIndex}
	  `;

		return await repository.executeSqlQuery(query, values);
	} catch (err) {
		console.error('DB error updating notification:', err);
		throw new Error('Failed to update notification');
	}
};
