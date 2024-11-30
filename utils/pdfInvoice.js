const fs = require("fs");
const PDFDocument = require("pdfkit");

const generateInvoicePDF = async (order, customer, employee) => {

    const doc = new PDFDocument({ margin: 30 });

    const fontPath = './public/fonts/roboto/Roboto-Regular.ttf';
    doc.registerFont('Roboto', fontPath);
    doc.font('Roboto');

    const filePath = `./public/invoices/${order._id}.pdf`;
    const writeStream = fs.createWriteStream(filePath);

    doc.pipe(writeStream);

    // Tiêu đề hóa đơn
    doc
        .fontSize(20)
        .font('Roboto')
        .text("HÓA ĐƠN THANH TOÁN", { align: "center" })
        .moveDown();

    // Thông tin đơn hàng
    doc
        .fontSize(12)
        .font('Roboto')
        .text(`Mã đơn hàng: ${order._id}`)
        .text(`Thời gian tạo: ${new Date(order.created_at).toLocaleString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        })}`)
        .text(`Tổng tiền: ${order.total_price.toLocaleString('vi-VN')} VND`)
        .text(`Tiền khách đưa: ${order.payment_info.amount_paid.toLocaleString('vi-VN')} VND`)
        .text(`Tiền trả lại: ${order.payment_info.change.toLocaleString('vi-VN')} VND`)
        .moveDown();

    // Thông tin khách hàng
    doc
        .fontSize(14)
        .text("Thông tin khách hàng", { underline: true })
        .moveDown(0.5)
        .fontSize(12)
        .text(`Họ và tên: ${customer.name}`)
        .text(`Số điện thoại: ${customer.phone}`)
        .text(`Địa chỉ: ${customer.address}`)
        .moveDown();

    // Thông tin nhân viên
    doc
        .fontSize(14)
        .text("Thông tin nhân viên", { underline: true })
        .moveDown(0.5)
        .fontSize(12)
        .text(`Mã nhân viên: ${employee._id}`)
        .text(`Tên nhân viên: ${employee.fullname}`)
        .moveDown();

    // Danh sách sản phẩm
    doc
        .fontSize(14)
        .text("Danh sách sản phẩm", { underline: true })
        .moveDown(0.5);

    const tableTop = doc.y;
    const itemSpacing = 20;

    doc.fontSize(10);

    // Headers
    doc
        .text("#", 30, tableTop)
        .text("Mã vạch", 70, tableTop)
        .text("Tên sản phẩm", 150, tableTop)
        .text("Số lượng", 350, tableTop, { width: 50, align: "center" })
        .text("Đơn giá", 420, tableTop, { width: 80, align: "right" })
        .text("Tổng", 510, tableTop, { width: 80, align: "right" });

    let position = tableTop + itemSpacing;

    order.products.forEach((product, index) => {
        const productName = product.name;
        const productBarcode = product.product_id.barcode;
        const productNameHeight = doc.heightOfString(productName, { width: 180 });

        // Vẽ các cột dữ liệu
        doc
            .font("Roboto")
            .text(index + 1, 30, position)
            .text(productBarcode, 70, position)
            .text(productName, 150, position, { width: 180 })
            .text(product.quantity, 350, position, { width: 50, align: "center" })
            .text(product.price.toLocaleString("vi-VN") + " VND", 420, position, { width: 80, align: "right" })
            .text(product.total.toLocaleString("vi-VN") + " VND", 510, position, { width: 80, align: "right" });

        position += Math.max(itemSpacing, productNameHeight);
    });

    doc.moveDown(2)

    // Cảm ơn
    doc
        .fontSize(14)
        .text("Cảm ơn quý khách đã mua hàng!", doc.page.width - 380, doc.y, { align: "right" })
        .moveDown();

    // Kết thúc
    doc.end();

    return new Promise((resolve, reject) => {
        writeStream.on("finish", () => {
            resolve(filePath);
        });

        writeStream.on("error", (error) => {
            reject(error);
        });
    });
};

module.exports = { generateInvoicePDF };
