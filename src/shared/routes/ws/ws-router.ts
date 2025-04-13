// src/core/ws/ws-router.ts
import { Server, Socket } from 'socket.io';

type WsMiddleware = (socket: Socket, next: (err?: Error) => void) => void;
type WsHandler = (io: Server, socket: Socket, ...args: any[]) => void;

export class WsRouter {
	private middlewares: WsMiddleware[] = [];
	private handlers: { event: string; handler: WsHandler }[] = [];

	use(middleware: WsMiddleware): this {
		this.middlewares.push(middleware);
		return this;
	}

	on(event: string, handler: WsHandler): this {
		this.handlers.push({ event, handler });
		return this;
	}

	register(io: Server): void {
		io.use((socket, next) => {
			this.runMiddlewares(socket, next);
		});

		io.on('connection', socket => {
			this.handlers.forEach(({ event, handler }) => {
				socket.on(event, (...args) => handler(io, socket, ...args));
			});
		});
	}

	private runMiddlewares(socket: Socket, done: (err?: Error) => void) {
		let i = 0;
		const next = (err?: Error) => {
			if (err || i >= this.middlewares.length) return done(err);
			this.middlewares[i++](socket, next);
		};
		next();
	}
}
