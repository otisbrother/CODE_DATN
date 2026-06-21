import { useState, useEffect } from 'react';
import { courseService } from '../../services/course.service';
import { reviewService } from '../../services/review.service';
import { FiMessageSquare, FiSearch, FiX } from 'react-icons/fi';

const renderStars = (rating = 0) => {
  const rounded = Math.round(Number(rating || 0));
  return Array.from({ length: 5 }, (_, index) => (index < rounded ? '★' : '☆')).join('');
};

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [feedbackCourse, setFeedbackCourse] = useState(null);
  const [feedbackData, setFeedbackData] = useState(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      const [courseRes, ratingRes] = await Promise.all([
        courseService.getAll(params),
        reviewService.getWithRatings().catch(() => ({ data: { data: [] } })),
      ]);
      const ratingMap = {};
      (ratingRes.data.data || []).forEach((course) => {
        ratingMap[course.id] = {
          avg_rating: Number(course.avg_rating || 0),
          review_count: Number(course.review_count || 0),
        };
      });
      setCourses((courseRes.data.data || []).map((course) => ({
        ...course,
        rating: ratingMap[course.id] || { avg_rating: 0, review_count: 0 },
      })));
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    load();
  };

  const openFeedback = async (course) => {
    setFeedbackCourse(course);
    setFeedbackData(null);
    setFeedbackLoading(true);
    try {
      const res = await reviewService.getReviews(course.id);
      setFeedbackData(res.data.data || { reviews: [], avg_rating: 0, review_count: 0 });
    } catch (e) {
      setFeedbackData({ reviews: [], avg_rating: 0, review_count: 0 });
      setMsg(e.response?.data?.message || 'Không thể tải phản hồi khóa học');
    }
    setFeedbackLoading(false);
  };

  const statusLabel = (s) => {
    switch (s) {
      case 'published': return 'Xuất bản';
      case 'draft': return 'Nháp';
      case 'archived': return 'Lưu trữ';
      default: return s;
    }
  };

  const statusBadge = (s) => {
    switch (s) {
      case 'published': return 'badge-success';
      case 'draft': return 'badge-warning';
      case 'archived': return 'badge-secondary';
      default: return '';
    }
  };

  return (
    <div>
      <div className="page-header"><h1>Giám sát khóa học</h1></div>
      {msg && <div className="alert alert-success">{msg}</div>}

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'end' }}>
        <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
          <label>Tìm kiếm</label>
          <div style={{ position: 'relative' }}>
            <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="form-control" style={{ paddingLeft: 36 }} placeholder="Tìm theo tên khóa học..."
              value={search} onChange={(e) => setSearch(e.target.value)} />
            {search && <button type="button" onClick={() => { setSearch(''); setTimeout(load, 0); }}
              style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><FiX size={16} /></button>}
          </div>
        </div>
        <div className="form-group" style={{ width: 160, marginBottom: 0 }}>
          <label>Trạng thái</label>
          <select className="form-control" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setTimeout(load, 0); }}>
            <option value="">Tất cả</option>
            <option value="published">Xuất bản</option>
            <option value="draft">Nháp</option>
            <option value="archived">Lưu trữ</option>
          </select>
        </div>
        <button type="submit" className="btn btn-primary" style={{ height: 44 }}>Tìm</button>
      </form>

      {/* Modal phản hồi học viên */}
      {feedbackCourse && (
        <div className="modal-overlay" onClick={() => setFeedbackCourse(null)}>
          <div className="modal-content modal-lg" style={{ maxWidth: 760 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Phản hồi học viên</h3>
              <button className="modal-close" onClick={() => setFeedbackCourse(null)}>×</button>
            </div>
            <p style={{ marginBottom: 14 }}>
              <strong>{feedbackCourse.title}</strong>
              <span style={{ color: 'var(--text-secondary)' }}> - {feedbackCourse.lecturer_name}</span>
            </p>
            {feedbackLoading ? (
              <div className="loading">Đang tải phản hồi...</div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12, marginBottom: 16 }}>
                  <div style={{ padding: 14, borderRadius: 12, background: '#fffbeb', border: '1px solid #fde68a' }}>
                    <div style={{ color: '#92400e', fontSize: 12, fontWeight: 700 }}>Điểm trung bình</div>
                    <div style={{ color: '#d97706', fontSize: 22, fontWeight: 800 }}>
                      {Number(feedbackData?.avg_rating || 0).toFixed(1)}/5
                    </div>
                    <div style={{ color: '#f59e0b', fontSize: 13 }}>{renderStars(feedbackData?.avg_rating)}</div>
                  </div>
                  <div style={{ padding: 14, borderRadius: 12, background: '#eef2ff', border: '1px solid #c7d2fe' }}>
                    <div style={{ color: '#4338ca', fontSize: 12, fontWeight: 700 }}>Tổng phản hồi</div>
                    <div style={{ color: '#4f46e5', fontSize: 22, fontWeight: 800 }}>
                      {feedbackData?.review_count || 0}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Từ học viên đã hoàn thành khóa học</div>
                  </div>
                </div>
                {(feedbackData?.reviews || []).length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 24 }}>
                    Chưa có phản hồi nào cho khóa học này.
                  </p>
                ) : (
                  <div style={{ display: 'grid', gap: 12 }}>
                    {feedbackData.reviews.map((review) => (
                      <article
                        key={review.id}
                        style={{
                          border: '1px solid var(--border-color)',
                          borderRadius: 12,
                          padding: 14,
                          background: '#fff',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
                          <div>
                            <strong>{review.student_name}</strong>
                            <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{review.student_email}</div>
                          </div>
                          <div style={{ color: '#f59e0b', fontWeight: 800, whiteSpace: 'nowrap' }}>
                            {renderStars(review.rating)} {review.rating}/5
                          </div>
                        </div>
                        <p style={{ margin: 0, color: 'var(--text-primary)', lineHeight: 1.6 }}>
                          {review.comment || 'Học viên đã đánh giá nhưng chưa để lại nội dung phản hồi.'}
                        </p>
                        <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 8 }}>
                          {new Date(review.created_at).toLocaleString('vi-VN')}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </>
            )}
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setFeedbackCourse(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {loading ? <div className="loading">Đang tải...</div> : (
        <div className="table-container">
          <table>
            <thead><tr><th>ID</th><th>Tên khóa học</th><th>Giáo viên</th><th>Giá</th><th>Trạng thái</th><th>Đánh giá</th><th>Ngày tạo</th><th>Thao tác</th></tr></thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id}>
                  <td>{c.id}</td>
                  <td><strong>{c.title}</strong></td>
                  <td>{c.lecturer_name}</td>
                  <td>{Number(c.price).toLocaleString('vi-VN')}đ</td>
                  <td><span className={`badge ${statusBadge(c.status)}`}>{statusLabel(c.status)}</span></td>
                  <td>
                    {c.rating?.review_count > 0 ? (
                      <span style={{ color: '#d97706', fontWeight: 700 }}>
                        {Number(c.rating.avg_rating || 0).toFixed(1)}/5 ({c.rating.review_count})
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>Chưa có</span>
                    )}
                  </td>
                  <td>{new Date(c.created_at).toLocaleDateString('vi-VN')}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button className="btn btn-outline btn-sm" onClick={() => openFeedback(c)}><FiMessageSquare /> Phản hồi</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!loading && courses.length === 0 && <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 40 }}>Không tìm thấy khóa học nào.</p>}
    </div>
  );
}
