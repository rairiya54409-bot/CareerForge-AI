import {
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  ClipboardCheck,
  FileText,
  GraduationCap,
  LayoutDashboard,
  MessageCircle,
  Route,
  Settings,
  Sparkles,
  Target,
  TrendingUp,
  UserRound,
} from 'lucide-react';

import { useLocation, useNavigate } from 'react-router-dom';

import './Layout.css';


const navigation = [
  {
    section: 'Overview',
    items: [
      {
        label: 'Dashboard',
        icon: LayoutDashboard,
        path: '/dashboard',
      },
      {
        label: 'Resume',
        icon: FileText,
        path: '/resume',
      },
      {
        label: 'Skill Gap',
        icon: Target,
        path: '/skill-gap',
      },
    ],
  },
  {
    section: 'Career Growth',
    items: [
      {
        label: 'Courses',
        icon: BookOpen,
        path: '/courses',
      },
      {
        label: 'Roadmap',
        icon: Route,
        path: '/roadmap',
      },
      {
        label: 'Skill Progress',
        icon: TrendingUp,
        path: '/skill-progress',
      },
    ],
  },
  {
    section: 'Opportunities',
    items: [
      {
        label: 'Jobs',
        icon: BriefcaseBusiness,
        path: '/jobs',
      },
      {
        label: 'Applications',
        icon: ClipboardCheck,
        path: '/applications',
      },
    ],
  },
  {
    section: 'Intelligence',
    items: [
      {
        label: 'Analytics',
        icon: BarChart3,
        path: '/analytics',
      },
      {
        label: 'AI Copilot',
        icon: Sparkles,
        path: '/copilot',
      },
      {
        label: 'Tests',
        icon: GraduationCap,
        path: '/tests',
      },
    ],
  },
];


function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  function handleNavigation(path) {
    navigate(path);
  }

  function handleLogout() {
    localStorage.removeItem('careerforge_token');
    localStorage.removeItem('careerforge_user');

    navigate('/login', { replace: true });
  }

  const currentUser = (() => {
    try {
      return JSON.parse(
        localStorage.getItem('careerforge_user')
      );
    } catch {
      return null;
    }
  })();

  return (
    <div className="layout">

      {/* Sidebar */}

      <aside className="sidebar">

        {/* Brand */}

        <div className="brand">

          <div className="brand-mark">
            <Sparkles
              size={19}
              strokeWidth={2.5}
            />
          </div>

          <div>
            <div className="brand-name">
              CareerForge
            </div>

            <div className="brand-ai">
              AI
            </div>
          </div>

        </div>


        {/* Navigation */}

        <nav className="navigation">

          {navigation.map((group) => (

            <div
              className="nav-group"
              key={group.section}
            >

              <div className="nav-section-title">
                {group.section}
              </div>


              {group.items.map((item) => {

                const Icon = item.icon;

                const isActive =
                  location.pathname === item.path;

                return (
                  <button
                    className={`nav-item ${
                      isActive ? 'active' : ''
                    }`}
                    key={item.label}
                    onClick={() =>
                      handleNavigation(item.path)
                    }
                  >

                    <Icon
                      size={18}
                      strokeWidth={2}
                    />

                    <span>
                      {item.label}
                    </span>

                  </button>
                );

              })}

            </div>

          ))}

        </nav>


        {/* Sidebar bottom */}

        <div className="sidebar-bottom">

          <button
            className={`nav-item ${
              location.pathname === '/settings'
                ? 'active'
                : ''
            }`}
            onClick={() =>
              handleNavigation('/settings')
            }
          >

            <Settings size={18} />

            <span>
              Settings
            </span>

          </button>


          <button
            className="sidebar-profile"
            onClick={() =>
              handleNavigation('/settings')
            }
          >

            <div className="profile-avatar">
              <UserRound size={18} />
            </div>


            <div className="profile-info">

              <strong>
                {currentUser?.name || 'Your Profile'}
              </strong>

              <span>
                Career Explorer
              </span>

            </div>

          </button>


          <button
            className="nav-item"
            onClick={handleLogout}
          >

            <MessageCircle size={18} />

            <span>
              Log out
            </span>

          </button>

        </div>

      </aside>


      {/* Main area */}

      <main className="main-area">

        <header className="topbar">

          <div className="topbar-title">
            <span>
              Career Dashboard
            </span>
          </div>


          <div className="topbar-actions">

            <button
              className="icon-button"
              title="AI Copilot"
              onClick={() =>
                handleNavigation('/copilot')
              }
            >
              <Sparkles size={19} />
            </button>


            <button
              className="topbar-avatar"
              title="Profile"
              onClick={() =>
                handleNavigation('/settings')
              }
            >
              <UserRound size={17} />
            </button>

          </div>

        </header>


        <section className="content-area">
          {children}
        </section>

      </main>

    </div>
  );
}


export default Layout;