import { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Loader2,
  Sparkles,
  Target,
} from 'lucide-react';

import './SkillGap.css';

function SkillGap() {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadAnalysis();
  }, []);

  function loadAnalysis() {
    try {
      setLoading(true);
      setErrorMessage('');

      const storedAnalysis = localStorage.getItem(
        'careerforge_analysis'
      );

      if (!storedAnalysis) {
        setErrorMessage(
          'No resume analysis found. Please upload and analyze your resume first.'
        );
        setLoading(false);
        return;
      }

      const parsedAnalysis = JSON.parse(storedAnalysis);

      console.log(
        'SKILL GAP ANALYSIS:',
        JSON.stringify(parsedAnalysis, null, 2)
      );

      setAnalysis(parsedAnalysis);
    } catch (error) {
      console.error('Skill Gap loading error:', error);

      setErrorMessage(
        'Unable to load your resume analysis. Please upload your resume again.'
      );
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="skill-gap-page page-container">
        <div className="skill-gap-loading">
          <Loader2 className="skill-gap-spinner" size={28} />
          <p>Loading your skill analysis...</p>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="skill-gap-page page-container">
        <div className="skill-gap-header">
          <div className="skill-gap-eyebrow">
            <Target size={14} />
            Career intelligence
          </div>

          <h1>Skill Gap Analysis</h1>

          <p>
            Understand your current skills and identify what you
            should learn next.
          </p>
        </div>

        <div className="skill-gap-error">
          <AlertCircle size={20} />
          <div>
            <strong>Analysis unavailable</strong>
            <p>{errorMessage}</p>
          </div>
        </div>
      </div>
    );
  }

  const technicalSkills = analysis?.technical_skills || [];
  const softSkills = analysis?.soft_skills || [];
  const missingSkills = analysis?.missing_skills || [];
  const recommendedRoles = analysis?.recommended_roles || [];
  const strengths = analysis?.strengths || [];
  const weaknesses = analysis?.weaknesses || [];

  const totalSkills = technicalSkills.length + softSkills.length;

  return (
    <div className="skill-gap-page page-container">

      {/* HEADER */}
      <div className="skill-gap-header">
        <div>
          <div className="skill-gap-eyebrow">
            <Sparkles size={14} />
            Career intelligence
          </div>

          <h1>Skill Gap Analysis</h1>

          <p>
            See what you already know, what you're missing, and
            where your profile can improve.
          </p>
        </div>
      </div>

      {/* SUMMARY */}
      <div className="skill-gap-summary">

        <div className="skill-gap-summary-card">
          <div className="skill-gap-summary-icon purple">
            <CheckCircle2 size={21} />
          </div>

          <div>
            <span>Total Skills</span>
            <strong>{totalSkills}</strong>
          </div>
        </div>

        <div className="skill-gap-summary-card">
          <div className="skill-gap-summary-icon yellow">
            <Target size={21} />
          </div>

          <div>
            <span>Skill Gaps</span>
            <strong>{missingSkills.length}</strong>
          </div>
        </div>

        <div className="skill-gap-summary-card">
          <div className="skill-gap-summary-icon purple">
            <BriefcaseBusiness size={21} />
          </div>

          <div>
            <span>Career Paths</span>
            <strong>{recommendedRoles.length}</strong>
          </div>
        </div>

        <div className="skill-gap-summary-card">
          <div className="skill-gap-summary-icon yellow">
            <Sparkles size={21} />
          </div>

          <div>
            <span>Resume Score</span>
            <strong>{analysis?.resume_score ?? 0}%</strong>
          </div>
        </div>

      </div>

      {/* MAIN GRID */}
      <div className="skill-gap-grid">

        {/* SKILLS YOU HAVE */}
        <section className="skill-gap-card">
          <div className="skill-gap-card-header">
            <div>
              <span className="skill-gap-card-label">
                CURRENT PROFILE
              </span>

              <h2>Skills You Have</h2>
            </div>

            <div className="skill-gap-count">
              {totalSkills}
            </div>
          </div>

          <div className="skill-section">
            <h3>Technical Skills</h3>

            {technicalSkills.length > 0 ? (
              <div className="skill-tags">
                {technicalSkills.map((skill, index) => (
                  <span
                    className="skill-tag technical"
                    key={`${skill}-${index}`}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="empty-text">
                No technical skills identified.
              </p>
            )}
          </div>

          <div className="skill-section">
            <h3>Soft Skills</h3>

            {softSkills.length > 0 ? (
              <div className="skill-tags">
                {softSkills.map((skill, index) => (
                  <span
                    className="skill-tag soft"
                    key={`${skill}-${index}`}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="empty-text">
                No soft skills identified.
              </p>
            )}
          </div>
        </section>

        {/* MISSING SKILLS */}
        <section className="skill-gap-card missing-card">
          <div className="skill-gap-card-header">
            <div>
              <span className="skill-gap-card-label">
                DEVELOPMENT AREAS
              </span>

              <h2>Skills You're Missing</h2>
            </div>

            <div className="skill-gap-count yellow-count">
              {missingSkills.length}
            </div>
          </div>

          {missingSkills.length > 0 ? (
            <div className="missing-skill-list">
              {missingSkills.map((skill, index) => (
                <div
                  className="missing-skill-item"
                  key={`${skill}-${index}`}
                >
                  <div className="missing-skill-number">
                    {String(index + 1).padStart(2, '0')}
                  </div>

                  <div className="missing-skill-content">
                    <strong>{skill}</strong>
                    <span>
                      Recommended for improving career readiness.
                    </span>
                  </div>

                  <ArrowRight size={17} />
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <CheckCircle2 size={28} />
              <strong>No major skill gaps identified.</strong>
              <p>
                Your current profile covers the identified
                requirements.
              </p>
            </div>
          )}
        </section>

      </div>

      {/* CAREER PATHS */}
      <section className="skill-gap-card career-path-card">

        <div className="skill-gap-card-header">
          <div>
            <span className="skill-gap-card-label">
              AI RECOMMENDATIONS
            </span>

            <h2>Recommended Career Paths</h2>
          </div>
        </div>

        <div className="career-role-list">
          {recommendedRoles.length > 0 ? (
            recommendedRoles.map((role, index) => (
              <div
                className="career-role-item"
                key={`${role}-${index}`}
              >
                <div className="career-role-icon">
                  <BriefcaseBusiness size={19} />
                </div>

                <div className="career-role-info">
                  <strong>{role}</strong>
                  <span>
                    Based on your resume, skills and career interests.
                  </span>
                </div>

                <ArrowRight size={18} />
              </div>
            ))
          ) : (
            <p className="empty-text">
              No career paths identified yet.
            </p>
          )}
        </div>

      </section>

      {/* STRENGTHS / WEAKNESSES */}
      <div className="skill-gap-grid">

        <section className="skill-gap-card">
          <div className="skill-gap-card-header">
            <div>
              <span className="skill-gap-card-label">
                PROFILE STRENGTHS
              </span>

              <h2>What You're Doing Well</h2>
            </div>
          </div>

          <div className="insight-list">
            {strengths.length > 0 ? (
              strengths.map((item, index) => (
                <div
                  className="insight-item strength"
                  key={index}
                >
                  <CheckCircle2 size={18} />
                  <span>{item}</span>
                </div>
              ))
            ) : (
              <p className="empty-text">
                No strengths available.
              </p>
            )}
          </div>
        </section>

        <section className="skill-gap-card">
          <div className="skill-gap-card-header">
            <div>
              <span className="skill-gap-card-label">
                IMPROVEMENT AREAS
              </span>

              <h2>What You Can Improve</h2>
            </div>
          </div>

          <div className="insight-list">
            {weaknesses.length > 0 ? (
              weaknesses.map((item, index) => (
                <div
                  className="insight-item weakness"
                  key={index}
                >
                  <Target size={18} />
                  <span>{item}</span>
                </div>
              ))
            ) : (
              <p className="empty-text">
                No improvement areas available.
              </p>
            )}
          </div>
        </section>

      </div>

    </div>
  );
}

export default SkillGap;