import { useState } from 'react';
import { Printer, Loader } from 'lucide-react';
import { api } from '@/lib/api';

interface PrintReceiptProps {
  transactionId: string;
  receiptNumber: string;
  onPrintComplete?: () => void;
  className?: string;
}

export default function PrintReceipt({
  transactionId,
  receiptNumber,
  onPrintComplete,
  className = '',
}: PrintReceiptProps) {
  const [printing, setPrinting] = useState(false);

  /**
   * Print receipt using browser print dialog
   * Opens receipt in new window and triggers print
   */
  const handlePrint = async () => {
    try {
      setPrinting(true);

      // Open receipt in new window
      const receiptUrl = `/api/receipts/transaction/${transactionId}?format=html`;

      // Open in new window
      const printWindow = window.open(receiptUrl, '_blank', 'width=800,height=600');

      if (printWindow) {
        // Print dialog will be triggered by the HTML's onload script
        printWindow.focus();
      } else {
        alert('Please allow popups to print receipts');
      }

      onPrintComplete?.();
    } catch (error) {
      console.error('Print error:', error);
      alert('Failed to print receipt. Please try again.');
    } finally {
      setPrinting(false);
    }
  };

  /**
   * Download receipt as text file (alternative for thermal printers)
   */
  const handleDownloadText = async () => {
    try {
      setPrinting(true);

      const response = await api.get<string>(`/receipts/transaction/${transactionId}?format=text`, {
        responseType: 'blob',
      });

      // Create download link
      const blob = new Blob([response.data as BlobPart], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt-${receiptNumber}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      onPrintComplete?.();
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download receipt. Please try again.');
    } finally {
      setPrinting(false);
    }
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      <button
        onClick={handlePrint}
        disabled={printing}
        className="btn btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
        title="Print receipt"
      >
        {printing ? (
          <Loader className="h-5 w-5 mr-2 animate-spin" />
        ) : (
          <Printer className="h-5 w-5 mr-2" />
        )}
        Print Receipt
      </button>

      <button
        onClick={handleDownloadText}
        disabled={printing}
        className="btn flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
        title="Download receipt as text"
      >
        Download (Text)
      </button>
    </div>
  );
}
