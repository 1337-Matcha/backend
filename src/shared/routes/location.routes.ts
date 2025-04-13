import express from 'express';
import * as locationController from './../../modules/user/controllers/location.controller';
const router = express.Router();

router.post('/update', locationController.updateOrInsertLocation);

export default router;
