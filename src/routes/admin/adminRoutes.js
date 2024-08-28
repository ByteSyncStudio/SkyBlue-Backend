import express from 'express';
import { getUnapprovedUsers, approveUser } from '../../controllers/admin/approve/approveController.js';

const router = express.Router();

/**
 * @swagger
 * /admin/unapproved:
 *   get:
 *     summary: Retrieve a list of unapproved users
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: A list of unapproved users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   email:
 *                     type: string
 *                     example: user@example.com
 *                   firstName:
 *                     type: string
 *                     example: John
 *                   lastName:
 *                     type: string
 *                     example: Doe
 *       500:
 *         description: Internal server error
 */
router.get('/unapproved', getUnapprovedUsers);

/**
 * @swagger
 * /admin/approve/{id}:
 *   put:
 *     summary: Approve a user by ID
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The user ID
 *     responses:
 *       200:
 *         description: User approved successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.put('/approve/:id', approveUser);

export default router;