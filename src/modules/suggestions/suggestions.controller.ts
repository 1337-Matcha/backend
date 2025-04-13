import { Response } from 'express';
import HttpStatus from 'http-status';
import { SuggestionQuerySchema } from './search.validation';
import * as suggestionService from './suggestions.service'

export const getSuggestion = async (req: any, res: Response) => {
	try {
		const queryParams = SuggestionQuerySchema.parse(req.query);
        const userId = req.userId;

        const suggestions = await suggestionService.getSuggestions(userId, queryParams);
		
		res.status(HttpStatus.OK).json(suggestions);
	} catch (err: any) {
		console.error('Login error:', err);
		res.status(err.statusCode || HttpStatus.INTERNAL_SERVER_ERROR).json({
			error: err.message,
		});
	}
};