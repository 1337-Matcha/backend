import * as authService from './services/auth.service';
import { LoginDTO } from './dto/login.dto';
import { CreateUserDto } from '../user/dto/user.dto';
import { Request, Response } from 'express';
import HttpStatus from 'http-status';
const cookie = require('cookie');
interface SetAuthCookiesOptions {
	aToken?: string | null;
	rToken?: string | null;
	aTokenMaxAgeSeconds?: number;
	rTokenMaxAgeSeconds?: number;
  }
const setAuthCookies = (
	res: Response,
	{
	  aToken = '',
	  rToken = '',
	  aTokenMaxAgeSeconds = parseInt(process.env.ATOKEN_VALIDITY_DURATION_IN_SECONDS || ''),
	  rTokenMaxAgeSeconds = parseInt(process.env.RTOKEN_VALIDITY_DURATION_IN_SECONDS || ''), // 7 أيام مثلاً
	}: SetAuthCookiesOptions
  ) => {
	const isProd = process.env.NODE_ENV === 'production';
  
	const cookieOptions = {
	  httpOnly: true,
	  secure: isProd,
	  path: '/',
	  sameSite: isProd ? 'None' : 'Lax',
	};
  
	// إذا عاودت تبعت '' (string فارغ) أو null يعني تمسح الكوكي (logout)
	const accessTokenCookie = cookie.serialize('aToken', aToken ?? '', {
	  ...cookieOptions,
	  maxAge: aToken ? aTokenMaxAgeSeconds : 0, // maxAge=0 يمسح الكوكي
	});
  
	const refreshTokenCookie = cookie.serialize('rToken', rToken ?? '', {
	  ...cookieOptions,
	  maxAge: rToken ? rTokenMaxAgeSeconds : 0,
	});
  
	res.setHeader('Set-Cookie', [accessTokenCookie, refreshTokenCookie]);
  };

// Helper function to set CORS headers
const setCorsHeaders = (res: Response) => {
	res.setHeader('Access-Control-Allow-Origin', res.req.headers.origin || '');
	res.setHeader(
		'Access-Control-Allow-Methods',
		'GET, POST, OPTIONS, PUT, PATCH, DELETE',
	);
	res.setHeader(
		'Access-Control-Allow-Headers',
		'X-Requested-With,content-type',
	);
	res.setHeader('Access-Control-Allow-Credentials', 'true');
};

// Login controller
export const login = async (req: Request, res: Response) => {
	try {
		const loginDTO = new LoginDTO(req.body);
		const { aToken, rToken } = await authService.login(loginDTO);
		setCorsHeaders(res);
		setAuthCookies(res, {aToken, rToken});

		res.status(HttpStatus.OK).json({ message: 'Login successful' });
	} catch (err: any) {
		console.error('Login error:', err);
		res.status(err.statusCode || HttpStatus.INTERNAL_SERVER_ERROR).json({
			error: err.message,
		});
	}
};

export const register = async (req: Request, res: Response) => {
	try {
		const createUserDto = new CreateUserDto(req.body);
		const newUser = await authService.register(createUserDto);
		res.status(HttpStatus.CREATED).json({
			message: 'User created successfully',
			user: newUser,
		});
	} catch (err: any) {
		res.status(err.statusCode).json({ error: err.message });
	}
};

export const logout = async (req: Request, res: Response) => {
	try {
		setAuthCookies(res, {}); // Clear cookies by setting them to empty strings
		res.status(HttpStatus.OK).json({ message: 'Logout successful' });
	} catch (err: any) {
		console.error('Logout error:', err);
		res.status(err.statusCode || HttpStatus.INTERNAL_SERVER_ERROR).json({
			error: err.message,
		});
	}
};


export const resetPasswordRequest = async (req: Request, res: Response) => {
	try {
		await authService.resetPasswordRequest(req.body.email);
		res.status(HttpStatus.OK).json({
			message: 'An OTP has been sent to your email, please check',
		});
	} catch (err: any) {
		console.log(err);
		res.status(HttpStatus.BAD_REQUEST).json({
			error: err.message,
		});
	}
};

export const resetPasswordVerification = async (req: any, res: Response) => {
	try {
		const { password } = req.body;
		const userId = req.userId;
		const result = await authService.resetPasswordVerification(
			password,
			userId,
		);
		const csfParam = cookie.serialize('csfParam', '', {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			path: '/',
			sameSite: 'None',
			maxAge: 0,
		});
		res.setHeader('Set-Cookie', [csfParam]);
		res.status(HttpStatus.OK).json({
			message: result,
		});
	} catch (err: any) {
		console.log(err);
		res.status(err.statusCode).json({
			error: err.message,
		});
	}
};

export const verifyEmail = async (req: Request, res: Response) => {
	try {
		const { csf } = req.query;
		if (!csf) {
			throw new Error('Invalid verification link');
		}
		const result = await authService.verifyEmail(csf as string);
		// simply i want to close the tab after verification
		res.send(
			'<script>window.close();</script><h1>Email verified successfully</h1>',
		);
	} catch (err: any) {
		res.status(HttpStatus.UNAUTHORIZED).json({
			error: err.message,
		});
	}
};

export const verifyOTP = async (req: Request, res: Response) => {
	try {
		const { otp, email } = req.body;
		const resetToken = await authService.verifyOTP(otp, email);
		const resetCookie = cookie.serialize('csfParam', resetToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			path: '/',
			sameSite: 'None',
			maxAge:
				parseInt(
					process.env.RTOKEN_VALIDITY_DURATION_IN_SECONDS || '10',
				) * 1000,
		});
		res.setHeader('Set-Cookie', [resetCookie]);
		res.status(HttpStatus.OK).json({
			message: 'OTP verified successfully',
		});
	} catch (err: any) {
		res.status(HttpStatus.UNAUTHORIZED).json({
			error: err.message,
		});
	}
};

// Google authentication controller
export const googleAuthentication = async (req: Request, res: Response) => {
	const data = req.user as any;
	const clientUrl = process.env.CLIENT_URL || '';

	if (!data.user || !data.aToken || !data.rToken) {
		return res.redirect(`${clientUrl}/login?error=GoogleLoginFailed`);
	}

	setCorsHeaders(res);
	setAuthCookies(res, {aToken: data.aToken, rToken: data.rToken});

	return res.redirect(`${clientUrl}/dashboard`);
};

export const tokenInfo = async (req: Request, res: Response) => {
	try {
		const { aToken } = req.cookies;
		const tokenInfo = await authService.tokenInfo(aToken);
		res.status(HttpStatus.OK).json(tokenInfo);
	} catch (err: any) {
		res.status(HttpStatus.UNAUTHORIZED).json({ error: err.message });
	}
};
