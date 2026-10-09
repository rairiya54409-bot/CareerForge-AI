import { useState } from 'react';
import {
  MessageSquare,
  Sparkles,
  Send,
  CheckCircle2,
  RotateCcw,
  Trophy,
} from 'lucide-react';

import {
  startTestSession,
  startInterviewTest,
  submitInterviewAnswer,
  completeInterviewTest,
} from '../../../services/interviewService';

import './InterviewTest.css';

const TOTAL_QUESTIONS = 5;

function InterviewTest() {
  const [stage, setStage] = useState('setup');

  const [role, setRole] = useState('Data Analyst');
  const [interviewType, setInterviewType] = useState('technical');
  const [difficulty, setDifficulty] = useState('medium');
  const [language, setLanguage] = useState('en');

  const [sessionId, setSessionId] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  const [questionNumber, setQuestionNumber] = useState(1);
  const [evaluations, setEvaluations] = useState([]);

  const [currentEvaluation, setCurrentEvaluation] = useState(null);
  const [finalResult, setFinalResult] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function extractSessionId(data) {
    return (
      data?.session_id ||
      data?.id ||
      data?.session?.session_id ||
      data?.session?.id ||
      ''
    );
  }

  function extractQuestion(data) {
    return (
      data?.question ||
      data?.next_question ||
      data?.data?.question ||
      data?.session?.question ||
      ''
    );
  }

  function extractEvaluation(data) {
    return (
      data?.evaluation ||
      data?.feedback ||
      data?.result ||
      data?.data?.evaluation ||
      null
    );
  }

  async function handleStart() {
    setError('');
    setLoading(true);

    try {
      // 1. Create a real backend test session.
      const sessionResponse = await startTestSession({
        test_type: 'interview',
        language,
        role,
        programming_language: '',
        difficulty,
      });

      const realSessionId = extractSessionId(sessionResponse);

      if (!realSessionId) {
        throw new Error('Backend did not return a valid session ID.');
      }

      // 2. Generate the first interview question.
      const interviewResponse = await startInterviewTest({
        session_id: realSessionId,
        role,
        interview_type: interviewType,
        difficulty,
      });

      const firstQuestion = extractQuestion(interviewResponse);

      if (!firstQuestion) {
        throw new Error('Backend did not return an interview question.');
      }

      setSessionId(realSessionId);
      setQuestion(firstQuestion);
      setQuestionNumber(1);
      setEvaluations([]);
      setCurrentEvaluation(null);
      setFinalResult(null);
      setAnswer('');
      setStage('question');
    } catch (err) {
      console.error('Interview start error:', err);

      setError(
        err?.response?.data?.detail ||
          err?.message ||
          'Unable to start the interview test.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!answer.trim()) {
      setError('Please enter your answer before submitting.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await submitInterviewAnswer({
        session_id: sessionId,
        question,
        answer: answer.trim(),
      });

      const evaluation = extractEvaluation(response);

      const evaluationRecord = {
        question,
        answer: answer.trim(),
        evaluation,
      };

      setEvaluations((previous) => [
        ...previous,
        evaluationRecord,
      ]);

      setCurrentEvaluation(evaluation);

      if (questionNumber >= TOTAL_QUESTIONS) {
        // Complete the real backend session.
        const completed = await completeInterviewTest(sessionId);

        setFinalResult({
          ...completed,
          evaluations: [
            ...evaluations,
            evaluationRecord,
          ],
        });

        setStage('result');
      } else {
        // Ask the backend for the next AI-generated question.
        const nextResponse = await startInterviewTest({
          session_id: sessionId,
          role,
          interview_type: interviewType,
          difficulty,
        });

        const nextQuestion = extractQuestion(nextResponse);

        if (!nextQuestion) {
          throw new Error(
            'Backend did not return the next interview question.'
          );
        }

        setQuestion(nextQuestion);
        setQuestionNumber((previous) => previous + 1);
        setAnswer('');
        setCurrentEvaluation(null);
      }
    } catch (err) {
      console.error('Interview answer error:', err);

      setError(
        err?.response?.data?.detail ||
          err?.message ||
          'Unable to submit your answer.'
      );
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setStage('setup');
    setSessionId('');
    setQuestion('');
    setAnswer('');
    setQuestionNumber(1);
    setEvaluations([]);
    setCurrentEvaluation(null);
    setFinalResult(null);
    setError('');
  }

  function renderSetup() {
    return (
      <div className="interview-card">
        <div className="interview-card-header">
          <div className="interview-icon">
            <MessageSquare size={24} />
          </div>

          <div>
            <h2>AI Interview Practice</h2>
            <p>
              Practice realistic interview questions and receive
              AI-powered feedback.
            </p>
          </div>
        </div>

        <div className="interview-form">
          <div className="form-group">
            <label>Target Role</label>

            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option>Data Analyst</option>
              <option>Data Scientist</option>
              <option>Software Engineer</option>
              <option>Machine Learning Engineer</option>
              <option>Business Analyst</option>
              <option>Product Analyst</option>
            </select>
          </div>

          <div className="form-group">
            <label>Interview Type</label>

            <select
              value={interviewType}
              onChange={(e) => setInterviewType(e.target.value)}
            >
              <option value="technical">Technical</option>
              <option value="hr">HR</option>
              <option value="behavioral">Behavioral</option>
            </select>
          </div>

          <div className="form-group">
            <label>Difficulty</label>

            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div className="form-group">
            <label>Interview Language</label>

            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="bn">Bengali</option>
              <option value="ta">Tamil</option>
              <option value="te">Telugu</option>
              <option value="mr">Marathi</option>
              <option value="kn">Kannada</option>
              <option value="ml">Malayalam</option>
              <option value="gu">Gujarati</option>
              <option value="pa">Punjabi</option>
              <option value="or">Odia</option>
            </select>
          </div>
        </div>

        <div className="interview-info">
          <Sparkles size={18} />

          <div>
            <strong>5-question AI assessment</strong>
            <span>
              Each answer is evaluated based on the selected
              interview type, role and difficulty.
            </span>
          </div>
        </div>

        <button
          className="primary-button interview-start-button"
          onClick={handleStart}
          disabled={loading}
        >
          {loading ? 'Starting Interview...' : 'Start Interview'}
        </button>
      </div>
    );
  }

  function renderQuestion() {
    const progress =
      (questionNumber / TOTAL_QUESTIONS) * 100;

    return (
      <div className="interview-card">
        <div className="question-top">
          <div>
            <span className="question-label">
              Question {questionNumber} of {TOTAL_QUESTIONS}
            </span>

            <h2>{role} Interview</h2>
          </div>

          <div className="question-badge">
            {interviewType}
          </div>
        </div>

        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="question-box">
          <Sparkles size={20} />

          <p>{question}</p>
        </div>

        <div className="answer-section">
          <label>Your Answer</label>

          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer here..."
            rows={9}
            disabled={loading}
          />
        </div>

        <div className="question-actions">
          <span>
            Language: {language.toUpperCase()}
          </span>

          <button
            className="primary-button"
            onClick={handleSubmit}
            disabled={loading || !answer.trim()}
          >
            {loading ? (
              'Evaluating...'
            ) : (
              <>
                Submit Answer
                <Send size={17} />
              </>
            )}
          </button>
        </div>

        {currentEvaluation && (
          <div className="evaluation-preview">
            <div className="evaluation-title">
              <CheckCircle2 size={19} />
              AI Evaluation
            </div>

            <p>
              {typeof currentEvaluation === 'string'
                ? currentEvaluation
                : JSON.stringify(
                    currentEvaluation,
                    null,
                    2
                  )}
            </p>
          </div>
        )}
      </div>
    );
  }

  function renderResult() {
    const score =
      finalResult?.final_score ??
      finalResult?.score ??
      null;

    const skillProgress =
      finalResult?.skill_progress ??
      finalResult?.skillProgress ??
      null;

    return (
      <div className="interview-card result-card">
        <div className="result-icon">
          <Trophy size={30} />
        </div>

        <span className="result-label">
          Interview Completed
        </span>

        <h1>
          {score !== null ? `${score}%` : 'Completed'}
        </h1>

        <p>
          Your interview session has been evaluated and
          recorded in your CareerForge AI progress.
        </p>

        <div className="result-grid">
          <div className="result-stat">
            <strong>{TOTAL_QUESTIONS}</strong>
            <span>Questions</span>
          </div>

          <div className="result-stat">
            <strong>{interviewType}</strong>
            <span>Assessment Type</span>
          </div>

          <div className="result-stat">
            <strong>{difficulty}</strong>
            <span>Difficulty</span>
          </div>
        </div>

        {skillProgress && (
          <div className="skill-update-box">
            <CheckCircle2 size={20} />

            <div>
              <strong>Skill Progress Updated</strong>

              <span>
                {skillProgress.skill ||
                  skillProgress.skill_name ||
                  'Technical Interview'}
                {' — '}
                {skillProgress.level ||
                  skillProgress.proficiency ||
                  'Updated'}
              </span>
            </div>
          </div>
        )}

        <button
          className="secondary-button"
          onClick={handleReset}
        >
          <RotateCcw size={17} />
          Take Another Interview
        </button>
      </div>
    );
  }

  return (
    <div className="interview-page">
      <div className="interview-hero">
        <div>
          <span className="eyebrow">
            CAREER ASSESSMENT
          </span>

          <h1>Interview Practice</h1>

          <p>
            Build confidence with AI-generated interview
            questions tailored to your career goals.
          </p>
        </div>
      </div>

      {error && (
        <div className="interview-error">
          {error}
        </div>
      )}

      {stage === 'setup' && renderSetup()}
      {stage === 'question' && renderQuestion()}
      {stage === 'result' && renderResult()}
    </div>
  );
}

export default InterviewTest;