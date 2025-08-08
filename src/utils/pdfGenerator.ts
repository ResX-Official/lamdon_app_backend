import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

interface BookingData {
  bookingId: string;
  propertyTitle: string;
  propertyAddress: string;
  guestName: string;
  guestEmail: string;
  checkInDate: string;
  checkOutDate: string;
  totalAmount: number;
  paymentReference: string;
  createdAt: string;
}

export const generatePDFReceipt = async (bookingData: BookingData): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const filename = `receipt_${bookingData.bookingId}.pdf`;
      const filepath = path.join(__dirname, '../../receipts', filename);

      // Ensure receipts directory exists
      const receiptsDir = path.dirname(filepath);
      if (!fs.existsSync(receiptsDir)) {
        fs.mkdirSync(receiptsDir, { recursive: true });
      }

      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      // Header
      doc.fontSize(20).text('LAMDON APP - BOOKING RECEIPT', 50, 50, { align: 'center' });
      doc.moveDown(2);

      // Receipt Details
      doc.fontSize(12);
      doc.text(`Receipt #: ${bookingData.bookingId}`, 50, 150);
      doc.text(`Date: ${bookingData.createdAt}`, 50, 170);
      doc.text(`Payment Reference: ${bookingData.paymentReference}`, 50, 190);
      doc.moveDown(2);

      // Guest Information
      doc.fontSize(14).text('GUEST INFORMATION:', 50, 230);
      doc.fontSize(12);
      doc.text(`Name: ${bookingData.guestName}`, 50, 250);
      doc.text(`Email: ${bookingData.guestEmail}`, 50, 270);
      doc.moveDown(2);

      // Property Information
      doc.fontSize(14).text('PROPERTY INFORMATION:', 50, 310);
      doc.fontSize(12);
      doc.text(`Property: ${bookingData.propertyTitle}`, 50, 330);
      doc.text(`Address: ${bookingData.propertyAddress}`, 50, 350);
      doc.moveDown(2);

      // Booking Details
      doc.fontSize(14).text('BOOKING DETAILS:', 50, 390);
      doc.fontSize(12);
      doc.text(`Check-in Date: ${bookingData.checkInDate}`, 50, 410);
      doc.text(`Check-out Date: ${bookingData.checkOutDate}`, 50, 430);
      doc.moveDown(2);

      // Payment Information
      doc.fontSize(14).text('PAYMENT INFORMATION:', 50, 470);
      doc.fontSize(12);
      doc.text(`Total Amount: ₦${bookingData.totalAmount.toLocaleString()}`, 50, 490);
      doc.text(`Status: PAID`, 50, 510);
      doc.moveDown(2);

      // Footer
      doc.fontSize(10).text('Thank you for choosing Lamdon App!', 50, 600, { align: 'center' });
      doc.text('For support, contact: support@lamdon.app', 50, 620, { align: 'center' });

      doc.end();

      stream.on('finish', () => {
        resolve(filepath);
      });

      stream.on('error', (error) => {
        reject(error);
      });

    } catch (error) {
      reject(error);
    }
  });
};
