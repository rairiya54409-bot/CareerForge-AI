import { useEffect, useState } from 'react';
import {
  AlertCircle,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Loader2,
  Sparkles,
  Target,
  TrendingUp,
  XCircle,
} from 'lucide-react';

import { getApplicationAnalytics } from '../../services/analyticsService';

import './CareerAnalytics.css';

function CareerAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    try {
      setLoading(true);
      setErrorMessage('');

      const data = await getApplicationAnalytics();

      console.log(
        'ANALYTICS API RESPONSE:',
        JSON.stringify(data, null, 2)
      );

      setAnalytics(data);
    } catch (error) {
      console.error('Analytics loading error:', error);
      console.error(
        'ANALYTICS API ERROR:',
        error.response?.data
      );

      const detail = error.response?.data?.detail;

      setErrorMessage(
        typeof detail === 'string'
          ? detail
          : 'Unable to load your career analytics.'
      );
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="analytics-page page-container">
        <div className="analytics-loading">
          <Loader2
            size={30}
            className="analytics-spinner"
          />

          <p>
            Analyzing your career progress...
          </p>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="analytics-page page-container">

        <div className="analytics-header">
          <div>
            <div className="analytics-eyebrow">
              <Sparkles size={14} />
              Career intelligence
            </div>

            <h1>Career Analytics</h1>

            <p>
              Understand your application activity,
              matching performance, and career progress.
            </p>
          </div>
        </div>

        <div className="analytics-error">
          <AlertCircle size={20} />

          <div>
            <strong>
              Analytics unavailable
            </strong>

            <p>
              {errorMessage}
            </p>

            <button
              type="button"
              className="primary-button"
              onClick={loadAnalytics}
            >
              Try Again
            </button>
          </div>
        </div>

      </div>
    );
  }

  const overview = analytics?.overview || {};
  const matchScore = analytics?.match_score || {};
  const conversion = analytics?.conversion_rates || {};
  const insights = analytics?.insights || [];

  const totalApplications =
    Number(overview.total_applications) || 0;

  const interviewConversion =
    Number(conversion.interview_conversion) || 0;

  const offerConversion =
    Number(conversion.offer_conversion) || 0;

  return (
    <div className="analytics-page page-container">

      {/* HEADER */}
      <div className="analytics-header">

        <div>
          <div className="analytics-eyebrow">
            <Sparkles size={14} />
            Career intelligence
          </div>

          <h1>
            Career Analytics
          </h1>

          <p>
            Track your application activity,
            job-match quality, and conversion performance.
          </p>
        </div>

        <div className="analytics-header-badge">
          <TrendingUp size={16} />
          Live insights
        </div>

      </div>

      {/* OVERVIEW CARDS */}
      <div className="analytics-overview">

        <div className="analytics-card">
          <div className="analytics-card-icon purple">
            <BriefcaseBusiness size={20} />
          </div>

          <div>
            <span>
              Total Applications
            </span>

            <strong>
              {totalApplications}
            </strong>
          </div>
        </div>

        <div className="analytics-card">
          <div className="analytics-card-icon purple">
            <SendIcon />
          </div>

          <div>
            <span>
              Applied
            </span>

            <strong>
              {Number(overview.applied) || 0}
            </strong>
          </div>
        </div>

        <div className="analytics-card">
          <div className="analytics-card-icon yellow">
            <Clock3 size={20} />
          </div>

          <div>
            <span>
              Interviews
            </span>

            <strong>
              {Number(overview.interviews) || 0}
            </strong>
          </div>
        </div>

        <div className="analytics-card">
          <div className="analytics-card-icon yellow">
            <CheckCircle2 size={20} />
          </div>

          <div>
            <span>
              Offers
            </span>

            <strong>
              {Number(overview.offers) || 0}
            </strong>
          </div>
        </div>

      </div>

      {/* PERFORMANCE */}
      <div className="analytics-grid">

        <section className="analytics-panel">

          <div className="analytics-panel-header">
            <div>
              <span>
                MATCH PERFORMANCE
              </span>

              <h2>
                Job Match Quality
              </h2>
            </div>

            <Target size={20} />
          </div>

          <div className="match-score-main">

            <div className="match-score-circle">
              <strong>
                {Number(matchScore.average) || 0}
              </strong>

              <span>
                Average
              </span>
            </div>

            <div className="match-score-details">

              <div>
                <span>
                  Highest Match
                </span>

                <strong>
                  {Number(matchScore.highest) || 0}%
                </strong>
              </div>

              <div>
                <span>
                  Lowest Match
                </span>

                <strong>
                  {Number(matchScore.lowest) || 0}%
                </strong>
              </div>

            </div>

          </div>

          <div className="match-bar">

            <div
              style={{
                width: `${Math.min(
                  Number(matchScore.average) || 0,
                  100
                )}%`,
              }}
            />

          </div>

          <p className="analytics-description">
            Your average match score indicates how closely
            the jobs you're applying to align with your
            current profile.
          </p>

        </section>

        {/* CONVERSION */}
        <section className="analytics-panel">

          <div className="analytics-panel-header">
            <div>
              <span>
                APPLICATION FUNNEL
              </span>

              <h2>
                Conversion Performance
              </h2>
            </div>

            <TrendingUp size={20} />
          </div>

          <div className="conversion-list">

            <div className="conversion-item">

              <div className="conversion-label">
                <span>
                  Application → Interview
                </span>

                <strong>
                  {interviewConversion}%
                </strong>
              </div>

              <div className="conversion-track">
                <div
                  style={{
                    width: `${Math.min(
                      interviewConversion,
                      100
                    )}%`,
                  }}
                />
              </div>

            </div>

            <div className="conversion-item">

              <div className="conversion-label">
                <span>
                  Application → Offer
                </span>

                <strong>
                  {offerConversion}%
                </strong>
              </div>

              <div className="conversion-track yellow">
                <div
                  style={{
                    width: `${Math.min(
                      offerConversion,
                      100
                    )}%`,
                  }}
                />
              </div>

            </div>

          </div>

          <div className="funnel-summary">

            <div>
              <span>Rejected</span>
              <strong>
                {Number(overview.rejected) || 0}
              </strong>
            </div>

            <div>
              <span>Withdrawn</span>
              <strong>
                {Number(overview.withdrawn) || 0}
              </strong>
            </div>

          </div>

        </section>

      </div>

      {/* INSIGHTS */}
      <section className="analytics-insights">

        <div className="analytics-insights-header">

          <div className="analytics-insights-icon">
            <Sparkles size={20} />
          </div>

          <div>
            <span>
              AI-POWERED INSIGHTS
            </span>

            <h2>
              Career Insights
            </h2>
          </div>

        </div>

        {insights.length > 0 ? (

          <div className="insights-list">

            {insights.map((insight, index) => (

              <div
                className="insight-item"
                key={index}
              >
                <div className="insight-check">
                  <CheckCircle2 size={16} />
                </div>

                <p>
                  {insight}
                </p>
              </div>

            ))}

          </div>

        ) : (

          <div className="no-insights">
            <p>
              More insights will appear as you
              build your application history.
            </p>
          </div>

        )}

      </section>

      {/* STATUS BREAKDOWN */}
      <section className="analytics-status-panel">

        <div className="analytics-panel-header">

          <div>
            <span>
              APPLICATION STATUS
            </span>

            <h2>
              Current Pipeline
            </h2>
          </div>

          <BriefcaseBusiness size={20} />

        </div>

        <div className="status-grid">

          <StatusItem
            label="Applied"
            value={overview.applied}
            icon={<SendIcon />}
            className="purple"
          />

          <StatusItem
            label="Interview"
            value={overview.interviews}
            icon={<Clock3 size={18} />}
            className="yellow"
          />

          <StatusItem
            label="Offer"
            value={overview.offers}
            icon={<CheckCircle2 size={18} />}
            className="green"
          />

          <StatusItem
            label="Rejected"
            value={overview.rejected}
            icon={<XCircle size={18} />}
            className="red"
          />

        </div>

      </section>

    </div>
  );
}

function StatusItem({
  label,
  value,
  icon,
  className,
}) {
  return (
    <div className="status-item">

      <div className={`status-item-icon ${className}`}>
        {icon}
      </div>

      <div>
        <span>
          {label}
        </span>

        <strong>
          {Number(value) || 0}
        </strong>
      </div>

    </div>
  );
}

function SendIcon() {
  return <TrendingUp size={20} />;
}

export default CareerAnalytics;