import * as authService from './services/auth.service';
import { LoginDTO } from './dto/login.dto';
import { CreateUserDto } from '../user/dto/user.dto';
import * as cookie from 'cookie';
import { Request, Response } from 'express';
import HttpStatus from 'http-status';
// import { Request, Response } from 'express';
import axios from 'axios';

import { OAuth2Client } from 'google-auth-library';
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
export const login = async (req: Request, res: Response) => {
	try {
		const loginDTO = new LoginDTO(req.body);
		const { aToken, rToken } = await authService.login(loginDTO);
		const access_token = cookie.serialize('aToken', aToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			path: '/',
			sameSite: 'strict',
			maxAge:
				parseInt(
					process.env.ATOKEN_VALIDITY_DURATION_IN_SECONDS || '10',
				) * 1000,
		});
		const refresh_token = cookie.serialize('rToken', rToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			path: '/',
			sameSite: 'strict',
			maxAge:
				parseInt(
					process.env.RTOKEN_VALIDITY_DURATION_IN_SECONDS || '10',
				) * 1000,
		});
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.setHeader(
			'Access-Control-Allow-Methods',
			'GET, POST, OPTIONS, PUT, PATCH, DELETE',
		);
		res.setHeader(
			'Access-Control-Allow-Headers',
			'X-Requested-With,content-type',
		);
		res.setHeader('Access-Control-Allow-Credentials', 'true');
		res.setHeader('Set-Cookie', [access_token, refresh_token]);
		res.status(HttpStatus.OK).json({
			message: 'Login successful',
		});
	} catch (err: any) {
		console.log(err);
		res.status(err.statusCode).json({ error: err.message });
	}
};

export const register = async (req: Request, res: Response) => {
	try {
		const createUserDto = new CreateUserDto(req.body);
		const newUser = await authService.register(createUserDto);
		res.status(
			HttpStatus.CREATED
		).json({
			message: 'User created successfully',
			user: newUser,
		});
	} catch (err: any) {
		res.status(err.statusCode).json({ error: err.message });
	}
};

export const resetPasswordRequest = async (req: Request, res: Response) => {
	try {
		await authService.resetPasswordRequest(req.body.email);
		res.status(
			HttpStatus.OK
		).json({
			message: 'An OTP has been sent to your email, please check',
		});
	} catch (err: any) {
		console.log(err);
		res.status(
			HttpStatus.BAD_REQUEST
		).json({
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
			sameSite: 'strict',
			maxAge: 0
		});
		res.setHeader('Set-Cookie', [csfParam]);
		res.status(HttpStatus.OK).json({
			message: result,
		});
	} catch (err: any) {
		console.log(err);
		res.status(HttpStatus.UNAUTHORIZED).json({
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
			sameSite: 'strict',
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

export const googleAuthentication = async (req: Request, res: Response) => {
	const userData = req.user as any;
	console.log('req Cookies -> ', req.cookies);
	const firstLogin = req.cookies.firstLogin;
	const access_token = req.cookies.access_token;
	const refreshToken = req.cookies.refreshToken;
	res.cookie('firstLogin', firstLogin);
	res.cookie('access_token', access_token);
	res.cookie('refreshToken', refreshToken);
	if (!userData || !userData.token) {
		return res.redirect('http://localhost:3000/login?error=NoToken');
	}
	// console.log(res.cookie);
	return res.send('<html><body>IT\'s working</body></html>')
}
