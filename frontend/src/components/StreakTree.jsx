import React, { useState, useEffect } from 'react';
import { Flame, Droplet, Sparkles, CheckCircle2 } from 'lucide-react';

export default function StreakTree({ stats, onRefresh, username }) {
  const [loading, setLoading] = useState(false);
  const [watering, setWatering] = useState(false);
  const [message, setMessage] = useState('');
  
  const habitsList = [
    { id: 'workout', label: 'Completed daily workout' },
    { id: 'steps', label: 'Achieved 8,000+ steps' },
    { id: 'diet', label: 'Logged healthy meals' },
    { id: 'hydrate', label: 'Drank 3L of water' }
  ];
  
  const [completedHabits, setCompletedHabits] = useState({
    workout: false,
    steps: false,
    diet: false,
    hydrate: false
  });

  const toggleHabit = (id) => {
    setCompletedHabits(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const allHabitsDone = Object.values(completedHabits).some(val => val === true);

  const handleWaterTree = async () => {
    if (loading) return;
    setLoading(true);
    setWatering(true);
    
    // Simulate watering animation before making request
    setTimeout(async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/streak/increment?username=${username}`, {
          method: 'POST',
        });
        const data = await response.json();
        setMessage(data.message || 'Tree watered!');
        onRefresh();
      } catch (err) {
        console.error("Error watering streak tree:", err);
        setMessage("Failed to log activity. Make sure the backend is running!");
      } finally {
        setWatering(false);
        setLoading(false);
        // Clear message after 4 seconds
        setTimeout(() => setMessage(''), 4000);
      }
    }, 1500);
  };

  // Get SVG content based on streak stage
  const renderTreeSVG = () => {
    const streak = stats?.current_streak || 0;
    
    // Base soil common to all trees
    const baseSoil = (
      <>
        <ellipse cx="100" cy="180" rx="70" ry="12" fill="#2d1e18" />
        <ellipse cx="100" cy="183" rx="60" ry="8" fill="#1b120f" />
        {/* Pot */}
        <path d="M 50 176 L 150 176 L 140 196 L 60 196 Z" fill="#3a4866" stroke="#24335c" strokeWidth="2" />
        <line x1="45" y1="176" x2="155" y2="176" stroke="#4f5e80" strokeWidth="3" strokeLinecap="round" />
      </>
    );

    if (streak === 0) {
      // Seed
      return (
        <svg viewBox="0 0 200 200" className="tree-svg">
          {baseSoil}
          {/* A tiny seed and a question mark */}
          <circle cx="100" cy="170" r="4" fill="#a0522d" />
          <circle cx="102" cy="168" r="2.5" fill="#cd853f" />
          {/* Small dormant indicator */}
          <text x="100" y="145" textAnchor="middle" fill="#64748b" fontSize="10" fontFamily="sans-serif">DORMANT</text>
        </svg>
      );
    } else if (streak < 3) {
      // Sprout
      return (
        <svg viewBox="0 0 200 200" className="tree-svg sprout">
          {baseSoil}
          {/* Curved stalk */}
          <path d="M 100 176 Q 95 155 105 140" fill="none" stroke="#00f5d4" strokeWidth="4" strokeLinecap="round" />
          {/* Tiny leaves */}
          <path d="M 105 140 Q 115 138 118 144 Q 108 148 105 140" fill="#00f5d4" />
          <path d="M 104 144 Q 90 142 88 149 Q 98 152 104 144" fill="#06d6a0" />
        </svg>
      );
    } else if (streak < 8) {
      // Sapling
      return (
        <svg viewBox="0 0 200 200" className="tree-svg sapling">
          {baseSoil}
          {/* Small trunk */}
          <path d="M 100 176 L 100 120" stroke="#a06a50" strokeWidth="5" strokeLinecap="round" />
          {/* Branches */}
          <path d="M 100 145 Q 85 135 80 130" fill="none" stroke="#a06a50" strokeWidth="3" strokeLinecap="round" />
          <path d="M 100 135 Q 115 125 122 120" fill="none" stroke="#a06a50" strokeWidth="3" strokeLinecap="round" />
          {/* Leaves groups */}
          <circle cx="80" cy="127" r="10" fill="#06d6a0" opacity="0.9" />
          <circle cx="122" cy="117" r="11" fill="#00f5d4" opacity="0.95" />
          <circle cx="100" cy="112" r="14" fill="#06d6a0" />
        </svg>
      );
    } else if (stats.current_streak < 15) {
      // Young Tree
      return (
        <svg viewBox="0 0 200 200" className="tree-svg young-tree">
          {baseSoil}
          {/* Trunk */}
          <path d="M 98 176 L 98 135 Q 98 110 102 95" fill="none" stroke="#8b5a2b" strokeWidth="8" strokeLinecap="round" />
          <path d="M 98 130 Q 75 115 70 105" fill="none" stroke="#8b5a2b" strokeWidth="5" strokeLinecap="round" />
          <path d="M 100 120 Q 120 105 128 95" fill="none" stroke="#8b5a2b" strokeWidth="5" strokeLinecap="round" />
          {/* Foliage */}
          <circle cx="70" cy="100" r="18" fill="#06d6a0" />
          <circle cx="128" cy="90" r="20" fill="#00f5d4" />
          <circle cx="102" cy="85" r="24" fill="#06d6a0" />
          <circle cx="95" cy="75" r="16" fill="#00f5d4" />
        </svg>
      );
    } else if (stats.current_streak < 30) {
      // Mature Tree
      return (
        <svg viewBox="0 0 200 200" className="tree-svg mature-tree">
          {baseSoil}
          {/* Detailed trunk */}
          <path d="M 95 176 C 95 150 92 120 98 90" fill="none" stroke="#6f4e37" strokeWidth="12" strokeLinecap="round" />
          <path d="M 97 125 C 75 110 65 95 60 85" fill="none" stroke="#6f4e37" strokeWidth="7" strokeLinecap="round" />
          <path d="M 98 115 C 120 100 130 90 135 75" fill="none" stroke="#6f4e37" strokeWidth="7" strokeLinecap="round" />
          
          {/* Foliage blocks with gradients/layers */}
          <circle cx="58" cy="80" r="22" fill="#06d6a0" />
          <circle cx="138" cy="72" r="24" fill="#00f5d4" />
          <circle cx="100" cy="75" r="30" fill="#06d6a0" />
          <circle cx="85" cy="55" r="25" fill="#00f5d4" />
          <circle cx="115" cy="58" r="22" fill="#06d6a0" />
          
          {/* Fruits (streaks details) */}
          <circle cx="85" cy="70" r="4.5" fill="#ff5a5f" />
          <circle cx="115" cy="75" r="4.5" fill="#ffd166" />
          <circle cx="62" cy="84" r="4" fill="#ff5a5f" />
        </svg>
      );
    } else {
      // Blooming Tree
      return (
        <svg viewBox="0 0 200 200" className="tree-svg blooming-tree">
          {baseSoil}
          {/* Detailed trunk */}
          <path d="M 95 176 C 95 150 92 120 98 85" fill="none" stroke="#5c3a21" strokeWidth="14" strokeLinecap="round" />
          <path d="M 97 120 C 70 105 55 90 50 78" fill="none" stroke="#5c3a21" strokeWidth="8" strokeLinecap="round" />
          <path d="M 98 110 C 125 95 135 85 145 70" fill="none" stroke="#5c3a21" strokeWidth="8" strokeLinecap="round" />
          
          {/* Foliage */}
          <circle cx="48" cy="72" r="25" fill="#9d4edd" opacity="0.85" />
          <circle cx="145" cy="65" r="26" fill="#00f5d4" opacity="0.85" />
          <circle cx="98" cy="68" r="34" fill="#9d4edd" />
          <circle cx="78" cy="45" r="28" fill="#00f5d4" />
          <circle cx="118" cy="48" r="28" fill="#9d4edd" />
          
          {/* Stars / Flowers */}
          <polygon points="48,60 50,65 55,65 51,68 53,73 48,70 43,73 45,68 41,65 46,65" fill="#fff" />
          <polygon points="100,50 102,55 107,55 103,58 105,63 100,60 95,63 97,58 93,55 98,55" fill="#ffd166" />
          <polygon points="122,40 123,44 127,44 124,47 125,51 122,48 119,51 120,47 117,44 121,44" fill="#fff" />
          <polygon points="138,60 139,64 143,64 140,67 141,71 138,68 135,71 136,67 133,64 137,64" fill="#ffd166" />
        </svg>
      );
    }
  };

  return (
    <div className="glass-card streak-tree-card" style={{ gridColumn: 'span 5' }}>
      <div className="streak-tree-header">
        <h2 className="card-title">Streak Tree</h2>
        <div className="streak-badge">
          <Flame size={18} fill="#9d4edd" stroke="#9d4edd" />
          <span>{stats?.current_streak || 0} Day Streak</span>
        </div>
      </div>
      
      <p className="card-subtitle">
        Maintain your healthy habits to water your tree. Watch it grow from a small seed to a grand blooming tree!
      </p>

      <div className="tree-visual-container">
        {renderTreeSVG()}
        
        {watering && (
          <div className="watering-animation">
            <Droplet size={32} className="falling-droplet-1" />
            <Droplet size={24} className="falling-droplet-2" />
            <Droplet size={20} className="falling-droplet-3" />
          </div>
        )}
      </div>

      <div className="streak-status">
        <div className="status-label">Growth Stage:</div>
        <div className="status-value text-gradient-purple">{stats?.tree_stage || 'Seed'}</div>
      </div>

      <div className="habits-checklist">
        <h3>Daily Activities</h3>
        <div className="checklist-items">
          {habitsList.map(habit => (
            <div 
              key={habit.id} 
              className={`checklist-item ${completedHabits[habit.id] ? 'checked' : ''}`}
              onClick={() => toggleHabit(habit.id)}
            >
              <CheckCircle2 
                size={18} 
                className="check-icon"
                color={completedHabits[habit.id] ? '#06d6a0' : '#64748b'}
                fill={completedHabits[habit.id] ? 'rgba(6, 214, 160, 0.2)' : 'none'}
              />
              <span>{habit.label}</span>
            </div>
          ))}
        </div>
      </div>

      <button 
        className={`btn btn-primary w-full ${(!allHabitsDone || watering || loading) ? 'disabled' : ''}`} 
        onClick={handleWaterTree}
        disabled={!allHabitsDone || watering || loading}
        style={{ width: '100%', marginTop: '1.25rem', justifyContent: 'center' }}
      >
        <Droplet size={18} />
        {watering ? 'Watering Tree...' : 'Log Activity & Water Tree'}
      </button>

      {message && (
        <div className="info-message">
          <Sparkles size={16} color="#ffd166" />
          <span>{message}</span>
        </div>
      )}

      <style>{`
        .streak-tree-card {
          display: flex;
          flex-direction: column;
        }
        .streak-tree-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        .card-title {
          font-family: var(--font-display);
          font-size: 1.4rem;
          font-weight: 700;
        }
        .card-subtitle {
          color: var(--text-secondary);
          font-size: 0.85rem;
          line-height: 1.4;
          margin-bottom: 1.5rem;
        }
        .streak-badge {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          background: rgba(157, 78, 221, 0.15);
          border: 1px solid rgba(157, 78, 221, 0.3);
          padding: 0.35rem 0.75rem;
          border-radius: 50px;
          font-size: 0.85rem;
          font-weight: 700;
          color: #e0aaff;
        }
        .tree-visual-container {
          height: 200px;
          background: rgba(10, 15, 30, 0.4);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          margin-bottom: 1.25rem;
        }
        .tree-svg {
          height: 90%;
          width: 90%;
          filter: drop-shadow(0 0 10px rgba(0, 245, 212, 0.1));
          transition: transform 0.5s ease;
        }
        .tree-svg:hover {
          transform: scale(1.05);
        }
        
        /* Growth Animations */
        @keyframes floatLeaves {
          0% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-3px) rotate(2deg); }
          100% { transform: translateY(0) rotate(0deg); }
        }
        .sprout path, .sapling circle, .young-tree circle, .mature-tree circle, .blooming-tree circle {
          animation: floatLeaves 4s ease-in-out infinite;
          transform-origin: bottom center;
        }
        
        .watering-animation {
          position: absolute;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 15px;
          pointer-events: none;
        }
        .falling-droplet-1, .falling-droplet-2, .falling-droplet-3 {
          color: var(--accent-cyan);
          opacity: 0;
          animation: dropRain 1.5s cubic-bezier(0.5, 0, 0.7, 0.4) forwards;
        }
        .falling-droplet-1 { animation-delay: 0.1s; }
        .falling-droplet-2 { animation-delay: 0.4s; }
        .falling-droplet-3 { animation-delay: 0.2s; }
        
        @keyframes dropRain {
          0% { transform: translateY(-40px); opacity: 0; }
          20% { opacity: 0.8; }
          80% { opacity: 0.8; }
          100% { transform: translateY(120px); opacity: 0; }
        }

        .streak-status {
          display: flex;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          font-size: 0.9rem;
          margin-bottom: 1.25rem;
        }
        .status-label {
          color: var(--text-secondary);
        }
        .status-value {
          font-weight: 700;
        }
        
        .habits-checklist h3 {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-secondary);
          margin-bottom: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .checklist-items {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }
        .checklist-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.65rem 0.85rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          font-size: 0.85rem;
          cursor: pointer;
          transition: var(--transition-smooth);
        }
        .checklist-item:hover {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(255, 255, 255, 0.1);
        }
        .checklist-item.checked {
          background: rgba(6, 214, 160, 0.05);
          border-color: rgba(6, 214, 160, 0.2);
          color: var(--text-primary);
        }
        .check-icon {
          flex-shrink: 0;
          transition: var(--transition-smooth);
        }
        
        .btn.disabled {
          opacity: 0.5;
          cursor: not-allowed;
          box-shadow: none;
        }
        .btn.disabled:hover {
          transform: none;
        }
        
        .info-message {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 1rem;
          padding: 0.65rem 0.85rem;
          background: rgba(255, 209, 102, 0.08);
          border: 1px solid rgba(255, 209, 102, 0.2);
          border-radius: 10px;
          color: #ffe8a3;
          font-size: 0.8rem;
          line-height: 1.4;
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
