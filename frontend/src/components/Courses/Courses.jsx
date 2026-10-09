import { useEffect, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  ExternalLink,
  Loader2,
  Sparkles,
  Tag,
} from 'lucide-react';

import { getRecommendedCourses } from '../../services/courseService';

import './Courses.css';

function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadCourses();
  }, []);

  async function loadCourses() {
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
        'COURSE REQUEST DATA:',
        JSON.stringify(requestData, null, 2)
      );

      const data = await getRecommendedCourses(analysis);

      console.log(
        'COURSE API RESPONSE:',
        JSON.stringify(data, null, 2)
      );

      let recommended = [];

      // Backend returns an array directly
      if (Array.isArray(data)) {
        recommended = data;
      }

      // Recommended courses
      else if (Array.isArray(data?.recommended_courses)) {
        recommended = data.recommended_courses;
      }

      else if (Array.isArray(data?.recommended)) {
        recommended = data.recommended;
      }

      else if (Array.isArray(data?.courses)) {
        recommended = data.courses;
      }

      // Backend separates free and paid courses
      else {
        const freeCourses = Array.isArray(data?.free_courses)
          ? data.free_courses
          : [];

        const paidCourses = Array.isArray(data?.paid_courses)
          ? data.paid_courses
          : [];

        recommended = [
          ...freeCourses,
          ...paidCourses,
        ];
      }

      console.log(
        'FINAL COURSES:',
        JSON.stringify(recommended, null, 2)
      );

      setCourses(recommended);

    } catch (error) {
      console.error(
        'Course loading error:',
        error
      );

      console.error(
        'COURSE API ERROR:',
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
          'Unable to load course recommendations. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  }

  /*
   * Loading
   */
  if (loading) {
    return (
      <div className="courses-page page-container">
        <div className="courses-loading">
          <Loader2
            size={28}
            className="courses-spinner"
          />

          <p>
            Finding courses for your career goals...
          </p>
        </div>
      </div>
    );
  }

  /*
   * Error
   */
  if (errorMessage) {
    return (
      <div className="courses-page page-container">

        <div className="courses-header">
          <div>
            <div className="courses-eyebrow">
              <Sparkles size={14} />
              Personalized learning
            </div>

            <h1>
              Recommended Courses
            </h1>

            <p>
              Courses selected based on your resume,
              career goals, and skill gaps.
            </p>
          </div>
        </div>

        <div className="courses-error">

          <div className="courses-error-icon">
            <AlertCircle size={22} />
          </div>

          <div className="courses-error-content">

            <strong>
              Courses unavailable
            </strong>

            <p>
              {errorMessage}
            </p>

            <button
              type="button"
              className="primary-button"
              onClick={loadCourses}
            >
              Try Again
            </button>

          </div>

        </div>

      </div>
    );
  }

  /*
   * Main page
   */
  return (
    <div className="courses-page page-container">

      {/* HEADER */}
      <div className="courses-header">

        <div>
          <div className="courses-eyebrow">
            <Sparkles size={14} />
            Personalized learning
          </div>

          <h1>
            Recommended Courses
          </h1>

          <p>
            Build the skills you need with courses
            matched to your career profile and skill gaps.
          </p>
        </div>

        <div className="courses-header-badge">
          <BookOpen size={17} />

          {courses.length} recommendations
        </div>

      </div>

      {/* COURSES */}
      {courses.length > 0 ? (

        <div className="courses-grid">

          {courses.map((course, index) => {

            const title =
              course?.title ||
              course?.name ||
              course?.course_name ||
              course?.course_title ||
              `Recommended Course ${index + 1}`;

            const provider =
              course?.provider ||
              course?.platform ||
              course?.source ||
              'CareerForge AI';

            const category =
              course?.category ||
              course?.skill ||
              course?.target_skill ||
              course?.subject ||
              'Career Development';

            const relevance =
              course?.relevance_score ??
              course?.relevance ??
              course?.match_score ??
              course?.score ??
              0;

            let price =
              course?.price ||
              course?.type;

            if (!price) {
              price = course?.is_free
                ? 'Free'
                : 'Paid';
            }

            const url =
              course?.url ||
              course?.link ||
              course?.course_url ||
              course?.course_link ||
              '';

            return (
              <article
                className="course-card"
                key={
                  course?.id ||
                  course?.course_id ||
                  `${title}-${index}`
                }
              >

                {/* TOP */}
                <div className="course-card-top">

                  <div className="course-icon">
                    <BookOpen size={21} />
                  </div>

                  <span className="course-relevance">
                    {Math.round(
                      Number(relevance) || 0
                    )}
                    % match
                  </span>

                </div>

                {/* CONTENT */}
                <div className="course-card-content">

                  <span className="course-provider">
                    {provider}
                  </span>

                  <h2>
                    {title}
                  </h2>

                  <div className="course-category">
                    <Tag size={14} />

                    <span>
                      {category}
                    </span>
                  </div>

                  {/* FOOTER */}
                  <div className="course-card-footer">

                    <span
                      className={`course-price ${
                        String(price)
                          .toLowerCase()
                          .includes('free')
                          ? 'free'
                          : 'paid'
                      }`}
                    >
                      {price}
                    </span>

                    {url && (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="course-link"
                      >
                        View Course

                        <ExternalLink
                          size={15}
                        />
                      </a>
                    )}

                  </div>

                </div>

              </article>
            );
          })}

        </div>

      ) : (

        /* EMPTY */
        <div className="courses-empty">

          <div className="courses-empty-icon">
            <BookOpen size={30} />
          </div>

          <h2>
            No recommendations yet
          </h2>

          <p>
            CareerForge AI could not find course
            recommendations for the current profile.
          </p>

          <button
            type="button"
            className="primary-button"
            onClick={loadCourses}
          >
            Refresh Recommendations
          </button>

        </div>

      )}

    </div>
  );
}

export default Courses;