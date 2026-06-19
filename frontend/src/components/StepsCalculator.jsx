import React, { useState, useEffect } from 'react';
import { Footprints, Plus, Minus, Flame, Target, Trophy } from 'lucide-react';

export default function StepsCalculator({ stats, onRefresh }) {
  const [steps, setSteps] = useState(0);
  const [goal, setGoal] = useState(10000);
  const [logging, setLogging] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [tempSteps, setTempSteps] = useState('');

  useEffect(() => {
    if (stats) {
      setSteps(stats.today_steps || 0);
      setGoal(stats.steps_goal || 10000);
    }
  }, [stats]);

  const percentage = Math.min((steps / goal) * 100, 100);

  // SVG Circular progress details
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const handleStepAdjustment = async (amount) => {
    if (logging) return;
    const newSteps = Math.max(0, steps + amount);
    saveSteps(newSteps);
  };

  const saveSteps = async (value) => {
    setLogging(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch('http://localhost:8000/api/steps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ steps: value, date: today })
      });
      const data = await res.json();
      setSteps(data.steps);
      setGoal(data.goal);
      onRefresh();
    } catch (err) {
      console.error("Error logging steps:", err);
      alert("Failed to log steps. Make sure backend is running!");
    } finally {
      setLogging(false);
      setEditMode(false);
    }
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    const val = parseInt(tempSteps);
    if (!isNaN(val) && val >= 0) {
      saveSteps(val);
    }
  };

  // Conversions
  const distanceKm = (steps * 0.00075).toFixed(2); // ~0.75m per step
  const caloriesBurned = Math.round(steps * 0.04); // ~0.04 kcal per step
  const activeMinutes = Math.round(steps / 100); // ~100 steps per minute

  return (
    <div className="glass-card steps-card" style={{ gridColumn: 'span 4' }}>
      <h2 className="card-title">Steps Calculator</h2>
      <p className="card-subtitle">Log your daily step counts and track your calorie expenditure.</p>

      <div className="radial-ring-container">
        <svg className="radial-svg" viewBox="0 0 120 120">
          {/* Background circle */}
          <circle 
            className="ring-bg" 
            cx="60" cy="60" r={radius} 
            fill="none" 
            stroke="rgba(255, 255, 255, 0.04)" 
            strokeWidth="8" 
          />
          {/* Foreground circle */}
          <circle 
            className="ring-fill" 
            cx="60" cy="60" r={radius} 
            fill="none" 
            stroke="url(#ringGradient)" 
            strokeWidth="8" 
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              transition: 'stroke-dashoffset 0.8s ease'
            }}
          />
          <defs>
            <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--accent-cyan)" />
              <stop offset="100%" stopColor="var(--accent-purple)" />
            </linearGradient>
          </defs>
        </svg>

        <div className="ring-content">
          <Footprints size={26} className="steps-icon" />
          <div className="steps-value">{steps.toLocaleString()}</div>
          <div className="steps-goal">Goal: {goal.toLocaleString()}</div>
        </div>
      </div>

      <div className="steps-stats-bar">
        <div className="stat-item">
          <span className="val">{distanceKm} <span className="unit">km</span></span>
          <span className="lbl">Distance</span>
        </div>
        <div className="stat-item">
          <span className="val">{caloriesBurned} <span className="unit">kcal</span></span>
          <span className="lbl">Burned</span>
        </div>
        <div className="stat-item">
          <span className="val">{activeMinutes} <span className="unit">mins</span></span>
          <span className="lbl">Active</span>
        </div>
      </div>

      {editMode ? (
        <form onSubmit={handleCustomSubmit} className="custom-steps-form">
          <input 
            type="number" 
            placeholder="Enter custom steps" 
            value={tempSteps} 
            onChange={(e) => setTempSteps(e.target.value)}
            autoFocus
            required
          />
          <div className="form-buttons">
            <button type="submit" className="btn btn-primary btn-sm" disabled={logging}>Save</button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditMode(false)}>Cancel</button>
          </div>
        </form>
      ) : (
        <div className="steps-actions">
          <button className="step-adjust-btn" onClick={() => handleStepAdjustment(-1000)} disabled={logging}>
            <Minus size={16} />
            <span>-1k</span>
          </button>
          <button 
            className="btn btn-secondary edit-steps-btn" 
            onClick={() => { setTempSteps(steps); setEditMode(true); }}
            disabled={logging}
          >
            Log Custom
          </button>
          <button className="step-adjust-btn" onClick={() => handleStepAdjustment(1000)} disabled={logging}>
            <Plus size={16} />
            <span>+1k</span>
          </button>
        </div>
      )}

      {percentage >= 100 && (
        <div className="steps-congrats">
          <Trophy size={16} />
          <span>Daily Goal Achieved! Great job!</span>
        </div>
      )}

      <style>{`
        .steps-card {
          display: flex;
          flex-direction: column;
        }
        .radial-ring-container {
          position: relative;
          width: 170px;
          height: 170px;
          margin: 1rem auto 1.5rem auto;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .radial-svg {
          width: 100%;
          height: 100%;
          transform: rotate(-90deg);
        }
        .ring-fill {
          filter: drop-shadow(0 0 4px rgba(0, 245, 212, 0.2));
        }
        .ring-content {
          position: absolute;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .steps-icon {
          color: var(--accent-cyan);
          margin-bottom: 0.15rem;
          animation: float 2.5s ease-in-out infinite;
        }
        .steps-value {
          font-family: var(--font-display);
          font-size: 1.5rem;
          font-weight: 800;
          line-height: 1.1;
        }
        .steps-goal {
          font-size: 0.7rem;
          color: var(--text-muted);
          margin-top: 0.2rem;
          font-weight: 600;
        }
        
        .steps-stats-bar {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 0.75rem 0.5rem;
          margin-bottom: 1.25rem;
        }
        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .stat-item .val {
          font-family: var(--font-display);
          font-size: 0.95rem;
          font-weight: 700;
        }
        .stat-item .val .unit {
          font-size: 0.7rem;
          color: var(--text-secondary);
          font-weight: 500;
        }
        .stat-item .lbl {
          font-size: 0.65rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
          margin-top: 0.1rem;
        }
        
        .steps-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.5rem;
        }
        .step-adjust-btn {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          color: var(--text-primary);
          padding: 0.5rem 0.75rem;
          border-radius: 10px;
          cursor: pointer;
          font-family: var(--font-primary);
          font-size: 0.75rem;
          font-weight: 600;
          transition: var(--transition-smooth);
        }
        .step-adjust-btn:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.15);
        }
        .edit-steps-btn {
          flex-grow: 1;
          justify-content: center;
          padding: 0.5rem;
          font-size: 0.75rem;
          border-radius: 10px;
        }
        
        .custom-steps-form {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .custom-steps-form input {
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid var(--border-card);
          border-radius: 8px;
          padding: 0.5rem 0.75rem;
          font-family: var(--font-primary);
          font-size: 0.8rem;
          color: white;
          outline: none;
        }
        .form-buttons {
          display: flex;
          gap: 0.4rem;
        }
        .form-buttons button {
          flex-grow: 1;
          justify-content: center;
        }
        
        .steps-congrats {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.35rem;
          background: rgba(6, 214, 160, 0.1);
          border: 1px solid rgba(6, 214, 160, 0.25);
          color: var(--accent-emerald);
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.5rem;
          border-radius: 8px;
          margin-top: 0.75rem;
          animation: pulseGlow 2s infinite;
        }
      `}</style>
    </div>
  );
}
