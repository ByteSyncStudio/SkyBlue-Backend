import express from 'express';
import fs from 'fs';
import path from 'path';
import { download } from '../controllers/fileController.js';
import { downloadFile, closeFTPSConnection } from '../config/ftpsClient.js';

const router = express.Router();


router.get('/download', download);


export default router;