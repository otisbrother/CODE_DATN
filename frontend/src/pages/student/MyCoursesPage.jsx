import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiSearch, FiUser, FiClock, FiPlayCircle, FiFileText, FiCreditCard } from 'react-icons/fi';
import { enrollmentService } from '../../services/enrollment.service';
import { courseService } from '../../services/course.service';
import './MyCoursesPage.css';

const API_URL = '';

/* ========== SEARCH HELPER ========== */
// Bo dau tieng Viet + lowercase de tim kiem khong phan biet dau
const normalizeText = (text) =>
  String(text || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .trim();

/* ========== COUNTDOWN HELPER ========== */
const getTimeRemaining = (expiresAt) => {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 };
  return {
    expired: false,
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    totalMs: diff,
  };
};

function CountdownBadge({ expiresAt, durationDays, isPreserved, preservedAt }) {
  const [time, setTime] = useState(() => getTimeRemaining(expiresAt));

  useEffect(() => {
    if (!expiresAt || isPreserved) return;
    const timer = setInterval(() => setTime(getTimeRemaining(expiresAt)), 1000);
    return () => clearInterval(timer);
  }, [expiresAt, isPreserved]);

  const chip = (bg, color, content) => (
    <span style={{ display: 'inline-block', background: bg, color, padding: '4px 12px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
      {content}
    </span>
  );

  if (isPreserved) {
    return (
      <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 2 }}>
        {chip('rgba(139,92,246,0.12)', '#8b5cf6', '⏸️ Đang bảo lưu')}
        {preservedAt && (
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
            Từ: {new Date(preservedAt).toLocaleDateString('vi-VN')}
          </span>
        )}
      </div>
    );
  }

  if (!durationDays || !expiresAt) return chip('rgba(139,92,246,0.12)', '#8b5cf6', '♾️ Vĩnh viễn');
  if (!time || time.expired) return chip('rgba(239,68,68,0.12)', '#ef4444', '⛔ Đã hết hạn');

  const isUrgent = time.days <= 1;
  const isWarning = time.days <= 7;
  const bgColor = isUrgent ? 'rgba(239,68,68,0.12)' : isWarning ? 'rgba(245,158,11,0.12)' : 'rgba(16,185,129,0.12)';
  const textColor = isUrgent ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981';
  const icon = isUrgent ? '🔴' : isWarning ? '🟡' : '⏰';

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 2 }}>
      {chip(bgColor, textColor, `${icon} Còn ${time.days > 0 ? `${time.days} ngày ` : ''}${String(time.hours).padStart(2, '0')}:${String(time.minutes).padStart(2, '0')}:${String(time.seconds).padStart(2, '0')}`)}
      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
        Hết hạn: {new Date(expiresAt).toLocaleDateString('vi-VN')} {new Date(expiresAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  );
}

/* ========== THUMBNAIL ========== */
function Thumbnail({ url, alt, children }) {
  return (
    <div className="course-thumb">
      {url
        ? <img src={`${API_URL}${url}`} alt={alt} />
        : <div className="course-thumb--placeholder">📚</div>}
      {children}
    </div>
  );
}

/* ========== ENROLLED COURSE CARD ========== */
function EnrollmentCard({ enrollment: e }) {
  const isActive = e.access_status === 'active';
  return (
    <div className="course-card">
      <Thumbnail url={e.thumbnail_url} alt={e.course_title}>
        <span className={`course-status ${isActive ? 'course-status--active' : 'course-status--pending'}`}>
          {isActive ? '✅ Đã kích hoạt' : '⏳ Chờ thanh toán'}
        </span>
      </Thumbnail>
      <div className="course-body">
        <h3 className="course-title">{e.course_title}</h3>
        <p className="course-desc">{e.description || 'Chưa có mô tả cho khóa học này.'}</p>
        <div className="course-meta">
          <span className="course-meta-lecturer"><FiUser size={13} /> {e.lecturer_name}</span>
        </div>
        {isActive && (
          <div className="course-countdown">
            <CountdownBadge expiresAt={e.expires_at} durationDays={e.duration_days} isPreserved={e.is_preserved} preservedAt={e.preserved_at} />
          </div>
        )}
        <div className="course-footer">
          {isActive ? (
            <Link to={`/student/course/${e.course_id}`} className="btn btn-primary btn-sm">
              <FiPlayCircle size={14} /> Vào học
            </Link>
          ) : (
            <Link to={`/student/course/${e.course_id}?openPayment=true`} className="btn btn-success btn-sm">
              <FiCreditCard size={14} /> Thanh toán
            </Link>
          )}
          {/* Khóa đã kích hoạt thì vào học thẳng, không cần nút xem thông tin */}
          {!isActive && (
            <Link to={`/student/course/${e.course_id}`} className="btn btn-outline btn-sm">
              <FiFileText size={14} /> Xem thông tin khóa học
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

/* ========== CATALOG (BROWSE) COURSE CARD ========== */
function CatalogCard({ course: c, enrolling, onEnroll }) {
  const isFree = Number(c.price) === 0;
  return (
    <div className="course-card">
      <Thumbnail url={c.thumbnail_url} alt={c.title}>
        <span className={`course-price-tag ${isFree ? 'course-price-tag--free' : ''}`}>
          {isFree ? '🎁 Miễn phí' : `${Number(c.price).toLocaleString('vi-VN')}đ`}
        </span>
      </Thumbnail>
      <div className="course-body">
        <h3 className="course-title">{c.title}</h3>
        <p className="course-desc">{c.description || 'Chưa có mô tả cho khóa học này.'}</p>
        <div className="course-meta">
          <span className="course-meta-lecturer"><FiUser size={13} /> {c.lecturer_name}</span>
          {c.duration_days
            ? <span className="course-pill course-pill--duration"><FiClock size={11} /> {c.duration_days} ngày</span>
            : <span className="course-pill course-pill--forever">♾️ Vĩnh viễn</span>}
        </div>
        <div className="course-footer">
          <button className="btn btn-success btn-sm" onClick={() => onEnroll(c)} disabled={enrolling}>
            {enrolling ? 'Đang xử lý...' : isFree ? '🎁 Đăng ký' : '💳 Đăng ký học'}
          </button>
          <Link to={`/student/course/${c.id}`} className="btn btn-outline btn-sm">
            <FiFileText size={14} /> Xem thông tin khóa học
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ========== EMPTY STATE ========== */
function EmptyState({ icon, text }) {
  return (
    <div className="courses-empty">
      <span className="empty-icon">{icon}</span>
      <p>{text}</p>
    </div>
  );
}

export default function MyCoursesPage() {
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [tab, setTab] = useState('my');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [enrollingId, setEnrollingId] = useState(null);
  const [search, setSearch] = useState('');

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

  // Loc theo tu khoa tim kiem (khong phan biet dau) tren ten/mo ta/giang vien
  const matchesSearch = (...fields) => {
    const q = normalizeText(search);
    if (!q) return true;
    return fields.some(f => normalizeText(f).includes(q));
  };

  const allAvailable = allCourses.filter(c => !enrolledIds.includes(c.id));
  const availableCourses = allAvailable.filter(c => matchesSearch(c.title, c.description, c.lecturer_name));
  const pendingEnrollments = enrollments
    .filter(e => e.access_status !== 'active')
    .filter(e => matchesSearch(e.course_title, e.description, e.lecturer_name));
  const activeEnrollments = enrollments
    .filter(e => e.access_status === 'active')
    .filter(e => matchesSearch(e.course_title, e.description, e.lecturer_name));

  const handleEnroll = async (course) => {
    setEnrollingId(course.id);
    setMsg({ text: '', type: '' });
    try {
      const res = await enrollmentService.enroll({ course_id: course.id, payment_method: 'bank_transfer' });
      const data = res.data.data;
      if (data.status === 'active') {
        setMsg({ text: '🎉 Đăng ký khóa học miễn phí thành công!', type: 'success' });
        const enrRes = await enrollmentService.getMyEnrollments();
        setEnrollments(enrRes.data.data || []);
        setTab('my');
      } else {
        navigate(`/student/course/${course.id}?openPayment=true`);
      }
    } catch (e) {
      setMsg({ text: e.response?.data?.message || 'Lỗi đăng ký', type: 'error' });
    }
    setEnrollingId(null);
  };

  if (loading) return <div className="loading">Đang tải...</div>;

  return (
    <div className="courses-page">
      <div className="page-header"><h1>Khóa học</h1></div>
      <p className="courses-subtitle">Quản lý khóa học đang học và khám phá các khóa học mới phù hợp với bạn.</p>

      {msg.text && (
        <div className={`alert ${msg.type === 'success' ? 'alert-success' : 'alert-error'}`}>{msg.text}</div>
      )}

      {/* Toolbar: tabs + search */}
      <div className="courses-toolbar">
        <div className="seg">
          <button className={`seg-btn ${tab === 'my' ? 'active' : ''}`} onClick={() => setTab('my')}>
            Khóa học của tôi <span className="seg-count">{enrollments.length}</span>
          </button>
          <button className={`seg-btn ${tab === 'browse' ? 'active' : ''}`} onClick={() => setTab('browse')}>
            Khám phá <span className="seg-count">{allAvailable.length}</span>
          </button>
        </div>

        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tab === 'browse' ? 'Tìm khóa học theo tên, giáo viên...' : 'Tìm trong khóa học của tôi...'}
          />
          {search && <button className="search-clear" onClick={() => setSearch('')} title="Xóa tìm kiếm">✕</button>}
        </div>
      </div>

      {tab === 'my' && (
        <>
          <section className="courses-section">
            <h2 className="courses-section-title">
              ⏳ Chờ thanh toán <span className="count-chip count-chip--warning">{pendingEnrollments.length}</span>
            </h2>
            {pendingEnrollments.length > 0 ? (
              <div className="course-grid">
                {pendingEnrollments.map(e => <EnrollmentCard key={e.id} enrollment={e} />)}
              </div>
            ) : (
              <EmptyState icon="💤" text={search ? 'Không có khóa chờ thanh toán khớp tìm kiếm.' : 'Không có khóa học nào đang chờ thanh toán.'} />
            )}
          </section>

          <section className="courses-section">
            <h2 className="courses-section-title">
              ✅ Đã kích hoạt <span className="count-chip count-chip--success">{activeEnrollments.length}</span>
            </h2>
            {activeEnrollments.length > 0 ? (
              <div className="course-grid">
                {activeEnrollments.map(e => <EnrollmentCard key={e.id} enrollment={e} />)}
              </div>
            ) : (
              <EmptyState icon="📚" text={search ? 'Không có khóa đã kích hoạt khớp tìm kiếm.' : 'Chưa có khóa học nào được kích hoạt.'} />
            )}
          </section>
        </>
      )}

      {tab === 'browse' && (
        availableCourses.length > 0 ? (
          <div className="course-grid">
            {availableCourses.map(c => (
              <CatalogCard key={c.id} course={c} enrolling={enrollingId === c.id} onEnroll={handleEnroll} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={search ? '🔍' : '🎉'}
            text={search ? `Không tìm thấy khóa học nào khớp với "${search}".` : 'Bạn đã đăng ký tất cả khóa học hiện có!'}
          />
        )
      )}
    </div>
  );
}
