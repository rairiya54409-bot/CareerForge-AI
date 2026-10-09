import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import AuthPage from './pages/AuthPage';
import Dashboard from './components/Dashboard/Dashboard';
import Layout from './components/Layout/Layout';
import ResumeUpload from './components/ResumeUpload/ResumeUpload';
import ResumeAnalysis from './components/ResumeAnalysis/ResumeAnalysis';
import SkillGap from './components/SkillGap/SkillGap';
import Courses from './components/Courses/Courses';
import Roadmap from './components/LearningRoadmap/Roadmap';
import SkillProgress from './components/SkillProgress/SkillProgress';
import JobRecommendations from './components/JobRecommendations/JobRecommendations';
import ApplicationTracker from './components/ApplicationTracker/ApplicationTracker';
import CareerAnalytics from './components/CareerAnalytics/CareerAnalytics';
import Chatbot from './components/Chatbot/Chatbot';
import LanguageSettings from './components/Language/LanguageSettings';
import VoiceRecorder from './components/Voice/VoiceRecorder';
import CodingTest from './components/Tests/Coding/CodingTest';
import AptitudeTest from './components/Tests/Aptitude/AptitudeTest';
import TestDashboard from './components/Tests/TestDashboard/TestDashboard';
import InterviewTest from './components/Tests/Interview/InterviewTest';


function ProtectedRoute({ children }) {
  const token = localStorage.getItem('careerforge_token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}


function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* =========================
            PUBLIC ROUTES
        ========================== */}

        <Route
          path="/login"
          element={<AuthPage />}
        />


        {/* =========================
            PROTECTED APPLICATION
        ========================== */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
  path="/voice"
  element={
    <ProtectedRoute>
      <Layout>
        <VoiceRecorder />
      </Layout>
    </ProtectedRoute>
  }
/>

<Route
  path="/tests/interview"
  element={
    <ProtectedRoute>
      <Layout>
        <InterviewTest />
      </Layout>
    </ProtectedRoute>
  }
/>

<Route
  path="/tests/aptitude"
  element={
    <ProtectedRoute>
      <Layout>
        <AptitudeTest />
      </Layout>
    </ProtectedRoute>
  }
/>

<Route
  path="/tests"
  element={
    <ProtectedRoute>
      <Layout>
        <TestDashboard />
      </Layout>
    </ProtectedRoute>
  }
/>

<Route
  path="/tests/coding"
  element={
    <ProtectedRoute>
      <Layout>
        <CodingTest />
      </Layout>
    </ProtectedRoute>
  }
/>

        <Route
  path="/analytics"
  element={
    <ProtectedRoute>
      <Layout>
        <CareerAnalytics />
      </Layout>
    </ProtectedRoute>
  }
/>

<Route
  path="/settings"
  element={
    <ProtectedRoute>
      <Layout>
        <LanguageSettings />
      </Layout>
    </ProtectedRoute>
  }
/>

<Route
  path="/copilot"
  element={
    <ProtectedRoute>
      <Layout>
        <Chatbot />
      </Layout>
    </ProtectedRoute>
  }
/>

        <Route
  path="/jobs"
  element={
    <ProtectedRoute>
      <Layout>
        <JobRecommendations />
      </Layout>
    </ProtectedRoute>
  }
/>

        <Route
  path="/skill-progress"
  element={
    <ProtectedRoute>
      <Layout>
        <SkillProgress />
      </Layout>
    </ProtectedRoute>
  }
/>

<Route
  path="/applications"
  element={
    <ProtectedRoute>
      <Layout>
        <ApplicationTracker />
      </Layout>
    </ProtectedRoute>
  }
/>

        <Route
  path="/courses"
  element={
    <ProtectedRoute>
      <Layout>
        <Courses />
      </Layout>
    </ProtectedRoute>
  }
/>

<Route
  path="/roadmap"
  element={
    <ProtectedRoute>
      <Layout>
        <Roadmap />
      </Layout>
    </ProtectedRoute>
  }
/>

        <Route
  path="/skill-gap"
  element={
    <ProtectedRoute>
      <Layout>
        <SkillGap />
      </Layout>
    </ProtectedRoute>
  }
/>

        <Route
  path="/resume"
  element={
    <ProtectedRoute>
      <Layout>
        <ResumeUpload />
      </Layout>
    </ProtectedRoute>
  }
/>

<Route
  path="/resume-analysis/:analysisId"
  element={
    <ProtectedRoute>
      <Layout>
        <ResumeAnalysis />
      </Layout>
    </ProtectedRoute>
  }
/>

        {/* =========================
            DEFAULT ROUTE
        ========================== */}

        <Route
          path="/"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />


        {/* =========================
            UNKNOWN ROUTES
        ========================== */}

        <Route
          path="*"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

      </Routes>

    </BrowserRouter>
  );
}


export default App;