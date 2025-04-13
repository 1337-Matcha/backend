import { WsRouter } from './ws-router';
import * as notificationService from './../../../modules/notification/notification.service';

export const NotificationWsRouter = new WsRouter()
	.use((socket, next) => {
		console.log('Chat route middleware');
		next();
	})
	.on('notifSeen', async (io, socket, data) => {
		try {
			const message = JSON.parse(data);

			const updatedNotification =
				await notificationService.updateNotification({
					id: data.conversationId,
					is_read: true,
				});
			io.to(`conversation_${data.conversation_id}`).emit(
				'messageSeen',
				data.messageId,
			);
		} catch (err) {
			console.error('sendMessage error:', err);
		}
	});
