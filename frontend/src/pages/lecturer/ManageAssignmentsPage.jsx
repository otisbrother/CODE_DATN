import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { assignmentService } from '../../services/assignment.service';
import ConfirmModal from '../../components/ConfirmModal';

export default function ManageAssignmentsPage() {
  const { courseId } = useParams();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', due_date: '', max_score: 10 });
  const [msg, setMsg] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  const load = async () => {
    try {
      const res = await assignmentService.getByCourse(courseId);
      setAssignments(res.data.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [courseId]);

  const openCreate = () => {
    setEditId(null);
    setForm({ title: '', description: '', due_date: '', max_score: 10 });
    setShowModal(true);
  };

  const openEdit = (a) => {
    setEditId(a.id);
    setForm({ title: a.title, description: a.description || '', due_date: a.due_date ? a.due_date.substring(0, 16) : '', max_score: a.max_score });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await assignmentService.update(editId, form);
        setMsg('Cập nhật bài tập thành công');
      } else {
        await assignmentService.create({ ...form, course_id: Number(courseId) });
        setMsg('Thêm bài tập thành công');
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
      await assignmentService.remove(deleteId);
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
        <h1>Bài tập & Kiểm tra (Khóa #{courseId})</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={openCreate}>+ Thêm bài tập</button>
          <Link to="/lecturer/courses" className="btn btn-outline">← Quay lại</Link>
        </div>
      </div>
      {msg && <div className="alert alert-success">{msg}</div>}

      {/* MODAL thêm/sửa bài tập */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editId ? 'Sửa bài tập' : 'Thêm bài tập mới'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group"><label>Tiêu đề *</label>
                <input className="form-control" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
              <div className="form-group"><label>Mô tả</label>
                <textarea className="form-control" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group"><label>Hạn nộp</label>
                  <input type="datetime-local" className="form-control" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
                <div className="form-group"><label>Điểm tối đa</label>
                  <input type="number" className="form-control" value={form.max_score} onChange={(e) => setForm({ ...form, max_score: Number(e.target.value) })} /></div>
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">{editId ? 'Cập nhật' : 'Thêm bài tập'}</button>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        show={!!deleteId}
        title="Xóa bài tập"
        message="Bạn có chắc chắn muốn xóa bài tập này không? Tất cả bài nộp liên quan cũng sẽ bị xóa."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />

      <div className="table-container">
        <table>
          <thead><tr><th>ID</th><th>Tiêu đề</th><th>Điểm</th><th>Hạn nộp</th><th>Thao tác</th></tr></thead>
          <tbody>
            {assignments.map((a) => (
              <tr key={a.id}>
                <td>{a.id}</td>
                <td><strong>{a.title}</strong></td>
                <td>{a.max_score}</td>
                <td>{a.due_date ? new Date(a.due_date).toLocaleDateString('vi-VN') : '-'}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-outline btn-sm" onClick={() => openEdit(a)}>Sửa</button>
                    <Link to={`/lecturer/assignments/${a.id}/grade`} className="btn btn-primary btn-sm">Chấm điểm</Link>
                    <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(a.id)}>Xóa</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {assignments.length === 0 && <p style={{ color: 'var(--text-secondary)', marginTop: 20 }}>Chưa có bài tập.</p>}
    </div>
  );
}
