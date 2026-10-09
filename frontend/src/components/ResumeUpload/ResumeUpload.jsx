import { useRef, useState } from 'react';
import {
  CheckCircle2,
  FileText,
  Loader2,
  Upload,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';
import { uploadResume } from '../../services/resumeService';

import './ResumeUpload.css';

function ResumeUpload() {
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const { user } = useAuth();

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  function validateFile(file) {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];

    if (!allowedTypes.includes(file.type)) {
      setErrorMessage(
        'Please upload a PDF, DOC, or DOCX file.'
      );

      return false;
    }

    return true;
  }

  function handleFileSelect(event) {
    const file = event.target.files?.[0];

    setSuccessMessage('');
    setErrorMessage('');

    if (!file) {
      return;
    }

    if (!validateFile(file)) {
      event.target.value = '';
      return;
    }

    setSelectedFile(file);
  }

  function handleDrop(event) {
    event.preventDefault();

    const file = event.dataTransfer.files?.[0];

    setSuccessMessage('');
    setErrorMessage('');

    if (!file) {
      return;
    }

    if (!validateFile(file)) {
      return;
    }

    setSelectedFile(file);
  }

  function removeFile() {
    setSelectedFile(null);
    setSuccessMessage('');
    setErrorMessage('');

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  async function handleUpload() {
    if (!selectedFile) {
      setErrorMessage('Please select a resume first.');
      return;
    }

    if (!user?.id) {
      setErrorMessage(
        'User session not found. Please log in again.'
      );
      return;
    }

    setUploading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      /*
       * Upload resume.
       *
       * The backend already:
       * 1. Receives the file
       * 2. Extracts the resume text
       * 3. Runs AI analysis
       * 4. Saves the analysis
       * 5. Returns analysis_id + analysis
       */
      const uploadResult = await uploadResume(selectedFile);

      console.log(
        'FULL RESUME UPLOAD RESPONSE:',
        JSON.stringify(uploadResult, null, 2)
      );

      /*
       * Get analysis ID from backend.
       */
      const analysisId = uploadResult?.analysis_id;

      if (!analysisId) {
        throw new Error(
          'Analysis ID was not returned by the server.'
        );
      }

      /*
       * Get the already-generated AI analysis.
       */
      const analysisData = uploadResult?.analysis;

      if (!analysisData) {
        throw new Error(
          'Resume analysis data was not returned by the server.'
        );
      }

      console.log(
        'RESUME ANALYSIS DATA:',
        JSON.stringify(analysisData, null, 2)
      );

      setSuccessMessage(
        'Resume uploaded and analyzed successfully.'
      );

      /*
       * Navigate to the analysis page.
       *
       * The complete analysis object is passed through
       * React Router state so the analysis page does not
       * have to make another request immediately.
       */

      localStorage.setItem('careerforge_analysis_id', analysisId);
localStorage.setItem(
  'careerforge_analysis',
  JSON.stringify(analysisData)
);
      navigate(`/resume-analysis/${analysisId}`, {
        state: {
          analysis: analysisData,
        },
      });

    } catch (error) {
      console.error(
        'Resume processing error:',
        error
      );

      const detail =
        error.response?.data?.detail;

      let message =
        'Resume processing failed. Please try again.';

      if (typeof detail === 'string') {
        message = detail;
      } else if (Array.isArray(detail)) {
        message = detail
          .map(
            (item) =>
              item?.msg || 'Invalid request'
          )
          .join(', ');
      } else if (error.message) {
        message = error.message;
      }

      setErrorMessage(message);

    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="resume-page page-container">

      {/* HEADER */}

      <div className="resume-header">

        <div>

          <div className="resume-eyebrow">
            <FileText size={14} />
            Resume intelligence
          </div>

          <h1>
            Build a stronger resume.
          </h1>

          <p>
            Upload your resume and let CareerForge AI
            analyze your profile, skills, and career readiness.
          </p>

        </div>

      </div>

      {/* UPLOAD CARD */}

      <section className="resume-upload-card">

        <div
          className={`resume-dropzone ${
            selectedFile ? 'has-file' : ''
          }`}
          onDragOver={(event) =>
            event.preventDefault()
          }
          onDrop={handleDrop}
          onClick={() =>
            !selectedFile &&
            fileInputRef.current?.click()
          }
        >

          {!selectedFile ? (

            <>
              <div className="resume-upload-icon">
                <Upload size={24} />
              </div>

              <h2>
                Upload your resume
              </h2>

              <p>
                Drag and drop your resume here, or click
                to browse your files.
              </p>

              <span className="resume-file-types">
                PDF, DOC, or DOCX
              </span>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileSelect}
                hidden
              />
            </>

          ) : (

            <div className="selected-file">

              <div className="selected-file-icon">
                <FileText size={22} />
              </div>

              <div className="selected-file-info">

                <strong>
                  {selectedFile.name}
                </strong>

                <span>
                  {(
                    selectedFile.size /
                    1024 /
                    1024
                  ).toFixed(2)}{' '}
                  MB
                </span>

              </div>

              <button
                type="button"
                className="remove-file-button"
                onClick={(event) => {
                  event.stopPropagation();
                  removeFile();
                }}
                aria-label="Remove selected file"
              >
                <X size={18} />
              </button>

            </div>

          )}

        </div>

        {/* UPLOAD BUTTON */}

        {selectedFile && (

          <button
            type="button"
            className="primary-button resume-upload-button"
            onClick={handleUpload}
            disabled={uploading}
          >

            {uploading ? (

              <>
                <Loader2
                  size={17}
                  className="resume-spinner"
                />

                Analyzing Resume...
              </>

            ) : (

              <>
                <Upload size={17} />

                Upload & Analyze Resume
              </>

            )}

          </button>

        )}

        {/* SUCCESS MESSAGE */}

        {successMessage && (

          <div className="resume-message success">

            <CheckCircle2 size={17} />

            <span>
              {successMessage}
            </span>

          </div>

        )}

        {/* ERROR MESSAGE */}

        {errorMessage && (

          <div className="resume-message error">

            <X size={17} />

            <span>
              {errorMessage}
            </span>

          </div>

        )}

      </section>

      {/* PROCESS INFORMATION */}

      <div className="resume-info-grid">

        <div className="resume-info-card">

          <div className="resume-info-number">
            01
          </div>

          <div>

            <strong>
              Upload
            </strong>

            <p>
              Add your latest resume in PDF or Word format.
            </p>

          </div>

        </div>

        <div className="resume-info-card">

          <div className="resume-info-number">
            02
          </div>

          <div>

            <strong>
              Analyze
            </strong>

            <p>
              CareerForge AI extracts your experience,
              skills, education, and profile signals.
            </p>

          </div>

        </div>

        <div className="resume-info-card">

          <div className="resume-info-number">
            03
          </div>

          <div>

            <strong>
              Improve
            </strong>

            <p>
              Discover gaps and opportunities to strengthen
              your career profile.
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}

export default ResumeUpload;