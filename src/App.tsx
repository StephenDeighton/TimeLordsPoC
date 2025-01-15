import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AuthForm } from './components/AuthForm';
import { Dashboard } from './components/Dashboard';
import { Profile } from './components/Profile';
import { Webinars } from './components/Webinars';
import { Articles } from './components/Articles';
import { CreateArticle } from './components/CreateArticle';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/webinars" element={<Webinars />} />
          <Route path="/articles" element={<Articles />} />
          <Route path="/articles/create" element={<CreateArticle />} />
          <Route path="/signin" element={<AuthForm mode="signin" />} />
          <Route path="/signup" element={<AuthForm mode="signup" />} />
          <Route path="/" element={<Navigate to="/signin" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;