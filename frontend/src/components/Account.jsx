import React, { useState, useEffect } from 'react';
import { User, Save, Mars, Venus, Ruler, Scale, Calendar, Award, Check } from 'lucide-react';

export default function Account({ stats, username, onUsernameChange, onRefresh }) {
  const [unitSystem, setUnitSystem] = useState('metric');
  const [inputUsername, setInputUsername] = useState(username);
  const [gender, setGender] = useState('male');
  const [age, setAge] = useState(28);
  const [height, setHeight] = useState(175); // in cm
  const [weight, setWeight] = useState(70); // in kg
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setInputUsername(username);
  }, [username]);

  useEffect(() => {
    if (stats) {
      if (stats.height) setHeight(Math.round(stats.height));
      if (stats.weight) setWeight(Math.round(stats.weight));
      if (stats.age) setAge(stats.age);
      if (stats.gender) setGender(stats.gender);
    }
  }, [stats]);

  const getFormattedHeight = () => {
    if (unitSystem === 'metric') {
      return `${Math.round(height)} cm`;
    } else {
      const totalInches = Math.round(height / 2.54);
      const feet = Math.floor(totalInches / 12);
      const inches = totalInches % 12;
      return `${feet} ft ${inches} in (${Math.round(height)} cm)`;
    }
  };

  const getFormattedWeight = () => {
    if (unitSystem === 'metric') {
      return `${Math.round(weight)} kg`;
    } else {
      const lbs = Math.round(weight * 2.20462);
      return `${lbs} lbs (${Math.round(weight)} kg)`;
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!inputUsername.trim()) return;

    setSaving(true);
    setSuccess(false);

    try {
      const finalUsername = inputUsername.trim();
      
      // 1. Sync height, weight, age, gender to the user profile
      const res = await fetch(`http://localhost:8000/api/bmi?username=${finalUsername}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ height, weight, age, gender })
      });
      await res.json();

      // 2. Trigger parent username state update if username changed
      if (finalUsername !== username) {
        onUsernameChange(finalUsername);
      } else {
        onRefresh();
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving profile details:", err);
      alert("Failed to save account details. Make sure the backend is running!");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass-card account-card-wrapper" style={{ gridColumn: 'span 12' }}>
      <div className="account-header">
        <h2 className="card-title">Account Profile Settings</h2>
        <p className="card-subtitle">Manage your personal demographics, body metrics, and synced application username.</p>
      </div>

      <div className="account-grid-layout">
        {/* Left Side: Summary Widget */}
        <div className="account-summary-widget">
          <div className="avatar-large">{inputUsername ? inputUsername[0].toUpperCase() : 'U'}</div>
          <h3 className="profile-title">{username}</h3>
          <span className="profile-role-badge">Active Helthee User</span>

          <div className="stats-mini-summary">
            <div className="summary-item">
              <Award size={14} color="var(--accent-purple)" />
              <span>Current Streak: <strong>{stats?.current_streak || 0} days</strong></span>
            </div>
            <div className="summary-item">
              <User size={14} color="var(--accent-cyan)" />
              <span>Gender: <strong>{gender.charAt(0).toUpperCase() + gender.slice(1)}</strong></span>
            </div>
            <div className="summary-item">
              <Calendar size={14} color="var(--accent-amber)" />
              <span>Age: <strong>{age} years old</strong></span>
            </div>
            <div className="summary-item">
              <Ruler size={14} color="var(--accent-emerald)" />
              <span>Height: <strong>{getFormattedHeight()}</strong></span>
            </div>
            <div className="summary-item">
              <Scale size={14} color="var(--accent-coral)" />
              <span>Weight: <strong>{getFormattedWeight()}</strong></span>
            </div>
          </div>
        </div>

        {/* Right Side: Account Settings Form */}
        <form onSubmit={handleSave} className="account-settings-form">
          <div className="form-row-header">
            <h4 className="section-subtitle-inner">Personal Details</h4>
            
            <div className="unit-toggle">
              <button 
                type="button"
                className={`toggle-tab-btn ${unitSystem === 'metric' ? 'active' : ''}`}
                onClick={() => setUnitSystem('metric')}
              >
                Metric
              </button>
              <button 
                type="button"
                className={`toggle-tab-btn ${unitSystem === 'imperial' ? 'active' : ''}`}
                onClick={() => setUnitSystem('imperial')}
              >
                Imperial
              </button>
            </div>
          </div>

          {/* Username */}
          <div className="form-group-custom">
            <label className="group-title">Helthee Username</label>
            <input 
              type="text" 
              className="location-input"
              value={inputUsername}
              onChange={(e) => setInputUsername(e.target.value)}
              placeholder="Enter username (e.g. chirag)"
              required
            />
            <span className="input-helper-text">Changing your username shifts your logs to a new database profile.</span>
          </div>

          {/* Gender */}
          <div className="form-group-custom">
            <span className="group-title">Gender</span>
            <div className="gender-cards-row">
              <div 
                className={`gender-card-option ${gender === 'male' ? 'active' : ''}`}
                onClick={() => setGender('male')}
              >
                <Mars size={18} className="gender-icon male" />
                <span>Male</span>
              </div>
              <div 
                className={`gender-card-option ${gender === 'female' ? 'active' : ''}`}
                onClick={() => setGender('female')}
              >
                <Venus size={18} className="gender-icon female" />
                <span>Female</span>
              </div>
            </div>
          </div>

          {/* Age */}
          <div className="form-group-custom">
            <div className="input-header-row">
              <span className="input-title-with-icon">
                <Calendar size={14} />
                <span>Age</span>
              </span>
              <span className="input-value-text">{age} years</span>
            </div>
            <input 
              type="range"
              min="10"
              max="90"
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              className="custom-range-slider"
            />
          </div>

          {/* Height */}
          <div className="form-group-custom">
            <div className="input-header-row">
              <span className="input-title-with-icon">
                <Ruler size={14} />
                <span>Height</span>
              </span>
              <span className="input-value-text">{getFormattedHeight()}</span>
            </div>
            {unitSystem === 'metric' ? (
              <input 
                type="range"
                min="100"
                max="220"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="custom-range-slider height-slider"
              />
            ) : (
              <input 
                type="range"
                min="40"
                max="88"
                value={Math.round(height / 2.54)}
                onChange={(e) => setHeight(Number(e.target.value) * 2.54)}
                className="custom-range-slider height-slider"
              />
            )}
          </div>

          {/* Weight */}
          <div className="form-group-custom">
            <div className="input-header-row">
              <span className="input-title-with-icon">
                <Scale size={14} />
                <span>Weight</span>
              </span>
              <span className="input-value-text">{getFormattedWeight()}</span>
            </div>
            {unitSystem === 'metric' ? (
              <input 
                type="range"
                min="30"
                max="150"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="custom-range-slider weight-slider"
              />
            ) : (
              <input 
                type="range"
                min="66"
                max="330"
                value={Math.round(weight * 2.20462)}
                onChange={(e) => setWeight(Number(e.target.value) / 2.20462)}
                className="custom-range-slider weight-slider"
              />
            )}
          </div>

          <button type="submit" className="btn btn-primary save-account-btn" disabled={saving}>
            <Save size={16} />
            <span>{saving ? 'Saving changes...' : 'Save Profile Details'}</span>
          </button>

          {success && (
            <div className="success-banner">
              <Check size={16} color="var(--accent-purple)" />
              <span>Profile updated successfully! Sync complete.</span>
            </div>
          )}
        </form>
      </div>

      <style>{`
        .account-card-wrapper {
          display: flex;
          flex-direction: column;
          gap: 1.75rem;
          padding: 2rem;
          height: 100%;
        }
        .account-header {
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          padding-bottom: 1rem;
        }
        .account-grid-layout {
          display: grid;
          grid-template-columns: 0.8fr 1.2fr;
          gap: 3rem;
        }
        
        /* Summary widget */
        .account-summary-widget {
          display: flex;
          flex-direction: column;
          align-items: center;
          background: rgba(0, 0, 0, 0.02);
          border: 1px solid rgba(0, 0, 0, 0.04);
          border-radius: 16px;
          padding: 2rem 1.5rem;
          text-align: center;
          height: fit-content;
        }
        .avatar-large {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--accent-purple), var(--accent-cyan));
          color: white;
          font-family: var(--font-display);
          font-size: 2.2rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1rem;
          box-shadow: 0 4px 15px rgba(82, 183, 136, 0.2);
        }
        .profile-title {
          font-family: var(--font-display);
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 0.25rem;
        }
        .profile-role-badge {
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--accent-purple);
          background: rgba(82, 183, 136, 0.1);
          padding: 0.2rem 0.6rem;
          border-radius: 50px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 2rem;
        }
        .stats-mini-summary {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          width: 100%;
          border-top: 1px dashed rgba(0, 0, 0, 0.08);
          padding-top: 1.5rem;
        }
        .summary-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.85rem;
          color: var(--text-secondary);
          text-align: left;
        }
        .summary-item strong {
          color: var(--text-primary);
        }
        
        /* Settings form */
        .account-settings-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .form-row-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .section-subtitle-inner {
          font-family: var(--font-display);
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .input-helper-text {
          font-size: 0.7rem;
          color: var(--text-muted);
          margin-top: -0.25rem;
        }
        
        .save-account-btn {
          width: 100%;
          justify-content: center;
          padding: 0.7rem;
          font-size: 0.85rem;
          border-radius: 10px;
          margin-top: 1rem;
        }
        .success-banner {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          background: rgba(82, 183, 136, 0.08);
          border: 1px solid rgba(82, 183, 136, 0.2);
          color: var(--text-primary);
          font-size: 0.8rem;
          font-weight: 600;
          padding: 0.65rem;
          border-radius: 10px;
          animation: fadeIn 0.2s ease;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 768px) {
          .account-grid-layout {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
        }
      `}</style>
    </div>
  );
}
