import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import express from 'express';
import dotenv from 'dotenv';
import * as authService from '../../modules/auth/services/auth.service';
import * as userService from '../../modules/user/services/user.service';
import { RepositoryExceptionUpdate } from '../exceptions/repository.exception';

dotenv.config();

const router = express.Router();

passport.use(
	new GoogleStrategy(
		{
			clientID: process.env.GOOGLE_CLIENT_ID as string,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
			callbackURL: process.env.GOOGLE_CALLBACK_URL as string,
			scope: ['profile', 'email'],
		},
		async (accessToken, refreshToken, profile, done) => {
			try {
				const { displayName, emails, name, provider } = profile;
				const email = emails?.[0]?.value || '';

				let user = await userService.findByEmail(email);

				if (user) {
					// If user exists but used manual signup, update provider to Google
					if (user.provider !== 'google') {
						await userService.update(
							{ provider: 'google', verified: true },
							{ id: user.id },
							true
						);
					}
				} else {
					// Create new user if they don't exist
					user = await authService.register({
						username: displayName,
						email,
						firstName: name?.givenName || '',
						lastName: name?.familyName || '',
						password: null, // No password for Google users
						verified: true,
						provider: 'google',
					});
				}

				const { aToken, rToken } =
					await authService.generateTokens(user);
				const result = await userService.update(
					{ rToken },
					{ id: user.id },
					true
				);
				if (!result) throw new RepositoryExceptionUpdate();
				return done(null, { user, aToken, rToken });
			} catch (err) {
				return done(err, false);
			}
		},
	),
);
passport.serializeUser((user: any, done) => {
	done(null, user);
});
passport.deserializeUser((user: any, done) => {
	done(null, user);
});
export default router;
