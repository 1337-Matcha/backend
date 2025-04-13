import { Server } from 'socket.io';
import { wsAuthMiddleware } from '../../middleware/ws.middleware';
import { chatWsRouter } from './chat.routes';

export const connectedUsers = new Map<string, string>();
export const setupWsRoutes = (io: Server) => {
	io.use(wsAuthMiddleware);

	chatWsRouter.register(io);
	io.on('connection', socket => {
		// Apply per-connection middleware if needed
		// socket.use(someMiddleware);
		console.log(`User connected: ${(socket as any).userId}`);
		const userId = (socket as any).userId;
		if (connectedUsers.has(userId)) {
			const existingSocketId = connectedUsers.get(userId) || '';
			io.to(existingSocketId).disconnectSockets(true);
		}
		connectedUsers.set(userId, socket.id);

		socket.on('disconnect', () => {
			console.log(`User disconnected: ${(socket as any).userId}`);
			connectedUsers.delete((socket as any).userId);
		});
	});
};
