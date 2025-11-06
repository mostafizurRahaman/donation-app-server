import path from 'path';
import fs from 'fs/promises';

interface IReceiptPDFData {
  donorName: string;
  organizationName: string;
  organizationABN: string;
  organizationStatus: string;
  donationAmount: number;
  donationDate: Date;
  paymentMethod: string;
  receiptNumber?: string;
}

// Generate receipt PDF (placeholder implementation)
export const generateReceiptPDF = async (data: IReceiptPDFData): Promise<string> => {
  try {
    // In a real implementation, you would use a PDF library like puppeteer, jsPDF, or PDFKit
    // For now, we'll create a simple HTML receipt and return a mock URL
    
    const receiptHTML = generateReceiptHTML(data);
    
    // Create receipts directory if it doesn't exist
    const receiptsDir = path.join(process.cwd(), 'public', 'receipts');
    await fs.mkdir(receiptsDir, { recursive: true });
    
    // Generate unique filename
    const filename = `receipt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.html`;
    const filePath = path.join(receiptsDir, filename);
    
    // Save HTML file (in production, this would be a PDF)
    await fs.writeFile(filePath, receiptHTML);
    
    // Return public URL (served via app.use('/public', express.static('public')))
    return `/public/receipts/${filename}`;
  } catch (error) {
    throw new Error(`Failed to generate receipt PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Generate receipt HTML template
const generateReceiptHTML = (data: IReceiptPDFData): string => {
  const formattedDate = data.donationDate.toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formattedAmount = new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(data.donationAmount);

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Donation Receipt</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                line-height: 1.6;
                color: #333;
            }
            .header {
                text-align: center;
                border-bottom: 2px solid #2c5530;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            .logo {
                font-size: 28px;
                font-weight: bold;
                color: #2c5530;
                margin-bottom: 10px;
            }
            .receipt-title {
                font-size: 24px;
                color: #2c5530;
                margin-bottom: 20px;
            }
            .receipt-info {
                background-color: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 20px;
            }
            .info-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 10px;
                padding: 8px 0;
                border-bottom: 1px solid #e9ecef;
            }
            .info-row:last-child {
                border-bottom: none;
            }
            .label {
                font-weight: bold;
                color: #495057;
            }
            .value {
                color: #212529;
            }
            .amount {
                font-size: 20px;
                font-weight: bold;
                color: #2c5530;
            }
            .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #dee2e6;
                font-size: 12px;
                color: #6c757d;
                text-align: center;
            }
            .disclaimer {
                background-color: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 4px;
                padding: 15px;
                margin: 20px 0;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="logo">🌙 Crescent Change</div>
            <div class="receipt-title">Donation Receipt</div>
        </div>

        <div class="receipt-info">
            <div class="info-row">
                <span class="label">Receipt Number:</span>
                <span class="value">${data.receiptNumber || 'Pending'}</span>
            </div>
            <div class="info-row">
                <span class="label">Donor Name:</span>
                <span class="value">${data.donorName}</span>
            </div>
            <div class="info-row">
                <span class="label">Organization:</span>
                <span class="value">${data.organizationName}</span>
            </div>
            <div class="info-row">
                <span class="label">ABN:</span>
                <span class="value">${data.organizationABN}</span>
            </div>
            <div class="info-row">
                <span class="label">Status:</span>
                <span class="value">${data.organizationStatus}</span>
            </div>
            <div class="info-row">
                <span class="label">Donation Date:</span>
                <span class="value">${formattedDate}</span>
            </div>
            <div class="info-row">
                <span class="label">Payment Method:</span>
                <span class="value">${data.paymentMethod}</span>
            </div>
            <div class="info-row">
                <span class="label">Donation Amount:</span>
                <span class="value amount">${formattedAmount}</span>
            </div>
        </div>

        <div class="disclaimer">
            <strong>Important:</strong> This receipt is issued by Crescent Change on behalf of ${data.organizationName}. 
            ${data.organizationStatus === 'tax-deductible' ? 'This donation may be tax-deductible. Please consult your tax advisor.' : ''}
            ${data.organizationStatus === 'zakat-eligible' ? 'This donation is eligible for Zakat purposes.' : ''}
        </div>

        <div class="footer">
            <p>Thank you for your generous donation!</p>
            <p>Crescent Change - Connecting Hearts, Changing Lives</p>
            <p>This receipt was generated automatically on ${new Date().toLocaleDateString('en-AU')}</p>
        </div>
    </body>
    </html>
  `;
};

// Validate receipt data
export const validateReceiptData = (data: Partial<IReceiptPDFData>): boolean => {
  const requiredFields: (keyof IReceiptPDFData)[] = [
    'donorName',
    'organizationName',
    'organizationABN',
    'organizationStatus',
    'donationAmount',
    'donationDate',
    'paymentMethod',
  ];

  return requiredFields.every(field => {
    const value = data[field];
    if (field === 'donationAmount') {
      return typeof value === 'number' && value > 0;
    }
    if (field === 'donationDate') {
      return value instanceof Date && !isNaN(value.getTime());
    }
    return typeof value === 'string' && value.trim().length > 0;
  });
};

// Generate secure download token
export const generateDownloadToken = (receiptId: string): string => {
  // In production, use a proper JWT or crypto library
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substr(2, 9);
  return Buffer.from(`${receiptId}-${timestamp}-${randomString}`).toString('base64');
};

// Verify download token
export const verifyDownloadToken = (token: string): { receiptId: string; isValid: boolean } => {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [receiptId, timestamp] = decoded.split('-');
    
    // Token expires after 24 hours
    const tokenAge = Date.now() - parseInt(timestamp);
    const isValid = tokenAge < 24 * 60 * 60 * 1000;
    
    return { receiptId, isValid };
  } catch {
    return { receiptId: '', isValid: false };
  }
};
