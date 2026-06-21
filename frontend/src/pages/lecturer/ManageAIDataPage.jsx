import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FiActivity,
  FiAlertCircle,
  FiBookOpen,
  FiCheckCircle,
  FiClock,
  FiDatabase,
  FiEdit2,
  FiEye,
  FiFileText,
  FiLayers,
  FiMessageSquare,
  FiRefreshCw,
  FiSend,
  FiTarget,
  FiTrash2,
  FiUploadCloud,
  FiXCircle,
} from 'react-icons/fi';
import { aiService } from '../../services/ai.service';
import { courseService } from '../../services/course.service';
import useAuthStore from '../../store/auth.store';
import './ManageAIDataPage.css';

const MODE_CONFIG = {
  qa: {
    label: 'Giải thích, định hướng',
    title: 'Hỏi đáp đúng trọng tâm',
    description: 'Nguồn dùng cho AI giải thích khái niệm, bắt keyword và gợi ý hướng học.',
    uploadTitle: 'Thêm dữ liệu giải thích',
    uploadType: 'explain_guidance',
    testLabel: 'Câu hỏi học viên',
    testPlaceholder: 'Ví dụ: AI là gì và khác machine learning như thế nào?',
    samples: [
      'AI là gì và khác machine learning như thế nào?',
      'Em chưa hiểu JOIN dùng khi nào trong MySQL',
      'Gợi ý cách học phần props và state, đừng đưa đáp án bài tập',
    ],
  },
  path: {
    label: 'Lộ trình cá nhân',
    title: 'Dữ liệu cho lộ trình học',
    description: 'Nguồn định nghĩa mục tiêu, mức độ bài học, điều kiện tiên quyết và tiêu chí phân tầng năng lực.',
    uploadTitle: 'Thêm dữ liệu lộ trình',
    uploadType: 'learning_path',
    testLabel: 'Mục tiêu hoặc tình huống học viên',
    testPlaceholder: 'Ví dụ: Em mới xong chương 1, điểm bài tập thấp, nên học gì tiếp?',
    samples: [
      'Em mới xong chương 1, điểm bài tập thấp, nên học gì tiếp?',
      'Em mất gốc phần cơ bản và chỉ có 30 phút mỗi ngày',
      'Em muốn học nhanh để làm được bài cuối khóa',
    ],
  },
};

const STATUS_META = {
  approved: { label: 'Đang dùng', className: 'is-approved', icon: <FiCheckCircle /> },
  rejected: { label: 'Từ chối', className: 'is-rejected', icon: <FiXCircle /> },
  pending: { label: 'Chưa kích hoạt', className: 'is-pending', icon: <FiClock /> },
};

const typeLabel = (type) => {
  if (type === 'learning_path') return 'Lộ trình';
  if (type === 'explain_guidance' || type === 'text') return 'Giải thích';
  return type || 'Khác';
};

const statusMeta = (status) => STATUS_META[status] || STATUS_META.pending;

const buildDefaultFileName = (mode, course) => {
  const prefix = mode === 'path' ? 'lo_trinh' : 'giai_thich';
  const courseName = String(course?.title || 'khoa_hoc')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^\w]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
  return `${prefix}_${courseName || 'khoa_hoc'}.txt`;
};

export default function ManageAIDataPage() {
  const { user } = useAuthStore();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [aiData, setAiData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [activeMode, setActiveMode] = useState('qa');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ content: '', file_name: '' });
  const [editingSource, setEditingSource] = useState(null);
  const [viewingSource, setViewingSource] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [msg, setMsg] = useState(null);
  const [testQuestion, setTestQuestion] = useState(MODE_CONFIG.qa.samples[0]);
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);
  const [testError, setTestError] = useState('');

  const selectedCourseInfo = useMemo(
    () => courses.find((course) => String(course.id) === String(selectedCourse)),
    [courses, selectedCourse]
  );

  const loadAiData = useCallback(async (courseId) => {
    if (!courseId) {
      setAiData([]);
      return;
    }

    setDataLoading(true);
    try {
      const res = await aiService.getDataByCourse(courseId);
      setAiData(res.data.data || []);
    } catch (error) {
      setMsg({ type: 'error', text: error.response?.data?.message || 'Không tải được dữ liệu AI' });
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadCourses = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const res = await courseService.getAll({ lecturer_id: user.id, limit: 100 });
        const items = res.data.data || [];
        setCourses(items);
        if (items.length > 0) setSelectedCourse(String(items[0].id));
      } catch (error) {
        setMsg({ type: 'error', text: error.response?.data?.message || 'Không tải được danh sách khóa học' });
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, [user?.id]);

  useEffect(() => {
    loadAiData(selectedCourse);
    setTestResult(null);
    setTestError('');
  }, [loadAiData, selectedCourse]);

  useEffect(() => {
    setTestQuestion(MODE_CONFIG[activeMode].samples[0]);
    setTestResult(null);
    setTestError('');
  }, [activeMode]);

  const stats = useMemo(() => {
    const approved = aiData.filter((item) => item.status === 'approved').length;
    const pending = aiData.filter((item) => item.status === 'pending').length;
    const rejected = aiData.filter((item) => item.status === 'rejected').length;
    const path = aiData.filter((item) => item.file_type === 'learning_path').length;
    return {
      total: aiData.length,
      approved,
      pending,
      rejected,
      explain: aiData.length - path,
      path,
    };
  }, [aiData]);

  const activeModeData = useMemo(() => aiData.filter((item) => (
    activeMode === 'path'
      ? item.file_type === 'learning_path'
      : item.file_type !== 'learning_path'
  )), [activeMode, aiData]);

  const mode = MODE_CONFIG[activeMode];

  const openCreateModal = () => {
    setEditingSource(null);
    setForm({
      content: '',
      file_name: buildDefaultFileName(activeMode, selectedCourseInfo),
    });
    setShowModal(true);
  };

  const openEditModal = (source) => {
    setEditingSource(source);
    setForm({
      content: source.content || '',
      file_name: source.file_name || buildDefaultFileName(activeMode, selectedCourseInfo),
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingSource(null);
    setForm({ content: '', file_name: '' });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedCourse) return;

    try {
      const payload = {
        course_id: Number(selectedCourse),
        file_name: form.file_name || buildDefaultFileName(activeMode, selectedCourseInfo),
        file_type: editingSource?.file_type || mode.uploadType,
        content: form.content,
      };

      if (editingSource) {
        await aiService.updateData(editingSource.id, payload);
      } else {
        await aiService.uploadData(payload);
      }

      setMsg({
        type: 'success',
        text: editingSource
          ? 'Đã cập nhật dữ liệu AI. Nguồn mới sẽ được dùng khi test phản hồi.'
          : 'Đã lưu dữ liệu AI. Nguồn này có thể được dùng khi test phản hồi.',
      });
      setShowModal(false);
      setEditingSource(null);
      setForm({ content: '', file_name: '' });
      setTestResult(null);
      await loadAiData(selectedCourse);
      window.setTimeout(() => setMsg(null), 3500);
    } catch (error) {
      setMsg({ type: 'error', text: error.response?.data?.message || 'Lỗi lưu dữ liệu AI' });
    }
  };

  const handleDelete = async (source) => {
    const confirmed = window.confirm(`Xóa nguồn dữ liệu "${source.file_name}"?`);
    if (!confirmed) return;

    setDeletingId(source.id);
    try {
      await aiService.deleteData(source.id);
      setMsg({ type: 'success', text: 'Đã xóa dữ liệu AI' });
      setTestResult(null);
      await loadAiData(selectedCourse);
      window.setTimeout(() => setMsg(null), 3000);
    } catch (error) {
      setMsg({ type: 'error', text: error.response?.data?.message || 'Lỗi xóa dữ liệu AI' });
    } finally {
      setDeletingId(null);
    }
  };

  const handleRunTest = async () => {
    if (!selectedCourse || !testQuestion.trim()) return;

    setTesting(true);
    setTestError('');
    setTestResult(null);
    try {
      const res = await aiService.testLearningAssistant({
        course_id: Number(selectedCourse),
        mode: activeMode,
        message: testQuestion.trim(),
      });
      setTestResult(res.data.data);
    } catch (error) {
      setTestError(error.response?.data?.message || 'Không kiểm thử được AI lúc này');
    } finally {
      setTesting(false);
    }
  };

  if (loading) return <div className="loading">Đang tải...</div>;

  return (
    <div className="ai-data-page">
      <header className="ai-data-header">
        <div>
          <span className="ai-data-eyebrow">Không gian AI giáo viên</span>
          <h1>Quản lý dữ liệu AI</h1>
          <p>Chọn khóa học, cấp nguồn kiến thức và kiểm thử phản hồi AI trước khi học viên sử dụng.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreateModal} disabled={!selectedCourse}>
          <FiUploadCloud /> Lưu dữ liệu AI
        </button>
      </header>

      {msg && (
        <div className={`alert ${msg.type === 'error' ? 'alert-error' : 'alert-success'}`}>
          {msg.text}
        </div>
      )}

      {courses.length === 0 ? (
        <section className="ai-empty-state">
          <FiBookOpen />
          <h2>Chưa có khóa học để cấu hình AI</h2>
          <p>Tạo khóa học trước, sau đó quay lại phần dữ liệu AI.</p>
        </section>
      ) : (
        <>
          <section className="ai-control-bar">
            <div className="ai-course-picker">
              <label>Khóa học cung cấp dữ liệu</label>
              <select className="form-control" value={selectedCourse} onChange={(event) => setSelectedCourse(event.target.value)}>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>{course.title}</option>
                ))}
              </select>
            </div>

            <div className="ai-mode-tabs" role="tablist" aria-label="Mục đích dữ liệu AI">
              {Object.entries(MODE_CONFIG).map(([key, item]) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={activeMode === key}
                  className={activeMode === key ? 'is-active' : ''}
                  onClick={() => setActiveMode(key)}
                >
                  {key === 'qa' ? <FiMessageSquare /> : <FiTarget />}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="ai-mode-brief">
            <div className="ai-mode-icon">{activeMode === 'qa' ? <FiMessageSquare /> : <FiLayers />}</div>
            <div>
              <h2>{mode.title}</h2>
              <p>{mode.description}</p>
            </div>
          </section>

          <section className="ai-stat-grid">
            <div className="ai-stat-item">
              <FiDatabase />
              <span>Tổng nguồn</span>
              <strong>{stats.total}</strong>
            </div>
            <div className="ai-stat-item is-success">
              <FiCheckCircle />
              <span>Đang dùng</span>
              <strong>{stats.approved}</strong>
            </div>
            <div className="ai-stat-item is-warning">
              <FiClock />
              <span>Chưa kích hoạt</span>
              <strong>{stats.pending}</strong>
            </div>
            <div className="ai-stat-item is-info">
              <FiActivity />
              <span>{activeMode === 'qa' ? 'Nguồn giải thích' : 'Nguồn lộ trình'}</span>
              <strong>{activeMode === 'qa' ? stats.explain : stats.path}</strong>
            </div>
          </section>

          <div className="ai-workspace-grid">
            <section className="ai-panel ai-source-panel">
              <div className="ai-panel-header">
                <div>
                  <h2>Nguồn dữ liệu khóa học</h2>
                  <p>{selectedCourseInfo?.title}</p>
                </div>
                <button type="button" className="ai-icon-btn" onClick={() => loadAiData(selectedCourse)} disabled={dataLoading} title="Tải lại dữ liệu">
                  <FiRefreshCw />
                </button>
              </div>

              {dataLoading ? (
                <div className="ai-inline-loading">Đang tải dữ liệu...</div>
              ) : activeModeData.length === 0 ? (
                <div className="ai-source-empty">
                  <FiFileText />
                  <p>Chưa có nguồn dữ liệu cho mục này.</p>
                  <button type="button" className="btn btn-outline btn-sm" onClick={openCreateModal}>
                    Thêm nguồn
                  </button>
                </div>
              ) : (
                <div className="ai-source-list">
                  {activeModeData.map((item) => {
                    const meta = statusMeta(item.status);
                    return (
                      <article key={item.id} className="ai-source-item">
                        <div className="ai-source-main">
                          <div className="ai-source-file">
                            <FiFileText />
                            <div>
                              <strong>{item.file_name}</strong>
                              <span>{typeLabel(item.file_type)} - {item.uploader_name || 'Giáo viên'}</span>
                            </div>
                          </div>
                          {item.content && <p>{String(item.content).slice(0, 160)}{String(item.content).length > 160 ? '...' : ''}</p>}
                        </div>
                        <div className="ai-source-side">
                          <span className={`ai-status-pill ${meta.className}`}>
                            {meta.icon} {meta.label}
                          </span>
                          <div className="ai-source-actions">
                            <button type="button" onClick={() => setViewingSource(item)} title="Xem nội dung">
                              <FiEye />
                            </button>
                            <button type="button" onClick={() => openEditModal(item)} title="Sửa dữ liệu">
                              <FiEdit2 />
                            </button>
                            <button
                              type="button"
                              className="is-danger"
                              onClick={() => handleDelete(item)}
                              disabled={deletingId === item.id}
                              title="Xóa dữ liệu"
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="ai-panel ai-test-panel">
              <div className="ai-panel-header">
                <div>
                  <h2>Test phản hồi AI</h2>
                  <p>Kiểm tra keyword, bài liên quan và độ đúng trọng tâm.</p>
                </div>
                <span className="ai-test-mode">{mode.label}</span>
              </div>

              <div className="ai-test-samples">
                {mode.samples.map((sample) => (
                  <button key={sample} type="button" onClick={() => setTestQuestion(sample)}>
                    {sample}
                  </button>
                ))}
              </div>

              <div className="ai-test-input">
                <label>{mode.testLabel}</label>
                <textarea
                  className="form-control"
                  rows={4}
                  value={testQuestion}
                  placeholder={mode.testPlaceholder}
                  onChange={(event) => setTestQuestion(event.target.value)}
                />
                <button type="button" className="btn btn-primary" onClick={handleRunTest} disabled={!testQuestion.trim() || testing}>
                  <FiSend /> {testing ? 'Đang test...' : 'Chạy test'}
                </button>
              </div>

              {testError && (
                <div className="ai-test-error">
                  <FiAlertCircle /> {testError}
                </div>
              )}

              {testResult && (
                <div className="ai-test-result">
                  <div className="ai-result-score">
                    <div>
                      <span>Độ bám trọng tâm</span>
                      <strong>{testResult.focus_score}%</strong>
                    </div>
                    <div className="ai-score-bar">
                      <span style={{ width: `${testResult.focus_score || 0}%` }} />
                    </div>
                  </div>

                  <div className="ai-keyword-row">
                    <span>Keyword</span>
                    <div>
                      {(testResult.matched_keywords || []).length > 0
                        ? testResult.matched_keywords.map((keyword) => <strong key={keyword}>{keyword}</strong>)
                        : <em>Chưa bắt được keyword rõ ràng</em>}
                    </div>
                  </div>

                  <div className="ai-answer-box">
                    <span>Phản hồi thử</span>
                    <p>{testResult.answer}</p>
                  </div>

                  <div className="ai-related-grid">
                    <div>
                      <span>Nguồn đang dùng</span>
                      <strong>{testResult.source_stats?.approved_sources || 0}</strong>
                    </div>
                    <div>
                      <span>Nguồn match</span>
                      <strong>{testResult.source_stats?.matched_sources || 0}</strong>
                    </div>
                    <div>
                      <span>Bài liên quan</span>
                      <strong>{testResult.related_lessons?.length || 0}</strong>
                    </div>
                  </div>

                  {testResult.related_lessons?.length > 0 && (
                    <div className="ai-related-lessons">
                      {testResult.related_lessons.slice(0, 4).map((lesson) => (
                        <span key={lesson.lesson_id}>
                          {lesson.section_title ? `${lesson.section_title} / ` : ''}{lesson.title}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>

          {activeMode === 'path' && (
            <section className="ai-path-blueprint">
              <div className="ai-panel-header">
                <div>
                  <h2>Khung dữ liệu lộ trình cá nhân</h2>
                  <p>Phần này giữ ở mức chuẩn bị dữ liệu, chờ chốt tiêu chí cá nhân hóa.</p>
                </div>
              </div>
              <div className="ai-path-lanes">
                <div>
                  <FiTarget />
                  <strong>Mục tiêu khóa học</strong>
                  <span>Chuẩn đầu ra, kỹ năng cần đạt, điều kiện hoàn thành.</span>
                </div>
                <div>
                  <FiLayers />
                  <strong>Cấu trúc năng lực</strong>
                  <span>Mức dễ, trung bình, khó và kiến thức tiên quyết.</span>
                </div>
                <div>
                  <FiActivity />
                  <strong>Tín hiệu học viên</strong>
                  <span>Tiến độ, điểm bài tập, bài chưa nộp, thời lượng học.</span>
                </div>
                <div>
                  <FiCheckCircle />
                  <strong>Luật đề xuất</strong>
                  <span>Ôn lại, học tiếp, luyện bài tập hoặc đổi nhịp học.</span>
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content modal-lg ai-data-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>{editingSource ? 'Sửa dữ liệu AI' : mode.uploadTitle}</h3>
                <p>{selectedCourseInfo?.title}</p>
              </div>
              <button type="button" className="modal-close" onClick={closeModal}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Tên nguồn</label>
                <input
                  className="form-control"
                  value={form.file_name}
                  onChange={(event) => setForm({ ...form, file_name: event.target.value })}
                  placeholder="vd: faq_chuong_1.txt"
                />
              </div>
              <div className="form-group">
                <label>Nội dung dữ liệu</label>
                <textarea
                  className="form-control"
                  rows={10}
                  value={form.content}
                  onChange={(event) => setForm({ ...form, content: event.target.value })}
                  placeholder="Nhập nội dung bài giảng, FAQ, khái niệm trọng tâm, rubric hoặc tiêu chí lộ trình..."
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">
                  <FiUploadCloud /> {editingSource ? 'Cập nhật dữ liệu' : 'Lưu dữ liệu AI'}
                </button>
                <button type="button" className="btn btn-outline" onClick={closeModal}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingSource && (
        <div className="modal-overlay" onClick={() => setViewingSource(null)}>
          <div className="modal-content modal-lg ai-data-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>{viewingSource.file_name}</h3>
                <p>{typeLabel(viewingSource.file_type)} - {statusMeta(viewingSource.status).label}</p>
              </div>
              <button type="button" className="modal-close" onClick={() => setViewingSource(null)}>×</button>
            </div>
            <div className="ai-view-content">
              {viewingSource.content || 'Nguồn dữ liệu này chưa có nội dung text.'}
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-primary" onClick={() => { setViewingSource(null); openEditModal(viewingSource); }}>
                <FiEdit2 /> Sửa dữ liệu
              </button>
              <button type="button" className="btn btn-outline" onClick={() => setViewingSource(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
