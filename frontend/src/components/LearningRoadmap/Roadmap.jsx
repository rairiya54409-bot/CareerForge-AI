import { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Loader2,
  Sparkles,
  Target,
} from 'lucide-react';

import { getLearningRoadmap } from '../../services/roadmapService';

import './Roadmap.css';

function Roadmap() {
  const [roadmap, setRoadmap] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadRoadmap();
  }, []);

  async function loadRoadmap() {
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
        return;
      }

      const analysis = JSON.parse(storedAnalysis);

      const requestData = {
        missing_skills: analysis?.missing_skills || [],
        recommended_roles: analysis?.recommended_roles || [],
        career_interests: analysis?.career_interests || [],
      };

      console.log(
        'ROADMAP REQUEST DATA:',
        JSON.stringify(requestData, null, 2)
      );

      const data = await getLearningRoadmap(analysis);

      console.log(
        'ROADMAP API RESPONSE:',
        JSON.stringify(data, null, 2)
      );

      /*
       * Support the possible roadmap response structures.
       */
      let roadmapData = [];

      if (Array.isArray(data)) {
        roadmapData = data;
      } else if (Array.isArray(data?.roadmap)) {
        roadmapData = data.roadmap;
      } else if (Array.isArray(data?.steps)) {
        roadmapData = data.steps;
      } else if (Array.isArray(data?.phases)) {
        roadmapData = data.phases;
      } else if (Array.isArray(data?.roadmap_steps)) {
        roadmapData = data.roadmap_steps;
      }

      console.log(
        'FINAL ROADMAP:',
        JSON.stringify(roadmapData, null, 2)
      );

      setRoadmap(roadmapData);

    } catch (error) {
      console.error(
        'Roadmap loading error:',
        error
      );

      console.error(
        'ROADMAP API ERROR:',
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
      } else if (error.message) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage(
          'Unable to generate your learning roadmap.'
        );
      }
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="roadmap-page page-container">
        <div className="roadmap-loading">
          <Loader2
            size={30}
            className="roadmap-spinner"
          />

          <p>
            Building your personalized learning roadmap...
          </p>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="roadmap-page page-container">

        <div className="roadmap-header">
          <div>
            <div className="roadmap-eyebrow">
              <Sparkles size={14} />
              Personalized career plan
            </div>

            <h1>Learning Roadmap</h1>

            <p>
              A structured learning path based on your
              resume, skills, and career goals.
            </p>
          </div>
        </div>

        <div className="roadmap-error">

          <div className="roadmap-error-icon">
            <AlertCircle size={22} />
          </div>

          <div>
            <strong>
              Roadmap unavailable
            </strong>

            <p>
              {errorMessage}
            </p>

            <button
              type="button"
              className="primary-button"
              onClick={loadRoadmap}
            >
              Generate Again
            </button>
          </div>

        </div>

      </div>
    );
  }

  return (
    <div className="roadmap-page page-container">

      {/* HEADER */}
      <div className="roadmap-header">

        <div>
          <div className="roadmap-eyebrow">
            <Sparkles size={14} />
            Personalized career plan
          </div>

          <h1>
            Learning Roadmap
          </h1>

          <p>
            Follow a structured path to close your skill
            gaps and move toward your recommended career roles.
          </p>
        </div>

        <div className="roadmap-header-badge">
          <Target size={17} />
          {roadmap.length} learning stages
        </div>

      </div>

      {/* ROADMAP */}
      {roadmap.length > 0 ? (

        <div className="roadmap-timeline">

          {roadmap.map((step, index) => {

            const title =
              step?.title ||
              step?.name ||
              step?.stage ||
              step?.phase ||
              `Stage ${index + 1}`;

            const description =
              step?.description ||
              step?.summary ||
              step?.details ||
              'Build the skills required for this stage.';

            const skill =
              step?.skill ||
              step?.target_skill ||
              step?.category ||
              '';

            const duration =
              step?.duration ||
              step?.estimated_time ||
              step?.time ||
              '';

            const courses =
              step?.courses ||
              step?.recommended_courses ||
              [];

            return (
              <div
                className="roadmap-step"
                key={step?.id || index}
              >

                {/* NUMBER */}
                <div className="roadmap-marker">

                  <div className="roadmap-marker-number">
                    {String(index + 1).padStart(2, '0')}
                  </div>

                </div>

                {/* CONTENT */}
                <div className="roadmap-step-card">

                  <div className="roadmap-step-top">

                    <div>
                      <span className="roadmap-stage">
                        STAGE {index + 1}
                      </span>

                      <h2>
                        {title}
                      </h2>
                    </div>

                    <div className="roadmap-complete">
                      <CheckCircle2 size={16} />
                      Planned
                    </div>

                  </div>

                  <p className="roadmap-description">
                    {description}
                  </p>

                  <div className="roadmap-meta">

                    {skill && (
                      <span>
                        <Target size={14} />
                        {skill}
                      </span>
                    )}

                    {duration && (
                      <span>
                        <Clock3 size={14} />
                        {duration}
                      </span>
                    )}

                  </div>

                  {/* COURSES */}
                  {Array.isArray(courses) &&
                    courses.length > 0 && (

                    <div className="roadmap-courses">

                      <div className="roadmap-courses-title">
                        <BookOpen size={16} />
                        Recommended learning
                      </div>

                      {courses.map((course, courseIndex) => {

                        const courseTitle =
                          typeof course === 'string'
                            ? course
                            : course?.title ||
                              course?.name ||
                              `Course ${courseIndex + 1}`;

                        return (
                          <div
                            className="roadmap-course"
                            key={courseIndex}
                          >
                            <span>
                              {courseTitle}
                            </span>

                            <ArrowRight size={15} />
                          </div>
                        );
                      })}

                    </div>
                  )}

                </div>

              </div>
            );
          })}

        </div>

      ) : (

        <div className="roadmap-empty">

          <div className="roadmap-empty-icon">
            <BookOpen size={30} />
          </div>

          <h2>
            No roadmap generated yet
          </h2>

          <p>
            Analyze your resume first so CareerForge AI
            can create a personalized learning path.
          </p>

          <button
            type="button"
            className="primary-button"
            onClick={loadRoadmap}
          >
            Generate Roadmap
          </button>

        </div>

      )}

    </div>
  );
}

export default Roadmap;