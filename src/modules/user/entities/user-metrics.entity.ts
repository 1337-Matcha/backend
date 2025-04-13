import { createModel, foreignKey } from '../../../shared/models/entity';

const columns = {
	id: 'SERIAL PRIMARY KEY',
	user_id: 'UUID UNIQUE NOT NULL',
	views: 'INTEGER DEFAULT 0',
	likes: 'INTEGER DEFAULT 0',
	fame_score: 'FLOAT DEFAULT 0',
	updated_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
};

const foreignKey: foreignKey[] = [
	{
		column: 'user_id',
		refTable: 'users',
		refColumn: 'id',
		onDelete: 'CASCADE',
		onUpdate: 'CASCADE',
	},
];

const model = createModel({ tableName: 'user_metrics', columns, foreignKey });

export default {
	syncTable: async () => {
		try {
			await model.syncTable();
		} catch (err) {
			console.error('❌ Error syncing user_metrics table:', err);
		}
	},
};
