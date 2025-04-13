import { config as pool } from '../core/dbconfig/config';
import pg from 'pg';

/**
 * Executes a raw SQL query against the PostgreSQL database.
 * @param query - The SQL query string to execute.
 * @param params - Optional array of query parameters for parameterized queries.
 * @returns The result of the query as a pg.QueryResult.
 */
export const executeSqlQuery = async (
	query: string,
	params: any[] = [],
): Promise<pg.QueryResult<any>> => {
	try {
		// console.log(query, params);
		const result = await (pool as pg.Pool).query(query, params);
		return result;
	} catch (error) {
		console.error('Database query error:', error);
		throw error;
	}
};
