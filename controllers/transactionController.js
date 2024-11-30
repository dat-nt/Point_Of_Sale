const Product = require("../models/Product");
const Order = require("../models/Order");
const Customer = require("../models/Customer")
const path = require('path');
const fs = require('fs');
const { generateInvoicePDF } = require("../utils/pdfInvoice");

const viewTransactionPage = async (req, res) => {
  res.render("transaction", {
    title: "Xử lí giao dịch",
    layout: "main-layout",
    user: req.user
  })
}

const addProductToCart = async (req, res) => {
  try {
    let { query } = req.body; // Barcode hoặc tên sản phẩm
    query = query?.trim();
    if (!query) return res.status(400).json({ success: false, message: 'Yêu cầu thông tin sản phẩm!' });

    // Tìm sản phẩm theo barcode hoặc tên
    const product = await Product.findOne({
      $or: [{ barcode: query }, { name: { $regex: query, $options: 'i' } }]
    });

    if (!product) return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm!' });

    res.json({
      success: true,
      message: `Thêm sản phẩm ${query} thành công`,
      data: {
        product_id: product._id,
        barcode: product.barcode,
        name: product.name,
        image: product.images[0],
        unitPrice: product.retailPrice,
        quantity: 1,
        total: product.retailPrice
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Đã xảy ra lỗi trong lúc tìm sản phẩm!' });
  }
}

const updateQuantity = async (req, res) => {
  try {
    const { product_id, quantity } = req.body;
    if (!product_id || quantity === undefined)
      return res.status(400).json({ success: false, message: 'Thiếu thông tin sản phẩm hoặc số lượng!' });

    if (quantity < 1) {
      return res.json({ success: false, message: 'Số lượng phải lớn hơn 0!' });
    }

    // Tính toán tổng giá trị mới
    const product = await Product.findById(product_id);
    if (!product) return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm!' });

    const total = product.retailPrice * quantity;

    res.json({ success: true, message: 'Cập nhật số lượng sản phẩm thành công!', total });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Đã xảy ra lỗi!' });
  }
}

const removeProductFromCart = async (req, res) => {
  try {
    const { product_id } = req.body;

    if (!product_id)
      return res.status(400).json({ success: false, message: 'Thiếu thông tin sản phẩm!' });

    const product = await Product.findById(product_id);
    if (!product)
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm!' });

    res.json({ success: true, message: 'Sản phẩm đã được xóa khỏi giỏ hàng.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Lỗi xảy ra trong quá trình xóa sản phẩm khỏi giỏ hàng!' });
  }
}

const checkOut = async (req, res) => {
  try {
    const { customerPhone, customerName, customerAddress, products, amountPaid } = req.body;

    if (!products || products.length === 0)
      return res.status(400).json({ success: false, message: 'Danh sách sản phẩm không được trống!' });

    if (!customerPhone) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập số điện thoại khách hàng.' });
    }

    let customer = await Customer.findOne({ phone: customerPhone });

    // Nếu không tìm thấy khách hàng, tạo khách hàng mới
    if (!customer) {
      if (!customerName || !customerAddress)
        return res.status(400).json({ success: false, message: 'Khách hàng mới cần thông tin họ tên và địa chỉ!' });

      customer = new Customer({
        name: customerName,
        phone: customerPhone,
        address: customerAddress
      });

      await customer.save();
    }

    // Tính tổng tiền đơn hàng
    let totalAmount = 0;
    const orderProducts = products.map((product) => {
      totalAmount += product.unitPrice * product.quantity;
      return {
        product_id: product.product_id,
        name: product.name,
        quantity: product.quantity,
        price: product.unitPrice,
        total: product.unitPrice * product.quantity
      };
    });

    if (!amountPaid || (amountPaid < totalAmount)) {
      return res.status(400).json({ success: false, message: 'Số tiền khách đưa không được nhỏ hơn tổng tiền đơn hàng!' });
    }

    const change = amountPaid - totalAmount;

    // Lưu đơn hàng vào cơ sở dữ liệu
    const order = new Order({
      customer_id: customer._id,
      employee_id: req.user._id,
      products: orderProducts,
      total_price: totalAmount,
      payment_info: {
        amount_paid: amountPaid,
        change: change
      },
      status: 'Completed'
    });

    await order.save();

    // Tạo hóa đơn pdf
    await order.populate({
      path: 'products.product_id',
      select: 'barcode', // Lấy trường barcode từ bảng sản phẩm
    });
    const employee = req.user;
    const filePath = await generateInvoicePDF(order, customer, employee);

    res.json({ success: true, message: 'Đơn hàng đã được tạo thành công.', order});
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Đã xảy ra lỗi!' });
  }
}

const downloadInvoice = (req, res) => {
  const { orderId } = req.params;
  const invoicePath = path.join(__dirname, '../public/invoices', `${orderId}.pdf`);

  // Kiểm tra nếu file tồn tại
  fs.access(invoicePath, fs.constants.F_OK, (err) => {
    if (err) {
      // Nếu file không tồn tại
      return res.status(404).json({ success: false, message: 'Hóa đơn không tồn tại.' });
    }

    // Gửi file về cho trình duyệt tải xuống
    res.download(invoicePath, `${orderId}.pdf`, (err) => {
      if (err) {
        console.error("Lỗi khi tải hóa đơn:", err);
        return res.status(500).json({ success: false, message: 'Không thể tải hóa đơn.' });
      }
    });
  });
}

module.exports = {
  viewTransactionPage,
  addProductToCart,
  updateQuantity,
  removeProductFromCart,
  checkOut,
  downloadInvoice
}