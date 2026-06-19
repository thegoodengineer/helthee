import React, { useState, useEffect } from 'react';
import { Camera, Plus, PlusCircle, Check, Loader2, Utensils } from 'lucide-react';

export default function MealPhoto({ stats, onRefresh, username }) {
  const [meals, setMeals] = useState([]);
  const [mealName, setMealName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchMeals();
  }, [username]);

  const fetchMeals = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/meals?username=${username}`);
      const data = await res.json();
      setMeals(data);
    } catch (err) {
      console.error("Error fetching meals:", err);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleMealSubmit = async (e) => {
    e.preventDefault();
    if (!mealName.trim() || uploading) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('meal_name', mealName);
    formData.append('username', username);
    if (selectedFile) {
      formData.append('photo', selectedFile);
    }

    try {
      const res = await fetch('http://localhost:8000/api/meals', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      
      setSuccess(true);
      setMealName('');
      setSelectedFile(null);
      setPreviewUrl(null);
      
      // Refresh list
      fetchMeals();
      onRefresh();
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving meal:", err);
      alert("Failed to log meal. Make sure the backend is running!");
    } finally {
      setUploading(false);
    }
  };

  // Compute stats
  const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0);
  const totalProtein = meals.reduce((sum, m) => sum + m.protein, 0);
  const totalCarbs = meals.reduce((sum, m) => sum + m.carbs, 0);
  const totalFat = meals.reduce((sum, m) => sum + m.fat, 0);

  const calGoal = 2000;
  const calPercent = Math.min((totalCalories / calGoal) * 100, 100);

  return (
    <div className="glass-card meal-photo-card" style={{ gridColumn: 'span 6' }}>
      <h2 className="card-title">Meal Photo Log</h2>
      <p className="card-subtitle">Snap a picture of your meal to analyze calories and keep your diet on track.</p>
      
      <div className="meal-stats-grid">
        <div className="calorie-summary-box">
          <div className="cal-label">Total Intake</div>
          <div className="cal-value text-gradient-emerald">{totalCalories} <span className="unit">kcal</span></div>
          <div className="cal-progress">
            <div className="cal-bar" style={{ width: `${calPercent}%` }} />
          </div>
          <div className="cal-goal">Goal: {calGoal} kcal</div>
        </div>

        <div className="macro-summaries">
          <div className="macro-box protein">
            <span className="label">Protein</span>
            <span className="val">{totalProtein.toFixed(1)}g</span>
          </div>
          <div className="macro-box carbs">
            <span className="label">Carbs</span>
            <span className="val">{totalCarbs.toFixed(1)}g</span>
          </div>
          <div className="macro-box fat">
            <span className="label">Fat</span>
            <span className="val">{totalFat.toFixed(1)}g</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleMealSubmit} className="meal-upload-form">
        <div className="photo-upload-container">
          <input 
            type="file" 
            id="meal-photo-input" 
            accept="image/*" 
            style={{ display: 'none' }} 
            onChange={handleFileChange}
          />
          {previewUrl ? (
            <div className="preview-container" onClick={() => document.getElementById('meal-photo-input').click()}>
              <img src={previewUrl} alt="Meal Preview" className="photo-preview" />
              <div className="change-photo-overlay">
                <Camera size={20} />
                <span>Change Photo</span>
              </div>
            </div>
          ) : (
            <label htmlFor="meal-photo-input" className="upload-placeholder">
              <Camera size={32} className="camera-icon" />
              <span className="upload-title">Add Meal Photo</span>
              <span className="upload-desc">Supports JPG, PNG or Camera snap</span>
            </label>
          )}
        </div>

        <div className="input-group">
          <input 
            type="text" 
            placeholder="What did you eat? (e.g. Grilled Chicken Salad)" 
            value={mealName}
            onChange={(e) => setMealName(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-primary log-btn" disabled={uploading || !mealName.trim()}>
            {uploading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : success ? (
              <Check size={18} />
            ) : (
              <PlusCircle size={18} />
            )}
            <span>{uploading ? 'Analyzing...' : success ? 'Logged!' : 'Log Meal'}</span>
          </button>
        </div>
      </form>

      <div className="logged-meals-section">
        <h4>Today's Logged Meals</h4>
        {meals.length === 0 ? (
          <div className="empty-meals">
            <Utensils size={24} />
            <span>No meals logged today yet</span>
          </div>
        ) : (
          <div className="meals-list">
            {meals.map((meal) => (
              <div key={meal.id} className="meal-item">
                <img src={meal.image_url} alt={meal.meal_name} className="meal-img" />
                <div className="meal-details">
                  <h5>{meal.meal_name}</h5>
                  <div className="meal-macros">
                    <span>{meal.calories} kcal</span>
                    <span className="dot" />
                    <span>P: {meal.protein}g</span>
                    <span className="dot" />
                    <span>C: {meal.carbs}g</span>
                    <span className="dot" />
                    <span>F: {meal.fat}g</span>
                  </div>
                  {meal.description && (
                    <p className="meal-desc">
                      {meal.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .meal-photo-card {
          display: flex;
          flex-direction: column;
        }
        .meal-stats-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }
        .calorie-summary-box {
          background: rgba(0, 0, 0, 0.02);
          border: 1px solid rgba(0, 0, 0, 0.05);
          border-radius: 14px;
          padding: 1.25rem;
        }
        .cal-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-secondary);
          text-transform: uppercase;
        }
        .cal-value {
          font-family: var(--font-display);
          font-size: 1.8rem;
          font-weight: 800;
          margin: 0.25rem 0;
        }
        .cal-value .unit {
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--text-secondary);
        }
        .cal-progress {
          height: 6px;
          background: rgba(0, 0, 0, 0.05);
          border-radius: 10px;
          margin-bottom: 0.4rem;
          overflow: hidden;
        }
        .cal-bar {
          height: 100%;
          background: var(--accent-cyan);
          border-radius: 10px;
          transition: width 0.5s ease;
        }
        .cal-goal {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 600;
        }
        
        .macro-summaries {
          display: flex;
          flex-direction: column;
          gap: 0.55rem;
        }
        .macro-box {
          display: flex;
          justify-content: space-between;
          padding: 0.55rem 0.85rem;
          border-radius: 10px;
          font-size: 0.85rem;
          font-weight: 700;
        }
        .macro-box.protein {
          background: rgba(217, 56, 56, 0.08);
          border: 1px solid rgba(217, 56, 56, 0.2);
          color: #c92a2a;
        }
        .macro-box.carbs {
          background: rgba(181, 141, 29, 0.08);
          border: 1px solid rgba(181, 141, 29, 0.2);
          color: #9c6f15;
        }
        .macro-box.fat {
          background: rgba(82, 183, 136, 0.08);
          border: 1px solid rgba(82, 183, 136, 0.2);
          color: #2d6a4f;
        }
        
        .photo-upload-container {
          height: 130px;
          background: rgba(0, 0, 0, 0.02);
          border: 1px dashed rgba(0, 0, 0, 0.12);
          border-radius: 14px;
          overflow: hidden;
          margin-bottom: 0.75rem;
          cursor: pointer;
          transition: var(--transition-smooth);
        }
        .photo-upload-container:hover {
          border-color: var(--accent-cyan);
          background: rgba(82, 183, 136, 0.03);
        }
        .upload-placeholder {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .camera-icon {
          color: var(--text-muted);
          margin-bottom: 0.25rem;
        }
        .upload-title {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .upload-desc {
          font-size: 0.7rem;
          color: var(--text-muted);
        }
        
        .preview-container {
          width: 100%;
          height: 100%;
          position: relative;
        }
        .photo-preview {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .change-photo-overlay {
          position: absolute;
          top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(0, 0, 0, 0.4);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.25rem;
          opacity: 0;
          transition: var(--transition-smooth);
          color: white;
          font-size: 0.8rem;
          font-weight: 600;
        }
        .preview-container:hover .change-photo-overlay {
          opacity: 1;
        }
        
        .input-group {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.25rem;
        }
        .input-group input {
          flex-grow: 1;
          background: rgba(0, 0, 0, 0.02);
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 10px;
          padding: 0.65rem 0.9rem;
          font-family: var(--font-primary);
          font-size: 0.9rem;
          color: var(--text-primary);
          outline: none;
          transition: var(--transition-smooth);
        }
        .input-group input:focus {
          border-color: var(--accent-cyan);
          background: white;
          box-shadow: 0 0 0 3px rgba(82, 183, 136, 0.15);
        }
        .log-btn {
          flex-shrink: 0;
          padding: 0.65rem 1.25rem;
          font-size: 0.85rem;
        }
        
        .logged-meals-section h4 {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 0.75rem;
        }
        .empty-meals {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem;
          background: rgba(0, 0, 0, 0.01);
          border: 1px dashed rgba(0, 0, 0, 0.08);
          border-radius: 12px;
          color: var(--text-muted);
          font-size: 0.8rem;
          gap: 0.4rem;
        }
        .meals-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          max-height: 250px;
          overflow-y: auto;
        }
        .meal-item {
          display: flex;
          align-items: flex-start;
          gap: 0.85rem;
          background: rgba(0, 0, 0, 0.02);
          border: 1px solid rgba(0, 0, 0, 0.04);
          padding: 0.75rem;
          border-radius: 12px;
          transition: var(--transition-smooth);
        }
        .meal-item:hover {
          background: rgba(82, 183, 136, 0.03);
          border-color: rgba(82, 183, 136, 0.15);
        }
        .meal-img {
          width: 54px;
          height: 54px;
          border-radius: 10px;
          object-fit: cover;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .meal-details {
          flex-grow: 1;
        }
        .meal-details h5 {
          font-size: 0.95rem;
          font-weight: 700;
          margin-bottom: 0.2rem;
          color: var(--text-primary);
        }
        .meal-macros {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.75rem;
          color: var(--text-secondary);
          font-weight: 600;
        }
        .meal-macros .dot {
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background-color: var(--text-muted);
        }
        .meal-desc {
          margin-top: 0.35rem;
          line-height: 1.4;
          font-size: 0.8rem;
          color: var(--text-secondary);
          font-style: italic;
        }
        
        .animate-spin {
          animation: rotateRing 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
