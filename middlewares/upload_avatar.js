const multer = require("multer");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public/uploads/"); // Thư mục lưu trữ
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.floor(Math.random() * 9999 + 1);
        cb(null, `${uniqueSuffix}-${file.originalname}`); // Tên file duy nhất
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // Giới hạn 2MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype === "image/jpeg" || file.mimetype === "image/png" || file.mimetype === "image/gif") {
            cb(null, true);
        } else {
            cb(new Error("Chỉ chấp nhận các định dạng JPG, PNG hoặc GIF."));
        }
    },
});

module.exports = upload;
