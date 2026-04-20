import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { enrollmentService } from '../../services/enrollment.service';
import { courseService } from '../../services/course.service';
import useAuthStore from '../../store/auth.store';

export default function MyCoursesPage() {
  const { user } = useAuthStore();
  const [enrollments, setEnrollments] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [tab, setTab] = useState('my');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [enrRes, courseRes] = await Promise.all([
          enrollmentService.getMyEnrollments(),
          courseService.getAll({ status: 'published' }),
        ]);
        setEnrollments(enrRes.data.data || []);
        setAllCourses(courseRes.data.data || []);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  const enrolledIds = enrollments.map(e => e.course_id);
  const availableCourses = allCourses.filter(c => !enrolledIds.includes(c.id));

  const handleEnroll = async (courseId) => {
    try {
      await enrollmentService.enroll({ course_id: courseId, payment_method: 'bank_transfer' });
      setMsg('Đăng ký khóa học thành công!');
      const enrRes = await enrollmentService.getMyEnrollments();
      setEnrollments(enrRes.data.data || []);
    } catch (e) {
      setMsg(e.response?.data?.message || 'Lỗi đăng ký');
    }
  };

  if (loading) return <div className="loading">Đang tải...</div>;

  return (
    <div>
      <div className="page-header"><h1>Khóa học</h1></div>
      {msg && <div className="alert alert-success">{msg}</div>}

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button className={`btn ${tab === 'my' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('my')}>
          Khóa học của tôi ({enrollments.length})
        </button>
        <button className={`btn ${tab === 'browse' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('browse')}>
          Khám phá ({availableCourses.length})
        </button>
      </div>

      {tab === 'my' && (
        <div className="courses-grid">
          {enrollments.map((e) => (
            <div key={e.id} className="card">
              <h3 style={{ marginBottom: 8 }}>{e.course_title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 12 }}>{e.description?.substring(0, 100)}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 12 }}>GV: {e.lecturer_name}</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <Link to={`/student/course/${e.course_id}`} className="btn btn-primary btn-sm">Vào học</Link>
              </div>
            </div>
          ))}
          {enrollments.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>Chưa đăng ký khóa học nào.</p>}
        </div>
      )}

      {tab === 'browse' && (
        <div className="courses-grid">
          {availableCourses.map((c) => (
            <div key={c.id} className="card">
              <h3 style={{ marginBottom: 8 }}>{c.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 8 }}>{c.description?.substring(0, 100)}</p>
              <p style={{ color: 'var(--accent-secondary)', fontWeight: 700, marginBottom: 8 }}>
                {Number(c.price).toLocaleString('vi-VN')}đ
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 12 }}>GV: {c.lecturer_name}</p>
              <button className="btn btn-success btn-sm" onClick={() => handleEnroll(c.id)}>Đăng ký học</button>
            </div>
          ))}
          {availableCourses.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>Không có khóa học mới.</p>}
        </div>
      )}
    </div>
  );
}
