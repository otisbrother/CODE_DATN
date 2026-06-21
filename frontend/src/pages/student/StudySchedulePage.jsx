import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiRefreshCw } from 'react-icons/fi';
import { aiService } from '../../services/ai.service';
import './StudySchedulePage.css';

const WEEK_DAYS = [
  { key: 'mon', label: 'Thứ hai' },
  { key: 'tue', label: 'Thứ ba' },
  { key: 'wed', label: 'Thứ tư' },
  { key: 'thu', label: 'Thứ năm' },
  { key: 'fri', label: 'Thứ sáu' },
  { key: 'sat', label: 'Thứ bảy' },
  { key: 'sun', label: 'Chủ nhật' },
];

const SLOT_START_MINUTES = 7 * 60;
const SLOT_END_MINUTES = 21 * 60 + 30;
const SLOT_STEP_MINUTES = 30;
const DEFAULT_START_TIME = '07:00';
const OCCUPIED_SLOT_MESSAGE = 'Khung giờ đã có khóa học rồi';

const toTimeLabel = (minutes) => {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
};

const formatMinutes = (value) => {
  const minutes = Number(value || 0);
  if (minutes < 60) return `${minutes} phút`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} giờ ${rest} phút` : `${hours} giờ`;
};

const getMonday = (date) => {
  const result = new Date(date);
  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diff);
  result.setHours(0, 0, 0, 0);
  return result;
};

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const formatDate = (date) => date.toLocaleDateString('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const buildWeekOptions = () => {
  const currentMonday = getMonday(new Date());
  return Array.from({ length: 6 }, (_, index) => {
    const start = addDays(currentMonday, index * 7);
    const end = addDays(start, 6);
    return {
      value: start.toISOString(),
      label: `Tuần thứ ${index + 1} (${formatDate(start)} - ${formatDate(end)})`,
    };
  });
};

const buildTimeSlots = () => {
  const slots = [];
  for (let minutes = SLOT_START_MINUTES; minutes <= SLOT_END_MINUTES; minutes += SLOT_STEP_MINUTES) {
    slots.push({
      key: toTimeLabel(minutes),
      label: toTimeLabel(minutes),
    });
  }
  return slots;
};

const normalizeStartTime = (time) => {
  if (!time) return '19:30';
  const [hourText, minuteText] = String(time).split(':');
  const hour = Number(hourText || 0);
  const minute = Number(minuteText || 0);
  const roundedMinute = minute < 15 ? 0 : minute < 45 ? 30 : 0;
  const roundedHour = minute >= 45 ? hour + 1 : hour;
  const total = Math.min(Math.max((roundedHour * 60) + roundedMinute, SLOT_START_MINUTES), SLOT_END_MINUTES);
  return toTimeLabel(total);
};

const flattenScheduleItems = (days = []) => days.flatMap((day) => (
  (day.sessions || []).map((session, index) => ({
    ...session,
    id: session.id || `${day.key}-${session.course_id}-${index}`,
    day_key: day.key,
    start_time: normalizeStartTime(session.start_time),
  }))
));

const buildDefaultRowItems = (schedule) => {
  const courses = schedule?.courses || [];
  const activeCourseCount = Number(schedule?.active_course_count || courses.length || 0);
  if (activeCourseCount < 3 || courses.length === 0) {
    return flattenScheduleItems(schedule?.days || []);
  }

  return courses.map((course, index) => {
    const lesson = course.next_lessons?.[0] || null;
    const rowOffset = Math.floor(index / WEEK_DAYS.length);
    const startTime = toTimeLabel(Math.min(
      SLOT_START_MINUTES + (rowOffset * SLOT_STEP_MINUTES),
      SLOT_END_MINUTES
    ));

    return {
      id: `course-${course.course_id}-${index}`,
      day_key: WEEK_DAYS[index % WEEK_DAYS.length].key,
      start_time: startTime,
      duration_minutes: lesson?.duration_minutes || 45,
      course_id: course.course_id,
      course_title: course.course_title,
      lesson_id: lesson?.lesson_id || null,
      lesson_title: lesson?.title || 'Ôn tập nội dung đã học',
      action_url: lesson?.lesson_id ? `/student/lesson/${lesson.lesson_id}` : `/student/course/${course.course_id}`,
    };
  });
};

// Dựng lại các thẻ từ lịch đã lưu trong DB
const mapSavedToItems = (rows = []) => rows.map((row) => ({
  id: `saved-${row.id}`,
  day_key: row.day_key,
  start_time: normalizeStartTime(row.start_time),
  duration_minutes: row.duration_minutes || 45,
  course_id: row.course_id,
  course_title: row.course_title || `Khóa #${row.course_id}`,
  lesson_id: row.lesson_id || null,
  lesson_title: row.lesson_title || 'Ôn tập nội dung đã học',
  note: row.note || '',
  action_url: row.lesson_id ? `/student/lesson/${row.lesson_id}` : `/student/course/${row.course_id}`,
}));

export default function StudySchedulePage() {
  const [schedule, setSchedule] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [draggingId, setDraggingId] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(() => buildWeekOptions()[0]?.value || '');
  const [noteEditor, setNoteEditor] = useState(null); // { id, text } khi đang sửa ghi chú một buổi

  const weekOptions = useMemo(buildWeekOptions, []);
  const timeSlots = useMemo(buildTimeSlots, []);

  const loadSchedule = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [schedRes, savedRes] = await Promise.all([
        aiService.getStudySchedule(),
        aiService.getSavedSchedule(),
      ]);
      const nextSchedule = schedRes.data.data;
      setSchedule(nextSchedule);
      const savedRows = savedRes.data.data || [];
      // Có lịch đã lưu -> dùng lịch đó; chưa có -> dùng lịch gợi ý tự động
      setItems(savedRows.length > 0 ? mapSavedToItems(savedRows) : buildDefaultRowItems(nextSchedule));
    } catch (err) {
      setError(err.response?.data?.message || 'Không tải được lịch học. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  // Lưu toàn bộ lịch hiện tại xuống DB
  const persistItems = useCallback(async (nextItems) => {
    try {
      await aiService.saveStudySchedule(nextItems.map((it) => ({
        course_id: it.course_id,
        day_key: it.day_key,
        start_time: it.start_time,
        duration_minutes: it.duration_minutes,
        lesson_id: it.lesson_id,
        lesson_title: it.lesson_title,
        course_title: it.course_title,
        note: it.note || null,
      })));
    } catch {
      setError('Không lưu được lịch học. Vui lòng thử lại.');
    }
  }, []);

  // Tạo lại lịch theo gợi ý tự động và lưu đè
  const regenerateSchedule = useCallback(async () => {
    const def = buildDefaultRowItems(schedule);
    setItems(def);
    setError('');
    await persistItems(def);
  }, [schedule, persistItems]);

  // Lưu ghi chú cho 1 buổi học
  const saveNote = () => {
    if (!noteEditor) return;
    const nextItems = items.map((it) => (it.id === noteEditor.id ? { ...it, note: noteEditor.text } : it));
    setItems(nextItems);
    setNoteEditor(null);
    persistItems(nextItems);
  };

  const getItemsAt = (dayKey, timeKey) => items.filter(
    (item) => item.day_key === dayKey && item.start_time === timeKey
  );

  const handleDragStart = (event, itemId) => {
    setDraggingId(itemId);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', itemId);
  };

  const handleDrop = (event, dayKey, timeKey) => {
    event.preventDefault();
    const itemId = event.dataTransfer.getData('text/plain') || draggingId;
    if (!itemId) return;

    const isOccupied = items.some((item) => (
      item.id !== itemId && item.day_key === dayKey && item.start_time === timeKey
    ));
    if (isOccupied) {
      setError(OCCUPIED_SLOT_MESSAGE);
      setDraggingId(null);
      return;
    }

    const nextItems = items.map((item) => (
      item.id === itemId
        ? { ...item, day_key: dayKey, start_time: timeKey }
        : item
    ));
    setItems(nextItems);
    setError('');
    setDraggingId(null);
    persistItems(nextItems); // lưu ngay sau khi kéo-thả
  };

  if (loading) return <div className="loading">Đang tạo thời khóa biểu...</div>;

  return (
    <div className="study-schedule-page">
      <div className="study-schedule-heading">
        <div>
          <h1>Lịch học</h1>
          <p>Kéo thẻ khóa học vào khung giờ phù hợp trong tuần.</p>
        </div>
        <button type="button" className="btn btn-outline" onClick={regenerateSchedule}>
          <FiRefreshCw /> Tạo lại lịch gợi ý
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="study-week-control">
        <label htmlFor="study-week">Tuần</label>
        <select id="study-week" value={selectedWeek} onChange={(event) => setSelectedWeek(event.target.value)}>
          {weekOptions.map((week) => (
            <option key={week.value} value={week.value}>{week.label}</option>
          ))}
        </select>
      </div>

      <div className="study-timetable-shell">
        <table className="study-timetable">
          <thead>
            <tr>
              <th className="study-time-column">Khung giờ</th>
              {WEEK_DAYS.map((day) => (
                <th key={day.key}>{day.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((slot, slotIndex) => (
              <tr key={slot.key}>
                <th className="study-time-column">
                  <span>Tiết {slotIndex + 1}</span>
                  <small>{slot.label}</small>
                </th>
                {WEEK_DAYS.map((day) => {
                  const cellItems = getItemsAt(day.key, slot.key);
                  return (
                    <td
                      key={`${day.key}-${slot.key}`}
                      className={`study-slot-cell ${slot.key === DEFAULT_START_TIME ? 'is-default-row' : ''} ${cellItems.length ? 'has-card' : ''}`}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => handleDrop(event, day.key, slot.key)}
                    >
                      {cellItems.map((item) => (
                        <article
                          key={item.id}
                          className="study-drag-card"
                          draggable
                          onDragStart={(event) => handleDragStart(event, item.id)}
                          onDragEnd={() => setDraggingId(null)}
                        >
                          <div className="study-drag-card-top">
                            <strong>ID {item.course_id}</strong>
                            <span>{formatMinutes(item.duration_minutes)}</span>
                          </div>
                          <h3>{item.course_title}</h3>
                          <p>{item.lesson_title}</p>
                          {item.note && <p className="study-card-note">📝 {item.note}</p>}
                          <div className="study-card-actions">
                            <Link to={item.action_url || `/student/course/${item.course_id}`}>Vào học</Link>
                            <button
                              type="button"
                              className="study-note-btn"
                              onClick={() => setNoteEditor({ id: item.id, text: item.note || '' })}
                            >
                              📝 {item.note ? 'Sửa ghi chú' : 'Ghi chú'}
                            </button>
                          </div>
                        </article>
                      ))}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!schedule?.should_schedule && (
        <p className="study-schedule-hint">
          Bạn cần có từ 3 khóa học active trở lên để AI tự xếp thời khóa biểu. Bạn vẫn có thể dùng bảng này khi lịch được tạo.
        </p>
      )}

      {/* Modal sửa ghi chú cho buổi học */}
      {noteEditor && (
        <div className="modal-overlay" onClick={() => setNoteEditor(null)}>
          <div className="modal-content" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📝 Ghi chú buổi học</h3>
              <button className="modal-close" onClick={() => setNoteEditor(null)}>×</button>
            </div>
            <textarea
              className="form-control"
              rows={4}
              autoFocus
              value={noteEditor.text}
              onChange={(e) => setNoteEditor({ ...noteEditor, text: e.target.value })}
              placeholder="VD: 19:30 đi làm về rồi học; nhớ làm bài tập chương 2; học nhóm cùng An..."
            />
            <div className="modal-actions">
              <button type="button" className="btn btn-primary" onClick={saveNote}>Lưu ghi chú</button>
              <button type="button" className="btn btn-outline" onClick={() => setNoteEditor(null)}>Hủy</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
