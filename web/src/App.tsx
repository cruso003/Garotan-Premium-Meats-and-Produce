import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { initializeAuth } from '@/store/auth';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Login from '@/pages/auth/Login';
import Layout from '@/components/layout/Layout';
import Dashboard from '@/pages/dashboard/Dashboard';
import POS from '@/pages/pos/POS';
import Products from '@/pages/products/Products';
import Customers from '@/pages/customers/Customers';
import Inventory from '@/pages/inventory/Inventory';
import Reports from '@/pages/reports/Reports';
import Settings from '@/pages/settings/Settings';
import AuditTrail from '@/pages/audit/AuditTrail';
import CSVOperations from '@/pages/operations/CSVOperations';

function App() {
  useEffect(() => {
    initializeAuth();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/pos" element={<POS />} />
            <Route path="/products" element={<Products />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/audit" element={<AuditTrail />} />
            <Route path="/csv" element={<CSVOperations />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>

        {/* Catch all - redirect to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
