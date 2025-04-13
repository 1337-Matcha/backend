import { createModel } from '../../../shared/models/entity';

const columns = {
	id: 'SERIAL PRIMARY KEY',
	user_id: 'UUID NOT NULL',
	address: 'VARCHAR(255) NOT NULL',
	lat: 'FLOAT NOT NULL',
	lng: 'FLOAT NOT NULL',
	visibility: "VARCHAR(50) NOT NULL DEFAULT 'EXACT'",
	searchRadius: 'FLOAT NOT NULL DEFAULT 1000',
	shareLocation: 'BOOLEAN NOT NULL DEFAULT TRUE',
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
			tableName: 'locations',
			columns,
			foreignKey,
		});

		try {
			await userInterestsModel.syncTable();
		} catch (err) {
			console.error('❌ Error syncing locations table:', err);
		}
	},
};
