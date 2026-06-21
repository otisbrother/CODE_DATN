import { useEffect, useState } from 'react';
import { FiEdit2, FiPlus, FiSearch, FiTag, FiTrash2, FiX } from 'react-icons/fi';
import { courseService } from '../../services/course.service';
import { voucherService } from '../../services/voucher.service';

const emptyForm = {
  name: '',
  code: '',
  mode: 'event',
  description: '',
  status: 'active',
  min_order_amount: '',
  new_student_days: 30,
  starts_at: '',
  ends_at: '',
  course_discounts: [],
};

const modeLabel = (mode) => {
  switch (mode) {
    case 'event': return 'Tri ân sự kiện';
    case 'new_student': return 'Học viên mới đăng ký';
    case 'min_purchase': return 'Mua khóa trên ngưỡng';
    default: return mode;
  }
};

const statusLabel = (status) => status === 'active' ? 'Đang bật' : 'Đã tắt';
const statusBadge = (status) => status === 'active' ? 'badge-success' : 'badge-secondary';

const toDateTimeLocal = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

export default function ManageVouchersPage() {
  const [vouchers, setVouchers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [filters, setFilters] = useState({ search: '', mode: '', status: '' });
  const [msg, setMsg] = useState({ text: '', type: 'success' });

  const load = async () => {
    setLoading(true);
    try {
      const [voucherRes, courseRes] = await Promise.all([
        voucherService.getAll({
          search: filters.search || undefined,
          mode: filters.mode || undefined,
          status: filters.status || undefined,
        }),
        courseService.getAll({ limit: 100 }),
      ]);
      setVouchers(voucherRes.data.data || []);
      setCourses(courseRes.data.data || []);
    } catch (e) {
      setMsg({ text: e.response?.data?.message || 'Không tải được dữ liệu voucher', type: 'error' });
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = async (voucher) => {
    try {
      const res = await voucherService.getById(voucher.id);
      const data = res.data.data;
      setEditing(data);
      setForm({
        name: data.name || '',
        code: data.code || '',
        mode: data.mode || 'event',
        description: data.description || '',
        status: data.status || 'active',
        min_order_amount: data.min_order_amount || '',
        new_student_days: data.new_student_days || 30,
        starts_at: toDateTimeLocal(data.starts_at),
        ends_at: toDateTimeLocal(data.ends_at),
        course_discounts: (data.course_discounts || []).map((item) => ({
          course_id: Number(item.course_id),
          discount_percent: Number(item.discount_percent),
          max_discount_amount: item.max_discount_amount || '',
        })),
      });
      setShowForm(true);
    } catch (e) {
      setMsg({ text: e.response?.data?.message || 'Không mở được voucher', type: 'error' });
    }
  };

  const addCourseDiscount = () => {
    const selected = new Set(form.course_discounts.map((item) => Number(item.course_id)));
    const course = courses.find((item) => !selected.has(Number(item.id)));
    if (!course) return;
    setForm((prev) => ({
      ...prev,
      course_discounts: [
        ...prev.course_discounts,
        { course_id: Number(course.id), discount_percent: 10, max_discount_amount: '' },
      ],
    }));
  };

  const updateCourseDiscount = (index, key, value) => {
    setForm((prev) => ({
      ...prev,
      course_discounts: prev.course_discounts.map((item, i) => (
        i === index ? { ...item, [key]: key === 'course_id' ? Number(value) : value } : item
      )),
    }));
  };

  const removeCourseDiscount = (index) => {
    setForm((prev) => ({
      ...prev,
      course_discounts: prev.course_discounts.filter((_, i) => i !== index),
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg({ text: '', type: 'success' });
    try {
      const payload = {
        ...form,
        code: form.code.toUpperCase(),
        min_order_amount: form.mode === 'min_purchase' ? form.min_order_amount : null,
        new_student_days: form.mode === 'new_student' ? form.new_student_days : null,
      };
      if (editing) {
        await voucherService.update(editing.id, payload);
        setMsg({ text: 'Cập nhật voucher thành công', type: 'success' });
      } else {
        await voucherService.create(payload);
        setMsg({ text: 'Tạo voucher thành công', type: 'success' });
      }
      setShowForm(false);
      await load();
      setTimeout(() => setMsg({ text: '', type: 'success' }), 3000);
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Lỗi lưu voucher', type: 'error' });
    }
    setSaving(false);
  };

  const deactivate = async (voucher) => {
    if (!window.confirm(`Tắt voucher ${voucher.code}?`)) return;
    try {
      await voucherService.remove(voucher.id);
      setMsg({ text: 'Đã tắt voucher', type: 'success' });
      load();
    } catch (e) {
      setMsg({ text: e.response?.data?.message || 'Không tắt được voucher', type: 'error' });
    }
  };

  const totalActive = vouchers.filter((item) => item.status === 'active').length;

  return (
    <div>
      <div className="page-header">
        <h1>Quản lý voucher khóa học</h1>
        <button className="btn btn-primary" onClick={openCreate}><FiPlus /> Tạo voucher</button>
      </div>

      {msg.text && (
        <div className={`alert ${msg.type === 'error' ? 'alert-error' : 'alert-success'}`}>{msg.text}</div>
      )}

      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#e0f2fe', color: '#0369a1' }}><FiTag /></div>
          <div className="stat-info"><h3>{vouchers.length}</h3><p>Tổng chương trình</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#dcfce7', color: '#15803d' }}>%</div>
          <div className="stat-info"><h3>{totalActive}</h3><p>Đang hoạt động</p></div>
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); load(); }} style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'end', flexWrap: 'wrap' }}>
        <div className="form-group" style={{ flex: '1 1 260px', marginBottom: 0 }}>
          <label>Tìm kiếm</label>
          <div style={{ position: 'relative' }}>
            <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="form-control"
              style={{ paddingLeft: 36 }}
              placeholder="Tên chương trình hoặc mã voucher..."
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            />
            {filters.search && (
              <button type="button" onClick={() => setFilters((prev) => ({ ...prev, search: '' }))}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <FiX size={16} />
              </button>
            )}
          </div>
        </div>
        <div className="form-group" style={{ width: 210, marginBottom: 0 }}>
          <label>Chế độ</label>
          <select className="form-control" value={filters.mode} onChange={(e) => setFilters((prev) => ({ ...prev, mode: e.target.value }))}>
            <option value="">Tất cả</option>
            <option value="event">Tri ân sự kiện</option>
            <option value="new_student">Học viên mới</option>
            <option value="min_purchase">Mua khóa trên ngưỡng</option>
          </select>
        </div>
        <div className="form-group" style={{ width: 150, marginBottom: 0 }}>
          <label>Trạng thái</label>
          <select className="form-control" value={filters.status} onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}>
            <option value="">Tất cả</option>
            <option value="active">Đang bật</option>
            <option value="inactive">Đã tắt</option>
          </select>
        </div>
        <button className="btn btn-primary" type="submit" style={{ height: 44 }}>Lọc</button>
      </form>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? 'Sửa voucher' : 'Tạo voucher mới'}</h3>
              <button className="modal-close" onClick={() => setShowForm(false)}>×</button>
            </div>

            <form onSubmit={submit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: 12 }}>
                <div className="form-group">
                  <label>Tên chương trình</label>
                  <input className="form-control" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label>Mã voucher</label>
                  <input className="form-control" value={form.code} onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: 12 }}>
                <div className="form-group">
                  <label>Chế độ áp dụng</label>
                  <select className="form-control" value={form.mode} onChange={(e) => setForm((prev) => ({ ...prev, mode: e.target.value }))}>
                    <option value="event">Tri ân sự kiện</option>
                    <option value="new_student">Học viên mới đăng ký</option>
                    <option value="min_purchase">Người mua khóa học trên xxxK</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Trạng thái</label>
                  <select className="form-control" value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}>
                    <option value="active">Đang bật</option>
                    <option value="inactive">Tạm tắt</option>
                  </select>
                </div>
              </div>

              {form.mode === 'min_purchase' && (
                <div className="form-group">
                  <label>Chỉ áp dụng khi học phí khóa học từ</label>
                  <input type="number" min="0" className="form-control" value={form.min_order_amount}
                    onChange={(e) => setForm((prev) => ({ ...prev, min_order_amount: e.target.value }))} required />
                </div>
              )}

              {form.mode === 'new_student' && (
                <div className="form-group">
                  <label>Học viên đăng ký trong vòng số ngày</label>
                  <input type="number" min="1" className="form-control" value={form.new_student_days}
                    onChange={(e) => setForm((prev) => ({ ...prev, new_student_days: e.target.value }))} required />
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label>Ngày bắt đầu</label>
                  <input type="datetime-local" className="form-control" value={form.starts_at}
                    onChange={(e) => setForm((prev) => ({ ...prev, starts_at: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Ngày kết thúc</label>
                  <input type="datetime-local" className="form-control" value={form.ends_at}
                    onChange={(e) => setForm((prev) => ({ ...prev, ends_at: e.target.value }))} />
                </div>
              </div>

              <div className="form-group">
                <label>Mô tả</label>
                <textarea className="form-control" value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ marginBottom: 0 }}>Khóa học áp dụng và mức giảm riêng</label>
                  <button type="button" className="btn btn-outline btn-sm" onClick={addCourseDiscount}><FiPlus /> Thêm khóa</button>
                </div>
                <div className="table-container">
                  <table>
                    <thead><tr><th>Khóa học</th><th>% giảm</th><th>Giảm tối đa</th><th></th></tr></thead>
                    <tbody>
                      {form.course_discounts.map((item, index) => (
                        <tr key={`${item.course_id}-${index}`}>
                          <td>
                            <select className="form-control" value={item.course_id} onChange={(e) => updateCourseDiscount(index, 'course_id', e.target.value)}>
                              {courses.map((course) => (
                                <option key={course.id} value={course.id}>{course.title}</option>
                              ))}
                            </select>
                          </td>
                          <td style={{ width: 110 }}>
                            <input type="number" min="1" max="100" className="form-control" value={item.discount_percent}
                              onChange={(e) => updateCourseDiscount(index, 'discount_percent', e.target.value)} required />
                          </td>
                          <td style={{ width: 160 }}>
                            <input type="number" min="0" className="form-control" placeholder="Không giới hạn" value={item.max_discount_amount}
                              onChange={(e) => updateCourseDiscount(index, 'max_discount_amount', e.target.value)} />
                          </td>
                          <td style={{ width: 54 }}>
                            <button type="button" className="btn btn-outline btn-sm" onClick={() => removeCourseDiscount(index)}><FiTrash2 /></button>
                          </td>
                        </tr>
                      ))}
                      {form.course_discounts.length === 0 && (
                        <tr><td colSpan="4" style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Chưa chọn khóa học nào</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="modal-actions">
                <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu voucher'}</button>
                <button className="btn btn-outline" type="button" onClick={() => setShowForm(false)}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? <div className="loading">Đang tải...</div> : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Mã</th>
                <th>Chương trình</th>
                <th>Chế độ</th>
                <th>Khóa áp dụng</th>
                <th>Mức giảm</th>
                <th>Thời gian</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {vouchers.map((voucher) => (
                <tr key={voucher.id}>
                  <td><strong>{voucher.code}</strong></td>
                  <td>{voucher.name}</td>
                  <td>{modeLabel(voucher.mode)}</td>
                  <td>{voucher.course_count || 0} khóa</td>
                  <td>
                    {Number(voucher.min_discount_percent || 0) === Number(voucher.max_discount_percent || 0)
                      ? `${Number(voucher.max_discount_percent || 0)}%`
                      : `${Number(voucher.min_discount_percent || 0)}% - ${Number(voucher.max_discount_percent || 0)}%`}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {voucher.starts_at ? new Date(voucher.starts_at).toLocaleDateString('vi-VN') : 'Không giới hạn'}
                    {' - '}
                    {voucher.ends_at ? new Date(voucher.ends_at).toLocaleDateString('vi-VN') : 'Không giới hạn'}
                  </td>
                  <td><span className={`badge ${statusBadge(voucher.status)}`}>{statusLabel(voucher.status)}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-outline btn-sm" onClick={() => openEdit(voucher)}><FiEdit2 /> Sửa</button>
                      <button className="btn btn-outline btn-sm" onClick={() => deactivate(voucher)} disabled={voucher.status !== 'active'}><FiTrash2 /> Tắt</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!loading && vouchers.length === 0 && <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 40 }}>Chưa có voucher nào.</p>}
    </div>
  );
}
