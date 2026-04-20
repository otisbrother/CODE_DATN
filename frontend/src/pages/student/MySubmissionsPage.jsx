import { useState, useEffect } from 'react';
import { assignmentService } from '../../services/assignment.service';

export default function MySubmissionsPage() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await assignmentService.getMySubmissions();
        setSubmissions(res.data.data || []);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="loading">Đang tải...</div>;

  return (
    <div>
      <div className="page-header"><h1>Bài nộp & Kết quả</h1></div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Bài tập</th>
              <th>Khóa học</th>
              <th>Ngày nộp</th>
              <th>Trạng thái</th>
              <th>Điểm</th>
              <th>Nhận xét</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((s) => (
              <tr key={s.id}>
                <td>{s.assignment_title}</td>
                <td>{s.course_title}</td>
                <td>{s.submitted_at ? new Date(s.submitted_at).toLocaleDateString('vi-VN') : '-'}</td>
                <td>
                  <span className={`badge ${s.status === 'graded' ? 'badge-success' : 'badge-warning'}`}>
                    {s.status === 'graded' ? 'Đã chấm' : 'Chờ chấm'}
                  </span>
                </td>
                <td style={{ fontWeight: 700, color: s.score != null ? 'var(--success)' : 'var(--text-muted)' }}>
                  {s.score != null ? `${s.score}/${s.max_score}` : '-'}
                </td>
                <td style={{ color: 'var(--text-secondary)', fontSize: 13, maxWidth: 200 }}>
                  {s.feedback || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {submissions.length === 0 && <p style={{ color: 'var(--text-secondary)', marginTop: 20 }}>Bạn chưa nộp bài nào.</p>}
    </div>
  );
}
