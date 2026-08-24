import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext.js';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { MailProvider } from './context/MailContext.js';
import { ChatProvider } from './context/ChatContext.js';

import { LoginPage } from './components/auth/LoginPage.js';
import { AppShell } from './components/layout/AppShell.js';
import { MailboxLayout } from './components/mail/MailboxLayout.js';
import { ChatLayout } from './components/chat/ChatLayout.js';
import { AdminDashboard } from './components/admin/AdminDashboard.js';
import { TemplatesPage } from './components/templates/TemplatesPage.js';
import { ContactsPage } from './components/contacts/ContactsPage.js';
import { SettingsPage } from './components/settings/SettingsPage.js';

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode; requireAdmin?: boolean }> = ({
  children,
  requireAdmin,
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center text-slate-600 dark:text-slate-400">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin mr-3" />
        <span className="font-serif text-sm">Loading Cookscape Workspace...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
    return <Navigate to="/mail" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <MailProvider>
            <ChatProvider>
              <Routes>
                <Route path="/login" element={<LoginPage />} />

                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <AppShell />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="/mail" replace />} />
                  <Route path="mail" element={<MailboxLayout />} />
                  <Route path="chat" element={<ChatLayout />} />
                  <Route path="templates" element={<TemplatesPage />} />
                  <Route path="contacts" element={<ContactsPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route
                    path="admin"
                    element={
                      <ProtectedRoute requireAdmin>
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </ChatProvider>
          </MailProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
};
