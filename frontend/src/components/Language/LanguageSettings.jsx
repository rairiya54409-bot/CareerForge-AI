import { useEffect, useState } from 'react';
import {
  Check,
  Globe2,
  Loader2,
  Save,
  Sparkles,
} from 'lucide-react';

import {
  getLanguage,
  updateLanguage,
} from '../../services/languageService';

import './LanguageSettings.css';

const LANGUAGES = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
  },
  {
    code: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
  },
  {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
  },
  {
    code: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
  },
  {
    code: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
  },
  {
    code: 'kn',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
  },
  {
    code: 'ml',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
  },
  {
    code: 'gu',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
  },
  {
    code: 'pa',
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
  },
  {
    code: 'or',
    name: 'Odia',
    nativeName: 'ଓଡ଼ିଆ',
  },
];

function LanguageSettings() {
  const [selectedLanguage, setSelectedLanguage] =
    useState('en');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadLanguage();
  }, []);

  async function loadLanguage() {
    try {
      setLoading(true);
      setErrorMessage('');

      const data = await getLanguage();

      console.log(
        'LANGUAGE API RESPONSE:',
        JSON.stringify(data, null, 2)
      );

      let language = 'en';

      if (typeof data === 'string') {
        language = data;
      } else if (typeof data?.language === 'string') {
        language = data.language;
      }

      if (
        LANGUAGES.some(item => item.code === language)
      ) {
        setSelectedLanguage(language);
      }
    } catch (error) {
      console.error(
        'Language loading error:',
        error
      );

      const detail =
        error.response?.data?.detail;

      setErrorMessage(
        typeof detail === 'string'
          ? detail
          : 'Unable to load your language preference.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      setSaved(false);
      setErrorMessage('');

      const data = await updateLanguage(
        selectedLanguage
      );

      console.log(
        'LANGUAGE UPDATE RESPONSE:',
        JSON.stringify(data, null, 2)
      );

      setSaved(true);

      setTimeout(() => {
        setSaved(false);
      }, 2500);

    } catch (error) {
      console.error(
        'Language update error:',
        error
      );

      const detail =
        error.response?.data?.detail;

      setErrorMessage(
        typeof detail === 'string'
          ? detail
          : 'Unable to update your language preference.'
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="language-page page-container">

        <div className="language-loading">

          <Loader2
            size={28}
            className="language-spinner"
          />

          <p>
            Loading language settings...
          </p>

        </div>

      </div>
    );
  }

  return (
    <div className="language-page page-container">

      {/* HEADER */}

      <div className="language-header">

        <div>

          <div className="language-eyebrow">
            <Sparkles size={14} />
            Personalization
          </div>

          <h1>
            Language Settings
          </h1>

          <p>
            Choose the language you want CareerForge AI
            to use for your personalized career assistance.
          </p>

        </div>

        <div className="language-header-icon">
          <Globe2 size={24} />
        </div>

      </div>

      {/* ERROR */}

      {errorMessage && (
        <div className="language-error">
          {errorMessage}
        </div>
      )}

      {/* LANGUAGE CARD */}

      <section className="language-card">

        <div className="language-card-header">

          <div>

            <span>
              AI RESPONSE LANGUAGE
            </span>

            <h2>
              Select your preferred language
            </h2>

          </div>

          <Globe2 size={20} />

        </div>

        <div className="language-grid">

          {LANGUAGES.map(language => {

            const isSelected =
              selectedLanguage ===
              language.code;

            return (
              <button
                type="button"
                key={language.code}
                className={`language-option ${
                  isSelected
                    ? 'selected'
                    : ''
                }`}
                onClick={() => {
                  setSelectedLanguage(
                    language.code
                  );
                  setSaved(false);
                }}
              >

                <div className="language-option-left">

                  <div className="language-code">
                    {language.code.toUpperCase()}
                  </div>

                  <div className="language-name">

                    <strong>
                      {language.name}
                    </strong>

                    <span>
                      {language.nativeName}
                    </span>

                  </div>

                </div>

                {isSelected && (
                  <div className="language-check">
                    <Check size={16} />
                  </div>
                )}

              </button>
            );
          })}

        </div>

        <div className="language-card-footer">

          <div className="language-current">

            <span>
              Current language
            </span>

            <strong>
              {
                LANGUAGES.find(
                  item =>
                    item.code ===
                    selectedLanguage
                )?.name
              }
            </strong>

          </div>

          <button
            type="button"
            className="primary-button"
            onClick={handleSave}
            disabled={saving}
          >

            {saving ? (
              <>
                <Loader2
                  size={16}
                  className="language-spinner"
                />
                Saving...
              </>
            ) : saved ? (
              <>
                <Check size={16} />
                Saved
              </>
            ) : (
              <>
                <Save size={16} />
                Save Language
              </>
            )}

          </button>

        </div>

      </section>

      {/* INFORMATION */}

      <div className="language-info-grid">

        <div className="language-info-card">

          <div className="language-info-icon purple">
            <Globe2 size={18} />
          </div>

          <div>
            <strong>
              AI Copilot
            </strong>

            <p>
              CareerForge AI will use your selected
              language when responding to career questions.
            </p>
          </div>

        </div>

        <div className="language-info-card">

          <div className="language-info-icon yellow">
            <Sparkles size={18} />
          </div>

          <div>
            <strong>
              Voice Assistant
            </strong>

            <p>
              Your language preference will also be used
              when we connect the voice assistant.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}

export default LanguageSettings;