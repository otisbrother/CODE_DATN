import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { courseService } from '../../services/course.service';
import { lessonService } from '../../services/lesson.service';
import { assignmentService } from '../../services/assignment.service';
import { sectionService } from '../../services/section.service';
import { enrollmentService, paymentService } from '../../services/enrollment.service';
import { voucherService } from '../../services/voucher.service';
import { progressService } from '../../services/progress.service';
import { reviewService } from '../../services/review.service';
import './CourseDetailPage.css';

const API_URL = '';

// VietQR fallback config. Backend also returns this info in paymentInfo.bankTransfer.
const BANK_BIN = '970422'; // MB
const ACCOUNT_NO = '0395256163';
const ACCOUNT_NAME = 'NGUYEN HUY TOA';

const renderStars = (rating = 0) => {
  const rounded = Math.round(Number(rating || 0));
  return Array.from({ length: 5 }, (_, index) => (index < rounded ? '★' : '☆')).join('');
};

// Comment mặc định theo số sao (3-5). <=2 sao bắt buộc nhập tự do.
const DEFAULT_REVIEW_COMMENTS = { 5: 'Khóa học rất hay', 4: 'Khóa học hay', 3: 'Khóa học ổn' };

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
  const [enrollmentData, setEnrollmentData] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openSections, setOpenSections] = useState({});
  const [openAccordions, setOpenAccordions] = useState({ objectives: false, lecturer: false, audience: false });

  // Payment modal state
  const [showPayment, setShowPayment] = useState(false);
  const [qrFallback, setQrFallback] = useState(false); // VietQR lỗi -> dùng QR SePay
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showLockedNotice, setShowLockedNotice] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [voucherCode, setVoucherCode] = useState(searchParams.get('voucher') || '');
  const [voucherPreview, setVoucherPreview] = useState(null);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherMsg, setVoucherMsg] = useState({ text: '', type: '' });
  const [preserveLoading, setPreserveLoading] = useState(false);
  const [showPreserveConfirm, setShowPreserveConfirm] = useState(false);
  const [preserveReason, setPreserveReason] = useState('no_time');
  const [preserveNote, setPreserveNote] = useState('');
  const [reviewSummary, setReviewSummary] = useState({ reviews: [], avg_rating: 0, review_count: 0 });
  const [reviewEligibility, setReviewEligibility] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: DEFAULT_REVIEW_COMMENTS[5] });
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMsg, setReviewMsg] = useState({ text: '', type: '' });

  const loadReviewData = useCallback(async () => {
    setReviewLoading(true);
    try {
      const res = await reviewService.getReviews(courseId);
      const data = res.data.data || {};
      setReviewSummary({
        reviews: data.reviews || [],
        avg_rating: Number(data.avg_rating || 0),
        review_count: Number(data.review_count || 0),
      });
    } catch (e) {
      console.error(e);
    }
    setReviewLoading(false);
  }, [courseId]);

  const loadReviewEligibility = useCallback(async () => {
    try {
      const res = await reviewService.checkCanReview(courseId);
      const data = res.data.data || {};
      setReviewEligibility(data);
      if (data.existing_review) {
        setReviewForm({
          rating: Number(data.existing_review.rating || 5),
          comment: data.existing_review.comment || '',
        });
      } else if (data.can_review) {
        // Hoàn thành khóa & chưa đánh giá -> tự bật popup review
        setShowReviewModal(true);
      }
    } catch (e) {
      setReviewEligibility({ can_review: false });
    }
  }, [courseId]);

  useEffect(() => {
    const load = async () => {
      try {
        await loadReviewData();
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
            setEnrollmentData(enrollment);
            if (enrollment.access_status === 'active') {
              setEnrolled(true);
              try {
                const pRes = await progressService.recalculate(courseId);
                const progressData = pRes.data.data;
                setProgress(progressData);
                if (Number(progressData?.completion_rate || 0) >= 100) {
                  await loadReviewEligibility();
                }
              } catch (e) { /* no progress */ }
            }
          }
        } catch (e) { /* not enrolled */ }
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [courseId, loadReviewData, loadReviewEligibility]);

  // Auto open payment modal if redirected from MyCoursesPage
  useEffect(() => {
    if (!loading && searchParams.get('openPayment') === 'true' && !enrolled && !showPayment && enrollmentStatus !== 'active') {
      handleEnroll();
    }
  }, [searchParams, enrolled, loading]);

  // Countdown timer for expires_at
  useEffect(() => {
    if (!enrollmentData?.expires_at) return;
    const update = () => {
      const diff = new Date(enrollmentData.expires_at).getTime() - Date.now();
      if (diff <= 0) {
        setCountdown({ expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        setCountdown({
          expired: false,
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / (1000 * 60)) % 60),
          seconds: Math.floor((diff / 1000) % 60),
        });
      }
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [enrollmentData?.expires_at]);

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
  const isCoursePreserved = Boolean(enrollmentData?.is_preserved);

  const handleEnroll = async () => {
    setEnrollLoading(true);
    setMsg({ text: '', type: '' });
    try {
      const res = await enrollmentService.enroll({
        course_id: Number(courseId),
        voucher_code: voucherCode.trim(),
      });
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

  const handlePreviewVoucher = async () => {
    if (!voucherCode.trim()) {
      setVoucherPreview(null);
      setVoucherMsg({ text: 'Vui lòng nhập mã voucher', type: 'error' });
      return;
    }
    setVoucherLoading(true);
    setVoucherMsg({ text: '', type: '' });
    try {
      const res = await voucherService.previewForCourse(courseId, { code: voucherCode.trim() });
      setVoucherPreview(res.data.data);
      setVoucherMsg({ text: 'Voucher hợp lệ cho khóa học này', type: 'success' });
    } catch (e) {
      setVoucherPreview(null);
      setVoucherMsg({ text: e.response?.data?.message || 'Voucher không hợp lệ', type: 'error' });
    }
    setVoucherLoading(false);
  };

  // Chọn sao: 3-5 sao điền comment mặc định; <=2 sao để trống cho học viên tự nhập
  const pickReviewStar = (star) => {
    setReviewForm((prev) => ({
      ...prev,
      rating: star,
      comment: star >= 3 ? DEFAULT_REVIEW_COMMENTS[star] : '',
    }));
  };

  const handleReviewSubmit = async (e) => {
    if (e) e.preventDefault();
    const rating = Number(reviewForm.rating);
    if (rating <= 2 && !reviewForm.comment.trim()) {
      setReviewMsg({ text: 'Đánh giá ≤ 2 sao cần nhập lý do để gửi giáo viên & admin', type: 'error' });
      return;
    }
    setReviewSubmitting(true);
    setReviewMsg({ text: '', type: '' });
    try {
      await reviewService.createReview(courseId, { rating, comment: reviewForm.comment.trim() });
      setReviewMsg({ text: 'Đã gửi phản hồi khóa học. Cảm ơn bạn!', type: 'success' });
      setShowReviewModal(false);
      await Promise.all([loadReviewData(), loadReviewEligibility()]);
    } catch (err) {
      setReviewMsg({ text: err.response?.data?.message || 'Không thể gửi phản hồi', type: 'error' });
    }
    setReviewSubmitting(false);
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  // Check if a lesson/section is accessible
  const canAccess = (item) => {
    if (isCoursePreserved) return false;
    if (enrolled) return true;
    if (item.is_preview === 1) return true;
    return false;
  };

  const handleLockedContentClick = (e) => {
    e.preventDefault();
    if (isCoursePreserved) {
      setMsg({ text: 'Khóa học đang bảo lưu. Vui lòng mở lại khóa học để tiếp tục học.', type: 'error' });
      setTimeout(() => setMsg({ text: '', type: '' }), 3000);
      return;
    }
    setShowLockedNotice(true);
  };

  const handlePreserveCourse = async () => {
    if (preserveReason === 'other' && !preserveNote.trim()) {
      setMsg({ text: 'Vui lòng nhập lý do khác', type: 'error' });
      return;
    }
    setShowPreserveConfirm(false);
    setPreserveLoading(true);
    try {
      await enrollmentService.preserveEnrollment(courseId, { reason: preserveReason, reason_note: preserveNote });
      setMsg({ text: '⏸️ Đã bảo lưu khóa học!', type: 'success' });
      setPreserveReason('no_time');
      setPreserveNote('');
      const enrRes = await enrollmentService.checkEnrollment(courseId);
      setEnrollmentData(enrRes.data.data);
    } catch (e) {
      setMsg({ text: e.response?.data?.message || 'Lỗi bảo lưu', type: 'error' });
    }
    setPreserveLoading(false);
    setTimeout(() => setMsg({ text: '', type: '' }), 3000);
  };

  const totalDuration = lessons.reduce((s, l) => s + (l.duration_seconds || 0), 0);
  const totalHours = (totalDuration / 3600).toFixed(1);
  const videoCount = lessons.filter(l => l.video_url).length;
  const courseCompleted = Number(progress?.completion_rate || 0) >= 100;

  if (loading) return <div className="loading">Đang tải...</div>;
  if (!course) return <div className="loading">Khóa học không tồn tại</div>;

  const bankTransfer = paymentInfo?.bankTransfer || {};
  const qrBankBin = bankTransfer.bankBin || BANK_BIN;
  const qrAccountNo = bankTransfer.accountNo || ACCOUNT_NO;
  const qrAccountName = bankTransfer.accountName || ACCOUNT_NAME;
  const qrBankName = bankTransfer.bankName || 'MB';
  const transferContent = bankTransfer.transferContent || (paymentInfo ? `ELEARNING ${paymentInfo.paymentId}` : '');
  // VietQR/SePay chỉ nhận SỐ NGUYÊN -> ép integer (total_amount là DECIMAL trả về dạng "10000.00")
  const qrAmount = Math.round(Number(paymentInfo?.amount) || 0);
  const vietqrUrl = paymentInfo
    ? `https://img.vietqr.io/image/${qrBankBin}-${qrAccountNo}-compact2.png?amount=${qrAmount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(qrAccountName)}`
    : '';
  // QR dự phòng của SePay (nếu VietQR lỗi mạng/dịch vụ)
  const sepayQrUrl = paymentInfo
    ? `https://qr.sepay.vn/img?bank=${encodeURIComponent(qrBankName)}&acc=${qrAccountNo}&amount=${qrAmount}&des=${encodeURIComponent(transferContent)}`
    : '';
  const qrUrl = qrFallback ? sepayQrUrl : vietqrUrl;

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
            <span className="hero-rating">{renderStars(reviewSummary.avg_rating)}</span>
            {reviewSummary.review_count > 0
              ? `${reviewSummary.avg_rating.toFixed(1)} (${reviewSummary.review_count} đánh giá)`
              : 'Chưa có đánh giá'}
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
                onError={() => { if (!qrFallback) setQrFallback(true); }}
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
                {paymentInfo.voucher && (
                  <>
                    <div className="bank-info-row">
                      <span className="bank-label">Voucher</span>
                      <span className="bank-value" style={{ color: '#059669', fontWeight: 700 }}>
                        {paymentInfo.voucher.code} (-{Number(paymentInfo.discountAmount || 0).toLocaleString('vi-VN')}đ)
                      </span>
                    </div>
                    <div className="bank-info-row">
                      <span className="bank-label">Học phí gốc</span>
                      <span className="bank-value">{Number(paymentInfo.originalAmount || 0).toLocaleString('vi-VN')}đ</span>
                    </div>
                  </>
                )}
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

      {/* ========== LOCKED CONTENT NOTICE ========== */}
      {showLockedNotice && (
        <div className="modal-overlay" onClick={() => setShowLockedNotice(false)}>
          <div className="locked-notice-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowLockedNotice(false)}>×</button>
            <div className="locked-notice-icon">🔒</div>
            <h2>Nội dung đang bị khóa</h2>
            <p>Hãy thanh toán khóa học để học tiếp nhé.</p>
            <div className="locked-notice-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setShowLockedNotice(false);
                  handleEnroll();
                }}
                disabled={enrollLoading}
              >
                {enrollLoading ? 'Đang xử lý...' : 'Thanh toán khóa học'}
              </button>
              <button type="button" className="btn btn-outline" onClick={() => setShowLockedNotice(false)}>
                Để sau
              </button>
            </div>
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
              <span>👨‍🏫 Thông tin giáo viên</span>
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
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Giáo viên</p>
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
                            onClick={e => { if (!accessible) handleLockedContentClick(e); }}
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
                            onClick={e => { if (!accessible) handleLockedContentClick(e); }}
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
            {/* Test cuối khóa — không thuộc chương nào, luôn xếp cuối */}
            {assignments.filter((a) => a.is_final_test).map((a) => {
              const accessible = enrolled && !isCoursePreserved;
              return (
                <div key={`ft-${a.id}`} className="cd-chapter" style={{ marginTop: 16, border: '1.5px solid #c7d2fe', borderRadius: 12, overflow: 'hidden' }}>
                  <div className="cd-chapter-header" style={{ cursor: 'default' }}>
                    <div className="cd-chapter-title"><span>🏁 {a.title}</span></div>
                    <span style={{ fontSize: 12, color: '#4f46e5', fontWeight: 700 }}>Test cuối khóa</span>
                  </div>
                  <Link
                    to={accessible ? `/student/assignment/${a.id}` : '#'}
                    className="cd-lesson-item"
                    style={{ textDecoration: 'none' }}
                    onClick={(e) => { if (!accessible) handleLockedContentClick(e); }}
                  >
                    <div className="lesson-left">
                      <span className="lesson-icon assignment">🏁</span>
                      <span>Làm bài kiểm tra cuối khóa</span>
                    </div>
                    <div className="lesson-right">
                      <span>Điểm: {a.max_score}</span>
                      {!accessible && <span>🔒</span>}
                    </div>
                  </Link>
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
              {!enrolled && Number(course.price) > 0 && (
                <div className="course-voucher-box">
                  <label>Mã voucher</label>
                  <div className="course-voucher-input-row">
                    <input
                      type="text"
                      value={voucherCode}
                      onChange={(e) => {
                        setVoucherCode(e.target.value.toUpperCase());
                        setVoucherPreview(null);
                        setVoucherMsg({ text: '', type: '' });
                      }}
                      placeholder="Dán mã voucher..."
                    />
                    <button type="button" onClick={handlePreviewVoucher} disabled={voucherLoading}>
                      {voucherLoading ? '...' : 'Áp dụng'}
                    </button>
                  </div>
                  {voucherMsg.text && (
                    <div className={`course-voucher-msg ${voucherMsg.type === 'success' ? 'success' : 'error'}`}>
                      {voucherMsg.text}
                    </div>
                  )}
                  {voucherPreview?.voucher_id && (
                    <div className="course-voucher-preview">
                      <span>Giảm {Number(voucherPreview.discount_amount || 0).toLocaleString('vi-VN')}đ</span>
                      <strong>Còn {Number(voucherPreview.final_amount || 0).toLocaleString('vi-VN')}đ</strong>
                    </div>
                  )}
                </div>
              )}

              {/* Enrolled */}
              {enrolled ? (
                <>
                  <div className="sidebar-enrolled-badge">✅ Đã đăng ký khóa học</div>
                  {/* Countdown thời hạn */}
                  {enrollmentData?.is_preserved ? (
                    <div style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 12, padding: '10px 14px', marginTop: 8, textAlign: 'center' }}>
                      <div style={{ color: '#8b5cf6', fontWeight: 700, fontSize: 15 }}>⏸️ Đang bảo lưu</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 4 }}>
                        {enrollmentData.preserved_at && `Bảo lưu từ: ${new Date(enrollmentData.preserved_at).toLocaleDateString('vi-VN')} ${new Date(enrollmentData.preserved_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`}
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>
                        Thời gian bảo lưu sẽ được cộng thêm khi mở lại
                      </div>
                    </div>
                  ) : enrollmentData?.expires_at ? (
                    countdown?.expired ? (
                      <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '10px 14px', marginTop: 8, textAlign: 'center' }}>
                        <div style={{ color: '#ef4444', fontWeight: 700, fontSize: 14 }}>⛔ Khóa học đã hết hạn</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 4 }}>Hết hạn: {new Date(enrollmentData.expires_at).toLocaleDateString('vi-VN')}</div>
                      </div>
                    ) : countdown ? (
                      <div style={{ background: countdown.days <= 1 ? 'rgba(239,68,68,0.08)' : countdown.days <= 7 ? 'rgba(245,158,11,0.08)' : 'rgba(16,185,129,0.08)', border: `1px solid ${countdown.days <= 1 ? 'rgba(239,68,68,0.25)' : countdown.days <= 7 ? 'rgba(245,158,11,0.25)' : 'rgba(16,185,129,0.25)'}`, borderRadius: 12, padding: '10px 14px', marginTop: 8, textAlign: 'center' }}>
                        <div style={{ color: countdown.days <= 1 ? '#ef4444' : countdown.days <= 7 ? '#f59e0b' : '#10b981', fontWeight: 700, fontSize: 16 }}>
                          {countdown.days <= 1 ? '🔴' : countdown.days <= 7 ? '🟡' : '⏰'} Còn {countdown.days > 0 ? `${countdown.days} ngày ` : ''}{String(countdown.hours).padStart(2, '0')}:{String(countdown.minutes).padStart(2, '0')}:{String(countdown.seconds).padStart(2, '0')}
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 4 }}>
                          Hết hạn: {new Date(enrollmentData.expires_at).toLocaleDateString('vi-VN')} {new Date(enrollmentData.expires_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ) : null
                  ) : course.duration_days ? null : (
                    <div style={{ background: 'rgba(139,92,246,0.08)', borderRadius: 12, padding: '6px 14px', marginTop: 8, textAlign: 'center', color: '#8b5cf6', fontSize: 12, fontWeight: 600 }}>
                      ♾️ Truy cập vĩnh viễn
                    </div>
                  )}
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
                  <div className="course-review-panel">
                    <div className="course-review-panel-head">
                      <h4>Phản hồi khóa học</h4>
                      <span>
                        {reviewLoading ? 'Đang tải...' : reviewSummary.review_count > 0
                          ? `${reviewSummary.avg_rating.toFixed(1)}/5 (${reviewSummary.review_count})`
                          : 'Chưa có phản hồi'}
                      </span>
                    </div>
                    {reviewMsg.text && (
                      <div className={`course-review-msg ${reviewMsg.type === 'success' ? 'success' : 'error'}`}>
                        {reviewMsg.text}
                      </div>
                    )}
                    {courseCompleted ? (
                      reviewEligibility?.can_review ? (
                        <form onSubmit={handleReviewSubmit} className="course-review-form">
                          <div className="course-review-stars-select" aria-label="Chọn số sao">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                className={star <= Number(reviewForm.rating) ? 'active' : ''}
                                onClick={() => pickReviewStar(star)}
                              >
                                {star <= Number(reviewForm.rating) ? '★' : '☆'}
                              </button>
                            ))}
                          </div>
                          {Number(reviewForm.rating) <= 2 && (
                            <p style={{ fontSize: 12, color: '#b45309', margin: '0 0 6px' }}>
                              ⚠️ Đánh giá ≤ 2 sao: vui lòng nêu lý do — phản hồi sẽ được gửi cho giáo viên & admin (không hiển thị công khai).
                            </p>
                          )}
                          <textarea
                            className="form-control"
                            rows={3}
                            value={reviewForm.comment}
                            onChange={(e) => setReviewForm((prev) => ({ ...prev, comment: e.target.value }))}
                            placeholder={Number(reviewForm.rating) <= 2 ? 'Nhập lý do/góp ý để giáo viên cải thiện...' : 'Chia sẻ cảm nhận sau khi hoàn thành khóa học...'}
                          />
                          <button className="btn btn-primary btn-sm" type="submit" disabled={reviewSubmitting}>
                            {reviewSubmitting
                              ? 'Đang gửi...'
                              : reviewEligibility.already_reviewed ? 'Cập nhật phản hồi' : 'Gửi phản hồi'}
                          </button>
                        </form>
                      ) : (
                        <p className="course-review-locked">Đang kiểm tra quyền phản hồi khóa học...</p>
                      )
                    ) : (
                      <p className="course-review-locked">
                        Hoàn thành 100% video bài học, bài tập và bài kiểm tra để mở phản hồi.
                      </p>
                    )}
                    {reviewSummary.reviews?.length > 0 && (
                      <div className="course-review-latest">
                        <strong>Phản hồi mới nhất</strong>
                        <p>{reviewSummary.reviews[0].comment || 'Học viên đã đánh giá khóa học.'}</p>
                        <span>{renderStars(reviewSummary.reviews[0].rating)} - {reviewSummary.reviews[0].student_name}</span>
                      </div>
                    )}
                  </div>
                  {!isCoursePreserved && (
                    <Link to={lessons.length > 0 ? `/student/lesson/${lessons[0].id}` : '#'}
                      className="btn btn-primary" style={{ width: '100%', marginTop: 16, textAlign: 'center', display: 'block' }}>
                      ▶ Tiếp tục học
                    </Link>
                  )}
                  {/* Nút Bảo lưu / Mở lại */}
                  {enrollmentData?.expires_at && (
                    enrollmentData?.is_preserved ? (
                      <button
                        className="btn btn-outline"
                        style={{ width: '100%', marginTop: 8, borderColor: '#8b5cf6', color: '#8b5cf6' }}
                        disabled={preserveLoading}
                        onClick={async () => {
                          setPreserveLoading(true);
                          try {
                            await enrollmentService.resumeEnrollment(courseId);
                            setMsg({ text: '✅ Đã mở lại khóa học!', type: 'success' });
                            // Reload enrollment data
                            const enrRes = await enrollmentService.checkEnrollment(courseId);
                            setEnrollmentData(enrRes.data.data);
                          } catch (e) {
                            setMsg({ text: e.response?.data?.message || 'Lỗi mở lại', type: 'error' });
                          }
                          setPreserveLoading(false);
                          setTimeout(() => setMsg({ text: '', type: '' }), 3000);
                        }}
                      >
                        {preserveLoading ? 'Đang xử lý...' : '🔓 Mở lại khóa học'}
                      </button>
                    ) : (
                      <button
                        className="btn btn-outline"
                        style={{ width: '100%', marginTop: 8, borderColor: '#f59e0b', color: '#f59e0b' }}
                        disabled={preserveLoading}
                        onClick={() => setShowPreserveConfirm(true)}
                      >
                        {preserveLoading ? 'Đang xử lý...' : '⏸️ Bảo lưu khóa học'}
                      </button>
                    )
                  )}
                </>
              ) : enrollmentStatus === 'pending' ? (
                <>
                  <div className="sidebar-enrolled-badge" style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)' }}>
                    ⏳ Chờ thanh toán
                  </div>
                  <button className="btn btn-primary" style={{ width: '100%', marginTop: 12 }} onClick={handleEnroll} disabled={enrollLoading}>
                    {enrollLoading ? 'Đang xử lý...' : '💳 Thanh toán khóa học'}
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
                <div className="sidebar-info-item"><span className="info-icon">📅</span><span>Thời hạn: {course.duration_days ? `${course.duration_days} ngày` : 'Vĩnh viễn'}</span></div>
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
                    {!isCoursePreserved && (
                      <Link to={`/student/ai-chat?course=${courseId}`} style={{ flex: 1, textAlign: 'center', padding: 10, fontSize: 13, fontWeight: 600, textDecoration: 'none', color: '#4f46e5' }}>
                        🤖 Hỏi AI
                      </Link>
                    )}
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

      {/* Popup chọn lý do bảo lưu */}
      {showPreserveConfirm && (
        <div className="modal-overlay" onClick={() => setShowPreserveConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <h3>⏸️ Bảo lưu khóa học</h3>
              <button className="modal-close" onClick={() => setShowPreserveConfirm(false)}>×</button>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 14, fontSize: 14 }}>
              Thời gian bảo lưu sẽ được cộng thêm khi bạn mở lại. Mỗi khóa được bảo lưu tối đa <strong>2 lần</strong>
              {typeof enrollmentData?.preserve_count === 'number' && ` (đã dùng ${enrollmentData.preserve_count}/2)`}.
            </p>
            <label style={{ fontWeight: 600, fontSize: 14, display: 'block', marginBottom: 8 }}>Lý do bảo lưu:</label>
            {[
              { value: 'no_time', label: 'Đang không có thời gian học' },
              { value: 'not_suitable', label: 'Khóa học chưa phù hợp ở thời điểm hiện tại' },
              { value: 'other', label: 'Lý do khác' },
            ].map((opt) => (
              <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', background: preserveReason === opt.value ? 'rgba(245,158,11,0.1)' : 'transparent' }}>
                <input type="radio" name="preserveReason" value={opt.value} checked={preserveReason === opt.value} onChange={(e) => setPreserveReason(e.target.value)} />
                {opt.label}
              </label>
            ))}
            {preserveReason === 'other' && (
              <textarea
                className="form-control"
                rows={3}
                placeholder="Nhập lý do của bạn..."
                value={preserveNote}
                onChange={(e) => setPreserveNote(e.target.value)}
                style={{ marginTop: 8 }}
              />
            )}
            <div className="modal-actions" style={{ marginTop: 18 }}>
              <button className="btn btn-outline" style={{ borderColor: '#f59e0b', color: '#f59e0b' }} disabled={preserveLoading} onClick={handlePreserveCourse}>
                {preserveLoading ? 'Đang xử lý...' : 'Xác nhận bảo lưu'}
              </button>
              <button className="btn btn-outline" onClick={() => setShowPreserveConfirm(false)}>Hủy</button>
            </div>
          </div>
        </div>
      )}

      {/* Popup đánh giá khóa học khi hoàn thành */}
      {showReviewModal && (
        <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <h3>⭐ Đánh giá khóa học</h3>
              <button className="modal-close" onClick={() => setShowReviewModal(false)}>×</button>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 12 }}>
              🎉 Chúc mừng bạn đã hoàn thành khóa học! Hãy để lại đánh giá nhé.
            </p>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 12 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} type="button"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f59e0b', fontSize: 36, lineHeight: 1 }}
                  onClick={() => pickReviewStar(star)}>
                  {star <= Number(reviewForm.rating) ? '★' : '☆'}
                </button>
              ))}
            </div>
            {Number(reviewForm.rating) <= 2 ? (
              <p style={{ fontSize: 13, color: '#b45309', marginBottom: 6 }}>
                ⚠️ Phản hồi ≤ 2 sao sẽ được gửi cho <strong>giáo viên & admin</strong> (không hiển thị công khai). Vui lòng nêu lý do:
              </p>
            ) : (
              <p style={{ fontSize: 13, color: '#16a34a', marginBottom: 6 }}>
                Nhận xét: <strong>{DEFAULT_REVIEW_COMMENTS[Number(reviewForm.rating)]}</strong> (có thể chỉnh sửa)
              </p>
            )}
            <textarea
              className="form-control"
              rows={3}
              value={reviewForm.comment}
              onChange={(e) => setReviewForm((prev) => ({ ...prev, comment: e.target.value }))}
              placeholder={Number(reviewForm.rating) <= 2 ? 'Nhập lý do/góp ý để giáo viên cải thiện...' : 'Cảm nhận của bạn...'}
            />
            {reviewMsg.text && (
              <div className={`alert ${reviewMsg.type === 'success' ? 'alert-success' : 'alert-error'}`} style={{ marginTop: 10 }}>{reviewMsg.text}</div>
            )}
            <div className="modal-actions" style={{ marginTop: 16 }}>
              <button className="btn btn-primary" disabled={reviewSubmitting} onClick={handleReviewSubmit}>
                {reviewSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
              </button>
              <button className="btn btn-outline" onClick={() => setShowReviewModal(false)}>Để sau</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
