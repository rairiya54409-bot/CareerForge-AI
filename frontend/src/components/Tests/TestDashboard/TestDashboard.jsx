import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Brain,
  Code2,
  MessageSquare,
  Sparkles,
  Trophy,
  Target,
  BarChart3,
} from 'lucide-react';

import './TestDashboard.css';

const TESTS = [
  {
    id: 'interview',
    title: 'Interview Test',
    description:
      'Practice HR, behavioral, and technical interview questions with AI-powered evaluation.',
    icon: MessageSquare,
    route: '/tests/interview',
    label: 'Interview',
  },
  {
    id: 'coding',
    title: 'Coding Test',
    description:
      'Solve AI-generated programming challenges based on your target role and difficulty.',
    icon: Code2,
    route: '/tests/coding',
    label: 'Programming',
  },
  {
    id: 'aptitude',
    title: 'Aptitude Test',
    description:
      'Test quantitative, logical, verbal, and data interpretation skills with 10 questions.',
    icon: Brain,
    route: '/tests/aptitude',
    label: 'Aptitude',
  },
];

function TestDashboard() {
  const navigate = useNavigate();

  return (
    <div className="tests-dashboard page-container">

      {/* HEADER */}

      <div className="tests-dashboard-header">

        <div>

          <div className="tests-eyebrow">
            <Sparkles size={14} />
            Career Assessments
          </div>

          <h1>
            Test your career readiness.
          </h1>

          <p>
            Practice interviews, coding, and aptitude
            assessments designed around your career goals.
          </p>

        </div>

      </div>

      {/* QUICK STATS */}

      <div className="tests-stats">

        <div className="tests-stat-card">

          <div className="tests-stat-icon">
            <Trophy size={17} />
          </div>

          <div>
            <span>
              Assessments
            </span>

            <strong>
              3
            </strong>
          </div>

        </div>

        <div className="tests-stat-card">

          <div className="tests-stat-icon yellow">
            <Target size={17} />
          </div>

          <div>
            <span>
              Practice Areas
            </span>

            <strong>
              3
            </strong>
          </div>

        </div>

        <div className="tests-stat-card">

          <div className="tests-stat-icon">
            <BarChart3 size={17} />
          </div>

          <div>
            <span>
              Skill Tracking
            </span>

            <strong>
              Active
            </strong>
          </div>

        </div>

      </div>

      {/* TEST CARDS */}

      <div className="tests-section-heading">

        <div>
          <h2>
            Choose an assessment
          </h2>

          <p>
            Select a test to begin practicing.
          </p>
        </div>

      </div>

      <div className="tests-grid">

        {TESTS.map(test => {

          const Icon = test.icon;

          return (
            <article
              key={test.id}
              className="test-dashboard-card"
            >

              <div className="test-card-top">

                <div className="test-card-icon">
                  <Icon size={22} />
                </div>

                <span className="test-card-label">
                  {test.label}
                </span>

              </div>

              <h3>
                {test.title}
              </h3>

              <p>
                {test.description}
              </p>

              <button
                type="button"
                className="test-card-button"
                onClick={() =>
                  navigate(test.route)
                }
              >
                Start Assessment
                <ArrowRight size={16} />
              </button>

            </article>
          );

        })}

      </div>

      {/* INFORMATION PANEL */}

      <section className="tests-info-panel">

        <div className="tests-info-icon">
          <Sparkles size={20} />
        </div>

        <div>

          <strong>
            Your assessment results improve your profile
          </strong>

          <p>
            Completed tests can contribute to your
            Skill Progress profile, helping CareerForge AI
            understand your strengths and identify areas
            where additional practice may help.
          </p>

        </div>

      </section>

    </div>
  );
}

export default TestDashboard;