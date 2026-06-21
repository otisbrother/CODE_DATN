import { useState, useEffect } from 'react';
import { courseService } from '../../services/course.service';
import { reviewService } from '../../services/review.service';
import useAuthStore from '../../store/auth.store';
import { Link } from 'react-router-dom';
import { FiBook, FiUsers, FiDatabase } from 'react-icons/fi';

export default function LecturerDashboard() {
  const { user } = useAuthStore();
  const [courses, setCourses] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [res, fbRes] = await Promise.all([
          courseService.getAll({ lecturer_id: user.id }),
          reviewService.getFeedback().catch(() => ({ data: { data: [] } })),
        ]);
        setCourses(res.data.data || []);
        setFeedback(fbRes.data.data || []);
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

      {feedback.length > 0 && (
        <div className="card" style={{ marginBottom: 24, border: '1px solid #fecaca' }}>
          <h2 style={{ fontSize: 17, marginBottom: 4, color: '#b91c1c' }}>⚠️ Phản hồi cần cải thiện ({feedback.length})</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 12 }}>Đánh giá ≤ 2 sao từ học viên (không hiển thị công khai)</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {feedback.map((f) => (
              <div key={f.id} style={{ background: '#fef2f2', borderRadius: 10, padding: '10px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: 14 }}>{f.course_title}</strong>
                  <span style={{ color: '#f59e0b', fontWeight: 700 }}>{'★'.repeat(f.rating)}{'☆'.repeat(5 - f.rating)}</span>
                </div>
                <p style={{ margin: '6px 0', fontSize: 14, color: '#334155' }}>{f.comment}</p>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>— {f.student_name} · {new Date(f.created_at).toLocaleDateString('vi-VN')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

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
            <div style={{ marginTop: 14 }}>
              <Link to={`/lecturer/courses/${c.id}/progress`} className="btn btn-outline btn-sm">
                Theo dõi tiến độ
              </Link>
            </div>
          </div>
        ))}
      </div>
      {courses.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>Bạn chưa tạo khóa học nào.</p>}
    </div>
  );
}
