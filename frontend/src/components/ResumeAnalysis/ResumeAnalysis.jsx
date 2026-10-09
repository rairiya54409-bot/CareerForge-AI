import { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import {
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';

import { getResumeAnalysis } from '../../services/analysisService';

import './ResumeAnalysis.css';

function ScoreCard({
  icon: Icon,
  label,
  value,
  description,
}) {
  return (
    <div className="analysis-score-card">
      <div className="analysis-score-icon">
        <Icon size={20} />
      </div>

      <div>
        <span className="analysis-score-label">
          {label}
        </span>

        <strong className="analysis-score-value">
          {value}
        </strong>

        {description && (
          <span className="analysis-score-description">
            {description}
          </span>
        )}
      </div>
    </div>
  );
}

function SectionCard({ title, children }) {
  return (
    <section className="analysis-section-card">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function AnalysisList({
  items,
  emptyText,
}) {
  if (
    !Array.isArray(items) ||
    items.length === 0
  ) {
    return (
      <p className="analysis-empty">
        {emptyText}
      </p>
    );
  }

  return (
    <ul className="analysis-list">
      {items.map((item, index) => (
        <li key={index}>
          {typeof item === 'string'
            ? item
            : item?.name ||
              item?.title ||
              item?.skill ||
              JSON.stringify(item)}
        </li>
      ))}
    </ul>
  );
}

function ResumeAnalysis() {
  const { analysisId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [analysis, setAnalysis] =
    useState(
      location.state?.analysis || null
    );

  const [loading, setLoading] =
    useState(
      !location.state?.analysis
    );

  const [errorMessage, setErrorMessage] =
    useState('');

  useEffect(() => {
    async function loadAnalysis() {
      /*
       * If upload page already passed the
       * analysis object, use it directly.
       */
      if (location.state?.analysis) {
        console.log(
          'Using analysis passed from upload:',
          location.state.analysis
        );

        setAnalysis(
          location.state.analysis
        );

        setLoading(false);

        return;
      }

      /*
       * Fallback:
       * If user refreshes the page, fetch
       * the analysis from the backend.
       */
      if (!analysisId) {
        setErrorMessage(
          'Resume analysis ID is missing.'
        );

        setLoading(false);

        return;
      }

      try {
        const result =
          await getResumeAnalysis(
            analysisId
          );

        console.log(
          'GET RESUME ANALYSIS:',
          JSON.stringify(
            result,
            null,
            2
          )
        );

        /*
         * Normalize backend response.
         */
        let data = result;

        if (
          data?.data &&
          typeof data.data === 'object'
        ) {
          data = data.data;
        }

        if (
          data?.analysis &&
          typeof data.analysis === 'object'
        ) {
          data = data.analysis;
        }

        if (
          data?.result &&
          typeof data.result === 'object'
        ) {
          data = data.result;
        }

        setAnalysis(data);

      } catch (error) {
        console.error(
          'Failed to load resume analysis:',
          error
        );

        const detail =
          error.response?.data?.detail;

        setErrorMessage(
          typeof detail === 'string'
            ? detail
            : 'Unable to load resume analysis.'
        );

      } finally {
        setLoading(false);
      }
    }

    loadAnalysis();
  }, [analysisId, location.state]);

  if (loading) {
    return (
      <div className="analysis-loading page-container">

        <Loader2
          size={32}
          className="analysis-spinner"
        />

        <h2>
          Analyzing your career profile...
        </h2>

        <p>
          CareerForge AI is preparing your
          resume insights.
        </p>

      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="analysis-error-page page-container">

        <div className="analysis-error-card">

          <AlertCircle size={28} />

          <h2>
            Analysis could not be loaded
          </h2>

          <p>
            {errorMessage}
          </p>

          <button
            className="secondary-button"
            onClick={() =>
              navigate('/resume')
            }
          >
            <ArrowLeft size={16} />
            Back to Resume
          </button>

        </div>

      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  /*
   * The upload endpoint returns the actual
   * analysis object directly:
   *
   * {
   *   candidate: {...},
   *   education: [...],
   *   experience: [...],
   *   technical_skills: [...],
   *   soft_skills: [...],
   *   resume_score: 74,
   *   ats_score: 78,
   *   strengths: [...],
   *   weaknesses: [...],
   *   missing_skills: [...],
   *   recommended_roles: [...]
   * }
   */

  const data = analysis;

  const resumeScore =
    data.resume_score ?? '--';

  const atsScore =
    data.ats_score ?? '--';

  const technicalSkills =
    Array.isArray(
      data.technical_skills
    )
      ? data.technical_skills
      : [];

  const softSkills =
    Array.isArray(
      data.soft_skills
    )
      ? data.soft_skills
      : [];

  const allSkills = [
    ...technicalSkills,
    ...softSkills,
  ];

  const skillGaps =
    Array.isArray(
      data.missing_skills
    )
      ? data.missing_skills
      : [];

  const strengths =
    Array.isArray(
      data.strengths
    )
      ? data.strengths
      : [];

  const weaknesses =
    Array.isArray(
      data.weaknesses
    )
      ? data.weaknesses
      : [];

  const careerRoles =
    Array.isArray(
      data.recommended_roles
    )
      ? data.recommended_roles
      : [];

  const recommendations =
    Array.isArray(
      data.recommendations
    )
      ? data.recommendations
      : [];

  const careerInterests =
    Array.isArray(
      data.career_interests
    )
      ? data.career_interests
      : [];

  const candidate =
    data.candidate || {};

  const education =
    Array.isArray(data.education)
      ? data.education
      : [];

  const experience =
    Array.isArray(data.experience)
      ? data.experience
      : [];

  return (
    <div className="resume-analysis-page page-container">

      {/* HEADER */}

      <div className="analysis-page-header">

        <button
          className="analysis-back-button"
          onClick={() =>
            navigate('/resume')
          }
        >
          <ArrowLeft size={17} />
          Back to Resume
        </button>

        <div className="analysis-eyebrow">
          <Sparkles size={15} />
          AI Resume Intelligence
        </div>

        <h1>
          Your resume analysis.
        </h1>

        <p>
          CareerForge AI has analyzed your
          resume and identified your strengths,
          skills and areas that can improve
          your career readiness.
        </p>

      </div>

      {/* SCORE CARDS */}

      <div className="analysis-score-grid">

        <ScoreCard
          icon={Target}
          label="Resume Score"
          value={`${resumeScore}%`}
          description="Overall resume assessment"
        />

        <ScoreCard
          icon={TrendingUp}
          label="ATS Score"
          value={`${atsScore}%`}
          description="Applicant tracking compatibility"
        />

        <ScoreCard
          icon={CheckCircle2}
          label="Skills Identified"
          value={allSkills.length}
          description="Technical + soft skills"
        />

        <ScoreCard
          icon={Target}
          label="Skill Gaps"
          value={skillGaps.length}
          description="Areas requiring improvement"
        />

      </div>

      {/* CANDIDATE */}

      {candidate.name && (
        <SectionCard title="Candidate Profile">

          <div className="analysis-profile">

            <strong>
              {candidate.name}
            </strong>

            {candidate.email && (
              <span>
                {candidate.email}
              </span>
            )}

            {candidate.phone && (
              <span>
                {candidate.phone}
              </span>
            )}

          </div>

        </SectionCard>
      )}

      {/* CONTENT */}

      <div className="analysis-content-grid">

        {/* STRENGTHS */}

        <SectionCard title="Your Strengths">

          <AnalysisList
            items={strengths}
            emptyText="No specific strengths were returned."
          />

        </SectionCard>

        {/* WEAKNESSES */}

        <SectionCard title="Areas to Improve">

          <AnalysisList
            items={weaknesses}
            emptyText="No specific improvement areas were returned."
          />

        </SectionCard>

        {/* TECHNICAL SKILLS */}

        <SectionCard title="Technical Skills">

          <div className="analysis-skill-list">

            {technicalSkills.length > 0 ? (
              technicalSkills.map(
                (skill, index) => (
                  <span
                    className="analysis-skill-tag"
                    key={index}
                  >
                    {skill}
                  </span>
                )
              )
            ) : (
              <p className="analysis-empty">
                No technical skills were detected.
              </p>
            )}

          </div>

        </SectionCard>

        {/* SOFT SKILLS */}

        <SectionCard title="Soft Skills">

          <div className="analysis-skill-list">

            {softSkills.length > 0 ? (
              softSkills.map(
                (skill, index) => (
                  <span
                    className="analysis-skill-tag"
                    key={index}
                  >
                    {skill}
                  </span>
                )
              )
            ) : (
              <p className="analysis-empty">
                No soft skills were detected.
              </p>
            )}

          </div>

        </SectionCard>

        {/* ALL SKILLS */}

        <SectionCard title="All Skills Identified">

          <div className="analysis-skill-list">

            {allSkills.length > 0 ? (
              allSkills.map(
                (skill, index) => (
                  <span
                    className="analysis-skill-tag"
                    key={index}
                  >
                    {skill}
                  </span>
                )
              )
            ) : (
              <p className="analysis-empty">
                No skills were detected.
              </p>
            )}

          </div>

        </SectionCard>

        {/* SKILL GAPS */}

        <SectionCard title="Skill Gaps">

          <AnalysisList
            items={skillGaps}
            emptyText="No skill gaps were identified."
          />

        </SectionCard>

        {/* CAREER ROLES */}

        <SectionCard title="Career Recommendations">

          <AnalysisList
            items={careerRoles}
            emptyText="No career roles were returned."
          />

        </SectionCard>

        {/* CAREER INTERESTS */}

        <SectionCard title="Career Interests">

          <AnalysisList
            items={careerInterests}
            emptyText="No career interests were returned."
          />

        </SectionCard>

        {/* AI RECOMMENDATIONS */}

        <SectionCard title="AI Recommendations">

          <AnalysisList
            items={recommendations}
            emptyText="No recommendations were returned."
          />

        </SectionCard>

        {/* EDUCATION */}

        {education.length > 0 && (
          <SectionCard title="Education">

            <div className="analysis-detail-list">

              {education.map(
                (item, index) => (
                  <div
                    className="analysis-detail-item"
                    key={index}
                  >

                    <strong>
                      {item.institution ||
                        'Institution'}
                    </strong>

                    {item.degree && (
                      <span>
                        {item.degree}
                      </span>
                    )}

                    {item.duration && (
                      <span>
                        {item.duration}
                      </span>
                    )}

                    {item.grade && (
                      <span>
                        {item.grade}
                      </span>
                    )}

                  </div>
                )
              )}

            </div>

          </SectionCard>
        )}

        {/* EXPERIENCE */}

        {experience.length > 0 && (
          <SectionCard title="Experience">

            <div className="analysis-detail-list">

              {experience.map(
                (item, index) => (
                  <div
                    className="analysis-detail-item"
                    key={index}
                  >

                    <strong>
                      {item.role || 'Role'}
                    </strong>

                    {item.company && (
                      <span>
                        {item.company}
                      </span>
                    )}

                    {item.duration && (
                      <span>
                        {item.duration}
                      </span>
                    )}

                  </div>
                )
              )}

            </div>

          </SectionCard>
        )}

      </div>

    </div>
  );
}

export default ResumeAnalysis;