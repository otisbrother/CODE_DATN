import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { FiHome, FiBook, FiFileText, FiBarChart2, FiMessageCircle, FiLogOut, FiMenu, FiX, FiUsers, FiDatabase, FiCheckSquare } from 'react-icons/fi';
import useAuthStore from '../store/auth.store';
import './DashboardLayout.css';

const menuConfig = {
  student: [
    { path: '/student', icon: <FiHome />, label: 'Dashboard' },
    { path: '/student/courses', icon: <FiBook />, label: 'Khóa học của tôi' },
    { path: '/student/submissions', icon: <FiFileText />, label: 'Bài nộp' },
    { path: '/student/progress', icon: <FiBarChart2 />, label: 'Tiến độ' },
    { path: '/student/ai-chat', icon: <FiMessageCircle />, label: 'AI Hỏi đáp' },
  ],
  lecturer: [
    { path: '/lecturer', icon: <FiHome />, label: 'Dashboard' },
    { path: '/lecturer/courses', icon: <FiBook />, label: 'Quản lý khóa học' },
    { path: '/lecturer/ai-data', icon: <FiDatabase />, label: 'Dữ liệu AI' },
  ],
  admin: [
    { path: '/admin', icon: <FiHome />, label: 'Dashboard' },
    { path: '/admin/users', icon: <FiUsers />, label: 'Quản lý người dùng' },
    { path: '/admin/ai-approve', icon: <FiCheckSquare />, label: 'Duyệt dữ liệu AI' },
  ],
};

export default function DashboardLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menu = menuConfig[user?.role] || [];

  return (
    <div className="dashboard-layout">
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2 className="logo">🎓 E-Learning</h2>
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
        <nav className="sidebar-nav">
          {menu.map((item) => (
            <NavLink key={item.path} to={item.path} end={item.path === `/${user?.role}`}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">{item.icon}</span>
              {sidebarOpen && <span className="nav-label">{item.label}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{user?.full_name?.[0] || 'U'}</div>
            {sidebarOpen && (
              <div className="user-details">
                <p className="user-name">{user?.full_name}</p>
                <p className="user-role">{user?.role}</p>
              </div>
            )}
          </div>
          <button className="btn-logout" onClick={handleLogout}>
            <FiLogOut /> {sidebarOpen && 'Đăng xuất'}
          </button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
