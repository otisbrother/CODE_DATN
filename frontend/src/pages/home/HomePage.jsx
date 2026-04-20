import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { courseService } from '../../services/course.service';
import { authService } from '../../services/auth.service';
import useAuthStore from '../../store/auth.store';
import './HomePage.css';

const slides = [
  { img: '/images/hero1.png', title: 'Học lập trình cùng chuyên gia', sub: 'Nền tảng E-Learning hàng đầu với AI hỗ trợ hỏi đáp 24/7' },
  { img: '/images/hero2.png', title: 'Giảng viên chất lượng cao', sub: 'Đội ngũ giảng viên giàu kinh nghiệm, bài giảng cập nhật liên tục' },
  { img: '/images/hero3.png', title: 'AI hỗ trợ học tập thông minh', sub: 'Công nghệ AI giải đáp mọi thắc mắc, cá nhân hóa lộ trình học' },
];

const features = [
  { icon: '🎓', title: 'Giảng viên hàng đầu', desc: 'Đội ngũ giảng viên có kinh nghiệm thực tế, giàu năng lực sư phạm.' },
  { icon: '🤖', title: 'AI Hỏi đáp 24/7', desc: 'Hệ thống AI thông minh giải đáp thắc mắc bất cứ lúc nào.' },
  { icon: '📊', title: 'Theo dõi tiến độ', desc: 'Quản lý quá trình học, bài nộp và điểm số một cách trực quan.' },
  { icon: '💰', title: 'Học phí hợp lý', desc: 'Chi phí phải chăng với nội dung chất lượng cao, cập nhật liên tục.' },
];

export default function HomePage() {
  const [courses, setCourses] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showLogin, setShowLogin] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const { isAuthenticated, user, setAuth } = useAuthStore();
  const navigate = useNavigate();
  const intervalRef = useRef(null);

  useEffect(() => {
    courseService.getAll({ status: 'published', limit: 20 })
      .then(res => setCourses(res.data.data || []))
      .catch(console.error);
  }, []);

  // Auto slide
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const goSlide = (i) => {
    setCurrentSlide(i);
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => setCurrentSlide(prev => (prev + 1) % slides.length), 5000);
  };

  const requireLogin = () => {
    if (!isAuthenticated) {
      setShowLogin(true);
      setLoginError('');
      setLoginForm({ email: '', password: '' });
    }
  };

  const handleCourseClick = (courseId) => {
    if (!isAuthenticated) {
      requireLogin();
    } else {
      navigate(`/${user.role === 'student' ? 'student' : user.role}/course/${courseId}`);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await authService.login(loginForm);
      const { user: u, token } = res.data.data;
      setAuth(u, token);
      setShowLogin(false);
      navigate(`/${u.role}`);
    } catch (err) {
      setLoginError(err.response?.data?.message || 'Email hoặc mật khẩu không đúng');
    }
    setLoginLoading(false);
  };

  return (
    <div className="home-page">
      {/* NAVBAR */}
      <nav className="home-nav">
        <div className="home-nav-inner">
          <Link to="/" className="home-logo">🎓 E-Learning AI</Link>
          <div className="home-nav-links">
            <a href="#courses">Khóa học</a>
            <a href="#features">Tính năng</a>
            <a href="#about">Giới thiệu</a>
          </div>
          <div className="home-nav-actions">
            {isAuthenticated ? (
              <Link to={`/${user?.role}`} className="btn btn-primary">Vào Dashboard</Link>
            ) : (
              <>
                <button className="btn btn-outline" style={{ color: '#4f46e5', borderColor: '#4f46e5' }} onClick={requireLogin}>Đăng nhập</button>
                <Link to="/register" className="btn btn-primary">Đăng ký</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* LOGIN POPUP MODAL */}
      {showLogin && (
        <div className="modal-overlay login-modal-overlay" onClick={() => setShowLogin(false)}>
          <div className="login-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowLogin(false)}>×</button>
            <div className="login-modal-header">
              <div className="login-modal-icon">🎓</div>
              <h2>Đăng nhập E-Learning</h2>
              <p>Vui lòng đăng nhập để tiếp tục</p>
            </div>
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
            <div className="login-modal-footer">
              Chưa có tài khoản? <Link to="/register" onClick={() => setShowLogin(false)}>Đăng ký ngay</Link>
            </div>
          </div>
        </div>
      )}

      {/* HERO SLIDER */}
      <section className="hero-slider">
        {slides.map((s, i) => (
          <div key={i} className={`hero-slide ${i === currentSlide ? 'active' : ''}`}>
            <img src={s.img} alt={s.title} />
            <div className="hero-overlay">
              <div className="hero-content">
                <h1>{s.title}</h1>
                <p>{s.sub}</p>
                <div className="hero-btns">
                  {isAuthenticated ? (
                    <Link to={`/${user?.role}`} className="btn btn-primary btn-lg">Vào học ngay</Link>
                  ) : (
                    <button className="btn btn-primary btn-lg" onClick={requireLogin}>Bắt đầu học miễn phí</button>
                  )}
                  <a href="#courses" className="btn btn-outline btn-lg" style={{ color: '#fff', borderColor: '#fff' }}>Xem khóa học</a>
                </div>
              </div>
            </div>
          </div>
        ))}
        <div className="slider-dots">
          {slides.map((_, i) => (
            <button key={i} className={`dot ${i === currentSlide ? 'active' : ''}`} onClick={() => goSlide(i)} />
          ))}
        </div>
        <button className="slider-arrow left" onClick={() => goSlide((currentSlide - 1 + slides.length) % slides.length)}>❮</button>
        <button className="slider-arrow right" onClick={() => goSlide((currentSlide + 1) % slides.length)}>❯</button>
      </section>

      {/* STATS BAR */}
      <section className="stats-bar">
        <div className="stats-bar-inner">
          <div className="stat-item"><span className="stat-num">{courses.length}+</span><span>Khóa học</span></div>
          <div className="stat-item"><span className="stat-num">5000+</span><span>Học viên</span></div>
          <div className="stat-item"><span className="stat-num">100%</span><span>Giảng viên chất lượng</span></div>
          <div className="stat-item"><span className="stat-num">24/7</span><span>AI Hỗ trợ</span></div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="home-section" id="features">
        <h2 className="section-title">Tại sao chọn E-Learning AI?</h2>
        <p className="section-subtitle">Nền tảng học trực tuyến với công nghệ AI tiên tiến nhất</p>
        <div className="features-grid">
          {features.map((f, i) => (
            <div key={i} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* COURSES */}
      <section className="home-section courses-section" id="courses">
        <h2 className="section-title">Khóa học nổi bật</h2>
        <p className="section-subtitle">Các khóa học được thiết kế bởi giảng viên hàng đầu</p>
        <div className="home-courses-grid">
          {courses.map(c => (
            <div key={c.id} className="home-course-card" onClick={() => handleCourseClick(c.id)}>
              <div className="course-thumb">
                <div className="course-thumb-icon">📚</div>
              </div>
              <div className="course-body">
                <h3>{c.title}</h3>
                <p className="course-desc">{c.description?.substring(0, 80)}...</p>
                <div className="course-meta">
                  <span className="course-lecturer">👤 {c.lecturer_name}</span>
                  <span className={`badge ${c.status === 'published' ? 'badge-success' : 'badge-warning'}`}>
                    {c.status === 'published' ? 'Đang mở' : 'Nháp'}
                  </span>
                </div>
                <div className="course-footer">
                  <span className="course-price">{Number(c.price).toLocaleString('vi-VN')}đ</span>
                  <span className="course-action">Xem chi tiết →</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        {courses.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Chưa có khóa học nào.</p>}
      </section>

      {/* ABOUT / CTA */}
      <section className="cta-section" id="about">
        <div className="cta-content">
          <h2>Sẵn sàng bắt đầu hành trình học tập?</h2>
          <p>Đăng ký ngay để trải nghiệm nền tảng học trực tuyến với AI hỗ trợ thông minh</p>
          <div className="hero-btns">
            {!isAuthenticated ? (
              <>
                <Link to="/register" className="btn btn-primary btn-lg">Đăng ký miễn phí</Link>
                <button className="btn btn-outline btn-lg" style={{ color: '#fff', borderColor: '#fff' }} onClick={requireLogin}>Đăng nhập</button>
              </>
            ) : (
              <Link to={`/${user?.role}`} className="btn btn-primary btn-lg">Vào Dashboard</Link>
            )}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="home-footer">
        <div className="footer-inner">
          <div className="footer-col">
            <h4>🎓 E-Learning AI</h4>
            <p>Hệ thống học trực tuyến tích hợp trí tuệ nhân tạo. Đồ án tốt nghiệp Đại học Thủy Lợi.</p>
          </div>
          <div className="footer-col">
            <h4>Liên kết</h4>
            <a href="#courses">Khóa học</a>
            <a href="#features">Tính năng</a>
            <a href="#" onClick={(e) => { e.preventDefault(); requireLogin(); }}>Đăng nhập</a>
            <Link to="/register">Đăng ký</Link>
          </div>
          <div className="footer-col">
            <h4>Liên hệ</h4>
            <p>📧 elearning@tlu.edu.vn</p>
            <p>📞 0123 456 789</p>
            <p>📍 175 Tây Sơn, Đống Đa, Hà Nội</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 E-Learning AI — Đồ án tốt nghiệp. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
