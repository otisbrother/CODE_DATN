import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { assignmentService } from '../../services/assignment.service';

export default function GradeSubmissionsPage() {
  const { assignmentId } = useParams();
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState(null);
  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');
  const [msg, setMsg] = useState('');

  const load = async () => {
    try {
      const [aRes, sRes] = await Promise.all([
        assignmentService.getById(assignmentId),
        assignmentService.getSubmissionsByAssignment(assignmentId),
      ]);
      setAssignment(aRes.data.data);
      setSubmissions(sRes.data.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [assignmentId]);

  const handleGrade = async () => {
    try {
      await assignmentService.grade({ submission_id: grading, score: Number(score), feedback });
      setMsg('Chấm điểm thành công');
      setGrading(null);
      setScore('');
      setFeedback('');
      load();
      setTimeout(() => setMsg(''), 3000);
    } catch (e) { setMsg(e.response?.data?.message || 'Lỗi chấm điểm'); }
  };

  if (loading) return <div className="loading">Đang tải...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Chấm điểm: {assignment?.title}</h1>
        <Link to={`/lecturer/courses/${assignment?.course_id}/assignments`} className="btn btn-outline btn-sm">← Quay lại</Link>
      </div>
      {msg && <div className="alert alert-success">{msg}</div>}

      {/* MODAL chấm điểm */}
      {grading && (
        <div className="modal-overlay" onClick={() => setGrading(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Chấm điểm bài nộp #{grading}</h3>
              <button className="modal-close" onClick={() => setGrading(null)}>×</button>
            </div>
            <div className="form-group"><label>Điểm (/{assignment?.max_score})</label>
              <input type="number" className="form-control" value={score} onChange={(e) => setScore(e.target.value)} max={assignment?.max_score} min={0} step={0.5} /></div>
            <div className="form-group"><label>Nhận xét</label>
              <textarea className="form-control" rows={3} value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Nhận xét cho học viên..." /></div>
            <div className="modal-actions">
              <button className="btn btn-success" onClick={handleGrade}>Lưu điểm</button>
              <button className="btn btn-outline" onClick={() => setGrading(null)}>Hủy</button>
            </div>
          </div>
        </div>
      )}

      <div className="table-container">
        <table>
          <thead><tr><th>Học viên</th><th>Ngày nộp</th><th>Nội dung</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
          <tbody>
            {submissions.map((s) => (
              <tr key={s.id}>
                <td><strong>{s.student_name}</strong></td>
                <td>{s.submitted_at ? new Date(s.submitted_at).toLocaleDateString('vi-VN') : '-'}</td>
                <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.content?.substring(0, 80) || '-'}</td>
                <td><span className={`badge ${s.status === 'graded' ? 'badge-success' : 'badge-warning'}`}>{s.status === 'graded' ? 'Đã chấm' : 'Chờ chấm'}</span></td>
                <td>
                  <button className="btn btn-primary btn-sm" onClick={() => { setGrading(s.id); setScore(''); setFeedback(''); }}>
                    {s.status === 'graded' ? 'Sửa điểm' : 'Chấm điểm'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {submissions.length === 0 && <p style={{ color: 'var(--text-secondary)', marginTop: 20 }}>Chưa có bài nộp.</p>}
    </div>
  );
}
