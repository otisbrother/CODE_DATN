import { useState, useEffect } from 'react';
import { progressService } from '../../services/progress.service';
import { FiSearch, FiX } from 'react-icons/fi';

export default function AdminProgressPage() {
  const [allProgress, setAllProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await progressService.getAll();
        setAllProgress(res.data.data || []);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  // Get unique courses for filter
  const courses = [...new Map(allProgress.map(p => [p.course_id, { id: p.course_id, title: p.course_title }])).values()];

  // Apply filters
  let filtered = allProgress;
  if (search.trim()) {
    const s = search.toLowerCase();
    filtered = filtered.filter(p => p.student_name.toLowerCase().includes(s) || p.student_email.toLowerCase().includes(s));
  }
  if (courseFilter) {
    filtered = filtered.filter(p => p.course_id === Number(courseFilter));
  }

  // Stats
  const totalStudents = new Set(filtered.map(p => p.student_id)).size;
  const avgRate = filtered.length > 0
    ? (filtered.reduce((s, p) => s + Number(p.completion_rate), 0) / filtered.length).toFixed(1)
    : 0;
  const completedCount = filtered.filter(p => p.status === 'completed').length;

  if (loading) return <div className="loading">Đang tải...</div>;

  return (
    <div>
      <div className="page-header"><h1>Tiến độ học tập toàn hệ thống</h1></div>

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#eef2ff', color: '#4f46e5' }}>👥</div>
          <div className="stat-info"><h3>{totalStudents}</h3><p>Sinh viên</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}>✅</div>
          <div className="stat-info"><h3>{completedCount}</h3><p>Hoàn thành</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fffbeb', color: '#d97706' }}>📊</div>
          <div className="stat-info"><h3>{avgRate}%</h3><p>Tiến độ TB</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>📚</div>
          <div className="stat-info"><h3>{courses.length}</h3><p>Khóa học</p></div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'end' }}>
        <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
          <label>Tìm sinh viên</label>
          <div style={{ position: 'relative' }}>
            <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="form-control" style={{ paddingLeft: 36 }} placeholder="Tìm theo tên hoặc email..."
              value={search} onChange={(e) => setSearch(e.target.value)} />
            {search && <button type="button" onClick={() => setSearch('')}
              style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><FiX size={16} /></button>}
          </div>
        </div>
        <div className="form-group" style={{ width: 250, marginBottom: 0 }}>
          <label>Khóa học</label>
          <select className="form-control" value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)}>
            <option value="">Tất cả khóa học</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead><tr><th>Sinh viên</th><th>Email</th><th>Khóa học</th><th>Bài học</th><th>Bài tập</th><th>Tiến độ</th><th>Trạng thái</th></tr></thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <td><strong>{p.student_name}</strong></td>
                <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{p.student_email}</td>
                <td>{p.course_title}</td>
                <td>{p.completed_lessons}</td>
                <td>{p.completed_assignments}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, background: 'var(--bg-input)', borderRadius: 10, height: 8, overflow: 'hidden', minWidth: 60 }}>
                      <div style={{ width: `${Math.min(p.completion_rate, 100)}%`, height: '100%', background: Number(p.completion_rate) >= 100 ? '#059669' : '#4f46e5', borderRadius: 10 }} />
                    </div>
                    <span style={{ fontWeight: 700, fontSize: 12, minWidth: 36 }}>{p.completion_rate}%</span>
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
      {filtered.length === 0 && <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 40 }}>Không có dữ liệu tiến độ.</p>}
    </div>
  );
}
