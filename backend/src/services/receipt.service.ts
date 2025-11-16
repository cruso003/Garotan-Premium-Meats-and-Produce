import escpos from 'escpos';
import { Transaction, TransactionItem } from '@prisma/client';

interface ReceiptData {
  transaction: Transaction & {
    items: (TransactionItem & {
      product: {
        name: string;
        sku: string;
      };
    })[];
    customer?: {
      name: string;
      phone: string;
    } | null;
  };
  businessInfo: {
    name: string;
    address: string;
    phone: string;
    taxId?: string;
  };
}

/**
 * Generate receipt content in ESC/POS format
 */
export class ReceiptService {
  /**
   * Generate receipt text for thermal printer
   */
  static generateReceiptText(data: ReceiptData): string {
    const { transaction, businessInfo } = data;
    const width = 48; // 80mm printer = ~48 characters

    let receipt = '';

    // Header - Business Info
    receipt += this.center(businessInfo.name.toUpperCase(), width) + '\n';
    receipt += this.center(businessInfo.address, width) + '\n';
    receipt += this.center(`Tel: ${businessInfo.phone}`, width) + '\n';
    if (businessInfo.taxId) {
      receipt += this.center(`Tax ID: ${businessInfo.taxId}`, width) + '\n';
    }
    receipt += this.line(width) + '\n';

    // Transaction Info
    receipt += `Date: ${new Date(transaction.createdAt).toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })}\n`;
    receipt += `Receipt #: ${transaction.receiptNumber}\n`;

    if (transaction.customer) {
      receipt += `Customer: ${transaction.customer.name}\n`;
      receipt += `Phone: ${transaction.customer.phone}\n`;
    } else {
      receipt += `Customer: Walk-in\n`;
    }

    receipt += this.line(width) + '\n';

    // Items Header
    receipt += this.row(['Item', 'Qty', 'Price', 'Total'], [24, 4, 10, 10], width) + '\n';
    receipt += this.line(width) + '\n';

    // Items
    transaction.items.forEach((item) => {
      // Product name (can wrap to multiple lines)
      receipt += `${item.product.name}\n`;

      // SKU, Quantity, Price, Subtotal
      const qty = item.quantity.toString();
      const price = this.formatCurrency(parseFloat(item.unitPrice.toString()));
      const subtotal = this.formatCurrency(
        item.quantity * parseFloat(item.unitPrice.toString())
      );

      receipt += this.row(
        [`  ${item.product.sku}`, qty, price, subtotal],
        [24, 4, 10, 10],
        width
      ) + '\n';

      // Discount if any
      if (item.discount && parseFloat(item.discount.toString()) > 0) {
        receipt += this.rightAlign(
          `Discount: -${this.formatCurrency(parseFloat(item.discount.toString()))}`,
          width
        ) + '\n';
      }
    });

    receipt += this.line(width) + '\n';

    // Totals
    const subtotal = parseFloat(transaction.subtotal.toString());
    const tax = parseFloat(transaction.tax.toString());
    const total = parseFloat(transaction.totalAmount.toString());

    receipt += this.row(['', 'Subtotal:', this.formatCurrency(subtotal)], [20, 14, 14], width) + '\n';
    receipt += this.row(['', 'Tax (10%):', this.formatCurrency(tax)], [20, 14, 14], width) + '\n';
    receipt += this.line(width) + '\n';
    receipt += this.row(['', 'TOTAL:', this.formatCurrency(total)], [20, 14, 14], width, true) + '\n';
    receipt += this.line(width) + '\n';

    // Payment Info
    receipt += `Payment Method: ${this.formatPaymentMethod(transaction.paymentMethod)}\n`;
    receipt += `Status: ${transaction.status}\n`;

    receipt += this.line(width) + '\n';

    // Footer
    receipt += this.center('Thank You for Your Business!', width) + '\n';
    receipt += this.center('Please Come Again', width) + '\n';
    receipt += '\n';
    receipt += this.center('Powered by Garotan Management System', width) + '\n';

    return receipt;
  }

  /**
   * Generate HTML receipt for browser printing
   */
  static generateReceiptHTML(data: ReceiptData): string {
    const { transaction, businessInfo } = data;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Receipt ${transaction.receiptNumber}</title>
  <style>
    @media print {
      @page { margin: 0; size: 80mm auto; }
      body { margin: 0; }
    }
    body {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      width: 80mm;
      margin: 0 auto;
      padding: 10px;
    }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .line { border-top: 1px dashed #000; margin: 5px 0; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; border-bottom: 1px dashed #000; padding: 5px 0; }
    td { padding: 3px 0; }
    .right { text-align: right; }
    .total-row { border-top: 1px dashed #000; font-weight: bold; font-size: 14px; }
  </style>
</head>
<body>
  <div class="center bold" style="font-size: 16px;">${businessInfo.name.toUpperCase()}</div>
  <div class="center">${businessInfo.address}</div>
  <div class="center">Tel: ${businessInfo.phone}</div>
  ${businessInfo.taxId ? `<div class="center">Tax ID: ${businessInfo.taxId}</div>` : ''}

  <div class="line"></div>

  <div>Date: ${new Date(transaction.createdAt).toLocaleString()}</div>
  <div>Receipt #: ${transaction.receiptNumber}</div>
  <div>Customer: ${transaction.customer?.name || 'Walk-in'}</div>

  <div class="line"></div>

  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th class="right">Qty</th>
        <th class="right">Price</th>
        <th class="right">Total</th>
      </tr>
    </thead>
    <tbody>
      ${transaction.items.map(item => `
        <tr>
          <td>${item.product.name}<br/><small>${item.product.sku}</small></td>
          <td class="right">${item.quantity}</td>
          <td class="right">${this.formatCurrency(parseFloat(item.unitPrice.toString()))}</td>
          <td class="right">${this.formatCurrency(item.quantity * parseFloat(item.unitPrice.toString()))}</td>
        </tr>
        ${item.discount && parseFloat(item.discount.toString()) > 0 ? `
        <tr>
          <td colspan="3" class="right">Discount:</td>
          <td class="right">-${this.formatCurrency(parseFloat(item.discount.toString()))}</td>
        </tr>
        ` : ''}
      `).join('')}
    </tbody>
  </table>

  <div class="line"></div>

  <table>
    <tr>
      <td>Subtotal:</td>
      <td class="right">${this.formatCurrency(parseFloat(transaction.subtotal.toString()))}</td>
    </tr>
    <tr>
      <td>Tax (10%):</td>
      <td class="right">${this.formatCurrency(parseFloat(transaction.tax.toString()))}</td>
    </tr>
    <tr class="total-row">
      <td>TOTAL:</td>
      <td class="right">${this.formatCurrency(parseFloat(transaction.totalAmount.toString()))}</td>
    </tr>
  </table>

  <div class="line"></div>

  <div>Payment: ${this.formatPaymentMethod(transaction.paymentMethod)}</div>
  <div>Status: ${transaction.status}</div>

  <div class="line"></div>

  <div class="center bold">Thank You for Your Business!</div>
  <div class="center">Please Come Again</div>
  <br/>
  <div class="center" style="font-size: 10px;">Powered by Garotan Management System</div>

  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>
    `;
  }

  // Helper methods
  private static center(text: string, width: number): string {
    const padding = Math.max(0, Math.floor((width - text.length) / 2));
    return ' '.repeat(padding) + text;
  }

  private static rightAlign(text: string, width: number): string {
    const padding = Math.max(0, width - text.length);
    return ' '.repeat(padding) + text;
  }

  private static line(width: number): string {
    return '-'.repeat(width);
  }

  private static row(
    columns: string[],
    widths: number[],
    totalWidth: number,
    bold: boolean = false
  ): string {
    let row = '';
    columns.forEach((col, i) => {
      const width = widths[i];
      if (i === columns.length - 1) {
        // Last column - right align
        row += this.rightAlign(col, width);
      } else {
        row += col.padEnd(width).substring(0, width);
      }
    });
    return row;
  }

  private static formatCurrency(amount: number): string {
    return `L$${amount.toFixed(2)}`;
  }

  private static formatPaymentMethod(method: string): string {
    const methods: Record<string, string> = {
      CASH: 'Cash',
      MOBILE_MONEY_MTN: 'Mobile Money (MTN)',
      MOBILE_MONEY_ORANGE: 'Mobile Money (Orange)',
      CARD: 'Card',
      CREDIT: 'Credit',
    };
    return methods[method] || method;
  }
}
