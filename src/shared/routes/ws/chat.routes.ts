import { WsRouter } from './ws-router';
import * as chatService from './../../../modules/chat/services/chat.service';
import { connectedUsers } from '.';
import * as notificationService from './../../../modules/notification/notification.service';

export const chatWsRouter = new WsRouter()
	.use((socket, next) => {
		console.log('Chat route middleware');
		next();
	})
	.on('sendMessage', async (io, socket, rawMessage) => {
		try {
			const message = JSON.parse(rawMessage);

			const savedMessage = await chatService.save(message);
			// Emit to all participants in the conversation
			io.to(`conversation_${savedMessage.conversation_id}`).emit(
				'newMessage',
				savedMessage,
			);
			const notification = await notificationService.saveNotification({
				sender_id: message.sender_id,
				receiver_id: message.target_id,
				type: 'MESSAGE',
				content: {
					conversationId: savedMessage.conversation_id,
					message: message.content,
				},
				is_read: false,
			});
			// console.log('notification', notification);
			// Check if recipient is online (assumes message.targetId or message.receiverId exists)
			const targetUserId = message.target_id;
			const targetSocketId = connectedUsers.get(targetUserId);
			if (targetSocketId) {
				io.to(targetSocketId).emit('personalNotification', {
					type: 'MESSAGE',
					message: notification,
				});
			} else {
				console.log(`User ${targetUserId} is not connected`);
				// Queue it for later maybe
			}
		} catch (err) {
			console.error('sendMessage error:', err);
		}
	})
	.on('joinConversation', (io, socket, conversationId) => {
		console.log(
			`${(socket as any).userId} is joined the room conversation_${conversationId}`,
		);
		socket.join(`conversation_${conversationId}`);
	});
