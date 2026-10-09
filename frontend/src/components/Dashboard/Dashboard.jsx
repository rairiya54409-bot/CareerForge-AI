import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

import {
  ArrowUpRight,
  BriefcaseBusiness,
  CheckCircle2,
  FileText,
  Sparkles,
  Target,
  TrendingUp,
  Upload,
} from 'lucide-react';

import {
  getDashboardData,
  getDashboardSkillProgress,
} from '../../services/dashboardService';

import './Dashboard.css';

function StatCard({
  icon,
  label,
  value,
  subtitle,
  onClick,
}) {
  return (
    <button
      type="button"
      className="stat-card"
      onClick={onClick}
    >
      <div className="stat-icon">
        {icon}
      </div>

      <div className="stat-content">
        <p className="stat-label">
          {label}
        </p>

        <h3>{value}</h3>

        <span>{subtitle}</span>
      </div>

      <ArrowUpRight
        className="stat-arrow"
        size={18}
      />
    </button>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState(null);
  const [skillProgress, setSkillProgress] = useState([]);
  const [resumeAnalysis, setResumeAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [
          analyticsData,
          skillData,
        ] = await Promise.all([
          getDashboardData(),
          getDashboardSkillProgress(),
        ]);

        setAnalytics(analyticsData);

        const skills = Array.isArray(skillData)
          ? skillData
          : skillData?.skills || [];

        setSkillProgress(skills);

        /* Load the latest resume analysis
           saved after resume upload */
        const savedAnalysis =
          localStorage.getItem(
            'careerforge_analysis'
          );

        if (savedAnalysis) {
          try {
            const parsedAnalysis =
              JSON.parse(savedAnalysis);

            setResumeAnalysis(
              parsedAnalysis
            );
          } catch (error) {
            console.error(
              'Resume analysis parsing error:',
              error
            );
          }
        }

      } catch (error) {
        console.error(
          'Dashboard data error:',
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  /* =========================
     ANALYTICS
  ========================= */

  const overview =
    analytics?.overview || {};

  const matchScore =
    analytics?.match_score || {};

  const conversionRates =
    analytics?.conversion_rates || {};

  const totalApplications =
    overview.total_applications || 0;

  const interviews =
    overview.interviews || 0;

  const offers =
    overview.offers || 0;

  const averageMatch =
    matchScore.average || 0;

  const interviewConversion =
    conversionRates.interview_conversion || 0;

  /* =========================
     RESUME SCORE
  ========================= */

  const resumeScore =
    Number(
      resumeAnalysis?.resume_score ?? 0
    );

  const atsScore =
    Number(
      resumeAnalysis?.ats_score ?? 0
    );

  /* =========================
     SKILL PROGRESS
  ========================= */

  const skillScores = skillProgress
    .map((skill) =>
      Number(
        skill.score ??
        skill.progress ??
        skill.proficiency ??
        0
      )
    )
    .filter(
      (score) =>
        !Number.isNaN(score)
    );

  const averageSkillProgress =
    skillScores.length > 0
      ? Math.round(
          skillScores.reduce(
            (sum, score) =>
              sum + score,
            0
          ) /
            skillScores.length
        )
      : 0;

  /* =========================
     CAREER READINESS
  ========================= */

  const careerReadiness =
    Math.min(
      100,
      Math.round(
        resumeScore * 0.25 +
        averageSkillProgress * 0.25 +
        averageMatch * 0.3 +
        interviewConversion * 0.2
      )
    );

  return (
    <div className="dashboard-page">

      {/* HEADER */}

      <div className="dashboard-header">

        <div>

          <p className="eyebrow">
            Career overview
          </p>

          <h1>
            Welcome back,{' '}
            {user?.name || 'there'}
          </h1>

          <p className="dashboard-subtitle">
            Track your progress, discover
            opportunities, and move closer
            to your career goals.
          </p>

        </div>

        <button
          type="button"
          className="primary-button"
          onClick={() =>
            navigate('/resume')
          }
        >
          <Upload size={18} />
          Upload Resume
        </button>

      </div>

      {/* STATS */}

      <div className="stats-grid">

        <StatCard
          icon={
            <FileText size={20} />
          }
          label="Resume Score"
          value={
            loading
              ? '—'
              : resumeScore > 0
                ? `${resumeScore}%`
                : '—'
          }
          subtitle={
            resumeScore > 0
              ? `ATS Score ${atsScore}%`
              : 'Upload a resume'
          }
          onClick={() =>
            navigate('/resume')
          }
        />

        <StatCard
          icon={
            <BriefcaseBusiness
              size={20}
            />
          }
          label="Applications"
          value={
            loading
              ? '—'
              : totalApplications
          }
          subtitle="Total applications"
          onClick={() =>
            navigate('/applications')
          }
        />

        <StatCard
          icon={
            <Target size={20} />
          }
          label="Average Match"
          value={
            loading
              ? '—'
              : `${averageMatch}%`
          }
          subtitle="Job compatibility"
          onClick={() =>
            navigate('/jobs')
          }
        />

        <StatCard
          icon={
            <TrendingUp size={20}
            />
          }
          label="Skill Progress"
          value={
            loading
              ? '—'
              : `${averageSkillProgress}%`
          }
          subtitle={
            skillProgress.length > 0
              ? `${skillProgress.length} skills tracked`
              : 'No skills tracked yet'
          }
          onClick={() =>
            navigate('/skill-progress')
          }
        />

        <StatCard
          icon={
            <CheckCircle2
              size={20}
            />
          }
          label="Career Readiness"
          value={
            loading
              ? '—'
              : `${careerReadiness}%`
          }
          subtitle="Overall profile strength"
          onClick={() =>
            navigate('/analytics')
          }
        />

      </div>

      {/* CAREER PROGRESS + QUICK ACTIONS */}

      <div className="dashboard-grid">

        <section className="dashboard-card progress-card">

          <div className="card-header">

            <div>

              <p className="card-kicker">
                Your journey
              </p>

              <h2>
                Career Progress
              </h2>

            </div>

            <button
              type="button"
              className="text-button"
              onClick={() =>
                navigate('/analytics')
              }
            >
              View details
              <ArrowUpRight
                size={16}
              />
            </button>

          </div>

          <div className="progress-list">

            {/* RESUME */}

            <div className="progress-item">

              <div className="progress-label">

                <span>
                  Resume Strength
                </span>

                <strong>
                  {resumeScore > 0
                    ? `${resumeScore}%`
                    : '—'}
                </strong>

              </div>

              <div className="progress-track">

                <div
                  className="progress-fill"
                  style={{
                    width:
                      `${Math.min(
                        resumeScore,
                        100
                      )}%`,
                  }}
                />

              </div>

            </div>

            {/* JOB MATCH */}

            <div className="progress-item">

              <div className="progress-label">

                <span>
                  Job Match
                </span>

                <strong>
                  {loading
                    ? '—'
                    : `${averageMatch}%`}
                </strong>

              </div>

              <div className="progress-track">

                <div
                  className="progress-fill"
                  style={{
                    width:
                      `${Math.min(
                        averageMatch,
                        100
                      )}%`,
                  }}
                />

              </div>

            </div>

            {/* SKILL PROGRESS */}

            <div className="progress-item">

              <div className="progress-label">

                <span>
                  Skill Progress
                </span>

                <strong>
                  {loading
                    ? '—'
                    : `${averageSkillProgress}%`}
                </strong>

              </div>

              <div className="progress-track">

                <div
                  className="progress-fill"
                  style={{
                    width:
                      `${Math.min(
                        averageSkillProgress,
                        100
                      )}%`,
                  }}
                />

              </div>

            </div>

            {/* CAREER READINESS */}

            <div className="progress-item">

              <div className="progress-label">

                <span>
                  Career Readiness
                </span>

                <strong>
                  {loading
                    ? '—'
                    : `${careerReadiness}%`}
                </strong>

              </div>

              <div className="progress-track">

                <div
                  className="progress-fill"
                  style={{
                    width:
                      `${careerReadiness}%`,
                  }}
                />

              </div>

            </div>

          </div>

        </section>

        {/* QUICK ACTIONS */}

        <section className="dashboard-card">

          <div className="card-header">

            <div>

              <p className="card-kicker">
                Get started
              </p>

              <h2>
                Quick Actions
              </h2>

            </div>

          </div>

          <div className="quick-actions">

            <button
              type="button"
              className="quick-action"
              onClick={() =>
                navigate('/resume')
              }
            >

              <FileText size={20} />

              <div>

                <strong>
                  Analyze Resume
                </strong>

                <span>
                  Check your resume and
                  ATS score
                </span>

              </div>

              <ArrowUpRight
                size={16}
              />

            </button>

            <button
              type="button"
              className="quick-action"
              onClick={() =>
                navigate('/jobs')
              }
            >

              <BriefcaseBusiness
                size={20}
              />

              <div>

                <strong>
                  Find Jobs
                </strong>

                <span>
                  Discover jobs matched
                  to your profile
                </span>

              </div>

              <ArrowUpRight
                size={16}
              />

            </button>

            <button
              type="button"
              className="quick-action"
              onClick={() =>
                navigate('/tests')
              }
            >

              <Target size={20} />

              <div>

                <strong>
                  Take a Test
                </strong>

                <span>
                  Improve and validate
                  your skills
                </span>

              </div>

              <ArrowUpRight
                size={16}
              />

            </button>

            <button
              type="button"
              className="quick-action"
              onClick={() =>
                navigate('/courses')
              }
            >

              <TrendingUp
                size={20}
              />

              <div>

                <strong>
                  Learn New Skills
                </strong>

                <span>
                  Follow recommended
                  courses
                </span>

              </div>

              <ArrowUpRight
                size={16}
              />

            </button>

          </div>

        </section>

      </div>

      {/* NEXT STEPS + AI INSIGHT */}

      <div className="dashboard-grid">

        <section className="dashboard-card">

          <div className="card-header">

            <div>

              <p className="card-kicker">
                Recommended
              </p>

              <h2>
                Next Steps
              </h2>

            </div>

          </div>

          <div className="recommendation-list">

            <button
              type="button"
              className="recommendation-item"
              onClick={() =>
                navigate('/skill-gap')
              }
            >

              <div className="recommendation-icon">

                <Target size={18} />

              </div>

              <div>

                <strong>
                  Review your skill gaps
                </strong>

                <span>
                  Identify skills that can
                  improve your job matches.
                </span>

              </div>

              <ArrowUpRight
                size={16}
              />

            </button>

            <button
              type="button"
              className="recommendation-item"
              onClick={() =>
                navigate('/courses')
              }
            >

              <div className="recommendation-icon">

                <TrendingUp
                  size={18}
                />

              </div>

              <div>

                <strong>
                  Continue learning
                </strong>

                <span>
                  Explore courses
                  recommended for your
                  career path.
                </span>

              </div>

              <ArrowUpRight
                size={16}
              />

            </button>

            <button
              type="button"
              className="recommendation-item"
              onClick={() =>
                navigate('/tests/interview')
              }
            >

              <div className="recommendation-icon">

                <CheckCircle2
                  size={18}
                />

              </div>

              <div>

                <strong>
                  Practice interview skills
                </strong>

                <span>
                  Take an AI-powered
                  mock interview.
                </span>

              </div>

              <ArrowUpRight
                size={16}
              />

            </button>

          </div>

        </section>

        {/* AI INSIGHT */}

        <section className="dashboard-card insight-card">

          <div className="insight-icon">

            <Sparkles size={22} />

          </div>

          <p className="card-kicker">
            AI Career Insight
          </p>

          <h2>
            Your profile is getting
            stronger.
          </h2>

          <p>

            {resumeScore > 0
              ? `Your current resume score is ${resumeScore}% with an ATS score of ${atsScore}%. Keep improving your skills and job compatibility to strengthen your profile.`

              : interviews > 0
                ? `You have already reached ${interviews} interview${interviews > 1 ? 's' : ''}. Keep improving your profile and applying to roles with strong compatibility.`

                : totalApplications > 0
                  ? `You've submitted ${totalApplications} application${totalApplications > 1 ? 's' : ''}. Focus on improving your skill gaps and interview readiness.`

                  : 'Start by uploading your resume. CareerForge AI will analyze your profile and build your personalized career roadmap.'
            }

          </p>

          <button
            type="button"
            className="primary-button"
            onClick={() =>
              navigate('/copilot')
            }
          >

            <Sparkles size={17} />

            Ask Career Copilot

          </button>

        </section>

      </div>

    </div>
  );
}