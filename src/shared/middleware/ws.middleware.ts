import { CryptoUtil } from '../utils/crypto.utils';
import jwt from 'jsonwebtoken';
import { Socket } from 'socket.io';
import { parse } from 'cookie';

export const wsAuthMiddleware = async (
	socket: Socket,
	next: (err?: Error) => void,
) => {
	const cookieHeader = socket.request.headers.cookie || '';
	const cookies = parse(cookieHeader);
	const aToken = cookies.aToken;
	try {
		if (!aToken) throw new Error('ws Authentication error');

		const decoded = jwt.verify(aToken, process.env.ATOKEN_SECRET || '');
		const decryptedSub = CryptoUtil.decrypt(
			decoded.sub,
			process.env.PAYLOAD_ENCRYPTION_KEY || '',
		);
		(socket as any).userId = decryptedSub; // Attach userId to socket
		next();
	} catch (err) {
		next(new Error('ws Authentication error'));
	}
};
