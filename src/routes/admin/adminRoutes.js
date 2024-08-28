import express from 'express';
import { getUnapprovedUsers, approveUser } from '../../controllers/admin/approve/approveController.js';

const router = express.Router();

router.get('/unapproved', getUnapprovedUsers);

router.put('/approve/:id', approveUser);

export default router;