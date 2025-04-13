import { repository } from '../../../repository';
import { IRelations } from '../../../shared/utils/interfaces';
import bcrypt from 'bcrypt';
import { CreateUserDto, GetUserWithRelationsDTO } from '../dto/user.dto';

const save = async (userData: CreateUserDto) => {
	try {
		// Create a copy of the user data to avoid mutating the original object
		const userDataCopy = { ...userData, email: userData.email.toLowerCase() };

		// Hash the password if it exists
		if (userDataCopy.password) {
			userDataCopy.password = await hashPassword(userDataCopy.password);
		}

		// Save the user data to the repository
		const newUser = await repository.save('users', userDataCopy);
		return newUser;
	} catch (error) {
		// Re-throw the error for the caller to handle
		throw error;
	}
};

const findByEmail = async (email: string): Promise<any> => {
	try {
		const user = await repository.findOneByCondition('users', { email });
		return user;
	} catch (error) {
		throw error;
	}
};

const findById = async (id: string) => {
	try {
		const user = await repository.findOneByCondition('users', { id });
		return user;
	} catch (error) {
		throw error;
	}
};

const hashPassword = async (password: any) => {
	try {
		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);
		return hashedPassword;
	} catch (error) {
		console.log(error);
		return null;
	}
};

const comparePassword = async (password: string, hashedPassword: string) => {
	try {
		return await bcrypt.compare(password, hashedPassword);
	} catch (error) {
		throw error;
	}
};

const update = async (
	data: any,
	condition: any,
	distinct: boolean,
	differentClause: boolean = true,
) => {
	try {
		return await repository.update(
			'users',
			data,
			condition,
			distinct,
			differentClause,
		);
	} catch (error) {
		throw error;
	}
};

const getAllUsersWithRelations = async () => {
	const relations: IRelations[] = [
		{
			tableName: 'profile',
			foreignKey: 'user_id',
		},
	];
	const res = await repository.findWithRelations('users', 'id', relations);
	res.map(row => {
		delete row.id;
		delete row.password;
	});
	return res;
};

const getUserWithRelations = async (id: string) => {
	const relations: IRelations[] = [
		{
			tableName: 'profile',
			foreignKey: 'user_id',
		},
		{
			tableName: 'locations',
			foreignKey: 'user_id',
		},
		{
			tableName: 'sexual_preferences',
			foreignKey: 'user_id',
		},
	];
	const res = await repository.findOneWithRelations(
		'users',
		'id',
		id,
		relations,
	);
	delete res.password;
	delete res.rtoken;
	delete res.otp;
	delete res.otp_expiry;
	delete res.created_at;
	delete res.updated_at;
	delete res.provider;
	delete res.email;
	delete res.verified;
	return transformUserData(res);
};

export const getUserWithRelationsNEW = async (id: string) => {
	const relations: IRelations[] = [
		{
			tableName: 'profile',
			foreignKey: 'user_id',
		},
		{
			tableName: 'locations',
			foreignKey: 'user_id',
		},
		{
			tableName: 'sexual_preferences',
			foreignKey: 'user_id',
		},
	];
	const res = await repository.findOneWithRelationsSeparateQueries(
		'users',
		'id',
		id,
		relations,
	);
	console.log('-------------------------------------------------getUserWithRelationsNEW', res);
	delete res.users;
	return res;
};

function transformUserData(raw: any): any {
	const apiURL = process.env.API_URL + '/api/';
	raw.pictures = raw.pictures?.map((picture: string) => {
		return apiURL + picture;
	});
	return {
		id: raw.user_id,
		firstname: raw.firstname,
		lastname: raw.lastname,
		username: raw.username,
		gender: raw.gender,
		birthdate: raw.birthdate ?? '',
		sexualPreferences: raw.preferences || [],
		sexualOrientation: raw.sexual_orientation,
		bio: raw.bio,
		interests: raw.interests || [],
		location: {
			address: raw.address,
			lat: raw.lat,
			lng: raw.lng,
			visibility: raw.visibility,
			searchRadius: raw.searchradius,
			shareLocation: raw.sharelocation,
		},
		pictures: raw.pictures || [],
		mainPicture: apiURL + raw.mainpicture || null,
	};
}

export const saveUserWithRelations = async (
	userProfile: GetUserWithRelationsDTO,
) => {
	try {
	} catch (error) {
		throw error;
	}
};

export const searchUsersProfile = async (query: string) => {
	try {
		const relations: IRelations[] = [
			{
				tableName: 'profile',
				foreignKey: 'user_id',
			},
		];
		const condition = `(users.username ILIKE '%${query}%' OR 
			users.email ILIKE '%${query}%' OR 
			CONCAT(users.firstname, ' ', users.lastname) ILIKE '%${query}%') OR
			users.firstname ILIKE '%${query}%' OR users.lastname ILIKE '%${query}%'
			`;
		const users = await repository.findWithRelationsAndConditions(
			'users',
			'id',
			relations,
			condition,
		);
		return users.map(user => transformUserData(user));
	} catch (error) {
		throw error;
	}
};

export {
	save,
	findByEmail,
	comparePassword,
	findById,
	update,
	getAllUsersWithRelations,
	hashPassword,
	getUserWithRelations,
};
