import { useState, useEffect } from 'react';
import { paymentService } from '../../services/enrollment.service';
import { FiSearch, FiX } from 'react-icons/fi';

export default function PaymentHistoryPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await paymentService.getAllPayments(statusFilter || undefined);
        setPayments(res.data.data || []);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [statusFilter]);

  const filtered = search.trim()
    ? payments.filter(p =>
        p.user_name?.toLowerCase().includes(search.toLowerCase()) ||
        p.user_email?.toLowerCase().includes(search.toLowerCase()) ||
        p.course_title?.toLowerCase().includes(search.toLowerCase())
      )
    : payments;

  const totalRevenue = filtered
    .filter(p => p.payment_status === 'completed')
    .reduce((s, p) => s + Number(p.total_amount), 0);

  const statusLabel = (s) => {
    switch (s) {
      case 'completed': return 'Đã thanh toán';
      case 'pending': return 'Chờ thanh toán';
      case 'cancelled': return 'Đã hủy';
      default: return s;
    }
  };

  const statusBadge = (s) => {
    switch (s) {
      case 'completed': return 'badge-success';
      case 'pending': return 'badge-warning';
      case 'cancelled': return 'badge-danger';
      default: return '';
    }
  };

  return (
    <div>
      <div className="page-header"><h1>Lịch sử thanh toán</h1></div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#eef2ff', color: '#4f46e5' }}>💳</div>
          <div className="stat-info"><h3>{payments.length}</h3><p>Tổng giao dịch</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}>✅</div>
          <div className="stat-info"><h3>{payments.filter(p => p.payment_status === 'completed').length}</h3><p>Đã thanh toán</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fffbeb', color: '#d97706' }}>⏳</div>
          <div className="stat-info"><h3>{payments.filter(p => p.payment_status === 'pending').length}</h3><p>Chờ xử lý</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fce7f3', color: '#db2777' }}>💰</div>
          <div className="stat-info"><h3>{totalRevenue.toLocaleString('vi-VN')}đ</h3><p>Tổng doanh thu</p></div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'end' }}>
        <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
          <label>Tìm kiếm</label>
          <div style={{ position: 'relative' }}>
            <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="form-control" style={{ paddingLeft: 36 }} placeholder="Tìm theo tên, email, khóa học..."
              value={search} onChange={(e) => setSearch(e.target.value)} />
            {search && <button type="button" onClick={() => setSearch('')}
              style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><FiX size={16} /></button>}
          </div>
        </div>
        <div className="form-group" style={{ width: 180, marginBottom: 0 }}>
          <label>Trạng thái</label>
          <select className="form-control" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Tất cả</option>
            <option value="completed">Đã thanh toán</option>
            <option value="pending">Chờ thanh toán</option>
            <option value="cancelled">Đã hủy</option>
          </select>
        </div>
      </div>

      {loading ? <div className="loading">Đang tải...</div> : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Học viên</th>
                <th>Email</th>
                <th>Khóa học</th>
                <th>Số tiền</th>
                <th>Phương thức</th>
                <th>Trạng thái</th>
                <th>Ngày TT</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td>#{p.id}</td>
                  <td><strong>{p.user_name}</strong></td>
                  <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{p.user_email}</td>
                  <td>{p.course_title || '—'}</td>
                  <td style={{ fontWeight: 700 }}>{Number(p.total_amount).toLocaleString('vi-VN')}đ</td>
                  <td>{p.payment_method === 'bank_transfer' ? '🏦 CK' : p.payment_method === 'free' ? '🎁 Miễn phí' : p.payment_method}</td>
                  <td><span className={`badge ${statusBadge(p.payment_status)}`}>{statusLabel(p.payment_status)}</span></td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {p.paid_at ? new Date(p.paid_at).toLocaleString('vi-VN') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!loading && filtered.length === 0 && <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 40 }}>Không có giao dịch nào.</p>}
    </div>
  );
}
