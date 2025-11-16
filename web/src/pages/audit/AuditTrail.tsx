import { useState, useEffect } from 'react';
import { Search, Filter, Calendar, User, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '@/lib/api';

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-800',
  UPDATE: 'bg-blue-100 text-blue-800',
  DELETE: 'bg-red-100 text-red-800',
  VOID: 'bg-orange-100 text-orange-800',
  LOGIN: 'bg-purple-100 text-purple-800',
  LOGOUT: 'bg-gray-100 text-gray-800',
  RECEIVE: 'bg-teal-100 text-teal-800',
  ADJUST: 'bg-yellow-100 text-yellow-800',
  EXPORT: 'bg-indigo-100 text-indigo-800',
  IMPORT: 'bg-pink-100 text-pink-800',
};

export default function AuditTrail() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  // Filters
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const limit = 50;

  useEffect(() => {
    fetchAuditLogs();
  }, [page, action, entityType, startDate, endDate]);

  const fetchAuditLogs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(action && { action }),
        ...(entityType && { entityType }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      });

      const response = await api.get<{
        data: AuditLog[];
        pagination: { total: number; totalPages: number };
      }>(`/audit/logs?${params}`);

      setLogs(response.data.data);
      setTotal(response.data.pagination.total);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearFilters = () => {
    setAction('');
    setEntityType('');
    setStartDate('');
    setEndDate('');
    setSearchQuery('');
    setPage(1);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  const toggleExpand = (id: string) => {
    setExpandedLog(expandedLog === id ? null : id);
  };

  // Filter logs by search query (client-side)
  const filteredLogs = logs.filter((log) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      log.user.name.toLowerCase().includes(query) ||
      log.user.email.toLowerCase().includes(query) ||
      log.action.toLowerCase().includes(query) ||
      log.entityType.toLowerCase().includes(query) ||
      log.entityId.toLowerCase().includes(query) ||
      (log.details && log.details.toLowerCase().includes(query))
    );
  });

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Audit Trail</h1>
        <p className="text-gray-600">
          View and filter all system activities and changes
        </p>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search logs..."
              className="input w-full pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Action Filter */}
          <select
            className="input"
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Actions</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
            <option value="VOID">Void</option>
            <option value="RECEIVE">Receive Stock</option>
            <option value="ADJUST">Adjust Stock</option>
            <option value="LOGIN">Login</option>
            <option value="LOGOUT">Logout</option>
            <option value="EXPORT">Export</option>
            <option value="IMPORT">Import</option>
          </select>

          {/* Entity Type Filter */}
          <select
            className="input"
            value={entityType}
            onChange={(e) => {
              setEntityType(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Entity Types</option>
            <option value="Product">Product</option>
            <option value="Customer">Customer</option>
            <option value="Transaction">Transaction</option>
            <option value="Inventory">Inventory</option>
            <option value="User">User</option>
            <option value="Supplier">Supplier</option>
          </select>

          {/* Clear Filters */}
          <button onClick={handleClearFilters} className="btn btn-secondary">
            Clear Filters
          </button>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              className="input w-full"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              className="input w-full"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing {filteredLogs.length} of {total} audit logs
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="btn btn-secondary btn-sm"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="btn btn-secondary btn-sm"
          >
            Next
          </button>
        </div>
      </div>

      {/* Audit Logs Table */}
      {isLoading ? (
        <div className="card text-center py-12">
          <div className="text-gray-500">Loading audit logs...</div>
        </div>
      ) : filteredLogs.length > 0 ? (
        <div className="space-y-2">
          {filteredLogs.map((log) => (
            <div key={log.id} className="card hover:shadow-md transition-shadow">
              <div
                className="flex items-start justify-between cursor-pointer"
                onClick={() => toggleExpand(log.id)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {/* Action Badge */}
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded ${
                        ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {log.action}
                    </span>

                    {/* Entity Type */}
                    <span className="text-sm font-medium text-gray-700">
                      {log.entityType}
                    </span>

                    {/* Entity ID */}
                    <span className="text-xs text-gray-500 font-mono">
                      {log.entityId.substring(0, 8)}...
                    </span>

                    {/* Timestamp */}
                    <span className="flex items-center gap-1 text-xs text-gray-500 ml-auto">
                      <Calendar className="h-3 w-3" />
                      {formatDate(log.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="h-4 w-4" />
                    <span className="font-medium">{log.user.name}</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-500">{log.user.email}</span>
                  </div>

                  {/* Details Preview */}
                  {log.details && !expandedLog && (
                    <p className="mt-2 text-sm text-gray-700 truncate">
                      {log.details}
                    </p>
                  )}
                </div>

                {/* Expand Icon */}
                <button className="ml-4 p-2 hover:bg-gray-100 rounded">
                  {expandedLog === log.id ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </button>
              </div>

              {/* Expanded Details */}
              {expandedLog === log.id && log.details && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-gray-400 mt-1" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700 mb-1">Details:</p>
                      <div className="bg-gray-50 rounded p-3 text-sm text-gray-800 font-mono whitespace-pre-wrap">
                        {log.details}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <FileText className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No audit logs found</p>
        </div>
      )}
    </div>
  );
}
