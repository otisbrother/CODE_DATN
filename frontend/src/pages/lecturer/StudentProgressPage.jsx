import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { progressService } from '../../services/progress.service';
import { courseService } from '../../services/course.service';

export default function StudentProgressPage() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [cRes, pRes] = await Promise.all([
          courseService.getById(courseId),
          progressService.getCourseProgress(courseId),
        ]);
        setCourse(cRes.data.data);
        setProgress(pRes.data.data || []);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [courseId]);

  if (loading) return <div className="loading">Đang tải...</div>;

  const avgRate = progress.length > 0
    ? (progress.reduce((s, p) => s + Number(p.completion_rate), 0) / progress.length).toFixed(1)
    : 0;
  const completedCount = progress.filter(p => p.status === 'completed').length;

  return (
    <div>
      <div className="page-header">
        <h1>Tiến độ sinh viên — {course?.title}</h1>
        <Link to="/lecturer/courses" className="btn btn-outline btn-sm">← Quay lại</Link>
      </div>

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#eef2ff', color: '#4f46e5' }}>👥</div>
          <div className="stat-info"><h3>{progress.length}</h3><p>Tổng sinh viên</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}>✅</div>
          <div className="stat-info"><h3>{completedCount}</h3><p>Hoàn thành</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fffbeb', color: '#d97706' }}>📊</div>
          <div className="stat-info"><h3>{avgRate}%</h3><p>Tiến độ trung bình</p></div>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr><th>Sinh viên</th><th>Bài học</th><th>Bài tập</th><th>Tiến độ</th><th>Trạng thái</th></tr>
          </thead>
          <tbody>
            {progress.map((p) => (
              <tr key={p.id}>
                <td><strong>{p.student_name}</strong></td>
                <td>{p.completed_lessons} bài</td>
                <td>{p.completed_assignments} bài</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, background: 'var(--bg-input)', borderRadius: 10, height: 8, overflow: 'hidden', minWidth: 80 }}>
                      <div style={{ width: `${Math.min(p.completion_rate, 100)}%`, height: '100%', background: Number(p.completion_rate) >= 100 ? '#059669' : '#4f46e5', borderRadius: 10, transition: 'width 0.5s ease' }} />
                    </div>
                    <span style={{ fontWeight: 700, fontSize: 13, color: Number(p.completion_rate) >= 100 ? '#059669' : '#4f46e5', minWidth: 40 }}>{p.completion_rate}%</span>
                  </div>
                </td>
                <td>
                  <span className={`badge ${p.status === 'completed' ? 'badge-success' : 'badge-info'}`}>
                    {p.status === 'completed' ? 'Hoàn thành' : 'Đang học'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {progress.length === 0 && <p style={{ color: 'var(--text-secondary)', marginTop: 20 }}>Chưa có sinh viên nào đăng ký khóa học này.</p>}
    </div>
  );
}
