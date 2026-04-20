import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { lessonService } from '../../services/lesson.service';
import ConfirmModal from '../../components/ConfirmModal';

export default function ManageLessonsPage() {
  const { courseId } = useParams();
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ title: '', content: '', lesson_order: 1 });
  const [msg, setMsg] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  const load = async () => {
    try {
      const res = await lessonService.getByCourse(courseId);
      setLessons(res.data.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [courseId]);

  const openCreate = () => {
    setEditId(null);
    setForm({ title: '', content: '', lesson_order: lessons.length + 1 });
    setShowModal(true);
  };

  const openEdit = (l) => {
    setEditId(l.id);
    setForm({ title: l.title, content: l.content || '', lesson_order: l.lesson_order });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await lessonService.update(editId, form);
        setMsg('Cập nhật bài học thành công');
      } else {
        await lessonService.create({ ...form, course_id: Number(courseId) });
        setMsg('Thêm bài học thành công');
      }
      setShowModal(false);
      load();
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setMsg(err.response?.data?.message || 'Lỗi');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await lessonService.remove(deleteId);
      setMsg('Xóa thành công');
      setDeleteId(null);
      load();
      setTimeout(() => setMsg(''), 3000);
    } catch (e) { setMsg(e.response?.data?.message || 'Lỗi xóa'); setDeleteId(null); }
  };

  if (loading) return <div className="loading">Đang tải...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Quản lý bài học (Khóa #{courseId})</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={openCreate}>+ Thêm bài học</button>
          <Link to="/lecturer/courses" className="btn btn-outline">← Quay lại</Link>
        </div>
      </div>
      {msg && <div className="alert alert-success">{msg}</div>}

      {/* MODAL thêm/sửa bài học */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editId ? 'Sửa bài học' : 'Thêm bài học mới'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
                <div className="form-group"><label>Tiêu đề *</label>
                  <input className="form-control" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
                <div className="form-group"><label>Thứ tự</label>
                  <input type="number" className="form-control" value={form.lesson_order} onChange={(e) => setForm({ ...form, lesson_order: Number(e.target.value) })} min={1} /></div>
              </div>
              <div className="form-group"><label>Nội dung</label>
                <textarea className="form-control" rows={8} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">{editId ? 'Cập nhật' : 'Thêm bài học'}</button>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        show={!!deleteId}
        title="Xóa bài học"
        message="Bạn có chắc chắn muốn xóa bài học này không? Thao tác này không thể hoàn tác."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />

      <div className="table-container">
        <table>
          <thead><tr><th>STT</th><th>Tiêu đề</th><th>Ngày tạo</th><th>Thao tác</th></tr></thead>
          <tbody>
            {lessons.map((l) => (
              <tr key={l.id}>
                <td>{l.lesson_order}</td>
                <td><strong>{l.title}</strong></td>
                <td>{new Date(l.created_at).toLocaleDateString('vi-VN')}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-outline btn-sm" onClick={() => openEdit(l)}>Sửa</button>
                    <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(l.id)}>Xóa</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {lessons.length === 0 && <p style={{ color: 'var(--text-secondary)', marginTop: 20 }}>Chưa có bài học nào.</p>}
    </div>
  );
}
