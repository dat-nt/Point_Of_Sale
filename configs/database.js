const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const bcrypt = require("bcrypt");
const User = require("../models/User");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected successfully');
    // Kiểm tra và tạo tài khoản admin mặc định
    const adminEmail = 'admin@gmail.com';
    const adminUsername = 'admin';
    const adminPassword = 'admin';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      const admin = new User({
        email: adminEmail,
        password: hashedPassword,
        username: adminUsername,
        fullname: 'Administrator',
        role: 'Admin',
        isAdmin: true,
        verified: true,
        status: "Active",
      });

      await admin.save();
      console.log(`Tài khoản admin đã được tạo: ${adminUsername} / ${adminPassword}`);
    } else {
      console.log('Tài khoản admin đã tồn tại.');
    }
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
