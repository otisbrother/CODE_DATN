import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { assignmentService } from '../../services/assignment.service';
import './SubmitAssignmentPage.css';

const getQuestionLabel = (question, index) => {
  const label = question.type === 'quiz' ? 'Trắc nghiệm' : question.type === 'code' ? 'Code' : 'Tự luận';
  return `${label} ${index + 1}`;
};

// Số giây -> "phút:giây" (vd 2400 -> "40:00")
const formatDuration = (sec) => {
  const s = Math.max(0, Number(sec) || 0);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

const buildSubmissionContent = (questions, answers) => questions.map((question, index) => {
  const answer = answers[question.id];
  if (question.type === 'quiz') {
    const selected = Number(answer);
    return `Câu ${index + 1}: ${question.options?.[selected] || 'Chưa chọn'}`;
  }
  return `Câu ${index + 1}: ${answer || ''}`;
}).join('\n');

export default function SubmitAssignmentPage() {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [content, setContent] = useState('');
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(null); // giây còn lại (null = không giới hạn)
  const [started, setStarted] = useState(false); // đã bấm "Đồng ý" bắt đầu thi chưa
  const [showStartModal, setShowStartModal] = useState(false); // pop-up xác nhận trước khi thi
  const [warning, setWarning] = useState(false); // cảnh báo rời khỏi bài thi
  const [violations, setViolations] = useState(0); // số lần rời khỏi bài thi
  const [currentQuestion, setCurrentQuestion] = useState(0); // câu đang làm (làm từng câu một)
  const submittedRef = useRef(false); // chặn nộp 2 lần (tự nộp + bấm nộp)
  const startedRef = useRef(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await assignmentService.getById(assignmentId);
        const data = res.data.data;
        setAssignment(data);
        // Bài có giới hạn thời gian -> chuẩn bị đồng hồ (chỉ chạy sau khi bắt đầu thi)
        if (Number(data.time_limit_seconds) > 0) setTimeLeft(Number(data.time_limit_seconds));
        // Test cuối khóa -> bắt buộc xác nhận + thi toàn màn hình; bài thường vào thẳng
        if (data.is_final_test) {
          setShowStartModal(true);
        } else {
          setStarted(true);
          startedRef.current = true;
        }
        // Điền sẵn code mẫu vào ô soạn code cho câu loại 'code'
        const init = {};
        (data.questions || []).forEach((q) => {
          if (q.type === 'code') init[q.id] = q.starter_code || '';
        });
        if (Object.keys(init).length) setAnswers(init);
      } catch (e) {
        setError(e.response?.data?.message || 'Không thể truy cập bài tập');
        console.error(e);
      }
      setLoading(false);
    };
    load();
  }, [assignmentId]);

  const questions = Array.isArray(assignment?.questions) ? assignment.questions : [];
  const isAutoGraded = Boolean(assignment?.auto_grade && questions.length > 0);
  const isFinalTest = Boolean(assignment?.is_final_test);

  const updateAnswer = (questionId, value) => {
    setAnswers((current) => ({ ...current, [questionId]: value }));
  };

  const isAnswered = (question) => {
    const a = answers[question.id];
    return a !== undefined && a !== null && String(a).trim() !== '';
  };

  const doSubmit = async (auto = false) => {
    if (submittedRef.current) return; // tránh nộp 2 lần
    if (!auto && isAutoGraded) {
      const unansweredIndex = questions.findIndex((q) => !isAnswered(q));
      if (unansweredIndex >= 0) {
        setError(`Bạn cần trả lời câu ${unansweredIndex + 1} trước khi nộp bài.`);
        setCurrentQuestion(unansweredIndex); // nhảy tới câu còn trống
        return;
      }
    }

    submittedRef.current = true;
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        assignment_id: Number(assignmentId),
        content: isAutoGraded ? buildSubmissionContent(questions, answers) : content,
        answers: isAutoGraded ? answers : undefined,
        auto_submit: auto, // hết giờ tự nộp -> backend cho nộp dù còn câu trống (câu trống = 0 điểm)
      };
      const res = await assignmentService.submit(payload);
      const responseData = res.data.data || {};
      setResult(responseData.result || null);
      setReport(responseData.report || null);
      const maxScore = assignment.max_score || 10;
      const prefix = auto ? 'Hết giờ — hệ thống đã tự nộp bài. ' : '';
      setMsg(responseData.result
        ? `${prefix}Điểm của bạn: ${responseData.result.score}/${maxScore}`
        : `${prefix}Nộp bài thành công!`);
      exitFullscreen();
      setWarning(false);
    } catch (err) {
      if (!auto) submittedRef.current = false; // nộp tay lỗi thì cho thử lại
      setError(err.response?.data?.message || 'Lỗi nộp bài');
    }
    setSubmitting(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    doSubmit(false);
  };

  // ===== Chế độ thi toàn màn hình (Test cuối khóa) =====
  const enterFullscreen = async () => {
    const el = document.documentElement;
    try { if (el.requestFullscreen) await el.requestFullscreen(); } catch { /* trình duyệt từ chối */ }
  };
  const exitFullscreen = () => {
    try { if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen(); } catch { /* ignore */ }
  };
  const handleStartExam = async () => {
    await enterFullscreen();
    setShowStartModal(false);
    setStarted(true);
    startedRef.current = true;
  };
  const handleCancelExam = () => {
    setShowStartModal(false);
    navigate(`/student/course/${assignment.course_id}`);
  };
  const resumeExam = async () => {
    await enterFullscreen();
    setWarning(false);
  };

  // Đồng hồ đếm ngược: chỉ chạy sau khi bắt đầu thi, có giới hạn thời gian và chưa nộp
  useEffect(() => {
    if (!started || timeLeft === null || timeLeft <= 0 || msg) return undefined;
    const timer = setInterval(() => setTimeLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [started, timeLeft, msg]);

  // Hết giờ -> tự động nộp (defer ra ngoài thân effect để tránh cascading render)
  useEffect(() => {
    if (started && timeLeft === 0 && !submittedRef.current && !msg) {
      const id = setTimeout(() => doSubmit(true), 0);
      return () => clearTimeout(id);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, timeLeft, msg]);

  // ===== Giám sát: cảnh báo khi học viên rời khỏi bài thi (chỉ với Test cuối khóa) =====
  useEffect(() => {
    if (!started || !isFinalTest) return undefined;
    const flagLeave = () => {
      if (submittedRef.current) return;
      setViolations((n) => n + 1);
      setWarning(true);
    };
    const onFsChange = () => { if (!document.fullscreenElement) flagLeave(); };
    const onVisibility = () => { if (document.hidden) flagLeave(); };
    const onBeforeUnload = (e) => {
      if (submittedRef.current) return;
      e.preventDefault();
      e.returnValue = '';
    };
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [started, isFinalTest]);

  // Đang thi (Test cuối khóa) -> ẩn sidebar + trợ lý AI bằng class trên body
  useEffect(() => {
    if (started && isFinalTest && !msg) {
      document.body.classList.add('exam-mode');
    } else {
      document.body.classList.remove('exam-mode');
    }
    return () => document.body.classList.remove('exam-mode');
  }, [started, isFinalTest, msg]);

  // Rời trang -> thoát toàn màn hình cho gọn
  useEffect(() => () => {
    if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
  }, []);

  if (loading) return <div className="loading">Đang tải...</div>;
  if (error && !assignment) {
    return (
      <div>
        <div className="page-header">
          <h1>Không thể truy cập bài tập</h1>
          <Link to="/student/courses" className="btn btn-outline btn-sm">← Quay lại khóa học của tôi</Link>
        </div>
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }
  if (!assignment) return <div className="loading">Bài tập không tồn tại</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Làm bài: {assignment.title}</h1>
        {/* Đang thi Test cuối khóa thì ẩn nút Quay lại để không thoát giữa chừng */}
        {!(isFinalTest && started && !msg) && (
          <Link to={`/student/course/${assignment.course_id}`} className="btn btn-outline btn-sm">← Quay lại</Link>
        )}
      </div>

      {/* Pop-up xác nhận trước khi vào thi (Test cuối khóa) */}
      {showStartModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 500 }}>
            <h3 style={{ marginTop: 0 }}>🏁 Bắt đầu Test cuối khóa</h3>
            <p style={{ marginBottom: 8 }}>Bài kiểm tra: <strong>{assignment.title}</strong></p>
            <ul style={{ color: 'var(--text-secondary)', lineHeight: 1.8, paddingLeft: 18, margin: '8px 0 16px' }}>
              <li>Thời gian làm bài: <strong>{Number(assignment.time_limit_seconds) > 0 ? formatDuration(assignment.time_limit_seconds) : 'Không giới hạn'}</strong> — hết giờ hệ thống tự nộp.</li>
              {questions.length > 0 && <li>Số câu hỏi: <strong>{questions.length}</strong></li>}
              <li>Bài thi chạy ở chế độ <strong>toàn màn hình</strong>.</li>
              <li style={{ color: '#b91c1c' }}>⚠️ Không thoát toàn màn hình hay chuyển sang cửa sổ/tab khác trong lúc làm bài — hệ thống sẽ ghi nhận và cảnh báo.</li>
            </ul>
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={handleStartExam}>Đồng ý — Vào toàn màn hình</button>
              <button className="btn btn-outline" onClick={handleCancelExam}>Hủy</button>
            </div>
          </div>
        </div>
      )}

      {/* Cảnh báo khi rời khỏi bài thi */}
      {warning && !msg && (
        <div className="modal-overlay" style={{ zIndex: 4000 }}>
          <div className="modal-content" style={{ maxWidth: 460, borderTop: '4px solid #dc2626' }}>
            <h3 style={{ marginTop: 0, color: '#b91c1c' }}>⚠️ Cảnh báo rời khỏi bài thi</h3>
            <p>Bạn vừa thoát chế độ toàn màn hình hoặc chuyển sang cửa sổ khác.</p>
            <p>Số lần vi phạm: <strong>{violations}</strong>. Vui lòng quay lại và không rời khỏi bài thi cho đến khi nộp.</p>
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={resumeExam}>Quay lại làm bài (toàn màn hình)</button>
            </div>
          </div>
        </div>
      )}

      {started && timeLeft !== null && !msg && (
        <div
          className="alert"
          style={{
            display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600,
            background: timeLeft <= 60 ? '#fef2f2' : '#eef2ff',
            border: `1px solid ${timeLeft <= 60 ? '#fecaca' : '#c7d2fe'}`,
            color: timeLeft <= 60 ? '#b91c1c' : '#3730a3',
          }}
        >
          ⏱️ Thời gian còn lại:
          <span style={{ fontVariantNumeric: 'tabular-nums', fontSize: 18 }}>{formatDuration(timeLeft)}</span>
          {timeLeft <= 60 && <span style={{ fontWeight: 500 }}>— sắp hết giờ, hệ thống sẽ tự nộp!</span>}
        </div>
      )}

      <div className="card submit-assignment-summary">
        <p>{assignment.description || 'Không có mô tả'}</p>
        <div className="submit-assignment-meta">
          <span>Điểm tối đa: <strong>{assignment.max_score || 10}</strong></span>
          {Number(assignment.time_limit_seconds) > 0 ? (
            <span>Thời gian làm bài: <strong>{formatDuration(assignment.time_limit_seconds)}</strong></span>
          ) : (
            <span>Hạn nộp: <strong>{assignment.due_date ? new Date(assignment.due_date).toLocaleString('vi-VN') : 'Không giới hạn'}</strong></span>
          )}
          {isAutoGraded && <span>Tự chấm: <strong>Thang điểm 10</strong></span>}
        </div>
      </div>

      {msg && (
        <div className="alert alert-success">
          {msg}
          {result?.feedback && <p className="submit-feedback">{result.feedback}</p>}
        </div>
      )}

      {report && report.some((r) => r.type === 'code') && (
        <div className="card submit-report">
          <h3>Kết quả chấm code</h3>
          {report.filter((r) => r.type === 'code').map((r) => (
            <div className="submit-report-item" key={r.index}>
              <div className="submit-report-head">
                <strong>Câu {r.index + 1}</strong>
                <span className={`badge ${r.passed === r.total ? 'badge-success' : 'badge-warning'}`}>
                  Pass {r.passed}/{r.total} testcase
                </span>
              </div>
              <div className="submit-report-tests">
                {(r.results || []).map((t) => (
                  <div className={`submit-test ${t.passed ? 'pass' : 'fail'}`} key={t.index}>
                    <span className="submit-test-title">
                      {t.passed ? '✓' : '✗'} Test {t.index + 1}{t.hidden ? ' (ẩn)' : ''}
                    </span>
                    {!t.hidden && !t.passed && (
                      <div className="submit-test-detail">
                        <div>Input: <code>{t.input || '(rỗng)'}</code></div>
                        <div>Mong đợi: <code>{t.expected}</code></div>
                        <div>Bạn ra: <code>{t.actual || '(rỗng)'}</code></div>
                        {t.error && <div className="submit-test-err">⚠ {t.error}</div>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      {!msg && (!isFinalTest || started) && (
        <form onSubmit={handleSubmit}>
          {isAutoGraded ? (
            <>
              {/* Thanh số câu — đã làm tô xanh, câu hiện tại viền nổi bật */}
              <div className="exam-qnav">
                {questions.map((q, i) => (
                  <button
                    key={q.id}
                    type="button"
                    className={`exam-qnav-dot${i === currentQuestion ? ' current' : ''}${isAnswered(q) ? ' done' : ''}`}
                    onClick={() => setCurrentQuestion(i)}
                    title={`Câu ${i + 1}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              {questions.map((question, index) => index === currentQuestion && (
                <div className="card submit-question-card" key={question.id}>
                  <div className="submit-question-head">
                    <span>{getQuestionLabel(question, index)}</span>
                    <span className={`badge ${question.type === 'quiz' ? 'badge-info' : question.type === 'code' ? 'badge-primary' : 'badge-warning'}`}>
                      {question.type === 'quiz' ? 'Quiz' : question.type === 'code' ? 'Code' : 'Tự luận'}
                    </span>
                  </div>
                  <p className="submit-question-prompt">{question.prompt}</p>

                  {question.type === 'quiz' ? (
                    <div className="submit-options">
                      {(question.options || []).map((option, optionIndex) => (
                        <label className="submit-option" key={`${question.id}_${optionIndex}`}>
                          <input
                            type="radio"
                            name={question.id}
                            value={optionIndex}
                            checked={Number(answers[question.id]) === optionIndex}
                            onChange={(e) => updateAnswer(question.id, e.target.value)}
                          />
                          <span>{String.fromCharCode(65 + optionIndex)}. {option}</span>
                        </label>
                      ))}
                    </div>
                  ) : question.type === 'code' ? (
                    <div className="submit-code">
                      {(question.test_cases || []).length > 0 && (
                        <div className="submit-code-examples">
                          <strong>Ví dụ:</strong>
                          {question.test_cases.map((tc, i) => (
                            <div className="submit-code-example" key={i}>
                              <div><span>Input</span><pre>{tc.input || '(rỗng)'}</pre></div>
                              <div><span>Output</span><pre>{tc.expected}</pre></div>
                            </div>
                          ))}
                        </div>
                      )}
                      <label className="submit-code-label">Viết hàm <code>solution(input)</code> và return kết quả:</label>
                      <textarea
                        className="form-control submit-code-editor"
                        rows={12}
                        spellCheck={false}
                        style={{ fontFamily: 'monospace', fontSize: 13 }}
                        value={answers[question.id] ?? ''}
                        onChange={(e) => updateAnswer(question.id, e.target.value)}
                        placeholder="function solution(input) { ... }"
                      />
                    </div>
                  ) : (
                    <textarea
                      className="form-control"
                      rows={7}
                      value={answers[question.id] || ''}
                      onChange={(e) => updateAnswer(question.id, e.target.value)}
                      placeholder="Nhập lời giải của bạn..."
                    />
                  )}
                </div>
              ))}

              {/* Điều hướng câu */}
              <div className="exam-qactions">
                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={currentQuestion === 0}
                  onClick={() => setCurrentQuestion((i) => Math.max(0, i - 1))}
                >
                  ← Câu trước
                </button>
                <span className="exam-qcounter">Câu {currentQuestion + 1} / {questions.length}</span>
                {currentQuestion < questions.length - 1 ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setCurrentQuestion((i) => Math.min(questions.length - 1, i + 1))}
                  >
                    Câu tiếp theo →
                  </button>
                ) : (
                  <button type="submit" className="btn btn-success" disabled={submitting}>
                    {submitting ? 'Đang nộp...' : 'Nộp bài'}
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label>Bài làm của bạn</label>
                <textarea
                  className="form-control"
                  rows={10}
                  placeholder="Nhập nội dung bài làm..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  style={{ minHeight: 200 }}
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Đang nộp...' : 'Nộp bài'}
              </button>
            </>
          )}
        </form>
      )}
    </div>
  );
}
