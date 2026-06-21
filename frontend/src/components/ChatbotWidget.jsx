import { useCallback, useEffect, useRef, useState } from 'react';
import { chatbotService } from '../services/chatbot.service';
import './ChatbotWidget.css';

const QUICK_REPLIES = [
  'Có những khóa học nào?',
  'Học phí bao nhiêu?',
  'Giáo viên là ai?',
  'Cách đăng ký?',
];

const PROACTIVE_PROMPT = 'Chào bạn, bạn có cần tư vấn khóa học không?';
const NUDGE_DELAY_MS = 3000;
const NUDGE_REPEAT_MS = 90000;
const NUDGE_VISIBLE_MS = 12000;
const NUDGE_MAX_SHOWS = 3;

function formatMessage(text) {
  if (!text) return '';
  return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}

const formatPrice = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

export default function ChatbotWidget({ onCourseClick }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showNudge, setShowNudge] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: 'Xin chào! 👋 Tôi là trợ lý AI của **E-Learning**.\n\nTôi có thể giúp bạn tìm hiểu về các khóa học, học phí, giáo viên và cách đăng ký.\n\nBạn muốn hỏi gì?',
      courses: [],
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `chat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const nudgeCountRef = useRef(0);
  const hasInteractedRef = useRef(false);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen || hasInteractedRef.current) return undefined;

    let hideTimer;
    const showPrompt = () => {
      if (nudgeCountRef.current >= NUDGE_MAX_SHOWS || isOpen || hasInteractedRef.current) return;
      nudgeCountRef.current += 1;
      setShowNudge(true);
      window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(() => setShowNudge(false), NUDGE_VISIBLE_MS);
    };

    const firstTimer = window.setTimeout(showPrompt, NUDGE_DELAY_MS);
    const repeatTimer = window.setInterval(showPrompt, NUDGE_REPEAT_MS);

    return () => {
      window.clearTimeout(firstTimer);
      window.clearInterval(repeatTimer);
      window.clearTimeout(hideTimer);
    };
  }, [isOpen]);

  const openChat = () => {
    setIsOpen(true);
    setShowNudge(false);
    hasInteractedRef.current = true;
  };

  const toggleChat = () => {
    setIsOpen((current) => {
      const next = !current;
      if (next) {
        setShowNudge(false);
        hasInteractedRef.current = true;
      }
      return next;
    });
  };

  const handleCourseClick = (course) => {
    if (onCourseClick) {
      onCourseClick(course.id, course.voucher?.code || '');
      return;
    }
    window.location.assign(course.detail_url || `/student/course/${course.id}`);
  };

  const sendMessage = async (text) => {
    const question = text || input.trim();
    if (!question || loading) return;

    setMessages((prev) => [...prev, { role: 'user', text: question, courses: [] }]);
    setInput('');
    setLoading(true);

    try {
      const res = await chatbotService.ask(question, sessionId);
      const data = res.data?.data || {};
      console.log(`[Chatbot] source=${data.source} | courses=${(data.related_courses || []).length} | answer_length=${(data.answer || '').length}`);
      const answer = data.answer || 'Xin lỗi, tôi không thể trả lời lúc này.';
      setMessages((prev) => [...prev, {
        role: 'bot',
        text: answer,
        courses: data.related_courses || [],
      }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'bot', text: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau! 🙏', courses: [] },
      ]);
    }

    setLoading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  const handleQuickReply = (text) => {
    sendMessage(text);
  };

  return (
    <>
      {showNudge && !isOpen && (
        <button className="chatbot-nudge" onClick={openChat} type="button">
          <span className="chatbot-nudge-avatar">🤖</span>
          <span>{PROACTIVE_PROMPT}</span>
        </button>
      )}

      <button
        className={`chatbot-bubble ${isOpen ? 'open' : ''}`}
        onClick={toggleChat}
        title="Tư vấn khóa học"
        type="button"
      >
        {isOpen ? '×' : '💬'}
      </button>

      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div className="chatbot-header-avatar">🤖</div>
            <div className="chatbot-header-info">
              <h4>AI Tư vấn khóa học</h4>
              <p>Trả lời tức thì • Hỗ trợ 24/7</p>
            </div>
            <button className="chatbot-header-close" onClick={() => setIsOpen(false)} type="button">
              ×
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chatbot-msg ${msg.role}`}>
                <div className="chatbot-msg-avatar">
                  {msg.role === 'bot' ? '🤖' : '👤'}
                </div>
                <div className="chatbot-msg-stack">
                  <div
                    className="chatbot-msg-content"
                    dangerouslySetInnerHTML={{
                      __html: formatMessage(msg.text).replace(/\n/g, '<br/>'),
                    }}
                  />
                  {msg.role === 'bot' && msg.courses?.length > 0 && (
                    <div className="chatbot-course-list">
                      {msg.courses.map((course) => (
                        <button
                          type="button"
                          className="chatbot-course-card"
                          key={course.id}
                          onClick={() => handleCourseClick(course)}
                        >
                          <div className="chatbot-course-thumb">
                            {course.thumbnail_url ? (
                              <img src={course.thumbnail_url} alt={course.title} />
                            ) : (
                              <span>📚</span>
                            )}
                          </div>
                          <div className="chatbot-course-info">
                            <span className="chatbot-course-id">ID {course.id}</span>
                            <h5>{course.title}</h5>
                            {course.description && <p>{course.description}</p>}
                            <div className="chatbot-course-meta">
                              <span>{course.lecturer_name}</span>
                            </div>
                            <div className="chatbot-course-bottom">
                              <strong>{formatPrice(course.price)}</strong>
                              {course.voucher && (
                                <span className="chatbot-course-voucher">
                                  {course.voucher.code} -{formatPrice(course.voucher.discount_amount)}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="chatbot-msg bot">
                <div className="chatbot-msg-avatar">🤖</div>
                <div className="chatbot-typing">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}

            {messages.length === 1 && !loading && (
              <div className="chatbot-quick-replies">
                {QUICK_REPLIES.map((text, i) => (
                  <button
                    key={i}
                    className="chatbot-quick-btn"
                    onClick={() => handleQuickReply(text)}
                    type="button"
                  >
                    {text}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form className="chatbot-input-area" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type="text"
              className="chatbot-input"
              placeholder="Nhập câu hỏi về khóa học..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              className="chatbot-send-btn"
              disabled={!input.trim() || loading}
            >
              ➤
            </button>
          </form>
        </div>
      )}
    </>
  );
}
