import { useState, useEffect } from 'react';
import { progressService } from '../../services/progress.service';

export default function MyProgressPage() {
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await progressService.getMyProgress();
        setProgress(res.data.data || []);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="loading">Đang tải...</div>;

  return (
    <div>
      <div className="page-header"><h1>Tiến độ học tập</h1></div>

      {progress.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>Chưa có dữ liệu tiến độ.</p>}

      <div className="courses-grid">
        {progress.map((p) => (
          <div key={p.id} className="card">
            <h3 style={{ marginBottom: 12 }}>{p.course_title}</h3>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                <span>Hoàn thành</span>
                <span style={{ fontWeight: 700, color: 'var(--accent-secondary)' }}>{p.completion_rate}%</span>
              </div>
              <div style={{ background: 'var(--bg-input)', borderRadius: 10, height: 10, overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(p.completion_rate, 100)}%`, height: '100%', background: 'var(--accent-gradient)', borderRadius: 10, transition: 'width 0.5s ease' }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-secondary)' }}>
              <span>Bài học: {p.completed_lessons}</span>
              <span>Bài tập: {p.completed_assignments}</span>
            </div>
            <div style={{ marginTop: 12 }}>
              <span className={`badge ${p.status === 'completed' ? 'badge-success' : 'badge-info'}`}>
                {p.status === 'completed' ? 'Hoàn thành' : 'Đang học'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
