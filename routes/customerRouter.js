const express = require('express');
const router = express.Router();
const customerController = require("../controllers/customerController");
const { authenticate, checkFirstLogin, checkLockedAccount } = require("../middlewares/auth");

router.use(authenticate);
router.use(checkLockedAccount);
router.use(checkFirstLogin);

// Lấy dữ liệu khách hàng
router.get('/', customerController.getCustomerData);

router.get('/purchase-history', customerController.getCustomerPurchaseHistoryData)

module.exports = router;