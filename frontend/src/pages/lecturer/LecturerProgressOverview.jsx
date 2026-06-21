import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiBarChart2, FiBook, FiCheckCircle, FiUsers } from 'react-icons/fi';
import { courseService } from '../../services/course.service';
import { progressService } from '../../services/progress.service';
import useAuthStore from '../../store/auth.store';

export default function LecturerProgressOverview() {
  const { user } = useAuthStore();
  const [courses, setCourses] = useState([]);
  const [courseProgress, setCourseProgress] = useState({});
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const courseRes = await courseService.getAll({ lecturer_id: user.id, limit: 100 });
        const myCourses = courseRes.data.data || [];
        setCourses(myCourses);
        if (myCourses.length > 0) setSelectedCourseId(String(myCourses[0].id));

        const progressEntries = await Promise.all(
          myCourses.map(async (course) => {
            try {
              const res = await progressService.getCourseProgress(course.id);
              return [course.id, res.data.data || []];
            } catch (e) {
              return [course.id, []];
            }
          })
        );
        setCourseProgress(Object.fromEntries(progressEntries));
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    load();
  }, [user.id]);

  const selectedCourse = courses.find((course) => String(course.id) === selectedCourseId);
  const selectedProgress = courseProgress[selectedCourseId] || [];

  const summary = useMemo(() => {
    const allProgress = Object.values(courseProgress).flat();
    const avgRate = allProgress.length
      ? (allProgress.reduce((sum, item) => sum + Number(item.completion_rate || 0), 0) / allProgress.length).toFixed(1)
      : 0;
    const completed = allProgress.filter((item) => item.status === 'completed').length;
    return {
      totalStudents: allProgress.length,
      completed,
      avgRate,
    };
  }, [courseProgress]);

  const selectedAvgRate = selectedProgress.length
    ? (selectedProgress.reduce((sum, item) => sum + Number(item.completion_rate || 0), 0) / selectedProgress.length).toFixed(1)
    : 0;

  if (loading) return <div className="loading">Đang tải...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Theo dõi tiến độ học viên</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
            Xem tiến độ học tập theo từng khóa học bạn phụ trách.
          </p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#eef2ff', color: '#4f46e5' }}><FiBook /></div>
          <div className="stat-info"><h3>{courses.length}</h3><p>Khóa học phụ trách</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}><FiUsers /></div>
          <div className="stat-info"><h3>{summary.totalStudents}</h3><p>Lượt học viên</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fffbeb', color: '#d97706' }}><FiCheckCircle /></div>
          <div className="stat-info"><h3>{summary.completed}</h3><p>Hoàn thành</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#eff6ff', color: '#2563eb' }}><FiBarChart2 /></div>
          <div className="stat-info"><h3>{summary.avgRate}%</h3><p>Tiến độ trung bình</p></div>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="card">
          <p style={{ color: 'var(--text-secondary)' }}>Bạn chưa có khóa học nào để theo dõi tiến độ.</p>
          <Link to="/lecturer/courses" className="btn btn-primary" style={{ marginTop: 16 }}>Quản lý khóa học</Link>
        </div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 360px) 1fr', gap: 18, alignItems: 'end' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Chọn khóa học</label>
                <select className="form-control" value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)}>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>{course.title}</option>
                  ))}
                </select>
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                <strong style={{ color: 'var(--text-primary)' }}>{selectedCourse?.title}</strong>
                <span> có {selectedProgress.length} học viên, tiến độ trung bình {selectedAvgRate}%.</span>
              </div>
            </div>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Học viên</th>
                  <th>Bài học</th>
                  <th>Bài tập</th>
                  <th>Tiến độ</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {selectedProgress.map((item) => (
                  <tr key={item.id}>
                    <td><strong>{item.student_name}</strong></td>
                    <td>{item.completed_lessons} bài</td>
                    <td>{item.completed_assignments} bài</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, background: 'var(--bg-input)', borderRadius: 10, height: 8, overflow: 'hidden', minWidth: 80 }}>
                          <div
                            style={{
                              width: `${Math.min(item.completion_rate, 100)}%`,
                              height: '100%',
                              background: Number(item.completion_rate) >= 100 ? '#059669' : '#4f46e5',
                              borderRadius: 10,
                              transition: 'width 0.5s ease',
                            }}
                          />
                        </div>
                        <span style={{ fontWeight: 700, fontSize: 13, color: Number(item.completion_rate) >= 100 ? '#059669' : '#4f46e5', minWidth: 42 }}>
                          {item.completion_rate}%
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${item.status === 'completed' ? 'badge-success' : 'badge-info'}`}>
                        {item.status === 'completed' ? 'Hoàn thành' : 'Đang học'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {selectedProgress.length === 0 && (
            <p style={{ color: 'var(--text-secondary)', marginTop: 20 }}>
              Chưa có học viên nào đăng ký khóa học này.
            </p>
          )}
        </>
      )}
    </div>
  );
}
