import { createModel } from '../../../shared/models/entity';

const columns = {
	id: 'SERIAL PRIMARY KEY',
	user_id: 'UUID NOT NULL',
	sexual_orientation: 'VARCHAR(255) NOT NULL',
	preferences: 'VarChar(255)[] DEFAULT NULL',
};

const foreignKey = [
	{
		column: 'user_id',
		refTable: 'users',
		refColumn: 'id',
		onDelete: 'CASCADE',
		onUpdate: 'CASCADE',
	},
];

export default {
	syncTable: async () => {
		const userInterestsModel = createModel({
			tableName: 'sexual_preferences',
			columns,
			foreignKey,
		});

		try {
			await userInterestsModel.syncTable();
		} catch (err) {
			console.error('❌ Error syncing sexual_preferences table:', err);
		}
	},
};
