import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiMaximize2, FiMessageCircle, FiMinimize2, FiRefreshCw, FiSend, FiX } from 'react-icons/fi';
import { aiService } from '../services/ai.service';
import { enrollmentService } from '../services/enrollment.service';
import { lessonService } from '../services/lesson.service';
import './LessonAIWidget.css';

const QUICK_REPLIES = [
  'Tóm tắt bài này',
  'Giải thích dễ hiểu hơn',
  'Cho ví dụ minh họa',
  'Tôi nên học gì tiếp?',
];

const INITIAL_MESSAGE = 'Xin chào! Tôi là trợ lý học tập AI. Bạn có thể hỏi về nội dung bài học, khái niệm chưa hiểu hoặc xin gợi ý cách học.';

const toWidgetMessages = (items = []) => items.map((item) => ({
  role: item.sender_type === 'student' ? 'student' : 'ai',
  content: item.content,
}));

export default function LessonAIWidget({ courseId, lessonId, lessonTitle }) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('qa');
  const [enrollments, setEnrollments] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(courseId || '');
  const [selectedLessonId, setSelectedLessonId] = useState(lessonId || '');
  const [selectedLessonTitle, setSelectedLessonTitle] = useState(lessonTitle || '');
  const [messages, setMessages] = useState([{ role: 'ai', content: INITIAL_MESSAGE, locked: false }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pathLoading, setPathLoading] = useState(false);
  const [learningPath, setLearningPath] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  useEffect(() => {
    if (isOpen && activeTab === 'qa') inputRef.current?.focus();
  }, [isOpen, activeTab]);

  useEffect(() => {
    enrollmentService.getMyEnrollments()
      .then((res) => {
        const activeEnrollments = (res.data.data || []).filter(
          (en) => en.access_status === 'active' && !en.is_preserved
        );
        setEnrollments(activeEnrollments);
      })
      .catch(() => setEnrollments([]));
  }, []);

  useEffect(() => {
    if (courseId) {
      setSelectedCourseId(String(courseId));
      setSelectedLessonId(lessonId ? String(lessonId) : '');
      setSelectedLessonTitle(lessonTitle || '');
      return;
    }

    const match = location.pathname.match(/\/student\/lesson\/(\d+)/);
    if (!match) {
      setSelectedLessonId('');
      setSelectedLessonTitle('');
      return;
    }

    lessonService.getById(match[1])
      .then((res) => {
        const lesson = res.data.data;
        setSelectedCourseId(String(lesson.course_id));
        setSelectedLessonId(String(lesson.id));
        setSelectedLessonTitle(lesson.title || '');
      })
      .catch(() => {
        setSelectedLessonId('');
        setSelectedLessonTitle('');
      });
  }, [courseId, lessonId, lessonTitle, location.pathname]);

  useEffect(() => {
    setConversationId(null);
    setLearningPath(null);
    setError('');

    if (!selectedCourseId) {
      setMessages([{ role: 'ai', content: INITIAL_MESSAGE, locked: false }]);
      return;
    }

    if (activeTab !== 'qa') return;

    aiService.getConversations(selectedCourseId)
      .then((res) => {
        const convs = res.data.data || [];
        if (!convs.length) {
          setMessages([{ role: 'ai', content: INITIAL_MESSAGE, locked: false }]);
          return;
        }

        setConversationId(convs[0].id);
        aiService.getMessages(convs[0].id)
          .then((msgRes) => {
            const savedMessages = toWidgetMessages(msgRes.data.data || []);
            setMessages(savedMessages.length ? savedMessages : [{ role: 'ai', content: INITIAL_MESSAGE, locked: false }]);
          })
          .catch(() => setMessages([{ role: 'ai', content: INITIAL_MESSAGE, locked: false }]));
      })
      .catch(() => setMessages([{ role: 'ai', content: INITIAL_MESSAGE, locked: false }]));
  }, [selectedCourseId, activeTab]);

  const selectedEnrollment = enrollments.find((en) => String(en.course_id) === String(selectedCourseId));
  const scheduleNotice = learningPath?.schedule_notice || (enrollments.length >= 3 ? {
    message: 'Bạn ơi hiện tại bạn có >= 3 khóa học , hãy ấn vào lịch học để sắp xếp thời khóa biểu cho phù hợp nhé',
    action_label: 'Lịch học',
    action_url: '/student/schedule',
  } : null);

  const sendMessage = async (text) => {
    const question = (text || input).trim();
    if (!question || loading || !selectedCourseId) return;

    setMessages((prev) => [...prev, { role: 'student', content: question, locked: false }]);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const res = await aiService.learningAssistantQa({
        course_id: Number(selectedCourseId),
        lesson_id: selectedLessonId ? Number(selectedLessonId) : undefined,
        conversation_id: conversationId || undefined,
        message: question,
      });
      const data = res.data?.data || {};
      setConversationId(data.conversation_id || conversationId);
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          content: data.answer || 'Mình chưa có đủ dữ liệu để trả lời câu này.',
          locked: Boolean(data.locked_content),
          relatedLessons: data.related_lessons || [],
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          content: err.response?.data?.message || 'Có lỗi khi gọi AI học tập. Vui lòng thử lại sau.',
          locked: false,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const generateLearningPath = async () => {
    if (!selectedCourseId || pathLoading) return;
    setPathLoading(true);
    setError('');

    try {
      const res = await aiService.getLearningPath({
        course_id: Number(selectedCourseId),
        goal: 'improve_score',
      });
      setLearningPath(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Không tạo được lộ trình học.');
    } finally {
      setPathLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  const handleCourseChange = (value) => {
    setSelectedCourseId(value);
    setSelectedLessonId('');
    setSelectedLessonTitle('');
  };

  return (
    <>
      <button
        type="button"
        className={`lesson-ai-bubble ${isOpen ? 'is-open' : ''}`}
        onClick={() => setIsOpen((current) => !current)}
        aria-label={isOpen ? 'Đóng trợ lý học tập AI' : 'Mở trợ lý học tập AI'}
        title="Trợ lý học tập AI"
      >
        {isOpen ? <FiX /> : <FiMessageCircle />}
      </button>

      {isOpen && (
        <section className={`lesson-ai-window ${isExpanded ? 'is-expanded' : ''}`} aria-label="Trợ lý học tập AI">
          <header className="lesson-ai-header">
            <div className="lesson-ai-avatar">AI</div>
            <div className="lesson-ai-heading">
              <h3>Trợ lý học tập AI</h3>
              <p>{selectedLessonTitle || selectedEnrollment?.course_title || 'Hỏi đáp theo nội dung khóa học'}</p>
            </div>
            <button
              type="button"
              className="lesson-ai-close"
              onClick={() => setIsExpanded((current) => !current)}
              aria-label={isExpanded ? 'Thu gọn khung chat' : 'Mở rộng khung chat'}
              title={isExpanded ? 'Thu gọn khung chat' : 'Mở rộng khung chat'}
            >
              {isExpanded ? <FiMinimize2 /> : <FiMaximize2 />}
            </button>
            <button
              type="button"
              className="lesson-ai-close"
              onClick={() => setIsOpen(false)}
              aria-label="Đóng"
            >
              <FiX />
            </button>
          </header>

          <div className="lesson-ai-context">
            <select value={selectedCourseId} onChange={(e) => handleCourseChange(e.target.value)}>
              <option value="">-- Chọn khóa học --</option>
              {enrollments.map((en) => (
                <option key={en.course_id} value={en.course_id}>{en.course_title}</option>
              ))}
            </select>
            {selectedLessonTitle && <span>Đang hỏi theo bài: {selectedLessonTitle}</span>}
          </div>

          <div className="lesson-ai-tabs">
            <button type="button" className={activeTab === 'qa' ? 'active' : ''} onClick={() => setActiveTab('qa')}>
              Hỏi đáp bài học
            </button>
            <button type="button" className={activeTab === 'path' ? 'active' : ''} onClick={() => setActiveTab('path')}>
              Lộ trình cá nhân
            </button>
          </div>

          {error && <div className="lesson-ai-error">{error}</div>}

          {activeTab === 'qa' ? (
            <>
              <div className="lesson-ai-messages">
                {messages.map((msg, index) => (
                  <article key={`${msg.role}-${index}`} className={`lesson-ai-message ${msg.role}`}>
                    <div className="lesson-ai-message-avatar">{msg.role === 'ai' ? 'AI' : 'Bạn'}</div>
                    <div className={`lesson-ai-message-body ${msg.locked ? 'is-locked' : ''}`}>
                      <p>{msg.content}</p>
                      {msg.relatedLessons?.length > 0 && (
                        <div className="lesson-ai-related">
                          {msg.relatedLessons.slice(0, 3).map((lesson) => (
                            <span key={lesson.lesson_id}>
                              {lesson.section_title ? `${lesson.section_title} / ` : ''}{lesson.title}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </article>
                ))}

                {loading && (
                  <article className="lesson-ai-message ai">
                    <div className="lesson-ai-message-avatar">AI</div>
                    <div className="lesson-ai-typing">
                      <span />
                      <span />
                      <span />
                    </div>
                  </article>
                )}

                {messages.length === 1 && !loading && (
                  <div className="lesson-ai-quick-replies">
                    {QUICK_REPLIES.map((reply) => (
                      <button key={reply} type="button" onClick={() => sendMessage(reply)}>
                        {reply}
                      </button>
                    ))}
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              <form className="lesson-ai-input-area" onSubmit={handleSubmit}>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={selectedCourseId ? 'Hỏi về nội dung bài học...' : 'Vui lòng chọn khóa học trước'}
                  disabled={loading || !selectedCourseId}
                />
                <button type="submit" disabled={!input.trim() || loading || !selectedCourseId} aria-label="Gửi câu hỏi">
                  <FiSend />
                </button>
              </form>
            </>
          ) : (
            <div className="lesson-ai-path">
              <div className="lesson-ai-path-header">
                <div>
                  <h4>Lộ trình học cá nhân</h4>
                  <p>Dựa trên tiến độ, điểm số và bài tập chưa nộp.</p>
                </div>
                <button type="button" onClick={generateLearningPath} disabled={!selectedCourseId || pathLoading}>
                  <FiRefreshCw /> {pathLoading ? 'Đang tạo...' : 'Tạo lộ trình'}
                </button>
              </div>

              {scheduleNotice && (
                <div className="lesson-ai-schedule-notice">
                  <p><strong>AI lộ trình hóa cá nhân học tập</strong></p>
                  <span>{scheduleNotice.message}</span>
                  <Link to={scheduleNotice.action_url || '/student/schedule'}>
                    {scheduleNotice.action_label || 'Lịch học'}
                  </Link>
                </div>
              )}

              {!learningPath ? (
                <div className="lesson-ai-path-empty">Chọn khóa học rồi tạo lộ trình để nhận kế hoạch học tiếp theo.</div>
              ) : (
                <>
                  <div className="lesson-ai-path-summary">
                    <div><span>Năng lực</span><strong>{learningPath.level}</strong></div>
                    <div><span>Điểm TB</span><strong>{learningPath.average_score}%</strong></div>
                    <div><span>Tiến độ</span><strong>{learningPath.completion_rate}%</strong></div>
                    <div><span>Bài tập</span><strong>{learningPath.submitted_assignments}/{learningPath.total_assignments}</strong></div>
                  </div>

                  <div className="lesson-ai-path-card">
                    <h4>{learningPath.target}</h4>
                    {learningPath.ai_message && (
                      <p className="lesson-ai-path-message">🤖 {learningPath.ai_message}</p>
                    )}
                    <p>{learningPath.reason}</p>
                    <p><strong>Chiến lược:</strong> {learningPath.strategy}</p>
                  </div>

                  <div className="lesson-ai-path-plan">
                    {learningPath.plan.map((day) => (
                      <div key={day.day} className="lesson-ai-path-day">
                        <h5>Ngày {day.day}: {day.focus}</h5>
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
        </section>
      )}
    </>
  );
}
