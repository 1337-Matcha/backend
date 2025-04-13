import {
	createModel,
	createType,
	foreignKey,
} from '../../../shared/models/entity';

const columns = {
	id: 'UUID PRIMARY KEY DEFAULT gen_random_uuid()',
	sender_id: 'UUID NOT NULL',
	target_id: 'UUID NOT NULL',
	content: 'TEXT DEFAULT NULL',
	conversation_id: 'UUID NOT NULL',
	type: "type DEFAULT 'TEXT'",
	is_seen: 'BOOLEAN DEFAULT FALSE',
	created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
	updated_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
};

const foreignKey: foreignKey[] = [
	{
		column: 'sender_id',
		refTable: 'users',
		refColumn: 'id',
		onDelete: 'CASCADE',
		onUpdate: 'CASCADE',
	},
	{
		column: 'target_id',
		refTable: 'users',
		refColumn: 'id',
		onDelete: 'CASCADE',
		onUpdate: 'CASCADE',
	},
	{
		column: 'conversation_id',
		refTable: 'conversations',
		refColumn: 'id',
		onDelete: 'CASCADE',
		onUpdate: 'CASCADE',
	},
];

export default {
	syncTable: async () => {
		await createType({
			typeName: 'type',
			values: ['TEXT', 'AUDIO', 'PICTURE', 'DOCUMENT'],
		});
		const userModel = createModel({
			tableName: 'chat',
			columns,
			foreignKey,
		});
		try {
			await userModel.syncTable();
		} catch (err) {
			console.error('❌ Error syncing chat table:', err);
		}
	},
};
