import { useState } from 'react';
import { Upload, Download, FileText, AlertCircle, CheckCircle, Users, Package, ShoppingCart, Archive } from 'lucide-react';
import { api } from '@/lib/api';

type ExportType = 'products' | 'customers' | 'transactions' | 'inventory';
type ImportType = 'products' | 'customers';

interface ImportResult {
  imported: number;
  failed: number;
  errors: string[];
}

export default function CSVOperations() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Export filters
  const [exportType, setExportType] = useState<ExportType>('products');
  const [activeOnly, setActiveOnly] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Import type
  const [importType, setImportType] = useState<ImportType>('products');

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      if (exportType === 'products' || exportType === 'customers') {
        if (activeOnly) params.append('isActive', 'true');
      }

      if (exportType === 'transactions') {
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
      }

      if (exportType === 'inventory') {
        params.append('hasStock', 'true');
      }

      const response = await api.get(`/csv/export/${exportType}?${params.toString()}`, {
        responseType: 'blob',
      });

      // Create download link
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${exportType}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        setError('Please select a CSV file');
        return;
      }
      setSelectedFile(file);
      setError(null);
      setImportResult(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setError('Please select a file to import');
      return;
    }

    setIsImporting(true);
    setError(null);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await api.post<{ data: ImportResult }>(
        `/csv/import/${importType}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setImportResult(response.data.data);
      setSelectedFile(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Import failed');
    } finally {
      setIsImporting(false);
    }
  };

  const getExportIcon = (type: ExportType) => {
    switch (type) {
      case 'products':
        return <Package className="h-5 w-5" />;
      case 'customers':
        return <Users className="h-5 w-5" />;
      case 'transactions':
        return <ShoppingCart className="h-5 w-5" />;
      case 'inventory':
        return <Archive className="h-5 w-5" />;
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">CSV Import/Export</h1>
        <p className="text-gray-600">
          Bulk import and export data using CSV files
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export Section */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Download className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold text-gray-900">Export Data</h2>
          </div>

          <div className="space-y-4">
            {/* Export Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Data Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['products', 'customers', 'transactions', 'inventory'] as ExportType[]).map(
                  (type) => (
                    <button
                      key={type}
                      onClick={() => setExportType(type)}
                      className={`p-3 rounded-lg border-2 transition-all flex items-center gap-2 ${
                        exportType === type
                          ? 'border-primary bg-primary-50 text-primary'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {getExportIcon(type)}
                      <span className="font-medium capitalize">{type}</span>
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Export Filters */}
            <div className="space-y-3">
              {(exportType === 'products' || exportType === 'customers') && (
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={activeOnly}
                    onChange={(e) => setActiveOnly(e.target.checked)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700">Active records only</span>
                </label>
              )}

              {exportType === 'transactions' && (
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="input w-full"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Export Button */}
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full btn btn-primary flex items-center justify-center gap-2"
            >
              <Download className="h-5 w-5" />
              {isExporting ? 'Exporting...' : `Export ${exportType}`}
            </button>

            {/* Export Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              <p className="font-medium mb-1">Export includes:</p>
              <ul className="list-disc list-inside space-y-1">
                {exportType === 'products' && (
                  <>
                    <li>SKU, barcode, name, description</li>
                    <li>Pricing (cost, retail, wholesale)</li>
                    <li>Current stock levels</li>
                  </>
                )}
                {exportType === 'customers' && (
                  <>
                    <li>Name, phone, email, address</li>
                    <li>Customer type and loyalty tier</li>
                    <li>Loyalty points and credit info</li>
                  </>
                )}
                {exportType === 'transactions' && (
                  <>
                    <li>Transaction details and totals</li>
                    <li>Customer and cashier information</li>
                    <li>Payment method and loyalty points</li>
                  </>
                )}
                {exportType === 'inventory' && (
                  <>
                    <li>Batch numbers and quantities</li>
                    <li>Product and supplier details</li>
                    <li>Cost and expiry information</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Import Section */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Upload className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold text-gray-900">Import Data</h2>
          </div>

          <div className="space-y-4">
            {/* Import Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Data Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['products', 'customers'] as ImportType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setImportType(type)}
                    className={`p-3 rounded-lg border-2 transition-all flex items-center gap-2 ${
                      importType === type
                        ? 'border-primary bg-primary-50 text-primary'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {type === 'products' ? (
                      <Package className="h-5 w-5" />
                    ) : (
                      <Users className="h-5 w-5" />
                    )}
                    <span className="font-medium capitalize">{type}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select CSV File
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <FileText className="h-12 w-12 text-gray-400 mb-2" />
                  <span className="text-sm font-medium text-gray-700">
                    {selectedFile ? selectedFile.name : 'Click to select CSV file'}
                  </span>
                  <span className="text-xs text-gray-500 mt-1">Max file size: 5MB</span>
                </label>
              </div>
            </div>

            {/* Import Button */}
            <button
              onClick={handleImport}
              disabled={!selectedFile || isImporting}
              className="w-full btn btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="h-5 w-5" />
              {isImporting ? 'Importing...' : `Import ${importType}`}
            </button>

            {/* Import Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
              <p className="font-medium mb-1 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                Important:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Existing records will be updated</li>
                <li>New records will be created</li>
                <li>Required fields must be present</li>
                <li>Invalid rows will be skipped</li>
              </ul>
            </div>

            {/* Import Result */}
            {importResult && (
              <div
                className={`rounded-lg p-4 ${
                  importResult.failed === 0
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-orange-50 border border-orange-200'
                }`}
              >
                <div className="flex items-start gap-2 mb-2">
                  {importResult.failed === 0 ? (
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 mb-1">Import Complete</p>
                    <div className="text-sm space-y-1">
                      <p className="text-green-700">
                        ✓ {importResult.imported} records imported successfully
                      </p>
                      {importResult.failed > 0 && (
                        <p className="text-red-700">✗ {importResult.failed} records failed</p>
                      )}
                    </div>

                    {importResult.errors.length > 0 && (
                      <details className="mt-2">
                        <summary className="text-sm font-medium text-gray-700 cursor-pointer">
                          View errors ({importResult.errors.length})
                        </summary>
                        <div className="mt-2 max-h-40 overflow-y-auto bg-white rounded p-2 text-xs font-mono">
                          {importResult.errors.map((error, idx) => (
                            <div key={idx} className="text-red-600 py-1">
                              {error}
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-900">Error</p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CSV Format Guide */}
      <div className="card mt-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">CSV Format Guide</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Products CSV Format</h4>
            <div className="bg-gray-50 rounded p-3 text-xs font-mono overflow-x-auto">
              <div className="text-gray-600">
                sku,barcode,name,category,costPrice,retailPrice,wholesalePrice,minStockLevel
              </div>
              <div className="text-gray-800">
                PROD001,123456789,Product Name,MEAT,10.00,15.00,12.00,10
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Customers CSV Format</h4>
            <div className="bg-gray-50 rounded p-3 text-xs font-mono overflow-x-auto">
              <div className="text-gray-600">name,phone,email,customerType,loyaltyPoints</div>
              <div className="text-gray-800">
                John Doe,+231770123456,john@example.com,RETAIL,100
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
