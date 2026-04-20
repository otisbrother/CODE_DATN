import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { assignmentService } from '../../services/assignment.service';

export default function SubmitAssignmentPage() {
  const { assignmentId } = useParams();
  const [assignment, setAssignment] = useState(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await assignmentService.getById(assignmentId);
        setAssignment(res.data.data);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [assignmentId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await assignmentService.submit({ assignment_id: Number(assignmentId), content });
      setMsg('Nộp bài thành công!');
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi nộp bài');
    }
    setSubmitting(false);
  };

  if (loading) return <div className="loading">Đang tải...</div>;
  if (!assignment) return <div className="loading">Bài tập không tồn tại</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Làm bài: {assignment.title}</h1>
        <Link to={`/student/course/${assignment.course_id}`} className="btn btn-outline btn-sm">← Quay lại</Link>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>{assignment.description || 'Không có mô tả'}</p>
        <div style={{ display: 'flex', gap: 20, fontSize: 13, color: 'var(--text-muted)' }}>
          <span>Điểm tối đa: <strong>{assignment.max_score}</strong></span>
          <span>Hạn nộp: <strong>{assignment.due_date ? new Date(assignment.due_date).toLocaleDateString('vi-VN') : 'Không giới hạn'}</strong></span>
        </div>
      </div>

      {msg && <div className="alert alert-success">{msg}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {!msg && (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Bài làm của bạn</label>
            <textarea className="form-control" rows={10} placeholder="Nhập nội dung bài làm..."
              value={content} onChange={(e) => setContent(e.target.value)} required style={{ minHeight: 200 }} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Đang nộp...' : '📤 Nộp bài'}
          </button>
        </form>
      )}
    </div>
  );
}
