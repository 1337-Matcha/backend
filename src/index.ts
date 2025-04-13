import 'reflect-metadata'; // Required for decorators if you are using them
import logger from './core/logger/logger';
import { connectWithRetry } from './core/dbconfig/config';
import './core/logger/file-watcher';
import loadEntities from './core/dbconfig/load';
import express from 'express';
import routes from './shared/routes';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import session from 'express-session';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import { setupWsRoutes } from './shared/routes/ws/index';

async function bootstrap() {
	try {
		const app = express();
		console.log(new Date());
		const server = http.createServer(app);

		const io = new Server(server, {
			path: '/ws/socket.io',
			cors: {
				origin: process.env.CLIENT_URL?.split(',') || '*',
				methods: ['GET', 'POST'],
				credentials: true,
			},
		});
		setupWsRoutes(io);
		app.use(express.json());
		app.use(cookieParser());
		// cors
		app.use(
			cors({
				origin: process.env.CLIENT_URL?.split(',') || [],
				credentials: true,
			}),
		);
		app.use(
			session({
				secret: process.env.JWT_SECRET as string,
				resave: false,
				saveUninitialized: false,
			}),
		);
		app.use(passport.initialize());
		app.use(passport.session());
		dotenv.config();
		logger.info('Starting application...');

		try {
			routes(app);
		} catch (err: any) {
			throw new Error(`Failed to setup routes: ${err.message}`);
		}

		try {
			await connectWithRetry();
		} catch (err: any) {
			throw new Error(`Database connection failed: ${err.message}`);
		}

		try {
			// console.log(__dirname);
			loadEntities(__dirname);
		} catch (err: any) {
			throw new Error(`Failed to load entities: ${err.message}`);
		}

		// Start the server and listen on a specific port
		const port = process.env.PORT || 3000;
		server.listen(port, () => {
			logger.info(`Server is running on port ${port}`);
		});

		logger.info('Application initialized successfully!');
	} catch (error: any) {
		logger.error({
			message: 'Failed to start the application',
			errorName: error.name,
			errorMessage: error.message,
			stack: error.stack,
		});
		process.exit(1); // Exit the process in case of a critical error
	}
}

bootstrap();
