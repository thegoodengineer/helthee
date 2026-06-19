import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Flame, Footprints, Bot, Utensils, 
  Activity, Award, User, RefreshCw, AlertCircle
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

  const fetchStats = async () => {
    try {
      setError(false);
      const res = await fetch('http://localhost:8000/api/dashboard');
      if (!res.ok) throw new Error("Backend connection issue");
      const data = await res.ok ? await res.json() : null;
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
  }, [refreshTrigger]);

  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const renderActiveView = () => {
    if (activeTab === 'dashboard') {
      return (
        <div className="dashboard-grid">
          {/* Row 1 */}
          <StreakTree stats={stats} onRefresh={triggerRefresh} />
          <Competitions stats={stats} onRefresh={triggerRefresh} />
          
          {/* Row 2 */}
          <StepsCalculator stats={stats} onRefresh={triggerRefresh} />
          <BMICalculator stats={stats} onRefresh={triggerRefresh} />
          <MealPhoto stats={stats} onRefresh={triggerRefresh} />
        </div>
      );
    }

    if (activeTab === 'chat') {
      return (
        <div className="focused-module-view">
          <HelpGPT />
        </div>
      );
    }

    if (activeTab === 'report') {
      return (
        <div className="focused-module-view">
          <WeeklyReport stats={stats} refreshTrigger={refreshTrigger} />
        </div>
      );
    }
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
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </li>
          <li 
            className={`sidebar-item ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            <Bot size={20} />
            <span>HelpGPT Chat</span>
          </li>
          <li 
            className={`sidebar-item ${activeTab === 'report' ? 'active' : ''}`}
            onClick={() => setActiveTab('report')}
          >
            <Award size={20} />
            <span>Weekly Insights</span>
          </li>
        </ul>

        {stats && (
          <div className="sidebar-profile">
            <div className="profile-icon">
              <User size={18} />
            </div>
            <div className="profile-details">
              <div className="profile-name">{stats.username}</div>
              <div className="profile-meta">Level 4 Active</div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Panel Content */}
      <main className="main-content">
        <header className="dashboard-header">
          <div className="dashboard-title">
            <h1>
              {activeTab === 'dashboard' && 'Health Dashboard'}
              {activeTab === 'chat' && 'HelpGPT Assistant'}
              {activeTab === 'report' && 'Performance Report'}
            </h1>
            <p>
              {activeTab === 'dashboard' && 'Real-time overview of streaks, steps, and weight parameters.'}
              {activeTab === 'chat' && 'Your virtual fitness expert coach, ready to answer questions.'}
              {activeTab === 'report' && 'Detailed graphs and achievements logged over the week.'}
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
        }
      `}</style>
    </div>
  );
}
