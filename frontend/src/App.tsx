import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/ProtectedRoute';
import StudentLayout from './layouts/StudentLayout';
import AuthLayout from './layouts/AuthLayout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Student Pages
import ExamList from './pages/student/ExamList';
import ExamDetail from './pages/student/ExamDetail';
import ExamInterface from './pages/student/ExamInterface';
import MyResults from './pages/student/MyResults';
import ResultDetail from './pages/student/ResultDetail';

// Admin Pages
import AdminLayout from './layouts/AdminLayout';
import UserManagement from './pages/admin/UserManagement';
import SubjectManagement from './pages/admin/SubjectManagement';
import QuestionManagement from './pages/admin/QuestionManagement';
import ExamManagement from './pages/admin/ExamManagement';
import ParticipantManagement from './pages/admin/ParticipantManagement';
import ExamReports from './pages/admin/ExamReports';

const Profile = () => (
  <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
    <h2 className="text-2xl font-bold text-slate-800">Trang Hồ sơ</h2>
    <p className="text-slate-500 mt-2">Tính năng đang được phát triển.</p>
  </div>
);

const RootRedirect = () => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (!token) {
    return <Navigate to="/auth/login" replace />;
  }

  if (role === 'ADMIN') {
    return <Navigate to="/admin/users" replace />;
  }

  return <Navigate to="/student/exams" replace />;
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/auth" element={<AuthLayout />}>
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
        </Route>

        <Route path="/" element={<RootRedirect />} />

        {/* Student Layout Routes */}
        <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
          <Route path="/student" element={<StudentLayout />}>
            <Route path="exams" element={<ExamList />} />
            <Route path="exams/:id" element={<ExamDetail />} />
            <Route path="results" element={<MyResults />} />
            <Route path="results/session/:sessionId" element={<ResultDetail />} />
            <Route path="profile" element={<Profile />} />
          </Route>

          {/* Fullscreen Route for Exam Interface without Sidebar/Header */}
          <Route path="/student/exam-session/:sessionId" element={<ExamInterface />} />
        </Route>

        {/* Admin Layout Routes */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="users" element={<UserManagement />} />
            <Route path="subjects" element={<SubjectManagement />} />
            <Route path="questions" element={<QuestionManagement />} />
            <Route path="exams" element={<ExamManagement />} />
            <Route path="exams/:id/participants" element={<ParticipantManagement />} />
            <Route path="reports" element={<ExamReports />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
