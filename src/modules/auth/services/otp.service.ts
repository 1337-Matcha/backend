import { repository } from '../../../repository';
import {
	ExpiredOtpException,
	InvalidOtpException,
} from '../../../shared/exceptions/auth.exception';
import { CryptoUtil } from '../../../shared/utils/crypto.utils';
import { CreateUserDto } from '../../user/dto/user.dto';
import * as userService from '../../user/services/user.service';

export const OtpProcess = async (user: any) => {
	try {
		const otp = await generateOTP();
		await saveOTP(user, otp);
		return otp;
	} catch (err) {
		throw err;
	}
};

const generateOTP = async () => {
	return Math.floor(100000 + Math.random() * 900000);
};

const saveOTP = async (user: any, otp: number) => {
	const hashedOTP = await hashOTP(otp);
	// make expiration from the current time + time in env
	const OTPExpiration = parseInt(process.env.OTP_DURATION || '5') * 60 * 1000;
	const otp_expiry = new Date(Date.now() + OTPExpiration);
	await userService.update(
		{ otp: hashedOTP, otp_expiry },
		{ email: user.email },
		true
	);
};

const hashOTP = async (otp: number) => {
	// Hash the OTP
	// Use a hashing algorithm like bcrypt
	// to hash the OTP before saving it to the database
	return CryptoUtil.encrypt(
		otp.toString(),
		process.env.PAYLOAD_ENCRYPTION_KEY || '',
	);
};

export const verifyOTP = async (user: any, otp: string) => {
	try {
		const unhashedOTP = CryptoUtil.decrypt(
			user.otp,
			process.env.PAYLOAD_ENCRYPTION_KEY || '',
		);
		if (unhashedOTP == otp) {
			if (user.otp_expiry < new Date()) {
				throw new ExpiredOtpException();
			}
			await userService.update(
				{ otp: null, otp_expiry: null },
				{ email: user.email },
				true
			);
			return true;
		}
		throw new InvalidOtpException();
	} catch (err) {
		throw err;
	}
};
