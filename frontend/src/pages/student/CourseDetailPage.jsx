import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { courseService } from '../../services/course.service';
import { lessonService } from '../../services/lesson.service';
import { assignmentService } from '../../services/assignment.service';
import { progressService } from '../../services/progress.service';

export default function CourseDetailPage() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [cRes, lRes, aRes] = await Promise.all([
          courseService.getById(courseId),
          lessonService.getByCourse(courseId),
          assignmentService.getByCourse(courseId),
        ]);
        setCourse(cRes.data.data);
        setLessons(lRes.data.data || []);
        setAssignments(aRes.data.data || []);
        try {
          const pRes = await progressService.recalculate(courseId);
          setProgress(pRes.data.data);
        } catch (e) { /* no progress yet */ }
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [courseId]);

  if (loading) return <div className="loading">Đang tải...</div>;
  if (!course) return <div className="loading">Khóa học không tồn tại</div>;

  return (
    <div>
      <div className="page-header">
        <h1>{course.title}</h1>
        <Link to="/student/courses" className="btn btn-outline btn-sm">← Quay lại</Link>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 12 }}>{course.description}</p>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 13 }}>
          <span>GV: <strong>{course.lecturer_name}</strong></span>
          <span>Giá: <strong style={{ color: 'var(--accent-secondary)' }}>{Number(course.price).toLocaleString('vi-VN')}đ</strong></span>
          {progress && <span>Tiến độ: <strong style={{ color: 'var(--success)' }}>{progress.completion_rate}%</strong></span>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div>
          <h2 style={{ fontSize: 18, marginBottom: 16 }}>📖 Bài học ({lessons.length})</h2>
          {lessons.map((l, i) => (
            <Link key={l.id} to={`/student/lesson/${l.id}`} className="card" style={{ display: 'block', marginBottom: 12, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="badge badge-primary">{l.lesson_order}</span>
                <span>{l.title}</span>
              </div>
            </Link>
          ))}
          {lessons.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>Chưa có bài học.</p>}
        </div>

        <div>
          <h2 style={{ fontSize: 18, marginBottom: 16 }}>📝 Bài tập ({assignments.length})</h2>
          {assignments.map((a) => (
            <div key={a.id} className="card" style={{ marginBottom: 12, padding: 16 }}>
              <h4 style={{ marginBottom: 4 }}>{a.title}</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 8 }}>
                Hạn nộp: {a.due_date ? new Date(a.due_date).toLocaleDateString('vi-VN') : 'Không giới hạn'} | Điểm tối đa: {a.max_score}
              </p>
              <Link to={`/student/assignment/${a.id}`} className="btn btn-primary btn-sm">Làm bài</Link>
            </div>
          ))}
          {assignments.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>Chưa có bài tập.</p>}
        </div>
      </div>
    </div>
  );
}
