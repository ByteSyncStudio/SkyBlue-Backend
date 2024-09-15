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
import {
  getallOrders,
  getSingleOrder,
} from "../../controllers/admin/Orders/adminOrdersController.js";
import {
  addProduct,
  updateProduct,
  deleteProduct,
  getProducts,
  getProduct,
  deleteTierPrice,
} from "../../controllers/admin/product/adminProductcontroller.js";
import {
  getAllCustomersWithRoles,
  getCustomerRoles,
  updateCustomerRolesAndStatus,
} from "../../controllers/admin/customer/adminCustomerController.js";
import { getBestSellers } from "../../controllers/admin/product/adminProductcontroller.js";
import {
  applyDiscountToCategory,
  applyDiscountToProducts,
  deleteDiscounts,
  getAllDiscounts,
  getDiscountWithTypes,
  getSubCategoryDiscounts,
  postDiscounts,
  removeDiscountFromCategory,
  removeDiscountFromProducts,
} from "../../controllers/admin/discount/adminDiscountController.js";
import { getAllCategories as getAllCategories_Category, addCategory, updateCategory, deleteCategory } from "../../controllers/admin/category/adminCategoryController.js";
import { addSlider, deleteSlider, updateSlider, getSliderByType } from "../../controllers/admin/slider/adminSliderController.js";
import {
  getAllCategories,
  getAllProducts,
} from "../../repositories/admin/discount/adminDiscountRepository.js";
import {
  getActiveCustomers,
  getBestSellerByAmount,
  getBestSellerByQunatity,
  getNewCustomers,
  getOrderStats,
  getStats,
  getValueOrders,
} from "../../controllers/admin/stats/adminStatsController.js";
import { adminLogin } from "../../controllers/admin/auth/adminLoginController.js";
import { authenticateToken, authorizeRoles } from '../../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /admin/login:
 *   post:
 *     summary: Admin login
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid email or password
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal server error
 */
router.post('/login', adminLogin);

router.use(authenticateToken);

const adminAccess = authorizeRoles(['Registered', 'Administrators'])

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
router.get("/unapproved", adminAccess, getUnapprovedUsers);

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
router.put("/approve/:id", adminAccess, approveUser);

router.post("/product/add", adminAccess, addProduct);

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
router.patch("/product/:id", adminAccess, updateProduct);

router.delete("/product/tier-price", adminAccess, deleteTierPrice);

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
router.delete("/product/:id", adminAccess, deleteProduct);


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
router.get("/vendors", adminAccess, getAllVendors);

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
router.post("/create-vendors", adminAccess, createNewVendor);

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
router.patch("/editvendor/:id", adminAccess, patchVendor);

/**
 * @swagger
 * /all-orders:
 *   get:
 *     summary: Retrieve a list of all orders
 *     description: Retrieve a list of all orders with their details.
 *     responses:
 *       200:
 *         description: A list of orders.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   Id:
 *                     type: integer
 *                     description: The order ID.
 *                     example: 1
 *                   OrderGuid:
 *                     type: string
 *                     description: The order GUID.
 *                     example: "123e4567-e89b-12d3-a456-426614174000"
 *                   CustomerId:
 *                     type: integer
 *                     description: The customer ID.
 *                     example: 1
 *                   OrderStatusId:
 *                     type: integer
 *                     description: The order status ID.
 *                     example: 1
 *                   OrderTotal:
 *                     type: number
 *                     description: The total amount of the order.
 *                     example: 100.50
 *                   CreatedonUtc:
 *                     type: string
 *                     format: date-time
 *                     description: The date and time when the order was created.
 *                     example: "2023-10-01T12:00:00Z"
 */
router.get("/all-orders", adminAccess, getallOrders);

/**
 * @swagger
 * /single-order/{id}:
 *   get:
 *     summary: Retrieve a single order by ID
 *     description: Retrieve the details of a single order by its ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The order ID.
 *     responses:
 *       200:
 *         description: The details of the order.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 Id:
 *                   type: integer
 *                   description: The order ID.
 *                   example: 1
 *                 OrderGuid:
 *                   type: string
 *                   description: The order GUID.
 *                   example: "123e4567-e89b-12d3-a456-426614174000"
 *                 CustomerId:
 *                   type: integer
 *                   description: The customer ID.
 *                   example: 1
 *                 OrderStatusId:
 *                   type: integer
 *                   description: The order status ID.
 *                   example: 1
 *                 OrderTotal:
 *                   type: number
 *                   description: The total amount of the order.
 *                   example: 100.50
 *                 CreatedonUtc:
 *                   type: string
 *                   format: date-time
 *                   description: The date and time when the order was created.
 *                   example: "2023-10-01T12:00:00Z"
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       OrderItemGuid:
 *                         type: string
 *                         description: The order item GUID.
 *                         example: "123e4567-e89b-12d3-a456-426614174001"
 *                       ProductId:
 *                         type: integer
 *                         description: The product ID.
 *                         example: 1
 *                       Quantity:
 *                         type: integer
 *                         description: The quantity of the product.
 *                         example: 2
 *                       UnitPriceInclTax:
 *                         type: number
 *                         description: The unit price including tax.
 *                         example: 50.25
 *                       UnitPriceExclTax:
 *                         type: number
 *                         description: The unit price excluding tax.
 *                         example: 45.00
 *                       PriceInclTax:
 *                         type: number
 *                         description: The total price including tax.
 *                         example: 100.50
 *                       PriceExclTax:
 *                         type: number
 *                         description: The total price excluding tax.
 *                         example: 90.00
 *                       DiscountAmountInclTax:
 *                         type: number
 *                         description: The discount amount including tax.
 *                         example: 10.00
 *                       DiscountAmountExclTax:
 *                         type: number
 *                         description: The discount amount excluding tax.
 *                         example: 9.00
 *                       OriginalProductCost:
 *                         type: number
 *                         description: The original cost of the product.
 *                         example: 40.00
 *                       AttributeDescription:
 *                         type: string
 *                         description: The description of the product attributes.
 *                         example: "Color: Red, Size: M"
 *                       AttributesXml:
 *                         type: string
 *                         description: The XML representation of the product attributes.
 *                         example: "<attributes><color>Red</color><size>M</size></attributes>"
 *                       DownloadCount:
 *                         type: integer
 *                         description: The number of times the product has been downloaded.
 *                         example: 0
 *                       IsDownloadActivated:
 *                         type: boolean
 *                         description: Whether the download is activated.
 *                         example: false
 *                       LicenseDownloadId:
 *                         type: integer
 *                         description: The license download ID.
 *                         example: 0
 *                       ItemWeight:
 *                         type: number
 *                         description: The weight of the item.
 *                         example: 1.5
 *                       RentalStartDateUtc:
 *                         type: string
 *                         format: date-time
 *                         description: The rental start date and time.
 *                         example: "2023-10-01T12:00:00Z"
 *                       RentalEndDateUtc:
 *                         type: string
 *                         format: date-time
 *                         description: The rental end date and time.
 *                         example: "2023-10-10T12:00:00Z"
 */
router.get("/single-order/:id", adminAccess, getSingleOrder);

/**
 * @swagger
 * /admin/customer/all:
 *   get:
 *     summary: Retrieve a list of all customers along with their roles and other details.
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: A list of customers with their roles and other details.
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
 *                   firstName:
 *                     type: string
 *                     example: John
 *                   lastName:
 *                     type: string
 *                     example: Doe
 *                   company:
 *                     type: string
 *                     example: ACME Corp
 *                   active:
 *                     type: boolean
 *                     example: true
 *                   roles:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ["Customer", "VIP"]
 *       500:
 *         description: Internal server error
 */
router.get("/customer/all", adminAccess, getAllCustomersWithRoles);

/**
 * @swagger
 * /admin/customer/{id}:
 *   patch:
 *     summary: Update customer roles and active status
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The customer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               roles:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of role IDs to assign to the customer
 *               removeRoles:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of role IDs to remove from the customer
 *               active:
 *                 type: boolean
 *                 description: Customer's active status
 *             example:
 *               roles: [1, 2]
 *               removeRoles: [3]
 *               active: true
 *     responses:
 *       200:
 *         description: Customer updated successfully
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
 *                   example: "Customer updated successfully"
 *       400:
 *         description: Bad request
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Internal server error
 */
router.patch("/customer/:id", adminAccess, updateCustomerRolesAndStatus);

router.get("/customer/roles", adminAccess, getCustomerRoles);

router.get("/bestseller", adminAccess, getBestSellers);

/**
 * @swagger
 * /alldiscounts:
 *   get:
 *     summary: Retrieve all discounts
 *     description: Retrieve a list of all discounts.
 *     responses:
 *       200:
 *         description: A list of discounts.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: The discount ID.
 *                     example: 1
 *                   name:
 *                     type: string
 *                     description: The discount name.
 *                     example: "Summer Sale"
 */
router.get("/alldiscounts", adminAccess, getAllDiscounts);

/**
 * @swagger
 * /discount/subcategories:
 *   get:
 *     summary: Retrieve discounts for subcategories
 *     description: Retrieve a list of discounts applicable to subcategories.
 *     responses:
 *       200:
 *         description: A list of subcategory discounts.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: The discount ID.
 *                     example: 1
 *                   subcategoryId:
 *                     type: integer
 *                     description: The subcategory ID.
 *                     example: 10
 *                   discountPercentage:
 *                     type: number
 *                     format: float
 *                     description: The discount percentage.
 *                     example: 15.5
 */
router.get("/discount/subcategories", adminAccess, getSubCategoryDiscounts);

router.get("/discount/:type", adminAccess, getDiscountWithTypes);
/**
 * @swagger
 * /post-discounts:
 *   post:
 *     summary: Create a new discount
 *     description: Create a new discount with the provided details.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The discount name.
 *                 example: "Winter Sale"
 *               discountPercentage:
 *                 type: number
 *                 format: float
 *                 description: The discount percentage.
 *                 example: 20.0
 *     responses:
 *       201:
 *         description: Discount created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: The discount ID.
 *                   example: 1
 *                 name:
 *                   type: string
 *                   description: The discount name.
 *                   example: "Winter Sale"
 *                 discountPercentage:
 *                   type: number
 *                   format: float
 *                   description: The discount percentage.
 *                   example: 20.0
 */
router.post("/post-discounts", adminAccess, postDiscounts);

/**
 * @swagger
 * /delete-discount/{id}:
 *   delete:
 *     summary: Delete a discount
 *     description: Delete a discount by its ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The discount ID.
 *     responses:
 *       200:
 *         description: Discount deleted successfully.
 *       404:
 *         description: Discount not found.
 */
router.delete("/delete-discount/:id", adminAccess, deleteDiscounts);

router.get("/category/all", adminAccess, getAllCategories_Category);

router.post("/category/add", adminAccess, addCategory);

router.patch("/category/edit/:id", adminAccess, updateCategory);

router.delete("/category/delete/:id", adminAccess, deleteCategory);

router.get("/product/search", adminAccess, getProducts);

router.get("/product/:id", adminAccess, getProduct);

/**
 * @swagger
 * /admin/slider/add:
 *   post:
 *     summary: Add a new slider
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *               type:
 *                 type: string
 *               displayOrder:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Slider added successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.post("/slider/add", adminAccess, addSlider);

/**
 * @swagger
 * /admin/slider/{sliderId}:
 *   delete:
 *     summary: Delete a slider
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: sliderId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Slider deleted successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.delete("/slider/:sliderId", adminAccess, deleteSlider);

/**
 * @swagger
 * /admin/slider/{sliderId}:
 *   patch:
 *     summary: Update a slider
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: sliderId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *               displayOrder:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Slider updated successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.patch("/slider/:sliderId", adminAccess, updateSlider);

/**
 * @swagger
 * /admin/slider/{type}:
 *   get:
 *     summary: Get sliders by type
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sliders fetched successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.get("/slider/:type", adminAccess, getSliderByType);

/**
 * @swagger
 * /admin/allProductForDiscount:
 *   get:
 *     summary: Retrieve a list of all products for discount
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: A list of products
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
 *                     example: "Product Name"
 *                   Price:
 *                     type: number
 *                     example: 100.00
 *       500:
 *         description: Internal server error
 */
router.get("/allProductForDiscount", adminAccess, getAllProducts);

/**
 * @swagger
 * /admin/allCategoryForDiscount:
 *   get:
 *     summary: Retrieve a list of all categories for discount
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: A list of categories
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
 *                     example: "Category Name"
 *       500:
 *         description: Internal server error
 */
router.get("/allCategoryForDiscount", adminAccess, getAllCategories);

/**
 * @swagger
 * /admin/applyDiscountToProduct/{discountId}:
 *   post:
 *     summary: Apply discount to products in array
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: discountId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The discount ID
 *     requestBody:
 *       description: List of product IDs to apply the discount to
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Discount applied successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Discount or products not found
 *       500:
 *         description: Internal server error
 */
router.post("/applyDiscountToProduct/:discountId", adminAccess, applyDiscountToProducts);

/**
 * @swagger
 * /admin/applyDiscountToCategory/{discountId}:
 *   post:
 *     summary: Apply discount to categories in array
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: discountId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The discount ID
 *     requestBody:
 *       description: List of category IDs to apply the discount to
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               categoryIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Discount applied successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Discount or categories not found
 *       500:
 *         description: Internal server error
 */
router.post("/applyDiscountToCategory/:discountId", adminAccess, applyDiscountToCategory);

/**
 * @swagger
 * /admin/removeDiscountFromProduct/{discountId}:
 *   post:
 *     summary: Remove discount from products in array
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: discountId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The discount ID
 *     requestBody:
 *       description: List of product IDs to remove the discount from
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Discount removed successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Discount or products not found
 *       500:
 *         description: Internal server error
 */
router.post("/removeDiscountFromProduct/:discountId", adminAccess, removeDiscountFromProducts);

/**
 * @swagger
 * /admin/removeDiscountFromCategory/{discountId}:
 *   post:
 *     summary: Remove discount from categories in array
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: discountId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The discount ID
 *     requestBody:
 *       description: List of category IDs to remove the discount from
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               categoryIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Discount removed successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Discount or categories not found
 *       500:
 *         description: Internal server error
 */
router.post("/removeDiscountFromCategory/:discountId", adminAccess, removeDiscountFromCategory
);

/**
 * @swagger
 * /admin/stats:
 *   get:
 *     summary: Retrieve various statistics
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalCustomers:
 *                   type: integer
 *                   example: 1000
 *                 registeredCustomers:
 *                   type: integer
 *                   example: 800
 *                 totalOrders:
 *                   type: integer
 *                   example: 5000
 *                 newOrders:
 *                   type: integer
 *                   example: 50
 *       500:
 *         description: Internal server error
 */
router.get("/stats", adminAccess, getStats);

/**
 * @swagger
 * /admin/orderStats:
 *   get:
 *     summary: Retrieve order statistics
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Order statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 today:
 *                   type: integer
 *                   example: 10
 *                 thisWeek:
 *                   type: integer
 *                   example: 50
 *                 thisMonth:
 *                   type: integer
 *                   example: 200
 *                 thisYear:
 *                   type: integer
 *                   example: 2400
 *                 allTime:
 *                   type: integer
 *                   example: 10000
 *       500:
 *         description: Internal server error
 */
router.get("/orderStats", adminAccess, getOrderStats);

/**
 * @swagger
 * /admin/orderValue:
 *   get:
 *     summary: Retrieve the number of orders
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Number of orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 today:
 *                   type: integer
 *                   example: 10
 *                 thisWeek:
 *                   type: integer
 *                   example: 50
 *                 thisMonth:
 *                   type: integer
 *                   example: 200
 *                 thisYear:
 *                   type: integer
 *                   example: 2400
 *                 allTime:
 *                   type: integer
 *                   example: 10000
 *       500:
 *         description: Internal server error
 */
router.get("/orderValue", adminAccess, getValueOrders);

/**
 * @swagger
 * /admin/activeCustomers:
 *   get:
 *     summary: Retrieve a list of active customers
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: A list of active customers
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
router.get("/activeCustomers", adminAccess, getActiveCustomers);

/**
 * @swagger
 * /admin/newCustomers:
 *   get:
 *     summary: Retrieve a list of new customers
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: A list of new customers
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
router.get("/newCustomers", adminAccess, getNewCustomers);

/**
 * @swagger
 * /admin/bestSellerByAmount:
 *   get:
 *     summary: Retrieve the best-selling products by amount
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Best-selling products by amount retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   productId:
 *                     type: integer
 *                     example: 1
 *                   productName:
 *                     type: string
 *                     example: "Product Name"
 *                   totalAmount:
 *                     type: number
 *                     example: 1000.50
 *       500:
 *         description: Internal server error
 */
router.get("/bestSellerByAmount", adminAccess, getBestSellerByAmount);

/**
 * @swagger
 * /admin/bestSellerByQuantity:
 *   get:
 *     summary: Retrieve the best-selling products by quantity
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Best-selling products by quantity retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   productId:
 *                     type: integer
 *                     example: 1
 *                   productName:
 *                     type: string
 *                     example: "Product Name"
 *                   totalQuantity:
 *                     type: integer
 *                     example: 100
 *       500:
 *         description: Internal server error
 */
router.get("/bestSellerByQuantity", adminAccess, getBestSellerByQunatity);

export default router;
