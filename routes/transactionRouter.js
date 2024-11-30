const express = require("express");
const router = express.Router({ mergeParams: true });
const transactionController = require("../controllers/transactionController");
const { authenticate, checkFirstLogin, checkLockedAccount } = require("../middlewares/auth");

router.use(authenticate);
router.use(checkLockedAccount);
router.use(checkFirstLogin);

// Hiển thị giao diện trang Transaction
router.get("/", transactionController.viewTransactionPage);

// Thêm sản phẩm vào list giỏ hàng
router.post('/add-to-cart', transactionController.addProductToCart);

// Cập nhật số lượng sản phẩm trong giỏ hảng
router.put('/update-cart', transactionController.updateQuantity);

// Xóa sản phẩm khỏi giỏ hàng
router.delete('/remove-from-cart', transactionController.removeProductFromCart);

// Tạo đơn hàng và in hóa đơn
router.post('/checkout', transactionController.checkOut);

// Tải hóa đơn
router.get('/order/:orderId/download', transactionController.downloadInvoice)

module.exports = router;
