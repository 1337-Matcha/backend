//
export class InvalidCredentialsException extends Error {
	// statusCodeCode: HttpstatusCode = HttpstatusCode.UNAUTHORIZED;
	statusCode: number;
	constructor(
		message = 'Invalid credentials. Check your email and try again.',
	) {
		super(message);
		this.name = this.constructor.name;
		this.statusCode = 404;
	}
}

export class UserAlreadyExistsException extends Error {
	// statusCodeCode: HttpstatusCode = HttpstatusCode.CONFLICT;
	statusCode: number;
	constructor(message = 'User already exists.') {
		super(message);
		this.name = this.constructor.name;
		this.statusCode = 409;
	}
}

export class UserNotFoundException extends Error {
	// statusCodeCode: HttpstatusCode = HttpstatusCode.NOT_FOUND;
	statusCode: number;
	constructor(message = 'Please Log in again.') {
		super(message);
		this.name = this.constructor.name;
		this.statusCode = 404;
	}
}


export class UserAuthenticationProvider extends Error {
	statusCode: number;
	constructor(message = 'Try Sign-in with Google.') {
		super(message);
		this.name = this.constructor.name;
		this.statusCode = 401;
	}
}