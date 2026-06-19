import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Flame, Footprints, Bot, Utensils, 
  Activity, Award, User, RefreshCw, AlertCircle, Trophy, Sparkles, Settings, Droplet
} from 'lucide-react';

import StreakTree from './components/StreakTree';
import Competitions from './components/Competitions';
import HelpGPT from './components/HelpGPT';
import MealPhoto from './components/MealPhoto';
import BMICalculator from './components/BMICalculator';
import StepsCalculator from './components/StepsCalculator';
import WeeklyReport from './components/WeeklyReport';
import Account from './components/Account';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Dynamic user profile pairing
  const [username, setUsername] = useState(localStorage.getItem('helthee_username') || 'Alex');

  const [mealViewMode, setMealViewMode] = useState(() => {
    return localStorage.getItem('helthee_meal_view') || 'pixcalo';
  });

  const handleMealViewChange = (mode) => {
    setMealViewMode(mode);
    localStorage.setItem('helthee_meal_view', mode);
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const [waterCups, setWaterCups] = useState(() => {
    const key = `helthee_water_${username}_${todayStr}`;
    return parseInt(localStorage.getItem(key) || '0', 10);
  });

  useEffect(() => {
    const key = `helthee_water_${username}_${todayStr}`;
    setWaterCups(parseInt(localStorage.getItem(key) || '0', 10));
  }, [username]);

  const handleWaterClick = (count) => {
    const key = `helthee_water_${username}_${todayStr}`;
    const newCount = waterCups === count ? count - 1 : count;
    setWaterCups(newCount);
    localStorage.setItem(key, newCount.toString());
  };

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

  // Cross-origin single sign-on message broadcaster
  const handleIframeLoad = (e) => {
    try {
      const iframeWindow = e.target.contentWindow;
      // Post authentication context payload
      iframeWindow.postMessage({
        type: 'HELTHEE_LOGIN',
        username: username,
        source: 'helthee-dashboard'
      }, '*');
    } catch (err) {
      console.warn("Iframe cross-origin postMessage warning (safe to ignore):", err);
    }
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboardHub();
      case 'tree':
        return (
          <div className="focused-iframe-view">
            <div className="iframe-top-bar">
              <div className="iframe-title-meta">
                <Flame size={14} color="var(--accent-purple)" />
                <span className="iframe-title-text">Bloomify Habit Tracker</span>
              </div>
              <a 
                href={`https://kazim-45.github.io/bloomify-habit-tracker?username=${username}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="iframe-link-btn"
                style={{ fontSize: '0.7rem', padding: '0.35rem 0.75rem' }}
              >
                Open in New Tab ↗
              </a>
            </div>
            <div className="iframe-wrapper">
              <iframe 
                src={`https://kazim-45.github.io/bloomify-habit-tracker?username=${username}`}
                title="Bloomify Habit Tracker"
                className="module-iframe clip-bloomify"
                onLoad={handleIframeLoad}
              />
            </div>
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
          <div className="focused-iframe-view">
            <div className="iframe-top-bar">
              <div className="iframe-title-meta">
                <Trophy size={14} color="var(--accent-emerald)" />
                <span className="iframe-title-text">Townscript Competitions</span>
              </div>
              <a 
                href="https://www.townscript.com/in/bengaluru/sports-fitness"
                target="_blank" 
                rel="noopener noreferrer" 
                className="iframe-link-btn"
                style={{ fontSize: '0.7rem', padding: '0.35rem 0.75rem' }}
              >
                Open in New Tab ↗
              </a>
            </div>
            <div className="iframe-wrapper">
              <iframe 
                src="https://www.townscript.com/in/bengaluru/sports-fitness"
                title="Townscript Competitions"
                className="module-iframe clip-townscript"
                onLoad={handleIframeLoad}
              />
            </div>
          </div>
        );
      case 'chat':
        return (
          <div className="focused-iframe-view">
            <div className="iframe-top-bar">
              <div className="iframe-title-meta">
                <Bot size={14} color="var(--accent-cyan)" />
                <span className="iframe-title-text">HelpGPT Health Coach</span>
              </div>
              <a 
                href={`https://helpgpt-frontend.vercel.app/?username=${username}`}
                target="_blank" 
                rel="noopener noreferrer" 
                className="iframe-link-btn"
                style={{ fontSize: '0.7rem', padding: '0.35rem 0.75rem' }}
              >
                Open in New Tab ↗
              </a>
            </div>
            <div className="iframe-wrapper">
              <iframe 
                src={`https://helpgpt-frontend.vercel.app/?username=${username}`}
                title="HelpGPT External App"
                className="module-iframe clip-chat"
                onLoad={handleIframeLoad}
              />
            </div>
          </div>
        );
      case 'meals':
        return (
          <div className="focused-iframe-view">
            <div className="iframe-top-bar">
              <div className="iframe-title-meta">
                <Utensils size={14} color="var(--accent-emerald)" />
                <span className="iframe-title-text">Meal Photo Log</span>
              </div>
              
              <div className="meals-toggle-pills">
                <button 
                  className={`toggle-pill-btn ${mealViewMode === 'pixcalo' ? 'active' : ''}`}
                  onClick={() => handleMealViewChange('pixcalo')}
                >
                  Pixcalo Recognition
                </button>
                <button 
                  className={`toggle-pill-btn ${mealViewMode === 'local' ? 'active' : ''}`}
                  onClick={() => handleMealViewChange('local')}
                >
                  Gemini AI Logger
                </button>
              </div>

              <div style={{ minWidth: '120px', display: 'flex', justifyContent: 'flex-end' }}>
                {mealViewMode === 'pixcalo' && (
                  <a 
                    href="https://pixcalo.com/food-recognition" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="iframe-link-btn"
                    style={{ fontSize: '0.7rem', padding: '0.35rem 0.75rem' }}
                  >
                    Open in New Tab ↗
                  </a>
                )}
              </div>
            </div>

            {mealViewMode === 'pixcalo' ? (
              <div className="iframe-wrapper">
                <iframe 
                  src="https://pixcalo.com/food-recognition"
                  title="Pixcalo Food Recognition"
                  className="module-iframe clip-pixcalo"
                  onLoad={handleIframeLoad}
                />
              </div>
            ) : (
              <div className="meals-scroll-container">
                <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                  <MealPhoto stats={stats} onRefresh={triggerRefresh} username={username} />
                </div>
              </div>
            )}
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
      case 'account':
        return (
          <div className="focused-module-view">
            <Account 
              stats={stats} 
              username={username} 
              onUsernameChange={(next) => {
                setUsername(next);
                localStorage.setItem('helthee_username', next);
                triggerRefresh();
              }} 
              onRefresh={triggerRefresh} 
            />
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
        <div className="glass-card hub-card cursor-pointer" onClick={() => setActiveTab('competitions')} style={{ gridColumn: 'span 4' }}>
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
        <div className="glass-card hub-card cursor-pointer" onClick={() => setActiveTab('chat')} style={{ gridColumn: 'span 4' }}>
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

        {/* Water Progress Card */}
        <div className="glass-card hub-card water-card" style={{ gridColumn: 'span 4' }}>
          <div className="hub-card-header">
            <Droplet size={20} color="#4eaddd" className="droplet-icon" />
            <span className="hub-title">Water Tracker</span>
          </div>
          <div className="hub-text-detail" style={{ margin: '0.2rem 0' }}>
            <h3>Hydration Goal</h3>
            <p>Log your daily water intake to maintain cellular energy levels.</p>
          </div>
          <div className="water-cups-grid">
            {[...Array(8)].map((_, i) => (
              <button 
                key={i} 
                className={`water-cup-btn ${i < waterCups ? 'active' : ''}`}
                onClick={() => handleWaterClick(i + 1)}
                title={`Log ${i + 1} cups of water`}
              >
                <Droplet 
                  size={16} 
                  fill={i < waterCups ? '#4eaddd' : 'transparent'} 
                  color={i < waterCups ? '#4eaddd' : 'var(--text-secondary)'} 
                />
              </button>
            ))}
          </div>
          <div className="hub-tap-hint" style={{ marginTop: 'auto' }}>
            {waterCups} / 8 cups logged today
          </div>
        </div>
      </div>
    );
  };

  const isIframeTab = activeTab === 'tree' || activeTab === 'chat' || activeTab === 'competitions' || activeTab === 'meals';

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
          <div 
            className={`sidebar-profile cursor-pointer ${activeTab === 'account' ? 'active' : ''}`} 
            onClick={() => setActiveTab('account')} 
            title="Manage your profile settings"
          >
            <div className="profile-avatar">
              {stats.username ? stats.username[0].toUpperCase() : 'U'}
            </div>
            <div className="profile-details">
              <div className="profile-name">{stats.username}</div>
              <div className="profile-meta">
                <span>Profile Settings</span>
                <Settings size={12} className="settings-cog" />
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Panel Content */}
      <main className={`main-content ${isIframeTab ? 'no-padding' : ''}`}>
        {!isIframeTab && (
          <header className="dashboard-header">
            <div className="dashboard-title">
              <h1>
                {activeTab === 'dashboard' && 'Helthee Hub'}
                {activeTab === 'steps' && 'Daily Steps Calculator'}
                {activeTab === 'meals' && 'Meal Photo Logger'}
                {activeTab === 'bmi' && 'Weight & Height BMI Gauges'}
                {activeTab === 'competitions' && 'Fitness Competitions Leaderboard'}
                {activeTab === 'report' && 'Weekly Performance Insights'}
                {activeTab === 'account' && 'Account Settings'}
              </h1>
              <p>
                {activeTab === 'dashboard' && `Logged in as: ${username}. Select a module to manage habits.`}
                {activeTab === 'steps' && 'Log steps, count calories burned, and check active metrics.'}
                {activeTab === 'meals' && 'Log calorie counts, estimate carbs/fat/protein ratios.'}
                {activeTab === 'bmi' && 'Check weight status index ranges and advice.'}
                {activeTab === 'competitions' && 'View local standings, step counts, and active brackets.'}
                {activeTab === 'report' && 'Summary bar charts of steps activity and calorie intake.'}
                {activeTab === 'account' && 'Manage your personal metrics and synced username profile.'}
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
        )}

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
          background: rgba(0, 0, 0, 0.02);
          border: 1px solid rgba(0, 0, 0, 0.06);
          padding: 0.75rem 1rem;
          border-radius: 14px;
          margin-top: auto;
          transition: var(--transition-smooth);
        }
        .sidebar-profile:hover {
          background: rgba(0, 0, 0, 0.04);
          border-color: rgba(82, 183, 136, 0.2);
        }
        .sidebar-profile.active {
          background: rgba(82, 183, 136, 0.1);
          border: 1px solid rgba(82, 183, 136, 0.25);
          box-shadow: 0 4px 20px rgba(82, 183, 136, 0.05);
        }
        .profile-avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--accent-purple), var(--accent-cyan));
          color: white;
          font-weight: 800;
          font-size: 0.95rem;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(82, 183, 136, 0.25);
          border: 2px solid white;
        }
        .profile-name {
          font-size: 0.85rem;
          font-weight: 700;
        }
        .profile-meta {
          font-size: 0.7rem;
          color: var(--text-muted);
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }
        .settings-cog {
          transition: transform 0.6s ease;
          color: var(--text-muted);
        }
        .sidebar-profile:hover .settings-cog {
          transform: rotate(180deg);
          color: var(--accent-cyan);
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
        .main-content.no-padding {
          padding: 0;
          height: 100vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .focused-iframe-view {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
          flex-grow: 1;
          animation: fadeIn 0.4s ease-out;
        }
        .iframe-top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(10, 16, 36, 0.8);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding: 0.5rem 1.5rem;
          height: 48px;
          flex-shrink: 0;
          backdrop-filter: var(--glass-blur);
        }
        .iframe-title-meta {
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        .iframe-title-text {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .iframe-link-btn {
          color: var(--accent-cyan);
          text-decoration: none;
          font-size: 0.75rem;
          font-weight: 600;
          transition: var(--transition-smooth);
        }
        .iframe-link-btn:hover {
          color: white;
          text-shadow: 0 0 8px var(--accent-cyan-glow);
        }
        .iframe-wrapper {
          width: 100%;
          height: calc(100% - 48px);
          overflow: hidden;
          position: relative;
          background: #ffffff;
          flex-grow: 1;
        }
        .module-iframe {
          width: 100%;
          height: 100%;
          border: none;
          display: block;
        }
        .clip-bloomify {
          margin-top: -65px;
          height: calc(100% + 65px);
        }
        .clip-townscript {
          margin-top: -68px;
          height: calc(100% + 68px);
        }
        .clip-chat {
          margin-top: -60px;
          height: calc(100% + 60px);
        }
        .clip-pixcalo {
          margin-top: -60px;
          height: calc(100% + 60px);
        }
        .meals-toggle-pills {
          display: flex;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 2px;
          gap: 2px;
        }
        .toggle-pill-btn {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          font-family: 'Times New Roman', Times, serif;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.25rem 0.75rem;
          border-radius: 15px;
          cursor: pointer;
          transition: var(--transition-smooth);
        }
        .toggle-pill-btn:hover {
          color: white;
        }
        .toggle-pill-btn.active {
          background: var(--accent-emerald);
          color: white;
          box-shadow: 0 2px 8px rgba(82, 183, 136, 0.3);
        }
        .meals-scroll-container {
          width: 100%;
          height: calc(100% - 48px);
          overflow-y: auto;
          padding: 2.5rem;
          background: var(--bg-dark);
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
        
        /* Water Tracker CSS */
        .water-cups-grid {
          display: flex;
          gap: 0.35rem;
          margin: 0.35rem 0;
          align-items: center;
        }
        .water-cup-btn {
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 0.2rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: var(--transition-smooth);
        }
        .water-cup-btn:hover {
          transform: scale(1.3);
          background: rgba(78, 173, 221, 0.08);
        }
        .water-cup-btn.active:hover {
          background: rgba(78, 173, 221, 0.15);
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
