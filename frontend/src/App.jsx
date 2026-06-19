import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Flame, Footprints, Bot, Utensils, 
  Activity, Award, User, RefreshCw, AlertCircle, Trophy, Sparkles
} from 'lucide-react';

import StreakTree from './components/StreakTree';
import Competitions from './components/Competitions';
import HelpGPT from './components/HelpGPT';
import MealPhoto from './components/MealPhoto';
import BMICalculator from './components/BMICalculator';
import StepsCalculator from './components/StepsCalculator';
import WeeklyReport from './components/WeeklyReport';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Dynamic user profile pairing
  const [username, setUsername] = useState(localStorage.getItem('helthee_username') || 'Alex');

  const fetchStats = async () => {
    try {
      setError(false);
      const res = await fetch(`http://localhost:8000/api/dashboard?username=${username}`);
      if (!res.ok) throw new Error("Backend connection issue");
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Failed to connect to backend api:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [refreshTrigger, username]);

  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleChangeUsername = () => {
    const newName = prompt("Enter your username to pair your phone and profile:", username);
    if (newName && newName.trim()) {
      const formatted = newName.trim();
      setUsername(formatted);
      localStorage.setItem('helthee_username', formatted);
      setLoading(true);
      triggerRefresh();
    }
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboardHub();
      case 'tree':
        return (
          <div className="focused-iframe-view">
            <div className="iframe-header">
              <span className="iframe-source">Source: Bloomify Habit Tracker</span>
              <a 
                href="https://kazim-45.github.io/bloomify-habit-tracker" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.7rem', padding: '0.35rem 0.75rem' }}
              >
                Open in New Tab ↗
              </a>
            </div>
            <iframe 
              src="https://kazim-45.github.io/bloomify-habit-tracker" 
              title="Bloomify Habit Tracker"
              className="module-iframe"
            />
          </div>
        );
      case 'steps':
        return (
          <div className="focused-module-view">
            <StepsCalculator stats={stats} onRefresh={triggerRefresh} username={username} />
          </div>
        );
      case 'competitions':
        return (
          <div className="focused-module-view">
            <Competitions stats={stats} onRefresh={triggerRefresh} username={username} />
          </div>
        );
      case 'chat':
        return (
          <div className="focused-iframe-view">
            <div className="iframe-header">
              <span className="iframe-source">Source: HelpGPT External App</span>
              <a 
                href="https://helpgpt-frontend.vercel.app/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.7rem', padding: '0.35rem 0.75rem' }}
              >
                Open in New Tab ↗
              </a>
            </div>
            <iframe 
              src="https://helpgpt-frontend.vercel.app/" 
              title="HelpGPT External App"
              className="module-iframe"
            />
          </div>
        );
      case 'meals':
        return (
          <div className="focused-module-view">
            <MealPhoto stats={stats} onRefresh={triggerRefresh} username={username} />
          </div>
        );
      case 'bmi':
        return (
          <div className="focused-module-view">
            <BMICalculator stats={stats} onRefresh={triggerRefresh} username={username} />
          </div>
        );
      case 'report':
        return (
          <div className="focused-module-view">
            <WeeklyReport stats={stats} refreshTrigger={refreshTrigger} username={username} />
          </div>
        );
      default:
        return renderDashboardHub();
    }
  };

  const renderDashboardHub = () => {
    const stepPercent = stats ? Math.min((stats.today_steps / stats.steps_goal) * 100, 100) : 0;
    const caloriePercent = stats ? Math.min((stats.today_calories / 2000) * 100, 100) : 0;

    return (
      <div className="dashboard-grid">
        {/* Streak Tree Summary Card */}
        <div className="glass-card hub-card cursor-pointer" onClick={() => setActiveTab('tree')}>
          <div className="hub-card-header">
            <Flame size={20} color="var(--accent-purple)" />
            <span className="hub-title">Streak Tree</span>
          </div>
          <div className="hub-value">{stats?.current_streak || 0} Days</div>
          <div className="hub-meta">Stage: <span className="text-gradient-purple font-bold">{stats?.tree_stage}</span></div>
          <div className="hub-tap-hint">Open Bloomify Habit Tracker →</div>
        </div>

        {/* Steps Tracker Summary Card */}
        <div className="glass-card hub-card cursor-pointer" onClick={() => setActiveTab('steps')}>
          <div className="hub-card-header">
            <Footprints size={20} color="var(--accent-cyan)" />
            <span className="hub-title">Steps Log</span>
          </div>
          <div className="hub-value">{stats?.today_steps?.toLocaleString() || 0}</div>
          <div className="hub-progress-bar">
            <div className="progress-fill" style={{ width: `${stepPercent}%`, background: 'var(--accent-cyan)' }} />
          </div>
          <div className="hub-meta">Goal: {stats?.steps_goal?.toLocaleString()} steps</div>
          <div className="hub-tap-hint">Open Calculator →</div>
        </div>

        {/* Meal Photo Summary Card */}
        <div className="glass-card hub-card cursor-pointer" onClick={() => setActiveTab('meals')}>
          <div className="hub-card-header">
            <Utensils size={20} color="var(--accent-emerald)" />
            <span className="hub-title">Meal Tracker</span>
          </div>
          <div className="hub-value">{stats?.today_calories || 0} <span className="unit">kcal</span></div>
          <div className="hub-progress-bar">
            <div className="progress-fill" style={{ width: `${caloriePercent}%`, background: 'var(--accent-emerald)' }} />
          </div>
          <div className="hub-meta">Protein: {stats?.today_macros?.protein?.toFixed(0)}g | Carbs: {stats?.today_macros?.carbs?.toFixed(0)}g</div>
          <div className="hub-tap-hint">Log Meal Photo →</div>
        </div>

        {/* BMI Profile Summary Card */}
        <div className="glass-card hub-card cursor-pointer" onClick={() => setActiveTab('bmi')}>
          <div className="hub-card-header">
            <Activity size={20} color="var(--accent-amber)" />
            <span className="hub-title">BMI Profile</span>
          </div>
          <div className="hub-value">
            {stats ? (stats.weight / ((stats.height/100) * (stats.height/100))).toFixed(1) : '22.9'}
          </div>
          <div className="hub-meta">Height: {stats?.height} cm | Weight: {stats?.weight} kg</div>
          <div className="hub-tap-hint">Adjust Metrics →</div>
        </div>

        {/* Competitions Standing Card */}
        <div className="glass-card hub-card cursor-pointer" onClick={() => setActiveTab('competitions')} style={{ gridColumn: 'span 6' }}>
          <div className="hub-card-header">
            <Trophy size={20} color="#ffd166" />
            <span className="hub-title">Active Challenges</span>
          </div>
          <div className="hub-text-detail">
            <h3>Summer Step Challenge</h3>
            <p>Compete with Sarah, Emma, and Michael on the leaderboard standings.</p>
          </div>
          <div className="hub-tap-hint" style={{ marginTop: 'auto' }}>View Leaderboards →</div>
        </div>

        {/* HelpGPT Prompt Box Card */}
        <div className="glass-card hub-card cursor-pointer" onClick={() => setActiveTab('chat')} style={{ gridColumn: 'span 6' }}>
          <div className="hub-card-header">
            <Bot size={20} color="var(--accent-cyan)" />
            <span className="hub-title">HelpGPT Coach</span>
          </div>
          <div className="hub-text-detail">
            <h3>Need Fitness Advice?</h3>
            <p>Chat with HelpGPT to get smart food recipes, workout plans, and health tips.</p>
          </div>
          <div className="hub-tap-hint" style={{ marginTop: 'auto' }}>Open HelpGPT External App →</div>
        </div>
      </div>
    );
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <Activity size={24} color="var(--accent-purple)" />
          <span>Helthee</span>
        </div>
        
        <ul className="sidebar-menu">
          <li 
            className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard Hub</span>
          </li>
          <li 
            className={`sidebar-item ${activeTab === 'tree' ? 'active' : ''}`}
            onClick={() => setActiveTab('tree')}
          >
            <Flame size={18} />
            <span>Streak Tree</span>
          </li>
          <li 
            className={`sidebar-item ${activeTab === 'steps' ? 'active' : ''}`}
            onClick={() => setActiveTab('steps')}
          >
            <Footprints size={18} />
            <span>Steps Calculator</span>
          </li>
          <li 
            className={`sidebar-item ${activeTab === 'meals' ? 'active' : ''}`}
            onClick={() => setActiveTab('meals')}
          >
            <Utensils size={18} />
            <span>Meal Photo Log</span>
          </li>
          <li 
            className={`sidebar-item ${activeTab === 'bmi' ? 'active' : ''}`}
            onClick={() => setActiveTab('bmi')}
          >
            <Activity size={18} />
            <span>BMI Calculator</span>
          </li>
          <li 
            className={`sidebar-item ${activeTab === 'competitions' ? 'active' : ''}`}
            onClick={() => setActiveTab('competitions')}
          >
            <Trophy size={18} />
            <span>Competitions</span>
          </li>
          <li 
            className={`sidebar-item ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            <Bot size={18} />
            <span>HelpGPT Coach</span>
          </li>
          <li 
            className={`sidebar-item ${activeTab === 'report' ? 'active' : ''}`}
            onClick={() => setActiveTab('report')}
          >
            <Award size={18} />
            <span>Weekly Insights</span>
          </li>
        </ul>

        {stats && (
          <div className="sidebar-profile cursor-pointer" onClick={handleChangeUsername} title="Click to change your username">
            <div className="profile-icon">
              <User size={16} />
            </div>
            <div className="profile-details">
              <div className="profile-name">{stats.username}</div>
              <div className="profile-meta">Link Device ⚙️</div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Panel Content */}
      <main className="main-content">
        <header className="dashboard-header">
          <div className="dashboard-title">
            <h1>
              {activeTab === 'dashboard' && 'Helthee Hub'}
              {activeTab === 'tree' && 'Streak Tree Habit Log'}
              {activeTab === 'steps' && 'Daily Steps Calculator'}
              {activeTab === 'meals' && 'Meal Photo Logger'}
              {activeTab === 'bmi' && 'Weight & Height BMI Gauges'}
              {activeTab === 'competitions' && 'Fitness Competitions Leaderboard'}
              {activeTab === 'chat' && 'HelpGPT Fitness Coach'}
              {activeTab === 'report' && 'Weekly Performance Insights'}
            </h1>
            <p>
              {activeTab === 'dashboard' && `Logged in as: ${username}. Select a module to manage habits.`}
              {activeTab === 'tree' && 'Build consistency, water your streak tree daily, and hit goals.'}
              {activeTab === 'steps' && 'Log steps, count calories burned, and check active metrics.'}
              {activeTab === 'meals' && 'Log calorie counts, estimate carbs/fat/protein ratios.'}
              {activeTab === 'bmi' && 'Check weight status index ranges and advice.'}
              {activeTab === 'competitions' && 'View local standings, step counts, and active brackets.'}
              {activeTab === 'chat' && 'Get health tips, menu suggestions, and exercise ideas.'}
              {activeTab === 'report' && 'Summary bar charts of steps activity and calorie intake.'}
            </p>
          </div>

          <div className="header-actions">
            {error && (
              <div className="error-toast">
                <AlertCircle size={16} />
                <span>Backend Offline. Run python server!</span>
              </div>
            )}
            
            <button className="btn btn-secondary" onClick={triggerRefresh} disabled={loading}>
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </header>

        {loading && !stats ? (
          <div className="loading-state">
            <RefreshCw size={36} className="animate-spin text-gradient-purple" />
            <span>Initializing Helthee parameters...</span>
          </div>
        ) : (
          renderActiveView()
        )}
      </main>

      <style>{`
        .header-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .error-toast {
          background: rgba(255, 90, 95, 0.1);
          border: 1px solid rgba(255, 90, 95, 0.25);
          color: #ff8e91;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 10px;
          font-size: 0.8rem;
          font-weight: 600;
        }
        .sidebar-profile {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          padding: 0.75rem 1rem;
          border-radius: 14px;
          margin-top: auto;
          transition: var(--transition-smooth);
        }
        .sidebar-profile:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.15);
        }
        .profile-icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(157, 78, 221, 0.15);
          color: var(--accent-purple);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .profile-name {
          font-size: 0.85rem;
          font-weight: 700;
        }
        .profile-meta {
          font-size: 0.7rem;
          color: var(--text-muted);
          font-weight: 600;
        }
        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 300px;
          gap: 1rem;
          font-size: 0.9rem;
          color: var(--text-secondary);
        }
        .focused-module-view {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          max-width: 1000px;
          animation: fadeIn 0.4s ease-out;
        }
        
        /* Iframe panel layout */
        .focused-iframe-view {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          width: 100%;
          height: calc(100vh - 200px);
          min-height: 550px;
          animation: fadeIn 0.4s ease-out;
        }
        .iframe-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-card);
          padding: 0.5rem 1rem;
          border-radius: 10px;
        }
        .iframe-source {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-secondary);
        }
        .module-iframe {
          flex-grow: 1;
          width: 100%;
          height: 100%;
          border: 1px solid var(--border-card);
          border-radius: 16px;
          background: #ffffff;
        }
        
        /* Hub Cards Grid */
        .hub-card {
          grid-column: span 3;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          padding: 1.5rem;
          border-radius: 18px;
        }
        .cursor-pointer {
          cursor: pointer;
        }
        .hub-card-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .hub-title {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .hub-value {
          font-family: var(--font-display);
          font-size: 1.6rem;
          font-weight: 800;
        }
        .hub-value .unit {
          font-size: 0.8rem;
          font-weight: 500;
          color: var(--text-secondary);
        }
        .hub-progress-bar {
          height: 4px;
          background: rgba(255,255,255,0.05);
          border-radius: 10px;
          overflow: hidden;
        }
        .hub-progress-bar .progress-fill {
          height: 100%;
        }
        .hub-meta {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 600;
        }
        .hub-tap-hint {
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--text-muted);
          margin-top: 0.25rem;
          transition: var(--transition-smooth);
        }
        .hub-card:hover .hub-tap-hint {
          color: var(--text-primary);
          transform: translateX(3px);
        }
        
        .hub-text-detail h3 {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 0.25rem;
        }
        .hub-text-detail p {
          font-size: 0.8rem;
          color: var(--text-secondary);
          line-height: 1.4;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
