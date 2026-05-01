import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { lessonService } from '../../services/lesson.service';
import { progressService } from '../../services/progress.service';

const API_URL = 'http://localhost:5000';

export default function LessonLearningPage() {
  const { lessonId } = useParams();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await lessonService.getById(lessonId);
        setLesson(res.data.data);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [lessonId]);

  const handleComplete = async () => {
    if (!lesson) return;
    try {
      await progressService.completeLesson(lesson.course_id);
      setCompleted(true);
    } catch (e) { console.error(e); }
  };

  if (loading) return <div className="loading">Đang tải bài học...</div>;
  if (!lesson) return <div className="loading">Bài học không tồn tại</div>;

  return (
    <div>
      <div className="page-header">
        <h1>{lesson.title}</h1>
        <Link to={`/student/course/${lesson.course_id}`} className="btn btn-outline btn-sm">← Quay lại khóa học</Link>
      </div>

      {/* Video bài học */}
      {lesson.video_url && (
        <div className="card" style={{ marginBottom: 24, padding: 0, overflow: 'hidden' }}>
          <video controls style={{ width: '100%', maxHeight: 500 }} src={`${API_URL}${lesson.video_url}`}>
            Trình duyệt không hỗ trợ video.
          </video>
          {lesson.duration_seconds && (
            <p style={{ padding: '8px 16px', margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
              ⏱ Thời lượng: {Math.floor(lesson.duration_seconds / 60)} phút {lesson.duration_seconds % 60} giây
            </p>
          )}
        </div>
      )}

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, color: 'var(--text-primary)' }}>
          {lesson.content || 'Nội dung bài học đang được cập nhật...'}
        </div>
      </div>

      {lesson.materials && lesson.materials.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 12 }}>📎 Tài liệu đính kèm</h3>
          {lesson.materials.map((m) => (
            <div key={m.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span>{m.file_name}</span>
                {m.material_type && m.material_type !== 'document' && (
                  <span className="badge badge-primary" style={{ marginLeft: 8, fontSize: 10 }}>{m.material_type}</span>
                )}
              </div>
              <a href={`${API_URL}${m.file_url}`} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">Tải xuống</a>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12 }}>
        {!completed ? (
          <button className="btn btn-success" onClick={handleComplete}>✅ Hoàn thành bài học</button>
        ) : (
          <span className="badge badge-success" style={{ padding: '10px 20px', fontSize: 14 }}>✅ Đã hoàn thành</span>
        )}
        <Link to={`/student/ai-chat?course=${lesson.course_id}`} className="btn btn-primary">🤖 Hỏi AI về bài này</Link>
      </div>
    </div>
  );
}
