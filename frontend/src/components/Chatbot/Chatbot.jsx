import { useEffect, useRef, useState } from 'react';
import {
  Bot,
  Check,
  Loader2,
  Mic,
  Send,
  Square,
  Sparkles,
  Trash2,
  Volume2,
  X,
} from 'lucide-react';

import { sendChatMessage } from '../../services/chatService';
import {
  voiceAssistant,
  getAudioUrl,
} from '../../services/voiceService';

import './Chatbot.css';

const suggestions = [
  'How can I improve my resume?',
  'What skills should I learn for a data analyst role?',
  'Help me prepare for an interview.',
  'What jobs match my current skills?',
];

function renderMessageText(text) {
  if (!text) return null;

  const parts = text.split(/(\*\*.*?\*\*)/g);

  return parts.map((part, index) => {
    if (
      part.startsWith('**') &&
      part.endsWith('**')
    ) {
      return (
        <strong key={index}>
          {part.slice(2, -2)}
        </strong>
      );
    }

    return (
      <span key={index}>
        {part}
      </span>
    );
  });
}

function Chatbot() {
  const messagesEndRef = useRef(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content:
        "Hi! I'm CareerForge AI, your personal career copilot. Ask me anything about your resume, skills, jobs, interviews, or career path.",
      language: 'English',
    },
  ]);

  const [input, setInput] = useState('');

  const [sending, setSending] =
    useState(false);

  const [recording, setRecording] =
    useState(false);

  const [voiceProcessing, setVoiceProcessing] =
    useState(false);

  const [voiceAudioUrl, setVoiceAudioUrl] =
    useState('');

  const [errorMessage, setErrorMessage] =
    useState('');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  }, [messages, sending, voiceProcessing]);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current) {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // Recorder already stopped.
        }
      }

      if (voiceAudioUrl) {
        URL.revokeObjectURL(voiceAudioUrl);
      }
    };
  }, [voiceAudioUrl]);

  async function handleSend(messageText = input) {
    const message = messageText.trim();

    if (!message || sending || voiceProcessing) {
      return;
    }

    setErrorMessage('');
    setInput('');

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: message,
    };

    setMessages(prev => [
      ...prev,
      userMessage,
    ]);

    setSending(true);

    try {
      const data =
        await sendChatMessage(message);

      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content:
          data?.response ||
          'I could not generate a response right now.',
        language:
          data?.language_name ||
          'English',
      };

      setMessages(prev => [
        ...prev,
        assistantMessage,
      ]);

    } catch (error) {
      console.error(
        'Chatbot error:',
        error
      );

      const detail =
        error.response?.data?.detail;

      setErrorMessage(
        typeof detail === 'string'
          ? detail
          : 'Unable to connect to CareerForge AI. Please try again.'
      );

    } finally {
      setSending(false);
    }
  }

  async function startVoiceRecording() {
    try {
      setErrorMessage('');

      if (
        !navigator.mediaDevices?.getUserMedia
      ) {
        setErrorMessage(
          'Microphone access is not supported by this browser.'
        );
        return;
      }

      const stream =
        await navigator.mediaDevices.getUserMedia(
          { audio: true }
        );

      const recorder =
        new MediaRecorder(stream);

      mediaRecorderRef.current =
        recorder;

      audioChunksRef.current = [];

      recorder.ondataavailable = event => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(
            event.data
          );
        }
      };

      recorder.onstop = async () => {
        stream
          .getTracks()
          .forEach(track =>
            track.stop()
          );

        const audioBlob = new Blob(
          audioChunksRef.current,
          {
            type: 'audio/webm',
          }
        );

        await processVoice(audioBlob);
      };

      recorder.start();

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

  function stopVoiceRecording() {
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
      setVoiceProcessing(true);
      setErrorMessage('');

      const data =
        await voiceAssistant(audioBlob);

      console.log(
        'COPILOT VOICE RESPONSE:',
        JSON.stringify(data, null, 2)
      );

      const transcription =
        data?.transcription ||
        data?.text ||
        '';

      const aiResponse =
        data?.response ||
        'I could not generate a response right now.';

      if (transcription) {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now(),
            role: 'user',
            content: transcription,
            voice: true,
          },
        ]);
      }

      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          content: aiResponse,
          language:
            data?.language_name ||
            'English',
          voice: true,
        },
      ]);

      if (data?.audio_url) {
        const url =
          getAudioUrl(data.audio_url);

        setVoiceAudioUrl(url);

        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current
              .play()
              .catch(error => {
                console.warn(
                  'Autoplay blocked:',
                  error
                );
              });
          }
        }, 150);
      }

    } catch (error) {
      console.error(
        'Voice Copilot error:',
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
      setVoiceProcessing(false);
    }
  }

  function handleSuggestion(suggestion) {
    handleSend(suggestion);
  }

  function clearChat() {
    setMessages([
      {
        id: Date.now(),
        role: 'assistant',
        content:
          "Hi! I'm CareerForge AI, your personal career copilot. Ask me anything about your resume, skills, jobs, interviews, or career path.",
        language: 'English',
      },
    ]);

    setInput('');
    setErrorMessage('');

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    if (voiceAudioUrl) {
      URL.revokeObjectURL(voiceAudioUrl);
      setVoiceAudioUrl('');
    }
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="copilot-page page-container">

      {/* HEADER */}

      <div className="copilot-header">

        <div>

          <div className="copilot-eyebrow">
            <Sparkles size={14} />
            AI Career Intelligence
          </div>

          <h1>
            AI Career Copilot
          </h1>

          <p>
            Your personalized AI assistant for
            resumes, skills, jobs, interviews,
            and career planning.
          </p>

        </div>

        <button
          type="button"
          className="copilot-clear-button"
          onClick={clearChat}
          title="Clear conversation"
        >
          <Trash2 size={16} />
          Clear
        </button>

      </div>

      {/* CHAT CARD */}

      <section className="copilot-card">

        {/* CHAT HEADER */}

        <div className="copilot-card-header">

          <div className="copilot-agent">

            <div className="copilot-agent-icon">
              <Bot size={20} />
            </div>

            <div>

              <strong>
                CareerForge AI
              </strong>

              <span>
                <span className="copilot-online-dot" />
                Online
              </span>

            </div>

          </div>

          <div className="copilot-header-badge">
            <Sparkles size={13} />
            AI Powered
          </div>

        </div>

        {/* MESSAGES */}

        <div className="copilot-messages">

          {messages.map(message => (

            <div
              key={message.id}
              className={`copilot-message-row ${
                message.role === 'user'
                  ? 'user'
                  : 'assistant'
              }`}
            >

              {message.role ===
                'assistant' && (
                <div className="copilot-message-avatar">
                  <Bot size={15} />
                </div>
              )}

              <div
                className={`copilot-message ${
                  message.role === 'user'
                    ? 'user'
                    : 'assistant'
                }`}
              >

                <div className="copilot-message-text">
                  {renderMessageText(
                    message.content
                  )}
                </div>

                {message.language && (
                  <div className="copilot-language-label">
                    {message.voice && (
                      <Volume2 size={11} />
                    )}

                    {message.language}
                  </div>
                )}

              </div>

            </div>

          ))}

          {sending && (
            <div className="copilot-message-row assistant">

              <div className="copilot-message-avatar">
                <Bot size={15} />
              </div>

              <div className="copilot-message assistant typing">

                <span />
                <span />
                <span />

              </div>

            </div>
          )}

          {voiceProcessing && (
            <div className="copilot-message-row assistant">

              <div className="copilot-message-avatar">
                <Bot size={15} />
              </div>

              <div className="copilot-voice-processing">

                <Loader2
                  size={14}
                  className="copilot-spinner"
                />

                <span>
                  Processing your voice...
                </span>

              </div>

            </div>
          )}

          <div ref={messagesEndRef} />

        </div>

        {/* SUGGESTIONS */}

        {messages.length === 1 && (
          <div className="copilot-suggestions">

            <span>
              Try asking
            </span>

            <div>

              {suggestions.map(
                suggestion => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() =>
                      handleSuggestion(
                        suggestion
                      )
                    }
                    disabled={
                      sending ||
                      voiceProcessing
                    }
                  >
                    {suggestion}
                  </button>
                )
              )}

            </div>

          </div>
        )}

        {/* ERROR */}

        {errorMessage && (
          <div className="copilot-error">

            <X size={15} />

            <span>
              {errorMessage}
            </span>

          </div>
        )}

        {/* INPUT */}

        <div className="copilot-input-area">

          <div
            className={`copilot-input-wrapper ${
              recording
                ? 'recording'
                : ''
            }`}
          >

            <textarea
              value={input}
              onChange={event =>
                setInput(
                  event.target.value
                )
              }
              onKeyDown={handleKeyDown}
              placeholder={
                recording
                  ? 'Listening...'
                  : 'Ask CareerForge AI anything...'
              }
              rows={1}
              disabled={
                recording ||
                sending ||
                voiceProcessing
              }
            />

            {/* MICROPHONE */}

            <button
              type="button"
              className={`copilot-mic-button ${
                recording
                  ? 'recording'
                  : ''
              }`}
              onClick={
                recording
                  ? stopVoiceRecording
                  : startVoiceRecording
              }
              disabled={
                sending ||
                voiceProcessing
              }
              title={
                recording
                  ? 'Stop recording'
                  : 'Speak to CareerForge AI'
              }
            >

              {recording ? (
                <Square size={17} />
              ) : (
                <Mic size={18} />
              )}

            </button>

            {/* SEND */}

            <button
              type="button"
              className="copilot-send-button"
              onClick={() =>
                handleSend()
              }
              disabled={
                !input.trim() ||
                sending ||
                recording ||
                voiceProcessing
              }
              title="Send message"
            >

              {sending ? (
                <Loader2
                  size={17}
                  className="copilot-spinner"
                />
              ) : (
                <Send size={17} />
              )}

            </button>

          </div>

          <div className="copilot-input-hint">

            <span>
              Press Enter to send
            </span>

            <span>
              <Mic size={11} />
              Tap the microphone to speak
            </span>

          </div>

        </div>

      </section>

      {/* VOICE PLAYER */}

      {voiceAudioUrl && (
        <div className="copilot-audio-card">

          <div className="copilot-audio-icon">
            <Volume2 size={18} />
          </div>

          <div className="copilot-audio-info">

            <strong>
              Voice response
            </strong>

            <span>
              CareerForge AI responded using
              your selected language.
            </span>

          </div>

          <audio
            ref={audioRef}
            src={voiceAudioUrl}
            controls
          />

          <button
            type="button"
            className="copilot-audio-close"
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.pause();
              }

              URL.revokeObjectURL(
                voiceAudioUrl
              );

              setVoiceAudioUrl('');
            }}
          >
            <X size={15} />
          </button>

        </div>
      )}

      {/* FOOTER */}

      <div className="copilot-footer">

        <div>
          <Check size={13} />
          Personalized to your career profile
        </div>

        <div>
          <Check size={13} />
          Multilingual AI
        </div>

        <div>
          <Check size={13} />
          Voice enabled
        </div>

      </div>

    </div>
  );
}

export default Chatbot;