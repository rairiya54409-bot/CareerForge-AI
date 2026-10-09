import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BriefcaseBusiness,
  CheckCircle2,
  ExternalLink,
  Loader2,
  MapPin,
  Plus,
  Send,
  Trash2,
} from 'lucide-react';

import {
  createApplication,
  deleteApplication,
  getApplications,
  updateApplicationStatus,
} from '../../services/applicationService';

import './ApplicationTracker.css';

const STATUS_OPTIONS = [
  'Applied',
  'Interview',
  'Offer',
  'Rejected',
  'Withdrawn',
];

function ApplicationTracker() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    job_id: '',
    title: '',
    company: '',
    location: '',
    job_type: '',
    work_model: '',
    match_score: '',
    job_url: '',
    notes: '',
  });

  useEffect(() => {
    loadApplications();
  }, []);

  async function loadApplications() {
    try {
      setLoading(true);
      setErrorMessage('');

      const data = await getApplications();

      console.log(
        'APPLICATION API RESPONSE:',
        JSON.stringify(data, null, 2)
      );

      let applicationData = [];

      if (Array.isArray(data)) {
        applicationData = data;
      } else if (Array.isArray(data?.applications)) {
        applicationData = data.applications;
      } else if (Array.isArray(data?.results)) {
        applicationData = data.results;
      }

      setApplications(applicationData);
    } catch (error) {
      console.error(
        'Application loading error:',
        error
      );

      console.error(
        'APPLICATION API ERROR:',
        error.response?.data
      );

      const detail = error.response?.data?.detail;

      setErrorMessage(
        typeof detail === 'string'
          ? detail
          : 'Unable to load your applications.'
      );
    } finally {
      setLoading(false);
    }
  }

  function handleInputChange(event) {
    const { name, value } = event.target;

    setForm(previous => ({
      ...previous,
      [name]: value,
    }));
  }

  function resetForm() {
    setForm({
      job_id: '',
      title: '',
      company: '',
      location: '',
      job_type: '',
      work_model: '',
      match_score: '',
      job_url: '',
      notes: '',
    });
  }

  async function handleCreateApplication(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setErrorMessage('');

      const analysisId =
        localStorage.getItem(
          'careerforge_analysis_id'
        );

      if (!analysisId) {
        setErrorMessage(
          'No resume analysis found. Please analyze your resume first.'
        );
        return;
      }

      const applicationData = {
        analysis_id: analysisId,
        job_id: form.job_id,
        title: form.title,
        company: form.company,
        location: form.location,
        job_type: form.job_type,
        work_model: form.work_model,
        match_score:
          Number(form.match_score) || 0,
        job_url: form.job_url,
        notes: form.notes,
      };

      const created =
        await createApplication(
          applicationData
        );

      console.log(
        'APPLICATION CREATED:',
        created
      );

      setShowForm(false);
      resetForm();

      await loadApplications();

    } catch (error) {
      console.error(
        'Create application error:',
        error
      );

      const detail =
        error.response?.data?.detail;

      setErrorMessage(
        typeof detail === 'string'
          ? detail
          : 'Unable to create the application.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(
    applicationId,
    status
  ) {
    try {
      await updateApplicationStatus(
        applicationId,
        status
      );

      setApplications(previous =>
        previous.map(application =>
          getApplicationId(application) ===
          applicationId
            ? {
                ...application,
                status,
              }
            : application
        )
      );

    } catch (error) {
      console.error(
        'Status update error:',
        error
      );

      const detail =
        error.response?.data?.detail;

      setErrorMessage(
        typeof detail === 'string'
          ? detail
          : 'Unable to update application status.'
      );
    }
  }

  async function handleDelete(applicationId) {
    const confirmed = window.confirm(
      'Are you sure you want to delete this application?'
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteApplication(
        applicationId
      );

      setApplications(previous =>
        previous.filter(
          application =>
            getApplicationId(application) !==
            applicationId
        )
      );

    } catch (error) {
      console.error(
        'Delete application error:',
        error
      );

      const detail =
        error.response?.data?.detail;

      setErrorMessage(
        typeof detail === 'string'
          ? detail
          : 'Unable to delete the application.'
      );
    }
  }

  const statistics = useMemo(() => {
    return {
      total: applications.length,

      applied: applications.filter(
        item =>
          getStatus(item) === 'Applied'
      ).length,

      interviews: applications.filter(
        item =>
          getStatus(item) === 'Interview'
      ).length,

      offers: applications.filter(
        item =>
          getStatus(item) === 'Offer'
      ).length,
    };
  }, [applications]);

  if (loading) {
    return (
      <div className="applications-page page-container">
        <div className="applications-loading">
          <Loader2
            size={30}
            className="applications-spinner"
          />

          <p>
            Loading your applications...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="applications-page page-container">

      {/* HEADER */}
      <div className="applications-header">

        <div>
          <div className="applications-eyebrow">
            <BriefcaseBusiness size={14} />
            Application management
          </div>

          <h1>
            Application Tracker
          </h1>

          <p>
            Keep track of every opportunity from
            application through offer.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={() =>
            setShowForm(previous => !previous)
          }
        >
          <Plus size={17} />
          Add Application
        </button>

      </div>

      {/* ERROR */}
      {errorMessage && (
        <div className="applications-error">

          <AlertCircle size={19} />

          <span>
            {errorMessage}
          </span>

        </div>
      )}

      {/* STATISTICS */}
      <div className="application-stats">

        <div className="application-stat-card">
          <span>Total Applications</span>
          <strong>{statistics.total}</strong>
        </div>

        <div className="application-stat-card">
          <span>Applied</span>
          <strong>{statistics.applied}</strong>
        </div>

        <div className="application-stat-card">
          <span>Interviews</span>
          <strong>{statistics.interviews}</strong>
        </div>

        <div className="application-stat-card highlight">
          <span>Offers</span>
          <strong>{statistics.offers}</strong>
        </div>

      </div>

      {/* ADD FORM */}
      {showForm && (
        <form
          className="application-form"
          onSubmit={handleCreateApplication}
        >

          <div className="application-form-header">
            <div>
              <span>
                NEW APPLICATION
              </span>

              <h2>
                Add Job Application
              </h2>
            </div>
          </div>

          <div className="application-form-grid">

            <div className="application-field">
              <label>Job Title</label>
              <input
                name="title"
                value={form.title}
                onChange={handleInputChange}
                placeholder="e.g. Data Analyst Intern"
                required
              />
            </div>

            <div className="application-field">
              <label>Company</label>
              <input
                name="company"
                value={form.company}
                onChange={handleInputChange}
                placeholder="e.g. Microsoft"
                required
              />
            </div>

            <div className="application-field">
              <label>Job ID</label>
              <input
                name="job_id"
                value={form.job_id}
                onChange={handleInputChange}
                placeholder="Job identifier"
                required
              />
            </div>

            <div className="application-field">
              <label>Location</label>
              <input
                name="location"
                value={form.location}
                onChange={handleInputChange}
                placeholder="e.g. Chennai"
              />
            </div>

            <div className="application-field">
              <label>Job Type</label>
              <input
                name="job_type"
                value={form.job_type}
                onChange={handleInputChange}
                placeholder="Internship / Full-time"
              />
            </div>

            <div className="application-field">
              <label>Work Model</label>
              <input
                name="work_model"
                value={form.work_model}
                onChange={handleInputChange}
                placeholder="Remote / Hybrid / On-site"
              />
            </div>

            <div className="application-field">
              <label>Match Score</label>
              <input
                type="number"
                min="0"
                max="100"
                name="match_score"
                value={form.match_score}
                onChange={handleInputChange}
                placeholder="85"
              />
            </div>

            <div className="application-field">
              <label>Job URL</label>
              <input
                type="url"
                name="job_url"
                value={form.job_url}
                onChange={handleInputChange}
                placeholder="https://..."
              />
            </div>

            <div className="application-field full">
              <label>Notes</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleInputChange}
                placeholder="Add notes about this application..."
                rows="3"
              />
            </div>

          </div>

          <div className="application-form-actions">

            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2
                    size={16}
                    className="applications-spinner"
                  />
                  Saving...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Save Application
                </>
              )}
            </button>

          </div>

        </form>
      )}

      {/* APPLICATIONS */}
      {applications.length > 0 ? (

        <div className="applications-list">

          {applications.map(
            (application, index) => {

              const applicationId =
                getApplicationId(
                  application
                );

              const title =
                application?.title ||
                application?.job_title ||
                'Job Application';

              const company =
                application?.company ||
                'Company';

              const location =
                application?.location ||
                'Location not specified';

              const score =
                Number(
                  application?.match_score
                ) || 0;

              const url =
                application?.job_url ||
                application?.url ||
                '';

              const status =
                getStatus(application);

              return (
                <article
                  className="application-card"
                  key={
                    applicationId ||
                    index
                  }
                >

                  <div className="application-card-main">

                    <div className="application-company-icon">
                      <BriefcaseBusiness
                        size={21}
                      />
                    </div>

                    <div className="application-info">

                      <h2>
                        {title}
                      </h2>

                      <strong>
                        {company}
                      </strong>

                      <span className="application-location">
                        <MapPin size={13} />
                        {location}
                      </span>

                    </div>

                    <div className="application-score">
                      <TargetIcon />
                      <strong>
                        {score}%
                      </strong>
                      <span>
                        match
                      </span>
                    </div>

                  </div>

                  <div className="application-card-footer">

                    <select
                      value={status}
                      onChange={event =>
                        handleStatusChange(
                          applicationId,
                          event.target.value
                        )
                      }
                      className={`application-status ${getStatusClass(
                        status
                      )}`}
                    >
                      {STATUS_OPTIONS.map(
                        option => (
                          <option
                            key={option}
                            value={option}
                          >
                            {option}
                          </option>
                        )
                      )}
                    </select>

                    <div className="application-actions">

                      {url && (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="application-view-link"
                        >
                          View Job
                          <ExternalLink
                            size={14}
                          />
                        </a>
                      )}

                      <button
                        type="button"
                        className="application-delete"
                        onClick={() =>
                          handleDelete(
                            applicationId
                          )
                        }
                        aria-label="Delete application"
                      >
                        <Trash2 size={16} />
                      </button>

                    </div>

                  </div>

                </article>
              );
            }
          )}

        </div>

      ) : (

        <div className="applications-empty">

          <div className="applications-empty-icon">
            <BriefcaseBusiness size={30} />
          </div>

          <h2>
            No applications yet
          </h2>

          <p>
            Start tracking your job applications
            so you never lose sight of an opportunity.
          </p>

          <button
            type="button"
            className="primary-button"
            onClick={() =>
              setShowForm(true)
            }
          >
            <Plus size={17} />
            Add Your First Application
          </button>

        </div>

      )}

    </div>
  );
}

function getApplicationId(application) {
  return (
    application?.id ||
    application?._id ||
    application?.application_id
  );
}

function getStatus(application) {
  return (
    application?.status ||
    'Applied'
  );
}

function getStatusClass(status) {
  return String(status)
    .toLowerCase()
    .replace(/\s+/g, '-');
}

function TargetIcon() {
  return (
    <CheckCircle2 size={15} />
  );
}

export default ApplicationTracker;