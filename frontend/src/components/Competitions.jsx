import React, { useState, useEffect } from 'react';
import { Trophy, Users, Plus, Award, Calendar, ChevronRight } from 'lucide-react';

export default function Competitions({ stats, onRefresh, username }) {
  const [competition, setCompetition] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [compName, setCompName] = useState('');
  const [compDesc, setCompDesc] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCompetitionData();
  }, [username]);

  const fetchCompetitionData = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/competitions?username=${username}`);
      const data = await res.json();
      setCompetition(data.competition);
      setLeaderboard(data.leaderboard || []);
    } catch (err) {
      console.error("Error loading competition:", err);
    }
  };

  const getMaxSteps = () => {
    if (leaderboard.length === 0) return 10000;
    return Math.max(...leaderboard.map(u => u.steps), 1);
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return <Award size={18} color="#ffd166" fill="#ffd166" />;
    if (rank === 2) return <Award size={18} color="#e2e8f0" fill="#e2e8f0" />;
    if (rank === 3) return <Award size={18} color="#b45309" fill="#b45309" />;
    return <span className="rank-number">{rank}</span>;
  };

  return (
    <div className="glass-card competitions-card" style={{ gridColumn: 'span 7' }}>
      <div className="competitions-header">
        <div className="title-section">
          <h2 className="card-title">Fitness Competitions</h2>
          <p className="card-subtitle">Compete with friends, earn badges, and step up your game!</p>
        </div>
        <button 
          className="btn btn-secondary btn-sm" 
          onClick={() => alert("Multiplayer competitions are active! Invite teammates using their username.")}
        >
          <Users size={16} />
          <span>Friends</span>
        </button>
      </div>

      {competition ? (
        <div className="active-competition">
          <div className="comp-info-badge">
            <div className="comp-meta">
              <span className="live-pill">LIVE</span>
              <h3 className="comp-name">{competition.name}</h3>
            </div>
            <p className="comp-desc">{competition.description}</p>
            <div className="comp-dates">
              <Calendar size={14} />
              <span>Ends: {competition.end_date}</span>
            </div>
          </div>

          <div className="leaderboard-section">
            <div className="section-title">
              <Trophy size={18} color="#ffd166" />
              <h4>Leaderboard Standing</h4>
            </div>

            <div className="leaderboard-list">
              {leaderboard.map((item) => {
                const maxSteps = getMaxSteps();
                const percentage = Math.min((item.steps / maxSteps) * 100, 100);
                
                return (
                  <div key={item.username} className={`leaderboard-row ${item.is_me ? 'is-user' : ''}`}>
                    <div className="rank-col">
                      {getRankBadge(item.rank)}
                    </div>
                    <div className="info-col">
                      <div className="user-details">
                        <span className="username">{item.username}</span>
                        <span className="steps-count">{item.steps.toLocaleString()} steps</span>
                      </div>
                      <div className="progress-track">
                        <div 
                          className="progress-fill" 
                          style={{ 
                            width: `${percentage}%`,
                            background: item.is_me 
                              ? 'linear-gradient(90deg, var(--accent-purple), var(--accent-cyan))' 
                              : 'linear-gradient(90deg, #475569, #94a3b8)' 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="empty-competitions">
          <Trophy size={48} className="empty-icon" />
          <h3>No Active Competitions</h3>
          <p>Join or create a challenge to start competing with your friends.</p>
        </div>
      )}

      <style>{`
        .competitions-card {
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        .competitions-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.25rem;
        }
        .btn-sm {
          padding: 0.5rem 1rem;
          font-size: 0.8rem;
          border-radius: 8px;
        }
        .active-competition {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          height: 100%;
        }
        .comp-info-badge {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          padding: 1.25rem;
          border-radius: 14px;
        }
        .comp-meta {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.5rem;
        }
        .live-pill {
          background: rgba(6, 214, 160, 0.15);
          border: 1px solid rgba(6, 214, 160, 0.3);
          color: var(--accent-emerald);
          font-size: 0.7rem;
          font-weight: 800;
          padding: 0.15rem 0.4rem;
          border-radius: 4px;
          letter-spacing: 0.5px;
        }
        .comp-name {
          font-family: var(--font-display);
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .comp-desc {
          color: var(--text-secondary);
          font-size: 0.85rem;
          line-height: 1.4;
          margin-bottom: 0.75rem;
        }
        .comp-dates {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.8rem;
          color: var(--text-muted);
        }
        .leaderboard-section {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .section-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .section-title h4 {
          font-size: 0.9rem;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: var(--text-secondary);
        }
        .leaderboard-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .leaderboard-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.01);
          border: 1px solid rgba(255, 255, 255, 0.03);
          border-radius: 12px;
          transition: var(--transition-smooth);
        }
        .leaderboard-row:hover {
          background: rgba(255, 255, 255, 0.03);
          border-color: rgba(255, 255, 255, 0.06);
        }
        .leaderboard-row.is-user {
          background: rgba(157, 78, 221, 0.05);
          border: 1px solid rgba(157, 78, 221, 0.15);
        }
        .rank-col {
          width: 24px;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .rank-number {
          font-family: var(--font-display);
          font-weight: 700;
          color: var(--text-muted);
          font-size: 0.95rem;
        }
        .info-col {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }
        .user-details {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
        }
        .username {
          font-weight: 600;
          color: var(--text-primary);
        }
        .steps-count {
          font-weight: 700;
          color: var(--text-secondary);
        }
        .progress-track {
          height: 6px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          border-radius: 10px;
          animation: growBar 1s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        .empty-competitions {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 1.5rem;
          text-align: center;
          background: rgba(255, 255, 255, 0.01);
          border: 1px dashed var(--border-card);
          border-radius: 16px;
        }
        .empty-icon {
          color: var(--text-muted);
          margin-bottom: 1rem;
        }
        .empty-competitions h3 {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 0.25rem;
        }
        .empty-competitions p {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
}
