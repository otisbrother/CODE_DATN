import { useState, useEffect } from 'react';
import { userService } from '../../services/user.service';
import ConfirmModal from '../../components/ConfirmModal';
import { FiSearch, FiX } from 'react-icons/fi';

export default function ManageUsersPage() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({ full_name: '', email: '', role_id: 3, status: 'active' });
  const [msg, setMsg] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = async (p = page) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 10 };
      if (search.trim()) params.search = search.trim();
      if (roleFilter) params.role = roleFilter;
      const res = await userService.getAll(params);
      setUsers(res.data.data || []);
      setPagination(res.data.pagination || {});
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(page); }, [page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    load(1);
  };

  const clearSearch = () => {
    setSearch('');
    setRoleFilter('');
    setPage(1);
    setTimeout(() => load(1), 0);
  };

  useEffect(() => {
    if (!search && !roleFilter) load(1);
  }, [search, roleFilter]);

  const handleEdit = (u) => {
    setEditUser(u.id);
    setEditForm({ full_name: u.full_name, email: u.email, role_id: u.role_id || 3, status: u.status });
  };

  const handleSave = async () => {
    try {
      await userService.update(editUser, editForm);
      setMsg('Cập nhật thành công');
      setEditUser(null);
      load();
      setTimeout(() => setMsg(''), 3000);
    } catch (e) { setMsg(e.response?.data?.message || 'Lỗi cập nhật'); }
  };

  const handleLock = async () => {
    if (!confirmDelete) return;
    try {
      await userService.remove(confirmDelete);
      setMsg('Khóa tài khoản thành công');
      setConfirmDelete(null);
      load();
      setTimeout(() => setMsg(''), 3000);
    } catch (e) { setMsg(e.response?.data?.message || 'Lỗi'); setConfirmDelete(null); }
  };

  const roleMap = { admin: 'Admin', lecturer: 'Giảng viên', student: 'Học viên' };

  return (
    <div>
      <div className="page-header"><h1>Quản lý người dùng</h1></div>

      {/* Thanh tìm kiếm */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'end' }}>
        <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
          <label>Tìm kiếm</label>
          <div style={{ position: 'relative' }}>
            <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="form-control"
              style={{ paddingLeft: 36 }}
              placeholder="Tìm theo tên hoặc email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button type="button" onClick={clearSearch}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <FiX size={16} />
              </button>
            )}
          </div>
        </div>
        <div className="form-group" style={{ width: 160, marginBottom: 0 }}>
          <label>Vai trò</label>
          <select className="form-control" value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}>
            <option value="">Tất cả</option>
            <option value="admin">Admin</option>
            <option value="lecturer">Giảng viên</option>
            <option value="student">Học viên</option>
          </select>
        </div>
        <button type="submit" className="btn btn-primary" style={{ height: 44 }}>Tìm kiếm</button>
      </form>

      {msg && <div className="alert alert-success">{msg}</div>}

      {/* MODAL chỉnh sửa người dùng */}
      {editUser && (
        <div className="modal-overlay" onClick={() => setEditUser(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Chỉnh sửa người dùng #{editUser}</h3>
              <button className="modal-close" onClick={() => setEditUser(null)}>×</button>
            </div>
            <div className="form-group"><label>Họ tên</label>
              <input className="form-control" value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} /></div>
            <div className="form-group"><label>Email</label>
              <input className="form-control" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group"><label>Vai trò</label>
                <select className="form-control" value={editForm.role_id} onChange={(e) => setEditForm({ ...editForm, role_id: Number(e.target.value) })}>
                  <option value={1}>Admin</option><option value={2}>Giảng viên</option><option value={3}>Học viên</option>
                </select></div>
              <div className="form-group"><label>Trạng thái</label>
                <select className="form-control" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                  <option value="active">Hoạt động</option><option value="locked">Khóa</option>
                </select></div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={handleSave}>Lưu thay đổi</button>
              <button className="btn btn-outline" onClick={() => setEditUser(null)}>Hủy</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL xác nhận khóa tài khoản */}
      <ConfirmModal
        show={!!confirmDelete}
        title="Khóa tài khoản"
        message="Bạn có chắc chắn muốn khóa tài khoản này? Người dùng sẽ không thể đăng nhập sau khi bị khóa."
        onConfirm={handleLock}
        onCancel={() => setConfirmDelete(null)}
      />

      {loading ? <div className="loading">Đang tải...</div> : (
        <>
          <div className="table-container">
            <table>
              <thead><tr><th>ID</th><th>Họ tên</th><th>Email</th><th>Vai trò</th><th>Trạng thái</th><th>Ngày tạo</th><th>Thao tác</th></tr></thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td><strong>{u.full_name}</strong></td>
                    <td>{u.email}</td>
                    <td><span className="badge badge-primary">{roleMap[u.role_name] || u.role_name}</span></td>
                    <td><span className={`badge ${u.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                      {u.status === 'active' ? 'Hoạt động' : 'Khóa'}</span></td>
                    <td>{new Date(u.created_at).toLocaleDateString('vi-VN')}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-outline btn-sm" onClick={() => handleEdit(u)}>Sửa</button>
                        {u.status === 'active' && <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(u.id)}>Khóa</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {users.length === 0 && <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 40 }}>Không tìm thấy người dùng nào.</p>}
          {pagination.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
              <button className="btn btn-outline btn-sm" disabled={!pagination.hasPrev} onClick={() => setPage(page - 1)}>← Trước</button>
              <span style={{ padding: '6px 12px', color: 'var(--text-secondary)' }}>Trang {pagination.page}/{pagination.totalPages}</span>
              <button className="btn btn-outline btn-sm" disabled={!pagination.hasNext} onClick={() => setPage(page + 1)}>Sau →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
