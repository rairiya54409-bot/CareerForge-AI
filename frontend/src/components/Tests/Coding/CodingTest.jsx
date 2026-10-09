import { useState } from 'react';
import {
  CheckCircle2,
  Code2,
  Loader2,
  Play,
  RotateCcw,
  Send,
  Sparkles,
} from 'lucide-react';

import {
  startTestSession,
  startCodingTest,
  submitCodingAnswer,
} from '../../../services/codingService';

import './CodingTest.css';

const ROLES = [
  'Data Analyst',
  'Software Engineer',
  'Data Scientist',
  'Backend Developer',
  'Full Stack Developer',
];

const DIFFICULTIES = [
  'easy',
  'medium',
  'hard',
];

const PROGRAMMING_LANGUAGES = [
  {
    code: 'python',
    name: 'Python',
  },
  {
    code: 'cpp',
    name: 'C++',
  },
  {
    code: 'java',
    name: 'Java',
  },
  {
    code: 'javascript',
    name: 'JavaScript',
  },
];

const QUESTION_LANGUAGES = [
  {
    code: 'en',
    name: 'English',
  },
  {
    code: 'hi',
    name: 'Hindi',
  },
  {
    code: 'bn',
    name: 'Bengali',
  },
  {
    code: 'ta',
    name: 'Tamil',
  },
  {
    code: 'te',
    name: 'Telugu',
  },
  {
    code: 'mr',
    name: 'Marathi',
  },
  {
    code: 'kn',
    name: 'Kannada',
  },
  {
    code: 'ml',
    name: 'Malayalam',
  },
  {
    code: 'gu',
    name: 'Gujarati',
  },
  {
    code: 'pa',
    name: 'Punjabi',
  },
  {
    code: 'or',
    name: 'Odia',
  },
];

function CodingTest() {
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');

  const [role, setRole] = useState('Data Analyst');
  const [difficulty, setDifficulty] = useState('medium');

  const [questionLanguage, setQuestionLanguage] =
    useState('en');

  const [programmingLanguage, setProgrammingLanguage] =
    useState('python');

  const [sessionId, setSessionId] = useState('');
  const [question, setQuestion] = useState(null);
  const [code, setCode] = useState('');
  const [result, setResult] = useState(null);

  /*
   * START CODING TEST
   *
   * Step 1:
   * POST /api/tests/start
   *
   * Step 2:
   * POST /api/tests/coding/start
   */

  async function handleStart() {
    try {
      setLoading(true);
      setErrorMessage('');
      setCompleted(false);
      setResult(null);

      /*
       * STEP 1
       * Create the real test session.
       */

      const sessionPayload = {
        test_type: 'coding',
        language: questionLanguage,
        role,
        programming_language:
          programmingLanguage,
        difficulty,
      };

      console.log(
        'TEST SESSION REQUEST:',
        JSON.stringify(
          sessionPayload,
          null,
          2
        )
      );

      const sessionResponse =
        await startTestSession(
          sessionPayload
        );

      console.log(
        'TEST SESSION RESPONSE:',
        JSON.stringify(
          sessionResponse,
          null,
          2
        )
      );

      /*
       * Extract the real session ID.
       */

      const newSessionId =
        sessionResponse?.session_id ||
        sessionResponse?.id ||
        sessionResponse?.data?.session_id ||
        sessionResponse?.session?.session_id;

      if (!newSessionId) {
        throw new Error(
          'The server did not return a test session ID.'
        );
      }

      /*
       * STEP 2
       * Start the coding test using
       * the real session ID.
       */

      const codingPayload = {
        session_id: newSessionId,
        role,
        difficulty,
      };

      console.log(
        'CODING TEST REQUEST:',
        JSON.stringify(
          codingPayload,
          null,
          2
        )
      );

      const codingResponse =
        await startCodingTest(
          codingPayload
        );

      console.log(
        'CODING TEST RESPONSE:',
        JSON.stringify(
          codingResponse,
          null,
          2
        )
      );

      /*
       * Extract question.
       */

      const questionData =
        codingResponse?.question ||
        codingResponse?.data?.question ||
        codingResponse?.session?.question ||
        codingResponse?.problem ||
        codingResponse?.prompt ||
        codingResponse;

      /*
       * Save session.
       */

      setSessionId(newSessionId);

      /*
       * Save question.
       */

      setQuestion(questionData);

      /*
       * Starter code, if provided.
       */

      const starterCode =
        codingResponse?.starter_code ||
        codingResponse?.data?.starter_code ||
        codingResponse?.session?.starter_code ||
        codingResponse?.code ||
        '';

      setCode(starterCode);

      setStarted(true);

    } catch (error) {
      console.error(
        'Coding test start error:',
        error
      );

      console.error(
        'Backend response:',
        error.response?.data
      );

      const detail =
        error.response?.data?.detail;

      if (Array.isArray(detail)) {
        setErrorMessage(
          detail
            .map(
              item =>
                item?.msg ||
                'Invalid request'
            )
            .join(', ')
        );
      } else if (
        typeof detail === 'string'
      ) {
        setErrorMessage(detail);
      } else if (error.message) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage(
          'Unable to start the coding test.'
        );
      }

    } finally {
      setLoading(false);
    }
  }

  /*
   * SUBMIT CODING ANSWER
   *
   * POST /api/tests/coding/submit
   *
   * {
   *   session_id: string,
   *   question: string,
   *   code: string
   * }
   */

  async function handleSubmit() {
    if (!sessionId) {
      setErrorMessage(
        'Coding session was not found.'
      );
      return;
    }

    if (!code.trim()) {
      setErrorMessage(
        'Please write your solution before submitting.'
      );
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage('');

      /*
       * Get the actual question text.
       */

      const questionText =
        typeof question === 'string'
          ? question
          : question?.question ||
            question?.problem ||
            question?.prompt ||
            question?.description ||
            question?.text ||
            '';

      /*
       * Exact backend contract.
       */

      const payload = {
        session_id: sessionId,
        question: questionText,
        code,
      };

      console.log(
        'CODING SUBMISSION REQUEST:',
        JSON.stringify(
          payload,
          null,
          2
        )
      );

      const data =
        await submitCodingAnswer(
          payload
        );

      console.log(
        'CODING SUBMISSION RESPONSE:',
        JSON.stringify(
          data,
          null,
          2
        )
      );

      setResult(data);
      setCompleted(true);

    } catch (error) {
      console.error(
        'Coding submission error:',
        error
      );

      console.error(
        'Backend response:',
        error.response?.data
      );

      const detail =
        error.response?.data?.detail;

      if (Array.isArray(detail)) {
        setErrorMessage(
          detail
            .map(
              item =>
                item?.msg ||
                'Invalid request'
            )
            .join(', ')
        );
      } else if (
        typeof detail === 'string'
      ) {
        setErrorMessage(detail);
      } else if (error.message) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage(
          'Unable to submit your coding solution.'
        );
      }

    } finally {
      setSubmitting(false);
    }
  }

  /*
   * RESET TEST
   */

  function resetTest() {
    setStarted(false);
    setCompleted(false);

    setSessionId('');
    setQuestion(null);
    setCode('');

    setResult(null);
    setErrorMessage('');
  }

  /*
   * EXTRACT QUESTION TEXT
   */

  function getQuestionText() {
    if (!question) {
      return 'Solve the coding problem below.';
    }

    if (typeof question === 'string') {
      return question;
    }

    return (
      question.question ||
      question.problem ||
      question.prompt ||
      question.description ||
      question.text ||
      'Solve the coding problem below.'
    );
  }

  const questionText =
    getQuestionText();

  const inputFormat =
    typeof question === 'object'
      ? question?.input_format ||
        question?.input
      : null;

  const outputFormat =
    typeof question === 'object'
      ? question?.output_format ||
        question?.output
      : null;

  const constraints =
    typeof question === 'object'
      ? question?.constraints
      : null;

  /*
   * RESULT SCREEN
   */

  if (completed && result) {
    const score =
      result?.score ??
      result?.final_score ??
      result?.result?.score ??
      0;

    const feedback =
      result?.feedback ||
      result?.evaluation ||
      result?.result?.feedback ||
      result?.message ||
      'Your coding solution was evaluated successfully.';

    return (
      <div className="coding-page page-container">

        <div className="coding-result-card">

          <div className="coding-result-icon">
            <CheckCircle2 size={32} />
          </div>

          <div className="coding-result-label">
            CODING TEST COMPLETED
          </div>

          <h1>
            Assessment complete
          </h1>

          <p className="coding-result-subtitle">
            Your solution has been evaluated
            by CareerForge AI.
          </p>

          <div className="coding-score-circle">

            <strong>
              {score}
            </strong>

            <span>
              / 100
            </span>

          </div>

          <div className="coding-feedback-card">

            <div className="coding-feedback-title">
              <Sparkles size={15} />
              AI Evaluation
            </div>

            <p>
              {feedback}
            </p>

          </div>

          {result?.skill_progress && (
            <div className="coding-skill-update">

              <CheckCircle2 size={18} />

              <div>

                <strong>
                  Skill Progress Updated
                </strong>

                <span>
                  Your coding performance has
                  been added to your CareerForge
                  skill profile.
                </span>

              </div>

            </div>
          )}

          <div className="coding-result-actions">

            <button
              type="button"
              className="primary-button"
              onClick={resetTest}
            >
              <RotateCcw size={16} />
              Take Another Test
            </button>

          </div>

        </div>

      </div>
    );
  }

  /*
   * SETUP SCREEN
   */

  if (!started) {
    return (
      <div className="coding-page page-container">

        <div className="coding-header">

          <div>

            <div className="coding-eyebrow">
              <Code2 size={14} />
              Technical Assessment
            </div>

            <h1>
              Coding Test
            </h1>

            <p>
              Practice coding problems generated
              around your target career role and
              difficulty level.
            </p>

          </div>

          <div className="coding-header-icon">
            <Code2 size={25} />
          </div>

        </div>

        <section className="coding-setup-card">

          <div className="coding-setup-heading">

            <div className="coding-setup-icon">
              <Sparkles size={17} />
            </div>

            <div>

              <h2>
                Configure your assessment
              </h2>

              <p>
                Select the role, language and
                difficulty for your coding challenge.
              </p>

            </div>

          </div>

          <div className="coding-form-grid">

            <div className="coding-field">

              <label>
                Target Role
              </label>

              <select
                value={role}
                onChange={event =>
                  setRole(
                    event.target.value
                  )
                }
              >

                {ROLES.map(item => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                ))}

              </select>

            </div>

            <div className="coding-field">

              <label>
                Difficulty
              </label>

              <select
                value={difficulty}
                onChange={event =>
                  setDifficulty(
                    event.target.value
                  )
                }
              >

                {DIFFICULTIES.map(
                  level => (
                    <option
                      key={level}
                      value={level}
                    >
                      {level
                        .charAt(0)
                        .toUpperCase() +
                        level.slice(1)}
                    </option>
                  )
                )}

              </select>

            </div>

            <div className="coding-field">

              <label>
                Question Language
              </label>

              <select
                value={questionLanguage}
                onChange={event =>
                  setQuestionLanguage(
                    event.target.value
                  )
                }
              >

                {QUESTION_LANGUAGES.map(
                  language => (
                    <option
                      key={language.code}
                      value={language.code}
                    >
                      {language.name}
                    </option>
                  )
                )}

              </select>

            </div>

            <div className="coding-field">

              <label>
                Programming Language
              </label>

              <select
                value={programmingLanguage}
                onChange={event =>
                  setProgrammingLanguage(
                    event.target.value
                  )
                }
              >

                {PROGRAMMING_LANGUAGES.map(
                  language => (
                    <option
                      key={language.code}
                      value={language.code}
                    >
                      {language.name}
                    </option>
                  )
                )}

              </select>

            </div>

          </div>

          <div className="coding-info-strip">

            <Code2 size={15} />

            <span>
              Question language and programming
              language are selected independently.
            </span>

          </div>

          {errorMessage && (
            <div className="coding-error">
              {errorMessage}
            </div>
          )}

          <button
            type="button"
            className="primary-button coding-start-button"
            onClick={handleStart}
            disabled={loading}
          >

            {loading ? (
              <>
                <Loader2
                  size={17}
                  className="coding-spinner"
                />

                Creating Test...
              </>
            ) : (
              <>
                <Play size={17} />

                Start Coding Test
              </>
            )}

          </button>

        </section>

      </div>
    );
  }

  /*
   * CODING WORKSPACE
   */

  return (
    <div className="coding-page page-container">

      <div className="coding-test-header">

        <div>

          <div className="coding-eyebrow">
            <Code2 size={14} />
            Coding Assessment
          </div>

          <h1>
            Solve the challenge
          </h1>

        </div>

        <div className="coding-test-meta">

          <span>
            {role}
          </span>

          <span>
            {difficulty}
          </span>

          <span>
            {programmingLanguage}
          </span>

        </div>

      </div>

      <div className="coding-workspace">

        {/* QUESTION */}

        <section className="coding-question-card">

          <div className="coding-question-header">

            <div>

              <Code2 size={15} />

              <strong>
                Problem
              </strong>

            </div>

            <span>
              {questionLanguage.toUpperCase()}
            </span>

          </div>

          <div className="coding-question">

            {questionText}

          </div>

          {(inputFormat ||
            outputFormat ||
            constraints) && (

            <div className="coding-details">

              {inputFormat && (
                <div className="coding-detail">

                  <strong>
                    Input
                  </strong>

                  <p>
                    {inputFormat}
                  </p>

                </div>
              )}

              {outputFormat && (
                <div className="coding-detail">

                  <strong>
                    Output
                  </strong>

                  <p>
                    {outputFormat}
                  </p>

                </div>
              )}

              {constraints && (
                <div className="coding-detail">

                  <strong>
                    Constraints
                  </strong>

                  <p>
                    {constraints}
                  </p>

                </div>
              )}

            </div>
          )}

        </section>

        {/* CODE EDITOR */}

        <section className="coding-editor-card">

          <div className="coding-editor-header">

            <div>

              <Code2 size={15} />

              <strong>
                {
                  PROGRAMMING_LANGUAGES.find(
                    item =>
                      item.code ===
                      programmingLanguage
                  )?.name ||
                  programmingLanguage
                }
              </strong>

            </div>

            <span>
              Your solution
            </span>

          </div>

          <textarea
            className="coding-editor"
            value={code}
            onChange={event =>
              setCode(
                event.target.value
              )
            }
            spellCheck={false}
            placeholder={`Write your ${programmingLanguage} solution here...`}
          />

          {errorMessage && (
            <div className="coding-error editor-error">
              {errorMessage}
            </div>
          )}

          <div className="coding-submit-area">

            <button
              type="button"
              className="secondary-button"
              onClick={resetTest}
              disabled={submitting}
            >
              Exit Test
            </button>

            <button
              type="button"
              className="primary-button"
              onClick={handleSubmit}
              disabled={submitting}
            >

              {submitting ? (
                <>
                  <Loader2
                    size={16}
                    className="coding-spinner"
                  />

                  Evaluating...
                </>
              ) : (
                <>
                  <Send size={16} />

                  Submit Solution
                </>
              )}

            </button>

          </div>

        </section>

      </div>

    </div>
  );
}

export default CodingTest;