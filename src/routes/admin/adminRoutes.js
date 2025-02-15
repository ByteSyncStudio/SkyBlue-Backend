import express from "express";
import {
  getUnapprovedUsers,
  approveUser,
} from "../../controllers/admin/approve/approveController.js";
import {
  addCustomerToVendor,
  createNewVendor,
  getAllVendors,
  getOneVendor,
  getOneVendorEdit,
  getVendorAddress,
  getVendorProducts,
  patchVendor,
  removeCustomerToVendor,
  searchCustomerByEmail,
  updateVendorAddress,
} from "../../controllers/admin/vendors/adminVendorsController.js";
import {
  addNewOrderNote,
  addOrderNote,
  AddProductToOrderController,
  deleteOrderNote,
  getallOrders,
  getOrderNotes,
  getSingleOrder,
  UpdateBillingInfoController,
  UpdateOrderController,
  UpdateOrderItemController,
  UpdatePriceController,
  UpdateShippingMethodController,
} from "../../controllers/admin/Orders/adminOrdersController.js";
import {
  addProduct,
  updateProduct,
  deleteProduct,
  getProducts,
  getProduct,
  deleteTierPrice,
  listInventory,
  tester,
  updateProductStock,
  getProductNames,
  getProductSeoDetail,
  updateProductSeoDetail,
  getProductDetail,
  getProductDetailInventory,
  getProductAvaliability,
  getProductMapping,
  updateGeneralInfoProduct,
  getProductPurchasedWithOrder,
  updatePriceDetailsProduct,
  addTierPrice,
  deleteTierPriceProduct,
  editTierPriceProduct,
  updateInventoryProduct,
  updateProductMapping,
  getProductImages,
  addProductImages,
  deleteProductImage,
  updatePublishedStatus,
  deleteSelectedProduct,
  getAllProductAttributes,
  updateProductAttribute,
  getUsedByAttributes,
  addProductAttribute,
  deleteProductAttribute,
  getAttributeProduct,
  addProductAttributeMapping,
  deleteProductAttributeMapping,
  updateProductAttributeMapping,
  getPredefinedattribute,
  updatePreDefinedProductAttribute,
  deletePreDefineProductAttribute,
  addPreDefineProductAttribute,
} from "../../controllers/admin/product/adminProductcontroller.js";
import {
  addCustomerAddress,
  deleteCustomerAddress,
  editCustomer,
  getAllCustomersWithRoles,
  getCustomerAddress,
  getCustomerByOrderTotal,
  getCustomerOrder,
  getCustomerRoles,
  getCustomerShoppingCart,
  getSingleCustomer,
  getSingleCustomerAddress,
} from "../../controllers/admin/customer/adminCustomerController.js";
import { getBestSellers } from "../../controllers/admin/product/adminProductcontroller.js";
import {
  applyDiscountToCategory,
  applyDiscountToManufacturer,
  applyDiscountToProducts,
  deleteDiscounts,
  deleteDiscountUsage,
  editDiscount,
  editDiscountType,
  getAllDiscounts,
  getDiscountToCategory,
  getDiscountToManufacturer,
  getDiscountToProducts,
  getDiscountWithTypes,
  getSubCategoryDiscounts,
  getUsageDiscount,
  postDiscounts,
  removeDiscountFromCategory,
  removeDiscountFromProducts,
  removeDiscountToManufacturer,
} from "../../controllers/admin/discount/adminDiscountController.js";
import {
  getAllCategories as getAllCategories_Category,
  addCategory,
  updateCategory,
  deleteCategory,
  getSingleCategory,
} from "../../controllers/admin/category/adminCategoryController.js";
import {
  addSlider,
  deleteSlider,
  updateSlider,
  getSliderByType,
} from "../../controllers/admin/slider/adminSliderController.js";
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
  newCustomersInPastMonths,
  totalCustomersByPeriod,
  totalOrdersByPeriod,
} from "../../controllers/admin/stats/adminStatsController.js";
import { adminLogin } from "../../controllers/admin/auth/adminLoginController.js";
import {
  authenticateToken,
  authorizeRoles,
} from "../../middleware/authMiddleware.js";
import {
  addManufacturer,
  addProductManufacturerController,
  deleteManufacturer,
  deleteManufacturerProductController,
  editManufacturer,
  getAllManufacturers,
  getManufacturersProducts,
} from "../../controllers/admin/manufacturer/adminManufacturerController.js";
import {
  currentCartsTotalItems,
  orderSheet,
  specificCart,
} from "../../controllers/admin/sales/adminSalesController.js";
import {
  addRole,
  deleteRole,
  editRole,
  getRoles,
} from "../../controllers/admin/roles/adminRolesController.js";
import { sendEmail } from "../../controllers/admin/email/adminEmailController.js";
import {
  getCountriesAndStates,
  updateShippingMethod,
} from "../../repositories/admin/Orders/adminOrders.js";
import {
  addProductToFlyerController,
  deleteProductFlyerController,
  editProductFlyerController,
  getAllFlyerController,
  getFlyerPreviewController,
} from "../../controllers/admin/flyer/adminFlyerController.js";
import {
  deleteCampaignController,
  editCampaignController,
  getAllCampaignController,
  getPictureById,
  getWithIdCampaignController,
  postCampaignController,
  uploadImage,
} from "../../controllers/admin/Campaign/adminCampaignController.js";
import multer from "multer";
import {
  bulkDeleteProducts,
  getBulkProducts,
  updateBulkEdit,
} from "../../controllers/admin/vendors/adminBulkEditController.js";
import {
  addShippingMethod,
  deleteShippingMethod,
  getContentManagementSystem,
  getShippingMethods,
  updateShippingMethodofOrder,
} from "../../controllers/admin/Configurations/shippingMethodController.js";

const router = express.Router();

//Login
router.post("/login", adminLogin);

router.use(authenticateToken);

const adminAccess = authorizeRoles(["Registered", "Administrators"]);

//Approval
router.get("/unapproved", adminAccess, getUnapprovedUsers);

router.put("/approve/:id", adminAccess, approveUser);


//Products
router.post("/product/add", adminAccess, addProduct);

router.get("/product/images/:id", adminAccess, getProductImages);

router.post("/product/images/add/:id", adminAccess, addProductImages);

router.delete(
  "/product/images/:productId/delete/:imageId",
  adminAccess,
  deleteProductImage
);

router.patch("/product/:id", adminAccess, updateProduct);

router.delete("/product/tier-price", adminAccess, deleteTierPrice);

router.delete("/product/:id", adminAccess, deleteProduct);

//Vendors 
router.get("/vendors", adminAccess, getAllVendors);

router.post("/create-vendors", adminAccess, createNewVendor);

router.patch("/editvendor/:id", adminAccess, patchVendor);

router.get("/vendor-products/:vendorId", adminAccess, getVendorProducts);

router.get("/getonevendor/:id", adminAccess, getOneVendor);

router.get("/getonevendoredit/:id", adminAccess, getOneVendorEdit);

router.patch(
  "/addcustomertovendor/:vendorId",
  adminAccess,
  addCustomerToVendor
);

router.patch("/removecustomervendor", adminAccess, removeCustomerToVendor);

router.get("/getvendoraddress/:vendorId", adminAccess, getVendorAddress);

router.patch(
  "/update-vendor-address/:vendorId",
  adminAccess,
  updateVendorAddress
);

//Bulk Products
router.get("/bulk-products", adminAccess, getBulkProducts);

router.delete("/bulk-delete-products", adminAccess, bulkDeleteProducts);

router.patch("/bulk-products/bulk-edit", adminAccess, updateBulkEdit);


router.get("/searchcustomer", adminAccess, searchCustomerByEmail);


//Orders
router.get("/all-orders", adminAccess, getallOrders);

router.get("/single-order/:id", adminAccess, getSingleOrder);

//Customers
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
// router.patch("/customer/:id", adminAccess, updateCustomerRolesAndStatus);

router.get("/customer/roles", adminAccess, getCustomerRoles);


//BestSeller
router.get("/bestseller", adminAccess, getBestSellers);

router.get("/bestSellerByAmount", adminAccess, getBestSellerByAmount);

router.get("/bestSellerByQuantity", adminAccess, getBestSellerByQunatity);

//Discounts
router.get("/alldiscounts", adminAccess, getAllDiscounts);

router.get("/discount/subcategories", adminAccess, getSubCategoryDiscounts);

router.get("/edit-discount/:id", adminAccess, editDiscountType);

router.get("/discount/:type", adminAccess, getDiscountWithTypes);

router.post("/post-discounts", adminAccess, postDiscounts);

router.delete("/delete-discount/:id", adminAccess, deleteDiscounts);


//Category
router.get("/category/all", adminAccess, getAllCategories_Category);

router.post("/category/add", adminAccess, addCategory);

router.patch("/category/edit/:id", adminAccess, updateCategory);

router.delete("/category/delete/:id", adminAccess, deleteCategory);

router.get("/category/single/:id", getSingleCategory);


//Products 2
router.get("/product/search", adminAccess, getProducts);

router.get("/product/names", adminAccess, getProductNames);

router.get("/product/:id", adminAccess, getProduct);

router.get("/product-seo-detail/:id", adminAccess, getProductSeoDetail);

router.patch("/product-seo-detail/:id", adminAccess, updateProductSeoDetail);

router.post("/product/tierPrice/:id", adminAccess, addTierPrice);

router.delete("/product/tierPrice/:id", adminAccess, deleteTierPriceProduct);

router.get("/product-detail/:id", adminAccess, getProductDetail);
router.get(
  "/product-detail-inventory/:id",
  adminAccess,
  getProductDetailInventory
);

router.get("/product-avaliability", adminAccess, getProductAvaliability);

router.get("/product-mapping/:id", adminAccess, getProductMapping);
router.get(
  "/product/purchasedwithorder/:id",
  adminAccess,
  getProductPurchasedWithOrder
);

router.patch("/product/generalinfo/:id", adminAccess, updateGeneralInfoProduct);

router.patch(
  "/product/priceDetails/:id",
  adminAccess,
  updatePriceDetailsProduct
);

router.patch("/product/editTierPrice/:id", adminAccess, editTierPriceProduct);

router.patch(
  "/product/updateInventory/:id",
  adminAccess,
  updateInventoryProduct
);

router.patch("/product/updateMapping/:id", adminAccess, updateProductMapping);

router.put("/product/publish-product", adminAccess, updatePublishedStatus);

router.put("/product/delete-product", adminAccess, deleteSelectedProduct);


//proudct Attributes
router.get("/product/attribute-product/:id", adminAccess, getAttributeProduct)
router.post("/product/add-product-attribute/:productId", adminAccess, addProductAttributeMapping);


router.delete("/product/delete-product-attribute/:productId", adminAccess, deleteProductAttributeMapping);
router.patch(
  "/product/update-product-attribute/:productId",
  adminAccess,
  updateProductAttributeMapping
);

//shipping method
router.get("/shipping-method/all", adminAccess, getShippingMethods);
router.post("/shipping-method/add", adminAccess, addShippingMethod);
router.patch("/shipping-method/edit", adminAccess, updateShippingMethodofOrder);
router.delete("/shipping-method/delete", adminAccess, deleteShippingMethod);

//AccesListControl
router.get(
  "/content-management/access-list-control",
  adminAccess,
  getContentManagementSystem
);

//ProductAttribute
router.get("/product-attributes", adminAccess, getAllProductAttributes);
router.get("/usedBy-ProductAttribute/:id", adminAccess, getUsedByAttributes)
router.get("/product/get-predefined-attributes/:id", adminAccess, getPredefinedattribute);
router.patch("/product/edit-predefined-value/:id", adminAccess, updatePreDefinedProductAttribute);
router.delete("/product/delete-predefined-value/:id", adminAccess, deletePreDefineProductAttribute);
router.post("/product/add-predefined-value/:id", adminAccess, addPreDefineProductAttribute);

router.patch("/edit-product-attribute/:id", adminAccess, updateProductAttribute);
router.post("/add-new-product-attribute", adminAccess, addProductAttribute);
router.delete("/delete-product-attribute/:id", adminAccess, deleteProductAttribute);


//Slider
router.post("/slider/add", adminAccess, addSlider);

router.delete("/slider/:sliderId", adminAccess, deleteSlider);

router.patch("/slider/:sliderId", adminAccess, updateSlider);

router.get("/slider/:type", adminAccess, getSliderByType);


//Poduct and category for discount
router.get("/allProductForDiscount", adminAccess, getAllProducts);

router.get("/allCategoryForDiscount", adminAccess, getAllCategories);

router.post(
  "/applyDiscountToProduct/:discountId",
  adminAccess,
  applyDiscountToProducts
);

router.get(
  "/get-discount-to-product/:discountId",
  adminAccess,
  getDiscountToProducts
);
router.get(
  "/get-discount-to-category/:discountId",
  adminAccess,
  getDiscountToCategory
);

router.get("/usage-discount/:discountId", adminAccess, getUsageDiscount);

router.delete("/discount-usage/:discountId", adminAccess, deleteDiscountUsage);

router.patch("/edit-discount/:discountId", adminAccess, editDiscount);

router.get(
  "/get-discount-to-manufacturer/:discountId",
  adminAccess,
  getDiscountToManufacturer
);
router.post(
  "/apply-discount-to-manufacturer/:discountId",
  adminAccess,
  applyDiscountToManufacturer
);
router.delete(
  "/remove-discount-to-manufacturer/:discountId",
  adminAccess,
  removeDiscountToManufacturer
);

router.post(
  "/applyDiscountToCategory/:discountId",
  adminAccess,
  applyDiscountToCategory
);

router.post(
  "/removeDiscountFromProduct/:discountId",
  adminAccess,
  removeDiscountFromProducts
);

router.post(
  "/removeDiscountFromCategory/:discountId",
  adminAccess,
  removeDiscountFromCategory
);

//Stats
router.get("/stats", adminAccess, getStats);

router.get("/orderStats", adminAccess, getOrderStats);

router.get("/orderValue", adminAccess, getValueOrders);

//Set customer Active
router.get("/activeCustomers", adminAccess, getActiveCustomers);

router.get("/newCustomers", adminAccess, getNewCustomers);


//period
router.get("/past-orders", adminAccess, totalOrdersByPeriod);

router.get("/past-customers", adminAccess, totalCustomersByPeriod);

router.get("/monthly-customers", adminAccess, newCustomersInPastMonths);

//Manufacturere
router.get("/manufacturer", adminAccess, getAllManufacturers);

router.get("/manufacturer/products/:id", getManufacturersProducts);

router.post("/manufacturer", adminAccess, addManufacturer);

router.patch("/manufacturer/:id", adminAccess, editManufacturer);

router.delete("/manufacturer/:id", adminAccess, deleteManufacturer);


//Inventory

router.get("/inventory", adminAccess, listInventory);

//Carts
router.get("/current-carts", adminAccess, currentCartsTotalItems);

router.get("/specific-cart/:id", adminAccess, specificCart);

//Customer Report
router.get("/customer-report", adminAccess, getCustomerByOrderTotal);

//Roles
router.get("/roles", adminAccess, getRoles);

router.post("/roles", adminAccess, addRole);

router.patch("/roles/:id", adminAccess, editRole);

router.delete("/roles/:id", adminAccess, deleteRole);

//OrderSheet
router.get("/ordersheet", adminAccess, orderSheet);

//Customer Address
router.get("/customer-details/:id", adminAccess, getSingleCustomer);

router.get(
  "/customer-details-address/:id",
  adminAccess,
  getSingleCustomerAddress
);
router.delete("/customer-address/:id", adminAccess, deleteCustomerAddress);

router.get("/edit-customer-order/:id", adminAccess, getCustomerOrder);

router.get("/edit-customer-address/:id", adminAccess, getCustomerAddress);

router.post("/add-customer-address/:id", adminAccess, addCustomerAddress);

router.get(
  "/edit-customer-shopping-cart/:id",
  adminAccess,
  getCustomerShoppingCart
);

router.patch("/customer-details/:id", adminAccess, editCustomer);

/**
 * @swagger
 * /admin/send-email:
 *   post:
 *     summary: Send an email
 *     tags:
 *       - Admin
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               to:
 *                 type: string
 *                 description: Recipient email address
 *               subject:
 *                 type: string
 *                 description: Email subject
 *               text:
 *                 type: string
 *                 description: Email content in HTML format
 *     responses:
 *       200:
 *         description: Email sent successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
router.post("/send-email", adminAccess, sendEmail);

//Orders
router.patch("/editOrder/:id", adminAccess, UpdateOrderController);

router.post(
  "/orders/:orderId/add-product/:productId",
  adminAccess,
  AddProductToOrderController
);

router.patch("/editprice/:id", adminAccess, UpdatePriceController);

router.patch(
  "/orders/:orderId/billing-info",
  adminAccess,
  UpdateBillingInfoController
);

router.patch(
  "/orders/:orderId/shipping-info",
  adminAccess,
  UpdateShippingMethodController
);

router.patch(
  "/orders/:orderId/order-items/:orderItemId",
  adminAccess,
  UpdateOrderItemController
);

router.post("/orders/:orderId/notes", adminAccess, addOrderNote);

router.get("/orders/notes/:orderId", adminAccess, getOrderNotes);

router.post("/orders/newnotes/:orderId", adminAccess, addNewOrderNote);

router.delete("/orders/notes-delete/:id", adminAccess, deleteOrderNote);

router.get("/orders/countries-states", adminAccess, getCountriesAndStates);

//Flyers
router.get("/flyers/all-flyers", adminAccess, getAllFlyerController);

router.post("/flyers/add-flyer", adminAccess, addProductToFlyerController);

router.get("/flyers/flyer-preview", adminAccess, getFlyerPreviewController);

router.patch(
  "/flyers/edit-flyer/:flyerid",
  adminAccess,
  editProductFlyerController
);

router.delete(
  "/flyers/delete-flyer/:flyerid",
  adminAccess,
  deleteProductFlyerController
);

//Campaign
router.get("/campaigns/all-campaigns", adminAccess, getAllCampaignController);

router.get(
  "/campaigns/edit-campaigns/:id",
  adminAccess,
  editCampaignController
);

router.post("/campaigns/create-campaign", adminAccess, postCampaignController);

router.get("/campaigns/:id", adminAccess, getWithIdCampaignController);

router.put("/campaigns/:id", adminAccess, editCampaignController);
router.delete("/delete-campaigns/:id", adminAccess, deleteCampaignController);

// Route for adding product manufacturer mapping
router.post(
  "/add-manufacturer-product/:manufacturerId",
  adminAccess,
  addProductManufacturerController
);

router.delete(
  "/manufacturer/product/:productId/:manufacturerId",
  adminAccess,
  deleteManufacturerProductController
);

router.patch("/product-stock/:productId", adminAccess, updateProductStock);

router.get("/test", adminAccess, tester);

router.post("/upload-image", adminAccess, uploadImage);

router.get("/picture/:id", adminAccess, getPictureById);

export default router;
