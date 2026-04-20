import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/auth.store';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';

// Auth
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Home
import HomePage from './pages/home/HomePage';

// Student
import StudentDashboard from './pages/student/StudentDashboard';
import MyCoursesPage from './pages/student/MyCoursesPage';
import CourseDetailPage from './pages/student/CourseDetailPage';
import LessonLearningPage from './pages/student/LessonLearningPage';
import SubmitAssignmentPage from './pages/student/SubmitAssignmentPage';
import MySubmissionsPage from './pages/student/MySubmissionsPage';
import MyProgressPage from './pages/student/MyProgressPage';
import AIChatPage from './pages/student/AIChatPage';

// Lecturer
import LecturerDashboard from './pages/lecturer/LecturerDashboard';
import ManageCoursesPage from './pages/lecturer/ManageCoursesPage';
import CourseFormPage from './pages/lecturer/CourseFormPage';
import ManageLessonsPage from './pages/lecturer/ManageLessonsPage';
import ManageAssignmentsPage from './pages/lecturer/ManageAssignmentsPage';
import GradeSubmissionsPage from './pages/lecturer/GradeSubmissionsPage';
import ManageAIDataPage from './pages/lecturer/ManageAIDataPage';

// Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageUsersPage from './pages/admin/ManageUsersPage';
import ManageAIApprovePage from './pages/admin/ManageAIApprovePage';

function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (allowedRoles && !allowedRoles.includes(user?.role)) return <Navigate to="/" replace />;
  return children;
}

function AuthRedirect({ children }) {
  const { isAuthenticated, user } = useAuthStore();
  if (isAuthenticated && user) return <Navigate to={`/${user.role}`} replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<AuthRedirect><LoginPage /></AuthRedirect>} />
        <Route path="/register" element={<AuthRedirect><RegisterPage /></AuthRedirect>} />

        {/* Student routes */}
        <Route path="/student" element={
          <ProtectedRoute allowedRoles={['student']}>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<StudentDashboard />} />
          <Route path="courses" element={<MyCoursesPage />} />
          <Route path="course/:courseId" element={<CourseDetailPage />} />
          <Route path="lesson/:lessonId" element={<LessonLearningPage />} />
          <Route path="assignment/:assignmentId" element={<SubmitAssignmentPage />} />
          <Route path="submissions" element={<MySubmissionsPage />} />
          <Route path="progress" element={<MyProgressPage />} />
          <Route path="ai-chat" element={<AIChatPage />} />
        </Route>

        {/* Lecturer routes */}
        <Route path="/lecturer" element={
          <ProtectedRoute allowedRoles={['lecturer']}>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<LecturerDashboard />} />
          <Route path="courses" element={<ManageCoursesPage />} />
          <Route path="courses/new" element={<CourseFormPage />} />
          <Route path="courses/:courseId/edit" element={<CourseFormPage />} />
          <Route path="courses/:courseId/lessons" element={<ManageLessonsPage />} />
          <Route path="courses/:courseId/assignments" element={<ManageAssignmentsPage />} />
          <Route path="assignments/:assignmentId/grade" element={<GradeSubmissionsPage />} />
          <Route path="ai-data" element={<ManageAIDataPage />} />
        </Route>

        {/* Admin routes */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<ManageUsersPage />} />
          <Route path="ai-approve" element={<ManageAIApprovePage />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column' }}>
            <h1 style={{ fontSize: 64, marginBottom: 16 }}>404</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Trang không tồn tại</p>
            <a href="/" className="btn btn-primary" style={{ marginTop: 16 }}>Về trang chủ</a>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}
