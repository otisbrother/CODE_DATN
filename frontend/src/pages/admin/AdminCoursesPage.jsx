import { useState, useEffect } from 'react';
import { courseService } from '../../services/course.service';
import { FiSearch, FiX } from 'react-icons/fi';

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editCourse, setEditCourse] = useState(null);
  const [editStatus, setEditStatus] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      const res = await courseService.getAll(params);
      setCourses(res.data.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    load();
  };

  const handleStatusChange = async () => {
    if (!editCourse) return;
    try {
      await courseService.update(editCourse.id, { status: editStatus });
      setMsg(`Cập nhật trạng thái "${editCourse.title}" thành công`);
      setEditCourse(null);
      load();
      setTimeout(() => setMsg(''), 3000);
    } catch (e) {
      setMsg(e.response?.data?.message || 'Lỗi cập nhật');
    }
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

      {/* Modal đổi trạng thái */}
      {editCourse && (
        <div className="modal-overlay" onClick={() => setEditCourse(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Đổi trạng thái khóa học</h3>
              <button className="modal-close" onClick={() => setEditCourse(null)}>×</button>
            </div>
            <p style={{ marginBottom: 12 }}><strong>{editCourse.title}</strong></p>
            <div className="form-group">
              <label>Trạng thái mới</label>
              <select className="form-control" value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                <option value="draft">Nháp</option>
                <option value="published">Xuất bản</option>
                <option value="archived">Lưu trữ</option>
              </select>
            </div>
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={handleStatusChange}>Cập nhật</button>
              <button className="btn btn-outline" onClick={() => setEditCourse(null)}>Hủy</button>
            </div>
          </div>
        </div>
      )}

      {loading ? <div className="loading">Đang tải...</div> : (
        <div className="table-container">
          <table>
            <thead><tr><th>ID</th><th>Tên khóa học</th><th>Giảng viên</th><th>Giá</th><th>Trạng thái</th><th>Ngày tạo</th><th>Thao tác</th></tr></thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id}>
                  <td>{c.id}</td>
                  <td><strong>{c.title}</strong></td>
                  <td>{c.lecturer_name}</td>
                  <td>{Number(c.price).toLocaleString('vi-VN')}đ</td>
                  <td><span className={`badge ${statusBadge(c.status)}`}>{statusLabel(c.status)}</span></td>
                  <td>{new Date(c.created_at).toLocaleDateString('vi-VN')}</td>
                  <td>
                    <button className="btn btn-outline btn-sm" onClick={() => { setEditCourse(c); setEditStatus(c.status); }}>Đổi TT</button>
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
