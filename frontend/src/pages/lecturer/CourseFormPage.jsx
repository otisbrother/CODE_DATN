import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { courseService } from '../../services/course.service';

const API_URL = 'http://localhost:5000';

export default function CourseFormPage() {
  const { courseId } = useParams();
  const isEdit = !!courseId;
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', short_description: '', price: 0, status: 'draft' });
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [introVideoFile, setIntroVideoFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [introVideoPreview, setIntroVideoPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit) {
      courseService.getById(courseId).then((res) => {
        const c = res.data.data;
        setForm({
          title: c.title,
          description: c.description || '',
          short_description: c.short_description || '',
          price: c.price,
          status: c.status,
        });
        setThumbnailPreview(c.thumbnail_url ? `${API_URL}${c.thumbnail_url}` : '');
        setIntroVideoPreview(c.intro_video_url ? `${API_URL}${c.intro_video_url}` : '');
      });
    }
  }, [courseId, isEdit]);

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
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('short_description', form.short_description);
      formData.append('price', form.price);
      formData.append('status', form.status);
      if (thumbnailFile) formData.append('thumbnail', thumbnailFile);
      if (introVideoFile) formData.append('intro_video', introVideoFile);

      if (isEdit) {
        await courseService.update(courseId, formData);
      } else {
        await courseService.create(formData);
      }
      navigate('/lecturer/courses');
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi lưu khóa học');
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="page-header">
        <h1>{isEdit ? 'Chỉnh sửa khóa học' : 'Tạo khóa học mới'}</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ maxWidth: 700 }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Tên khóa học *</label>
            <input className="form-control" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Mô tả ngắn</label>
            <input className="form-control" value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })} maxLength={300} placeholder="Mô tả ngắn gọn (tối đa 300 ký tự)" />
          </div>
          <div className="form-group">
            <label>Mô tả chi tiết</label>
            <textarea className="form-control" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label>Ảnh bìa</label>
              <input type="file" className="form-control" accept="image/*" onChange={handleThumbnailChange} />
              {thumbnailPreview && (
                <img src={thumbnailPreview} alt="Thumbnail" style={{ width: '100%', maxHeight: 150, objectFit: 'cover', borderRadius: 8, marginTop: 8 }} />
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
            <div className="form-group">
              <label>Học phí (VND)</label>
              <input type="number" className="form-control" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} min={0} />
            </div>
            <div className="form-group">
              <label>Trạng thái</label>
              <select className="form-control" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="draft">Bản nháp</option>
                <option value="published">Xuất bản</option>
                <option value="archived">Lưu trữ</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Tạo khóa học'}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => navigate('/lecturer/courses')}>Hủy</button>
          </div>
        </form>
      </div>
    </div>
  );
}
