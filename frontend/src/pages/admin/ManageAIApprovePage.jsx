import { useState, useEffect } from 'react';
import { aiService } from '../../services/ai.service';

export default function ManageAIApprovePage() {
  const [aiData, setAiData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [msg, setMsg] = useState('');
  const [viewContent, setViewContent] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await aiService.getAllData(filter || undefined);
      setAiData(res.data.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const handleApprove = async (id) => {
    try {
      await aiService.approveData(id);
      setMsg('Duyệt dữ liệu AI thành công');
      load();
    } catch (e) { setMsg(e.response?.data?.message || 'Lỗi'); }
  };

  const handleReject = async (id) => {
    if (!confirm('Từ chối dữ liệu AI này?')) return;
    try {
      await aiService.rejectData(id);
      setMsg('Từ chối dữ liệu AI thành công');
      load();
    } catch (e) { setMsg(e.response?.data?.message || 'Lỗi'); }
  };

  return (
    <div>
      <div className="page-header"><h1>Duyệt dữ liệu AI</h1></div>
      {msg && <div className="alert alert-success">{msg}</div>}

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['pending', 'approved', 'rejected', ''].map((f) => (
          <button key={f} className={`btn ${filter === f ? 'btn-primary' : 'btn-outline'} btn-sm`} onClick={() => setFilter(f)}>
            {f === 'pending' ? 'Chờ duyệt' : f === 'approved' ? 'Đã duyệt' : f === 'rejected' ? 'Từ chối' : 'Tất cả'}
          </button>
        ))}
      </div>

      {viewContent && (
        <div className="modal-overlay" onClick={() => setViewContent(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: 12 }}>Nội dung dữ liệu AI</h3>
            <div style={{ maxHeight: 300, overflow: 'auto', padding: 12, background: 'var(--bg-input)', borderRadius: 8, whiteSpace: 'pre-wrap', fontSize: 13 }}>
              {viewContent}
            </div>
            <button className="btn btn-outline" style={{ marginTop: 16 }} onClick={() => setViewContent(null)}>Đóng</button>
          </div>
        </div>
      )}

      {loading ? <div className="loading">Đang tải...</div> : (
        <div className="table-container">
          <table>
            <thead><tr><th>ID</th><th>Khóa học</th><th>Người gửi</th><th>Tên file</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
            <tbody>
              {aiData.map((d) => (
                <tr key={d.id}>
                  <td>{d.id}</td>
                  <td>{d.course_title}</td>
                  <td>{d.uploader_name}</td>
                  <td>{d.file_name}</td>
                  <td>
                    <span className={`badge ${d.status === 'approved' ? 'badge-success' : d.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>
                      {d.status === 'approved' ? 'Đã duyệt' : d.status === 'rejected' ? 'Từ chối' : 'Chờ duyệt'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {d.content && <button className="btn btn-outline btn-sm" onClick={() => setViewContent(d.content)}>Xem</button>}
                      {d.status === 'pending' && (
                        <>
                          <button className="btn btn-success btn-sm" onClick={() => handleApprove(d.id)}>Duyệt</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleReject(d.id)}>Từ chối</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {aiData.length === 0 && !loading && <p style={{ color: 'var(--text-secondary)', marginTop: 20 }}>Không có dữ liệu AI nào.</p>}
    </div>
  );
}
