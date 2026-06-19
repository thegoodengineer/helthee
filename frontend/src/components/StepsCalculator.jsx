import React, { useState, useEffect } from 'react';
import { Footprints, Plus, Minus, Flame, Target, Trophy, RefreshCw, Smartphone } from 'lucide-react';

export default function StepsCalculator({ stats, onRefresh, username }) {
  const [steps, setSteps] = useState(0);
  const [goal, setGoal] = useState(10000);
  const [logging, setLogging] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [tempSteps, setTempSteps] = useState('');

  // Samsung Health states
  const [samsungConnected, setSamsungConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [fileUploading, setFileUploading] = useState(false);

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
      const res = await fetch(`http://localhost:8000/api/steps?username=${username}`, {
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

  // Samsung Health connection and sync simulation
  const handleConnectSamsung = () => {
    setSyncing(true);
    setTimeout(() => {
      setSamsungConnected(true);
      setSyncing(false);
      handleSamsungSync(true); // trigger initial sync
    }, 1500);
  };

  const handleSamsungSync = (isInitial = false) => {
    if (syncing) return;
    setSyncing(true);
    setSyncMessage('Establishing link with Samsung Health Cloud...');

    setTimeout(async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        
        // Simulating watch fetch: increments current count with new watch steps
        const simulatedWatchSteps = isInitial ? 8450 : steps + Math.floor(Math.random() * 2500) + 500;
        
        const res = await fetch('http://localhost:8000/api/steps/samsung-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            steps: simulatedWatchSteps,
            date: today,
            device_id: "SAMSUNG-SM-S918B (Galaxy Watch6)",
            username: username
          })
        });
        const data = await res.json();
        
        setSteps(data.steps);
        setGoal(data.goal);
        onRefresh();
        
        const importedCount = isInitial ? simulatedWatchSteps : (data.steps - steps);
        setSyncMessage(`Synced ${importedCount.toLocaleString()} steps from Galaxy Watch!`);
      } catch (err) {
        console.error("Error syncing Samsung Health:", err);
        setSyncMessage('Sync failed. Is the API server running?');
      } finally {
        setSyncing(false);
        // Clear message after 4s
        setTimeout(() => setSyncMessage(''), 4000);
      }
    }, 2000);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileUploading(true);
    setSyncMessage('Parsing Samsung Health exported file...');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('username', username);

    try {
      const res = await fetch('http://localhost:8000/api/steps/import-samsung-file', {
        method: 'POST',
        body: formData
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Failed to import file');
      }

      const data = await res.json();
      setSteps(data.today_steps);
      onRefresh();
      setSyncMessage(data.message);
    } catch (err) {
      console.error("Error importing file:", err);
      setSyncMessage(err.message || 'File import failed. Verify the file format.');
    } finally {
      setFileUploading(false);
      e.target.value = null;
      setTimeout(() => setSyncMessage(''), 6000);
    }
  };

  // Conversions
  const distanceKm = (steps * 0.00075).toFixed(2);
  const caloriesBurned = Math.round(steps * 0.04);
  const activeMinutes = Math.round(steps / 100);

  return (
    <div className="glass-card steps-card" style={{ gridColumn: 'span 4' }}>
      <h2 className="card-title">Steps Calculator</h2>
      <p className="card-subtitle">Log your daily step counts and track your calorie expenditure.</p>

      <div className="radial-ring-container">
        <svg className="radial-svg" viewBox="0 0 120 120">
          <circle 
            className="ring-bg" 
            cx="60" cy="60" r={radius} 
            fill="none" 
            stroke="rgba(255, 255, 255, 0.04)" 
            strokeWidth="8" 
          />
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
        <form onSubmit={handleCustomSubmit} className="custom-steps-form" style={{ marginBottom: '1.25rem' }}>
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
        <div className="steps-actions" style={{ marginBottom: '1.25rem' }}>
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
        <div className="steps-congrats" style={{ marginBottom: '1.25rem' }}>
          <Trophy size={16} />
          <span>Daily Goal Achieved! Great job!</span>
        </div>
      )}

      {/* Samsung Health Integration panel */}
      <div className="samsung-sync-container">
        <div className="sync-header">
          <Smartphone size={16} color="#00f5d4" />
          <h4>Samsung Health</h4>
        </div>
        
        {samsungConnected ? (
          <div className="sync-status-connected">
            <div className="status-label">
              <span className="indicator-dot connected" />
              <span>Link Active (S-Health API)</span>
            </div>
            <div className="device-info">Device: SAMSUNG-SM-S918B</div>
            
            <button 
              className="btn btn-secondary btn-sm sync-action-btn" 
              onClick={() => handleSamsungSync(false)}
              disabled={syncing}
              style={{ width: '100%', justifyContent: 'center', fontSize: '0.75rem', padding: '0.45rem' }}
            >
              <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
              <span>{syncing ? 'Syncing...' : 'Sync Wearable Now'}</span>
            </button>
          </div>
        ) : (
          <div className="sync-status-disconnected">
            <p>Fetch your steps automatically from your Galaxy Watch or S-Health device.</p>
            <button 
              className="btn btn-primary btn-sm connect-btn"
              onClick={handleConnectSamsung}
              disabled={syncing}
              style={{ 
                width: '100%', 
                justifyContent: 'center', 
                fontSize: '0.75rem', 
                padding: '0.45rem', 
                background: 'linear-gradient(135deg, var(--accent-cyan), #00bbf9)',
                color: '#070b19' 
              }}
            >
              {syncing ? 'Connecting to Wearable...' : 'Link Samsung Health'}
            </button>
          </div>
        )}

        <div className="file-import-section" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
          <div className="file-import-label" style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
            Or Import Samsung Export File:
          </div>
          <input 
            type="file" 
            id="samsung-file-input" 
            accept=".json,.csv" 
            style={{ display: 'none' }} 
            onChange={handleFileUpload}
            disabled={fileUploading}
          />
          <button 
            className="btn btn-secondary btn-sm" 
            style={{ width: '100%', fontSize: '0.7rem', padding: '0.35rem', justifyContent: 'center' }}
            onClick={() => document.getElementById('samsung-file-input').click()}
            disabled={fileUploading}
          >
            {fileUploading ? 'Processing File...' : 'Upload step_count JSON/CSV'}
          </button>
          <div className="import-instructions" style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.35rem', lineHeight: '1.3' }}>
            Phone: Samsung Health &gt; Settings &gt; Download personal data. Unzip the export and upload the `com.samsung.health.step_count` JSON or CSV file here.
          </div>
        </div>

        {syncMessage && (
          <div className="sync-feedback-msg">
            <span>{syncMessage}</span>
          </div>
        )}
      </div>

      <style>{`
        .steps-card {
          display: flex;
          flex-direction: column;
        }
        .radial-ring-container {
          position: relative;
          width: 150px;
          height: 150px;
          margin: 0.5rem auto 1rem auto;
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
          font-size: 1.4rem;
          font-weight: 800;
          line-height: 1.1;
        }
        .steps-goal {
          font-size: 0.65rem;
          color: var(--text-muted);
          margin-top: 0.15rem;
          font-weight: 600;
        }
        
        .steps-stats-bar {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 0.4rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 0.65rem 0.4rem;
          margin-bottom: 1rem;
        }
        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .stat-item .val {
          font-family: var(--font-display);
          font-size: 0.9rem;
          font-weight: 700;
        }
        .stat-item .val .unit {
          font-size: 0.65rem;
          color: var(--text-secondary);
          font-weight: 500;
        }
        .stat-item .lbl {
          font-size: 0.6rem;
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
          gap: 0.4rem;
        }
        .step-adjust-btn {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          color: var(--text-primary);
          padding: 0.45rem 0.65rem;
          border-radius: 8px;
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
          padding: 0.45rem;
          font-size: 0.75rem;
          border-radius: 8px;
        }
        
        .custom-steps-form {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .custom-steps-form input {
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid var(--border-card);
          border-radius: 8px;
          padding: 0.45rem 0.65rem;
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
          padding: 0.45rem;
          border-radius: 8px;
          animation: pulseGlow 2s infinite;
        }

        /* Samsung integration container */
        .samsung-sync-container {
          background: rgba(0, 245, 212, 0.02);
          border: 1px dashed rgba(0, 245, 212, 0.2);
          border-radius: 12px;
          padding: 0.85rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .sync-header {
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        .sync-header h4 {
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: #a3fff2;
        }
        .sync-status-disconnected p {
          font-size: 0.7rem;
          color: var(--text-secondary);
          line-height: 1.3;
          margin-bottom: 0.5rem;
        }
        .sync-status-connected {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .status-label {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--accent-emerald);
        }
        .indicator-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--accent-emerald);
          box-shadow: 0 0 8px var(--accent-emerald-glow);
        }
        .device-info {
          font-size: 0.65rem;
          color: var(--text-muted);
          font-family: monospace;
        }
        .sync-feedback-msg {
          font-size: 0.7rem;
          color: #ffd166;
          background: rgba(255, 209, 102, 0.08);
          border: 1px solid rgba(255, 209, 102, 0.15);
          padding: 0.35rem;
          border-radius: 6px;
          text-align: center;
          animation: float 3s ease-in-out infinite;
        }
        .animate-spin {
          animation: rotateRing 1.5s linear infinite;
        }
      `}</style>
    </div>
  );
}
