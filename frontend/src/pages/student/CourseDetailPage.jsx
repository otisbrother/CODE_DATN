import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { courseService } from '../../services/course.service';
import { lessonService } from '../../services/lesson.service';
import { assignmentService } from '../../services/assignment.service';
import { sectionService } from '../../services/section.service';
import { enrollmentService, paymentService } from '../../services/enrollment.service';
import { progressService } from '../../services/progress.service';
import './CourseDetailPage.css';

const API_URL = 'http://localhost:5000';

// VietQR fallback config. Backend also returns this info in paymentInfo.bankTransfer.
const BANK_BIN = '970422'; // MB
const ACCOUNT_NO = '0395256163';
const ACCOUNT_NAME = 'NGUYEN HUY TOA';

export default function CourseDetailPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [sections, setSections] = useState([]);
  const [progress, setProgress] = useState(null);
  const [enrolled, setEnrolled] = useState(false);
  const [enrollmentStatus, setEnrollmentStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openSections, setOpenSections] = useState({});
  const [openAccordions, setOpenAccordions] = useState({ objectives: false, lecturer: false, audience: false });

  // Payment modal state
  const [showPayment, setShowPayment] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  useEffect(() => {
    const load = async () => {
      try {
        const [cRes, lRes, aRes, sRes] = await Promise.all([
          courseService.getById(courseId),
          lessonService.getByCourse(courseId),
          assignmentService.getByCourse(courseId),
          sectionService.getByCourse(courseId),
        ]);
        setCourse(cRes.data.data);
        setLessons(lRes.data.data || []);
        setAssignments(aRes.data.data || []);
        const secs = sRes.data.data || [];
        setSections(secs);
        if (secs.length > 0) setOpenSections({ [secs[0].id]: true });

        // Check enrollment status
        try {
          const enrRes = await enrollmentService.checkEnrollment(courseId);
          const enrollment = enrRes.data.data;
          if (enrollment) {
            setEnrollmentStatus(enrollment.access_status);
            if (enrollment.access_status === 'active') {
              setEnrolled(true);
              try {
                const pRes = await progressService.recalculate(courseId);
                setProgress(pRes.data.data);
              } catch (e) { /* no progress */ }
            }
          }
        } catch (e) { /* not enrolled */ }
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [courseId]);

  // Auto open payment modal if redirected from MyCoursesPage
  useEffect(() => {
    if (!loading && searchParams.get('openPayment') === 'true' && !enrolled && !showPayment && enrollmentStatus !== 'active') {
      handleEnroll();
    }
  }, [searchParams, enrolled, loading]);

  useEffect(() => {
    if (!showPayment || !paymentInfo?.paymentId) return undefined;

    let stopped = false;
    const checkPaymentStatus = async () => {
      try {
        const res = await paymentService.getPaymentStatus(paymentInfo.paymentId);
        if (stopped) return;

        if (res.data.data?.payment_status === 'completed') {
          setShowPayment(false);
          setPaymentInfo(null);
          setEnrolled(true);
          setEnrollmentStatus('active');
          setShowSuccess(true);
          setTimeout(() => {
            if (lessons.length > 0) {
              navigate(`/student/lesson/${lessons[0].id}`);
            } else {
              navigate(`/student/course/${courseId}`);
              window.location.reload();
            }
          }, 2500);
        }
      } catch (e) {
        // Continue waiting; only the backend bank webhook can complete the payment.
      }
    };

    checkPaymentStatus();
    const timer = setInterval(checkPaymentStatus, 3000);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [showPayment, paymentInfo?.paymentId, courseId, lessons, navigate]);

  const toggleSection = (id) => setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  const toggleAccordion = (key) => setOpenAccordions(prev => ({ ...prev, [key]: !prev[key] }));

  const handleEnroll = async () => {
    setEnrollLoading(true);
    setMsg({ text: '', type: '' });
    try {
      const res = await enrollmentService.enroll({ course_id: Number(courseId) });
      const data = res.data.data;

      if (data.status === 'active') {
        // Free course → enrolled immediately → go to first lesson
        setEnrolled(true);
        setEnrollmentStatus('active');
        setShowSuccess(true);
        // Navigate to first lesson after 2s
        setTimeout(() => {
          if (lessons.length > 0) {
            navigate(`/student/lesson/${lessons[0].id}`);
          } else {
            window.location.reload();
          }
        }, 2000);
      } else {
        // Paid → show QR payment
        setPaymentInfo(data);
        setShowPayment(true);
      }
    } catch (e) {
      setMsg({ text: e.response?.data?.message || 'Lỗi đăng ký', type: 'error' });
    }
    setEnrollLoading(false);
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  // Check if a lesson/section is accessible
  const canAccess = (item) => {
    if (enrolled) return true;
    if (item.is_preview === 1) return true;
    return false;
  };

  const totalDuration = lessons.reduce((s, l) => s + (l.duration_seconds || 0), 0);
  const totalHours = (totalDuration / 3600).toFixed(1);
  const videoCount = lessons.filter(l => l.video_url).length;

  if (loading) return <div className="loading">Đang tải...</div>;
  if (!course) return <div className="loading">Khóa học không tồn tại</div>;

  const bankTransfer = paymentInfo?.bankTransfer || {};
  const qrBankBin = bankTransfer.bankBin || BANK_BIN;
  const qrAccountNo = bankTransfer.accountNo || ACCOUNT_NO;
  const qrAccountName = bankTransfer.accountName || ACCOUNT_NAME;
  const qrBankName = bankTransfer.bankName || 'MB';
  const transferContent = bankTransfer.transferContent || (paymentInfo ? `ELEARNING ${paymentInfo.paymentId}` : '');
  const qrUrl = paymentInfo
    ? `https://img.vietqr.io/image/${qrBankBin}-${qrAccountNo}-compact2.png?amount=${paymentInfo.amount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(qrAccountName)}`
    : '';

  return (
    <div>
      {/* ========== HERO BANNER ========== */}
      <div className="course-hero">
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>{course.title}</h1>
        <p className="hero-short-desc">{course.short_description || course.description}</p>
        <div className="course-hero-tags">
          <span className="tag">📚 E-Learning</span>
          <span className="tag">🎓 Chứng chỉ</span>
          <span className="tag">🤖 AI hỗ trợ</span>
        </div>
        <div className="course-hero-meta">
          <span className="meta-item">👨‍🏫 {course.lecturer_name}</span>
          <span className="meta-item">📖 {lessons.length} bài học</span>
          <span className="meta-item">📝 {assignments.length} bài tập</span>
          <span className="meta-item">
            <span className="hero-rating">⭐⭐⭐⭐⭐</span> 4.8
          </span>
        </div>
      </div>

      {msg.text && (
        <div className={`alert ${msg.type === 'success' ? 'alert-success' : 'alert-danger'}`}>{msg.text}</div>
      )}

      {/* ========== PAYMENT MODAL ========== */}
      {showPayment && paymentInfo && (
        <div className="modal-overlay" onClick={() => setShowPayment(false)}>
          <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowPayment(false)}>×</button>
            <div className="payment-modal-header">
              <span style={{ fontSize: 48 }}>🏦</span>
              <h2>Thanh toán khóa học</h2>
              <p style={{ color: 'var(--text-secondary)' }}>{course.title}</p>
            </div>

            <div className="payment-qr-section">
              <img
                src={qrUrl}
                alt="QR Thanh toán"
                className="payment-qr-img"
              />
              <div className="payment-bank-info">
                <div className="bank-info-row">
                  <span className="bank-label">Ngân hàng</span>
                  <span className="bank-value">{qrBankName}</span>
                </div>
                <div className="bank-info-row">
                  <span className="bank-label">Chủ tài khoản</span>
                  <span className="bank-value">{qrAccountName}</span>
                </div>
                <div className="bank-info-row">
                  <span className="bank-label">Số tài khoản</span>
                  <span className="bank-value" style={{ fontFamily: 'monospace', letterSpacing: 1 }}>{qrAccountNo}</span>
                </div>
                <div className="bank-info-row">
                  <span className="bank-label">Số tiền</span>
                  <span className="bank-value amount">{Number(paymentInfo.amount).toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="bank-info-row">
                  <span className="bank-label">Nội dung CK</span>
                  <span className="bank-value" style={{ color: '#e11d48', fontWeight: 700 }}>{transferContent}</span>
                </div>
              </div>
            </div>

            <div className="payment-notice">
              <p>⚠️ Vui lòng chuyển khoản <strong>đúng số tiền</strong> và <strong>đúng nội dung</strong> để hệ thống xác nhận tự động.</p>
            </div>

            <div className="payment-waiting-status">
              <div className="payment-spinner" />
              <div>
                <strong>Đang chờ ngân hàng xác nhận giao dịch</strong>
                <p>Hệ thống sẽ tự mở khóa khóa học sau khi nhận được webhook giao dịch thành công.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== SUCCESS OVERLAY ========== */}
      {showSuccess && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="success-overlay-content">
            <div className="success-checkmark">✅</div>
            <h2>Thanh toán thành công!</h2>
            <p>Khóa học <strong>{course.title}</strong> đã được mở khóa.</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Đang chuyển đến bài học đầu tiên...</p>
            <div className="success-loader"></div>
          </div>
        </div>
      )}

      {/* ========== MAIN LAYOUT ========== */}
      <div className="course-detail-layout">
        {/* LEFT COLUMN */}
        <div className="course-main-content">
          {/* Accordions */}
          <div className="cd-accordion">
            <div className="cd-accordion-header" onClick={() => toggleAccordion('objectives')}>
              <span>🎯 Mục tiêu khóa học</span>
              <span className={`acc-icon ${openAccordions.objectives ? 'open' : ''}`}>▼</span>
            </div>
            {openAccordions.objectives && (
              <div className="cd-accordion-body">
                <ul style={{ paddingLeft: 20, lineHeight: 2, color: 'var(--text-secondary)', fontSize: 14 }}>
                  <li>Nắm vững kiến thức nền tảng và chuyên sâu của khóa học</li>
                  <li>Có khả năng thực hành và áp dụng vào thực tế</li>
                  <li>Hoàn thành các bài tập và dự án thực tiễn</li>
                  <li>Sẵn sàng cho các vị trí liên quan trong ngành</li>
                </ul>
              </div>
            )}
          </div>

          <div className="cd-accordion">
            <div className="cd-accordion-header" onClick={() => toggleAccordion('lecturer')}>
              <span>👨‍🏫 Thông tin giảng viên</span>
              <span className={`acc-icon ${openAccordions.lecturer ? 'open' : ''}`}>▼</span>
            </div>
            {openAccordions.lecturer && (
              <div className="cd-accordion-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 24, fontWeight: 700 }}>
                    {course.lecturer_name?.[0]}
                  </div>
                  <div>
                    <h4 style={{ marginBottom: 2 }}>{course.lecturer_name}</h4>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Giảng viên</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="cd-accordion">
            <div className="cd-accordion-header" onClick={() => toggleAccordion('audience')}>
              <span>🎓 Đối tượng học viên</span>
              <span className={`acc-icon ${openAccordions.audience ? 'open' : ''}`}>▼</span>
            </div>
            {openAccordions.audience && (
              <div className="cd-accordion-body">
                <ul style={{ paddingLeft: 20, lineHeight: 2, color: 'var(--text-secondary)', fontSize: 14 }}>
                  <li>Sinh viên muốn nâng cao kiến thức</li>
                  <li>Người đi làm muốn chuyển ngành</li>
                  <li>Ai muốn bổ sung kỹ năng mới</li>
                </ul>
              </div>
            )}
          </div>

          {/* ========== CURRICULUM ========== */}
          <div className="cd-chapter-section" style={{ marginTop: 32 }}>
            <h2>📋 Nội dung chương trình học</h2>
            {sections.map((section) => {
              const sLessons = lessons.filter(l => l.section_id === section.id);
              const sAssignments = assignments.filter(a => a.section_id === section.id);
              const isOpen = openSections[section.id];
              const sectionDuration = sLessons.reduce((s, l) => s + (l.duration_seconds || 0), 0);

              return (
                <div key={section.id} className="cd-chapter">
                  <div className="cd-chapter-header" onClick={() => toggleSection(section.id)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12 }}>{isOpen ? '▼' : '▶'}</span>
                      <span>{section.title}</span>
                      {section.is_preview === 1 && <span style={{ background: 'rgba(16,185,129,0.2)', color: '#10b981', padding: '2px 8px', borderRadius: 8, fontSize: 11 }}>Học thử</span>}
                    </div>
                    <div className="chapter-meta">
                      <span>{sLessons.length + sAssignments.length} mục</span>
                      {sectionDuration > 0 && <span>{formatDuration(sectionDuration)}</span>}
                    </div>
                  </div>

                  {isOpen && (
                    <div className="cd-chapter-body">
                      {sLessons.map((l) => {
                        const accessible = canAccess(l) || canAccess(section);
                        return (
                          <Link key={l.id}
                            to={accessible ? `/student/lesson/${l.id}` : '#'}
                            className="cd-lesson-item"
                            style={{ textDecoration: 'none' }}
                            onClick={e => { if (!accessible) e.preventDefault(); }}
                          >
                            <div className="lesson-left">
                              <span className="lesson-icon video">{l.video_url ? '🎥' : '📄'}</span>
                              <span>{l.title}</span>
                            </div>
                            <div className="lesson-right">
                              {(l.is_preview === 1 || section.is_preview === 1) && !enrolled && (
                                <span className="preview-badge">Học thử</span>
                              )}
                              {l.duration_seconds && <span>{formatDuration(l.duration_seconds)}</span>}
                              {!accessible && <span>🔒</span>}
                            </div>
                          </Link>
                        );
                      })}
                      {sAssignments.map((a) => {
                        const accessible = enrolled;
                        return (
                          <Link key={`a-${a.id}`}
                            to={accessible ? `/student/assignment/${a.id}` : '#'}
                            className="cd-lesson-item"
                            style={{ textDecoration: 'none' }}
                            onClick={e => { if (!accessible) e.preventDefault(); }}
                          >
                            <div className="lesson-left">
                              <span className="lesson-icon assignment">📝</span>
                              <span>{a.title}</span>
                            </div>
                            <div className="lesson-right">
                              <span>Điểm: {a.max_score}</span>
                              {!accessible && <span>🔒</span>}
                            </div>
                          </Link>
                        );
                      })}
                      {sLessons.length === 0 && sAssignments.length === 0 && (
                        <div className="cd-lesson-item" style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Chưa có nội dung</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {sections.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>Chưa có nội dung chương trình.</p>}
          </div>
        </div>

        {/* ========== RIGHT SIDEBAR ========== */}
        <div className="course-sidebar">
          <div className="course-sidebar-card">
            {course.intro_video_url ? (
              <video className="sidebar-video" controls poster={course.thumbnail_url ? `${API_URL}${course.thumbnail_url}` : undefined}
                src={`${API_URL}${course.intro_video_url}`} />
            ) : course.thumbnail_url ? (
              <img className="sidebar-thumbnail" src={`${API_URL}${course.thumbnail_url}`} alt={course.title} />
            ) : (
              <div className="sidebar-thumbnail" style={{ background: 'linear-gradient(135deg, #1e2243, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 64 }}>📚</span>
              </div>
            )}

            <div className="sidebar-body">
              {/* Enrolled */}
              {enrolled ? (
                <>
                  <div className="sidebar-enrolled-badge">✅ Đã đăng ký khóa học</div>
                  {progress && (
                    <div className="sidebar-progress-bar">
                      <div className="sidebar-progress-label">
                        <span>Tiến độ</span>
                        <strong>{progress.completion_rate}%</strong>
                      </div>
                      <div className="bar-bg">
                        <div className="bar-fill" style={{ width: `${Math.min(progress.completion_rate, 100)}%` }} />
                      </div>
                      <div className="sidebar-progress-label">
                        <span>{progress.completed_lessons} bài học</span>
                        <span>{progress.completed_assignments} bài tập</span>
                      </div>
                    </div>
                  )}
                  <Link to={lessons.length > 0 ? `/student/lesson/${lessons[0].id}` : '#'}
                    className="btn btn-primary" style={{ width: '100%', marginTop: 16, textAlign: 'center', display: 'block' }}>
                    ▶ Tiếp tục học
                  </Link>
                </>
              ) : enrollmentStatus === 'pending' ? (
                <>
                  <div className="sidebar-enrolled-badge" style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)' }}>
                    ⏳ Chờ thanh toán
                  </div>
                  <button className="btn btn-primary" style={{ width: '100%', marginTop: 12 }} onClick={handleEnroll} disabled={enrollLoading}>
                    {enrollLoading ? 'Đang xử lý...' : '💳 Thanh toán ngay'}
                  </button>
                </>
              ) : (
                <div className="sidebar-cta-section">
                  <span style={{ fontSize: 36 }}>👑</span>
                  <h3>Mở khóa toàn bộ khóa học</h3>
                  <p>Trở thành học viên để truy cập toàn bộ nội dung bài giảng, bài tập và AI hỗ trợ.</p>
                  <div className="sidebar-cta-btns">
                    <button className="btn-enroll primary" onClick={handleEnroll} disabled={enrollLoading}>
                      {enrollLoading ? 'Đang xử lý...' : Number(course.price) === 0 ? '🎁 Đăng ký miễn phí' : '💳 Đăng ký học ngay'}
                    </button>
                  </div>
                </div>
              )}

              {/* Course info */}
              <div className="sidebar-info-list">
                <h4>Khóa học bao gồm:</h4>
                <div className="sidebar-info-item"><span className="info-icon">🎥</span><span>{videoCount} video bài giảng</span></div>
                <div className="sidebar-info-item"><span className="info-icon">⏱</span><span>{totalHours} giờ nội dung</span></div>
                <div className="sidebar-info-item"><span className="info-icon">📝</span><span>{assignments.length} bài tập thực hành</span></div>
                <div className="sidebar-info-item"><span className="info-icon">📂</span><span>{sections.length} chương học</span></div>
                <div className="sidebar-info-item"><span className="info-icon">🤖</span><span>AI hỏi đáp 24/7</span></div>
                <div className="sidebar-info-item"><span className="info-icon">📱</span><span>Truy cập mọi thiết bị</span></div>
              </div>

              {/* Price */}
              <div className="sidebar-price">
                <div>
                  <div className="price-label">Học phí</div>
                  <div className="price-value">
                    {Number(course.price) === 0 ? 'Miễn phí' : `${Number(course.price).toLocaleString('vi-VN')}đ`}
                  </div>
                </div>
              </div>

              {/* Bottom actions */}
              <div className="sidebar-tabs">
                {enrolled ? (
                  <>
                    <Link to={`/student/ai-chat?course=${courseId}`} style={{ flex: 1, textAlign: 'center', padding: 10, fontSize: 13, fontWeight: 600, textDecoration: 'none', color: '#4f46e5' }}>
                      🤖 Hỏi AI
                    </Link>
                    <Link to="/student/courses" style={{ flex: 1, textAlign: 'center', padding: 10, fontSize: 13, fontWeight: 600, textDecoration: 'none', color: 'var(--text-secondary)' }}>
                      ← Khóa học của tôi
                    </Link>
                  </>
                ) : (
                  <Link to="/student/courses" style={{ flex: 1, textAlign: 'center', padding: 10, fontSize: 13, fontWeight: 600, textDecoration: 'none', color: 'var(--text-secondary)', background: 'var(--bg-input)', borderRadius: 8 }}>
                    ← Xem thêm khóa học
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
