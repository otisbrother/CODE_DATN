import { useState, useEffect } from 'react';
import { aiService } from '../../services/ai.service';
import { courseService } from '../../services/course.service';
import useAuthStore from '../../store/auth.store';

export default function ManageAIDataPage() {
  const { user } = useAuthStore();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [aiData, setAiData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ content: '', file_name: '' });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    courseService.getAll({ lecturer_id: user.id }).then((res) => {
      const c = res.data.data || [];
      setCourses(c);
      if (c.length > 0) setSelectedCourse(c[0].id);
      setLoading(false);
    });
  }, [user.id]);

  useEffect(() => {
    if (selectedCourse) {
      aiService.getDataByCourse(selectedCourse).then((res) => setAiData(res.data.data || []));
    }
  }, [selectedCourse]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await aiService.uploadData({
        course_id: Number(selectedCourse),
        file_name: form.file_name || 'text_content.txt',
        file_type: 'text',
        content: form.content,
      });
      setMsg('Gửi dữ liệu AI thành công, đang chờ admin duyệt');
      setShowModal(false);
      setForm({ content: '', file_name: '' });
      const res = await aiService.getDataByCourse(selectedCourse);
      setAiData(res.data.data || []);
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setMsg(err.response?.data?.message || 'Lỗi gửi dữ liệu');
    }
  };

  if (loading) return <div className="loading">Đang tải...</div>;

  return (
    <div>
      <div className="page-header"><h1>Quản lý dữ liệu AI</h1></div>
      {msg && <div className="alert alert-success">{msg}</div>}

      <div style={{ display: 'flex', alignItems: 'end', gap: 16, marginBottom: 20 }}>
        <div className="form-group" style={{ maxWidth: 300, marginBottom: 0 }}>
          <label>Chọn khóa học</label>
          <select className="form-control" value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowModal(true); setForm({ content: '', file_name: '' }); }}>
          + Gửi dữ liệu AI
        </button>
      </div>

      {/* MODAL gửi dữ liệu AI */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Gửi dữ liệu AI mới</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group"><label>Tên file</label>
                <input className="form-control" placeholder="vd: bai_giang_html.txt" value={form.file_name} onChange={(e) => setForm({ ...form, file_name: e.target.value })} /></div>
              <div className="form-group"><label>Nội dung dữ liệu *</label>
                <textarea className="form-control" rows={8} placeholder="Nhập nội dung bài giảng, tài liệu... để AI sử dụng cho hỏi đáp"
                  value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required /></div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">Gửi chờ duyệt</button>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="table-container">
        <table>
          <thead><tr><th>ID</th><th>Tên file</th><th>Loại</th><th>Trạng thái</th><th>Người tải</th></tr></thead>
          <tbody>
            {aiData.map((d) => (
              <tr key={d.id}>
                <td>{d.id}</td>
                <td>{d.file_name}</td>
                <td>{d.file_type}</td>
                <td>
                  <span className={`badge ${d.status === 'approved' ? 'badge-success' : d.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>
                    {d.status === 'approved' ? 'Đã duyệt' : d.status === 'rejected' ? 'Từ chối' : 'Chờ duyệt'}
                  </span>
                </td>
                <td>{d.uploader_name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {aiData.length === 0 && <p style={{ color: 'var(--text-secondary)', marginTop: 20 }}>Chưa có dữ liệu AI cho khóa học này.</p>}
    </div>
  );
}
