import express from 'express';
import { getUnapprovedUsers, approveUser } from '../../controllers/admin/approve/approveController.js';
import { addProduct, updateProduct, deleteProduct } from '../../controllers/admin/product/adminProductcontroller.js'

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

router.post('/product/add', addProduct);

/**
 * @swagger
 * /admin/product/{id}:
 *   patch:
 *     summary: Update a product
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The product ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               VisibleIndividually:
 *                 type: boolean
 *               ItemLocation:
 *                 type: string
 *               BoxQty:
 *                 type: integer
 *               Name:
 *                 type: string
 *               ShortDescription:
 *                 type: string
 *               FullDescription:
 *                 type: string
 *               Barcode:
 *                 type: string
 *               Barcode2:
 *                 type: string
 *               Published:
 *                 type: boolean
 *               MarkAsNew:
 *                 type: boolean
 *               AdminComment:
 *                 type: string
 *               Price:
 *                 type: number
 *               OldPrice:
 *                 type: number
 *               Price1:
 *                 type: number
 *               Price2:
 *                 type: number
 *               Price3:
 *                 type: number
 *               Price4:
 *                 type: number
 *               Price5:
 *                 type: number
 *               Role1:
 *                 type: integer
 *               Role2:
 *                 type: integer
 *               Role3:
 *                 type: integer
 *               Role4:
 *                 type: integer
 *               Role5:
 *                 type: integer
 *               HasDiscountApplied:
 *                 type: boolean
 *               AllowedQuantities:
 *                 type: string
 *               OrderMinimumQuantity:
 *                 type: integer
 *               OrderMaximumQuantity:
 *                 type: integer
 *               CategoryId:
 *                 type: integer
 *               StockQuantity:
 *                 type: integer
 *               SeoFilenames:
 *                 type: string
 *               DeletedImageIds:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
router.patch('/product/:id', updateProduct);

/**
 * @swagger
 * /admin/product/{id}:
 *   delete:
 *     summary: Delete a product
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The product ID
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
router.delete('/product/:id', deleteProduct);

export default router;