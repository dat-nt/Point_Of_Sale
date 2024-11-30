const Customer = require("../models/Customer");
const Order = require('../models/Order');

const getCustomerData = async (req, res) => {
    try {
        let { phone } = req.query;
        phone = phone?.trim();
        if (!phone) return res.status(400).json({ message: 'Thiếu số điện thoại!' });

        const customer = await Customer.findOne({ phone });

        if (customer) {
            return res.json({
                success: true,
                message: "Khách hàng đã có trong hệ thống, thông tin được hiển thị ra màn hình.",
                data: {
                    customer_id: customer._id,
                    name: customer.name,
                    address: customer.address
                }
            });
        }

        res.status(404).json({ success: false, message: 'Không tìm thấy khách hàng!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Đã xảy ra lỗi! trong lúc tìm thông tin khách hàng!' });
    }
}

const getCustomerPurchaseHistoryData = async (req, res) => {
    const { customer_id } = req.query;

    try {
        if (!customer_id) {
            return res.status(400).json({success:false,  message: 'Yêu cầu có customer_id' });
        }

        let orders = await Order.find({ customer_id })
            .sort({ created_at: -1 });

        if (!orders.length) {
            return res.status(404).json({success: false, message: 'Khách hàng này chưa có giao dịch nào.' });
        }

        orders = orders.map(order => {
            const totalQuantity = order.products.reduce((sum, product) => sum + product.quantity, 0);
            return {
                ...order.toObject(),
                total_quantity: totalQuantity,
            };
        });

        res.json({ success: true, message: "Lấy dữ liệu lịch sử giao dịch thành công.", data: orders });
    } catch (error) {
        console.error(error);
        res.status(500).json({success: false, message: 'Có lỗi khi lấy dữ liệu giao dịch khách hàng.' });
    }
}

module.exports = {
    getCustomerData,
    getCustomerPurchaseHistoryData
}