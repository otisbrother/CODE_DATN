import { useState, useEffect } from 'react';
import { courseService } from '../../services/course.service';
import useAuthStore from '../../store/auth.store';
import { FiBook, FiUsers, FiDatabase } from 'react-icons/fi';

export default function LecturerDashboard() {
  const { user } = useAuthStore();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await courseService.getAll({ lecturer_id: user.id });
        setCourses(res.data.data || []);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [user.id]);

  if (loading) return <div className="loading">Đang tải...</div>;

  const published = courses.filter(c => c.status === 'published').length;
  const draft = courses.filter(c => c.status === 'draft').length;

  return (
    <div>
      <div className="page-header"><h1>Xin chào, {user?.full_name} 👋</h1></div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#eef2ff', color: '#4f46e5' }}><FiBook /></div>
          <div className="stat-info"><h3>{courses.length}</h3><p>Tổng khóa học</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}><FiUsers /></div>
          <div className="stat-info"><h3>{published}</h3><p>Đã xuất bản</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fffbeb', color: '#d97706' }}><FiDatabase /></div>
          <div className="stat-info"><h3>{draft}</h3><p>Bản nháp</p></div>
        </div>
      </div>

      <h2 style={{ fontSize: 18, marginBottom: 16 }}>Khóa học của tôi</h2>
      <div className="courses-grid">
        {courses.map((c) => (
          <div key={c.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
              <h3 style={{ fontSize: 16 }}>{c.title}</h3>
              <span className={`badge ${c.status === 'published' ? 'badge-success' : 'badge-warning'}`}>{c.status}</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{c.description?.substring(0, 80)}</p>
            <p style={{ color: 'var(--accent-secondary)', fontWeight: 700, marginTop: 8, fontSize: 14 }}>
              {Number(c.price).toLocaleString('vi-VN')}đ
            </p>
          </div>
        ))}
      </div>
      {courses.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>Bạn chưa tạo khóa học nào.</p>}
    </div>
  );
}
