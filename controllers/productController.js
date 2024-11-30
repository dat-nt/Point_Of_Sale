const fs = require("fs");
const path = require("path");
const Product = require("../models/Product");
const Category = require('../models/Category');
const Order = require('../models/Order')
const mongoose = require("mongoose");

// Hiển thị danh sách sản phẩm
const getAllProducts = async (req, res) => {
    try {
        let page = parseInt(req.query.page) || 1;
        let limit = parseInt(req.query.limit) || 10;
        let skip = (page - 1) * limit;

        // Đếm tổng số sản phẩm
        const totalProducts = await Product.countDocuments();
        const totalPages = Math.ceil(totalProducts / limit);

        // Kiểm tra nếu trang vượt quá tổng số trang, reset về trang 1
        if (page > totalPages) {
            page = 1;
            skip = 0;
        }

        // Nếu không phải admin, loại bỏ importPrice từ kết quả truy vấn
        const projection = req.user.isAdmin ? {} : { importPrice: 0 };
        const products = await Product.find({}, projection)
            .populate('category', 'name')
            .skip(skip)
            .limit(limit)
            .lean();

        // Nếu không có sản phẩm ở trang hiện tại, reset về trang 1
        if (products.length === 0 && page > 1) {
            return res.redirect(`/products?page=1&limit=${limit}`);
        }

        const categories = await Category.find().lean();
    
        res.render("products", {
            layout: "main-layout",
            title: "Danh sách sản phẩm",
            products,
            categories,
            user: req.user,
            currentPage: page,
            limit,
            totalPages,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi khi tải trang: " + error.message });
    }
};

// Hiển thị chi tiết sản phẩm theo barcode
const getProductDetails = async (req, res) => {
    try {
        const { barcode } = req.params;
        const product = await Product.findOne({ barcode }).populate("category", "name").lean();

        if (!product) {
            return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm." });
        }

        if (!req.user.role === "Admin") {
            delete product.importPrice;
        }

        res.render("product_details", { title: "Chi tiết sản phẩm", layout: "main-layout", product, user: req.user });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi khi lấy chi tiết sản phẩm: " + error.message });
    }
};

async function generate_barcode() {
    try {
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = String(today.getFullYear()).slice(-2);
        const datePrefix = `${day}${month}${year}`;

        // Tìm sản phẩm có barcode lớn nhất bắt đầu với tiền tố ngày hiện tại
        const lastProduct = await mongoose
            .model("Product")
            .findOne({ barcode: new RegExp(`^${datePrefix}`) })
            .sort({ barcode: -1 }) // Sắp xếp giảm dần
            .select("barcode"); // Chỉ lấy trường barcode để tối ưu hóa

        // Tính toán barcode tiếp theo
        const nextCounter = lastProduct
            ? parseInt(lastProduct.barcode.slice(6), 10) + 1
            : 1; // Nếu không có sản phẩm nào, bắt đầu từ 1

        // Tạo barcode với định dạng `ddmmyyxxxxx`
        const barcode = `${datePrefix}${String(nextCounter).padStart(5, '0')}`;
        return barcode;
    } catch (error) {
        console.error("Lỗi khi tạo barcode:", error.message);
        throw new Error("Không thể tạo barcode mới.");
    }
}

// Thêm sản phẩm mới
const createProduct = async (req, res) => {
    try {
        const { name, importPrice, retailPrice, category, quantity, description } = req.body;

        if (!name || !importPrice || !retailPrice || !category || !quantity) {
            return res.status(400).json({ success: false, message: "Vui lòng điền đầy đủ các thông tin cần thiết." });
        }

        if (importPrice <= 0 || retailPrice <= 0) {
            return res.status(400).json({ success: false, message: 'Giá tiền phải lớn hơn 0.' });
        }

        if (quantity < 1) {
            return res.status(400).json({ success: false, message: 'Số lượng phải lớn hơn hoặc bằng 1.' });
        }

        // Kiểm tra số lượng ảnh được upload
        if (!req.files || req.files.length < 1 || req.files.length > 5) {
            return res.status(400).json({ success: false, message: "Phải upload từ 1 đến 4 ảnh cho mỗi sản phẩm." });
        }

        // Lưu danh sách tên file ảnh
        const images = req.files.map((file) => file.filename);

        let barcode = await generate_barcode();

        const product = new Product({ barcode, name, importPrice, retailPrice, category, quantity, description, images });

        await product.save();

        // Lấy sản phẩm vừa tạo, kèm thông tin category
        const populatedProduct = await Product.findById(product._id).populate('category', 'name');

        res.status(201).json({ success: true, message: `Thêm sản phẩm ${product.barcode} thành công`, product: populatedProduct });
    } catch (error) {
        res.status(400).json({ success: false, message: "Lỗi khi thêm sản phẩm: " + error.message });
    }
};

// Cập nhật sản phẩm
const updateProduct = async (req, res) => {
    try {
        const { barcode } = req.params;
        const { name, importPrice, retailPrice, category, quantity, description } = req.body;

        if (!name || !importPrice || !retailPrice || !category || !quantity) {
            return res.status(400).json({ success: false, message: "Vui lòng điền đầy đủ các thông tin cần thiết." });
        }

        if (importPrice <= 0 || retailPrice <= 0) {
            return res.status(400).json({ success: false, message: 'Giá tiền phải lớn hơn 0.' });
        }

        if (quantity < 0) {
            return res.status(400).json({ success: false, message: 'Số lượng không thể nhỏ hơn 0.' });
        }

        const product = await Product.findOne({ barcode });
        if (!product) {
            return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm." });
        }

        let images = product.images;
        if (req.files && req.files.length > 0) {
            if (req.files.length > 5) {
                return res.status(400).json({ success: false, message: "Không thể upload nhiều hơn 5 ảnh." });
            }

            product.images.forEach((image) => {
                const filePath = path.join(__dirname, "../public/img/products", image);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            });
            images = req.files.map((file) => file.filename);
        }

        product.set({ name, importPrice, retailPrice, category, description, quantity, images });
        await product.save();
        // Lấy sản phẩm vừa tạo, kèm thông tin category
        const populatedProduct = await Product.findById(product._id).populate('category', 'name');

        res.status(200).json({ success: true, message: `Cập nhật sản phẩm ${barcode} thành công`, product: populatedProduct });
    } catch (error) {
        res.status(400).json({ success: false, message: "Lỗi khi cập nhật sản phẩm: " + error.message });
    }
};

// Xóa sản phẩm
const deleteProduct = async (req, res) => {
    try {
        const { barcode } = req.params;
        const product = await Product.findOne({ barcode });
        if (!product) {
            return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm." });
        }

        const isLinkedToOrder = await Order.exists({ "products.product_id": product._id });
        if (isLinkedToOrder) {
            return res.status(400).json({ success: false, message: "Sản phẩm đã được mua, không thể xóa." });
        }

        product.images.forEach((image) => {
            const filePath = path.join(__dirname, "../public/img/products", image);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        });

        await Product.deleteOne({ barcode });
        res.status(200).json({ success: true, message: `Xóa sản phẩm ${barcode} thành công` });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi khi xóa sản phẩm: " + error.message });
    }
};

module.exports = {
    getAllProducts,
    getProductDetails,
    createProduct,
    updateProduct,
    deleteProduct,
};
