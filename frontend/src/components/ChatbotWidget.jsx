import { useState, useRef, useEffect, useCallback } from 'react';
import { chatbotService } from '../services/chatbot.service';
import './ChatbotWidget.css';

const QUICK_REPLIES = [
  'Có những khóa học nào?',
  'Học phí bao nhiêu?',
  'Giảng viên là ai?',
  'Cách đăng ký?',
];

// Simple markdown bold: **text** → <strong>text</strong>
function formatMessage(text) {
  if (!text) return '';
  return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: 'Xin chào! 👋 Tôi là trợ lý AI của **E-Learning**.\n\nTôi có thể giúp bạn tìm hiểu về các khóa học, học phí, giảng viên và cách đăng ký.\n\nBạn muốn hỏi gì?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `chat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

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

  const sendMessage = async (text) => {
    const question = text || input.trim();
    if (!question || loading) return;

    // Add user message
    setMessages((prev) => [...prev, { role: 'user', text: question }]);
    setInput('');
    setLoading(true);

    try {
      const res = await chatbotService.ask(question, sessionId);
      const answer = res.data?.data?.answer || 'Xin lỗi, tôi không thể trả lời lúc này.';
      setMessages((prev) => [...prev, { role: 'bot', text: answer }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'bot', text: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau! 🙏' },
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
      {/* Floating bubble */}
      <button
        className={`chatbot-bubble ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Tư vấn khóa học"
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {/* Chat window */}
      {isOpen && (
        <div className="chatbot-window">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-avatar">🤖</div>
            <div className="chatbot-header-info">
              <h4>AI Tư vấn khóa học</h4>
              <p>Trả lời tức thì • Hỗ trợ 24/7</p>
            </div>
            <button className="chatbot-header-close" onClick={() => setIsOpen(false)}>
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="chatbot-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chatbot-msg ${msg.role}`}>
                <div className="chatbot-msg-avatar">
                  {msg.role === 'bot' ? '🤖' : '👤'}
                </div>
                <div
                  className="chatbot-msg-content"
                  dangerouslySetInnerHTML={{
                    __html: formatMessage(msg.text).replace(/\n/g, '<br/>'),
                  }}
                />
              </div>
            ))}

            {/* Typing indicator */}
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

            {/* Quick replies - chỉ hiện khi có 1 tin nhắn (welcome) */}
            {messages.length === 1 && !loading && (
              <div className="chatbot-quick-replies">
                {QUICK_REPLIES.map((text, i) => (
                  <button
                    key={i}
                    className="chatbot-quick-btn"
                    onClick={() => handleQuickReply(text)}
                  >
                    {text}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
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
