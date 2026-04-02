import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Users, Book, HelpCircle, Calendar, FileText, LogOut, LayoutDashboard } from 'lucide-react';

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const userName = localStorage.getItem('name') || 'Administrator';
  const firstLetter = userName.charAt(0).toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/auth/login');
  };

  const menuItems = [
    { path: '/admin/users', name: 'Người dùng', icon: Users },
    { path: '/admin/subjects', name: 'Môn học', icon: Book },
    { path: '/admin/questions', name: 'Ngân hàng câu hỏi', icon: HelpCircle },
    { path: '/admin/exams', name: 'Kỳ thi', icon: Calendar },
    { path: '/admin/reports', name: 'Báo cáo điểm', icon: FileText },
  ];

  return (
    <div className="flex bg-slate-50 min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shadow-xl z-20 sticky top-0 h-screen">
        <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950">
          <LayoutDashboard className="text-indigo-500 mr-3" />
          <span className="text-white font-bold text-lg tracking-wider">ADMIN PANEL</span>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 ml-2">Quản lý</div>
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-600 text-white font-medium shadow-lg shadow-indigo-900/50'
                    : 'hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <item.icon size={18} className="mr-3" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-red-400 hover:bg-slate-800 hover:text-red-300 rounded-xl transition-colors"
          >
            <LogOut size={18} className="mr-3" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-8 shadow-sm">
          <h2 className="text-slate-800 font-semibold text-lg flex-1">Hệ thống quản lý trực tuyến</h2>
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
              {firstLetter}
            </div>
            <span className="ml-3 text-sm font-medium text-slate-700">{userName}</span>
          </div>
        </header>
        
        <div className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
