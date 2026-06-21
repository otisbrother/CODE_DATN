import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { voucherService } from '../../services/voucher.service';
import { authService } from '../../services/auth.service';
import useAuthStore from '../../store/auth.store';
import ChatbotWidget from '../../components/ChatbotWidget';
import './HomePage.css';
import './VoucherPage.css';

export default function VoucherPage() {
  const { voucherId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user, setAuth } = useAuthStore();
  const [voucher, setVoucher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [pendingCourseId, setPendingCourseId] = useState(null);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [registerForm, setRegisterForm] = useState({ full_name: '', email: '', password: '', confirmPassword: '' });
  const [registerError, setRegisterError] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState('');
  const loginGoogleRef = useRef(null);
  const registerGoogleRef = useRef(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    voucherService.getPublicPromotionById(voucherId)
      .then(res => setVoucher(res.data.data))
      .catch(() => setVoucher(null))
      .finally(() => setLoading(false));
  }, [voucherId]);

  const formatDate = (value) => value ? new Date(value).toLocaleDateString('vi-VN') : 'Không giới hạn';

  const finalPrice = (course) => {
    const price = Number(course.price || 0);
    const rawDiscount = Math.round(price * Number(course.discount_percent || 0) / 100);
    const maxDiscount = course.max_discount_amount ? Number(course.max_discount_amount) : null;
    const discount = maxDiscount ? Math.min(rawDiscount, maxDiscount) : rawDiscount;
    return Math.max(price - discount, 0);
  };

  const copyCode = async () => {
    if (!voucher?.code) return;
    await navigator.clipboard?.writeText(voucher.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const openCourse = (courseId) => {
    if (!isAuthenticated) {
      setPendingCourseId(courseId);
      setLoginForm({ email: '', password: '' });
      setLoginError('');
      setRegisterSuccess('');
      setShowLogin(true);
      return;
    }
    navigate(`/student/course/${courseId}`);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await authService.login(loginForm);
      const { user: loggedInUser, token } = res.data.data;
      setAuth(loggedInUser, token);
      setShowLogin(false);
      if (pendingCourseId) {
        navigate(`/student/course/${pendingCourseId}`);
      } else {
        navigate(`/${loggedInUser.role}`);
      }
    } catch (err) {
      setLoginError(err.response?.data?.message || 'Email hoặc mật khẩu không đúng');
    }
    setLoginLoading(false);
  };

  const completeAuth = useCallback((loggedInUser, token) => {
    setAuth(loggedInUser, token);
    setShowLogin(false);
    setShowRegister(false);
    if (pendingCourseId) {
      navigate(`/student/course/${pendingCourseId}`);
    } else {
      navigate(`/${loggedInUser.role}`);
    }
  }, [navigate, pendingCourseId, setAuth]);

  const handleGoogleCredential = useCallback(async (credential) => {
    setLoginError('');
    setRegisterError('');
    setRegisterSuccess('');
    setLoginLoading(true);
    setRegisterLoading(true);
    try {
      const res = await authService.googleLogin({ credential });
      const { user: loggedInUser, token } = res.data.data;
      completeAuth(loggedInUser, token);
    } catch (err) {
      const message = err.response?.data?.message || 'Đăng nhập Gmail thất bại';
      if (showRegister) {
        setRegisterError(message);
      } else {
        setLoginError(message);
      }
    }
    setLoginLoading(false);
    setRegisterLoading(false);
  }, [completeAuth, showRegister]);

  const openRegister = () => {
    setShowLogin(false);
    setShowRegister(true);
    setRegisterError('');
    setRegisterForm({ full_name: '', email: '', password: '', confirmPassword: '' });
  };

  const openLogin = () => {
    setShowRegister(false);
    setShowLogin(true);
    setLoginError('');
    setRegisterSuccess('');
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (registerForm.password !== registerForm.confirmPassword) {
      setRegisterError('Mật khẩu xác nhận không khớp');
      return;
    }
    setRegisterLoading(true);
    setRegisterError('');
    try {
      await authService.register({
        full_name: registerForm.full_name,
        email: registerForm.email,
        password: registerForm.password,
      });
      setShowRegister(false);
      setShowLogin(true);
      setLoginForm({ email: registerForm.email, password: '' });
      setLoginError('');
      setRegisterSuccess('Đăng ký thành công! Vui lòng đăng nhập.');
    } catch (err) {
      setRegisterError(err.response?.data?.message || 'Đăng ký thất bại');
    }
    setRegisterLoading(false);
  };

  useEffect(() => {
    if ((!showLogin && !showRegister) || !googleClientId) return undefined;

    const renderGoogleButtons = () => {
      if (!window.google?.accounts?.id) return;

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: (response) => handleGoogleCredential(response.credential),
      });

      const targets = [
        { ref: loginGoogleRef, text: 'signin_with' },
        { ref: registerGoogleRef, text: 'signup_with' },
      ];

      targets.forEach(({ ref, text }) => {
        if (ref.current && ref.current.childElementCount === 0) {
          window.google.accounts.id.renderButton(ref.current, {
            theme: 'outline',
            size: 'large',
            type: 'standard',
            shape: 'rectangular',
            text,
            width: 356,
          });
        }
      });
    };

    const scriptId = 'google-identity-services';
    const existingScript = document.getElementById(scriptId);
    if (existingScript) {
      renderGoogleButtons();
      return undefined;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = renderGoogleButtons;
    document.body.appendChild(script);

    return undefined;
  }, [showLogin, showRegister, googleClientId, handleGoogleCredential]);

  if (loading) return <div className="voucher-public-loading">Đang tải voucher...</div>;

  if (!voucher) {
    return (
      <div className="voucher-public-empty">
        <h1>Voucher không tồn tại hoặc đã hết hạn</h1>
        <Link to="/" className="btn btn-primary">Về trang chủ</Link>
      </div>
    );
  }

  return (
    <div className="voucher-public-page">
      <nav className="voucher-public-nav">
        <Link to="/" className="home-logo">🎓 E-Learning AI</Link>
        <div className="voucher-public-actions">
          {isAuthenticated ? (
            <Link to={`/${user?.role}`} className="btn btn-primary">Vào Dashboard</Link>
          ) : (
            <button type="button" className="btn btn-outline" onClick={() => setShowLogin(true)}>Đăng nhập</button>
          )}
        </div>
      </nav>

      {showLogin && (
        <div className="modal-overlay login-modal-overlay" onClick={() => setShowLogin(false)}>
          <div className="login-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowLogin(false)}>×</button>
            <div className="login-modal-header">
              <div className="login-modal-icon">🎓</div>
              <h2>Đăng nhập E-Learning</h2>
              <p>Vui lòng đăng nhập để tiếp tục</p>
            </div>
            {registerSuccess && <div className="login-modal-success">{registerSuccess}</div>}
            {loginError && <div className="login-modal-error">{loginError}</div>}
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="Nhập email..."
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Mật khẩu</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Nhập mật khẩu..."
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary login-modal-btn" disabled={loginLoading}>
                {loginLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>
            </form>
            <div className="login-divider"><span>hoặc</span></div>
            {googleClientId ? (
              <div className="google-login-button" ref={loginGoogleRef} />
            ) : (
              <button type="button" className="google-login-fallback" disabled>Chưa cấu hình Gmail login</button>
            )}
            <div className="login-modal-footer">
              Chưa có tài khoản? <a href="#" onClick={(e) => { e.preventDefault(); openRegister(); }}>Đăng ký ngay</a>
            </div>
          </div>
        </div>
      )}

      {showRegister && (
        <div className="modal-overlay login-modal-overlay" onClick={() => setShowRegister(false)}>
          <div className="login-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowRegister(false)}>×</button>
            <div className="login-modal-header">
              <div className="login-modal-icon">🎓</div>
              <h2>Đăng ký tài khoản</h2>
              <p>Tạo tài khoản học viên mới</p>
            </div>
            {registerError && <div className="login-modal-error">{registerError}</div>}
            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label>Họ và tên</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Nhập họ tên..."
                  value={registerForm.full_name}
                  onChange={(e) => setRegisterForm({ ...registerForm, full_name: e.target.value })}
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="Nhập email..."
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Mật khẩu</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Ít nhất 6 ký tự..."
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
              <div className="form-group">
                <label>Xác nhận mật khẩu</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Nhập lại mật khẩu..."
                  value={registerForm.confirmPassword}
                  onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary login-modal-btn" disabled={registerLoading}>
                {registerLoading ? 'Đang đăng ký...' : 'Đăng ký'}
              </button>
            </form>
            <div className="login-divider"><span>hoặc</span></div>
            {googleClientId ? (
              <div className="google-login-button" ref={registerGoogleRef} />
            ) : (
              <button type="button" className="google-login-fallback" disabled>Chưa cấu hình Gmail login</button>
            )}
            <div className="login-modal-footer">
              Đã có tài khoản? <a href="#" onClick={(e) => { e.preventDefault(); openLogin(); }}>Đăng nhập</a>
            </div>
          </div>
        </div>
      )}

      <header className="voucher-public-hero">
        <div>
          <span className="voucher-public-kicker">Voucher đang diễn ra</span>
          <h1>{voucher.name}</h1>
          <p>{voucher.description || 'Chọn một khóa học bên dưới, sao chép mã voucher và dán mã khi đăng ký thanh toán.'}</p>
          <div className="voucher-public-meta">
            <span>{formatDate(voucher.starts_at)} - {formatDate(voucher.ends_at)}</span>
            <span>{voucher.course_count} khóa học áp dụng</span>
          </div>
        </div>
        <div className="voucher-public-code-card">
          <span>Mã voucher</span>
          <strong>{voucher.code}</strong>
          <button type="button" onClick={copyCode}>{copied ? 'Đã sao chép' : 'Sao chép mã'}</button>
        </div>
      </header>

      <main className="voucher-public-main">
        <h2>Khóa học được áp dụng</h2>
        <div className="voucher-course-grid">
          {voucher.courses.map((course) => (
            <article className="voucher-course-card" key={course.id}>
              <div className="voucher-course-thumb">
                {course.thumbnail_url ? <img src={course.thumbnail_url} alt={course.title} /> : <span>📚</span>}
              </div>
              <div className="voucher-course-body">
                <div className="voucher-course-discount">Giảm {Number(course.discount_percent)}%</div>
                <h3>{course.title}</h3>
                <p>{course.short_description || course.description || 'Khóa học đang mở trên E-Learning AI.'}</p>
                <div className="voucher-course-teacher">{course.lecturer_name}</div>
                <div className="voucher-course-price">
                  <span>{Number(finalPrice(course)).toLocaleString('vi-VN')}đ</span>
                  <del>{Number(course.price || 0).toLocaleString('vi-VN')}đ</del>
                </div>
                <button type="button" className="btn btn-primary" onClick={() => openCourse(course.id)}>
                  Xem khóa học
                </button>
              </div>
            </article>
          ))}
        </div>
      </main>

      <ChatbotWidget />
    </div>
  );
}
