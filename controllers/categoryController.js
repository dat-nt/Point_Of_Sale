const mongoose = require("mongoose");
const Category = require('../models/Category');
const Product = require('../models/Product');

// Lấy tất cả danh mục
const getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find().lean();
        res.render("categories", {
            layout: "main-layout",
            title: "Danh mục sản phẩm",
            categories,
            user: req.user
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi khi lấy danh sách danh mục: " + error.message });
    }
};

// Tạo danh mục mới
const createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: "Tên danh mục không được để trống" });
        }

        const category = new Category({ name, description });
        await category.save();

        req.flash("success_msg", `Thêm thành công danh mục "${category.name}".`);
        res.redirect('/categories')
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi khi tạo danh mục: " + error.message });
    }
};

// Cập nhật danh mục
const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        // Tìm và cập nhật danh mục
        const category = await Category.findByIdAndUpdate(
            id,
            { name, description },
            { new: true }
        );

        if (!category) {
            return res.status(404).json({ success: false, message: "Danh mục không tồn tại" });
        }

        res.status(200).json({ success: true, message: "Cập nhật danh mục thành công", category });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi khi cập nhật danh mục: " + error.message });
    }
};

// Xóa danh mục
const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        // Kiểm tra danh mục có tồn tại không
        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({
                success: false, message: "Danh mục không tồn tại"
            });
        }

        // Kiểm tra xem danh mục có liên kết với bất kỳ sản phẩm nào không
        const isCategoryInUse = await Product.exists({ category: id });
        if (isCategoryInUse) {
            return res.status(400).json({
                success: false, message: "Không thể xóa danh mục vì vẫn còn sản phẩm liên kết."
            });
        }

        // Xóa danh mục
        await Category.findByIdAndDelete(id);

        res.status(200).json({
            success: true, message: "Xóa danh mục thành công."
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false, message: `Lỗi khi xóa danh mục: ${error.message}`
        });
    }
};

module.exports = {
    getAllCategories,
    createCategory,
    updateCategory,
    deleteCategory
};
