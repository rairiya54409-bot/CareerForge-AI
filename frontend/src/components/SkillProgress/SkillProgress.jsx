import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Clock3,
  Loader2,
  Plus,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';

import { getSkillProgress } from '../../services/skillProgressService';

import './SkillProgress.css';

function SkillProgress() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadSkillProgress();
  }, []);

  async function loadSkillProgress() {
    try {
      setLoading(true);
      setErrorMessage('');

      const data = await getSkillProgress();

      console.log(
        'SKILL PROGRESS API RESPONSE:',
        JSON.stringify(data, null, 2)
      );

      let skillData = [];

      if (Array.isArray(data)) {
        skillData = data;
      } else if (Array.isArray(data?.skills)) {
        skillData = data.skills;
      } else if (Array.isArray(data?.skill_progress)) {
        skillData = data.skill_progress;
      } else if (Array.isArray(data?.progress)) {
        skillData = data.progress;
      } else if (data?.skill) {
        skillData = [data];
      }

      setSkills(skillData);

    } catch (error) {
      console.error(
        'Skill Progress loading error:',
        error
      );

      console.error(
        'SKILL PROGRESS API ERROR:',
        error.response?.data
      );

      const detail = error.response?.data?.detail;

      if (typeof detail === 'string') {
        setErrorMessage(detail);
      } else if (Array.isArray(detail)) {
        setErrorMessage(
          detail
            .map(item => item?.msg || 'Invalid request')
            .join(', ')
        );
      } else {
        setErrorMessage(
          'Unable to load your skill progress.'
        );
      }
    } finally {
      setLoading(false);
    }
  }

  const normalizedSkills = useMemo(() => {
    return skills.map((item, index) => {
      const progress = Number(
        item?.progress ??
        item?.score ??
        item?.percentage ??
        0
      );

      return {
        id: item?.id || item?._id || index,
        skill:
          item?.skill ||
          item?.name ||
          item?.skill_name ||
          `Skill ${index + 1}`,
        level:
          item?.level ||
          getLevel(progress),
        progress: Math.max(
          0,
          Math.min(100, progress)
        ),
        evidence: Array.isArray(item?.evidence)
          ? item.evidence
          : [],
        lastTestScore:
          item?.last_test_score ??
          item?.test_score ??
          null,
        lastTestType:
          item?.last_test_type ??
          item?.test_type ??
          null,
        lastTestAt:
          item?.last_test_at ??
          item?.last_tested_at ??
          null,
      };
    });
  }, [skills]);

  const overallProgress = useMemo(() => {
    if (normalizedSkills.length === 0) {
      return 0;
    }

    const total = normalizedSkills.reduce(
      (sum, item) => sum + item.progress,
      0
    );

    return Math.round(
      total / normalizedSkills.length
    );
  }, [normalizedSkills]);

  const advancedCount = normalizedSkills.filter(
    item => item.level?.toLowerCase() === 'advanced'
  ).length;

  const intermediateCount = normalizedSkills.filter(
    item => item.level?.toLowerCase() === 'intermediate'
  ).length;

  const beginnerCount = normalizedSkills.filter(
    item => item.level?.toLowerCase() === 'beginner'
  ).length;

  if (loading) {
    return (
      <div className="skill-progress-page page-container">
        <div className="skill-progress-loading">
          <Loader2
            size={30}
            className="skill-progress-spinner"
          />

          <p>
            Loading your skill progress...
          </p>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="skill-progress-page page-container">

        <div className="skill-progress-header">
          <div>
            <div className="skill-progress-eyebrow">
              <Sparkles size={14} />
              Performance tracking
            </div>

            <h1>Skill Progress</h1>

            <p>
              Track your development and see how your
              skills improve over time.
            </p>
          </div>
        </div>

        <div className="skill-progress-error">

          <div className="skill-progress-error-icon">
            <AlertCircle size={22} />
          </div>

          <div>
            <strong>
              Skill progress unavailable
            </strong>

            <p>
              {errorMessage}
            </p>

            <button
              type="button"
              className="primary-button"
              onClick={loadSkillProgress}
            >
              Try Again
            </button>
          </div>

        </div>

      </div>
    );
  }

  return (
    <div className="skill-progress-page page-container">

      {/* HEADER */}
      <div className="skill-progress-header">

        <div>
          <div className="skill-progress-eyebrow">
            <Sparkles size={14} />
            Performance tracking
          </div>

          <h1>
            Skill Progress
          </h1>

          <p>
            Track your technical development, test
            performance, and career readiness over time.
          </p>
        </div>

        <button
          type="button"
          className="skill-progress-add-button"
        >
          <Plus size={17} />
          Add Skill
        </button>

      </div>

      {/* OVERVIEW */}
      <div className="skill-progress-overview">

        <div className="skill-progress-main-card">

          <div className="progress-ring-wrapper">

            <div
              className="progress-ring"
              style={{
                '--progress': `${overallProgress * 3.6}deg`,
              }}
            >
              <div className="progress-ring-inner">
                <strong>
                  {overallProgress}%
                </strong>

                <span>
                  Overall
                </span>
              </div>
            </div>

          </div>

          <div className="skill-progress-main-info">

            <span className="skill-progress-card-label">
              OVERALL SKILL DEVELOPMENT
            </span>

            <h2>
              {overallProgress >= 80
                ? 'Strong progress'
                : overallProgress >= 50
                  ? 'Good progress'
                  : 'Keep building'}
            </h2>

            <p>
              Your overall progress is calculated from
              the skills currently tracked in CareerForge AI.
            </p>

            <div className="progress-bar">
              <div
                className="progress-bar-fill"
                style={{
                  width: `${overallProgress}%`,
                }}
              />
            </div>

          </div>

        </div>

        <div className="skill-progress-stats">

          <div className="skill-stat-card">

            <div className="skill-stat-icon purple">
              <BarChart3 size={20} />
            </div>

            <div>
              <span>Total Skills</span>
              <strong>
                {normalizedSkills.length}
              </strong>
            </div>

          </div>

          <div className="skill-stat-card">

            <div className="skill-stat-icon yellow">
              <TrendingUp size={20} />
            </div>

            <div>
              <span>Advanced</span>
              <strong>
                {advancedCount}
              </strong>
            </div>

          </div>

          <div className="skill-stat-card">

            <div className="skill-stat-icon purple">
              <Target size={20} />
            </div>

            <div>
              <span>Intermediate</span>
              <strong>
                {intermediateCount}
              </strong>
            </div>

          </div>

          <div className="skill-stat-card">

            <div className="skill-stat-icon yellow">
              <Clock3 size={20} />
            </div>

            <div>
              <span>Beginner</span>
              <strong>
                {beginnerCount}
              </strong>
            </div>

          </div>

        </div>

      </div>

      {/* SKILLS */}
      <section className="skill-progress-card">

        <div className="skill-progress-section-header">

          <div>
            <span className="skill-progress-card-label">
              YOUR SKILLS
            </span>

            <h2>
              Development Overview
            </h2>
          </div>

          <span className="skill-count-badge">
            {normalizedSkills.length} skills
          </span>

        </div>

        {normalizedSkills.length > 0 ? (

          <div className="skill-list">

            {normalizedSkills.map(item => (

              <div
                className="skill-progress-item"
                key={item.id}
              >

                <div className="skill-item-top">

                  <div className="skill-item-name">

                    <div className="skill-item-icon">
                      <CheckCircle2 size={17} />
                    </div>

                    <div>
                      <strong>
                        {item.skill}
                      </strong>

                      <span>
                        {item.level}
                      </span>
                    </div>

                  </div>

                  <strong className="skill-percentage">
                    {Math.round(item.progress)}%
                  </strong>

                </div>

                <div className="skill-progress-track">
                  <div
                    className="skill-progress-fill"
                    style={{
                      width: `${item.progress}%`,
                    }}
                  />
                </div>

                {item.lastTestScore !== null && (
                  <div className="skill-test-info">

                    <span>
                      Latest assessment: {
                        item.lastTestScore
                      }%
                    </span>

                    {item.lastTestType && (
                      <span>
                        {formatTestType(
                          item.lastTestType
                        )}
                      </span>
                    )}

                  </div>
                )}

                {item.evidence.length > 0 && (
                  <div className="skill-evidence">

                    {item.evidence.map(
                      (evidence, evidenceIndex) => (
                        <span
                          key={evidenceIndex}
                        >
                          {evidence}
                        </span>
                      )
                    )}

                  </div>
                )}

              </div>

            ))}

          </div>

        ) : (

          <div className="skill-progress-empty">

            <div className="skill-progress-empty-icon">
              <Target size={28} />
            </div>

            <h3>
              No skills tracked yet
            </h3>

            <p>
              Complete tests or add skills to start
              tracking your development.
            </p>

          </div>

        )}

      </section>

      {/* TEST CONNECTION */}
      <section className="skill-progress-info-card">

        <div className="skill-progress-info-icon">
          <Sparkles size={21} />
        </div>

        <div>
          <strong>
            Your test results update this automatically
          </strong>

          <p>
            Complete an Interview, Coding, or Aptitude
            test and CareerForge AI will automatically
            update the relevant skill and its progress.
          </p>
        </div>

      </section>

    </div>
  );
}

function getLevel(progress) {
  if (progress >= 80) {
    return 'Advanced';
  }

  if (progress >= 50) {
    return 'Intermediate';
  }

  return 'Beginner';
}

function formatTestType(type) {
  if (!type) {
    return '';
  }

  return String(type)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase());
}

export default SkillProgress;