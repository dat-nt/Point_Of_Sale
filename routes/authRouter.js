const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, isAdmin, redirectIfLoggedIn, checkFirstLogin, checkLockedAccount } = require("../middlewares/auth");

// Trang login
router.get("/login", redirectIfLoggedIn, authController.viewLoginPage);

// Xử lí Login
router.post("/login", authController.login);

// Trang đổi mật khẩu khi đăng nhập lần đầu
router.get("/first-login-change-password", authenticate, checkLockedAccount, authController.viewFirstLoginChangePass);

// Xử li đổi mật khẩu khi đăng nhập lần đầu
router.post("/first-login-change-password", authenticate, checkLockedAccount, authController.firstLoginChangePass);

// Đổi mật khẩu
router.put("/change-password", authenticate, checkLockedAccount, checkFirstLogin, authController.changePassword);

// Logout
router.get("/logout", authenticate, authController.logout);

// Nhân viên kích hoạt tài khoản
router.get("/activate/:token", authController.activateAccount);

module.exports = router;
