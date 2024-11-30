const express = require("express");
const router = express.Router();
const upload_product_img = require("../middlewares/upload_product_img");
const { authenticate, isAdmin, checkFirstLogin, checkLockedAccount } = require("../middlewares/auth");
const {
  getAllProducts,
  getProductDetails,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

// Hiển thị danh sách sản phẩm
// Query parameters: ?page=<page_number>&limit=<items_per_page>
// Example: /products?page=1&limit=10
router.get("/", authenticate, checkLockedAccount, checkFirstLogin, getAllProducts);

// Hiển thị chi tiết sản phẩm
router.get("/:barcode/details", authenticate, checkLockedAccount, checkFirstLogin, getProductDetails);

// Thêm sản phẩm mới (upload tối đa 4 file)
router.post("/", authenticate, isAdmin, checkLockedAccount, checkFirstLogin, upload_product_img, createProduct);

// Cập nhật sản phẩm (upload tối đa 4 file)
router.put("/:barcode/edit", authenticate, isAdmin, checkLockedAccount, checkFirstLogin, upload_product_img, updateProduct);

// Xóa sản phẩm
router.delete("/:barcode/delete", authenticate, isAdmin, checkLockedAccount, checkFirstLogin, deleteProduct);

module.exports = router;
