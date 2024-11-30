const User = require("../models/User");
const Product = require("../models/Product");
const Category = require("../models/Category");
const Order = require("../models/Order");
const path = require("path");
const fs = require("fs")


const viewDashBoardPage = async (req, res) => {
    try {
        const productCount = await Product.countDocuments();
        const salesCount = await User.countDocuments({ role: "Sales" });
        const categoryCount = await Category.countDocuments();
        const orderCount = await Order.countDocuments();

        // Render dữ liệu ra view
        res.render("dashboard", {
            layout: "main-layout",
            title: "Dashboard",
            user: req.user,
            stats: {
                products: productCount,
                sales: salesCount,
                categories: categoryCount,
                orders: orderCount
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

const viewUserProfile = (req, res) => {
    res.render("profile", {
        layout: "main-layout",
        title: "Hồ sơ người dùng",
        user: req.user
    })
}

const updateProfile = async (req, res) => {
    const { fullname, phone, bio, birthday, website } = req.body;
    const userId = req.user._id;
    console.log(birthday)
    try {
        // Tìm user hiện tại
        const user = await User.findById(userId);

        // Cập nhật thông tin người dùng
        user.fullname = fullname || user.fullname;
        user.phone = phone;
        user.bio = bio;
        user.birthday = birthday;
        user.website = website;

        // Nếu có upload avatar mới
        if (req.file) {
            // Xóa avatar cũ nếu không phải ảnh mặc định
            if (user.avatar !== "user_default.png") {
                const oldAvatarPath = path.join(__dirname, "../public/img/users/", user.avatar);
                if (fs.existsSync(oldAvatarPath)) {
                    fs.unlinkSync(oldAvatarPath); // Xóa file cũ
                }
            }

            // Lưu file mới vào thư mục public/img/users
            const newAvatarPath = path.join(__dirname, "../public/img/users/", req.file.filename);
            fs.renameSync(req.file.path, newAvatarPath); // Di chuyển file từ "uploads/" sang "public/img/users/"

            // Cập nhật avatar trong database
            user.avatar = req.file.filename;
        }

        // Lưu thay đổi
        await user.save();

        res.status(200).json({ success: true, message: "Cập nhật hồ sơ thành công.", user });
    } catch (err) {
        res.status(500).json({ success: false, message: "Cập nhật hồ sơ thất bại. Lỗi: " + err.message });
    }
}

module.exports = {
    viewDashBoardPage,
    viewUserProfile,
    updateProfile
}