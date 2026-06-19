import React, { useState, useEffect } from 'react';
import { Trophy, Users, Plus, Award, Calendar, ChevronRight, MapPin, Check, Sparkles } from 'lucide-react';

export default function Competitions({ stats, onRefresh, username }) {
  const [competition, setCompetition] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  
  // Local challenges states
  const [localChallenges, setLocalChallenges] = useState([]);
  const [joinedLocal, setJoinedLocal] = useState(() => {
    return JSON.parse(localStorage.getItem('helthee_joined_local') || '{}');
  });
  const [notification, setNotification] = useState('');

  useEffect(() => {
    fetchCompetitionData();
    fetchLocalChallenges();
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

  const fetchLocalChallenges = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/competitions/local');
      const data = await res.json();
      if (Array.isArray(data)) {
        setLocalChallenges(data);
      } else {
        setLocalChallenges([]);
      }
    } catch (err) {
      console.error("Error loading local challenges:", err);
      setLocalChallenges([]);
    }
  };

  const handleToggleLocalJoin = (id, title) => {
    const updated = { ...joinedLocal, [id]: !joinedLocal[id] };
    setJoinedLocal(updated);
    localStorage.setItem('helthee_joined_local', JSON.stringify(updated));

    if (updated[id]) {
      setNotification(`Registered for ${title}! Synced to your profile.`);
    } else {
      setNotification(`Unregistered from ${title}.`);
    }

    setTimeout(() => setNotification(''), 4000);
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

  const getDifficultyColorClass = (diff) => {
    if (diff === 'Intermediate') return 'diff-intermediate';
    if (diff === 'Advanced') return 'diff-advanced';
    return 'diff-extreme';
  };

  return (
    <div className="glass-card competitions-card" style={{ gridColumn: 'span 7' }}>
      <div className="competitions-header">
        <div className="title-section">
          <h2 className="card-title">Fitness Competitions</h2>
          <p className="card-subtitle">Compete with friends, earn badges, and step up your game!</p>
        </div>
      </div>

      <div className="active-competition">
        {competition ? (
          <div className="leaderboard-section">
            <div className="section-title">
              <Trophy size={18} color="#ffd166" />
              <h4>Global Leaderboard - {competition.name}</h4>
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
                        <span className="username">{item.username} {item.is_me && '(You)'}</span>
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
        ) : (
          <div className="empty-competitions">
            <Trophy size={48} className="empty-icon" />
            <h3>No Active Competitions</h3>
            <p>Join or create a challenge to start competing with your friends.</p>
          </div>
        )}

        {/* Local Challenges Section */}
        {localChallenges && localChallenges.length > 0 && (
          <div className="local-challenges-section">
            <div className="section-title">
              <MapPin size={18} color="var(--accent-cyan)" />
              <h4>Upcoming Challenges Near You</h4>
            </div>

            <div className="local-challenges-grid">
              {localChallenges.map((challenge) => {
                const isJoined = joinedLocal[challenge.id];
                
                return (
                  <div key={challenge.id} className={`local-challenge-card ${isJoined ? 'joined' : ''}`}>
                    <div className="challenge-card-header">
                      <span className={`diff-badge ${getDifficultyColorClass(challenge.difficulty)}`}>
                        {challenge.difficulty}
                      </span>
                      <span className="participants-count">
                        {isJoined ? challenge.participants_count + 1 : challenge.participants_count} joined
                      </span>
                    </div>

                    <h5 className="challenge-title">{challenge.title}</h5>
                    <div className="challenge-type">{challenge.type}</div>
                    <p className="challenge-desc">{challenge.description}</p>
                    
                    <div className="challenge-meta">
                      <div className="meta-item">
                        <MapPin size={12} />
                        <span>{challenge.location}</span>
                      </div>
                      <div className="meta-item">
                        <Calendar size={12} />
                        <span>{challenge.date}</span>
                      </div>
                    </div>

                    <button 
                      className={`btn btn-sm action-btn ${isJoined ? 'btn-secondary' : 'btn-accent'}`}
                      onClick={() => handleToggleLocalJoin(challenge.id, challenge.title)}
                    >
                      {isJoined ? (
                        <>
                          <Check size={14} color="var(--accent-purple)" />
                          <span>Registered</span>
                        </>
                      ) : (
                        <span>Register for Event</span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {notification && (
        <div className="toast-notification">
          <Sparkles size={16} color="#ffd166" />
          <span>{notification}</span>
        </div>
      )}

      <style>{`
        .competitions-card {
          display: flex;
          flex-direction: column;
          height: auto;
        }
        .competitions-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.25rem;
        }
        .active-competition {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          height: 100%;
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
          margin-bottom: 0.5rem;
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
          gap: 0.6rem;
        }
        .leaderboard-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.65rem 1rem;
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
          background: rgba(82, 183, 136, 0.05);
          border: 1px solid rgba(82, 183, 136, 0.15);
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
          height: 5px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          border-radius: 10px;
          animation: growBar 1s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        /* Local Challenges Section styles */
        .local-challenges-section {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .local-challenges-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .local-challenge-card {
          background: rgba(255, 255, 255, 0.01);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 16px;
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          transition: var(--transition-smooth);
        }
        .local-challenge-card:hover {
          border-color: rgba(116, 198, 157, 0.25);
          background: rgba(116, 198, 157, 0.02);
          transform: translateY(-1px);
        }
        .local-challenge-card.joined {
          background: rgba(82, 183, 136, 0.03);
          border-color: rgba(82, 183, 136, 0.2);
        }
        .challenge-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .diff-badge {
          font-size: 0.65rem;
          font-weight: 800;
          padding: 0.15rem 0.45rem;
          border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .diff-intermediate {
          background: rgba(116, 198, 157, 0.15);
          color: var(--accent-cyan);
          border: 1px solid rgba(116, 198, 157, 0.3);
        }
        .diff-advanced {
          background: rgba(82, 183, 136, 0.15);
          color: var(--accent-purple);
          border: 1px solid rgba(82, 183, 136, 0.3);
        }
        .diff-extreme {
          background: rgba(255, 107, 107, 0.15);
          color: var(--accent-coral);
          border: 1px solid rgba(255, 107, 107, 0.3);
        }
        .participants-count {
          font-size: 0.7rem;
          color: var(--text-muted);
          font-weight: 600;
        }
        .challenge-title {
          font-family: var(--font-display);
          font-size: 1.1rem;
          font-weight: 700;
        }
        .challenge-type {
          font-size: 0.75rem;
          color: var(--text-secondary);
          margin-top: -0.25rem;
          font-weight: 500;
        }
        .challenge-desc {
          font-size: 0.8rem;
          color: var(--text-secondary);
          line-height: 1.4;
          margin-bottom: 0.25rem;
        }
        .challenge-meta {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          margin-bottom: 0.5rem;
        }
        .meta-item {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .action-btn {
          width: 100%;
          justify-content: center;
          padding: 0.5rem;
          font-size: 0.75rem;
          border-radius: 10px;
          margin-top: auto;
        }

        .toast-notification {
          position: fixed;
          bottom: 24px;
          right: 24px;
          background: rgba(6, 13, 11, 0.95);
          border: 1px solid rgba(82, 183, 136, 0.3);
          padding: 0.75rem 1.25rem;
          border-radius: 12px;
          color: var(--text-primary);
          font-size: 0.85rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          box-shadow: 0 10px 25px rgba(0,0,0,0.5);
          z-index: 200;
          animation: slideInUp 0.3s ease-out;
        }

        @keyframes slideInUp {
          from { transform: translateY(50px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
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
