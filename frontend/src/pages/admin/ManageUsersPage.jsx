import { useEffect, useState } from 'react';
import { userService } from '../../services/user.service';
import ConfirmModal from '../../components/ConfirmModal';
import { FiPlus, FiSearch, FiX } from 'react-icons/fi';

const initialLecturerForm = {
  full_name: '',
  email: '',
  password: '',
  status: 'active',
};

export default function ManageUsersPage() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(initialLecturerForm);
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({ full_name: '', email: '', status: 'active' });
  const [msg, setMsg] = useState({ text: '', type: 'success' });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [confirmLock, setConfirmLock] = useState(null);

  const load = async (p = page) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 10 };
      if (search.trim()) params.search = search.trim();
      if (roleFilter) params.role = roleFilter;
      const res = await userService.getAll(params);
      setUsers(res.data.data || []);
      setPagination(res.data.pagination || {});
    } catch (e) {
      setMsg({ text: e.response?.data?.message || 'Không tải được danh sách người dùng', type: 'error' });
    }
    setLoading(false);
  };

  useEffect(() => { load(page); }, [page]);

  useEffect(() => {
    if (!search && !roleFilter) load(1);
  }, [search, roleFilter]);

  const showMessage = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: 'success' }), 3000);
  };

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

  const openCreate = () => {
    setCreateForm(initialLecturerForm);
    setShowCreate(true);
  };

  const handleCreateLecturer = async (e) => {
    e.preventDefault();
    try {
      await userService.createLecturer(createForm);
      setShowCreate(false);
      setRoleFilter('lecturer');
      setPage(1);
      showMessage('Tạo tài khoản giáo viên thành công');
      load(1);
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Không tạo được tài khoản giáo viên', type: 'error' });
    }
  };

  const handleEdit = (user) => {
    setEditUser(user.id);
    setEditForm({
      full_name: user.full_name,
      email: user.email,
      status: user.status,
    });
  };

  const handleSave = async () => {
    try {
      await userService.update(editUser, editForm);
      setEditUser(null);
      showMessage('Cập nhật người dùng thành công');
      load();
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Lỗi cập nhật', type: 'error' });
    }
  };

  const handleLock = async () => {
    if (!confirmLock) return;
    try {
      await userService.remove(confirmLock);
      setConfirmLock(null);
      showMessage('Khóa tài khoản thành công');
      load();
    } catch (err) {
      setConfirmLock(null);
      setMsg({ text: err.response?.data?.message || 'Không khóa được tài khoản', type: 'error' });
    }
  };

  const roleMap = { lecturer: 'Giáo viên', student: 'Học viên' };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Quản lý người dùng</h1>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <FiPlus /> Thêm giáo viên
        </button>
      </div>

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
        <div className="form-group" style={{ width: 180, marginBottom: 0 }}>
          <label>Vai trò</label>
          <select className="form-control" value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}>
            <option value="">Tất cả</option>
            <option value="lecturer">Giáo viên</option>
            <option value="student">Học viên</option>
          </select>
        </div>
        <button type="submit" className="btn btn-primary" style={{ height: 44 }}>Tìm kiếm</button>
      </form>

      {msg.text && (
        <div className={`alert ${msg.type === 'success' ? 'alert-success' : 'alert-danger'}`}>
          {msg.text}
        </div>
      )}

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <form className="modal-content" onSubmit={handleCreateLecturer} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Thêm giáo viên</h3>
              <button type="button" className="modal-close" onClick={() => setShowCreate(false)}>×</button>
            </div>
            <div className="form-group">
              <label>Họ tên</label>
              <input
                className="form-control"
                value={createForm.full_name}
                onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                className="form-control"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Mật khẩu</label>
              <input
                type="password"
                className="form-control"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                minLength={6}
                required
              />
            </div>
            <div className="form-group">
              <label>Trạng thái</label>
              <select className="form-control" value={createForm.status} onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}>
                <option value="active">Hoạt động</option>
                <option value="locked">Khóa</option>
              </select>
            </div>
            <div className="modal-actions">
              <button className="btn btn-primary" type="submit">Tạo giáo viên</button>
              <button className="btn btn-outline" type="button" onClick={() => setShowCreate(false)}>Hủy</button>
            </div>
          </form>
        </div>
      )}

      {editUser && (
        <div className="modal-overlay" onClick={() => setEditUser(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Chỉnh sửa người dùng #{editUser}</h3>
              <button className="modal-close" onClick={() => setEditUser(null)}>×</button>
            </div>
            <div className="form-group">
              <label>Họ tên</label>
              <input className="form-control" value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input className="form-control" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Trạng thái</label>
              <select className="form-control" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                <option value="active">Hoạt động</option>
                <option value="locked">Khóa</option>
              </select>
            </div>
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={handleSave}>Lưu thay đổi</button>
              <button className="btn btn-outline" onClick={() => setEditUser(null)}>Hủy</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        show={!!confirmLock}
        title="Khóa tài khoản"
        message="Bạn có chắc chắn muốn khóa tài khoản này? Người dùng sẽ không thể đăng nhập sau khi bị khóa."
        onConfirm={handleLock}
        onCancel={() => setConfirmLock(null)}
      />

      {loading ? <div className="loading">Đang tải...</div> : (
        <>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Họ tên</th>
                  <th>Email</th>
                  <th>Vai trò</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td><strong>{user.full_name}</strong></td>
                    <td>{user.email}</td>
                    <td><span className="badge badge-primary">{roleMap[user.role_name] || user.role_name}</span></td>
                    <td>
                      <span className={`badge ${user.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                        {user.status === 'active' ? 'Hoạt động' : 'Khóa'}
                      </span>
                    </td>
                    <td>{new Date(user.created_at).toLocaleDateString('vi-VN')}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-outline btn-sm" onClick={() => handleEdit(user)}>Sửa</button>
                        {user.status === 'active' && (
                          <button className="btn btn-danger btn-sm" onClick={() => setConfirmLock(user.id)}>Khóa</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {users.length === 0 && (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 40 }}>
              Không tìm thấy người dùng nào.
            </p>
          )}
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
