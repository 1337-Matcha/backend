import {
	createModel,
	createType,
	foreignKey,
} from '../../../shared/models/entity';

const columns = {
	id: 'UUID PRIMARY KEY DEFAULT gen_random_uuid()',
	user_1: 'UUID NOT NULL',
	user_2: 'UUID NOT NULL',
	last_message_id: 'UUID DEFAULT NULL',
	is_active: 'BOOLEAN DEFAULT TRUE',
	user_1_status: "conv_status DEFAULT 'ACTIVE'",
	user_2_status: "conv_status DEFAULT 'ACTIVE'",
	deactivated_by: 'UUID DEFAULT NULL',
	deactivation_reason: "conv_status DEFAULT 'ACTIVE'",
	created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
	updated_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
};

const foreignKey: foreignKey[] = [
	{
		column: 'user_1',
		refTable: 'users',
		refColumn: 'id',
		onDelete: 'CASCADE',
		onUpdate: 'CASCADE',
	},
	{
		column: 'user_2',
		refTable: 'users',
		refColumn: 'id',
		onDelete: 'CASCADE',
		onUpdate: 'CASCADE',
	},
	{
		column: 'deactivated_by',
		refTable: 'users',
		refColumn: 'id',
		onDelete: 'CASCADE',
		onUpdate: 'CASCADE',
	},
];

export default {
	syncTable: async () => {
		await createType({
			typeName: 'conv_status',
			values: ['ACTIVE', 'UNLIKED', 'BLOCKED'],
		});
		const userModel = createModel({
			tableName: 'conversations',
			columns,
			foreignKey,
		});
		try {
			await userModel.syncTable();
		} catch (err) {
			console.error('❌ Error syncing conversations table:', err);
		}
	},
};
