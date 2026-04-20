import { useState, useEffect } from 'react';
import { courseService } from '../../services/course.service';
import useAuthStore from '../../store/auth.store';
import { Link } from 'react-router-dom';

export default function ManageCoursesPage() {
  const { user } = useAuthStore();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [deleteCourse, setDeleteCourse] = useState(null);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', price: 0, status: 'draft' });

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
    setForm({ title: '', description: '', price: 0, status: 'draft' });
    setShowModal(true);
  };

  const openEdit = (c) => {
    setEditId(c.id);
    setForm({ title: c.title, description: c.description || '', price: c.price, status: c.status });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await courseService.update(editId, form);
        setMsg('Cập nhật khóa học thành công');
      } else {
        await courseService.create(form);
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

  return (
    <div>
      <div className="page-header">
        <h1>Quản lý khóa học</h1>
        <button className="btn btn-primary" onClick={openCreate}>+ Tạo khóa học</button>
      </div>
      {msg && <div className="alert alert-success">{msg}</div>}

      {/* MODAL tạo/sửa khóa học */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editId ? 'Chỉnh sửa khóa học' : 'Tạo khóa học mới'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group"><label>Tên khóa học *</label>
                <input className="form-control" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
              <div className="form-group"><label>Mô tả</label>
                <textarea className="form-control" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group"><label>Học phí (VND)</label>
                  <input type="number" className="form-control" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} min={0} /></div>
                <div className="form-group"><label>Trạng thái</label>
                  <select className="form-control" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="draft">Bản nháp</option><option value="published">Xuất bản</option>
                  </select></div>
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">{editId ? 'Cập nhật' : 'Tạo khóa học'}</button>
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

      <div className="table-container">
        <table>
          <thead>
            <tr><th>ID</th><th>Tên khóa học</th><th>Giá</th><th>Trạng thái</th><th>Ngày tạo</th><th>Thao tác</th></tr>
          </thead>
          <tbody>
            {courses.map((c) => (
              <tr key={c.id}>
                <td>{c.id}</td>
                <td><strong>{c.title}</strong></td>
                <td>{Number(c.price).toLocaleString('vi-VN')}đ</td>
                <td><span className={`badge ${c.status === 'published' ? 'badge-success' : 'badge-warning'}`}>{c.status === 'published' ? 'Xuất bản' : 'Nháp'}</span></td>
                <td>{new Date(c.created_at).toLocaleDateString('vi-VN')}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-outline btn-sm" onClick={() => openEdit(c)}>Sửa</button>
                    <Link to={`/lecturer/courses/${c.id}/lessons`} className="btn btn-primary btn-sm">Bài học</Link>
                    <Link to={`/lecturer/courses/${c.id}/assignments`} className="btn btn-outline btn-sm">Bài tập</Link>
                    <button className="btn btn-danger btn-sm" onClick={() => setDeleteCourse(c)}>Xóa</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {courses.length === 0 && <p style={{ color: 'var(--text-secondary)', marginTop: 20 }}>Chưa có khóa học nào.</p>}
    </div>
  );
}
