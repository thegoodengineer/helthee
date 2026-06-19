import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw, Save } from 'lucide-react';

export default function BMICalculator({ stats, onRefresh, username }) {
  const [height, setHeight] = useState(175);
  const [weight, setWeight] = useState(70);
  const [bmi, setBmi] = useState(22.9);
  const [category, setCategory] = useState('Normal');
  const [advice, setAdvice] = useState('Maintain your active habits!');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (stats) {
      if (stats.height) setHeight(Math.round(stats.height));
      if (stats.weight) setWeight(Math.round(stats.weight));
    }
  }, [stats]);

  // Recalculate BMI in real-time when height/weight changes
  useEffect(() => {
    const heightM = height / 100;
    const computedBmi = weight / (heightM * heightM);
    const score = roundTo(computedBmi, 1);
    setBmi(score);
    
    // Categorize
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
  }, [height, weight]);

  const roundTo = (num, decimals) => {
    return Number(Math.round(num + 'e' + decimals) + 'e-' + decimals);
  };

  const handleSaveBmi = async () => {
    setSaving(true);
    try {
      const res = await fetch(`http://localhost:8000/api/bmi?username=${username}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ height, weight })
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

  // Calculate needle rotation angle based on BMI (clamped between 15 and 40)
  // BMI 15 -> -90 deg, BMI 40 -> +90 deg
  const getNeedleRotation = () => {
    const minBmi = 15;
    const maxBmi = 35;
    const clamped = Math.max(minBmi, Math.min(bmi, maxBmi));
    const percentage = (clamped - minBmi) / (maxBmi - minBmi);
    return (percentage * 180) - 90; // degrees
  };

  const getCategoryColorClass = () => {
    if (category === 'Underweight') return 'text-amber';
    if (category === 'Normal Weight') return 'text-emerald';
    if (category === 'Overweight') return 'text-orange';
    return 'text-red';
  };

  return (
    <div className="glass-card bmi-card" style={{ gridColumn: 'span 6' }}>
      <h2 className="card-title">BMI Calculator</h2>
      <p className="card-subtitle">Calculate your Body Mass Index (BMI) and discover customized health suggestions.</p>

      <div className="bmi-gauge-container">
        <svg viewBox="0 0 200 120" className="gauge-svg">
          {/* Colors Arcs */}
          <path d="M20,100 A80,80 0 0,1 60,30" fill="none" stroke="#ffd166" strokeWidth="12" strokeLinecap="round" /> {/* Underweight */}
          <path d="M63,28 A80,80 0 0,1 137,28" fill="none" stroke="#06d6a0" strokeWidth="12" /> {/* Normal */}
          <path d="M140,30 A80,80 0 0,1 180,100" fill="none" stroke="#ff5a5f" strokeWidth="12" strokeLinecap="round" /> {/* Overweight / Obese */}
          
          {/* Needle */}
          <line 
            x1="100" y1="100" 
            x2="100" y2="40" 
            stroke="#ffffff" 
            strokeWidth="3" 
            strokeLinecap="round" 
            style={{ 
              transform: `rotate(${getNeedleRotation()}deg)`,
              transformOrigin: '100px 100px',
              transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          />
          <circle cx="100" cy="100" r="8" fill="#ffffff" />
          <circle cx="100" cy="100" r="4" fill="#070b19" />
        </svg>

        <div className="bmi-score-box">
          <div className="score-value">{bmi}</div>
          <div className={`score-category ${getCategoryColorClass()}`}>{category}</div>
        </div>
      </div>

      <div className="sliders-section">
        <div className="slider-group">
          <div className="slider-label">
            <span>Height</span>
            <span className="value-label">{height} cm</span>
          </div>
          <input 
            type="range" 
            min="100" 
            max="220" 
            value={height} 
            onChange={(e) => setHeight(Number(e.target.value))}
            className="slider"
          />
        </div>

        <div className="slider-group">
          <div className="slider-label">
            <span>Weight</span>
            <span className="value-label">{weight} kg</span>
          </div>
          <input 
            type="range" 
            min="30" 
            max="150" 
            value={weight} 
            onChange={(e) => setWeight(Number(e.target.value))}
            className="slider"
          />
        </div>
      </div>

      <div className="advice-section">
        <div className="advice-header">
          <Activity size={16} />
          <span>Health Insights</span>
        </div>
        <p className="advice-text">{advice}</p>
      </div>

      <button className="btn btn-primary save-btn" onClick={handleSaveBmi} disabled={saving} style={{ marginTop: '1.25rem' }}>
        <Save size={18} />
        <span>{saving ? 'Saving...' : 'Sync BMI Profile'}</span>
      </button>

      <style>{`
        .bmi-card {
          display: flex;
          flex-direction: column;
        }
        .bmi-gauge-container {
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          height: 130px;
          margin-bottom: 1.25rem;
        }
        .gauge-svg {
          width: 200px;
          height: 120px;
        }
        .bmi-score-box {
          position: absolute;
          bottom: 0px;
          text-align: center;
        }
        .score-value {
          font-family: var(--font-display);
          font-size: 1.8rem;
          font-weight: 800;
          line-height: 1;
        }
        .score-category {
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
          margin-top: 0.15rem;
          letter-spacing: 0.5px;
        }
        
        .text-amber { color: var(--accent-amber); }
        .text-emerald { color: var(--accent-emerald); }
        .text-orange { color: #ff914d; }
        .text-red { color: var(--accent-coral); }
        
        .sliders-section {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          margin-bottom: 1.25rem;
        }
        .slider-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .slider-label {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-secondary);
        }
        .value-label {
          color: var(--text-primary);
          font-family: var(--font-display);
        }
        
        /* Slider styling */
        .slider {
          -webkit-appearance: none;
          width: 100%;
          height: 6px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.08);
          outline: none;
        }
        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--accent-purple);
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 0 10px rgba(157, 78, 221, 0.4);
          transition: transform 0.1s ease;
        }
        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }
        
        .advice-section {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 0.85rem;
          font-size: 0.8rem;
          line-height: 1.4;
        }
        .advice-header {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-weight: 700;
          color: var(--text-secondary);
          margin-bottom: 0.35rem;
          text-transform: uppercase;
          font-size: 0.75rem;
          letter-spacing: 0.5px;
        }
        .advice-text {
          color: var(--text-primary);
        }
        .save-btn {
          width: 100%;
          justify-content: center;
        }
      `}</style>
    </div>
  );
}
