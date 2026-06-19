import datetime
import random
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.database import (
    SessionLocal, init_db, User, StepLog, MealLog, 
    Competition, CompetitionParticipant
)

# Initialize database
init_db()

app = FastAPI(title="Helthee API", description="Backend APIs for Helthee Health & Fitness Framework")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In development, allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# DB Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Pydantic schemas
class StepLogSchema(BaseModel):
    steps: int
    date: str

class BMICalculatorSchema(BaseModel):
    height: float # cm
    weight: float # kg

class ChatMessageSchema(BaseModel):
    message: str

class JoinCompetitionSchema(BaseModel):
    competition_id: int

# Helpers
def get_tree_stage(streak: int) -> str:
    if streak == 0:
        return "Seed"
    elif streak < 3:
        return "Sprout"
    elif streak < 8:
        return "Sapling"
    elif streak < 15:
        return "Young Tree"
    elif streak < 30:
        return "Mature Tree"
    else:
        return "Blooming Tree"

# API ENDPOINTS

@app.get("/api/dashboard")
def get_dashboard(db: Session = Depends(get_db)):
    # Defaulting to the main user "Alex"
    user = db.query(User).filter(User.username == "Alex").first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    today = datetime.date.today().isoformat()
    today_steps = db.query(StepLog).filter(StepLog.user_id == user.id, StepLog.date == today).first()
    today_steps_count = today_steps.steps if today_steps else 0
    today_goal = today_steps.goal if today_steps else 10000
    
    # Calculate today's calories and macros
    today_meals = db.query(MealLog).filter(MealLog.user_id == user.id, MealLog.date == today).all()
    today_calories = sum(m.calories for m in today_meals)
    today_protein = sum(m.protein for m in today_meals)
    today_carbs = sum(m.carbs for m in today_meals)
    today_fat = sum(m.fat for m in today_meals)
    
    return {
        "user_id": user.id,
        "username": user.username,
        "current_streak": user.current_streak,
        "max_streak": user.max_streak,
        "tree_stage": get_tree_stage(user.current_streak),
        "height": user.height,
        "weight": user.weight,
        "today_steps": today_steps_count,
        "steps_goal": today_goal,
        "today_calories": today_calories,
        "today_macros": {
            "protein": today_protein,
            "carbs": today_carbs,
            "fat": today_fat
        }
    }

@app.post("/api/streak/increment")
def increment_streak(db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == "Alex").first()
    if not user:
         raise HTTPException(status_code=404, detail="User not found")
         
    today = datetime.date.today().isoformat()
    yesterday = (datetime.date.today() - datetime.timedelta(days=1)).isoformat()
    
    if user.last_active_date == today:
        # Already logged active status today
        return {"status": "already_logged", "current_streak": user.current_streak, "tree_stage": get_tree_stage(user.current_streak)}
        
    elif user.last_active_date == yesterday:
        # Continued streak
        user.current_streak += 1
        if user.current_streak > user.max_streak:
            user.max_streak = user.current_streak
    else:
        # Streak broken, reset
        user.current_streak = 1
        
    user.last_active_date = today
    db.commit()
    
    # Update active competition steps if any
    active_comp = db.query(Competition).first()
    if active_comp:
        participant = db.query(CompetitionParticipant).filter(
            CompetitionParticipant.competition_id == active_comp.id,
            CompetitionParticipant.user_id == user.id
        ).first()
        if participant:
            # Completing a streak activity grants a step bonus to competition
            participant.steps_logged += 1000
            db.commit()
            
    return {
        "status": "success",
        "current_streak": user.current_streak,
        "tree_stage": get_tree_stage(user.current_streak),
        "message": f"Activity logged! Streak is now {user.current_streak} days. Your streak tree is in the '{get_tree_stage(user.current_streak)}' stage."
    }

@app.get("/api/steps")
def get_steps_history(db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == "Alex").first()
    today = datetime.date.today()
    history = []
    
    for i in range(7):
        day = (today - datetime.timedelta(days=i)).isoformat()
        log = db.query(StepLog).filter(StepLog.user_id == user.id, StepLog.date == day).first()
        history.append({
            "date": day,
            "steps": log.steps if log else 0,
            "goal": log.goal if log else 10000
        })
    # Reverse to chronological order (oldest to newest)
    history.reverse()
    return history

@app.post("/api/steps")
def log_steps(data: StepLogSchema, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == "Alex").first()
    log = db.query(StepLog).filter(StepLog.user_id == user.id, StepLog.date == data.date).first()
    
    if log:
        diff = data.steps - log.steps
        log.steps = data.steps
    else:
        diff = data.steps
        log = StepLog(user_id=user.id, date=data.date, steps=data.steps, goal=10000)
        db.add(log)
        
    db.commit()
    
    # Update active competition steps
    active_comp = db.query(Competition).first()
    if active_comp and diff > 0:
        participant = db.query(CompetitionParticipant).filter(
            CompetitionParticipant.competition_id == active_comp.id,
            CompetitionParticipant.user_id == user.id
        ).first()
        if participant:
            participant.steps_logged += diff
            db.commit()
            
    return {"status": "success", "date": data.date, "steps": log.steps, "goal": log.goal}

class SamsungSyncSchema(BaseModel):
    steps: int
    date: str
    device_id: str

@app.post("/api/steps/samsung-sync")
def sync_samsung_steps(data: SamsungSyncSchema, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == "Alex").first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    log = db.query(StepLog).filter(StepLog.user_id == user.id, StepLog.date == data.date).first()
    
    if log:
        diff = data.steps - log.steps
        log.steps = data.steps
    else:
        diff = data.steps
        log = StepLog(user_id=user.id, date=data.date, steps=data.steps, goal=10000)
        db.add(log)
        
    db.commit()
    
    active_comp = db.query(Competition).first()
    if active_comp and diff > 0:
        participant = db.query(CompetitionParticipant).filter(
            CompetitionParticipant.competition_id == active_comp.id,
            CompetitionParticipant.user_id == user.id
        ).first()
        if participant:
            participant.steps_logged += diff
            db.commit()
            
    return {
        "status": "success", 
        "source": "Samsung Health Integration",
        "device_id": data.device_id,
        "date": data.date, 
        "steps": log.steps, 
        "goal": log.goal
    }

@app.post("/api/bmi")
def calculate_bmi(data: BMICalculatorSchema, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == "Alex").first()
    user.height = data.height
    user.weight = data.weight
    db.commit()
    
    height_m = data.height / 100
    bmi = data.weight / (height_m * height_m)
    bmi = round(bmi, 1)
    
    if bmi < 18.5:
        category = "Underweight"
        advice = "Focus on nutrient-dense foods, lean proteins, and strength training to build muscle mass safely."
    elif bmi < 25:
        category = "Normal Weight"
        advice = "Excellent! Maintain your balanced diet, stay hydrated, and continue regular aerobic and strength activities."
    elif bmi < 30:
        category = "Overweight"
        advice = "Consider a slight calorie deficit combined with increased physical activity like 10,000 steps daily."
    else:
        category = "Obese"
        advice = "Consult a health professional for personalized diet plans and focus on sustainable, low-impact exercise."
        
    return {
        "bmi": bmi,
        "category": category,
        "advice": advice,
        "height": data.height,
        "weight": data.weight
    }

@app.get("/api/meals")
def get_meals(db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == "Alex").first()
    today = datetime.date.today().isoformat()
    meals = db.query(MealLog).filter(MealLog.user_id == user.id, MealLog.date == today).all()
    return meals

@app.post("/api/meals")
def log_meal(
    meal_name: str = Form(...),
    photo: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.username == "Alex").first()
    today = datetime.date.today().isoformat()
    
    # Simple simulated nutritional parser based on keywords
    name_lower = meal_name.lower()
    calories = 300
    protein = 15.0
    carbs = 40.0
    fat = 10.0
    
    if "salad" in name_lower or "broccoli" in name_lower or "veg" in name_lower:
        calories = random.randint(180, 320)
        protein = round(random.uniform(5, 12), 1)
        carbs = round(random.uniform(10, 25), 1)
        fat = round(random.uniform(4, 10), 1)
    if "chicken" in name_lower or "salmon" in name_lower or "fish" in name_lower or "egg" in name_lower or "steak" in name_lower:
        calories = random.randint(380, 580)
        protein = round(random.uniform(30, 45), 1)
        carbs = round(random.uniform(5, 15), 1)
        fat = round(random.uniform(12, 22), 1)
    if "pizza" in name_lower or "burger" in name_lower or "pasta" in name_lower or "sandwich" in name_lower:
        calories = random.randint(550, 850)
        protein = round(random.uniform(18, 30), 1)
        carbs = round(random.uniform(60, 95), 1)
        fat = round(random.uniform(20, 38), 1)
    if "oatmeal" in name_lower or "toast" in name_lower or "banana" in name_lower or "fruit" in name_lower:
        calories = random.randint(250, 450)
        protein = round(random.uniform(8, 16), 1)
        carbs = round(random.uniform(45, 65), 1)
        fat = round(random.uniform(5, 12), 1)
        
    # Simulated Photo URL
    image_url = "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=500" # fallback
    if photo:
        # In mock backend, we use standard images depending on meal name
        if "chicken" in name_lower or "salmon" in name_lower or "steak" in name_lower:
            image_url = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500"
        elif "salad" in name_lower:
            image_url = "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500"
        elif "pizza" in name_lower or "pasta" in name_lower:
            image_url = "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500"
        else:
            image_url = "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=500"
            
    meal = MealLog(
        user_id=user.id,
        date=today,
        meal_name=meal_name,
        image_url=image_url,
        calories=calories,
        protein=protein,
        carbs=carbs,
        fat=fat
    )
    
    db.add(meal)
    db.commit()
    
    return {
        "status": "success",
        "meal": {
            "id": meal.id,
            "meal_name": meal.meal_name,
            "image_url": meal.image_url,
            "calories": meal.calories,
            "protein": meal.protein,
            "carbs": meal.carbs,
            "fat": meal.fat
        }
    }

@app.post("/api/chat")
def chat_gpt(data: ChatMessageSchema, db: Session = Depends(get_db)):
    msg = data.message.lower()
    
    responses = [
        "To maximize your progress, try eating high-quality protein (like chicken breast, salmon, or tofu) within 2 hours of your workout.",
        "Walking 10,000 steps a day burns approximately 300-500 extra calories and greatly improves cardiovascular health.",
        "Your streak tree looks healthy! Consistency is key. Even a 5-minute walk keeps your streak alive.",
        "To lower your BMI safely, combine a moderate calorie deficit with dynamic strength training to protect muscle tissue.",
        "Make sure to drink 3-4 liters of water on active days to optimize muscle recovery and maintain cognitive focus.",
        "Tracking meals helps you identify hidden fats and added sugars. Your recent logs show solid progress!"
    ]
    
    # Simple rule-based intelligent routing
    if "step" in msg or "walk" in msg:
        reply = "Steps are crucial for steady cardiovascular improvements! Try taking small walking breaks every 2 hours, or park farther away to squeeze in an extra 1,500 steps today. You can track your total steps in the Steps Log module!"
    elif "bmi" in msg or "weight" in msg:
        reply = "BMI measures relative weight based on height. A healthy BMI is between 18.5 and 24.9. If you want to adjust your numbers, try tracking your daily steps and logging your meals for a week. Use our BMI calculator slider to view personalized stats!"
    elif "meal" in msg or "eat" in msg or "diet" in msg or "calorie" in msg:
        reply = "A balanced diet consists of roughly 40% carbs, 30% protein, and 30% fat. Try logging a meal using our Meal Photo uploader to instantly estimate your macro breakdown and see if you are hit your goal."
    elif "streak" in msg or "tree" in msg:
        reply = "Your Streak Tree reflects your commitment! Log your activity daily to water the tree. It will grow from a small seed all the way to a blooming tree at 30 days! Missing a day resets the tree to a seed."
    elif "competition" in msg or "challenge" in msg or "friend" in msg:
        reply = "Join the active step challenge in the Competitions panel to compare your progress against friends! The leaderboard updates in real-time as you log steps."
    else:
        reply = f"Hello! I am HelpGPT, your AI Health & Wellness Assistant. {random.choice(responses)}"
        
    return {"reply": reply}

@app.get("/api/competitions")
def get_competitions(db: Session = Depends(get_db)):
    comp = db.query(Competition).first()
    if not comp:
        return {"competition": None, "leaderboard": []}
        
    participants = db.query(CompetitionParticipant).filter(
        CompetitionParticipant.competition_id == comp.id
    ).all()
    
    # Build leaderboard sorted by steps
    leaderboard = []
    for p in participants:
        leaderboard.append({
            "username": p.user.username,
            "steps": p.steps_logged,
            "is_me": p.user.username == "Alex"
        })
    leaderboard.sort(key=lambda x: x["steps"], reverse=True)
    
    # Assign ranks
    for index, p in enumerate(leaderboard):
        p["rank"] = index + 1
        
    return {
        "competition": {
            "id": comp.id,
            "name": comp.name,
            "description": comp.description,
            "start_date": comp.start_date,
            "end_date": comp.end_date
        },
        "leaderboard": leaderboard
    }

@app.post("/api/competitions/join")
def join_competition(data: JoinCompetitionSchema, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == "Alex").first()
    # Check if already joined
    exists = db.query(CompetitionParticipant).filter(
        CompetitionParticipant.competition_id == data.competition_id,
        CompetitionParticipant.user_id == user.id
    ).first()
    
    if exists:
        return {"status": "already_joined"}
        
    participant = CompetitionParticipant(
        competition_id=data.competition_id,
        user_id=user.id,
        steps_logged=0
    )
    db.add(participant)
    db.commit()
    return {"status": "success"}

@app.get("/api/weekly-report")
def get_weekly_report(db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == "Alex").first()
    today = datetime.date.today()
    
    daily_stats = []
    total_steps = 0
    total_calories = 0
    active_days_count = 0
    
    for i in range(7):
        day = (today - datetime.timedelta(days=i)).isoformat()
        
        # Steps
        steps_log = db.query(StepLog).filter(StepLog.user_id == user.id, StepLog.date == day).first()
        steps = steps_log.steps if steps_log else 0
        total_steps += steps
        if steps > 3000: # threshold for active day
            active_days_count += 1
            
        # Calories
        meal_logs = db.query(MealLog).filter(MealLog.user_id == user.id, MealLog.date == day).all()
        calories = sum(m.calories for m in meal_logs)
        total_calories += calories
        
        # Format day name (e.g. "Mon")
        date_obj = today - datetime.timedelta(days=i)
        day_name = date_obj.strftime("%a")
        
        daily_stats.append({
            "date": day,
            "day": day_name,
            "steps": steps,
            "calories": calories
        })
        
    daily_stats.reverse()
    
    # Calculate averages
    avg_steps = round(total_steps / 7)
    avg_calories = round(total_calories / 7)
    
    # Determine weekly achievements
    achievements = []
    if total_steps > 50000:
        achievements.append({"title": "Half Century Walker", "desc": "Walked over 50,000 steps this week!", "unlocked": True})
    else:
        achievements.append({"title": "Half Century Walker", "desc": "Walked over 50,000 steps this week!", "unlocked": False})
        
    if active_days_count >= 5:
        achievements.append({"title": "Streak tree Supporter", "desc": "Kept your streak active for at least 5 days!", "unlocked": True})
    else:
        achievements.append({"title": "Streak tree Supporter", "desc": "Kept your streak active for at least 5 days!", "unlocked": False})
        
    if avg_calories in range(1200, 2500) and total_calories > 0:
        achievements.append({"title": "Balanced Fuel", "desc": "Maintained healthy daily nutrition averages.", "unlocked": True})
    else:
        achievements.append({"title": "Balanced Fuel", "desc": "Maintained healthy daily nutrition averages.", "unlocked": False})

    return {
        "summary": {
            "total_steps": total_steps,
            "average_steps": avg_steps,
            "total_calories": total_calories,
            "average_calories": avg_calories,
            "active_days": active_days_count,
            "tree_stage": get_tree_stage(user.current_streak),
            "streak": user.current_streak
        },
        "daily_stats": daily_stats,
        "achievements": achievements
    }
