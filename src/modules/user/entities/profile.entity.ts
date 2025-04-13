import {
	createModel,
	createType,
	foreignKey,
} from '../../../shared/models/entity';

const columns = {
	id: 'UUID PRIMARY KEY DEFAULT gen_random_uuid()',
	gender: "gender DEFAULT 'M'",
	bio: 'VarChar(255) DEFAULT NULL',
	interests: 'VarChar(255)[] DEFAULT NULL',
	pictures: 'VarChar(255)[] NOT NULL',
	mainpicture: 'VarChar(255) DEFAULT NULL',
	birthdate: 'Date DEFAULT NULL',
	user_id: 'UUID NOT NULL',
	created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
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

export default {
	syncTable: async () => {
		await createType({ typeName: 'gender', values: ['M', 'F'] });
		const userModel = createModel({
			tableName: 'profile',
			columns,
			foreignKey,
		});
		try {
			await userModel.syncTable();
		} catch (err) {
			console.error('❌ Error syncing profile table:', err);
		}
	},
};
