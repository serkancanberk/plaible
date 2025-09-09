// src/admin/AppAdmin.tsx
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { ToastProvider } from './components/Toast';
import { UsersPage } from './pages/UsersPage';
import { StoriesPage } from './pages/StoriesPage';
import { StoryEditPage } from './pages/StoryEditPage';
import { FeedbacksPage } from './pages/FeedbacksPage';
import { WalletAnalyticsPage } from './pages/WalletAnalyticsPage';

export const AppAdmin: React.FC = () => {
  return (
    <ToastProvider>
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
                <Route path="/stories/edit/:storyId" element={<StoryEditPage />} />
                <Route path="/feedbacks" element={<FeedbacksPage />} />
                <Route path="/wallet-analytics" element={<WalletAnalyticsPage />} />
                <Route path="*" element={<Navigate to="/users" replace />} />
              </Routes>
            </main>
          </div>
        </div>
      </Router>
    </ToastProvider>
  );
};
