import React, { useState, useEffect } from 'react';
import { Calendar, Award, CheckCircle, Lock, TrendingUp, BarChart3, HelpCircle } from 'lucide-react';

export default function WeeklyReport({ stats, refreshTrigger }) {
  const [report, setReport] = useState(null);
  const [chartMode, setChartMode] = useState('steps'); // 'steps' or 'calories'

  useEffect(() => {
    fetchWeeklyReport();
  }, [refreshTrigger]);

  const fetchWeeklyReport = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/weekly-report');
      const data = await res.json();
      setReport(data);
    } catch (err) {
      console.error("Error loading weekly report:", err);
    }
  };

  if (!report) {
    return (
      <div className="glass-card report-card loading" style={{ gridColumn: 'span 12' }}>
        <span>Loading weekly insights...</span>
      </div>
    );
  }

  const { summary, daily_stats, achievements } = report;

  // SVG Chart Dimensions
  const chartWidth = 500;
  const chartHeight = 150;
  const padding = 25;
  const graphWidth = chartWidth - padding * 2;
  const graphHeight = chartHeight - padding * 2;

  // Max calculations for graph scales
  const maxSteps = Math.max(...daily_stats.map(d => d.steps), 4000);
  const maxCalories = Math.max(...daily_stats.map(d => d.calories), 1500);

  // Render SVG Bar Chart for Steps
  const renderStepsChart = () => {
    const barWidth = 32;
    const spacing = (graphWidth - barWidth * 7) / 6;
    
    return (
      <svg className="custom-chart-svg" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
        {/* Grids */}
        <line x1={padding} y1={padding} x2={chartWidth - padding} y2={padding} stroke="rgba(255,255,255,0.03)" />
        <line x1={padding} y1={padding + graphHeight/2} x2={chartWidth - padding} y2={padding + graphHeight/2} stroke="rgba(255,255,255,0.03)" />
        <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="rgba(255,255,255,0.1)" />

        {/* Bars */}
        {daily_stats.map((d, index) => {
          const barHeight = (d.steps / maxSteps) * graphHeight;
          const x = padding + index * (barWidth + spacing);
          const y = chartHeight - padding - barHeight;
          const isGoalMet = d.steps >= 10000;

          return (
            <g key={d.date} className="chart-bar-group">
              {/* Tooltip on hover */}
              <title>{`${d.steps.toLocaleString()} steps`}</title>
              
              {/* Background trace */}
              <rect x={x} y={padding} width={barWidth} height={graphHeight} fill="rgba(255,255,255,0.01)" rx="4" />
              
              {/* Actual bar */}
              <rect 
                x={x} 
                y={y} 
                width={barWidth} 
                height={barHeight} 
                fill={isGoalMet ? 'url(#emeraldGrad)' : 'url(#purpleGrad)'} 
                rx="4"
                style={{ transformOrigin: `${x}px ${chartHeight - padding}px` }}
                className="animated-rect"
              />
              
              {/* Day label */}
              <text 
                x={x + barWidth/2} 
                y={chartHeight - 8} 
                textAnchor="middle" 
                fill="var(--text-secondary)" 
                fontSize="10"
                fontFamily="sans-serif"
              >
                {d.day}
              </text>

              {/* Value text above bar */}
              {d.steps > 0 && (
                <text 
                  x={x + barWidth/2} 
                  y={y - 5} 
                  textAnchor="middle" 
                  fill="var(--text-primary)" 
                  fontSize="8"
                  fontWeight="600"
                  fontFamily="sans-serif"
                >
                  {d.steps > 999 ? `${(d.steps / 1000).toFixed(1)}k` : d.steps}
                </text>
              )}
            </g>
          );
        })}

        <defs>
          <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-purple)" />
            <stop offset="100%" stopColor="rgba(157, 78, 221, 0.2)" />
          </linearGradient>
          <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-emerald)" />
            <stop offset="100%" stopColor="rgba(6, 214, 160, 0.2)" />
          </linearGradient>
        </defs>
      </svg>
    );
  };

  // Render SVG Line/Area Chart for Calories
  const renderCaloriesChart = () => {
    const spacing = graphWidth / 6;
    
    // Generate line points
    const points = daily_stats.map((d, index) => {
      const x = padding + index * spacing;
      const y = chartHeight - padding - (d.calories / maxCalories) * graphHeight;
      return { x, y };
    });

    const pathD = points.reduce((acc, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, "");

    const areaD = points.length > 0 
      ? `${pathD} L ${points[points.length - 1].x} ${chartHeight - padding} L ${points[0].x} ${chartHeight - padding} Z` 
      : "";

    return (
      <svg className="custom-chart-svg" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
        {/* Grids */}
        <line x1={padding} y1={padding} x2={chartWidth - padding} y2={padding} stroke="rgba(255,255,255,0.03)" />
        <line x1={padding} y1={padding + graphHeight/2} x2={chartWidth - padding} y2={padding + graphHeight/2} stroke="rgba(255,255,255,0.03)" />
        <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="rgba(255,255,255,0.1)" />

        {/* Filled Area */}
        {areaD && (
          <path d={areaD} fill="url(#cyanAreaGrad)" className="animated-path" />
        )}

        {/* Line */}
        {pathD && (
          <path d={pathD} fill="none" stroke="var(--accent-cyan)" strokeWidth="2.5" strokeLinecap="round" className="animated-path" />
        )}

        {/* Data Nodes */}
        {points.map((p, index) => {
          const d = daily_stats[index];
          return (
            <g key={d.date}>
              <title>{`${d.calories} kcal`}</title>
              <circle cx={p.x} cy={p.y} r="4" fill="var(--bg-dark)" stroke="var(--accent-cyan)" strokeWidth="2.5" />
              
              <text 
                x={p.x} 
                y={chartHeight - 8} 
                textAnchor="middle" 
                fill="var(--text-secondary)" 
                fontSize="10"
                fontFamily="sans-serif"
              >
                {d.day}
              </text>

              {d.calories > 0 && (
                <text 
                  x={p.x} 
                  y={p.y - 7} 
                  textAnchor="middle" 
                  fill="var(--text-primary)" 
                  fontSize="8"
                  fontWeight="600"
                  fontFamily="sans-serif"
                >
                  {d.calories}
                </text>
              )}
            </g>
          );
        })}

        <defs>
          <linearGradient id="cyanAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(0, 245, 212, 0.25)" />
            <stop offset="100%" stopColor="rgba(0, 245, 212, 0)" />
          </linearGradient>
        </defs>
      </svg>
    );
  };

  return (
    <div className="glass-card weekly-report-card" style={{ gridColumn: 'span 12' }}>
      <div className="report-header">
        <div className="title-section">
          <h2 className="card-title">Weekly Performance Report</h2>
          <p className="card-subtitle">Aggregated summary of your steps activity, nutrition limits, and habit consistency.</p>
        </div>
        <div className="chart-toggles">
          <button 
            className={`toggle-btn ${chartMode === 'steps' ? 'active' : ''}`}
            onClick={() => setChartMode('steps')}
          >
            Steps
          </button>
          <button 
            className={`toggle-btn ${chartMode === 'calories' ? 'active' : ''}`}
            onClick={() => setChartMode('calories')}
          >
            Calories
          </button>
        </div>
      </div>

      <div className="report-content-grid">
        <div className="weekly-stats-pane">
          <div className="stat-card">
            <span className="label">Weekly Steps</span>
            <span className="value text-gradient-purple">{summary.total_steps.toLocaleString()}</span>
            <span className="sublabel">Avg: {summary.average_steps.toLocaleString()}/day</span>
          </div>

          <div className="stat-card">
            <span className="label">Active Days</span>
            <span className="value text-gradient-cyan">{summary.active_days} <span className="unit">/ 7</span></span>
            <span className="sublabel">Threshold: 3k+ steps</span>
          </div>

          <div className="stat-card">
            <span className="label">Weekly Calories</span>
            <span className="value text-gradient-emerald">{summary.total_calories.toLocaleString()}</span>
            <span className="sublabel">Avg: {summary.average_calories.toLocaleString()}/day</span>
          </div>
        </div>

        <div className="chart-container-pane">
          {chartMode === 'steps' ? renderStepsChart() : renderCaloriesChart()}
        </div>
      </div>

      <div className="achievements-section">
        <h3>Weekly Achievements</h3>
        <div className="achievements-grid">
          {achievements.map((ach) => (
            <div key={ach.title} className={`achievement-card ${ach.unlocked ? 'unlocked' : 'locked'}`}>
              <div className="achievement-icon">
                {ach.unlocked ? <Award size={20} /> : <Lock size={20} />}
              </div>
              <div className="achievement-details">
                <h4>{ach.title}</h4>
                <p>{ach.desc}</p>
              </div>
              {ach.unlocked && <span className="unlocked-pill">UNLOCKED</span>}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .weekly-report-card {
          display: flex;
          flex-direction: column;
        }
        .report-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        
        .chart-toggles {
          display: flex;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid var(--border-card);
          padding: 0.25rem;
          border-radius: 8px;
        }
        .toggle-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          padding: 0.4rem 1rem;
          font-family: var(--font-primary);
          font-size: 0.8rem;
          font-weight: 600;
          border-radius: 6px;
          cursor: pointer;
          transition: var(--transition-smooth);
        }
        .toggle-btn:hover {
          color: var(--text-primary);
        }
        .toggle-btn.active {
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-primary);
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
        }
        
        .report-content-grid {
          display: grid;
          grid-template-columns: 1fr 2.5fr;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        
        .weekly-stats-pane {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .stat-card {
          background: rgba(255, 255, 255, 0.01);
          border: 1px solid rgba(255, 255, 255, 0.03);
          border-radius: 12px;
          padding: 1rem;
          display: flex;
          flex-direction: column;
        }
        .stat-card .label {
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .stat-card .value {
          font-family: var(--font-display);
          font-size: 1.5rem;
          font-weight: 800;
          margin: 0.2rem 0;
        }
        .stat-card .value .unit {
          font-size: 0.95rem;
          font-weight: 500;
          color: var(--text-muted);
        }
        .stat-card .sublabel {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 600;
        }
        
        .chart-container-pane {
          background: rgba(0, 0, 0, 0.15);
          border: 1px solid var(--border-card);
          border-radius: 16px;
          padding: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .custom-chart-svg {
          width: 100%;
          height: auto;
          overflow: visible;
        }
        
        /* Chart SVG animations */
        .animated-rect {
          animation: barGrow 1s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          transform: scaleY(0);
        }
        @keyframes barGrow {
          to { transform: scaleY(1); }
        }
        
        .animated-path {
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          animation: pathDraw 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        @keyframes pathDraw {
          to { stroke-dashoffset: 0; }
        }
        
        .achievements-section h3 {
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 0.75rem;
        }
        .achievements-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.75rem;
        }
        .achievement-card {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border-radius: 12px;
          border: 1px solid transparent;
          position: relative;
        }
        .achievement-card.unlocked {
          background: rgba(6, 214, 160, 0.03);
          border-color: rgba(6, 214, 160, 0.15);
        }
        .achievement-card.locked {
          background: rgba(255, 255, 255, 0.01);
          border-color: rgba(255, 255, 255, 0.03);
          opacity: 0.6;
        }
        .achievement-icon {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .unlocked .achievement-icon {
          background: rgba(6, 214, 160, 0.15);
          color: var(--accent-emerald);
        }
        .locked .achievement-icon {
          background: rgba(255, 255, 255, 0.04);
          color: var(--text-muted);
        }
        .achievement-details h4 {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 0.15rem;
        }
        .achievement-details p {
          font-size: 0.7rem;
          color: var(--text-secondary);
          line-height: 1.3;
        }
        .unlocked-pill {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          background: rgba(6, 214, 160, 0.1);
          color: var(--accent-emerald);
          font-size: 0.6rem;
          font-weight: 800;
          padding: 0.1rem 0.3rem;
          border-radius: 4px;
          letter-spacing: 0.5px;
        }
      `}</style>
    </div>
  );
}
