import { useEffect, useRef, useState } from 'react';
import {
  Loader2,
  Mic,
  Square,
  Volume2,
  X,
} from 'lucide-react';

import {
  voiceAssistant,
  getAudioUrl,
} from '../../services/voiceService';

import './VoiceRecorder.css';

function VoiceRecorder() {
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);

  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [transcription, setTranscription] =
    useState('');

  const [response, setResponse] =
    useState('');

  const [audioUrl, setAudioUrl] =
    useState('');

  const [errorMessage, setErrorMessage] =
    useState('');

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  async function startRecording() {
    try {
      setErrorMessage('');
      setTranscription('');
      setResponse('');
      setAudioUrl('');

      if (!navigator.mediaDevices?.getUserMedia) {
        setErrorMessage(
          'Microphone access is not supported by this browser.'
        );
        return;
      }

      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

      const mediaRecorder =
        new MediaRecorder(stream);

      mediaRecorderRef.current =
        mediaRecorder;

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(
            event.data
          );
        }
      };

      mediaRecorder.onstop = async () => {
        stream
          .getTracks()
          .forEach(track => track.stop());

        const audioBlob = new Blob(
          audioChunksRef.current,
          {
            type: 'audio/webm',
          }
        );

        await processVoice(audioBlob);
      };

      mediaRecorder.start();

      setRecording(true);

    } catch (error) {
      console.error(
        'Microphone error:',
        error
      );

      setErrorMessage(
        'Microphone permission was denied or could not be accessed.'
      );
    }
  }

  function stopRecording() {
    const recorder =
      mediaRecorderRef.current;

    if (
      recorder &&
      recorder.state !== 'inactive'
    ) {
      recorder.stop();
    }

    setRecording(false);
  }

  async function processVoice(audioBlob) {
    try {
      setProcessing(true);
      setErrorMessage('');

      const data =
        await voiceAssistant(audioBlob);

      console.log(
        'VOICE ASSISTANT RESPONSE:',
        JSON.stringify(data, null, 2)
      );

      setTranscription(
        data?.transcription ||
        data?.text ||
        ''
      );

      setResponse(
        data?.response || ''
      );

      if (data?.audio_url) {
        const url =
          getAudioUrl(data.audio_url);

        setAudioUrl(url);

        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.play().catch(
              error => {
                console.warn(
                  'Audio autoplay blocked:',
                  error
                );
              }
            );
          }
        }, 100);
      }

    } catch (error) {
      console.error(
        'Voice assistant error:',
        error
      );

      const detail =
        error.response?.data?.detail;

      setErrorMessage(
        typeof detail === 'string'
          ? detail
          : 'Voice assistant failed. Please try again.'
      );
    } finally {
      setProcessing(false);
    }
  }

  function clearVoice() {
    setTranscription('');
    setResponse('');
    setAudioUrl('');
    setErrorMessage('');

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }

  return (
    <div className="voice-recorder">

      <div className="voice-recorder-header">

        <div>
          <div className="voice-recorder-eyebrow">
            <Volume2 size={14} />
            Voice Assistant
          </div>

          <h3>
            Talk to CareerForge AI
          </h3>

          <p>
            Ask a career question using your voice.
          </p>
        </div>

        {(transcription ||
          response ||
          errorMessage) && (
          <button
            type="button"
            className="voice-clear-button"
            onClick={clearVoice}
            aria-label="Clear voice response"
          >
            <X size={16} />
          </button>
        )}

      </div>

      <div className="voice-controls">

        <button
          type="button"
          className={`voice-mic-button ${
            recording ? 'recording' : ''
          }`}
          onClick={
            recording
              ? stopRecording
              : startRecording
          }
          disabled={processing}
          aria-label={
            recording
              ? 'Stop recording'
              : 'Start recording'
          }
        >

          {processing ? (
            <Loader2
              size={25}
              className="voice-spin"
            />
          ) : recording ? (
            <Square size={23} />
          ) : (
            <Mic size={25} />
          )}

        </button>

        <div className="voice-status">

          {processing ? (
            <>
              <strong>
                CareerForge AI is thinking...
              </strong>

              <span>
                Processing your voice
              </span>
            </>
          ) : recording ? (
            <>
              <strong>
                Listening...
              </strong>

              <span>
                Tap the button when you're finished
              </span>
            </>
          ) : (
            <>
              <strong>
                Tap to speak
              </strong>

              <span>
                Ask anything about your career
              </span>
            </>
          )}

        </div>

      </div>

      {transcription && (
        <div className="voice-result">

          <span className="voice-result-label">
            YOU SAID
          </span>

          <p>
            {transcription}
          </p>

        </div>
      )}

      {response && (
        <div className="voice-result assistant">

          <span className="voice-result-label">
            CAREERFORGE AI
          </span>

          <p>
            {response}
          </p>

          {audioUrl && (
            <>
              <audio
                ref={audioRef}
                src={audioUrl}
                controls
                className="voice-audio"
              />

              <div className="voice-audio-label">
                <Volume2 size={14} />
                Voice response ready
              </div>
            </>
          )}

        </div>
      )}

      {errorMessage && (
        <div className="voice-error">
          {errorMessage}
        </div>
      )}

    </div>
  );
}

export default VoiceRecorder;