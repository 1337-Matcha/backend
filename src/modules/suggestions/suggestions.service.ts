import * as userService from './../user/services/user.service';
import { repository } from './../../repository';

export const getSuggestions = async (userId: string, queryParams: any) => {
	const {
		sortBy,
		sortOrder,
		minAge,
		maxAge,
		minFameRating,
		maxDistance,
		tags,
		page,
		limit,
	} = queryParams;

	try {
		const user = await userService.getUserWithRelationsNEW(userId);
		if (!user) {
			throw new Error('User not found');
		}
		console.log('Current User:', user);
		const { sqlQuery, params } = buildBaseQuery(user, queryParams);
		console.log('SQL Query:', sqlQuery, params);
		const result = await repository.executeSqlQuery(sqlQuery, params);
		// console.log('result', result);
		return result.rows;
	} catch (error: any) {
		console.error('Error fetching suggestions:', error);
		throw {
			statusCode: 500,
			message: 'Internal server error while fetching suggestions',
			error: error.message || 'Unknown error',
		};
	}
};

function buildBaseQuery(currentUser: any, query: any) {
	const userOrientation = currentUser.sexual_preferences?.sexual_orientation;
	let sqlQuery = `
	SELECT
	  profile.*,
	  users.*,
	  locations.*,
	  sexual_preferences.*,
	  user_metrics.*,
	  (
		6371 * acos(
		  cos(radians($2)) * cos(radians(locations.lat)) *
		  cos(radians(locations.lng) - radians($3)) +
		  sin(radians($2)) * sin(radians(locations.lat))
		)
	  ) AS distance
	FROM profile
	LEFT JOIN users ON profile.user_id = users.id
	LEFT JOIN locations ON locations.user_id = users.id
	LEFT JOIN sexual_preferences ON users.id = sexual_preferences.user_id
	LEFT JOIN user_metrics ON users.id = user_metrics.user_id
	WHERE
	  profile.user_id != $1
	  AND profile.pictures IS NOT NULL
	  AND array_length(profile.pictures, 1) > 0
  `;
	const params = [
		currentUser.profile.user_id,
		currentUser.locations.lat,
		currentUser.locations.lng,
	];
	let paramIndex = 4; // عاود ترقيم المتغيرات للـ SQL (لأن $3 محجوز)
	if (userOrientation === 'heterosexual') {
		// heterosexual woman => looking for men attracted to women
		// currentUser.gender assumed to be 'F' or 'M'
		if (currentUser.profile.gender === 'F') {
			sqlQuery += ` AND profile.gender = 'M' AND (sexual_preferences.sexual_orientation = 'heterosexual' OR sexual_preferences.sexual_orientation = 'bisexual' OR sexual_preferences.sexual_orientation = 'pansexual') `;
		} else if (currentUser.profile.gender === 'M') {
			// heterosexual man => looking for women attracted to men
			sqlQuery += ` AND profile.gender = 'F' AND (sexual_preferences.sexual_orientation = 'heterosexual' OR sexual_preferences.sexual_orientation = 'bisexual' OR sexual_preferences.sexual_orientation = 'pansexual') `;
		}
	} else if (userOrientation === 'homosexual') {
		// homosexual woman => looking for women attracted to women
		if (currentUser.profile.gender === 'F') {
			sqlQuery += ` AND profile.gender = 'F' AND (sexual_preferences.sexual_orientation = 'homosexual' OR sexual_preferences.sexual_orientation = 'bisexual' OR sexual_preferences.sexual_orientation = 'pansexual') `;
		} else if (currentUser.profile.gender === 'M') {
			// homosexual man => looking for men attracted to men
			sqlQuery += ` AND profile.gender = 'M' AND (sexual_preferences.sexual_orientation = 'homosexual' OR sexual_preferences.sexual_orientation = 'bisexual' OR sexual_preferences.sexual_orientation = 'pansexual') `;
		}
	} else {
		// bisexual or pansexual or unspecified => no gender restriction
		sqlQuery += ` AND (sexual_preferences.sexual_orientation = 'bisexual' OR sexual_preferences.sexual_orientation = 'pansexual' OR sexual_preferences.sexual_orientation = 'heterosexual' OR sexual_preferences.sexual_orientation = 'homosexual' OR sexual_preferences.sexual_orientation IS NULL) `;
	}
	if (query.minAge) {
		sqlQuery += ` AND EXTRACT(YEAR FROM AGE(CURRENT_DATE, profile.birthdate)) >= $${paramIndex}`;
		params.push(query.minAge);
		paramIndex++;
	}

	if (query.maxAge) {
		sqlQuery += ` AND EXTRACT(YEAR FROM AGE(CURRENT_DATE, profile.birthdate)) <= $${paramIndex}`;
		params.push(query.maxAge);
		paramIndex++;
	}
	if (query.minFameRating) {
		sqlQuery += `
		  AND users.id IN (
			SELECT user_id FROM user_metrics WHERE fame_score >= $${paramIndex}
		  )
		`;
		params.push(query.minFameRating);
		paramIndex++;
	}
	if (query.maxDistance) {
		sqlQuery += ` AND (
		  6371 * acos(
			cos(radians($2)) * cos(radians(locations.lat)) *
			cos(radians(locations.lng) - radians($3)) +
			sin(radians($2)) * sin(radians(locations.lat))
		  )
		) <= $${paramIndex}`;
		params.push(query.maxDistance);
		paramIndex++;
	}

	if (query.tags && Array.isArray(query.tags) && query.tags.length > 0) {
		sqlQuery += ` AND profile.interests && $${paramIndex}::varchar[]`;
		params.push(query.tags);
		paramIndex++;
	}

	if (
		query.lookingFor &&
		Array.isArray(query.lookingFor) &&
		query.lookingFor.length > 0
	) {
		sqlQuery += ` AND profile.looking_for && $${paramIndex}::varchar[]`;
		params.push(query.lookingFor);
		paramIndex++;
	}

	// Add more filters (minFameRating, maxDistance, tags, etc) similarly

	// Example: sorting
	// console.log(query.sortBy)
	if (query.sortBy) {
		const sortOrder = query.sortOrder === 'DESC' ? 'DESC' : 'ASC';
		// تأكد أن sortBy حقيقي (لتجنب SQL injection)
		const allowedSortFields = ['age', 'fame_rating', 'distance'];
		if (allowedSortFields.includes(query.sortBy)) {
			sqlQuery += ` ORDER BY users.${query.sortBy} ${sortOrder}`;
		}
	} else {
		sqlQuery += ` ORDER BY profile.created_at DESC`;
	}

	// Pagination
	const limit = query.limit ? parseInt(query.limit) : 20;
	const page = query.page ? parseInt(query.page) : 1;
	const offset = (page - 1) * limit;
	sqlQuery += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
	params.push(limit, offset);
	console.log(sqlQuery, params);

	return { sqlQuery, params };
}
