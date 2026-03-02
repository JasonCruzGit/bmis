import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

interface DocumentData {
  documentNumber: string;
  documentType: string;
  residentName: string;
  residentAddress: string;
  purpose?: string;
  issuedDate: Date;
  issuedBy: string;
  template?: string;
}

export const generateCertificatePDF = async (
  data: DocumentData,
  outputPath: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
    const stream = fs.createWriteStream(outputPath);
    
    doc.pipe(stream);

    // Try to add logo
    const logoPaths = [
      path.join(__dirname, '../../assets/logo.png'),
      path.join(__dirname, '../../../frontend/public/logo.png'),
      path.join(process.cwd(), 'assets/logo.png'),
      path.join(process.cwd(), 'frontend/public/logo.png'),
    ];

    let logoAdded = false;
    let logoY = 50; // Starting Y position
    const logoSize = 70; // Size in points
    
    for (const logoPath of logoPaths) {
      if (fs.existsSync(logoPath)) {
        try {
          // Add logo at the top center
          const pageWidth = doc.page.width;
          const logoX = (pageWidth - logoSize) / 2;
          
          doc.image(logoPath, logoX, logoY, {
            width: logoSize,
            height: logoSize,
          });
          logoAdded = true;
          logoY = logoY + logoSize + 15; // Position for text after logo
          break;
        } catch (error) {
          console.warn('Could not add logo to PDF:', error);
        }
      }
    }

    // Set Y position for header text
    if (logoAdded) {
      doc.y = logoY;
    } else {
      doc.y = 50; // Default position if no logo
    }

    // Header
    doc.fontSize(16).font('Helvetica-Bold')
       .text('BARANGAY OFFICE', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica')
       .text('Republic of the Philippines', { align: 'center' });
    doc.moveDown(1);

    // Document Type
    doc.fontSize(14).font('Helvetica-Bold')
       .text(data.documentType.replace(/_/g, ' '), { align: 'center' });
    doc.moveDown(2);

    // Certificate Number
    doc.fontSize(10).font('Helvetica')
       .text(`Certificate No: ${data.documentNumber}`, { align: 'right' });
    doc.moveDown(1);

    // Body
    doc.fontSize(11).font('Helvetica')
       .text('TO WHOM IT MAY CONCERN:', { align: 'left' });
    doc.moveDown(1);

    const bodyText = data.template || 
      `This is to certify that ${data.residentName}, of legal age, ${data.residentAddress}, is a bonafide resident of this barangay.`;

    doc.text(bodyText, { align: 'justify' });
    doc.moveDown(1);

    if (data.purpose) {
      doc.text(`This certification is issued upon the request of the above-named person for ${data.purpose}.`);
      doc.moveDown(1);
    }

    doc.text('Given this day, this certification is issued for whatever legal purpose it may serve.');
    doc.moveDown(2);

    // Signature section
    doc.text('_________________________', 350, doc.y);
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica-Bold')
       .text(data.issuedBy, 350, doc.y, { align: 'center' });
    doc.fontSize(9).font('Helvetica')
       .text('Barangay Official', 350, doc.y + 15, { align: 'center' });

    doc.text(`Date: ${data.issuedDate.toLocaleDateString()}`, { align: 'left' });

    doc.end();

    stream.on('finish', () => {
      // Verify file exists before resolving
      if (fs.existsSync(outputPath)) {
        resolve(outputPath);
      } else {
        reject(new Error(`PDF file was not created at ${outputPath}`));
      }
    });
    stream.on('error', (err) => {
      console.error('PDF stream error:', err);
      reject(err);
    });
  });
};



