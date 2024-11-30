const Order = require("../models/Order");

const viewReports = (req, res) => {
  res.render("reports", {
    title: "Báo cáo và phân tích",
    layout: "main-layout",
    user: req.user
  })
}

// Hàm tính khoảng thời gian
const getTimeRange = (timeline, startDate, endDate) => {
  const now = new Date();
  let start, end;

  switch (timeline) {
    case "today":
      start = new Date(now.setHours(0, 0, 0, 0));
      end = new Date(now.setHours(23, 59, 59, 999));
      break;
    case "yesterday":
      start = new Date(now.setDate(now.getDate() - 1));
      start.setHours(0, 0, 0, 0);
      end = new Date(now.setHours(23, 59, 59, 999));
      break;
    case "last_7_days":
      start = new Date(now.setDate(now.getDate() - 7));
      start.setHours(0, 0, 0, 0);
      end = new Date();
      break;
    case "this_month":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;
    case "custom":
      start = new Date(startDate);
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      break;
    default:
      throw new Error("Invalid timeline");
  }
  return { start, end };
};

const filterOrderData = async (req, res) => {
  try {
    const { timeline, startDate, endDate } = req.body;

    if (timeline === "custom" && (!startDate || !endDate)) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng chọn khoảng thời gian."
      });
    }

    const { start, end } = getTimeRange(timeline, startDate, endDate);

    const orders = await Order.find({ created_at: { $gte: start, $lte: end }, })
      .populate('products.product_id')
      .sort({ created_at: -1 })
      .lean(); // Chuyển kết quả Mongoose Document thành Object thuần JS

    const totalAmount = orders.reduce((acc, order) => acc + order.total_price, 0);
    const totalOrders = orders.length;
    const totalProducts = orders.reduce((acc, order) =>
      acc + order.products.reduce((sum, p) => sum + p.quantity, 0),
      0
    );

    let totalProfit = 0;
    if (req.user.isAdmin) {
      totalProfit = orders.reduce((acc, order) => {
        const orderProfit = order.products.reduce((sum, product) => {
          // Lợi nhuận của mỗi sản phẩm = (giá bán - giá gốc) * số lượng
          const profitPerProduct = (product.price - product.product_id.importPrice) * product.quantity;
          return sum + profitPerProduct;
        }, 0);
        return acc + orderProfit;
      }, 0);
    }

    // Xử lý dữ liệu sản phẩm nếu không phải admin
    if (!req.user.isAdmin) {
      orders.forEach(order => {
        order.products.forEach(product => {
          if (product.product_id) {
            // Xóa trường importPrice nếu tồn tại
            delete product.product_id.importPrice;
          }
        });
      });
    }

    res.json({
      success: true,
      message: "Lọc dữ liệu đơn hàng thành công.",
      summary: {
        totalAmount,
        totalOrders,
        totalProducts,
        ...(req.user.isAdmin && { totalProfit }), // Chỉ gửi totalProfit nếu là admin
      },
      orders,
    });
  } catch (error) {
    console.log(error)
    res.status(500).json({ success: false, message: "Đã có lỗi xảy ra, trong quá trình lọc dữ liệu" });
  }
}

const getOrderDetailsData = async (req, res) => {
  const { orderId } = req.params;
  try {
    const order = await Order.findById(orderId)
      .populate('products.product_id')
      .populate('customer_id')
      .populate('employee_id');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Dữ liệu đơn hàng không tồn tại.' });
    }

    // Trả về dữ liệu chi tiết đơn hàng
    res.json({
      success: true,
      order: {
        _id: order._id,
        created_at: order.created_at,
        total_price: order.total_price,
        payment_info: order.payment_info,
        employee: {
          _id: order.employee_id._id,
          name: order.employee_id.fullname,
        },
        customer: {
          name: order.customer_id.name,
          phone: order.customer_id?.phone,
          address: order.customer_id?.address,
        },
        products: order.products.map(product => ({
          barcode: product.product_id.barcode,
          name: product.product_id.name,
          image: product.product_id.images[0],
          quantity: product.quantity,
          price: product.price,
          total: product.price * product.quantity,
        })),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Lỗi trong quá trình lấy chi tiết đơn hàng. Vui lòng thử lại sau.' });
  }
}

module.exports = {
  viewReports,
  filterOrderData,
  getOrderDetailsData
};
