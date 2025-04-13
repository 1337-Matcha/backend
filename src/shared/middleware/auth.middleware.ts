import jwt from 'jsonwebtoken';
// import cookie from 'cookie';
const cookie = require('cookie');
import { CryptoUtil } from '../utils/crypto.utils';
import * as userService from '../../modules/user/services/user.service';
import { UserNotFoundException } from '../exceptions/user.exception';
import { AccessTokenNotFoundException } from '../exceptions/auth.exception';
import { NextFunction, Response } from 'express';
import HttpStatus from 'http-status';

export default async function authMiddleware(
	req: any,
	res: any,
	next: NextFunction,
) {
	const cookies = req.cookies;
	const { rToken, aToken } = cookies;

	try {
		if (!aToken) {
			throw new AccessTokenNotFoundException();
		}
		const decoded = jwt.verify(aToken, process.env.ATOKEN_SECRET || '');
		const decryptedSub = CryptoUtil.decrypt(
			decoded.sub,
			process.env.PAYLOAD_ENCRYPTION_KEY || '',
		);
		req.userId = decryptedSub;
		next();
	} catch (err: any) {
		if (
			(err.name === 'TokenExpiredError' && rToken) ||
			(err.name === 'AccessTokenNotFoundException' && rToken)
		) {
			try {
				const decoded = jwt.verify(
					rToken,
					process.env.RTOKEN_SECRET || '',
				);
				const decryptedSub = CryptoUtil.decrypt(
					decoded.sub,
					process.env.PAYLOAD_ENCRYPTION_KEY || '',
				);
				const user = await userService.findById(decryptedSub);
				if (!user) throw new UserNotFoundException();

				const newAccessToken = jwt.sign(
					{ sub: decoded.sub },
					process.env.ATOKEN_SECRET || '',
					{
						expiresIn: parseInt(
							process.env.ATOKEN_VALIDITY_DURATION || '0',
						),
					},
				);
				setCookies(
					'aToken',
					parseInt(
						process.env.ATOKEN_VALIDITY_DURATION_IN_SECONDS || '0',
					),
					newAccessToken,
					res,
				);
				req.userId = decryptedSub;
				next();
			} catch (refreshError) {
				clearCookies(res);
				res.status(401).json({
					error: 'Session duration expired. Please login again.',
				});
			}
		} else if (
			err.name === 'TokenExpiredError' ||
			err.name === 'JsonWebTokenError'
		) {
			clearCookies(res);
			res.status(HttpStatus.UNAUTHORIZED).json({
				error: 'Session expired. Please login again.',
			});
		} else {
			clearCookies(res);
			res.status(HttpStatus.UNAUTHORIZED).json({
				error: err.message,
			});
		}
	}
}

const clearCookies = (res: any) => {
	const access_token = cookie.serialize('aToken', '', {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		path: '/',
		sameSite: 'strict',
		maxAge: 0,
	});
	const refresh_token = cookie.serialize('rToken', '', {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		path: '/',
		sameSite: 'strict',
		maxAge: 0,
	});
	res.setHeader('Set-Cookie', [access_token, refresh_token]);
};

export const setCookies = (
	tName: string,
	duration: number,
	token: string,
	res: Response,
) => {
	res.setHeader(
		'Set-Cookie',
		cookie.serialize(tName, token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			path: '/',
			sameSite: 'strict',
			maxAge: duration,
		}),
	);
};
