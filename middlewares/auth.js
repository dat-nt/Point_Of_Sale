const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Authenticate middleware
exports.authenticate = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    req.flash("error_msg", "Bạn chưa có Token, hãy đăng nhập vào hệ thống!");
    return res.redirect("/auth/login")
  };

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) {
      req.flash("error_msg", "Tài khoản không tồn tại.")
      return res.redirect("/auth/login");
    }
    next();
  } catch (err) {
    req.flash("error_msg", `Phiên đăng nhập không hợp lệ.`);
    console.log(err)
    return res.redirect('/auth/login')
  }
};

// isAdmin middleware
exports.isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "Admin") {
    req.flash("error_msg", "Chỉ quản trị viên mới có quyền truy cập.");
    return res.redirect("/")
  }
  next();
};

// Không cho những user đã đăng nhập truy cập vào trang login
exports.redirectIfLoggedIn = async (req, res, next) => {
  const token = req.cookies.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded) {
        return res.redirect("/"); // Nếu hợp lệ, chuyển hướng đến trang chủ
      }
    } catch (error) {
      console.error("Token không hợp lệ: " + error);
      next()
    }
  }
  next();
};

// Kiểm tra những user đã đăng nhập nhưng chưa đổi mật khẩu, 
// nếu họ cố gắng truy cập vào những chức năng khác thì sẽ chuyển họ về trang đổi mật khẩu lần đầu
exports.checkFirstLogin = (req, res, next) => {
  if (req.user && req.user.isFirstLogin) {
    // Nếu user không ở trang /auth/first-login-change-password, chuyển hướng về trang này
    if (req.originalUrl !== '/auth/first-login-change-password') {
      return res.redirect('/auth/first-login-change-password');
    }
  }
  next();
};

// Nếu tài khoản bị khóa trong lúc đã đăng nhập thì đăng xuất khỏi hệ thống
exports.checkLockedAccount = (req, res, next) => {
  if (req.user.status === 'Locked') {
    // Đăng xuất
    res.clearCookie("token");
    return res.status(403).send('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.');
  }
  next();
}
