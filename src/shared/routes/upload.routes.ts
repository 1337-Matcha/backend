import express from 'express';
import multer from 'multer';
import path from 'path';
import { uploadUserProfile } from '../../modules/user/controllers/upload.controller';

const router = express.Router();
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, 'uploads/');
	},
	filename: (req, file, cb) => {
		const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
		cb(
			null,
			file.fieldname +
				'-' +
				uniqueSuffix +
				path.extname(file.originalname),
		);
	},
});

const upload = multer({ storage: storage });

router.post(
	'/user/upload',
	upload.fields([
		{ name: 'pictures', maxCount: 5 },
		{ name: 'mainPicture', maxCount: 1 },
	]),
	uploadUserProfile,
);
router.use(
	'/uploads',
	express.static(path.join(__dirname, '../../../uploads')),
);
export default router;
