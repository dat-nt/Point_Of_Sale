const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      required: [true, "Email là bắt buộc."],
      unique: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Email không hợp lệ. Vui lòng nhập đúng định dạng.",
      ],
    },
    fullname: {
      type: String,
      trim: true,
      required: [true, "Họ và tên là bắt buộc."],
    },
    avatar: {
      type: String,
      trim: true,
      default: "user_default.png",
    },
    password: {
      type: String,
      trim: true,
      required: [true, "Mật khẩu là bắt buộc."],
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Locked"],
      default: "Inactive",
    },
    role: {
      type: String,
      enum: ["Admin", "Sales"],
      default: "Sales",
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isFirstLogin: {
      type: Boolean,
      default: true,
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    website: {
      type: String,
      trim: true,
      default: "",
    },
    birthday: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

// Middleware để tự động cập nhật isAdmin dựa trên role
userSchema.pre("save", function (next) {
  if (this.role === "Admin") {
    this.isAdmin = true;
  } else {
    this.isAdmin = false;
  }
  next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;