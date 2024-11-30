const express = require("express");
const router = express.Router();
const employeeController = require("../controllers/employeeController");
const { authenticate, isAdmin, checkFirstLogin, checkLockedAccount } = require("../middlewares/auth");

router.use(authenticate);
router.use(isAdmin);
router.use(checkLockedAccount)
router.use(checkFirstLogin);

// Danh sách nhân viên
router.get("/", employeeController.viewEmployeeList);

// Thông tin chi tiết nhân viên
router.get("/:id/details", employeeController.viewEmployeeDetails)

// Create Employee
router.post("/create-new", employeeController.createEmployee);

// Admin gửi lại email kích hoạt
router.post("/:id/resend", employeeController.resendEmail);

// Admin khóa/mở khóa tài khoản nhân viên
router.post('/:id/toggle-lock', employeeController.toggleLock);

// Xem thông tin bán hàng của nhân viên
router.get("/:id/sales-info", employeeController.getEmployeeSalesInfo);

module.exports = router;
