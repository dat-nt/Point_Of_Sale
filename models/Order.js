const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    customer_id: {
        type: mongoose.Schema.Types.ObjectId, // Liên kết đến bảng khách hàng nếu có
        ref: 'Customer',
    },
    employee_id: {
        type: mongoose.Schema.Types.ObjectId, // Liên kết đến bảng nhân viên
        ref: 'User',
        required: true,
    },
    products: [
        {
            product_id: {
                type: mongoose.Schema.Types.ObjectId, // Liên kết đến bảng sản phẩm
                ref: 'Product',
                required: true,
            },
            name: { type: String, required: true }, // Tên sản phẩm
            quantity: { type: Number, required: true }, // Số lượng
            price: { type: Number, required: true }, // Giá đơn vị
            total: { type: Number, required: true }, // Tổng giá = quantity * price
        },
    ],
    total_price: {
        type: Number,
        required: true, // Tổng số tiền của đơn hàng
    },
    payment_info: {
        amount_paid: { type: Number, required: true }, // Số tiền khách hàng đưa
        change: { type: Number, required: true }, // Số tiền trả lại
    },
    status: {
        type: String,
        enum: ['Pending', 'Completed', 'Cancelled'], // Trạng thái đơn hàng
        default: 'Pending',
    },
    created_at: {
        type: Date,
        default: Date.now, // Ngày tạo đơn hàng
    },
});

module.exports = mongoose.model('Order', orderSchema);
