// src/admin/AppAdmin.tsx
import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { Toast, ToastContext } from './components/Toast';
import { UsersPage } from './pages/UsersPage';
import { StoriesPage } from './pages/StoriesPage';
import { FeedbacksPage } from './pages/FeedbacksPage';

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info';
}

export const AppAdmin: React.FC = () => {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
  };

  const hideToast = () => {
    setToast(null);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      <Router>
        <div className="flex h-screen bg-gray-100">
          <Sidebar />
          
          <div className="flex-1 flex flex-col overflow-hidden">
            <Topbar />
            
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
              <Routes>
                <Route path="/" element={<Navigate to="/users" replace />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/stories" element={<StoriesPage />} />
                <Route path="/feedbacks" element={<FeedbacksPage />} />
                <Route path="*" element={<Navigate to="/users" replace />} />
              </Routes>
            </main>
          </div>
        </div>
        
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={hideToast}
          />
        )}
      </Router>
    </ToastContext.Provider>
  );
};
