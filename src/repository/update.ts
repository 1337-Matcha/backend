import logger from './../core/logger/logger';
import { config as pool } from '../core/dbconfig/config';
import pg from 'pg';

const update = async (
	tableName: string,
	data: any,
	condition: any,
	distinct?: boolean,
	dClause: boolean = true,
) => {
	try {
		const keys = Object.keys(data);
		const values = Object.values(data);

		// Construct the SET clause by joining the field names and placeholders
		const setClause = keys
			.map((key, index) => `${key} = $${index + 1}`)
			.join(', ');
		const differentClause = keys
			.map((key, index) =>
				distinct !== undefined && distinct === true
					? `${key} IS DISTINCT FROM $${index + 1}`
					: `${key} != $${index + 1}`,
			)
			.join(' AND ');
		// here i use distinct because if a field is null it will not update
		// the field because comparisons like NULL != $1 always return FALSE because NULL represents an unknown value, and comparisons involving a NULL always return NULL, which is treated as false for the purposes of WHERE.
		// Construct the condition clause (e.g., WHERE id = $...)
		const conditionKeys = Object.keys(condition);
		const conditionValues = Object.values(condition);
		const conditionClause = conditionKeys
			.map((key, index) => `${key} = $${keys.length + index + 1}`)
			.join(' AND ');

		const query = `UPDATE ${tableName} SET ${setClause} WHERE ${conditionClause}
			${dClause ? ` AND ${differentClause}` : ''}`;
		// Combine values from data and condition for the query
		const combinedValues = [...values, ...conditionValues];
		const result = await (pool as pg.Pool).query(query, combinedValues);
		if (result.rowCount === 0) {
			console.log(
				`No record found in ${tableName} with the given condition:`,
				condition,
			);
			return false;
		}
		// logger.info(`Record updated in ${tableName} table.`);
		return result.rowCount !== null && result.rowCount > 0;
	} catch (error) {
		console.error(`Error updating record in ${tableName}:`, error);
		throw error;
	}
};

// updateOrInsert.js
const updateOrInsert = async (tableName: string, data: any, condition: any) => {
	try {
		// Check if the record exists based on the condition
		const conditionKeys = Object.keys(condition);
		const conditionValues = Object.values(condition);
		const conditionClause = conditionKeys
			.map((key, index) => `${key} = $${index + 1}`)
			.join(' AND ');

		const checkQuery = `SELECT * FROM ${tableName} WHERE ${conditionClause}`;
		console.log(checkQuery, conditionValues);
		const checkResult = await (pool as pg.Pool).query(
			checkQuery,
			conditionValues,
		);

		if (checkResult.rows.length > 0) {
			// Record exists, perform an update
			const keys = Object.keys(data);
			const values = Object.values(data);

			const setClause = keys
				.map(
					(key, index) =>
						`${key} = $${index + 1 + conditionKeys.length}`,
				)
				.join(', ');

			// Update query: number of placeholders should match the number of values provided
			const updateQuery = `UPDATE ${tableName} SET ${setClause} WHERE ${conditionClause}`;

			// Combine the values for update: first the condition values, then the data values
			const combinedValues = [...conditionValues, ...values]; // conditionValues first

			// Execute the update query
			const updateResult = await (pool as pg.Pool).query(
				updateQuery,
				combinedValues,
			);
			// console.log(`Record updated in ${tableName} table.`);
			return updateResult.rowCount !== null && updateResult.rowCount > 0; // Return true if any row was updated
		} else {
			// Record does not exist, perform an insert
			const keys = Object.keys(data);
			const values = Object.values(data);

			const columns = keys.join(', ');
			const placeholders = keys
				.map((_, index) => `$${index + 1}`)
				.join(', ');

			const insertQuery = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders}) RETURNING *`;
			const insertResult = await (pool as pg.Pool).query(
				insertQuery,
				values,
			);

			console.log(`New record inserted in ${tableName} table.`);
			return insertResult.rows[0]; // Return the newly inserted record
		}
	} catch (error) {
		console.error(
			`Error in updateOrInsert operation for ${tableName}:`,
			error,
		);
		throw error;
	}
};

export { updateOrInsert, update };
