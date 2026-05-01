import { useState, useEffect } from 'react';
import axiosClient from '../../services/axiosClient';
import { FiUsers, FiBook, FiDatabase, FiCheckSquare, FiDollarSign, FiFileText, FiLayers, FiBarChart2 } from 'react-icons/fi';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axiosClient.get('/admin/stats');
        setStats(res.data.data);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="loading">Đang tải...</div>;
  if (!stats) return <div className="loading">Lỗi tải dữ liệu</div>;

  const totalUsers = stats.usersByRole.reduce((s, r) => s + r.count, 0);
  const totalCourses = stats.coursesByStatus.reduce((s, c) => s + c.count, 0);
  const getUserCount = (role) => stats.usersByRole.find(r => r.role_name === role)?.count || 0;

  return (
    <div>
      <div className="page-header"><h1>Tổng quan hệ thống</h1></div>

      {/* Stat cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#eef2ff', color: '#4f46e5' }}><FiUsers /></div>
          <div className="stat-info"><h3>{totalUsers}</h3><p>Tổng người dùng</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}><FiBook /></div>
          <div className="stat-info"><h3>{totalCourses}</h3><p>Tổng khóa học</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fef3c7', color: '#d97706' }}><FiCheckSquare /></div>
          <div className="stat-info"><h3>{stats.totalEnrollments}</h3><p>Lượt đăng ký</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fce7f3', color: '#db2777' }}><FiDollarSign /></div>
          <div className="stat-info"><h3>{Number(stats.totalRevenue).toLocaleString('vi-VN')}đ</h3><p>Tổng doanh thu</p></div>
        </div>
      </div>

      <div className="stats-grid" style={{ marginTop: 16 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#eff6ff', color: '#2563eb' }}><FiLayers /></div>
          <div className="stat-info"><h3>{stats.totalLessons}</h3><p>Tổng bài học</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#faf5ff', color: '#7c3aed' }}><FiFileText /></div>
          <div className="stat-info"><h3>{stats.totalAssignments}</h3><p>Tổng bài tập</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f0fdf4', color: '#16a34a' }}><FiBarChart2 /></div>
          <div className="stat-info"><h3>{stats.gradedSubmissions}/{stats.totalSubmissions}</h3><p>Bài nộp (đã chấm/tổng)</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fff7ed', color: '#ea580c' }}><FiDatabase /></div>
          <div className="stat-info"><h3>{stats.pendingAI}</h3><p>AI chờ duyệt</p></div>
        </div>
      </div>

      {/* Users breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 24 }}>
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>👥 Người dùng theo vai trò</h3>
          {stats.usersByRole.map((r) => (
            <div key={r.role_name} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
              <span>{r.role_name === 'admin' ? 'Admin' : r.role_name === 'lecturer' ? 'Giảng viên' : 'Học viên'}</span>
              <strong>{r.count}</strong>
            </div>
          ))}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 16 }}>📚 Khóa học theo trạng thái</h3>
          {stats.coursesByStatus.map((c) => (
            <div key={c.status} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
              <span>
                <span className={`badge ${c.status === 'published' ? 'badge-success' : c.status === 'draft' ? 'badge-warning' : 'badge-secondary'}`}>
                  {c.status === 'published' ? 'Xuất bản' : c.status === 'draft' ? 'Nháp' : 'Lưu trữ'}
                </span>
              </span>
              <strong>{c.count}</strong>
            </div>
          ))}
        </div>
      </div>

      {/* Top courses + Recent enrollments */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 24 }}>
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>🏆 Top khóa học (theo lượt đăng ký)</h3>
          <div className="table-container" style={{ margin: 0 }}>
            <table>
              <thead><tr><th>Khóa học</th><th>GV</th><th>Đăng ký</th></tr></thead>
              <tbody>
                {stats.topCourses.map((c) => (
                  <tr key={c.id}>
                    <td><strong>{c.title}</strong></td>
                    <td style={{ fontSize: 13 }}>{c.lecturer_name}</td>
                    <td><span className="badge badge-primary">{c.enrollment_count}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {stats.topCourses.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>Chưa có dữ liệu.</p>}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 16 }}>🕐 Đăng ký gần đây</h3>
          <div className="table-container" style={{ margin: 0 }}>
            <table>
              <thead><tr><th>Sinh viên</th><th>Khóa học</th><th>Ngày</th></tr></thead>
              <tbody>
                {stats.recentEnrollments.map((e) => (
                  <tr key={e.id}>
                    <td><strong>{e.student_name}</strong></td>
                    <td style={{ fontSize: 13 }}>{e.course_title}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(e.enrolled_at).toLocaleDateString('vi-VN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {stats.recentEnrollments.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>Chưa có đăng ký.</p>}
        </div>
      </div>
    </div>
  );
}
