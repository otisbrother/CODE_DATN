import { useState, useEffect } from 'react';
import { enrollmentService } from '../../services/enrollment.service';
import { progressService } from '../../services/progress.service';
import { assignmentService } from '../../services/assignment.service';
import useAuthStore from '../../store/auth.store';
import { FiBook, FiCheckCircle, FiBarChart2, FiFileText } from 'react-icons/fi';

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const [enrollments, setEnrollments] = useState([]);
  const [progress, setProgress] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [enrRes, progRes, subRes] = await Promise.all([
          enrollmentService.getMyEnrollments(),
          progressService.getMyProgress(),
          assignmentService.getMySubmissions(),
        ]);
        setEnrollments(enrRes.data.data || []);
        setProgress(progRes.data.data || []);
        setSubmissions(subRes.data.data || []);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="loading">Đang tải...</div>;

  const completedCourses = progress.filter(p => p.status === 'completed').length;
  const avgRate = progress.length > 0 ? (progress.reduce((s, p) => s + Number(p.completion_rate), 0) / progress.length).toFixed(1) : 0;

  return (
    <div>
      <div className="page-header">
        <h1>Xin chào, {user?.full_name} 👋</h1>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#eef2ff', color: '#4f46e5' }}><FiBook /></div>
          <div className="stat-info"><h3>{enrollments.length}</h3><p>Khóa học đã đăng ký</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}><FiCheckCircle /></div>
          <div className="stat-info"><h3>{completedCourses}</h3><p>Khóa học hoàn thành</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#eff6ff', color: '#2563eb' }}><FiBarChart2 /></div>
          <div className="stat-info"><h3>{avgRate}%</h3><p>Tiến độ trung bình</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fffbeb', color: '#d97706' }}><FiFileText /></div>
          <div className="stat-info"><h3>{submissions.length}</h3><p>Bài đã nộp</p></div>
        </div>
      </div>

      <h2 style={{ marginBottom: 16, fontSize: 18 }}>Khóa học gần đây</h2>
      <div className="courses-grid">
        {enrollments.slice(0, 6).map((e) => (
          <div key={e.id} className="card">
            <h3 style={{ marginBottom: 8 }}>{e.course_title}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 12 }}>{e.description?.substring(0, 80)}...</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="badge badge-success">{e.access_status}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>GV: {e.lecturer_name}</span>
            </div>
          </div>
        ))}
      </div>
      {enrollments.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>Bạn chưa đăng ký khóa học nào.</p>}
    </div>
  );
}
