import express from 'express';
import {
	login,
	register,
	verifyEmail,
	googleAuthentication,
	tokenInfo,
	logout,
} from '../../modules/auth/auth.controller';
import { validateData } from '../utils/validationMiddleware';
import { loginSchema } from '../../modules/auth/auth.validation';
import { userRegistrationSchema } from '../../modules/user/user.validation';
import authGoogle from './auth.google';
import passport from 'passport';

const router = express.Router();
router.post('/register', validateData(userRegistrationSchema), register);
router.post('/login', validateData(loginSchema), login);
router.get('/verify', verifyEmail);
// Google authentication routes
router.get(
	'/google',
	authGoogle,
	passport.authenticate('google', { scope: ['profile', 'email'] }),
);
router.get(
	'/google/callback',
	authGoogle,
	passport.authenticate('google', { failureRedirect: '/' }),
	googleAuthentication,
);
router.get('/token/info', tokenInfo);
router.get('/logout', logout);

export default router;
