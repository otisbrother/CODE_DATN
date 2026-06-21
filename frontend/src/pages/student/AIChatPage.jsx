import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { aiService } from '../../services/ai.service';
import { enrollmentService } from '../../services/enrollment.service';
import { FiMaximize2, FiMinimize2, FiRefreshCw, FiSend } from 'react-icons/fi';
import './AIChatPage.css';

export default function AIChatPage() {
  const [searchParams] = useSearchParams();
  const initialCourse = searchParams.get('course') || '';
  const initialLesson = searchParams.get('lesson') || '';
  const initialTab = searchParams.get('tab') === 'path' ? 'path' : 'qa';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [enrollments, setEnrollments] = useState([]);
  const [courseId, setCourseId] = useState(initialCourse);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pathLoading, setPathLoading] = useState(false);
  const [learningPath, setLearningPath] = useState(null);
  const [error, setError] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const msgEndRef = useRef(null);

  useEffect(() => {
    enrollmentService.getMyEnrollments().then((res) => {
      const activeEnrollments = (res.data.data || []).filter(
        (en) => en.access_status === 'active' && !en.is_preserved
      );
      setEnrollments(activeEnrollments);
      if (initialCourse && !activeEnrollments.some((en) => String(en.course_id) === String(initialCourse))) {
        setCourseId('');
      }
    });
  }, [initialCourse]);

  useEffect(() => {
    setError('');
    setLearningPath(null);
    if (!courseId) {
      setConversationId(null);
      setMessages([]);
      return;
    }

    if (activeTab === 'qa') {
      aiService.getConversations(courseId).then((res) => {
        const convs = res.data.data || [];
        if (convs.length > 0) {
          setConversationId(convs[0].id);
          aiService.getMessages(convs[0].id).then((r) => setMessages(r.data.data || []));
        } else {
          setConversationId(null);
          setMessages([]);
        }
      }).catch((e) => setError(e.response?.data?.message || 'Không tải được hội thoại AI'));
    }
  }, [courseId, activeTab]);

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectedCourse = enrollments.find((en) => String(en.course_id) === String(courseId));
  const scheduleNotice = learningPath?.schedule_notice || (enrollments.length >= 3 ? {
    message: 'Bạn ơi hiện tại bạn có >= 3 khóa học , hãy ấn vào lịch học để sắp xếp thời khóa biểu cho phù hợp nhé',
    action_label: 'Lịch học',
    action_url: '/student/schedule',
  } : null);

  const handleSend = async () => {
    if (!input.trim() || !courseId) return;
    setLoading(true);
    setError('');
    try {
      const res = await aiService.learningAssistantQa({
        course_id: Number(courseId),
        lesson_id: initialLesson ? Number(initialLesson) : undefined,
        conversation_id: conversationId,
        message: input.trim(),
      });
      const data = res.data.data;
      setConversationId(data.conversation_id);
      setMessages(data.messages || []);
      setInput('');
    } catch (e) {
      setError(e.response?.data?.message || 'AI chưa thể trả lời lúc này');
    }
    setLoading(false);
  };

  const generateLearningPath = async () => {
    if (!courseId) return;
    setPathLoading(true);
    setError('');
    try {
      const res = await aiService.getLearningPath({
        course_id: Number(courseId),
        goal: 'improve_score',
      });
      setLearningPath(res.data.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Không tạo được lộ trình học');
    }
    setPathLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`chat-container ${isExpanded ? 'chat-expanded' : ''}`}>
      <div className="chat-sidebar">
        <h3 style={{ marginBottom: 12 }}>Trợ lý học tập AI</h3>
        <div className="form-group">
          <label>Chọn khóa học</label>
          <select className="form-control" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
            <option value="">-- Chọn khóa học --</option>
            {enrollments.map((en) => (
              <option key={en.course_id} value={en.course_id}>{en.course_title}</option>
            ))}
          </select>
        </div>
        {selectedCourse && (
          <div className="ai-course-note">
            <strong>{selectedCourse.course_title}</strong>
            {initialLesson && <span>Đang hỏi theo bài học hiện tại.</span>}
          </div>
        )}
        <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>
          AI hỗ trợ giải thích bài học và lập kế hoạch cải thiện. AI không làm bài tập hoặc đưa đáp án nộp bài.
        </p>
        <Link to="/student/progress" className="btn btn-outline btn-sm" style={{ width: '100%', textAlign: 'center' }}>
          Xem tiến độ học tập
        </Link>
      </div>

      <div className="chat-main">
        <div className="learning-chat-header">
          <div className="learning-chat-avatar">🤖</div>
          <div className="learning-chat-title">
            <h4>Trợ lý học tập AI</h4>
            <p>{selectedCourse ? selectedCourse.course_title : 'Hỗ trợ hỏi đáp bài học • Lộ trình cá nhân'}</p>
          </div>
          <div className="learning-chat-actions">
            <div className="ai-tabs">
              <button className={activeTab === 'qa' ? 'active' : ''} onClick={() => setActiveTab('qa')}>
                Hỏi đáp bài học
              </button>
              <button className={activeTab === 'path' ? 'active' : ''} onClick={() => setActiveTab('path')}>
                Lộ trình cá nhân
              </button>
            </div>
            <button
              type="button"
              className="learning-chat-expand"
              onClick={() => setIsExpanded((current) => !current)}
              title={isExpanded ? 'Thu gọn khung chat' : 'Mở rộng khung chat'}
            >
              {isExpanded ? <FiMinimize2 /> : <FiMaximize2 />}
            </button>
          </div>
        </div>

        {error && <div className="alert alert-danger" style={{ margin: 16 }}>{error}</div>}

        {activeTab === 'qa' ? (
          <>
            <div className="chat-messages">
              {messages.length === 0 && (
                <div className="learning-chat-empty">
                  <p className="learning-chat-empty-icon">🤖</p>
                  <p>Hãy hỏi một khái niệm, đoạn bài học hoặc lỗi bạn đang gặp.</p>
                  <p>Ví dụ: “Pandas dùng để làm gì?” hoặc “Gợi ý cách làm bài này, đừng đưa đáp án.”</p>
                </div>
              )}
              {messages.map((m) => (
                <div key={m.id} className={`chat-msg ${m.sender_type === 'student' ? 'msg-user' : 'msg-ai'}`}>
                  <div className="msg-avatar">{m.sender_type === 'student' ? '👤' : '🤖'}</div>
                  <div className="msg-content">
                    <div className="msg-bubble" style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
                    <span className="msg-time">{new Date(m.created_at).toLocaleTimeString('vi-VN')}</span>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="chat-msg msg-ai">
                  <div className="msg-avatar">🤖</div>
                  <div className="learning-chat-typing">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              )}
              <div ref={msgEndRef} />
            </div>
            <div className="chat-input">
              <textarea
                className="form-control"
                placeholder={courseId ? 'Nhập câu hỏi về bài học...' : 'Vui lòng chọn khóa học trước'}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={!courseId || loading}
                rows={1}
              />
              <button className="btn btn-primary" onClick={handleSend} disabled={!courseId || !input.trim() || loading}>
                <FiSend />
              </button>
            </div>
          </>
        ) : (
          <div className="learning-path-panel">
            <div className="path-header">
              <div>
                <h2>Lộ trình học cá nhân</h2>
                <p>Phân loại năng lực dựa trên điểm trung bình, tiến độ học và bài tập chưa nộp.</p>
              </div>
              <button className="btn btn-primary" onClick={generateLearningPath} disabled={!courseId || pathLoading}>
                <FiRefreshCw /> {pathLoading ? 'Đang tạo...' : 'Tạo lộ trình'}
              </button>
            </div>

            {scheduleNotice && (
              <div className="path-schedule-notice">
                <div>
                  <strong>AI lộ trình hóa cá nhân học tập</strong>
                  <p>{scheduleNotice.message}</p>
                </div>
                <Link to={scheduleNotice.action_url || '/student/schedule'} className="btn btn-primary btn-sm">
                  {scheduleNotice.action_label || 'Lịch học'}
                </Link>
              </div>
            )}

            {!learningPath ? (
              <div className="path-empty">
                <p>Chọn khóa học rồi bấm “Tạo lộ trình” để AI đề xuất kế hoạch cải thiện.</p>
              </div>
            ) : (
              <>
                <div className="path-summary">
                  <div>
                    <span>Năng lực</span>
                    <strong>{learningPath.level}</strong>
                  </div>
                  <div>
                    <span>Điểm TB</span>
                    <strong>{learningPath.average_score}%</strong>
                  </div>
                  <div>
                    <span>Tiến độ</span>
                    <strong>{learningPath.completion_rate}%</strong>
                  </div>
                  <div>
                    <span>Bài tập</span>
                    <strong>{learningPath.submitted_assignments}/{learningPath.total_assignments}</strong>
                  </div>
                </div>

                <div className="path-card">
                  <h3>{learningPath.target}</h3>
                  <p>{learningPath.reason}</p>
                  <p><strong>Chiến lược:</strong> {learningPath.strategy}</p>
                  {learningPath.weak_sections?.length > 0 && (
                    <p><strong>Phần yếu:</strong> {learningPath.weak_sections.join(', ')}</p>
                  )}
                </div>

                <div className="path-plan">
                  {learningPath.plan.map((day) => (
                    <div key={day.day} className="path-day">
                      <h4>Ngày {day.day}: {day.focus}</h4>
                      <ul>
                        {day.tasks.map((task, index) => <li key={index}>{task}</li>)}
                      </ul>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
