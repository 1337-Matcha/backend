import { config as pool } from '../core/dbconfig/config';
import pg from 'pg';

export const save = async (tableName: string, data: any) => {
	try {
		const columns = Object.keys(data).join(', ');
		const values = Object.values(data);

		const placeHolders = values
			.map((_, index) => `$${index + 1}`)
			.join(', ');

		const query = `INSERT INTO ${tableName} (${columns}) VALUES (${placeHolders}) RETURNING *`;
		// console.log(query, values)
		const result = await (pool as pg.Pool).query(query, values);
		// console.log(`Data inserted into ${tableName}`, result.rows[0]);
		return result.rows[0];
	} catch (error: Error | any) {
		if (
			error.message &&
			error.message.startsWith(
				`duplicate key value violates unique constraint`,
			)
		) {
			// console.log(`Error inserting data into ${tableName} details: `, error.detail)
			throw error;
			// throw new UsernameExistsException();
		} else {
			throw error;
			// console.log(`An unexpected error occurred while inserting data into ${tableName}:`, error.message);
		}
	}
};
