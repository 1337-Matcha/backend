import { repository } from '../../../repository';
import * as viewerService from './viewers.service';
import * as likesService from './../../like/like.service';

const calculateFameRating = (fame: any) => {
	const { views, likes } = fame;

	const fameScore = views * 0.5 + likes * 2;

	return fameScore;
};

export const getFame = async (id: string): Promise<any> => {
	try {
		const result: any = await repository.findOneByCondition(
			'user_metrics',
			{
				user_id: id,
			},
		);
		if (!result) return 0;
		return result.fame_score || 0;
	} catch (err: any) {
		throw err;
	}
};

export const updateOrInsert = async (id: string): Promise<number> => {
	try {
		const viewsCount = await viewerService.getViewersCount(id);
		const likesCount = await likesService.getLikesCount(id);
		const fame = calculateFameRating({
			views: viewsCount,
			likes: likesCount,
		});
		const viewers = await repository.updateOrInsert(
			'user_metrics',
			{
				views: viewsCount,
				likes: likesCount,
				fame_score: fame,
				user_id: id,
			},
			{
				user_id: id,
			},
		);
		return viewers?.length || 0;
	} catch (err: any) {
		throw err;
	}
};
