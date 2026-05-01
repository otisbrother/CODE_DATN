import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { enrollmentService } from '../../services/enrollment.service';
import { courseService } from '../../services/course.service';
import useAuthStore from '../../store/auth.store';

const API_URL = 'http://localhost:5000';

export default function MyCoursesPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [tab, setTab] = useState('my');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [enrollingId, setEnrollingId] = useState(null);

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

  const handleEnroll = async (course) => {
    setEnrollingId(course.id);
    setMsg({ text: '', type: '' });
    try {
      const res = await enrollmentService.enroll({ course_id: course.id, payment_method: 'bank_transfer' });
      const data = res.data.data;

      if (data.status === 'active') {
        // Free course → enrolled immediately
        setMsg({ text: '🎉 Đăng ký khóa học miễn phí thành công!', type: 'success' });
        const enrRes = await enrollmentService.getMyEnrollments();
        setEnrollments(enrRes.data.data || []);
        setTab('my');
      } else {
        // Paid course → navigate to course detail page with payment modal
        navigate(`/student/course/${course.id}?openPayment=true`);
      }
    } catch (e) {
      setMsg({ text: e.response?.data?.message || 'Lỗi đăng ký', type: 'error' });
    }
    setEnrollingId(null);
  };

  if (loading) return <div className="loading">Đang tải...</div>;

  return (
    <div>
      <div className="page-header"><h1>Khóa học</h1></div>
      {msg.text && (
        <div className={`alert ${msg.type === 'success' ? 'alert-success' : 'alert-danger'}`}>{msg.text}</div>
      )}

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
            <div key={e.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              {/* Thumbnail */}
              {e.thumbnail_url ? (
                <img
                  src={`${API_URL}${e.thumbnail_url}`}
                  alt={e.course_title}
                  style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 8, marginBottom: 12 }}
                />
              ) : (
                <div style={{ width: '100%', height: 140, borderRadius: 8, marginBottom: 12, background: 'linear-gradient(135deg, #1e2243, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 48 }}>📚</span>
                </div>
              )}
              <h3 style={{ marginBottom: 8 }}>{e.course_title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 8, flex: 1 }}>
                {e.description?.substring(0, 100)}{e.description?.length > 100 ? '...' : ''}
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 4 }}>GV: {e.lecturer_name}</p>
              {e.access_status === 'active' ? (
                <span style={{ display: 'inline-block', background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, marginBottom: 12 }}>
                  ✅ Đã kích hoạt
                </span>
              ) : (
                <span style={{ display: 'inline-block', background: 'rgba(245,158,11,0.15)', color: '#f59e0b', padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, marginBottom: 12 }}>
                  ⏳ Chờ thanh toán
                </span>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                {e.access_status === 'active' ? (
                  <Link to={`/student/course/${e.course_id}`} className="btn btn-primary btn-sm" style={{ flex: 1, textAlign: 'center' }}>
                    ▶ Vào học
                  </Link>
                ) : (
                  <Link to={`/student/course/${e.course_id}?openPayment=true`} className="btn btn-primary btn-sm" style={{ flex: 1, textAlign: 'center', background: '#f59e0b', borderColor: '#f59e0b' }}>
                    💳 Thanh toán
                  </Link>
                )}
                <Link to={`/student/course/${e.course_id}`} className="btn btn-outline btn-sm" style={{ flex: 1, textAlign: 'center' }}>
                  📋 Xem chi tiết
                </Link>
              </div>
            </div>
          ))}
          {enrollments.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>Chưa đăng ký khóa học nào.</p>}
        </div>
      )}

      {tab === 'browse' && (
        <div className="courses-grid">
          {availableCourses.map((c) => (
            <div key={c.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              {/* Thumbnail */}
              {c.thumbnail_url ? (
                <img
                  src={`${API_URL}${c.thumbnail_url}`}
                  alt={c.title}
                  style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 8, marginBottom: 12 }}
                />
              ) : (
                <div style={{ width: '100%', height: 140, borderRadius: 8, marginBottom: 12, background: 'linear-gradient(135deg, #1e2243, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 48 }}>📚</span>
                </div>
              )}
              <h3 style={{ marginBottom: 8 }}>{c.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 8, flex: 1 }}>
                {c.description?.substring(0, 100)}{c.description?.length > 100 ? '...' : ''}
              </p>
              <p style={{ color: 'var(--accent-secondary)', fontWeight: 700, fontSize: 18, marginBottom: 4 }}>
                {Number(c.price) === 0 ? '🎁 Miễn phí' : `${Number(c.price).toLocaleString('vi-VN')}đ`}
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 12 }}>GV: {c.lecturer_name}</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                <button
                  className="btn btn-success btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => handleEnroll(c)}
                  disabled={enrollingId === c.id}
                >
                  {enrollingId === c.id ? 'Đang xử lý...' : Number(c.price) === 0 ? '🎁 Đăng ký miễn phí' : '💳 Đăng ký học'}
                </button>
                <Link to={`/student/course/${c.id}`} className="btn btn-outline btn-sm" style={{ flex: 1, textAlign: 'center' }}>
                  📋 Xem chi tiết
                </Link>
              </div>
            </div>
          ))}
          {availableCourses.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>Không có khóa học mới.</p>}
        </div>
      )}
    </div>
  );
}
