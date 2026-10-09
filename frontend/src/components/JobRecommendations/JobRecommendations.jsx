import { useEffect, useState } from 'react';
import {
  AlertCircle,
  BriefcaseBusiness,
  ExternalLink,
  MapPin,
  RefreshCw,
  Sparkles,
  Target,
} from 'lucide-react';

import { getRecommendedJobs } from '../../services/jobService';

import './JobRecommendations.css';

function JobRecommendations() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadJobs();
  }, []);

  async function loadJobs() {
    try {
      setLoading(true);
      setErrorMessage('');

      const analysisId = localStorage.getItem(
        'careerforge_analysis_id'
      );

      if (!analysisId) {
        setErrorMessage(
          'No resume analysis found. Please upload and analyze your resume first.'
        );
        return;
      }

      console.log(
        'JOB ANALYSIS ID:',
        analysisId
      );

      const data = await getRecommendedJobs(
        analysisId
      );

      console.log(
        'JOB API RESPONSE:',
        JSON.stringify(data, null, 2)
      );

      let jobData = [];

      if (Array.isArray(data)) {
        jobData = data;
      } else if (Array.isArray(data?.jobs)) {
        jobData = data.jobs;
      } else if (Array.isArray(data?.recommendations)) {
        jobData = data.recommendations;
      } else if (
        Array.isArray(data?.recommended_jobs)
      ) {
        jobData = data.recommended_jobs;
      } else if (Array.isArray(data?.results)) {
        jobData = data.results;
      }

      console.log(
        'FINAL JOBS:',
        JSON.stringify(jobData, null, 2)
      );

      setJobs(jobData);

    } catch (error) {
      console.error(
        'Job loading error:',
        error
      );

      console.error(
        'JOB API ERROR:',
        error.response?.data
      );

      const detail =
        error.response?.data?.detail;

      if (typeof detail === 'string') {
        setErrorMessage(detail);
      } else if (Array.isArray(detail)) {
        setErrorMessage(
          detail
            .map(
              item =>
                item?.msg ||
                'Invalid request'
            )
            .join(', ')
        );
      } else {
        setErrorMessage(
          'Unable to load job recommendations. Please try again.'
        );
      }

    } finally {
      setLoading(false);
    }
  }

  function getJobTitle(job) {
    return (
      job?.title ||
      job?.job_title ||
      job?.role ||
      'Job Opportunity'
    );
  }

  function getCompany(job) {
    return (
      job?.company ||
      job?.company_name ||
      'Company'
    );
  }

  function getLocation(job) {
    return (
      job?.location ||
      'Location not specified'
    );
  }

  function getWorkModel(job) {
    return (
      job?.work_model ||
      job?.work_type ||
      job?.type ||
      ''
    );
  }

  function getMatchScore(job) {
    const score =
      job?.match_score ??
      job?.match_percentage ??
      job?.relevance_score ??
      job?.score ??
      0;

    return Math.round(
      Number(score) || 0
    );
  }

  function getJobUrl(job) {
    return (
      job?.url ||
      job?.job_url ||
      job?.application_url ||
      ''
    );
  }

  function getSkills(job) {
    if (Array.isArray(job?.skills)) {
      return job.skills;
    }

    if (typeof job?.skills === 'string') {
      return job.skills
        .split(',')
        .map(skill => skill.trim())
        .filter(Boolean);
    }

    return [];
  }

  function getDescription(job) {
    return (
      job?.description ||
      job?.summary ||
      job?.responsibilities ||
      'Explore this opportunity and review the job requirements before applying.'
    );
  }

  if (loading) {
    return (
      <div className="jobs-page page-container">

        <div className="jobs-loading">
          <RefreshCw
            size={28}
            className="jobs-spinner"
          />

          <p>
            Finding jobs that match your profile...
          </p>
        </div>

      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="jobs-page page-container">

        <div className="jobs-header">

          <div>
            <div className="jobs-eyebrow">
              <Sparkles size={14} />
              AI job matching
            </div>

            <h1>
              Job Recommendations
            </h1>

            <p>
              Discover opportunities matched to
              your skills, experience, and career goals.
            </p>
          </div>

        </div>

        <div className="jobs-error">

          <div className="jobs-error-icon">
            <AlertCircle size={22} />
          </div>

          <div>
            <strong>
              Jobs unavailable
            </strong>

            <p>
              {errorMessage}
            </p>

            <button
              type="button"
              className="primary-button"
              onClick={loadJobs}
            >
              Try Again
            </button>
          </div>

        </div>

      </div>
    );
  }

  return (
    <div className="jobs-page page-container">

      {/* HEADER */}
      <div className="jobs-header">

        <div>
          <div className="jobs-eyebrow">
            <Sparkles size={14} />
            AI job matching
          </div>

          <h1>
            Job Recommendations
          </h1>

          <p>
            Opportunities matched against your
            resume skills, career interests, and
            recommended roles.
          </p>
        </div>

        <div className="jobs-header-badge">
          <BriefcaseBusiness size={17} />
          {jobs.length} opportunities
        </div>

      </div>

      {/* JOB LIST */}
      {jobs.length > 0 ? (

        <div className="jobs-list">

          {jobs.map((job, index) => {

            const title =
              getJobTitle(job);

            const company =
              getCompany(job);

            const location =
              getLocation(job);

            const workModel =
              getWorkModel(job);

            const matchScore =
              getMatchScore(job);

            const url =
              getJobUrl(job);

            const skills =
              getSkills(job);

            const description =
              getDescription(job);

            return (
              <article
                className="job-card"
                key={
                  job?.job_id ||
                  job?.id ||
                  index
                }
              >

                {/* TOP */}
                <div className="job-card-top">

                  <div className="job-company-icon">
                    <BriefcaseBusiness
                      size={21}
                    />
                  </div>

                  <div className="job-title-area">

                    <h2>
                      {title}
                    </h2>

                    <span>
                      {company}
                    </span>

                  </div>

                  <div className="job-match">

                    <Target size={15} />

                    <strong>
                      {matchScore}%
                    </strong>

                    <span>
                      match
                    </span>

                  </div>

                </div>

                {/* META */}
                <div className="job-meta">

                  <span>
                    <MapPin size={14} />
                    {location}
                  </span>

                  {workModel && (
                    <span>
                      {workModel}
                    </span>
                  )}

                  {job?.experience_level && (
                    <span>
                      {job.experience_level}
                    </span>
                  )}

                </div>

                {/* DESCRIPTION */}
                <p className="job-description">
                  {String(description).slice(
                    0,
                    280
                  )}
                  {String(description).length >
                    280
                    ? '...'
                    : ''}
                </p>

                {/* SKILLS */}
                {skills.length > 0 && (
                  <div className="job-skills">

                    {skills
                      .slice(0, 7)
                      .map(
                        (skill, skillIndex) => (
                          <span
                            key={
                              `${skill}-${skillIndex}`
                            }
                          >
                            {skill}
                          </span>
                        )
                      )}

                  </div>
                )}

                {/* FOOTER */}
                <div className="job-card-footer">

                  <div className="job-footer-info">

                    {job?.salary && (
                      <span>
                        {job.salary}
                      </span>
                    )}

                    {job?.stipend && (
                      <span>
                        {job.stipend}
                      </span>
                    )}

                    {job?.ctc && (
                      <span>
                        {job.ctc}
                      </span>
                    )}

                  </div>

                  {url && (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="job-apply-button"
                    >
                      View Opportunity
                      <ExternalLink
                        size={15}
                      />
                    </a>
                  )}

                </div>

              </article>
            );
          })}

        </div>

      ) : (

        <div className="jobs-empty">

          <div className="jobs-empty-icon">
            <BriefcaseBusiness size={30} />
          </div>

          <h2>
            No matching jobs found
          </h2>

          <p>
            We couldn't find matching opportunities
            for your current profile.
          </p>

          <button
            type="button"
            className="primary-button"
            onClick={loadJobs}
          >
            Search Again
          </button>

        </div>

      )}

    </div>
  );
}

export default JobRecommendations;