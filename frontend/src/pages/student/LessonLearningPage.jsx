import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { lessonService } from '../../services/lesson.service';
import { progressService } from '../../services/progress.service';
import { enrollmentService } from '../../services/enrollment.service';

const API_URL = '';
const VIDEO_COMPLETE_THRESHOLD = 0.9; // 90% video phải được xem

export default function LessonLearningPage() {
  const { lessonId } = useParams();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [accessDenied, setAccessDenied] = useState('');

  // Video tracking state
  const videoRef = useRef(null);
  const [videoWatched, setVideoWatched] = useState(false);
  const [watchPercent, setWatchPercent] = useState(0);
  const maxTimeReachedRef = useRef(0);
  const hasCalledCompleteRef = useRef(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await lessonService.getById(lessonId);
        const loadedLesson = res.data.data;
        setLesson(loadedLesson);

        let enrollment = null;
        try {
          const enrRes = await enrollmentService.checkEnrollment(loadedLesson.course_id);
          enrollment = enrRes.data.data;
        } catch {
          enrollment = null;
        }

        if (enrollment?.is_preserved) {
          setAccessDenied('Khóa học đang bảo lưu. Vui lòng mở lại khóa học để tiếp tục học.');
        } else if (
          enrollment?.access_status !== 'active'
          && loadedLesson.is_preview !== 1
          && loadedLesson.section_is_preview !== 1
        ) {
          setAccessDenied('Bạn cần đăng ký khóa học để xem bài học này.');
        } else {
          setAccessDenied('');
        }

        // Reset video tracking khi chuyển bài
        setVideoWatched(!loadedLesson.video_url);
        setWatchPercent(0);
        setCompleted(false);
        maxTimeReachedRef.current = 0;
        hasCalledCompleteRef.current = false;
      } catch (e) {
        setAccessDenied(e.response?.data?.message || '');
        console.error(e);
      }
      setLoading(false);
    };
    load();
  }, [lessonId]);

  // Tự động gọi API hoàn thành bài học khi xem xong video
  const autoCompleteLesson = useCallback(async (courseId) => {
    if (hasCalledCompleteRef.current) return;
    hasCalledCompleteRef.current = true;
    try {
      await progressService.completeLesson(courseId, lessonId);
      setCompleted(true);
    } catch (e) { console.error(e); }
  }, [lessonId]);

  // Theo dõi tiến trình xem video
  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.duration) return;

    // Lưu thời điểm xa nhất đã xem (chống tua nhanh)
    if (video.currentTime > maxTimeReachedRef.current) {
      maxTimeReachedRef.current = video.currentTime;
    }

    const percent = maxTimeReachedRef.current / video.duration;
    setWatchPercent(Math.min(Math.round(percent * 100), 100));

    if (percent >= VIDEO_COMPLETE_THRESHOLD && !hasCalledCompleteRef.current) {
      setVideoWatched(true);
    }
  }, []);

  const handleVideoEnded = useCallback(() => {
    setVideoWatched(true);
    setWatchPercent(100);
  }, []);

  // Khi videoWatched chuyển thành true → tự động hoàn thành
  useEffect(() => {
    if (videoWatched && lesson && !hasCalledCompleteRef.current) {
      autoCompleteLesson(lesson.course_id);
    }
  }, [videoWatched, lesson, autoCompleteLesson]);

  if (loading) return <div className="loading">Đang tải bài học...</div>;
  if (accessDenied && !lesson) {
    return (
      <div>
        <div className="page-header">
          <h1>Không thể truy cập bài học</h1>
          <Link to="/student/courses" className="btn btn-outline btn-sm">← Quay lại khóa học của tôi</Link>
        </div>
        <div className="alert alert-danger">{accessDenied}</div>
      </div>
    );
  }
  if (!lesson) return <div className="loading">Bài học không tồn tại</div>;
  if (accessDenied) {
    return (
      <div>
        <div className="page-header">
          <h1>{lesson.title}</h1>
          <Link to={`/student/course/${lesson.course_id}`} className="btn btn-outline btn-sm">← Quay lại khóa học</Link>
        </div>
        <div className="alert alert-danger">{accessDenied}</div>
      </div>
    );
  }

  const hasVideo = !!lesson.video_url;

  return (
    <div>
      <div className="page-header">
        <h1>{lesson.title}</h1>
        <Link to={`/student/course/${lesson.course_id}`} className="btn btn-outline btn-sm">← Quay lại khóa học</Link>
      </div>

      {/* Video bài học */}
      {lesson.video_url && (
        <div className="card" style={{ marginBottom: 24, padding: 0, overflow: 'hidden' }}>
          <video
            ref={videoRef}
            controls
            style={{ width: '100%', maxHeight: 500 }}
            src={`${API_URL}${lesson.video_url}`}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleVideoEnded}
          >
            Trình duyệt không hỗ trợ video.
          </video>
          <div style={{ padding: '8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {lesson.duration_seconds && (
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                ⏱ Thời lượng: {Math.floor(lesson.duration_seconds / 60)} phút {lesson.duration_seconds % 60} giây
              </span>
            )}
            <span style={{
              fontSize: 13,
              fontWeight: 600,
              color: videoWatched ? '#059669' : '#d97706',
            }}>
              {videoWatched ? '✅ Đã xem xong' : `📺 Đã xem: ${watchPercent}%`}
            </span>
          </div>
          {/* Thanh tiến trình xem video */}
          {!videoWatched && (
            <div style={{ height: 4, background: '#e5e7eb', borderRadius: 2 }}>
              <div style={{
                height: '100%',
                width: `${watchPercent}%`,
                background: watchPercent >= 90 ? '#059669' : '#f59e0b',
                borderRadius: 2,
                transition: 'width 0.3s ease',
              }} />
            </div>
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

      {/* Trạng thái hoàn thành bài học */}
      {hasVideo && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {completed ? (
            <span className="badge badge-success" style={{ padding: '10px 20px', fontSize: 14 }}>✅ Đã hoàn thành bài học</span>
          ) : (
            <span style={{ fontSize: 13, color: '#d97706' }}>
              ⚠ Xem hết video để hoàn thành bài học (≥90%)
            </span>
          )}
        </div>
      )}
    </div>
  );
}
