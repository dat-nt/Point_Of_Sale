const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const Order = require("../models/Order");

// Cấu hình nodemailer
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const viewEmployeeList = async (req, res) => {
    const employees = await User.find({ role: "Sales" }).lean();
    res.render("employees", {
        employees,
        user: req.user,
        title: "Danh sách nhân viên",
        layout: "main-layout"
    });
}

const viewEmployeeDetails = async (req, res) => {
    try {
        const employee = await User.findById(req.params.id);

        if (!employee) {
            return res.status(404).json({ success: false, message: "Nhân viên không tồn tại." })
        }

        res.render("employee_details", {
            title: "Chi tiết nhân viên",
            layout: "main-layout",
            user: req.user,
            employee
        });

    } catch (error) {
        console.error("Lỗi khi lấy thông tin nhân viên:", error);
        res.status(500).json({ success: false, message: "Đã xảy ra lỗi khi lấy thông tin nhân viên." });
    }
}

const createEmployee = async (req, res) => {
    const { fullname, email } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            req.flash("error_msg", "Email này đã được sử dụng, vui lòng thử email khác.");
            return res.redirect("/employees");
        }

        const username = email.split("@")[0];
        const password = username;
        const hashedPassword = await bcrypt.hash(password, 10);

        const newEmployee = new User({
            fullname,
            email,
            username,
            password: hashedPassword,
        });

        await newEmployee.save();

        // Tạo token kích hoạt tài khoản
        const token = jwt.sign(
            { id: newEmployee._id },
            process.env.JWT_SECRET,
            { expiresIn: "1m" }
        );
        const activationLink = `http://localhost:${process.env.PORT}/auth/activate/${token}`;

        // Gửi email kích hoạt
        await transporter.sendMail({
            to: email,
            subject: "Kích hoạt tài khoản POS của bạn",
            text: `Chào ${fullname},
\nTài khoản POS của bạn đã được tạo với tên đăng nhập là ${username}, mật khẩu là ${password}. 
Vui lòng nhấp vào liên kết sau để kích hoạt tài khoản của bạn và đổi mật khẩu lần đầu:
      
${activationLink}
\nLưu ý: 
- Liên kết có thời hạn là 1 phút. Sau 1 phút bạn cần yêu cầu admin gửi lại email kích hoạt tài khoản.
- Bạn không thể đăng nhập bằng biểu mẫu đăng nhập nếu chưa nhấn vào link kích hoạt.     
\nCảm ơn!`,
        });

        req.flash("success_msg", "Tài khoản nhân viên đã được tạo, hệ thống đã gửi email kích hoạt!");
        res.redirect("/employees");
    } catch (error) {
        console.error(error);
        req.flash("error_msg", "Đã xảy ra lỗi khi tạo tài khoản, vui lòng thử lại.");
        res.redirect("/employees");
    }
}

const resendEmail = async (req, res) => {
    const { id } = req.params;

    try {
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ success: false, message: "Người dùng không tồn tại." });
        }

        if (user.status === "Active") {
            return res.status(400).json({ success: false, message: "Tài khoản này đã được kích hoạt từ trước." });
        }

        if (user.status === "Locked") {
            return res.status(400).json({ success: false, message: "Tài khoản này đã bị khóa." });
        }

        // Tạo token kích hoạt
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: "1m",
        });

        const activationLink = `http://localhost:${process.env.PORT}/auth/activate/${token}`;

        await transporter.sendMail({
            to: user.email,
            subject: "Kích hoạt lại tài khoản POS của bạn",
            text: `
            \nChào ${user.fullname},\n\nBạn đã yêu cầu gửi lại email kích hoạt. Nhấn vào link sau để kích hoạt tài khoản (liên kết có hiệu lực trong 1 phút):\n\n${activationLink}\n\nCảm ơn!`,
        });

        res.json({ success: true, message: "Email kích hoạt đã được gửi lại thành công." });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, message: "Đã xảy ra lỗi khi gửi email kích hoạt." });
    }
}

const toggleLock = async (req, res) => {
    const { id } = req.params;

    try {
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ success: false, message: "Tài khoản nhân viên không tồn tại." });
        }

        if (user.status === "Inactive") {
            return res.status(400).json({ success: false, message: "Tài khoản này chưa được kích hoạt." });
        }

        // Chuyển đổi trạng thái khóa/mở khóa
        user.status = user.status === "Locked" ? "Active" : "Locked";
        await user.save();

        res.json({
            success: true,
            message: user.status === "Locked" ? "Đã khóa tài khoản thành công." : "Tài khoản đã được mở khóa.",
            status: user.status,
        });
    } catch (error) {
        console.error("Lỗi khi thay đổi trạng thái tài khoản:", error);
        res.status(500).json({ success: false, message: "Đã xảy ra lỗi, vui lòng thử lại." });
    }
}

const getEmployeeSalesInfo = async (req, res) => {
    const { id } = req.params;

    try {
        const orders = await Order.find({ employee_id: id })
            .sort({ created_at: -1 })
            .lean();

        if (!orders || orders.length === 0) {
            return res.status(404).json({
                success: false, message: "Nhân viên chưa hoàn thành đơn hàng nào!",
            });
        }

        // Tính tổng số đơn hàng
        const totalOrders = orders.length;

        // Tính tổng doanh thu
        const totalRevenue = orders.reduce((sum, order) => sum + order.total_price, 0);

        // Tính tổng số sản phẩm đã bán
        const totalProductsSold = orders.reduce((sum, order) => {
            return sum + order.products.reduce((count, product) => count + product.quantity, 0);
        }, 0);

        // Danh sách chi tiết đơn hàng
        const orderDetails = orders.map((order, index) => ({
            index: index + 1,
            orderId: order._id, 
            createdAt: order.created_at, 
            totalProducts: order.products.reduce((count, product) => count + product.quantity, 0), 
            totalPrice: order.total_price,
        }));

        // Trả về kết quả
        res.json({
            success: true,
            totalOrders,
            totalRevenue,
            totalProductsSold,
            orderDetails,
        });
    } catch (error) {
        console.error("Lỗi khi lấy thông tin bán hàng:", error);
        res.status(500).json({
            success: false,
            message: "Không thể tải thông tin bán hàng.",
        });
    }
};

module.exports = {
    viewEmployeeList,
    viewEmployeeDetails,
    createEmployee,
    resendEmail,
    toggleLock,
    getEmployeeSalesInfo
}
