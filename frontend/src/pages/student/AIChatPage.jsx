import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { aiService } from '../../services/ai.service';
import { enrollmentService } from '../../services/enrollment.service';
import { FiSend } from 'react-icons/fi';
import './AIChatPage.css';

export default function AIChatPage() {
  const [searchParams] = useSearchParams();
  const initialCourse = searchParams.get('course') || '';

  const [enrollments, setEnrollments] = useState([]);
  const [courseId, setCourseId] = useState(initialCourse);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const msgEndRef = useRef(null);

  useEffect(() => {
    enrollmentService.getMyEnrollments().then((res) => {
      setEnrollments(res.data.data || []);
    });
  }, []);

  useEffect(() => {
    if (courseId) {
      aiService.getConversations(courseId).then((res) => {
        const convs = res.data.data || [];
        if (convs.length > 0) {
          setConversationId(convs[0].id);
          aiService.getMessages(convs[0].id).then((r) => setMessages(r.data.data || []));
        } else {
          setConversationId(null);
          setMessages([]);
        }
      });
    }
  }, [courseId]);

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !courseId) return;
    setLoading(true);
    try {
      const res = await aiService.chat({
        course_id: Number(courseId),
        conversation_id: conversationId,
        message: input,
      });
      const data = res.data.data;
      setConversationId(data.conversation_id);
      setMessages(data.messages || []);
      setInput('');
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-sidebar">
        <h3 style={{ marginBottom: 12 }}>🤖 AI Gia sư</h3>
        <div className="form-group">
          <label>Chọn khóa học</label>
          <select className="form-control" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
            <option value="">-- Chọn khóa học --</option>
            {enrollments.map((en) => (
              <option key={en.course_id} value={en.course_id}>{en.course_title}</option>
            ))}
          </select>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>
          AI sẽ trả lời dựa trên nội dung bài giảng của khóa học bạn chọn.
        </p>
      </div>
      <div className="chat-main">
        <div className="chat-messages">
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
              <p style={{ fontSize: 48, marginBottom: 12 }}>🤖</p>
              <p>Chào bạn! Hãy đặt câu hỏi về bài học này.</p>
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
          <div ref={msgEndRef} />
        </div>
        <div className="chat-input">
          <textarea className="form-control" placeholder={courseId ? 'Nhập câu hỏi...' : 'Vui lòng chọn khóa học trước'}
            value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
            disabled={!courseId || loading} rows={1} />
          <button className="btn btn-primary" onClick={handleSend} disabled={!courseId || !input.trim() || loading}>
            <FiSend />
          </button>
        </div>
      </div>
    </div>
  );
}
