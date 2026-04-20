import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { courseService } from '../../services/course.service';

export default function CourseFormPage() {
  const { courseId } = useParams();
  const isEdit = !!courseId;
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', price: 0, status: 'draft' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit) {
      courseService.getById(courseId).then((res) => {
        const c = res.data.data;
        setForm({ title: c.title, description: c.description || '', price: c.price, status: c.status });
      });
    }
  }, [courseId, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isEdit) {
        await courseService.update(courseId, form);
      } else {
        await courseService.create(form);
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

      <div className="card" style={{ maxWidth: 600 }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Tên khóa học *</label>
            <input className="form-control" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Mô tả</label>
            <textarea className="form-control" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Học phí (VND)</label>
            <input type="number" className="form-control" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} min={0} />
          </div>
          <div className="form-group">
            <label>Trạng thái</label>
            <select className="form-control" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="draft">Bản nháp</option>
              <option value="published">Xuất bản</option>
            </select>
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
