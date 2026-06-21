import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { aiService } from '../services/ai.service';
import './StudyReminder.css';

// getDay(): 0=CN..6=T7 -> khớp day_key trong lịch học
const DAY_KEY_BY_JS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const REMIND_BEFORE_MIN = 5; // nhắc trước 5 phút
const REFETCH_MS = 5 * 60 * 1000; // 5 phút nạp lại lịch 1 lần (bắt thay đổi)
const CHECK_MS = 20 * 1000; // 20 giây kiểm tra 1 lần

const toMinutes = (hhmm) => {
  const [h, m] = String(hhmm || '').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

export default function StudyReminder() {
  const [items, setItems] = useState([]);
  const [reminder, setReminder] = useState(null); // buổi đang nhắc
  const remindedRef = useRef(new Set()); // các buổi đã nhắc (theo ngày) -> tránh lặp

  // Nạp lịch đã lưu (và nạp lại định kỳ để bắt thay đổi); xin quyền thông báo hệ thống
  useEffect(() => {
    let active = true;
    const fetchItems = () => {
      aiService.getSavedSchedule()
        .then((res) => { if (active) setItems(res.data.data || []); })
        .catch(() => { /* chưa đăng nhập / lỗi mạng -> bỏ qua */ });
    };
    fetchItems();
    const refetch = setInterval(fetchItems, REFETCH_MS);
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
    return () => { active = false; clearInterval(refetch); };
  }, []);

  // Vòng kiểm tra: tới mốc "trước giờ học 5 phút" thì nhắc
  useEffect(() => {
    if (!items.length) return undefined;
    const check = () => {
      const now = new Date();
      const todayKey = DAY_KEY_BY_JS[now.getDay()];
      const nowMin = now.getHours() * 60 + now.getMinutes();
      const dateStr = now.toDateString();
      for (const it of items) {
        if (it.day_key !== todayKey) continue;
        const start = toMinutes(it.start_time);
        const remindAt = start - REMIND_BEFORE_MIN;
        const key = `${it.id}-${dateStr}`;
        if (nowMin >= remindAt && nowMin < start && !remindedRef.current.has(key)) {
          remindedRef.current.add(key);
          const title = it.course_title || `Khóa #${it.course_id}`;
          setReminder(it);
          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              const n = new Notification('⏰ Sắp tới giờ học', {
                body: `5 phút nữa học (${title}) rồi, chuẩn bị vào học thôi bạn ơi`,
              });
              n.onclick = () => window.focus();
            } catch { /* ignore */ }
          }
        }
      }
    };
    check();
    const timer = setInterval(check, CHECK_MS);
    return () => clearInterval(timer);
  }, [items]);

  if (!reminder) return null;
  const title = reminder.course_title || `Khóa #${reminder.course_id}`;
  const url = reminder.lesson_id ? `/student/lesson/${reminder.lesson_id}` : `/student/course/${reminder.course_id}`;
  return (
    <div className="study-reminder-toast" role="alert">
      <button type="button" className="study-reminder-close" onClick={() => setReminder(null)} aria-label="Đóng">×</button>
      <div className="study-reminder-emoji">⏰</div>
      <div className="study-reminder-body">
        <strong>Sắp tới giờ học!</strong>
        <p>5 phút nữa học (<b>{title}</b>) rồi, chuẩn bị vào học thôi bạn ơi 🎯</p>
        <Link className="btn btn-primary btn-sm" to={url} onClick={() => setReminder(null)}>Vào học ngay</Link>
      </div>
    </div>
  );
}
