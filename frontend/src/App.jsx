import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import QuotationForm from './pages/QuotationForm';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/imports" replace />} />
        
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<div className="p-4 text-gray-500">Dashboard Area (Under Construction)</div>} />
          <Route path="/imports" element={<QuotationForm />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
