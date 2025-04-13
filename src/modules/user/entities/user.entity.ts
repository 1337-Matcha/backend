import { createModel } from '../../../shared/models/entity';

const columns = {
	id: 'UUID PRIMARY KEY DEFAULT gen_random_uuid()',
	firstName: 'VARCHAR(100) NOT NULL',
	lastName: 'VARCHAR(100) NOT NULL',
	email: 'VARCHAR(100) NOT NULL UNIQUE',
	username: 'VARCHAR(100) NOT NULL',
	password: 'VARCHAR(100) DEFAULT NULL',
	provider: 'VARCHAR(100) DEFAULT NULL',
	rtoken: 'VARCHAR(1000) DEFAULT NULL',
	otp: 'VARCHAR(100) DEFAULT NULL',
	otp_expiry: 'TIMESTAMP DEFAULT NULL',
	verified: 'BOOLEAN DEFAULT FALSE',
	created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
	updated_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
};

const userModel = createModel({
	tableName: 'users',
	columns,
	foreignKey: [],
});

export default {
	syncTable: async () => {
		try {
			await userModel.syncTable();
			// console.log("✅ Synced table for users");
		} catch (err) {
			console.error('❌ Error syncing users table:', err);
		}
	},
};
