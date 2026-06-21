import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { lecturerService } from '../../services/lecturer.service';
import useAuthStore from '../../store/auth.store';
import './LecturerProfilePage.css';

export default function LecturerProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  // Khach chua dang nhap -> nho khoa hoc roi ve trang chu de dang nhap (giong HomePage)
  const goToCourse = (courseId) => {
    if (isAuthenticated) {
      navigate(`/student/course/${courseId}`);
    } else {
      localStorage.setItem('pendingCourseId', String(courseId));
      navigate('/');
    }
  };
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    lecturerService.getById(id)
      .then(res => { if (active) setData(res.data.data); })
      .catch(e => { if (active) setError(e.response?.data?.message || 'Không tìm thấy giáo viên'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  if (loading) return <div className="lp-loading">Đang tải hồ sơ giáo viên...</div>;
  if (error || !data) {
    return (
      <div className="lp-empty">
        <span style={{ fontSize: 52 }}>🔍</span>
        <p>{error || 'Không tìm thấy giáo viên'}</p>
        <Link to="/" className="btn btn-primary">Về trang chủ</Link>
      </div>
    );
  }

  const initials = data.full_name?.trim()?.[0]?.toUpperCase() || 'GV';

  return (
    <div className="lp-page">
      {/* HERO */}
      <div className="lp-hero">
        <button className="lp-back" onClick={() => navigate(-1)}>← Quay lại</button>
        <div className="lp-hero-inner">
          <div className="lp-avatar">
            {data.avatar_url ? <img src={data.avatar_url} alt={data.full_name} /> : <span>{initials}</span>}
          </div>
          <div className="lp-hero-info">
            <span className="lp-role">🔥 NGƯỜI TRUYỀN LỬA</span>
            <h1>{data.full_name}</h1>
            <p className="lp-headline">{data.headline || 'Giáo viên E-Learning AI'}</p>
            <div className="lp-stats">
              <div className="lp-stat"><strong>{data.course_count}</strong><span>Khóa học</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="lp-body">
        {/* Giới thiệu */}
        {data.bio && (
          <section className="lp-section">
            <h2>Giới thiệu</h2>
            <p className="lp-bio">{data.bio}</p>
          </section>
        )}

        {/* Khóa học */}
        <section className="lp-section">
          <h2>Khóa học của giáo viên ({data.course_count})</h2>
          {data.courses.length > 0 ? (
            <div className="lp-course-grid">
              {data.courses.map(c => (
                <div key={c.id} className="lp-course-card" onClick={() => goToCourse(c.id)}>
                  <div className="lp-course-thumb">
                    {c.thumbnail_url
                      ? <img src={c.thumbnail_url} alt={c.title} />
                      : <div className="lp-course-thumb--ph">📚</div>}
                    <span className="lp-course-price">
                      {Number(c.price) === 0 ? '🎁 Miễn phí' : `${Number(c.price).toLocaleString('vi-VN')}đ`}
                    </span>
                  </div>
                  <div className="lp-course-body">
                    <h3>{c.title}</h3>
                    <p>{(c.short_description || c.description || 'Chưa có mô tả.').slice(0, 90)}</p>
                    <span className="lp-course-action">Xem thông tin khóa học →</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="lp-no-course">Giáo viên chưa có khóa học nào đang mở.</p>
          )}
        </section>
      </div>
    </div>
  );
}
