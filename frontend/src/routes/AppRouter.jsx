import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './PrivateRoute.jsx';
import RoleRoute from './RoleRoute.jsx';
import { useAuth } from '../context/AuthContext.jsx';

import Login from '../pages/auth/Login.jsx';
import Register from '../pages/auth/Register.jsx';
import ForgotPassword from '../pages/auth/ForgotPassword.jsx';

import RoleLayout from '../components/layout/RoleLayout.jsx';

import StudentDashboard from '../pages/student/Dashboard.jsx';
import StudentCourses from '../pages/student/Courses.jsx';
import StudentCourseDetail from '../pages/student/CourseDetail.jsx';
import StudentNews from '../pages/student/News.jsx';
import StudentSettings from '../pages/student/Settings.jsx';

import TeacherDashboard from '../pages/teacher/Dashboard.jsx';
import TeacherStudents from '../pages/teacher/Students.jsx';
import TeacherModuleEditor from '../pages/teacher/ModuleEditor.jsx';
import TeacherNews from '../pages/teacher/News.jsx';
import TeacherSettings from '../pages/teacher/Settings.jsx';

import AdminDashboard from '../pages/admin/Dashboard.jsx';
import AdminUsers from '../pages/admin/Users.jsx';
import AdminModules from '../pages/admin/Modules.jsx';
import AdminStats from '../pages/admin/Stats.jsx';
import AdminSettings from '../pages/admin/Settings.jsx';

export default function AppRouter() {
  const { user } = useAuth();

  const studentMenu = [
    { to: '/student/dashboard', label: 'Inicio' },
    { to: '/student/courses', label: 'Cursos' },
    { to: '/student/news', label: 'Noticias' },
    { to: '/student/settings', label: 'Configuraciones' }
  ];

  const teacherMenu = [
    { to: '/teacher/dashboard', label: 'Inicio' },
    { to: '/teacher/students', label: 'Estudiantes' },
    { to: '/teacher/news', label: 'Noticias' },
    { to: '/teacher/modules', label: 'Edicion de modulos' },
    { to: '/teacher/settings', label: 'Configuraciones' }
  ];

  const adminMenu = [
    { to: '/admin/dashboard', label: 'Inicio' },
    { to: '/admin/users', label: 'Registro de usuarios' },
    { to: '/admin/modules', label: 'Gestion de modulos' },
    { to: '/admin/stats', label: 'Estadisticas' },
    { to: '/admin/settings', label: 'Configuraciones' }
  ];

  const defaultRoute = () => {
    if (!user) return <Navigate to="/login" replace />;
    if (user.role === 'STUDENT') return <Navigate to="/student/dashboard" replace />;
    if (user.role === 'TEACHER') return <Navigate to="/teacher/dashboard" replace />;
    return <Navigate to="/admin/dashboard" replace />;
  };

  return (
    <Routes>
      <Route path="/" element={defaultRoute()} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot" element={<ForgotPassword />} />

      <Route
        path="/student/*"
        element={
          <PrivateRoute>
            <RoleRoute roles={['STUDENT']}>
              <RoleLayout sidebarItems={studentMenu} />
            </RoleRoute>
          </PrivateRoute>
        }
      >
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="courses" element={<StudentCourses />} />
        <Route path="courses/:id" element={<StudentCourseDetail />} />
        <Route path="news" element={<StudentNews />} />
        <Route path="settings" element={<StudentSettings />} />
      </Route>

      <Route
        path="/teacher/*"
        element={
          <PrivateRoute>
            <RoleRoute roles={['TEACHER']}>
              <RoleLayout sidebarItems={teacherMenu} />
            </RoleRoute>
          </PrivateRoute>
        }
      >
        <Route path="dashboard" element={<TeacherDashboard />} />
        <Route path="students" element={<TeacherStudents />} />
        <Route path="news" element={<TeacherNews />} />
        <Route path="modules" element={<TeacherModuleEditor />} />
        <Route path="settings" element={<TeacherSettings />} />
      </Route>

      <Route
        path="/admin/*"
        element={
          <PrivateRoute>
            <RoleRoute roles={['ADMIN']}>
              <RoleLayout sidebarItems={adminMenu} />
            </RoleRoute>
          </PrivateRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="modules" element={<AdminModules />} />
        <Route path="stats" element={<AdminStats />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>
    </Routes>
  );
}
