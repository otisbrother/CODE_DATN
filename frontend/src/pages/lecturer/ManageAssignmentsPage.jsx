import { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { assignmentService } from '../../services/assignment.service';
import { sectionService } from '../../services/section.service';
import ConfirmModal from '../../components/ConfirmModal';
import './ManageAssignmentsPage.css';

const ASSIGNMENT_TYPES = {
  manual: 'Bài thường',
  quiz: 'Quiz trắc nghiệm',
  essay: 'Tự luận/code ngắn',
  mixed: 'Quiz + tự luận',
  code: 'Code tự chấm (LeetCode)',
};

const DEFAULT_STARTER_CODE = `function solution(input) {
  // input: chuỗi đầu vào của testcase (tự parse nếu cần)
  // Viết code và return kết quả
  return input;
}`;

const makeQuestionId = (type, index) => `${type}_${Date.now()}_${index}`;

const createCodeQuestion = (index) => ({
  id: makeQuestionId('code', index),
  type: 'code',
  prompt: '',
  starter_code: DEFAULT_STARTER_CODE,
  test_cases: [{ input: '', expected: '', is_sample: true }],
});

const createQuizQuestion = (index) => ({
  id: makeQuestionId('quiz', index),
  type: 'quiz',
  prompt: '',
  options: ['', '', '', ''],
  correct_option: 0,
});

const createEssayQuestion = (index) => ({
  id: makeQuestionId('essay', index),
  type: 'essay',
  prompt: '',
  expected_answer: '',
  keywords: '',
});

const syncQuestions = (quizCount, essayCount, previousQuestions = []) => {
  const oldQuiz = previousQuestions.filter((question) => question.type === 'quiz');
  const oldEssay = previousQuestions.filter((question) => question.type === 'essay');
  const quizQuestions = Array.from({ length: quizCount }, (_, index) => oldQuiz[index] || createQuizQuestion(index));
  const essayQuestions = Array.from({ length: essayCount }, (_, index) => oldEssay[index] || createEssayQuestion(index));
  return [...quizQuestions, ...essayQuestions];
};

// Chuyển chuỗi "phút:giây" (vd "40:00") -> số giây. Cho phép nhập số phút trơn (vd "40").
const mmssToSeconds = (str) => {
  const text = String(str || '').trim();
  if (!text) return null;
  const mmss = text.match(/^(\d{1,3}):([0-5]?\d)$/);
  if (mmss) return Number(mmss[1]) * 60 + Number(mmss[2]);
  const onlyMin = text.match(/^(\d{1,3})$/);
  if (onlyMin) return Number(onlyMin[1]) * 60;
  return NaN; // sai định dạng
};
// Số giây -> "phút:giây" (vd 2400 -> "40:00")
const secondsToMmss = (sec) => {
  const s = Math.max(0, Number(sec) || 0);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

const createDefaultForm = (sectionId = '', isFinal = false) => ({
  title: isFinal ? 'Test cuối khóa' : '',
  description: '',
  due_date: '',
  time_limit: isFinal ? '40:00' : '', // thời gian làm bài (phút:giây) cho Test cuối khóa
  max_score: 10,
  section_id: sectionId || '',
  status: 'active',
  assignment_type: isFinal ? 'quiz' : 'mixed',
  is_final_test: isFinal,
  quiz_count: isFinal ? 5 : 3,
  essay_count: isFinal ? 0 : 1,
  questions: syncQuestions(isFinal ? 5 : 3, isFinal ? 0 : 1),
});

const getCountsByType = (type, currentForm) => {
  if (type === 'manual' || type === 'code') return { quiz_count: 0, essay_count: 0 };
  if (type === 'quiz') return { quiz_count: Math.max(currentForm.quiz_count || 1, 1), essay_count: 0 };
  if (type === 'essay') return { quiz_count: 0, essay_count: Math.max(currentForm.essay_count || 1, 1) };
  return {
    quiz_count: Math.max(currentForm.quiz_count || 1, 1),
    essay_count: Math.max(currentForm.essay_count || 1, 1),
  };
};

const normalizeLoadedForm = (assignment) => {
  const questions = Array.isArray(assignment.questions)
    ? assignment.questions.map((question, index) => {
      if (question.type === 'code') {
        const tests = Array.isArray(question.test_cases) && question.test_cases.length
          ? question.test_cases.map((tc) => ({
            input: tc.input || '',
            expected: tc.expected || '',
            is_sample: !!tc.is_sample,
          }))
          : [{ input: '', expected: '', is_sample: true }];
        return {
          id: question.id || makeQuestionId('code', index),
          type: 'code',
          prompt: question.prompt || '',
          starter_code: question.starter_code || DEFAULT_STARTER_CODE,
          test_cases: tests,
        };
      }
      return {
        ...question,
        id: question.id || makeQuestionId(question.type || 'question', index),
        type: question.type === 'essay' ? 'essay' : 'quiz',
        options: Array.isArray(question.options) ? question.options : ['', '', '', ''],
        correct_option: Number.isInteger(Number(question.correct_option)) ? Number(question.correct_option) : 0,
        expected_answer: question.expected_answer || '',
        keywords: Array.isArray(question.keywords) ? question.keywords.join('\n') : (question.keywords || ''),
      };
    })
    : [];
  const quizCount = questions.filter((question) => question.type === 'quiz').length;
  const essayCount = questions.filter((question) => question.type === 'essay').length;

  return {
    title: assignment.title,
    description: assignment.description || '',
    due_date: assignment.due_date ? assignment.due_date.substring(0, 16) : '',
    time_limit: assignment.time_limit_seconds ? secondsToMmss(assignment.time_limit_seconds) : '',
    max_score: 10,
    section_id: assignment.section_id,
    status: assignment.status || 'active',
    assignment_type: assignment.assignment_type || (questions.length ? 'mixed' : 'manual'),
    is_final_test: !!assignment.is_final_test,
    quiz_count: quizCount,
    essay_count: essayCount,
    questions,
  };
};

const getQuestionCount = (assignment) => {
  const questions = Array.isArray(assignment.questions) ? assignment.questions : [];
  if (questions.length === 0) return '-';
  const codeCount = questions.filter((question) => question.type === 'code').length;
  if (codeCount > 0) return `${codeCount} code`;
  const quizCount = questions.filter((question) => question.type === 'quiz').length;
  const essayCount = questions.filter((question) => question.type === 'essay').length;
  return `${quizCount} TN / ${essayCount} TL`;
};

export default function ManageAssignmentsPage() {
  const { courseId } = useParams();
  const [searchParams] = useSearchParams();
  const wantFinal = searchParams.get('final') === '1'; // mở thẳng form tạo Test cuối khóa
  const [assignments, setAssignments] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(wantFinal);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(() => createDefaultForm('', wantFinal));
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('success');
  const [deleteId, setDeleteId] = useState(null);

  const showMessage = (message, type = 'success') => {
    setMsg(message);
    setMsgType(type);
    setTimeout(() => setMsg(''), 3000);
  };

  const load = async () => {
    try {
      const [aRes, sRes] = await Promise.all([
        assignmentService.getByCourse(courseId),
        sectionService.getByCourse(courseId),
      ]);
      setAssignments(aRes.data.data || []);
      setSections(sRes.data.data || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [courseId]);

  const openCreate = (sectionId, isFinal = false) => {
    setEditId(null);
    setForm(createDefaultForm(sectionId, isFinal));
    setShowModal(true);
  };

  const openEdit = (assignment) => {
    setEditId(assignment.id);
    setForm(normalizeLoadedForm(assignment));
    setShowModal(true);
  };

  const updateAssignmentType = (assignmentType) => {
    setForm((current) => {
      if (assignmentType === 'code') {
        const codeQuestions = current.questions.filter((q) => q.type === 'code');
        return {
          ...current,
          assignment_type: 'code',
          quiz_count: 0,
          essay_count: 0,
          max_score: 10,
          questions: codeQuestions.length ? codeQuestions : [createCodeQuestion(0)],
        };
      }
      const counts = getCountsByType(assignmentType, current);
      return {
        ...current,
        assignment_type: assignmentType,
        ...counts,
        max_score: 10,
        questions: syncQuestions(counts.quiz_count, counts.essay_count, current.questions),
      };
    });
  };

  // ----- Handlers riêng cho bài code -----
  const addCodeQuestion = () => setForm((c) => ({
    ...c, questions: [...c.questions, createCodeQuestion(c.questions.length)],
  }));
  const removeCodeQuestion = (index) => setForm((c) => ({
    ...c, questions: c.questions.filter((_, i) => i !== index),
  }));
  const addTestCase = (qIndex) => setForm((c) => ({
    ...c,
    questions: c.questions.map((q, i) => (i === qIndex
      ? { ...q, test_cases: [...(q.test_cases || []), { input: '', expected: '', is_sample: false }] }
      : q)),
  }));
  const updateTestCase = (qIndex, tcIndex, patch) => setForm((c) => ({
    ...c,
    questions: c.questions.map((q, i) => {
      if (i !== qIndex) return q;
      const tcs = [...(q.test_cases || [])];
      tcs[tcIndex] = { ...tcs[tcIndex], ...patch };
      return { ...q, test_cases: tcs };
    }),
  }));
  const removeTestCase = (qIndex, tcIndex) => setForm((c) => ({
    ...c,
    questions: c.questions.map((q, i) => (i === qIndex
      ? { ...q, test_cases: q.test_cases.filter((_, j) => j !== tcIndex) }
      : q)),
  }));

  const updateQuestionCount = (field, value) => {
    const nextValue = Math.max(0, Math.min(Number(value) || 0, 50));
    setForm((current) => {
      const next = { ...current, [field]: nextValue };
      if (current.assignment_type === 'quiz') next.essay_count = 0;
      if (current.assignment_type === 'essay') next.quiz_count = 0;
      return {
        ...next,
        questions: syncQuestions(next.quiz_count, next.essay_count, current.questions),
      };
    });
  };

  const updateQuestion = (index, patch) => {
    setForm((current) => ({
      ...current,
      questions: current.questions.map((question, questionIndex) => (
        questionIndex === index ? { ...question, ...patch } : question
      )),
    }));
  };

  const updateOption = (questionIndex, optionIndex, value) => {
    setForm((current) => ({
      ...current,
      questions: current.questions.map((question, index) => {
        if (index !== questionIndex) return question;
        const options = [...question.options];
        options[optionIndex] = value;
        return { ...question, options };
      }),
    }));
  };

  const validateForm = () => {
    if (form.is_final_test && form.time_limit.trim()) {
      const secs = mmssToSeconds(form.time_limit);
      if (Number.isNaN(secs) || secs <= 0) {
        return 'Thời gian làm bài không hợp lệ. Nhập theo định dạng phút:giây, ví dụ 40:00 hoặc 60:00.';
      }
    }
    if (form.assignment_type === 'manual') return '';
    if (form.questions.length === 0) return 'Cần tạo ít nhất 1 câu hỏi.';

    for (let index = 0; index < form.questions.length; index += 1) {
      const question = form.questions[index];
      if (!question.prompt.trim()) return `Câu ${index + 1} chưa có đề bài.`;

      if (question.type === 'quiz') {
        const filledOptions = question.options.filter((option) => option.trim());
        if (filledOptions.length < 2) return `Câu ${index + 1} cần ít nhất 2 đáp án.`;
        if (!question.options[question.correct_option]?.trim()) return `Câu ${index + 1} chưa chọn đáp án đúng hợp lệ.`;
      }

      if (question.type === 'essay' && !question.expected_answer?.trim() && !question.keywords?.trim()) {
        return `Câu ${index + 1} cần đáp án mẫu hoặc từ khóa để hệ thống tự chấm.`;
      }

      if (question.type === 'code') {
        const validTests = (question.test_cases || []).filter((tc) => String(tc.expected || '').trim());
        if (validTests.length === 0) return `Câu ${index + 1} cần ít nhất 1 testcase có kết quả mong đợi.`;
      }
    }

    return '';
  };

  const buildPayload = () => {
    const questions = form.assignment_type === 'manual' ? [] : form.questions.map((question) => ({
      ...question,
      options: question.type === 'quiz' ? question.options : [],
      correct_option: question.type === 'quiz' ? Number(question.correct_option) : null,
    }));

    return {
      title: form.title,
      description: form.description,
      due_date: form.due_date,
      // Test cuối khóa: lưu thời gian làm bài (giây); bài thường: không dùng -> null
      time_limit_seconds: form.is_final_test ? mmssToSeconds(form.time_limit) : null,
      max_score: 10,
      section_id: form.is_final_test ? null : Number(form.section_id),
      status: form.status,
      assignment_type: form.assignment_type,
      is_final_test: !!form.is_final_test,
      questions,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formError = validateForm();
    if (formError) {
      showMessage(formError, 'error');
      return;
    }

    try {
      const payload = buildPayload();
      if (editId) {
        await assignmentService.update(editId, payload);
        showMessage('Cập nhật bài tập thành công');
      } else {
        await assignmentService.create({ ...payload, course_id: Number(courseId) });
        showMessage('Thêm bài tập thành công');
      }
      setShowModal(false);
      load();
    } catch (err) {
      showMessage(err.response?.data?.message || 'Lỗi lưu bài tập', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await assignmentService.remove(deleteId);
      showMessage('Xóa thành công');
      setDeleteId(null);
      load();
    } catch (e) {
      showMessage(e.response?.data?.message || 'Lỗi xóa', 'error');
      setDeleteId(null);
    }
  };

  const assignmentRow = (assignment) => (
    <tr key={assignment.id}>
      <td>{assignment.id}</td>
      <td>
        <strong>{assignment.title}</strong>
        {assignment.is_final_test && <span className="badge badge-primary" style={{ marginLeft: 6 }}>🏁 Cuối khóa</span>}
      </td>
      <td>{ASSIGNMENT_TYPES[assignment.assignment_type] || 'Bài thường'}</td>
      <td>{getQuestionCount(assignment)}</td>
      <td>{assignment.max_score || 10}</td>
      <td>{assignment.due_date ? new Date(assignment.due_date).toLocaleDateString('vi-VN') : '-'}</td>
      <td>
        <span className={`badge ${assignment.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
          {assignment.status === 'active' ? 'Hoạt động' : 'Lưu trữ'}
        </span>
      </td>
      <td>
        <div className="assignment-row-actions">
          <button className="btn btn-outline btn-sm" onClick={() => openEdit(assignment)}>Sửa</button>
          <Link to={`/lecturer/assignments/${assignment.id}/grade`} className="btn btn-primary btn-sm">Bài nộp</Link>
          <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(assignment.id)}>Xóa</button>
        </div>
      </td>
    </tr>
  );
  const tableHead = (
    <thead>
      <tr><th>ID</th><th>Tiêu đề</th><th>Loại</th><th>Câu hỏi</th><th>Điểm</th><th>Hạn nộp</th><th>Trạng thái</th><th>Thao tác</th></tr>
    </thead>
  );
  const finalTests = assignments.filter((a) => a.is_final_test);

  if (loading) return <div className="loading">Đang tải...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Bài tập & Kiểm tra (Khóa #{courseId})</h1>
        <div className="assignment-page-actions">
          <button className="btn btn-primary" onClick={() => openCreate('')}>+ Thêm bài tập</button>
          <Link to="/lecturer/courses" className="btn btn-outline">← Quay lại</Link>
        </div>
      </div>

      {msg && <div className={`alert ${msgType === 'error' ? 'alert-error' : 'alert-success'}`}>{msg}</div>}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content modal-xl assignment-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editId ? 'Sửa bài tập' : (form.is_final_test ? '🏁 Test cuối khóa' : 'Thêm bài tập mới')}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="assignment-form-grid">
                <div className="form-group">
                  <label>Tiêu đề *</label>
                  <input
                    className="form-control"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Chương {form.is_final_test ? '' : '*'}</label>
                  {form.is_final_test ? (
                    <input className="form-control" value="🏁 Test cuối khóa — không thuộc chương, luôn xếp cuối" disabled />
                  ) : (
                    <select
                      className="form-control"
                      value={form.section_id}
                      onChange={(e) => setForm({ ...form, section_id: Number(e.target.value) })}
                      required
                    >
                      <option value="">-- Chọn chương --</option>
                      {sections.map((section) => (
                        <option key={section.id} value={section.id}>{section.title}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {!form.is_final_test && (
                <div className="form-group">
                  <label>Mô tả</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
              )}

              <div className="assignment-form-grid assignment-form-grid-4">
                <div className="form-group">
                  <label>Loại bài *</label>
                  <select
                    className="form-control"
                    value={form.assignment_type}
                    onChange={(e) => updateAssignmentType(e.target.value)}
                  >
                    {Object.entries(ASSIGNMENT_TYPES).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                {form.is_final_test ? (
                  <div className="form-group">
                    <label>Thời gian làm bài (phút:giây)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.time_limit}
                      onChange={(e) => setForm({ ...form, time_limit: e.target.value })}
                      placeholder="VD: 40:00, 60:00"
                    />
                  </div>
                ) : (
                  <div className="form-group">
                    <label>Hạn nộp</label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      value={form.due_date}
                      onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                    />
                  </div>
                )}
                <div className="form-group">
                  <label>Điểm tối đa</label>
                  <input type="number" className="form-control" value={10} readOnly />
                </div>
                <div className="form-group">
                  <label>Trạng thái</label>
                  <select
                    className="form-control"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    <option value="active">Hoạt động</option>
                    <option value="archived">Lưu trữ</option>
                  </select>
                </div>
              </div>

              {!form.is_final_test && (
                <label style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '12px 14px', margin: '4px 0 16px', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 10, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={!!form.is_final_test}
                    onChange={(e) => setForm({ ...form, is_final_test: e.target.checked })}
                  />
                  <span>🏁 Đây là <strong>Test cuối khóa</strong> — mỗi khóa chỉ 1 bài, tính vào tiến độ học tập.</span>
                </label>
              )}

              {form.assignment_type === 'code' && (
                <div className="assignment-builder">
                  <div className="assignment-builder-head">
                    <div>
                      <strong>Tạo đề code tự chấm</strong>
                      <p>Học viên viết hàm <code>solution(input)</code> (JavaScript) và return kết quả. Hệ thống chạy với từng testcase rồi chấm theo số test đúng.</p>
                    </div>
                    <span className="badge badge-primary">Thang điểm 10</span>
                  </div>

                  <div className="assignment-question-list">
                    {form.questions.map((question, index) => (
                      <div className="assignment-question-card" key={question.id}>
                        <div className="assignment-question-title">
                          <span>Câu {index + 1}</span>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <span className="badge badge-info">CODE</span>
                            {form.questions.length > 1 && (
                              <button type="button" className="btn btn-danger btn-sm" onClick={() => removeCodeQuestion(index)}>Xóa câu</button>
                            )}
                          </div>
                        </div>

                        <div className="form-group">
                          <label>Đề bài *</label>
                          <textarea
                            className="form-control"
                            rows={2}
                            value={question.prompt}
                            onChange={(e) => updateQuestion(index, { prompt: e.target.value })}
                            placeholder="VD: Đọc 2 số cách nhau dấu cách, in ra tổng của chúng..."
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label>Code mẫu (starter code)</label>
                          <textarea
                            className="form-control"
                            rows={6}
                            style={{ fontFamily: 'monospace', fontSize: 13 }}
                            value={question.starter_code || ''}
                            onChange={(e) => updateQuestion(index, { starter_code: e.target.value })}
                          />
                        </div>

                        <div className="form-group">
                          <label>Testcase (đánh dấu “Ví dụ” để hiển thị cho học viên, còn lại là test ẩn chấm điểm)</label>
                          <div className="code-testcase-list">
                            {(question.test_cases || []).map((tc, tcIndex) => (
                              <div className="code-testcase-row" key={tcIndex}>
                                <textarea
                                  className="form-control"
                                  rows={2}
                                  style={{ fontFamily: 'monospace', fontSize: 13, flex: 1 }}
                                  value={tc.input}
                                  placeholder="Input"
                                  onChange={(e) => updateTestCase(index, tcIndex, { input: e.target.value })}
                                />
                                <textarea
                                  className="form-control"
                                  rows={2}
                                  style={{ fontFamily: 'monospace', fontSize: 13, flex: 1 }}
                                  value={tc.expected}
                                  placeholder="Kết quả mong đợi"
                                  onChange={(e) => updateTestCase(index, tcIndex, { expected: e.target.value })}
                                />
                                <div className="code-testcase-actions">
                                  <label title="Testcase mẫu sẽ hiển thị cho học viên làm ví dụ">
                                    <input
                                      type="checkbox"
                                      checked={!!tc.is_sample}
                                      onChange={(e) => updateTestCase(index, tcIndex, { is_sample: e.target.checked })}
                                    /> Ví dụ
                                  </label>
                                  {question.test_cases.length > 1 && (
                                    <button type="button" className="btn btn-danger btn-sm" onClick={() => removeTestCase(index, tcIndex)}>×</button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                          <button type="button" className="btn btn-outline btn-sm" style={{ marginTop: 8 }} onClick={() => addTestCase(index)}>+ Thêm testcase</button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button type="button" className="btn btn-outline" style={{ marginTop: 12 }} onClick={addCodeQuestion}>+ Thêm câu code</button>
                </div>
              )}

              {form.assignment_type !== 'manual' && form.assignment_type !== 'code' && (
                <div className="assignment-builder">
                  <div className="assignment-builder-head">
                    <div>
                      <strong>Tạo đề tự chấm</strong>
                      <p>Quiz chấm theo đáp án đúng, tự luận/code ngắn chấm theo đáp án mẫu hoặc từ khóa.</p>
                    </div>
                    <span className="badge badge-primary">Thang điểm 10</span>
                  </div>

                  <div className="assignment-count-grid">
                    <div className="form-group">
                      <label>Số câu trắc nghiệm</label>
                      <input
                        type="number"
                        min={0}
                        max={50}
                        className="form-control"
                        value={form.quiz_count}
                        disabled={form.assignment_type === 'essay'}
                        onChange={(e) => updateQuestionCount('quiz_count', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Số câu tự luận</label>
                      <input
                        type="number"
                        min={0}
                        max={50}
                        className="form-control"
                        value={form.essay_count}
                        disabled={form.assignment_type === 'quiz'}
                        onChange={(e) => updateQuestionCount('essay_count', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="assignment-question-list">
                    {form.questions.map((question, index) => (
                      <div className="assignment-question-card" key={question.id}>
                        <div className="assignment-question-title">
                          <span>Câu {index + 1}</span>
                          <span className={`badge ${question.type === 'quiz' ? 'badge-info' : 'badge-warning'}`}>
                            {question.type === 'quiz' ? 'Trắc nghiệm' : 'Tự luận'}
                          </span>
                        </div>

                        <div className="form-group">
                          <label>Đề bài *</label>
                          <textarea
                            className="form-control"
                            rows={2}
                            value={question.prompt}
                            onChange={(e) => updateQuestion(index, { prompt: e.target.value })}
                            placeholder={question.type === 'quiz' ? 'Nhập câu hỏi trắc nghiệm...' : 'Nhập đề tự luận/code ngắn...'}
                            required
                          />
                        </div>

                        {question.type === 'quiz' ? (
                          <div className="assignment-options-grid">
                            {question.options.map((option, optionIndex) => (
                              <div className="assignment-option-row" key={`${question.id}_${optionIndex}`}>
                                <label>
                                  <input
                                    type="radio"
                                    name={`correct_${question.id}`}
                                    checked={Number(question.correct_option) === optionIndex}
                                    onChange={() => updateQuestion(index, { correct_option: optionIndex })}
                                  />
                                  Đáp án {String.fromCharCode(65 + optionIndex)}
                                </label>
                                <input
                                  className="form-control"
                                  value={option}
                                  onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                                  placeholder={`Nội dung đáp án ${String.fromCharCode(65 + optionIndex)}`}
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="assignment-form-grid">
                            <div className="form-group">
                              <label>Đáp án mẫu</label>
                              <textarea
                                className="form-control"
                                rows={3}
                                value={question.expected_answer || ''}
                                onChange={(e) => updateQuestion(index, { expected_answer: e.target.value })}
                                placeholder="Nhập đáp án mẫu để hệ thống so khớp nội dung..."
                              />
                            </div>
                            <div className="form-group">
                              <label>Từ khóa/ý chính</label>
                              <textarea
                                className="form-control"
                                rows={3}
                                value={question.keywords || ''}
                                onChange={(e) => updateQuestion(index, { keywords: e.target.value })}
                                placeholder="Mỗi dòng hoặc mỗi dấu phẩy là một ý cần có..."
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">{editId ? 'Cập nhật' : 'Thêm bài tập'}</button>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        show={!!deleteId}
        title="Xóa bài tập"
        message="Bạn có chắc chắn muốn xóa bài tập này không? Tất cả bài nộp liên quan cũng sẽ bị xóa."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />

      {sections.map((section) => {
        const sectionAssignments = assignments.filter((a) => a.section_id === section.id && !a.is_final_test);
        if (sectionAssignments.length === 0) return null;
        return (
          <div key={section.id} className="card" style={{ marginBottom: 20 }}>
            <div className="assignment-section-head">
              <h3>{section.title}</h3>
              <button className="btn btn-primary btn-sm" onClick={() => openCreate(section.id)}>+ Bài tập</button>
            </div>
            <div className="table-container" style={{ margin: 0 }}>
              <table>
                {tableHead}
                <tbody>{sectionAssignments.map(assignmentRow)}</tbody>
              </table>
            </div>
          </div>
        );
      })}

      {/* Test cuối khóa luôn xếp cuối, không thuộc chương nào */}
      {finalTests.length > 0 && (
        <div className="card" style={{ marginBottom: 20, border: '1px solid #c7d2fe' }}>
          <div className="assignment-section-head">
            <h3>🏁 Test cuối khóa</h3>
          </div>
          <div className="table-container" style={{ margin: 0 }}>
            <table>
              {tableHead}
              <tbody>{finalTests.map(assignmentRow)}</tbody>
            </table>
          </div>
        </div>
      )}

      {assignments.length === 0 && (
        <p style={{ color: 'var(--text-secondary)', marginTop: 20 }}>Chưa có bài tập.</p>
      )}
    </div>
  );
}
