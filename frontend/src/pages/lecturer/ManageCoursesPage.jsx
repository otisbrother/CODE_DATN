import { useState, useEffect } from 'react';
import { courseService } from '../../services/course.service';
import useAuthStore from '../../store/auth.store';
import { Link } from 'react-router-dom';

const API_URL = '';

export default function ManageCoursesPage() {
  const { user } = useAuthStore();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [deleteCourse, setDeleteCourse] = useState(null);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', short_description: '', price: 0, status: 'draft', duration_days: '' });
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [introVideoFile, setIntroVideoFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [introVideoPreview, setIntroVideoPreview] = useState('');

  const load = async () => {
    try {
      const res = await courseService.getAll({ lecturer_id: user.id });
      setCourses(res.data.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [user.id]);

  const openCreate = () => {
    setEditId(null);
    setForm({ title: '', description: '', short_description: '', price: 0, status: 'draft', duration_days: '' });
    setThumbnailFile(null);
    setIntroVideoFile(null);
    setThumbnailPreview('');
    setIntroVideoPreview('');
    setShowModal(true);
  };

  const openEdit = (c) => {
    setEditId(c.id);
    setForm({
      title: c.title,
      description: c.description || '',
      short_description: c.short_description || '',
      price: c.price,
      status: c.status,
      duration_days: c.duration_days || '',
    });
    setThumbnailFile(null);
    setIntroVideoFile(null);
    setThumbnailPreview(c.thumbnail_url ? `${API_URL}${c.thumbnail_url}` : '');
    setIntroVideoPreview(c.intro_video_url ? `${API_URL}${c.intro_video_url}` : '');
    setShowModal(true);
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const handleIntroVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setIntroVideoFile(file);
      setIntroVideoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('short_description', form.short_description);
      formData.append('price', form.price);
      formData.append('status', form.status);
      formData.append('duration_days', form.duration_days || '');
      if (thumbnailFile) formData.append('thumbnail', thumbnailFile);
      if (introVideoFile) formData.append('intro_video', introVideoFile);

      if (editId) {
        await courseService.update(editId, formData);
        setMsg('Cập nhật khóa học thành công');
      } else {
        await courseService.create(formData);
        setMsg('Tạo khóa học thành công');
      }
      setShowModal(false);
      load();
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setMsg(err.response?.data?.message || 'Lỗi lưu khóa học');
    }
  };

  const handleDelete = async () => {
    if (!deleteCourse) return;
    try {
      await courseService.remove(deleteCourse.id);
      setMsg('Xóa thành công');
      setDeleteCourse(null);
      load();
      setTimeout(() => setMsg(''), 3000);
    } catch (e) {
      setMsg(e.response?.data?.message || 'Lỗi xóa');
      setDeleteCourse(null);
    }
  };

  if (loading) return <div className="loading">Đang tải...</div>;

  // Tìm kiếm không phân biệt hoa thường và dấu tiếng Việt (theo tên hoặc ID)
  const normalize = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const keyword = normalize(search);
  const filteredCourses = keyword
    ? courses.filter((c) => normalize(c.title).includes(keyword) || String(c.id) === keyword)
    : courses;

  // Phân trang 10 khóa học / trang
  const PAGE_SIZE = 10;
  const totalPages = Math.max(1, Math.ceil(filteredCourses.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages); // tự kẹp lại khi danh sách thu nhỏ (lọc/xóa)
  const pageCourses = filteredCourses.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div>
      <div className="page-header">
        <h1>Quản lý khóa học</h1>
        <button className="btn btn-primary" onClick={openCreate}>+ Thêm khóa học</button>
      </div>
      {msg && <div className="alert alert-success">{msg}</div>}

      {/* MODAL tạo/sửa khóa học */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editId ? 'Chỉnh sửa khóa học' : 'Thêm khóa học mới'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group"><label>Tên khóa học *</label>
                <input className="form-control" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
              <div className="form-group"><label>Mô tả ngắn</label>
                <input className="form-control" value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })} maxLength={300} placeholder="Mô tả ngắn gọn (tối đa 300 ký tự)" /></div>
              <div className="form-group"><label>Mô tả chi tiết</label>
                <textarea className="form-control" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label>Ảnh bìa</label>
                  <input type="file" className="form-control" accept="image/*" onChange={handleThumbnailChange} />
                  {thumbnailPreview && (
                    <img src={thumbnailPreview} alt="Thumbnail preview" style={{ width: '100%', maxHeight: 150, objectFit: 'cover', borderRadius: 8, marginTop: 8 }} />
                  )}
                </div>
                <div className="form-group">
                  <label>Video giới thiệu</label>
                  <input type="file" className="form-control" accept="video/*" onChange={handleIntroVideoChange} />
                  {introVideoPreview && (
                    <video src={introVideoPreview} controls style={{ width: '100%', maxHeight: 150, borderRadius: 8, marginTop: 8 }} />
                  )}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group"><label>Học phí (VND)</label>
                  <input type="number" className="form-control" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} min={0} /></div>
                <div className="form-group"><label>Trạng thái</label>
                  <select className="form-control" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="draft">Bản nháp</option><option value="published">Xuất bản</option><option value="archived">Lưu trữ</option>
                  </select></div>
              </div>
              <div className="form-group">
                <label>Thời hạn khóa học (ngày)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="number" className="form-control" value={form.duration_days} onChange={(e) => setForm({ ...form, duration_days: e.target.value })} min={0} placeholder="Để trống = Vĩnh viễn" style={{ flex: 1 }} />
                  <span style={{ color: 'var(--text-muted)', fontSize: 13, whiteSpace: 'nowrap' }}>{form.duration_days ? `${form.duration_days} ngày` : '♾️ Vĩnh viễn'}</span>
                </div>
                <small style={{ color: 'var(--text-muted)' }}>Số ngày học viên được truy cập sau khi đăng ký. Để trống = không giới hạn.</small>
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">{editId ? 'Cập nhật' : 'Thêm khóa học'}</button>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL xác nhận xóa khóa học */}
      {deleteCourse && (
        <div className="modal-overlay" onClick={() => setDeleteCourse(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Xác nhận xóa học phần</h3>
              <button className="modal-close" onClick={() => setDeleteCourse(null)}>×</button>
            </div>
            <p style={{ marginBottom: 8 }}>Bạn có chắc muốn xóa học phần này không?</p>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
              <strong>{deleteCourse.title}</strong>
            </p>
            <div className="modal-actions">
              <button type="button" className="btn btn-danger" onClick={handleDelete}>Xóa học phần</button>
              <button type="button" className="btn btn-outline" onClick={() => setDeleteCourse(null)}>Hủy</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ position: 'relative', maxWidth: 380, flex: 1 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}>🔍</span>
          <input
            type="search"
            className="form-control"
            placeholder="Tìm khóa học theo tên hoặc ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ paddingLeft: 36 }}
          />
        </div>
        {keyword && (
          <span style={{ color: 'var(--text-secondary)', fontSize: 14, whiteSpace: 'nowrap' }}>
            {filteredCourses.length} / {courses.length} khóa học
          </span>
        )}
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr><th>ID</th><th>Ảnh</th><th>Tên khóa học</th><th>Giá</th><th>Thời hạn</th><th>Trạng thái</th><th>Ngày tạo</th><th>Thao tác</th></tr>
          </thead>
          <tbody>
            {pageCourses.map((c) => (
              <tr key={c.id}>
                <td>{c.id}</td>
                <td>
                  {c.thumbnail_url ? (
                    <img src={`${API_URL}${c.thumbnail_url}`} alt="" style={{ width: 60, height: 40, objectFit: 'cover', borderRadius: 4 }} />
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Chưa có</span>
                  )}
                </td>
                <td><strong>{c.title}</strong></td>
                <td>{Number(c.price).toLocaleString('vi-VN')}đ</td>
                <td>{c.duration_days ? <span style={{ color: 'var(--accent-secondary)', fontWeight: 600 }}>{c.duration_days} ngày</span> : <span style={{ color: 'var(--text-muted)' }}>♾️ Vĩnh viễn</span>}</td>
                <td><span className={`badge ${c.status === 'published' ? 'badge-success' : c.status === 'archived' ? 'badge-secondary' : 'badge-warning'}`}>{c.status === 'published' ? 'Xuất bản' : c.status === 'archived' ? 'Lưu trữ' : 'Nháp'}</span></td>
                <td>{new Date(c.created_at).toLocaleDateString('vi-VN')}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-outline btn-sm" onClick={() => openEdit(c)}>Sửa</button>
                    <Link to={`/lecturer/courses/${c.id}/lessons`} className="btn btn-primary btn-sm">Bài học</Link>
                    <Link to={`/lecturer/courses/${c.id}/assignments`} className="btn btn-outline btn-sm">Bài tập</Link>
                    <Link to={`/lecturer/courses/${c.id}/assignments?final=1`} className="btn btn-outline btn-sm" style={{ borderColor: '#4f46e5', color: '#4f46e5' }}>🏁 Test cuối khóa</Link>
                    <button className="btn btn-danger btn-sm" onClick={() => setDeleteCourse(c)}>Xóa</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Phân trang: chỉ hiện khi có nhiều hơn 1 trang (trên 10 khóa học) */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 20, flexWrap: 'wrap' }}>
          <button className="btn btn-outline btn-sm" disabled={safePage === 1} onClick={() => setPage(safePage - 1)}>‹ Trước</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              className={`btn btn-sm ${p === safePage ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setPage(p)}
              style={{ minWidth: 38 }}
            >{p}</button>
          ))}
          <button className="btn btn-outline btn-sm" disabled={safePage === totalPages} onClick={() => setPage(safePage + 1)}>Sau ›</button>
          <span style={{ color: 'var(--text-secondary)', fontSize: 13, marginLeft: 8 }}>
            Trang {safePage}/{totalPages} · {filteredCourses.length} khóa học
          </span>
        </div>
      )}

      {courses.length === 0 && <p style={{ color: 'var(--text-secondary)', marginTop: 20 }}>Chưa có khóa học nào.</p>}
      {courses.length > 0 && filteredCourses.length === 0 && (
        <p style={{ color: 'var(--text-secondary)', marginTop: 20 }}>Không tìm thấy khóa học phù hợp với “{search}”.</p>
      )}
    </div>
  );
}
