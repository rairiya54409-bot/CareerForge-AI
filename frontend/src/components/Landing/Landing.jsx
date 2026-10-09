import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  FileText,
  Route,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';

import './Landing.css';

function Landing() {
  return (
    <div className="landing">

      {/* Navigation */}

      <header className="landing-nav">
        <div className="landing-brand">
          <div className="landing-brand-mark">
            <Sparkles size={19} />
          </div>

          <div className="landing-brand-name">
            CareerForge <span>AI</span>
          </div>
        </div>

        <nav className="landing-nav-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <a href="#why-careerforge">Why CareerForge</a>
        </nav>

        <div className="landing-nav-actions">
          <button className="landing-login">
            Log in
          </button>

          <button className="landing-signup">
            Get Started
            <ArrowRight size={15} />
          </button>
        </div>
      </header>


      {/* Hero */}

      <main>

        <section className="hero">

          <div className="hero-content">

            <div className="hero-badge">
              <Sparkles size={14} />
              AI-powered career intelligence
            </div>

            <h1>
              Build the career
              <span> you're capable of.</span>
            </h1>

            <p className="hero-description">
              CareerForge AI analyzes your resume, identifies your
              skill gaps, recommends learning paths, finds relevant
              jobs, and helps you become interview-ready.
            </p>

            <div className="hero-actions">
              <button className="hero-primary-button">
                Get Started
                <ArrowRight size={17} />
              </button>

              <button className="hero-secondary-button">
                Explore CareerForge
              </button>
            </div>

            <div className="hero-trust">
              <CheckCircle2 size={15} />
              <span>
                One platform for your complete career journey
              </span>
            </div>

          </div>


          {/* Dashboard Preview */}

          <div className="hero-preview">

            <div className="preview-window">

              <div className="preview-topbar">

                <div className="preview-dots">
                  <span />
                  <span />
                  <span />
                </div>

                <div className="preview-title">
                  CareerForge AI
                </div>

                <div className="preview-user">
                  R
                </div>

              </div>


              <div className="preview-body">

                <div className="preview-sidebar">

                  <div className="preview-logo">
                    <Sparkles size={12} />
                  </div>

                  <div className="preview-nav active" />
                  <div className="preview-nav" />
                  <div className="preview-nav" />
                  <div className="preview-nav" />
                  <div className="preview-nav" />

                </div>


                <div className="preview-content">

                  <div className="preview-heading">
                    <div>
                      <small>CAREER DASHBOARD</small>
                      <h3>Good morning, Riya.</h3>
                    </div>

                    <div className="preview-upload">
                      Upload Resume
                    </div>
                  </div>


                  <div className="preview-stats">

                    <div className="preview-stat">
                      <span>Resume Score</span>
                      <strong>87</strong>
                      <small>Strong profile</small>
                    </div>

                    <div className="preview-stat yellow">
                      <span>Skill Progress</span>
                      <strong>72%</strong>
                      <small>+8% this month</small>
                    </div>

                    <div className="preview-stat">
                      <span>Job Matches</span>
                      <strong>14</strong>
                      <small>New opportunities</small>
                    </div>

                  </div>


                  <div className="preview-lower">

                    <div className="preview-chart">

                      <div className="preview-card-title">
                        Career Progress
                      </div>

                      <div className="fake-chart">
                        <div className="chart-line line-one" />
                        <div className="chart-line line-two" />
                        <div className="chart-line line-three" />
                      </div>

                    </div>


                    <div className="preview-insight">

                      <Sparkles size={15} />

                      <small>AI CAREER INSIGHT</small>

                      <strong>
                        Your profile is getting stronger.
                      </strong>

                      <p>
                        Focus on your remaining skill gaps
                        to unlock more opportunities.
                      </p>

                    </div>

                  </div>

                </div>

              </div>

            </div>

            <div className="preview-glow" />

          </div>

        </section>


        {/* Feature strip */}

        <section className="feature-strip" id="features">

          <div className="feature-strip-intro">
            <span>ONE PLATFORM</span>
            <strong>
              Everything you need to move forward.
            </strong>
          </div>

          <div className="feature-mini">
            <FileText size={19} />
            <div>
              <strong>Resume Intelligence</strong>
              <span>ATS & AI analysis</span>
            </div>
          </div>

          <div className="feature-mini">
            <Target size={19} />
            <div>
              <strong>Skill Intelligence</strong>
              <span>Find your gaps</span>
            </div>
          </div>

          <div className="feature-mini">
            <BriefcaseBusiness size={19} />
            <div>
              <strong>Job Matching</strong>
              <span>Find better opportunities</span>
            </div>
          </div>

        </section>


        {/* How it works */}

        <section className="how-section" id="how-it-works">

          <div className="section-heading">

            <span>HOW IT WORKS</span>

            <h2>
              From resume to
              <em> career momentum.</em>
            </h2>

            <p>
              CareerForge connects the different pieces of your
              career journey into one intelligent workflow.
            </p>

          </div>


          <div className="steps">

            <div className="step">

              <div className="step-number">01</div>

              <FileText size={22} />

              <h3>Understand your profile</h3>

              <p>
                Upload your resume and let AI analyze your
                experience, skills, strengths, and opportunities.
              </p>

            </div>


            <div className="step">

              <div className="step-number">02</div>

              <Target size={22} />

              <h3>Discover what to improve</h3>

              <p>
                Identify skill gaps and receive a personalized
                learning roadmap based on your career goals.
              </p>

            </div>


            <div className="step">

              <div className="step-number">03</div>

              <BriefcaseBusiness size={22} />

              <h3>Find the right opportunities</h3>

              <p>
                Discover relevant jobs ranked by how closely
                they match your skills and career interests.
              </p>

            </div>


            <div className="step">

              <div className="step-number">04</div>

              <TrendingUp size={22} />

              <h3>Become interview-ready</h3>

              <p>
                Practice interviews, coding, and aptitude tests
                while tracking your skill progression over time.
              </p>

            </div>

          </div>

        </section>


        {/* Why CareerForge */}

        <section className="why-section" id="why-careerforge">

          <div className="why-content">

            <span>BUILT FOR THE WHOLE JOURNEY</span>

            <h2>
              Don't just find a job.
              <br />
              <em>Build your career.</em>
            </h2>

            <p>
              Most career platforms solve one problem. CareerForge
              connects resume intelligence, learning, job discovery,
              applications, analytics, and interview preparation
              into one personalized experience.
            </p>

            <div className="why-points">

              <div>
                <CheckCircle2 size={17} />
                <span>Personalized recommendations</span>
              </div>

              <div>
                <CheckCircle2 size={17} />
                <span>AI-powered career guidance</span>
              </div>

              <div>
                <CheckCircle2 size={17} />
                <span>Continuous skill tracking</span>
              </div>

            </div>

            <button className="hero-primary-button">
              Start your journey
              <ArrowRight size={17} />
            </button>

          </div>


          <div className="why-visual">

            <div className="floating-card floating-card-one">
              <div className="floating-icon lavender">
                <BarChart3 size={18} />
              </div>

              <div>
                <span>Career Readiness</span>
                <strong>81%</strong>
              </div>
            </div>


            <div className="floating-card floating-card-two">

              <div className="floating-icon yellow">
                <Target size={18} />
              </div>

              <div>
                <span>Skill Progress</span>
                <strong>+18%</strong>
              </div>

            </div>


            <div className="floating-center">
              <Sparkles size={30} />
              <strong>CareerForge</strong>
              <span>AI Career Intelligence</span>
            </div>

          </div>

        </section>


        {/* Final CTA */}

        <section className="final-cta">

          <div className="final-cta-content">

            <Sparkles size={21} />

            <h2>
              Your next opportunity
              <br />
              starts with understanding where you are.
            </h2>

            <p>
              Let CareerForge help you figure out what's next.
            </p>

            <button className="hero-primary-button">
              Get Started
              <ArrowRight size={17} />
            </button>

          </div>

        </section>

      </main>


      {/* Footer */}

      <footer className="landing-footer">

        <div className="landing-brand">
          <div className="landing-brand-mark">
            <Sparkles size={16} />
          </div>

          <div className="landing-brand-name">
            CareerForge <span>AI</span>
          </div>
        </div>

        <span>
          AI-powered career intelligence.
        </span>

        <span>
          © 2026 CareerForge AI
        </span>

      </footer>

    </div>
  );
}

export default Landing;