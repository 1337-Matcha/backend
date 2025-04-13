import {
	createModel,
	createType,
	foreignKey,
} from '../../../shared/models/entity';

const columns = {
	id: 'UUID PRIMARY KEY DEFAULT gen_random_uuid()',
	sender_id: 'UUID NOT NULL',
	receiver_id: 'UUID NOT NULL',
	type: 'notification_type NOT NULL',
	content: 'JSONB DEFAULT NULL',
	is_read: 'BOOLEAN DEFAULT FALSE',
	created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
	updated_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
};

const foreignKeys: foreignKey[] = [
	{
		column: 'sender_id',
		refTable: 'users',
		refColumn: 'id',
		onDelete: 'CASCADE',
		onUpdate: 'CASCADE',
	},
	{
		column: 'receiver_id',
		refTable: 'users',
		refColumn: 'id',
		onDelete: 'CASCADE',
		onUpdate: 'CASCADE',
	},
];

export default {
	syncTable: async () => {
		// Create custom type for notification types
		await createType({
			typeName: 'notification_type',
			values: ['MESSAGE', 'LIKE', 'PROFILE_VIEW'],
		});

		const notificationModel = createModel({
			tableName: 'notifications',
			columns,
			foreignKey: foreignKeys,
		});

		try {
			await notificationModel.syncTable();
			console.log('✅ Notification table synced successfully');
		} catch (err) {
			console.error('❌ Error syncing notification table:', err);
		}
	},
};
