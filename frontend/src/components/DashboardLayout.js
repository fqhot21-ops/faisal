import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { Shield, LayoutDashboard, Link2, Globe, FileUp, History, Settings, LogOut, Menu, X, UserCog } from 'lucide-react';
import { Button } from './ui/button';
import LanguageSwitcher from './LanguageSwitcher';

const DashboardLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { icon: LayoutDashboard, label: t('nav.dashboard'), path: '/dashboard', testid: 'nav-dashboard' },
    { icon: Link2, label: t('nav.urlScanner'), path: '/url-scanner', testid: 'nav-url-scanner' },
    { icon: Globe, label: t('nav.ipScanner'), path: '/ip-scanner', testid: 'nav-ip-scanner' },
    { icon: FileUp, label: t('nav.fileScanner'), path: '/file-scanner', testid: 'nav-file-scanner' },
    { icon: History, label: t('nav.history'), path: '/history', testid: 'nav-history' },
  ];

  if (user?.role === 'admin') {
    menuItems.push({ icon: UserCog, label: t('nav.adminPanel'), path: '/admin', testid: 'nav-admin' });
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-cyber-black flex">
      {/* Sidebar */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-cyber-gray border-r border-white/10 transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        data-testid="sidebar"
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <Shield className="w-8 h-8 text-cyber-cyan" strokeWidth={1.5} />
                <span className="text-xl font-mono font-bold tracking-tighter">{t('common.appName')}</span>
              </div>
            </div>
            <LanguageSwitcher />
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  data-testid={item.testid}
                  onClick={() => {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 font-mono text-sm transition-colors ${
                    isActive
                      ? 'bg-cyber-cyan/10 text-cyber-cyan border-l-2 border-cyber-cyan'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" strokeWidth={1.5} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-white/10">
            <div className="mb-3 px-4">
              <p className="font-mono font-bold text-sm">{user?.full_name}</p>
              <p className="text-xs text-gray-500 font-mono uppercase">{user?.role}</p>
            </div>
            <Button
              data-testid="logout-btn"
              onClick={handleLogout}
              variant="ghost"
              className="w-full justify-start font-mono text-sm text-gray-400 hover:text-white"
            >
              <LogOut className="w-5 h-5 mr-3" strokeWidth={1.5} />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="lg:hidden bg-cyber-gray border-b border-white/10 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="w-6 h-6 text-cyber-cyan" strokeWidth={1.5} />
              <span className="text-lg font-mono font-bold">SecureVision</span>
            </div>
            <Button
              data-testid="mobile-menu-btn"
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? (
                <X className="w-6 h-6" strokeWidth={1.5} />
              ) : (
                <Menu className="w-6 h-6" strokeWidth={1.5} />
              )}
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;