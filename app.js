const express = require('express');
const hbs = require('express-handlebars');
const path = require('path');
const dotenv = require('dotenv');
const session = require('express-session');
const flash = require('connect-flash');
const cookieParser = require('cookie-parser');
const connectDB = require('./configs/database');
const cors = require('cors');

const productRouter = require('./routes/productRouter');
const categoryRouter = require('./routes/categoryRouter');
const authRouter = require('./routes/authRouter');
const indexRouter = require('./routes/indexRouter');
const employeeRouter = require('./routes/employeeRouter');
const customerRouter = require('./routes/customerRouter')
const transactionRouter = require('./routes/transactionRouter');
const reportRouter = require('./routes/reportRouter');

// Load biến môi trường từ file .env
dotenv.config();

const app = express();

app.use(cors());

// Cấu hình Handlebars
app.engine('.hbs', hbs.engine({
    defaultLayout: 'main',
    extname: '.hbs',
    runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowedProtoMethods: true
    },
    helpers: {
        // Định dạng tiền tệ VND
        formatVND: function (amount) {
            return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
        },
        // Định dạng ngày giờ
        formatDate: function (date) {
            const d = new Date(date);
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            const seconds = String(d.getSeconds()).padStart(2, '0');
            return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
        },
        // Tăng giá trị lên 1
        increment: function (value) {
            return parseInt(value) + 1;
        },
        // STT trong phân trang
        addIndex: function (page, limit, index) {
            const stt = (page - 1) * limit + index + 1;
            return stt;
        },
        // Chuyển đổi sang JSON
        json: (context) => JSON.stringify(context),
        // So sánh bằng
        eq: function (a, b) {
            return a === b;
        },
        // So sánh lớn hơn
        gt: function (a, b) {
            return a > b;
        },
        // So sánh nhỏ hơn
        lt: function (a, b) {
            return a < b;
        },
        // Cộng hai số
        add: function (a, b) {
            return a + b;
        },
        // Trừ hai số
        subtract: function (a, b) {
            return a - b;
        },
        // Tạo dải số từ start đến end
        range: function (start, end) {
            return Array.from({ length: end - start + 1 }, (_, i) => i + start);
        },
        ifCond: function (v1, operator, v2, options) {
            switch (operator) {
                case "==":
                    return v1 == v2 ? options.fn(this) : options.inverse(this);
                case "!=":
                    return v1 != v2 ? options.fn(this) : options.inverse(this);
                default:
                    return options.inverse(this);
            }
        },
    }
}));

app.set('view engine', '.hbs');

app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Kết nối tới MongoDB
connectDB();

// Cấu hình session và flash
app.use(session({
    secret: 'JUASDANAUDDANad',
    resave: false,
    saveUninitialized: true
}));

app.use(flash());

// Middleware để sử dụng flash message trong view
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    next();
});

app.use((req, res, next) => {
    console.log("request url: " + req.url);
    next();
})

// routes
app.use('/', indexRouter);
app.use('/auth', authRouter);
app.use('/categories', categoryRouter);
app.use('/products', productRouter);
app.use('/employees', employeeRouter);
app.use('/customer', customerRouter);
app.use('/transaction', transactionRouter);
app.use('/reports', reportRouter);

// Middleware xử lý lỗi 404
app.use((req, res) => {
    res.status(404).render('404', { title: "404" });
});

// Middleware xử lý lỗi 500
app.use((err, req, res, next) => {
    console.error("Error:", err);
    res.status(500).render('500', { title: "500" });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server is running on http://localhost:${port}`))
