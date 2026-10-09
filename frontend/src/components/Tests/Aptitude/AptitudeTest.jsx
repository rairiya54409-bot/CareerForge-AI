import { useState } from 'react';
import {
  CheckCircle2,
  Brain,
  Loader2,
  Play,
  RotateCcw,
  Send,
  Sparkles,
  CircleHelp,
} from 'lucide-react';

import {
  startTestSession,
  startAptitudeTest,
  submitAptitudeAnswer,
} from '../../../services/aptitudeService';

import api from '../../../services/api';

import './AptitudeTest.css';

const TOTAL_QUESTIONS = 10;

const CATEGORIES = [
  {
    code: 'quantitative',
    name: 'Quantitative Reasoning',
  },
  {
    code: 'logical_reasoning',
    name: 'Logical Reasoning',
  },
  {
    code: 'verbal',
    name: 'Verbal Ability',
  },
  {
    code: 'data_interpretation',
    name: 'Data Interpretation',
  },
];

const DIFFICULTIES = [
  'easy',
  'medium',
  'hard',
];

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
  { code: 'bn', name: 'Bengali' },
  { code: 'ta', name: 'Tamil' },
  { code: 'te', name: 'Telugu' },
  { code: 'mr', name: 'Marathi' },
  { code: 'kn', name: 'Kannada' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'pa', name: 'Punjabi' },
  { code: 'or', name: 'Odia' },
];

const ROLES = [
  'Data Analyst',
  'Software Engineer',
  'Data Scientist',
  'Business Analyst',
  'General Placement',
];

function AptitudeTest() {
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');

  const [category, setCategory] =
    useState('quantitative');

  const [difficulty, setDifficulty] =
    useState('medium');

  const [language, setLanguage] =
    useState('en');

  const [role, setRole] =
    useState('Data Analyst');

  const [sessionId, setSessionId] =
    useState('');

  const [question, setQuestion] =
    useState(null);

  const [selectedOption, setSelectedOption] =
    useState('');

  const [currentQuestion, setCurrentQuestion] =
    useState(1);

  const [correctAnswers, setCorrectAnswers] =
    useState(0);

  const [questionResults, setQuestionResults] =
    useState([]);

  const [result, setResult] =
    useState(null);

  /*
   * -----------------------------------------
   * EXTRACT QUESTION
   * -----------------------------------------
   */

  function extractQuestion(response) {
    return (
      response?.question ||
      response?.data?.question ||
      response?.session?.question ||
      response?.problem ||
      response?.prompt ||
      response
    );
  }

  /*
   * -----------------------------------------
   * QUESTION TEXT
   * -----------------------------------------
   */

  function getQuestionText(questionData) {
    if (!questionData) {
      return 'Question unavailable.';
    }

    if (typeof questionData === 'string') {
      return questionData;
    }

    return (
      questionData.question ||
      questionData.prompt ||
      questionData.text ||
      questionData.problem ||
      'Question unavailable.'
    );
  }

  /*
   * -----------------------------------------
   * OPTIONS
   * -----------------------------------------
   */

  function getOptions(questionData) {
    if (!questionData) {
      return [];
    }

    if (typeof questionData === 'string') {
      return [];
    }

    return (
      questionData.options ||
      questionData.choices ||
      questionData.answers ||
      []
    );
  }

  /*
   * -----------------------------------------
   * CREATE SESSION + FIRST QUESTION
   * -----------------------------------------
   */

  async function handleStart() {
    try {
      setLoading(true);
      setErrorMessage('');

      setCompleted(false);
      setResult(null);

      setCurrentQuestion(1);
      setCorrectAnswers(0);
      setQuestionResults([]);
      setSelectedOption('');

      /*
       * STEP 1
       */

      const sessionPayload = {
        test_type: 'aptitude',
        language,
        role,
        programming_language: '',
        difficulty,
      };

      console.log(
        'APTITUDE SESSION REQUEST:',
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
        'APTITUDE SESSION RESPONSE:',
        JSON.stringify(
          sessionResponse,
          null,
          2
        )
      );

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
       * Generate first question.
       */

      const aptitudePayload = {
        session_id: newSessionId,
        category,
        difficulty,
      };

      const aptitudeResponse =
        await startAptitudeTest(
          aptitudePayload
        );

      console.log(
        'FIRST APTITUDE QUESTION:',
        JSON.stringify(
          aptitudeResponse,
          null,
          2
        )
      );

      setSessionId(newSessionId);

      setQuestion(
        extractQuestion(
          aptitudeResponse
        )
      );

      setStarted(true);

    } catch (error) {
      console.error(
        'Aptitude start error:',
        error
      );

      showBackendError(
        error,
        'Unable to start the aptitude test.'
      );

    } finally {
      setLoading(false);
    }
  }

  /*
   * -----------------------------------------
   * SUBMIT CURRENT ANSWER
   * -----------------------------------------
   */

  async function handleSubmit() {
    if (!sessionId) {
      setErrorMessage(
        'Aptitude session was not found.'
      );
      return;
    }

    if (!selectedOption) {
      setErrorMessage(
        'Please select an answer before continuing.'
      );
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage('');

      const questionText =
        getQuestionText(question);

      const payload = {
        session_id: sessionId,
        question: questionText,
        selected_option: selectedOption,
      };

      console.log(
        `APTITUDE ANSWER ${currentQuestion}:`,
        JSON.stringify(
          payload,
          null,
          2
        )
      );

      const answerResponse =
        await submitAptitudeAnswer(
          payload
        );

      console.log(
        `APTITUDE ANSWER RESPONSE ${currentQuestion}:`,
        JSON.stringify(
          answerResponse,
          null,
          2
        )
      );

      /*
       * Determine whether answer was correct.
       */

      const isCorrect =
        answerResponse?.correct ??
        answerResponse?.is_correct ??
        answerResponse?.result?.correct ??
        false;

      /*
       * Update local score.
       */

      if (isCorrect) {
        setCorrectAnswers(
          previous => previous + 1
        );
      }

      setQuestionResults(
        previous => [
          ...previous,
          {
            questionNumber:
              currentQuestion,
            selectedOption,
            correct: isCorrect,
          },
        ]
      );

      /*
       * QUESTION 10 → COMPLETE
       */

      if (
        currentQuestion >=
        TOTAL_QUESTIONS
      ) {
        await finishTest(
          answerResponse,
          isCorrect
        );

        return;
      }

      /*
       * Generate next question.
       */

      const nextQuestionNumber =
        currentQuestion + 1;

      const nextQuestionResponse =
        await startAptitudeTest({
          session_id: sessionId,
          category,
          difficulty,
        });

      console.log(
        `APTITUDE QUESTION ${nextQuestionNumber}:`,
        JSON.stringify(
          nextQuestionResponse,
          null,
          2
        )
      );

      setQuestion(
        extractQuestion(
          nextQuestionResponse
        )
      );

      setCurrentQuestion(
        nextQuestionNumber
      );

      setSelectedOption('');

    } catch (error) {
      console.error(
        'Aptitude answer error:',
        error
      );

      showBackendError(
        error,
        'Unable to submit your answer.'
      );

    } finally {
      setSubmitting(false);
    }
  }

  /*
   * -----------------------------------------
   * FINISH TEST
   * -----------------------------------------
   */

  async function finishTest(
    lastAnswerResponse,
    lastIsCorrect
  ) {
    try {
      /*
       * Local score.
       *
       * We use current state plus the
       * final answer because React state
       * updates asynchronously.
       */

      const finalCorrectAnswers =
        correctAnswers +
        (lastIsCorrect ? 1 : 0);

      const finalScore =
        Math.round(
          (finalCorrectAnswers /
            TOTAL_QUESTIONS) *
            100
        );

      /*
       * Complete backend session.
       *
       * This allows the existing backend
       * test-session logic to calculate
       * the final score and update
       * Skill Progress.
       */

      let completionResponse = null;

      try {
        const response =
          await api.patch(
            `/api/tests/${sessionId}/status`,
            {
              status: 'completed',
            }
          );

        completionResponse =
          response.data;

      } catch (completionError) {
        console.warn(
          'Session completion request failed:',
          completionError.response?.data ||
            completionError.message
        );
      }

      setResult({
        ...lastAnswerResponse,
        final_score:
          completionResponse?.final_score ??
          finalScore,
        score:
          completionResponse?.final_score ??
          finalScore,
        correct_answers:
          finalCorrectAnswers,
        total_questions:
          TOTAL_QUESTIONS,
        skill_progress:
          completionResponse?.skill_progress ??
          lastAnswerResponse?.skill_progress,
      });

      setCompleted(true);

    } catch (error) {
      console.error(
        'Test completion error:',
        error
      );

      /*
       * Even if backend completion
       * fails, show the locally
       * calculated result.
       */

      const finalCorrectAnswers =
        correctAnswers +
        (lastIsCorrect ? 1 : 0);

      const finalScore =
        Math.round(
          (finalCorrectAnswers /
            TOTAL_QUESTIONS) *
            100
        );

      setResult({
        ...lastAnswerResponse,
        score: finalScore,
        final_score: finalScore,
        correct_answers:
          finalCorrectAnswers,
        total_questions:
          TOTAL_QUESTIONS,
      });

      setCompleted(true);
    }
  }

  /*
   * -----------------------------------------
   * BACKEND ERROR HANDLER
   * -----------------------------------------
   */

  function showBackendError(
    error,
    fallback
  ) {
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
      setErrorMessage(fallback);
    }
  }

  /*
   * -----------------------------------------
   * RESET
   * -----------------------------------------
   */

  function resetTest() {
    setStarted(false);
    setCompleted(false);

    setSessionId('');
    setQuestion(null);

    setSelectedOption('');

    setCurrentQuestion(1);
    setCorrectAnswers(0);

    setQuestionResults([]);

    setResult(null);
    setErrorMessage('');
  }

  /*
   * -----------------------------------------
   * CURRENT QUESTION DATA
   * -----------------------------------------
   */

  const questionText =
    getQuestionText(question);

  const options =
    getOptions(question);

  /*
   * -----------------------------------------
   * RESULT SCREEN
   * -----------------------------------------
   */

  if (completed && result) {
    const score =
      result?.final_score ??
      result?.score ??
      0;

    const correct =
      result?.correct_answers ??
      0;

    const explanation =
      result?.explanation ||
      result?.feedback ||
      result?.result?.explanation ||
      'Your aptitude assessment has been completed successfully.';

    return (
      <div className="aptitude-page page-container">

        <div className="aptitude-result-card">

          <div className="aptitude-result-icon">
            <CheckCircle2 size={32} />
          </div>

          <div className="aptitude-result-label">
            APTITUDE TEST COMPLETED
          </div>

          <h1>
            Assessment complete
          </h1>

          <p className="aptitude-result-subtitle">
            You completed all{' '}
            {TOTAL_QUESTIONS}{' '}
            aptitude questions.
          </p>

          <div className="aptitude-score-circle">

            <strong>
              {score}
            </strong>

            <span>
              / 100
            </span>

          </div>

          <div className="aptitude-final-stats">

            <div>
              <strong>
                {correct}
              </strong>

              <span>
                Correct
              </span>
            </div>

            <div>
              <strong>
                {TOTAL_QUESTIONS -
                  correct}
              </strong>

              <span>
                Incorrect
              </span>
            </div>

            <div>
              <strong>
                {TOTAL_QUESTIONS}
              </strong>

              <span>
                Questions
              </span>
            </div>

          </div>

          <div className="aptitude-feedback-card">

            <div className="aptitude-feedback-title">
              <Sparkles size={15} />
              AI Performance
            </div>

            <p>
              {explanation}
            </p>

          </div>

          {result?.skill_progress && (
            <div className="aptitude-skill-update">

              <CheckCircle2 size={18} />

              <div>

                <strong>
                  Skill Progress Updated
                </strong>

                <span>
                  Your aptitude performance has
                  been added to your CareerForge
                  skill profile.
                </span>

              </div>

            </div>
          )}

          <div className="aptitude-result-actions">

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
   * -----------------------------------------
   * SETUP SCREEN
   * -----------------------------------------
   */

  if (!started) {
    return (
      <div className="aptitude-page page-container">

        <div className="aptitude-header">

          <div>

            <div className="aptitude-eyebrow">
              <Brain size={14} />
              Cognitive Assessment
            </div>

            <h1>
              Aptitude Test
            </h1>

            <p>
              Complete a 10-question assessment
              covering your selected aptitude category.
            </p>

          </div>

          <div className="aptitude-header-icon">
            <Brain size={25} />
          </div>

        </div>

        <section className="aptitude-setup-card">

          <div className="aptitude-setup-heading">

            <div className="aptitude-setup-icon">
              <Sparkles size={17} />
            </div>

            <div>

              <h2>
                Configure your assessment
              </h2>

              <p>
                Choose the category, difficulty,
                language and target role.
              </p>

            </div>

          </div>

          <div className="aptitude-form-grid">

            <div className="aptitude-field">

              <label>
                Assessment Category
              </label>

              <select
                value={category}
                onChange={event =>
                  setCategory(
                    event.target.value
                  )
                }
              >

                {CATEGORIES.map(
                  item => (
                    <option
                      key={item.code}
                      value={item.code}
                    >
                      {item.name}
                    </option>
                  )
                )}

              </select>

            </div>

            <div className="aptitude-field">

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

            <div className="aptitude-field">

              <label>
                Question Language
              </label>

              <select
                value={language}
                onChange={event =>
                  setLanguage(
                    event.target.value
                  )
                }
              >

                {LANGUAGES.map(
                  item => (
                    <option
                      key={item.code}
                      value={item.code}
                    >
                      {item.name}
                    </option>
                  )
                )}

              </select>

            </div>

            <div className="aptitude-field">

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

                {ROLES.map(
                  item => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  )
                )}

              </select>

            </div>

          </div>

          <div className="aptitude-info-strip">

            <Brain size={15} />

            <span>
              This assessment contains{' '}
              {TOTAL_QUESTIONS}{' '}
              AI-generated questions.
            </span>

          </div>

          {errorMessage && (
            <div className="aptitude-error">
              {errorMessage}
            </div>
          )}

          <button
            type="button"
            className="primary-button aptitude-start-button"
            onClick={handleStart}
            disabled={loading}
          >

            {loading ? (
              <>
                <Loader2
                  size={17}
                  className="aptitude-spinner"
                />

                Generating Test...
              </>
            ) : (
              <>
                <Play size={17} />

                Start Aptitude Test
              </>
            )}

          </button>

        </section>

      </div>
    );
  }

  /*
   * -----------------------------------------
   * QUESTION SCREEN
   * -----------------------------------------
   */

  const progress =
    (currentQuestion /
      TOTAL_QUESTIONS) *
    100;

  return (
    <div className="aptitude-page page-container">

      <div className="aptitude-test-header">

        <div>

          <div className="aptitude-eyebrow">
            <Brain size={14} />
            Aptitude Assessment
          </div>

          <h1>
            Solve the question
          </h1>

        </div>

        <div className="aptitude-test-meta">

          <span>
            {
              CATEGORIES.find(
                item =>
                  item.code ===
                  category
              )?.name || category
            }
          </span>

          <span>
            {difficulty}
          </span>

        </div>

      </div>

      {/* PROGRESS */}

      <div className="aptitude-progress-container">

        <div className="aptitude-progress-top">

          <strong>
            Question {currentQuestion} of{' '}
            {TOTAL_QUESTIONS}
          </strong>

          <span>
            {Math.round(progress)}%
          </span>

        </div>

        <div className="aptitude-progress-bar">

          <div
            className="aptitude-progress-fill"
            style={{
              width: `${progress}%`,
            }}
          />

        </div>

      </div>

      <section className="aptitude-question-card">

        <div className="aptitude-question-header">

          <div>

            <CircleHelp size={16} />

            <strong>
              Question {currentQuestion}
            </strong>

          </div>

          <span>
            {language.toUpperCase()}
          </span>

        </div>

        <div className="aptitude-question">

          {questionText}

        </div>

        <div className="aptitude-options">

          {options.map(
            (option, index) => {

              const optionValue =
                typeof option === 'string'
                  ? option
                  : option?.value ||
                    option?.text ||
                    option?.label ||
                    '';

              const optionLabel =
                typeof option === 'string'
                  ? option
                  : option?.text ||
                    option?.label ||
                    option?.value ||
                    '';

              const optionLetter =
                String.fromCharCode(
                  65 + index
                );

              const isSelected =
                selectedOption ===
                optionValue;

              return (
                <button
                  type="button"
                  key={`${optionValue}-${index}`}
                  className={
                    isSelected
                      ? 'aptitude-option selected'
                      : 'aptitude-option'
                  }
                  onClick={() =>
                    setSelectedOption(
                      optionValue
                    )
                  }
                >

                  <span className="aptitude-option-letter">
                    {optionLetter}
                  </span>

                  <span className="aptitude-option-text">
                    {optionLabel}
                  </span>

                  <span className="aptitude-option-radio">

                    {isSelected && (
                      <span />
                    )}

                  </span>

                </button>
              );
            }
          )}

        </div>

        {options.length === 0 && (
          <div className="aptitude-no-options">
            No answer options were returned
            for this question.
          </div>
        )}

        {errorMessage && (
          <div className="aptitude-error">
            {errorMessage}
          </div>
        )}

        <div className="aptitude-submit-area">

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
            disabled={
              submitting ||
              !selectedOption ||
              options.length === 0
            }
          >

            {submitting ? (
              <>
                <Loader2
                  size={16}
                  className="aptitude-spinner"
                />

                {currentQuestion ===
                TOTAL_QUESTIONS
                  ? 'Finishing Test...'
                  : 'Loading Next Question...'}
              </>
            ) : (
              <>
                <Send size={16} />

                {currentQuestion ===
                TOTAL_QUESTIONS
                  ? 'Finish Test'
                  : 'Next Question'}
              </>
            )}

          </button>

        </div>

      </section>

    </div>
  );
}

export default AptitudeTest;