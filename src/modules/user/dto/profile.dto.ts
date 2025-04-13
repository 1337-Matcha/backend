import { LocationDTO } from "../../../shared/dtos";
import { Gender } from "../../../shared/enums";

export enum SexualPreferences {
	Bisexual = 'bisexual',
	Straight = 'straight',
	Pansexual = 'pansexual',
	Asexual = 'asexual',
	Demisexual = 'demisexual',
	Questioning = 'questioning',
}

export class ProfileDto {
	user_id?: string;
	gender?: Gender;
	sexualPreferences?: SexualPreferences;
	bio?: string;
	interests?: string[];
	location?: LocationDTO;
	pictures?: string[];
	mainpicture?: string;
	birthdate?: Date;
}

export class ProfileUpdateDto {
	user_id?: string;
	gender?: Gender;
	sexualPreferences?: SexualPreferences;
	bio?: string;
	interests?: string[];
	location?: string;
	pictures?: string[];
	mainpicture?: string;
	birthdate?: Date;

	constructor(body: any) {
		this.user_id = body.user_id;
		this.bio = body.bio;
		this.gender = body.gender;
		this.interests = body.interests;
		this.location = body.location;
		this.pictures = body.pictures;
		this.sexualPreferences = body.sexualPreferences;
	}
}
