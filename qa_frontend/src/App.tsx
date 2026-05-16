import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import BaseLayout from './layouts/BaseLayout';
import Dashboard from './pages/Dashboard';
import TestCaseList from './pages/TestCaseList';
import TestRunDetail from './pages/TestRunDetail';
import ExecutionHistory from './pages/ExecutionHistory';
import Login from './pages/Login';
import Register from './pages/Register';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  const loginTime = localStorage.getItem('login_time');
  
  // Token lives for 1 day (24 hours)
  const isExpired = loginTime ? (Date.now() - parseInt(loginTime)) > 24 * 60 * 60 * 1000 : true;

  if (!token || isExpired) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('login_time');
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Standalone Guest Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Authenticated Dashboard Routes wrapped in Sidebar/Header layout */}
        <Route 
          path="/*" 
          element={
            <ProtectedRoute>
              <BaseLayout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/testcases" element={<TestCaseList />} />
                  <Route path="/history" element={<ExecutionHistory />} />
                  <Route path="/testrun/:id" element={<TestRunDetail />} />
                  
                  {/* Fallback support info */}
                  <Route path="/docs" element={
                    <div className="p-6 bg-white border border-[#EDEDED] rounded-xl font-sans">
                      <h2 className="text-xl font-bold text-[#1F1F1F]">Technical Documentation</h2>
                      <p className="text-sm text-[#595959] mt-2 font-medium">To view the full automated test suite integration guidelines, please consult the system engineering documentation repository.</p>
                    </div>
                  } />
                  <Route path="/support" element={
                    <div className="p-6 bg-white border border-[#EDEDED] rounded-xl font-sans">
                      <h2 className="text-xl font-bold text-[#1F1F1F]">Get System Support</h2>
                      <p className="text-sm text-[#595959] mt-2 font-medium">For system outages, performance bottlenecks or custom test framework integration requests, please contact the Lead QA Architect.</p>
                    </div>
                  } />
                </Routes>
              </BaseLayout>
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}
