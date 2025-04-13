import { config as pool } from '../core/dbconfig/config';
import pg from 'pg';
import { IRelations } from '../shared/utils/interfaces';

const findById = async (tableName: string, id: string) => {
	try {
		const query = `SELECT * FROM ${tableName} WHERE id = $1`;
		const result = await (pool as pg.Pool).query(query, [id]);

		if (result.rows.length === 0) {
			return null; // No record found
		}
		return result.rows[0];
	} catch (error) {
		console.error(`Error finding record by ID in ${tableName}`, error);
		throw error;
	}
};

// Find all records
const findAll = async (tableName: string) => {
	try {
		const query = `SELECT * FROM ${tableName}`;
		const result = await (pool as pg.Pool).query(query);
		return result.rows;
	} catch (error) {
		console.error(`Error finding all records in ${tableName}`, error);
		throw error;
	}
};

// Find one record based on a condition
const findOne = async (
	tableName: string,
	conditionColumn: string,
	value: string,
) => {
	try {
		const query = `SELECT * FROM ${tableName} WHERE ${conditionColumn} = $1`;
		const result = await (pool as pg.Pool).query(query, [value]);

		if (result.rows.length === 0) {
			return null; // No record found
		}
		return result.rows[0];
	} catch (error) {
		console.error(
			`Error finding record in ${tableName} by ${conditionColumn}`,
			error,
		);
		throw error;
	}
};

const findOneByCondition = async (tableName: string, condition: any) => {
	try {
		const conditionKeys = Object.keys(condition);
		const conditionValues = Object.values(condition);

		const conditionClause = conditionKeys
			.map((key, index) => `${key} = $${index + 1}`)
			.join(' AND ');
		const query = `SELECT * FROM ${tableName} WHERE ${conditionClause} LIMIT 1`;

		const result = await (pool as pg.Pool).query(query, conditionValues);

		if (result.rows.length > 0) {
			// console.log(`Found ${result.rows.length} record(s) in ${tableName}`);
			return result.rows[0];
		} else {
			// console.log(`No records found in ${tableName} matching condition`);
			return null;
		}
	} catch (error) {
		console.error(`Error in findOneByCondition for ${tableName}:`, error);
		throw error;
	}
};

const findByCondition = async (tableName: string, condition: any) => {
	try {
		const conditionKeys = Object.keys(condition);
		const conditionValues = Object.values(condition);

		const conditionClause = conditionKeys
			.map((key, index) => `${key} = $${index + 1}`)
			.join(' AND ');
		const query = `SELECT * FROM ${tableName} WHERE ${conditionClause}`;
		// console.log(query, conditionValues);
		const result = await (pool as pg.Pool).query(query, conditionValues);
		if (result.rows.length > 0) {
			return result.rows;
		} else {
			// console.log(`No records found in ${tableName} matching condition`);
			return null;
		}
	} catch (error) {
		console.error(`Error in findByCondition for ${tableName}:`, error);
		throw error;
	}
};

const findOneWithRelations = async (
	tableName: string,
	primaryKey: string,
	primaryKeyValue: string | number,
	relations: IRelations[],
) => {
	try {
		// Generate all JOINs
		const joinClauses = relations
			.map(
				relation =>
					`LEFT JOIN ${relation.tableName} ON ${tableName}.${primaryKey} = ${relation.tableName}.${relation.foreignKey}`,
			)
			.join(' ');

		const query = `
			SELECT * FROM ${tableName}
			${joinClauses}
			WHERE ${tableName}.${primaryKey} = $1
			LIMIT 1;
		`;
		const result = await (pool as pg.Pool).query(query, [primaryKeyValue]);
		return result.rows[0];
	} catch (err: any) {
		console.error(
			`Error finding record with relations in ${tableName}`,
			err,
		);
		throw err;
	}
};
export const findOneWithRelationsSeparateQueries = async (
	tableName: string,
	primaryKey: string,
	primaryKeyValue: string | number,
	relations: IRelations[],
) => {
	try {
		// Get main record
		const mainQuery = `SELECT * FROM ${tableName} WHERE ${primaryKey} = $1 LIMIT 1`;
		const mainResult = await (pool as pg.Pool).query(mainQuery, [
			primaryKeyValue,
		]);

		if (!mainResult.rows[0]) return null;

		const result: any = {
			[tableName]: mainResult.rows[0],
		};

		// Get related records
		for (const relation of relations) {
			const relatedQuery = `SELECT * FROM ${relation.tableName} WHERE ${relation.foreignKey} = $1`;
			const relatedResult = await (pool as pg.Pool).query(relatedQuery, [
				primaryKeyValue,
			]);
			// If it's a one-to-one relationship, return single object
			// If it's one-to-many, return array
			result[relation.tableName] =
				relatedResult.rows.length === 1
					? relatedResult.rows[0]
					: relatedResult.rows;
		}

		return result;
	} catch (err: any) {
		console.error(
			`Error finding record with relations in ${tableName}`,
			err,
		);
		throw err;
	}
};

const findWithRelations = async (
	tableName: string,
	primaryKey: string,
	relations: IRelations[],
) => {
	try {
		const relationConditions = relations
			.map(
				relation =>
					`${tableName}.${primaryKey} = ${relation.tableName}.${relation.foreignKey}`,
			)
			.join(' AND ');
		const query = `SELECT * FROM ${tableName} LEFT JOIN ${relations[0].tableName}
        ON ${relationConditions};`;
		const result = await (pool as pg.Pool).query(query);
		return result.rows;
	} catch (err: any) {
		console.error(
			`Error finding records with relations in ${tableName}`,
			err,
		);
		throw err;
	}
};
const findWithRelationsAndConditions = async (
	tableName: string,
	primaryKey: string,
	relations: IRelations[],
	condition: string,
) => {
	try {
		// Start with the base table
		let query = `SELECT * FROM ${tableName} `;

		// Add JOINs for each relation
		relations.forEach(relation => {
			query += `JOIN ${relation.tableName} ON ${tableName}.${primaryKey} = ${relation.tableName}.${relation.foreignKey} `;
		});

		// Add WHERE clause
		query += `WHERE ${condition};`;
		console.log('query', query);
		const result = await (pool as pg.Pool).query(query);
		return result.rows;
	} catch (err: any) {
		console.error(
			`Error finding records with relations in ${tableName}`,
			err,
		);
		throw err;
	}
};

const findWithRelationsAndConditionsPagination = async (
	tableName: string,
	primaryKey: string,
	relations: IRelations[],
	condition: string,
	offset: number = 0,
	limit: number = 5,
) => {
	try {
		// Start with the base query
		let query = `SELECT * FROM ${tableName} `;

		// Add JOINs
		relations.forEach(relation => {
			query += `JOIN ${relation.tableName} ON ${tableName}.${primaryKey} = ${relation.tableName}.${relation.foreignKey} `;
		});

		// Add WHERE condition
		query += `WHERE ${condition} `;

		// Add LIMIT and OFFSET for pagination
		query += `LIMIT ${limit} OFFSET ${offset};`;

		const result = await (pool as pg.Pool).query(query);
		return result.rows;
	} catch (err: any) {
		console.error(
			`Error finding records with relations in ${tableName}`,
			err,
		);
		throw err;
	}
};

// give me example of how to use this function

const count = async (tableName: string) => {
	try {
		const query = `SELECT COUNT(*) FROM ${tableName}`;
		const result = await (pool as pg.Pool).query(query);

		return parseInt(result.rows[0].count);
	} catch (error) {
		console.error(`Error counting records in ${tableName}`, error);
		throw error;
	}
};

export {
	findById,
	findAll,
	findOne,
	findOneByCondition,
	count,
	findWithRelations,
	findByCondition,
	findWithRelationsAndConditions,
	findOneWithRelations,
	findWithRelationsAndConditionsPagination,
};
