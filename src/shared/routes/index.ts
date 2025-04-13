import userRoutes from './user.routes';
import authRoutes from './auth.routes';
import passwordRoutes from './password.routes';
import likesRoutes from './likes.routes';
import uploadRoutes from './upload.routes';
import locationRoutes from './location.routes';
import viewsRoutes from './views.routes';
import chatRoutes from './chat.routes';
import userMetricsRoutes from './user-metrics.routes';
import express from 'express';
import authMiddleware from '../middleware/auth.middleware';

export default (app: express.Application) => {
	app.use('/api/chat', authMiddleware, chatRoutes);
	app.use('/api/user', userRoutes);
	app.use('/api/authenticate', authRoutes);
	app.use('/api', passwordRoutes);
	app.use('/api/views', authMiddleware, viewsRoutes);
	app.use('/api/likes', authMiddleware, likesRoutes);
	app.use('/api/user-metrics', authMiddleware, userMetricsRoutes);
	app.use('/api', authMiddleware, uploadRoutes);
	app.use('/api/location', authMiddleware, locationRoutes);
};
