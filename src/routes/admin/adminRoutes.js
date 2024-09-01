import express from "express";
import {
  getUnapprovedUsers,
  approveUser,
} from "../../controllers/admin/approve/approveController.js";
import {
  createNewVendor,
  getAllVendors,
  patchVendor,
} from "../../controllers/admin/vendors/adminVendorsController.js";

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
router.get("/unapproved", getUnapprovedUsers);

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
router.put("/approve/:id", approveUser);
/**
 * @swagger
 * /admin/vendors:
 *   get:
 *     summary: Retrieve a list of all vendors
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: A list of vendors
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   Id:
 *                     type: integer
 *                     example: 1
 *                   Name:
 *                     type: string
 *                     example: "Vendor Name"
 *                   Email:
 *                     type: string
 *                     example: "vendor@example.com"
 *                   Description:
 *                     type: string
 *                     example: "Vendor Description"
 *                   AddressId:
 *                     type: integer
 *                     example: 1
 *                   AdminComment:
 *                     type: string
 *                     example: "Admin Comment"
 *                   Active:
 *                     type: boolean
 *                     example: true
 *                   Deleted:
 *                     type: boolean
 *                     example: false
 *                   DisplayOrder:
 *                     type: integer
 *                     example: 0
 *                   MetaKeywords:
 *                     type: string
 *                     example: "keywords"
 *                   MetaDescription:
 *                     type: string
 *                     example: "meta description"
 *                   MetaTitle:
 *                     type: string
 *                     example: "meta title"
 *                   PageSize:
 *                     type: integer
 *                     example: 10
 *                   AllowCustomersToSelectPageSize:
 *                     type: boolean
 *                     example: false
 *                   PageSizeOptions:
 *                     type: string
 *                     example: "10,20,50"
 *       500:
 *         description: Internal server error
 */
router.get("/vendors", getAllVendors);

/**
 * @swagger
 * /admin/create-vendors:
 *   post:
 *     summary: Create a new vendor
 *     tags: [Admin]
 *     requestBody:
 *       description: Vendor data
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Vendor Name"
 *               email:
 *                 type: string
 *                 example: "vendor@example.com"
 *               description:
 *                 type: string
 *                 example: "Vendor Description"
 *               adminComment:
 *                 type: string
 *                 example: "Admin Comment"
 *               active:
 *                 type: boolean
 *                 example: true
 *               displayOrder:
 *                 type: integer
 *                 example: 0
 *               metaKeywords:
 *                 type: string
 *                 example: "keywords"
 *               metaDescription:
 *                 type: string
 *                 example: "meta description"
 *               metaTitle:
 *                 type: string
 *                 example: "meta title"
 *               pageSize:
 *                 type: integer
 *                 example: 10
 *               allowCustomersToSelectPageSize:
 *                 type: boolean
 *                 example: false
 *               pageSizeOptions:
 *                 type: string
 *                 example: "10,20,50"
 *     responses:
 *       201:
 *         description: Vendor created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Vendor created successfully."
 *                 data:
 *                   type: object
 *                   properties:
 *                     Name:
 *                       type: string
 *                       example: "Vendor Name"
 *                     Email:
 *                       type: string
 *                       example: "vendor@example.com"
 *                     Description:
 *                       type: string
 *                       example: "Vendor Description"
 *                     PictureId:
 *                       type: integer
 *                       example: 0
 *                     AddressId:
 *                       type: integer
 *                       example: 0
 *                     AdminComment:
 *                       type: string
 *                       example: "Admin Comment"
 *                     Active:
 *                       type: boolean
 *                       example: true
 *                     Deleted:
 *                       type: boolean
 *                       example: false
 *                     DisplayOrder:
 *                       type: integer
 *                       example: 0
 *                     MetaKeywords:
 *                       type: string
 *                       example: "keywords"
 *                     MetaDescription:
 *                       type: string
 *                       example: "meta description"
 *                     MetaTitle:
 *                       type: string
 *                       example: "meta title"
 *                     PageSize:
 *                       type: integer
 *                       example: 10
 *                     AllowCustomersToSelectPageSize:
 *                       type: boolean
 *                       example: false
 *                     PageSizeOptions:
 *                       type: string
 *                       example: "10,20,50"
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Name and Email are required."
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Server error"
 */
router.post("/create-vendors", createNewVendor);

/**
 * @swagger
 * /admin/editvendor/{id}:
 *   patch:
 *     summary: Update a vendor by ID
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The vendor ID
 *     requestBody:
 *       description: Vendor data to update
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Updated Vendor Name"
 *               email:
 *                 type: string
 *                 example: "updatedvendor@example.com"
 *               description:
 *                 type: string
 *                 example: "Updated Vendor Description"
 *               adminComment:
 *                 type: string
 *                 example: "Updated Admin Comment"
 *               active:
 *                 type: boolean
 *                 example: true
 *               displayOrder:
 *                 type: integer
 *                 example: 1
 *               metaKeywords:
 *                 type: string
 *                 example: "updated keywords"
 *               metaDescription:
 *                 type: string
 *                 example: "updated meta description"
 *               metaTitle:
 *                 type: string
 *                 example: "updated meta title"
 *               pageSize:
 *                 type: integer
 *                 example: 20
 *               allowCustomersToSelectPageSize:
 *                 type: boolean
 *                 example: true
 *               pageSizeOptions:
 *                 type: string
 *                 example: "20,40,60"
 *     responses:
 *       200:
 *         description: Vendor updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Vendor updated successfully."
 *                 data:
 *                   type: object
 *                   properties:
 *                     Name:
 *                       type: string
 *                       example: "Updated Vendor Name"
 *                     Email:
 *                       type: string
 *                       example: "updatedvendor@example.com"
 *                     Description:
 *                       type: string
 *                       example: "Updated Vendor Description"
 *                     PictureId:
 *                       type: integer
 *                       example: 0
 *                     AddressId:
 *                       type: integer
 *                       example: 0
 *                     AdminComment:
 *                       type: string
 *                       example: "Updated Admin Comment"
 *                     Active:
 *                       type: boolean
 *                       example: true
 *                     Deleted:
 *                       type: boolean
 *                       example: false
 *                     DisplayOrder:
 *                       type: integer
 *                       example: 1
 *                     MetaKeywords:
 *                       type: string
 *                       example: "updated keywords"
 *                     MetaDescription:
 *                       type: string
 *                       example: "updated meta description"
 *                     MetaTitle:
 *                       type: string
 *                       example: "updated meta title"
 *                     PageSize:
 *                       type: integer
 *                       example: 20
 *                     AllowCustomersToSelectPageSize:
 *                       type: boolean
 *                       example: true
 *                     PageSizeOptions:
 *                       type: string
 *                       example: "20,40,60"
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid vendor ID."
 *       404:
 *         description: Vendor not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Vendor not found."
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Server error"
 */
router.patch("/editvendor/:id", patchVendor);

export default router;
