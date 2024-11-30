const express = require('express');
const router = express.Router();
const {
    getAllCategories,
    createCategory,
    updateCategory,
    deleteCategory
} = require("../controllers/categoryController");

const { authenticate, isAdmin, checkFirstLogin, checkLockedAccount } = require("../middlewares/auth");

// Hiển thị tất cả danh mục
router.get("/", authenticate, checkLockedAccount, checkFirstLogin, getAllCategories);

// Thêm danh mục mới
router.post("/", authenticate, isAdmin, checkLockedAccount, checkFirstLogin, createCategory);

// Cập nhật danh mục
router.put("/:id/edit", authenticate, isAdmin, checkLockedAccount, checkFirstLogin, updateCategory);

// Xóa danh mục
router.delete("/:id/delete", authenticate, isAdmin, checkLockedAccount, checkFirstLogin, deleteCategory);

module.exports = router;
