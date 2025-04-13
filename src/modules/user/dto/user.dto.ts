import { LocationDTO } from "../../../shared/dtos";
import { Gender } from "../../../shared/enums";

// src/dtos/userDto.js
export class CreateUserDto {
	id?: string;
	firstName: string;
	lastName: string;
	email: string;
	username: string;
	verified: boolean;
	password: string | null;
	provider?: string;
	constructor(body: any) {
		this.firstName = body.firstName;
		this.lastName = body.lastName;
		this.email = body.email;
		this.username = body.username;
		this.password = body.password;
		this.verified = body.verified || false;
		this.provider = body.provider;
	}
}

export class UpdateUserDto {
	firstName: string;
	lastName: string;
	email: string;
	username: string;

	constructor(body: any) {
		this.firstName = body.firstName;
		this.lastName = body.lastName;
		this.email = body.email;
		this.username = body.username;
	}
}

export class GetUserWithRelationsDTO {
	firstname?: string;
	lastname?: string;
	username?: string;
	gender?: Gender;
	bio?: string;
	birthdate?: Date;
	mainPicture?: string;
	pictures?: string[];
	location?: LocationDTO;
	sexualOrientation?: string;
	sexualPreferences?: string[];
	interests?: string[];
	existingPictures?: string[];
}