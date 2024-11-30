const express = require('express');
const router = express.Router();
const reportController = require("../controllers/reportController");
const { authenticate, checkFirstLogin, checkLockedAccount } = require("../middlewares/auth");

// Hiển thị giao diện báo cáo
router.get("/", authenticate, checkLockedAccount, checkFirstLogin, reportController.viewReports);

// Lọc dữ liệu report
router.post("/filter", authenticate, checkLockedAccount, checkFirstLogin, reportController.filterOrderData);

router.get("/order/:orderId/details", authenticate, checkLockedAccount, checkFirstLogin, reportController.getOrderDetailsData);

module.exports = router;
