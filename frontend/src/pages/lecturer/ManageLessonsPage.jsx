import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { lessonService } from '../../services/lesson.service';
import { sectionService } from '../../services/section.service';
import ConfirmModal from '../../components/ConfirmModal';

const API_URL = 'http://localhost:5000';

export default function ManageLessonsPage() {
  const { courseId } = useParams();
  const [lessons, setLessons] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editSectionId, setEditSectionId] = useState(null);
  const [form, setForm] = useState({ title: '', content: '', section_id: '', duration_seconds: '', is_preview: 0, status: 'active', lesson_order: 1 });
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState('');
  const [sectionForm, setSectionForm] = useState({ title: '', description: '', section_order: 1, is_preview: 0 });
  const [msg, setMsg] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [deleteSectionId, setDeleteSectionId] = useState(null);

  const load = async () => {
    try {
      const [lRes, sRes] = await Promise.all([
        lessonService.getByCourse(courseId),
        sectionService.getByCourse(courseId),
      ]);
      setLessons(lRes.data.data || []);
      setSections(sRes.data.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [courseId]);

  // --- Section handlers ---
  const openCreateSection = () => {
    setEditSectionId(null);
    setSectionForm({ title: '', description: '', section_order: sections.length + 1, is_preview: 0 });
    setShowSectionModal(true);
  };

  const openEditSection = (s) => {
    setEditSectionId(s.id);
    setSectionForm({ title: s.title, description: s.description || '', section_order: s.section_order, is_preview: s.is_preview });
    setShowSectionModal(true);
  };

  const handleSectionSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editSectionId) {
        await sectionService.update(editSectionId, sectionForm);
        setMsg('Cập nhật chương thành công');
      } else {
        await sectionService.create({ ...sectionForm, course_id: Number(courseId) });
        setMsg('Thêm chương thành công');
      }
      setShowSectionModal(false);
      load();
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setMsg(err.response?.data?.message || 'Lỗi');
    }
  };

  const handleDeleteSection = async () => {
    if (!deleteSectionId) return;
    try {
      await sectionService.remove(deleteSectionId);
      setMsg('Xóa chương thành công');
      setDeleteSectionId(null);
      load();
      setTimeout(() => setMsg(''), 3000);
    } catch (e) { setMsg(e.response?.data?.message || 'Lỗi xóa chương'); setDeleteSectionId(null); }
  };

  // --- Lesson handlers ---
  const openCreate = (sectionId) => {
    const sectionLessons = lessons.filter(l => l.section_id === sectionId);
    setEditId(null);
    setForm({ title: '', content: '', section_id: sectionId, duration_seconds: '', is_preview: 0, status: 'active', lesson_order: sectionLessons.length + 1 });
    setVideoFile(null);
    setVideoPreview('');
    setShowModal(true);
  };

  const openEdit = (l) => {
    setEditId(l.id);
    setForm({
      title: l.title,
      content: l.content || '',
      section_id: l.section_id,
      duration_seconds: l.duration_seconds || '',
      is_preview: l.is_preview,
      status: l.status || 'active',
      lesson_order: l.lesson_order,
    });
    setVideoFile(null);
    setVideoPreview(l.video_url ? `${API_URL}${l.video_url}` : '');
    setShowModal(true);
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('content', form.content);
      formData.append('section_id', form.section_id);
      formData.append('lesson_order', form.lesson_order);
      formData.append('is_preview', form.is_preview);
      formData.append('status', form.status);
      if (form.duration_seconds) formData.append('duration_seconds', form.duration_seconds);
      if (videoFile) formData.append('video', videoFile);

      if (editId) {
        await lessonService.update(editId, formData);
        setMsg('Cập nhật bài học thành công');
      } else {
        formData.append('course_id', courseId);
        await lessonService.create(formData);
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
          <button className="btn btn-primary" onClick={openCreateSection}>+ Thêm chương</button>
          <Link to="/lecturer/courses" className="btn btn-outline">← Quay lại</Link>
        </div>
      </div>
      {msg && <div className="alert alert-success">{msg}</div>}

      {/* MODAL thêm/sửa chương */}
      {showSectionModal && (
        <div className="modal-overlay" onClick={() => setShowSectionModal(false)}>
          <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editSectionId ? 'Sửa chương' : 'Thêm chương mới'}</h3>
              <button className="modal-close" onClick={() => setShowSectionModal(false)}>×</button>
            </div>
            <form onSubmit={handleSectionSubmit}>
              <div className="form-group"><label>Tên chương *</label>
                <input className="form-control" value={sectionForm.title} onChange={(e) => setSectionForm({ ...sectionForm, title: e.target.value })} required /></div>
              <div className="form-group"><label>Mô tả</label>
                <textarea className="form-control" rows={2} value={sectionForm.description} onChange={(e) => setSectionForm({ ...sectionForm, description: e.target.value })} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group"><label>Thứ tự</label>
                  <input type="number" className="form-control" value={sectionForm.section_order} onChange={(e) => setSectionForm({ ...sectionForm, section_order: Number(e.target.value) })} min={1} /></div>
                <div className="form-group"><label>Cho học thử</label>
                  <select className="form-control" value={sectionForm.is_preview} onChange={(e) => setSectionForm({ ...sectionForm, is_preview: Number(e.target.value) })}>
                    <option value={0}>Không</option><option value={1}>Có</option>
                  </select></div>
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">{editSectionId ? 'Cập nhật' : 'Thêm chương'}</button>
                <button type="button" className="btn btn-outline" onClick={() => setShowSectionModal(false)}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}

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
              <div className="form-group"><label>Chương *</label>
                <select className="form-control" value={form.section_id} onChange={(e) => setForm({ ...form, section_id: Number(e.target.value) })} required>
                  <option value="">-- Chọn chương --</option>
                  {sections.map((s) => (<option key={s.id} value={s.id}>{s.title}</option>))}
                </select></div>
              <div className="form-group"><label>Nội dung</label>
                <textarea className="form-control" rows={6} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></div>
              <div className="form-group">
                <label>Video bài học</label>
                <input type="file" className="form-control" accept="video/*" onChange={handleVideoChange} />
                {videoPreview && (
                  <video src={videoPreview} controls style={{ width: '100%', maxHeight: 200, borderRadius: 8, marginTop: 8 }} />
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                <div className="form-group"><label>Thời lượng (giây)</label>
                  <input type="number" className="form-control" value={form.duration_seconds} onChange={(e) => setForm({ ...form, duration_seconds: e.target.value })} placeholder="VD: 600" /></div>
                <div className="form-group"><label>Học thử</label>
                  <select className="form-control" value={form.is_preview} onChange={(e) => setForm({ ...form, is_preview: Number(e.target.value) })}>
                    <option value={0}>Không</option><option value={1}>Có</option>
                  </select></div>
                <div className="form-group"><label>Trạng thái</label>
                  <select className="form-control" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="active">Hoạt động</option><option value="archived">Lưu trữ</option>
                  </select></div>
              </div>
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

      <ConfirmModal
        show={!!deleteSectionId}
        title="Xóa chương"
        message="Bạn có chắc chắn muốn xóa chương này không? Tất cả bài học trong chương cũng sẽ bị xóa."
        onConfirm={handleDeleteSection}
        onCancel={() => setDeleteSectionId(null)}
      />

      {/* Hiển thị theo sections */}
      {sections.length === 0 && <p style={{ color: 'var(--text-secondary)', marginTop: 20 }}>Chưa có chương nào. Hãy thêm chương trước khi thêm bài học.</p>}

      {sections.map((section) => {
        const sectionLessons = lessons.filter(l => l.section_id === section.id);
        return (
          <div key={section.id} className="card" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0 }}>
                  {section.title}
                  {section.is_preview === 1 && <span className="badge badge-primary" style={{ marginLeft: 8, fontSize: 11 }}>Học thử</span>}
                </h3>
                {section.description && <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '4px 0 0' }}>{section.description}</p>}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-primary btn-sm" onClick={() => openCreate(section.id)}>+ Bài học</button>
                <button className="btn btn-outline btn-sm" onClick={() => openEditSection(section)}>Sửa</button>
                <button className="btn btn-danger btn-sm" onClick={() => setDeleteSectionId(section.id)}>Xóa</button>
              </div>
            </div>

            {sectionLessons.length > 0 ? (
              <div className="table-container" style={{ margin: 0 }}>
                <table>
                  <thead><tr><th>STT</th><th>Tiêu đề</th><th>Video</th><th>Học thử</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
                  <tbody>
                    {sectionLessons.map((l) => (
                      <tr key={l.id}>
                        <td>{l.lesson_order}</td>
                        <td><strong>{l.title}</strong></td>
                        <td>{l.video_url ? '🎥 Có' : '-'}</td>
                        <td>{l.is_preview ? <span className="badge badge-primary">Có</span> : '-'}</td>
                        <td><span className={`badge ${l.status === 'active' ? 'badge-success' : 'badge-warning'}`}>{l.status === 'active' ? 'Hoạt động' : 'Lưu trữ'}</span></td>
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
            ) : (
              <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Chưa có bài học trong chương này.</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
