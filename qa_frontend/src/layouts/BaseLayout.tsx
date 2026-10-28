import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ListTodo,
  History,
  BookOpen,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Activity,
  LogOut,
  User,
  Shield,
  ClipboardList
} from 'lucide-react';
import { useGlobalStore } from '../store';

interface BaseLayoutProps {
  children: React.ReactNode;
}

const BaseLayout: React.FC<BaseLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    sidebarCollapsed,
    toggleSidebar
  } = useGlobalStore();

  // Custom Dropdown Open States
  const [userOpen, setUserOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ full_name?: string; email?: string; role?: string } | null>(null);

  // References for clicking outside dropdowns
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch (e) {
        // Ignore
      }
    }
  }, [navigate]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setUserOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const menuItems: { name: string; path: string; icon: any; disabled?: boolean }[] = [
    { name: 'OVERVIEW', path: '/', icon: LayoutDashboard },
    { name: 'TEST CASES', path: '/testcases', icon: ListTodo },
    { name: 'EXECUTION HISTORY', path: '/history', icon: History },
  ];

  if (currentUser?.role === 'admin') {
    menuItems.push(
      { name: 'USER MANAGEMENT', path: '/admin/users', icon: Shield },
      { name: 'SYSTEM AUDIT LOGS', path: '/admin/audit', icon: ClipboardList }
    );
  }

  const bottomItems: { name: string; path: string; icon: any; disabled?: boolean }[] = [
    { name: 'DOCUMENTATION', path: '/docs', icon: BookOpen },
    { name: 'SUPPORT', path: '/support', icon: HelpCircle },
  ];

  const handleNav = (path: string, disabled?: boolean) => {
    if (disabled) return;
    navigate(path);
  };

  return (
    <div className="flex h-screen w-screen bg-[#F5F7FA] overflow-hidden text-[#1F1F1F] font-sans">
      {/* SIDEBAR */}
      <aside
        className={`bg-white border-r border-[#EDEDED] flex flex-col justify-between flex-shrink-0 transition-all duration-300 ${sidebarCollapsed ? 'w-20' : 'w-64'
          }`}
      >
        <div>
          {/* Brand Logo Header */}
          <div className="p-6 border-b border-[#EDEDED] h-18 flex items-center justify-between">
            {!sidebarCollapsed ? (
              <div>
                <h1 className="text-lg font-bold tracking-wider text-[#1677FF] flex items-center gap-2">
                  <Activity size={20} className="stroke-[2.5]" />
                  AUTOMATION EDUMASTER
                </h1>
              </div>
            ) : (
              <div className="mx-auto text-[#1677FF]">
                <Activity size={24} className="stroke-[2.5]" />
              </div>
            )}

            {/* Collapse button on Desktop */}
            <button
              onClick={toggleSidebar}
              className="hidden md:flex text-[#595959] hover:bg-[#F5F7FA] p-1.5 rounded-md transition-colors border border-transparent hover:border-[#EDEDED]"
            >
              {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>

          {/* Navigation Menu Links */}
          <nav className="p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.name}
                  onClick={() => handleNav(item.path, item.disabled)}
                  disabled={item.disabled}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-150 ${item.disabled
                    ? 'opacity-45 cursor-not-allowed text-[#8C8C8C]'
                    : isActive
                      ? 'bg-[#E6F4FF] text-[#1677FF] shadow-xs'
                      : 'text-[#595959] hover:bg-[#F5F7FA] hover:text-[#1F1F1F]'
                    } ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
                  title={item.name}
                >
                  <Icon size={18} className={isActive ? 'text-[#1677FF]' : 'text-[#8C8C8C]'} />
                  {!sidebarCollapsed && <span>{item.name}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Bottom Nav Links */}
        <div className="p-4 border-t border-[#EDEDED] space-y-1">
          {bottomItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.name}
                onClick={() => handleNav(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-150 ${isActive
                  ? 'bg-[#E6F4FF] text-[#1677FF]'
                  : 'text-[#595959] hover:bg-[#F5F7FA] hover:text-[#1F1F1F]'
                  } ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
                title={item.name}
              >
                <Icon size={18} className="text-[#8C8C8C]" />
                {!sidebarCollapsed && <span>{item.name}</span>}
              </button>
            );
          })}
        </div>
      </aside>

      {/* MAIN MAIN CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* HEADER / TOPBAR */}
        <header className="h-18 bg-white border-b border-[#EDEDED] flex items-center justify-between px-6 flex-shrink-0 z-10">
          <div className="flex items-center gap-4">
            {/* Collapse toggle button for Mobile/Tablet */}
            <button
              onClick={toggleSidebar}
              className="md:hidden text-[#595959] hover:bg-[#F5F7FA] p-2 rounded-md transition-colors"
            >
              <ChevronRight size={20} />
            </button>

            <span className="text-xl font-bold tracking-tight text-[#1F1F1F] font-sans">
              {location.pathname === '/' && 'Dashboard'}
              {location.pathname === '/testcases' && 'Test Cases Library'}
              {location.pathname === '/history' && 'Execution Run History'}
              {location.pathname.startsWith('/testrun') && 'Test Execution Log'}
              {location.pathname === '/docs' && 'Technical Documentation'}
              {location.pathname === '/support' && 'Get System Support'}
              {location.pathname === '/admin/users' && 'User Management'}
              {location.pathname === '/admin/audit' && 'System Audit Logs'}
            </span>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-4">


            {/* User Profile Card (Bespoke profile card) */}
            <div className="relative" ref={userRef}>
              <div
                className="flex items-center gap-3 cursor-pointer pl-1 group"
                onClick={() => setUserOpen(!userOpen)}
              >
                <div className="text-right hidden sm:block">
                  <span className="text-sm font-semibold text-[#1F1F1F] block leading-tight group-hover:text-[#1677FF] transition-colors">{currentUser?.full_name || "Alex Rivera"}</span>

                </div>
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop"
                  alt="Avatar"
                  className="w-9 h-9 border border-[#91CAFF] shadow-xs rounded-full object-cover"
                />
              </div>

              {userOpen && (
                <div className="absolute right-0 mt-1.5 w-48 bg-white border border-[#EDEDED] rounded-lg shadow-lg py-1.5 z-50 font-semibold text-xs text-[#1F1F1F] animate-fade-in space-y-0.5">
                  <button
                    onClick={() => setUserOpen(false)}
                    className="w-full text-left px-4 py-2 hover:bg-[#F5F7FA] transition-colors flex items-center gap-2"
                  >
                    <User size={13} className="text-[#8C8C8C]" />
                    <span>My Profile</span>
                  </button>
                  <div className="border-t border-[#F0F0F0] my-1" />
                  <button
                    onClick={() => {
                      localStorage.removeItem("token");
                      localStorage.removeItem("user");
                      navigate('/login');
                      setUserOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-500 transition-colors flex items-center gap-2"
                  >
                    <LogOut size={13} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* PAGE BODY SCROLL CONTAINER */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default BaseLayout;
