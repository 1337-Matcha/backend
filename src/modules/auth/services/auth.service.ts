import * as userService from '../../user/services/user.service';
import {
	InvalidCredentialsException,
	UserAlreadyExistsException,
	UserAuthenticationProvider,
} from '../../../shared/exceptions/user.exception';
import {
	PasswordMatchException,
	PasswordMismatchException,
} from '../../../shared/exceptions/auth.exception';
import jwt from 'jsonwebtoken';
import { CryptoUtil } from '../../../shared/utils/crypto.utils';
import nodemailer from 'nodemailer';
import {
	getResetPasswordEmailTemplate,
	accountVerificationTemplate,
} from '../utils/email.template';
import { LoginDTO } from '../dto/login.dto';
import { CreateUserDto } from '../../user/dto/user.dto';
import { AccountNotVerifiedException } from '../../../shared/exceptions/account.exception';
import * as otpService from './otp.service';
import { RepositoryExceptionUpdate } from '../../../shared/exceptions/repository.exception';

export const login = async (loginDTO: LoginDTO) => {
	try {
		console.log(loginDTO.email.toLowerCase())
		const user = await userService.findByEmail(loginDTO.email.toLowerCase());

		if (!user) throw new InvalidCredentialsException();
		if (user.provider === 'google') throw new UserAuthenticationProvider();
		const isMatch = await userService.comparePassword(
			loginDTO.password,
			user.password,
		);
		if (!isMatch) throw new PasswordMismatchException();
		if (user.verified === false) {
			accountVerification(user.email);
			throw new AccountNotVerifiedException();
		}
		const { aToken, rToken } = await generateTokens(user);
		const result = await userService.update(
			{ rToken },
			{ id: user.id },
			true,
		);
		if (!result) throw new RepositoryExceptionUpdate();
		return { aToken, rToken };
	} catch (err) {
		throw err;
	}
};

export const generateTokens = async (user: any) => {
	try {
		const payload = {
			sub: CryptoUtil.encrypt(
				user.id,
				process.env.PAYLOAD_ENCRYPTION_KEY || '',
			),
		};
		const aToken = jwt.sign(payload, process.env.ATOKEN_SECRET || '', {
			expiresIn: process.env.ATOKEN_VALIDITY_DURATION as StringValue,
		});
		const rToken = jwt.sign(payload, process.env.RTOKEN_SECRET || '', {
			expiresIn: process.env.RTOKEN_VALIDITY_DURATION as StringValue,
		});
		return {
			aToken,
			rToken,
		};
	} catch (err) {
		console.log(err);
		throw err;
	}
};

export const register = async (registerDTO: CreateUserDto) => {
	try {
		const user = await userService.findByEmail(registerDTO.email.toLowerCase());

		if (user) throw new UserAlreadyExistsException();

		// Ensure password is null for Google users
		if (registerDTO.provider === 'google') {
			registerDTO.password = null;
			registerDTO.verified = true;
		}

		const createdUser = await userService.save(registerDTO);

		// Send verification email ONLY for manual signups
		if (!registerDTO.provider) accountVerification(createdUser.email);

		return createdUser;
	} catch (err) {
		throw err;
	}
};

export const accountVerification = async (email: string) => {
	const verificationLink = generateVerificationLink(email);
	await sendMail(
		email,
		verificationLink,
		'Account Verification',
		accountVerificationTemplate,
	);
};

export const generateVerificationLink = (email: string) => {
	try {
		const payload = {
			sub: CryptoUtil.encrypt(
				email,
				process.env.PAYLOAD_ENCRYPTION_KEY || '',
			),
		};
		const verificationToken = jwt.sign(
			payload,
			process.env.VTOKEN_SECRET || '',
			{
				expiresIn: process.env
					.VERIFICATION_TOKEN_DURATION as StringValue,
			},
		);
		return `${process.env.API_URL}/api/authenticate/verify?csf=${verificationToken}`;
	} catch (err) {
		throw err;
	}
};

export const resetPasswordRequest = async (email: string) => {
	try {
		const user = await userService.findByEmail(email);
		if (!user) throw new InvalidCredentialsException();
		await generateAndSendOtp(user);
	} catch (err) {
		throw err;
	}
};

export const generateAndSendOtp = async (user: any) => {
	const otp = await otpService.OtpProcess(user);
	await sendMail(
		user.email,
		otp.toString(),
		'Password Reset',
		getResetPasswordEmailTemplate,
	);
};

async function sendMail(
	to: string,
	content: string,
	subject: string,
	fn: (a: string) => string,
) {
	try {
		const mailOptions = getMailOptions(to, subject, fn(content));
		await transporter.sendMail(mailOptions);
		console.log('Email sent successfully');
	} catch (error) {
		console.error('Error sending password reset email:', error);
	}
}

export const resetPasswordVerification = async (
	password: string,
	userId: string,
) => {
	try {
		const user = await userService.findById(userId);
		if (!user) throw new InvalidCredentialsException();

		const isMatch = await userService.comparePassword(
			password,
			user.password,
		);
		if (isMatch) throw new PasswordMatchException();
		const hashedPassword = await userService.hashPassword(password);
		const result = await userService.update(
			{ password: hashedPassword },
			{ id: userId },
			true,
		);
		return result
			? 'Password reseted successfully'
			: 'Please User different Password';
	} catch (err) {
		console.log(err);
		throw err;
	}
};

function generateResetLink(user: any) {
	const payload = {
		sub: CryptoUtil.encrypt(
			user.id,
			process.env.PAYLOAD_ENCRYPTION_KEY || '',
		),
	};
	const resetToken = jwt.sign(payload, process.env.ATOKEN_SECRET || '', {
		expiresIn: parseInt(process.env.RESET_TOKEN_DURATION || '0'),
	});
	return `http://${process.env.CLIENT_URL}/api/authenticate/reset-password-ver?csf=${resetToken}`;
}

const transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: process.env.EMAIL, // Your Gmail address
		pass: process.env.GMAIL_APP_PASSWORD, // App-specific password or Gmail password
	},
});

function getMailOptions(to: string, subject: string, template: string) {
	const mailOptions = {
		from: 'no-reply@t.t',
		to: to,
		subject: subject,
		html: template,
	};
	return mailOptions;
}

export async function verifyEmail(token: string): Promise<boolean> {
	try {
		const payload = jwt.verify(token, process.env.VTOKEN_SECRET || '');
		const email = CryptoUtil.decrypt(
			payload.sub,
			process.env.PAYLOAD_ENCRYPTION_KEY || '',
		);
		const result = await userService.update(
			{ verified: true },
			{ email },
			true,
		);
		return result;
	} catch (err) {
		throw err;
	}
}

export async function verifyOTP(otp: string, email: string): Promise<string> {
	try {
		const user = await userService.findByEmail(email);
		if (!user) throw new InvalidCredentialsException();

		const result = await otpService.verifyOTP(user, otp);
		const payload = {
			sub: CryptoUtil.encrypt(
				user.id,
				process.env.PAYLOAD_ENCRYPTION_KEY || '',
			),
		};
		const resetToken = generateSingleUseToken(
			payload,
			process.env.RTOKEN_SECRET || '',
			process.env.RTOKEN_VALIDITY_DURATION as StringValue,
		);

		return resetToken;
	} catch (err) {
		throw err;
	}
}
type Unit =
	| 'Years'
	| 'Year'
	| 'Yrs'
	| 'Yr'
	| 'Y'
	| 'Weeks'
	| 'Week'
	| 'W'
	| 'Days'
	| 'Day'
	| 'D'
	| 'Hours'
	| 'Hour'
	| 'Hrs'
	| 'Hr'
	| 'H'
	| 'Minutes'
	| 'Minute'
	| 'Mins'
	| 'Min'
	| 'M'
	| 'Seconds'
	| 'Second'
	| 'Secs'
	| 'Sec'
	| 's'
	| 'Milliseconds'
	| 'Millisecond'
	| 'Msecs'
	| 'Msec'
	| 'Ms';

type UnitAnyCase = Unit | Uppercase<Unit> | Lowercase<Unit>;

type StringValue =
	| `${number}`
	| `${number}${UnitAnyCase}`
	| `${number} ${UnitAnyCase}`;

export const generateSingleUseToken = (
	payload: any,
	secret: string,
	duration: StringValue,
) => {
	return jwt.sign(payload, secret, {
		expiresIn: duration,
	});
};

export const tokenInfo = async (aToken: string) => {
	try {
		const aTRemainingTime =
			(jwt.decode(aToken) as any).exp / Math.floor(Date.now() / 1000);
		if (aTRemainingTime <= 0) return { isAuthenticated: false };
		return { isAuthenticated: true };
	} catch (err) {
		return { isAuthenticated: false };
	}
};
