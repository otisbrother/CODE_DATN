import { useState, useEffect } from 'react';
import { userService } from '../../services/user.service';
import { courseService } from '../../services/course.service';
import { aiService } from '../../services/ai.service';
import { FiUsers, FiBook, FiDatabase, FiCheckSquare } from 'react-icons/fi';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, courses: 0, pendingAI: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [uRes, cRes, aiRes] = await Promise.all([
          userService.getAll({ page: 1, limit: 1 }),
          courseService.getAll({ page: 1, limit: 1 }),
          aiService.getAllData('pending'),
        ]);
        setStats({
          users: uRes.data.pagination?.total || 0,
          courses: cRes.data.pagination?.total || 0,
          pendingAI: (aiRes.data.data || []).length,
        });
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="loading">Đang tải...</div>;

  return (
    <div>
      <div className="page-header"><h1>Tổng quan hệ thống</h1></div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#eef2ff', color: '#4f46e5' }}><FiUsers /></div>
          <div className="stat-info"><h3>{stats.users}</h3><p>Tổng người dùng</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}><FiBook /></div>
          <div className="stat-info"><h3>{stats.courses}</h3><p>Tổng khóa học</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fffbeb', color: '#d97706' }}><FiDatabase /></div>
          <div className="stat-info"><h3>{stats.pendingAI}</h3><p>Dữ liệu AI chờ duyệt</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#eff6ff', color: '#2563eb' }}><FiCheckSquare /></div>
          <div className="stat-info"><h3>3</h3><p>Vai trò (Admin / GV / HV)</p></div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 12 }}>📌 Hướng dẫn nhanh</h3>
        <ul style={{ color: 'var(--text-secondary)', paddingLeft: 20, lineHeight: 2 }}>
          <li><strong>Quản lý người dùng:</strong> Xem, chỉnh sửa, khóa tài khoản và phân quyền</li>
          <li><strong>Duyệt dữ liệu AI:</strong> Kiểm tra và phê duyệt/từ chối dữ liệu do giảng viên gửi</li>
          <li><strong>Giám sát:</strong> Theo dõi hoạt động tổng thể của hệ thống</li>
        </ul>
      </div>
    </div>
  );
}
