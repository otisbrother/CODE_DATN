import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { FiHome, FiBook, FiFileText, FiBarChart2, FiLogOut, FiMenu, FiArrowLeft, FiUsers, FiDatabase, FiDollarSign, FiTag, FiCalendar, FiUser } from 'react-icons/fi';
import useAuthStore from '../store/auth.store';
import LessonAIWidget from '../components/LessonAIWidget';
import StudyReminder from '../components/StudyReminder';
import './DashboardLayout.css';

const menuConfig = {
  student: [
    { path: '/student', icon: <FiHome />, label: 'Dashboard' },
    { path: '/student/courses', icon: <FiBook />, label: 'Khóa học của tôi' },
    { path: '/student/schedule', icon: <FiCalendar />, label: 'Lịch học' },
    { path: '/student/submissions', icon: <FiFileText />, label: 'Bài nộp' },
    { path: '/student/progress', icon: <FiBarChart2 />, label: 'Tiến độ' },
  ],
  lecturer: [
    { path: '/lecturer', icon: <FiHome />, label: 'Dashboard' },
    { path: '/lecturer/courses', icon: <FiBook />, label: 'Quản lý khóa học' },
    { path: '/lecturer/progress', icon: <FiBarChart2 />, label: 'Theo dõi tiến độ' },
    { path: '/lecturer/ai-data', icon: <FiDatabase />, label: 'Dữ liệu AI' },
    { path: '/lecturer/profile', icon: <FiUser />, label: 'Hồ sơ' },
  ],
  admin: [
    { path: '/admin', icon: <FiHome />, label: 'Dashboard' },
    { path: '/admin/users', icon: <FiUsers />, label: 'Quản lý người dùng' },
    { path: '/admin/courses', icon: <FiBook />, label: 'Giám sát khóa học' },
    { path: '/admin/progress', icon: <FiBarChart2 />, label: 'Tiến độ học tập' },
    { path: '/admin/payments', icon: <FiDollarSign />, label: 'Lịch sử thanh toán' },
    { path: '/admin/vouchers', icon: <FiTag />, label: 'Quản lý voucher' },
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
            {sidebarOpen ? <FiArrowLeft /> : <FiMenu />}
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
            <div className="user-avatar">
              {user?.avatar_url
                ? <img src={user.avatar_url} alt={user.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                : (user?.full_name?.[0] || 'U')}
            </div>
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
      {user?.role === 'student' && <LessonAIWidget />}
      {user?.role === 'student' && <StudyReminder />}
    </div>
  );
}
