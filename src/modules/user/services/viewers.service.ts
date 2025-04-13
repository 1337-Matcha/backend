import { repository } from '../../../repository';
import { IRelations } from '../../../shared/utils/interfaces';
import * as userMetrics from './user-metrics.service';

export const getViewers = async (id: string): Promise<any> => {
	try {
		const viewers = await repository.findByCondition('profileviews', {
			user_id: id,
		});
		return viewers;
	} catch (err: any) {
		throw err;
	}
};
export const getViewersCount = async (id: string): Promise<number> => {
	try {
		const viewers = await repository.findByCondition('profileviews', {
			user_id: id,
		});
		return viewers?.length || 0;
	} catch (err: any) {
		throw err;
	}
};
export const getViewersWithRelations = async (
	id: string,
	offset: number,
	limit: number,
): Promise<any[]> => {
	try {
		const relations: IRelations[] = [
			{
				tableName: 'users',
				foreignKey: 'id', // viewerid -> users.id
			},
			{
				tableName: 'profile',
				foreignKey: 'user_id', // users.id -> profiles.user_id
			},
			{
				tableName: 'locations',
				foreignKey: 'user_id',
			},
		];

		const conditions = [{ user_id: id }];

		const keys = `profileviews.user_id = '${id}'`;

		let viewers = await repository.findWithRelationsAndConditionsPagination(
			'profileviews',
			'viewerid', // join column from profileviews
			relations,
			keys,
			offset,
			limit,
		);
		const apiURL = process.env.API_URL + '/api/';

		viewers.forEach(viewer => {
			viewer.mainPicture = apiURL + viewer.mainpicture;
			(viewer.location = {
				address: viewer.address,
				lat: viewer.lat,
				lng: viewer.lng,
				visibility: viewer.visibility,
				searchradius: viewer.searchradius,
				sharelocation: viewer.sharelocation,
			}),
				[
					'user_id',
					'rtoken',
					'password',
					'otp',
					'otp_expiry',
					'created_at',
					'updated_at',
					'verified',
					'provider',
					'pictures',
					'visibility',
					'address',
					'lat',
					'lng',
					'visibility',
					'searchradius',
					'sharelocation',
					'mainpicture',
				].forEach(key => {
					delete viewer[key];
				});
		});

		return viewers;
	} catch (err: any) {
		throw err;
	}
};

export const findRecentView = async (userId: string, viewerId: string) => {
	try {
		const recentView = await repository.findByCondition('profileviews', {
			user_id: userId,
			viewerid: viewerId,
		});
		return recentView;
	} catch (err: any) {
		throw err;
	}
};

export const save = async (body: any) => {
	try {
		const res = await repository.save('profileviews', body);
		const updateMetric = await userMetrics.updateOrInsert(body.viewerid);
		return res;
	} catch (err: any) {
		throw err;
	}
};
