import { useState, useEffect } from 'react';
import axiosClient from '../../services/axiosClient';
import { FiUsers, FiBook, FiCheckSquare, FiDollarSign, FiLayers, FiFileText, FiBarChart2, FiMessageSquare, FiCalendar } from 'react-icons/fi';
import { BarChart, DonutChart } from '../../components/charts/MiniChart';
import { COLORS } from '../../components/charts/chartConstants';
import { reviewService } from '../../services/review.service';
import './AdminDashboard.css';

const fmtVnd = (v) => Number(v || 0).toLocaleString('vi-VN') + 'đ';
const roleName = (r) => r === 'admin' ? 'Admin' : r === 'lecturer' ? 'Giáo viên' : 'Học viên';
const statusLabel = (s) => s === 'published' ? 'Xuất bản' : s === 'draft' ? 'Nháp' : 'Lưu trữ';

/* Fill missing months with 0 for last 6 months */
function fillMonths(data, key = 'count') {
  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    // Tao khoa 'YYYY-MM' theo gio dia phuong (KHONG dung toISOString -> tranh lech mui gio)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    months.push(key);
  }
  return months.map(m => {
    const found = data.find(d => d.month === m);
    return { month: m, [key]: found ? Number(found[key]) : 0 };
  });
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reviewService.getFeedback()
      .then(res => setFeedback(res.data.data || []))
      .catch(() => setFeedback([]));
    axiosClient.get('/admin/stats')
      .then(res => setStats(res.data.data))
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Đang tải thống kê...</div>;
  if (!stats) return <div className="loading">Lỗi tải dữ liệu</div>;

  const totalUsers = stats.usersByRole.reduce((s, r) => s + r.count, 0);
  const totalCourses = stats.coursesByStatus.reduce((s, c) => s + c.count, 0);
  const getUserCount = (role) => stats.usersByRole.find(r => r.role_name === role)?.count || 0;

  /* Chart data */
  const revenueData = fillMonths(stats.monthlyRevenue || [], 'revenue');
  const enrollData = fillMonths(stats.monthlyEnrollments || [], 'count');
  const userSegments = stats.usersByRole.map((r, i) => ({
    label: roleName(r.role_name), value: r.count, color: COLORS[i],
  }));

  const today = new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div>
      {/* Header */}
      <div className="admin-dash-header">
        <div>
          <h1>📊 Tổng quan hệ thống</h1>
          <p>Bảng điều khiển quản trị viên</p>
        </div>
        <div className="admin-dash-date"><FiCalendar /> {today}</div>
      </div>

      {/* KPI cards */}
      <div className="kpi-strip">
        <div className="kpi-card kpi-users">
          <div className="kpi-icon" style={{ background: '#eef2ff', color: '#4f46e5' }}><FiUsers /></div>
          <div className="kpi-body">
            <h3>{totalUsers}</h3>
            <p>Tổng người dùng</p>
            <span className="kpi-sub">{getUserCount('student')} SV • {getUserCount('lecturer')} GV • {getUserCount('admin')} Admin</span>
          </div>
        </div>
        <div className="kpi-card kpi-courses">
          <div className="kpi-icon" style={{ background: '#ecfdf5', color: '#059669' }}><FiBook /></div>
          <div className="kpi-body">
            <h3>{totalCourses}</h3>
            <p>Khóa học</p>
            <span className="kpi-sub">{stats.coursesByStatus.map(c => `${c.count} ${statusLabel(c.status)}`).join(' • ')}</span>
          </div>
        </div>
        <div className="kpi-card kpi-enroll">
          <div className="kpi-icon" style={{ background: '#fef3c7', color: '#d97706' }}><FiCheckSquare /></div>
          <div className="kpi-body">
            <h3>{stats.totalEnrollments}</h3>
            <p>Lượt ghi danh</p>
            <span className="kpi-sub">Hoàn thành TB: {stats.avgCompletionRate || 0}%</span>
          </div>
        </div>
        <div className="kpi-card kpi-revenue">
          <div className="kpi-icon" style={{ background: '#fce7f3', color: '#db2777' }}><FiDollarSign /></div>
          <div className="kpi-body">
            <h3>{fmtVnd(stats.totalRevenue)}</h3>
            <p>Tổng doanh thu</p>
          </div>
        </div>
      </div>

      {/* Secondary KPI */}
      <div className="kpi-strip-sm">
        <div className="kpi-sm">
          <div className="kpi-sm-icon" style={{ background: '#eff6ff', color: '#2563eb' }}><FiLayers /></div>
          <div><h4>{stats.totalLessons}</h4><p>Bài học</p></div>
        </div>
        <div className="kpi-sm">
          <div className="kpi-sm-icon" style={{ background: '#faf5ff', color: '#7c3aed' }}><FiFileText /></div>
          <div><h4>{stats.totalAssignments}</h4><p>Bài tập</p></div>
        </div>
        <div className="kpi-sm">
          <div className="kpi-sm-icon" style={{ background: '#f0fdf4', color: '#16a34a' }}><FiBarChart2 /></div>
          <div><h4>{stats.gradedSubmissions}/{stats.totalSubmissions}</h4><p>Bài nộp (đã chấm)</p></div>
        </div>
        <div className="kpi-sm">
          <div className="kpi-sm-icon" style={{ background: '#ecfeff', color: '#0891b2' }}><FiMessageSquare /></div>
          <div><h4>{stats.totalAiMessages || 0}</h4><p>Tin nhắn AI ({stats.totalConversations || 0} hội thoại)</p></div>
        </div>
      </div>

      {/* ===== 3 CHARTS ===== */}
      <div className="chart-grid">
        {/* Chart 1: Doanh thu theo tháng */}
        <div className="chart-card">
          <h3><FiDollarSign /> Doanh thu theo tháng</h3>
          <p className="chart-subtitle">6 tháng gần nhất (VNĐ)</p>
          <div className="chart-canvas-wrap">
            <BarChart data={revenueData} labelKey="month" valueKey="revenue" color="#db2777" unit="đ" />
          </div>
        </div>

        {/* Chart 2: Ghi danh theo tháng */}
        <div className="chart-card">
          <h3><FiCheckSquare /> Ghi danh theo tháng</h3>
          <p className="chart-subtitle">6 tháng gần nhất</p>
          <div className="chart-canvas-wrap">
            <BarChart data={enrollData} labelKey="month" valueKey="count" color="#4f46e5" />
          </div>
        </div>

        {/* Chart 3: Phân bổ người dùng */}
        <div className="chart-card">
          <h3><FiUsers /> Phân bổ người dùng</h3>
          <p className="chart-subtitle">Theo vai trò trong hệ thống</p>
          <div className="chart-canvas-wrap chart-sm" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <DonutChart segments={userSegments} size={180} />
              <div className="donut-center"><strong>{totalUsers}</strong><span>Tổng</span></div>
            </div>
          </div>
          <div className="chart-legend" style={{ justifyContent: 'center' }}>
            {userSegments.map((s, i) => (
              <div key={i} className="chart-legend-item">
                <div className="chart-legend-dot" style={{ background: s.color }} /> {s.label}: {s.value}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== TABLES ===== */}
      <div className="tables-grid">
        <div className="dash-table-card">
          <h3>🏆 Top khóa học (lượt đăng ký)</h3>
          <div className="table-container">
            <table>
              <thead><tr><th>Khóa học</th><th>Giáo viên</th><th>Đăng ký</th></tr></thead>
              <tbody>
                {stats.topCourses.map(c => (
                  <tr key={c.id}>
                    <td><strong>{c.title}</strong></td>
                    <td style={{ fontSize: 13 }}>{c.lecturer_name}</td>
                    <td><span className="badge badge-primary">{c.enrollment_count}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {stats.topCourses.length === 0 && <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>Chưa có dữ liệu.</p>}
        </div>

        <div className="dash-table-card">
          <h3>🕐 Đăng ký gần đây</h3>
          <div className="table-container">
            <table>
              <thead><tr><th>Sinh viên</th><th>Khóa học</th><th>Ngày</th></tr></thead>
              <tbody>
                {stats.recentEnrollments.map(e => (
                  <tr key={e.id}>
                    <td><strong>{e.student_name}</strong></td>
                    <td style={{ fontSize: 13 }}>{e.course_title}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(e.enrolled_at).toLocaleDateString('vi-VN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {stats.recentEnrollments.length === 0 && <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>Chưa có đăng ký.</p>}
        </div>
      </div>

      {feedback.length > 0 && (
        <div className="dash-table-card" style={{ marginTop: 20, border: '1px solid #fecaca' }}>
          <h3 style={{ color: '#b91c1c' }}>⚠️ Phản hồi cần cải thiện (≤ 2★) — {feedback.length}</h3>
          <div className="table-container">
            <table>
              <thead><tr><th>Khóa học</th><th>Sao</th><th>Lý do</th><th>Sinh viên</th><th>Ngày</th></tr></thead>
              <tbody>
                {feedback.map((f) => (
                  <tr key={f.id}>
                    <td><strong>{f.course_title}</strong></td>
                    <td style={{ color: '#f59e0b', whiteSpace: 'nowrap' }}>{'★'.repeat(f.rating)}{'☆'.repeat(5 - f.rating)}</td>
                    <td style={{ fontSize: 13 }}>{f.comment}</td>
                    <td style={{ fontSize: 13 }}>{f.student_name}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(f.created_at).toLocaleDateString('vi-VN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
