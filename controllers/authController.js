const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/User");

const viewLoginPage = async (req, res) => {
    res.render("login", { title: "Đăng nhập", });
}

const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });

        if (!user) {
            return res.render("login", { title: "Đăng nhập", error: "Tên đăng nhập hoặc mật khẩu không đúng.", username });
        }

        if (user.status === "Inactive") {
            return res.render("login", {
                title: "Đăng nhập",
                error: "Tài khoản của bạn chưa được kích hoạt, vui lòng nhấp vào liên kết trong email để kích hoạt!",
                username
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.render("login", { title: "Đăng nhập", error: "Tên đăng nhập hoặc mật khẩu không đúng.", username });
        }

        if (user.status === "Locked") {
            return res.render("login", {
                title: "Đăng nhập",
                error: "Tài khoản của bạn đã bị khóa! Vui lòng liên hệ admin để biết chi tiết.",
                username
            });
        }

        if (user.isFirstLogin) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
            res.cookie("token", token, { httpOnly: true });
            req.flash("success_msg", "Đăng nhập lần đầu thành công, hãy đổi mật khẩu để có thể sử dụng các tính năng của hệ thống!");
            return res.redirect("/auth/first-login-change-password");
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
        res.cookie("token", token, { httpOnly: true });
        req.flash("success_msg", "Đăng nhập thành công!");
        res.redirect("/");
    } catch (error) {
        console.error("Lỗi trong quá trình đăng nhập:", error);
        res.render("login", {
            title: "Đăng nhập",
            error: "Đã xảy ra lỗi trong quá trình đăng nhập. Vui lòng thử lại sau."
        });
    }
};

const viewFirstLoginChangePass = async (req, res) => {
    if (!req.user.isFirstLogin) return res.redirect("/");
    res.render("first_login_change_password", { title: "Đổi mật khẩu" });
}

const firstLoginChangePass = async (req, res) => {
    try {
        const { password } = req.body;

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.render("first_login_change_password", { 
                title: "Đổi mật khẩu", 
                error: "Người dùng không tồn tại."
            });
        }

        // Kiểm tra mật khẩu mới có giống mật khẩu hiện tại hay không
        const isSamePassword = await bcrypt.compare(password, user.password);
        if (isSamePassword) {
            return res.render("first_login_change_password", { 
                title: "Đổi mật khẩu", 
                error: "Mật khẩu mới không được trùng mật khẩu hiện tại."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        user.isFirstLogin = false;
        await user.save();

        req.flash("success_msg", "Đổi mật khẩu thành công!");
        res.redirect("/");
    } catch (error) {
        console.error("Lỗi trong quá trình đổi mật khẩu lần đầu:", error);
        return res.render("first_login_change_password", { 
            title: "Đổi mật khẩu", 
            error: "Lỗi trong quá trình đổi mật khẩu lần đầu. Vui lòng thử lại."
        });
    }
};

const changePassword = async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    try {
        const user = await User.findById(req.user._id);

        // Kiểm tra mật khẩu hiện tại
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Mật khẩu hiện tại không chính xác." });
        }

        if (newPassword === currentPassword) {
            return res.status(400).json({ success: false, message: "Mật khẩu mới không được trùng với mật khẩu hiện tại." });
        }

        // Kiểm tra mật khẩu mới và xác nhận mật khẩu
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ success: false, message: "Mật khẩu xác nhận không khớp." });
        }

        // Hash mật khẩu mới và cập nhật
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({ success: true, message: "Đổi mật khẩu thành công." });
    } catch (err) {
        res.status(500).json({ success: false, message: "Đổi mật khẩu thất bại. Lỗi: " + err.message });
    }
}

const logout = (req, res) => {
    res.clearCookie("token");
    req.flash("success_msg", "Bạn đã đăng xuất khỏi ứng dụng POS.")
    res.redirect("/auth/login");
}

const activateAccount = async (req, res) => {
    const { token } = req.params;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id);
        if (!user) {
            return res.json({ success: false, message: "Người dùng không tồn tại." });
        }

        if (user.status === "Active") {
            return res.json({ success: false, message: "Tài khoản của bạn đã được kích hoạt từ trước." });
        }

        // Kích hoạt tài khoản
        user.status = "Active";
        user.isFirstLogin = true;
        await user.save();

        req.flash("success_msg", "Bạn đã kích hoạt tài khoản thành công, hãy đăng nhập!")
        res.redirect('/auth/login')
    } catch (err) {
        console.error(err.message);
        return res.json({ success: false, message: "Liên kết kích hoạt không hợp lệ hoặc đã hết hạn." });
    }
}

module.exports = {
    viewLoginPage,
    login,
    viewFirstLoginChangePass,
    firstLoginChangePass,
    changePassword,
    logout,
    activateAccount
}
