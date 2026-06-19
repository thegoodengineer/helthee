import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw, Save, Mars, Venus, Scale, Ruler, Calendar, Flame, Percent } from 'lucide-react';

export default function BMICalculator({ stats, onRefresh, username }) {
  const [unitSystem, setUnitSystem] = useState('metric'); // 'metric' | 'imperial'
  const [gender, setGender] = useState('male'); // 'male' | 'female'
  const [age, setAge] = useState(28);
  const [height, setHeight] = useState(175); // in cm
  const [weight, setWeight] = useState(70); // in kg
  
  const [bmi, setBmi] = useState(22.9);
  const [category, setCategory] = useState('Normal Weight');
  const [advice, setAdvice] = useState('Maintain your active habits!');
  const [bodyFat, setBodyFat] = useState(18.5);
  const [bmr, setBmr] = useState(1650);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (stats) {
      if (stats.height) setHeight(Math.round(stats.height));
      if (stats.weight) setWeight(Math.round(stats.weight));
      if (stats.age) setAge(stats.age);
      if (stats.gender) setGender(stats.gender);
    }
  }, [stats]);

  // Recalculate BMI, Body Fat, and BMR in real-time
  useEffect(() => {
    const heightM = height / 100;
    const computedBmi = weight / (heightM * heightM);
    const score = roundTo(computedBmi, 1);
    setBmi(score);
    
    // Categorize and provide advice
    if (score < 18.5) {
      setCategory('Underweight');
      setAdvice('Focus on nutrient-dense meals, lean protein, and strength exercises to build muscle.');
    } else if (score < 25) {
      setCategory('Normal Weight');
      setAdvice('Great job! Keep up the balanced diet, hydration, and regular exercise.');
    } else if (score < 30) {
      setCategory('Overweight');
      setAdvice('Incorporate minor caloric deficits along with 10k daily steps to burn fat.');
    } else {
      setCategory('Obese');
      setAdvice('Consider consults with doctors, safe low-impact activities (swimming/walking), and high-fiber foods.');
    }

    // Body Fat Percentage (BFP) Adult Formula:
    // Males: 1.20 * BMI + 0.23 * Age - 16.2
    // Females: 1.20 * BMI + 0.23 * Age - 5.4
    const genderFactor = gender === 'male' ? 16.2 : 5.4;
    const computedBfp = (1.20 * score) + (0.23 * age) - genderFactor;
    setBodyFat(Math.max(2, roundTo(computedBfp, 1)));

    // BMR (Mifflin-St Jeor Equation)
    // Males: 10 * weight (kg) + 6.25 * height (cm) - 5 * age + 5
    // Females: 10 * weight (kg) + 6.25 * height (cm) - 5 * age - 161
    const genderBmrOffset = gender === 'male' ? 5 : -161;
    const computedBmr = (10 * weight) + (6.25 * height) - (5 * age) + genderBmrOffset;
    setBmr(Math.round(computedBmr));

  }, [height, weight, age, gender]);

  const roundTo = (num, decimals) => {
    return Number(Math.round(num + 'e' + decimals) + 'e-' + decimals);
  };

  const handleSaveBmi = async () => {
    setSaving(true);
    try {
      const res = await fetch(`http://localhost:8000/api/bmi?username=${username}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ height, weight, age, gender })
      });
      const data = await res.json();
      setBmi(data.bmi);
      setCategory(data.category);
      setAdvice(data.advice);
      onRefresh();
    } catch (err) {
      console.error("Error saving BMI:", err);
      alert("Failed to save BMI stats. Make sure the backend is running!");
    } finally {
      setSaving(false);
    }
  };

  // Clamp BMI between 15 and 35 for gauge rotation
  const getNeedleRotation = () => {
    const minBmi = 15;
    const maxBmi = 35;
    const clamped = Math.max(minBmi, Math.min(bmi, maxBmi));
    const percentage = (clamped - minBmi) / (maxBmi - minBmi);
    return (percentage * 180) - 90; // degrees
  };

  const getCategoryColorClass = () => {
    if (category === 'Underweight') return 'text-amber';
    if (category === 'Normal Weight' || category === 'Normal') return 'text-emerald';
    if (category === 'Overweight') return 'text-orange';
    return 'text-red';
  };

  // Convert height/weight display values
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

  return (
    <div className="glass-card bmi-card-expanded" style={{ gridColumn: 'span 12' }}>
      <div className="bmi-header-row">
        <div>
          <h2 className="card-title">Body Metrics & BMI Calculator</h2>
          <p className="card-subtitle">Enter your age, gender, and metrics to calculate BMI, Body Fat, and BMR.</p>
        </div>
        
        <div className="unit-toggle">
          <button 
            className={`toggle-tab-btn ${unitSystem === 'metric' ? 'active' : ''}`}
            onClick={() => setUnitSystem('metric')}
          >
            Metric
          </button>
          <button 
            className={`toggle-tab-btn ${unitSystem === 'imperial' ? 'active' : ''}`}
            onClick={() => setUnitSystem('imperial')}
          >
            Imperial
          </button>
        </div>
      </div>

      <div className="bmi-grid-layout">
        {/* Left Panel: Inputs */}
        <div className="bmi-input-panel">
          {/* Gender cards */}
          <div className="form-group-custom">
            <span className="group-title">Gender</span>
            <div className="gender-cards-row">
              <div 
                className={`gender-card-option ${gender === 'male' ? 'active' : ''}`}
                onClick={() => setGender('male')}
              >
                <Mars size={20} className="gender-icon male" />
                <span>Male</span>
              </div>
              <div 
                className={`gender-card-option ${gender === 'female' ? 'active' : ''}`}
                onClick={() => setGender('female')}
              >
                <Venus size={20} className="gender-icon female" />
                <span>Female</span>
              </div>
            </div>
          </div>

          {/* Age selection */}
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

          {/* Height selection */}
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
                min="40" // ~101cm
                max="88" // ~223cm
                value={Math.round(height / 2.54)}
                onChange={(e) => setHeight(Number(e.target.value) * 2.54)}
                className="custom-range-slider height-slider"
              />
            )}
          </div>

          {/* Weight selection */}
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
                min="66" // ~30kg
                max="330" // ~150kg
                value={Math.round(weight * 2.20462)}
                onChange={(e) => setWeight(Number(e.target.value) / 2.20462)}
                className="custom-range-slider weight-slider"
              />
            )}
          </div>
        </div>

        {/* Right Panel: Results & Gauges */}
        <div className="bmi-results-panel">
          <div className="gauge-section-box">
            <div className="bmi-gauge-holder">
              <svg viewBox="0 0 200 120" className="svg-gauge-dial">
                {/* Arc tracks */}
                <path d="M20,100 A80,80 0 0,1 60,30" fill="none" stroke="#ffd166" strokeWidth="12" strokeLinecap="round" />
                <path d="M63,28 A80,80 0 0,1 137,28" fill="none" stroke="#52b788" strokeWidth="12" />
                <path d="M140,30 A80,80 0 0,1 180,100" fill="none" stroke="#ff5a5f" strokeWidth="12" strokeLinecap="round" />
                
                {/* Dial needle */}
                <line 
                  x1="100" y1="100" 
                  x2="100" y2="40" 
                  stroke="#ffffff" 
                  strokeWidth="3.5" 
                  strokeLinecap="round" 
                  style={{ 
                    transform: `rotate(${getNeedleRotation()}deg)`,
                    transformOrigin: '100px 100px',
                    transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                />
                <circle cx="100" cy="100" r="8" fill="#ffffff" />
                <circle cx="100" cy="100" r="4" fill="#08100e" />
              </svg>

              <div className="score-label-overlay">
                <div className="score-digit">{bmi}</div>
                <div className={`score-badge ${getCategoryColorClass()}`}>{category}</div>
              </div>
            </div>
          </div>

          {/* Expanded Metrics Grid (BFP, BMR) */}
          <div className="health-metrics-grid">
            <div className="metric-card-inner">
              <div className="metric-icon-title">
                <Percent size={14} className="icon-gold" />
                <span>Est. Body Fat</span>
              </div>
              <div className="metric-big-value">{bodyFat}%</div>
              <div className="metric-subtext">Adult BFP Formula</div>
            </div>

            <div className="metric-card-inner">
              <div className="metric-icon-title">
                <Flame size={14} className="icon-coral" />
                <span>Daily BMR</span>
              </div>
              <div className="metric-big-value">{bmr.toLocaleString()}</div>
              <div className="metric-subtext">kcal/day (Mifflin)</div>
            </div>
          </div>

          {/* Advice card */}
          <div className="insights-panel-inner">
            <div className="insights-header-inner">
              <Activity size={16} color="var(--accent-cyan)" />
              <span>Personalized Health Insights</span>
            </div>
            <p className="insights-text-inner">{advice}</p>
          </div>

          <button 
            className="btn btn-primary save-btn-custom" 
            onClick={handleSaveBmi} 
            disabled={saving}
          >
            <Save size={16} />
            <span>{saving ? 'Syncing...' : 'Save Metrics to Profile'}</span>
          </button>
        </div>
      </div>

      <style>{`
        .bmi-card-expanded {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          padding: 1.75rem;
          height: 100%;
          min-height: 500px;
        }
        .bmi-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          padding-bottom: 1rem;
        }
        .unit-toggle {
          display: flex;
          background: rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 0.2rem;
        }
        .toggle-tab-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.4rem 1rem;
          border-radius: 8px;
          cursor: pointer;
          transition: var(--transition-smooth);
        }
        .toggle-tab-btn.active {
          background: var(--accent-emerald);
          color: var(--text-primary);
          box-shadow: 0 4px 10px rgba(82, 183, 136, 0.25);
        }
        
        .bmi-grid-layout {
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 2.5rem;
        }
        
        /* Input Panel */
        .bmi-input-panel {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .form-group-custom {
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
        }
        .group-title {
          font-size: 0.8rem;
          font-weight: 800;
          text-transform: uppercase;
          color: var(--text-secondary);
          letter-spacing: 0.5px;
        }
        .gender-cards-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .gender-card-option {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.01);
          border: 1px solid rgba(255, 255, 255, 0.05);
          padding: 0.75rem;
          border-radius: 12px;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-secondary);
          transition: var(--transition-smooth);
        }
        .gender-card-option:hover {
          background: rgba(255, 255, 255, 0.03);
          border-color: rgba(255, 255, 255, 0.1);
        }
        .gender-card-option.active {
          background: rgba(82, 183, 136, 0.04);
          border-color: rgba(82, 183, 136, 0.3);
          color: var(--text-primary);
          box-shadow: inset 0 0 10px rgba(82, 183, 136, 0.05);
        }
        .gender-icon.male {
          color: var(--accent-cyan);
        }
        .gender-icon.female {
          color: var(--accent-purple);
        }
        
        .input-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .input-title-with-icon {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.8rem;
          font-weight: 800;
          text-transform: uppercase;
          color: var(--text-secondary);
          letter-spacing: 0.5px;
        }
        .input-value-text {
          font-family: var(--font-display);
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        
        /* Custom range sliders */
        .custom-range-slider {
          -webkit-appearance: none;
          width: 100%;
          height: 6px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.08);
          outline: none;
        }
        .custom-range-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--accent-emerald);
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 0 10px rgba(82, 183, 136, 0.4);
          transition: transform 0.1s ease;
        }
        .custom-range-slider::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }
        .custom-range-slider.height-slider::-webkit-slider-thumb {
          background: var(--accent-cyan);
          box-shadow: 0 0 10px rgba(78, 172, 221, 0.4);
        }
        .custom-range-slider.weight-slider::-webkit-slider-thumb {
          background: var(--accent-purple);
          box-shadow: 0 0 10px rgba(157, 78, 221, 0.4);
        }
        
        /* Results Panel */
        .bmi-results-panel {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          background: rgba(255, 255, 255, 0.01);
          border: 1px solid rgba(255, 255, 255, 0.03);
          border-radius: 16px;
          padding: 1.25rem;
        }
        .gauge-section-box {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .bmi-gauge-holder {
          display: flex;
          justify-content: center;
          align-items: center;
          position: relative;
          width: 200px;
          height: 120px;
        }
        .svg-gauge-dial {
          width: 200px;
          height: 120px;
        }
        .score-label-overlay {
          position: absolute;
          bottom: -5px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .score-digit {
          font-family: var(--font-display);
          font-size: 2rem;
          font-weight: 800;
          line-height: 1;
        }
        .score-badge {
          font-size: 0.7rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-top: 0.25rem;
        }
        
        .health-metrics-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .metric-card-inner {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .metric-icon-title {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .icon-gold { color: #ffd166; }
        .icon-coral { color: var(--accent-coral); }
        .metric-big-value {
          font-family: var(--font-display);
          font-size: 1.3rem;
          font-weight: 800;
          color: var(--text-primary);
        }
        .metric-subtext {
          font-size: 0.65rem;
          color: var(--text-muted);
        }
        
        .insights-panel-inner {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 0.75rem;
          font-size: 0.75rem;
          line-height: 1.45;
        }
        .insights-header-inner {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-weight: 800;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-size: 0.7rem;
          margin-bottom: 0.35rem;
        }
        .insights-text-inner {
          color: var(--text-primary);
        }
        .save-btn-custom {
          width: 100%;
          justify-content: center;
          padding: 0.6rem;
          font-size: 0.8rem;
          border-radius: 10px;
        }
        
        .text-amber { color: var(--accent-amber); }
        .text-emerald { color: var(--accent-emerald); }
        .text-orange { color: #ff914d; }
        .text-red { color: var(--accent-coral); }

        @media (max-width: 768px) {
          .bmi-grid-layout {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}
