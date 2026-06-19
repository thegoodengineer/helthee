import datetime
import random
import math
import json
import urllib.request
import urllib.parse
import base64
import time
import os
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.database import (
    SessionLocal, init_db, User, StepLog, MealLog, 
    Competition, CompetitionParticipant
)

# Helper to load .env variables securely
def load_dotenv():
    if os.path.exists(".env"):
        with open(".env", "r") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                if "=" in line:
                    key, val = line.split("=", 1)
                    os.environ[key.strip()] = val.strip()

load_dotenv()

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

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# DB Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Helper functions for Geolocation & Geocoding
def calculate_haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    # Earth radius in kilometers
    R = 6371.0
    
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c

def reverse_geocode(lat: float, lon: float) -> str:
    url = f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}&format=json"
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "HeltheeApp/1.0 (contact@helthee.com)"}
    )
    try:
        with urllib.request.urlopen(req, timeout=3) as response:
            data = json.loads(response.read().decode())
            address = data.get("address", {})
            city = address.get("city") or address.get("town") or address.get("village") or address.get("suburb") or address.get("county") or "Unknown Location"
            return city
    except Exception as e:
        print(f"Error in reverse_geocode: {e}")
        return "Unknown Location"

def geocode_city(city_name: str) -> Optional[dict]:
    encoded_city = urllib.parse.quote(city_name)
    url = f"https://nominatim.openstreetmap.org/search?q={encoded_city}&format=json&limit=1"
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "HeltheeApp/1.0 (contact@helthee.com)"}
    )
    try:
        with urllib.request.urlopen(req, timeout=3) as response:
            data = json.loads(response.read().decode())
            if data:
                return {
                    "lat": float(data[0]["lat"]),
                    "lon": float(data[0]["lon"]),
                    "display_name": data[0]["display_name"].split(",")[0]
                }
    except Exception as e:
        print(f"Error in geocode_city: {e}")
    return None

# Pydantic schemas
class StepLogSchema(BaseModel):
    steps: int
    date: str

class BMICalculatorSchema(BaseModel):
    height: float # cm
    weight: float # kg
    age: Optional[int] = 28
    gender: Optional[str] = "male"

class ChatMessageSchema(BaseModel):
    message: str

class JoinCompetitionSchema(BaseModel):
    competition_id: int

class SamsungSyncSchema(BaseModel):
    steps: int
    date: str
    device_id: str
    username: str = "Alex"

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

def analyze_meal_with_gemini(meal_name: str, photo_bytes: Optional[bytes] = None, mime_type: Optional[str] = None) -> dict:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("Warning: GEMINI_API_KEY environment variable not set.")
        return {
            "calories": 350,
            "protein": 15.0,
            "carbs": 45.0,
            "fat": 12.0,
            "description": f"Estimated nutrition facts for {meal_name}."
        }
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    
    prompt = f"""
    Analyze the following meal:
    Name: {meal_name}
    
    If an image is provided, identify the food in the image and estimate its nutrition details.
    
    Return a JSON object with exactly the following keys:
    - "calories": integer (total calories in kcal)
    - "protein": float (in grams)
    - "carbs": float (in grams)
    - "fat": float (in grams)
    - "description": string (short description of the meal, estimated portion size, and ingredient breakdown)
    
    Do not wrap the JSON in markdown blocks. Return only raw JSON.
    """
    
    parts = [{"text": prompt}]
    
    if photo_bytes and mime_type:
        base64_data = base64.b64encode(photo_bytes).decode("utf-8")
        parts.append({
            "inlineData": {
                "mimeType": mime_type,
                "data": base64_data
            }
        })
        
    payload = {
        "contents": [{"parts": parts}],
        "generationConfig": {
            "responseMimeType": "application/json"
        }
    }
    
    req_data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=req_data,
        headers={"Content-Type": "application/json"}
    )
    
    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            res_json = json.loads(response.read().decode("utf-8"))
            text_response = res_json["candidates"][0]["content"]["parts"][0]["text"]
            return json.loads(text_response.strip())
    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        return {
            "calories": 350,
            "protein": 15.0,
            "carbs": 45.0,
            "fat": 12.0,
            "description": f"Estimated nutrition facts for {meal_name}."
        }

def get_or_create_user(db: Session, username: str) -> User:
    user = db.query(User).filter(User.username == username).first()
    if not user:
        # Create user with default stats
        user = User(
            username=username, 
            current_streak=0, 
            max_streak=0, 
            height=175.0, 
            weight=70.0,
            age=28,
            gender="male",
            last_active_date=None
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user

# API ENDPOINTS

@app.get("/api/dashboard")
def get_dashboard(username: str = "Alex", db: Session = Depends(get_db)):
    user = get_or_create_user(db, username)
        
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
        "age": user.age,
        "gender": user.gender,
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
def increment_streak(username: str = "Alex", db: Session = Depends(get_db)):
    user = get_or_create_user(db, username)
         
    today = datetime.date.today().isoformat()
    yesterday = (datetime.date.today() - datetime.timedelta(days=1)).isoformat()
    
    if user.last_active_date == today:
        return {"status": "already_logged", "current_streak": user.current_streak, "tree_stage": get_tree_stage(user.current_streak)}
        
    elif user.last_active_date == yesterday:
        user.current_streak += 1
        if user.current_streak > user.max_streak:
            user.max_streak = user.current_streak
    else:
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
            participant.steps_logged += 1000
            db.commit()
            
    return {
        "status": "success",
        "current_streak": user.current_streak,
        "tree_stage": get_tree_stage(user.current_streak),
        "message": f"Activity logged! Streak is now {user.current_streak} days. Your streak tree is in the '{get_tree_stage(user.current_streak)}' stage."
    }

@app.get("/api/steps")
def get_steps_history(username: str = "Alex", db: Session = Depends(get_db)):
    user = get_or_create_user(db, username)
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
    history.reverse()
    return history

@app.post("/api/steps")
def log_steps(data: StepLogSchema, username: str = "Alex", db: Session = Depends(get_db)):
    user = get_or_create_user(db, username)
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

@app.post("/api/steps/samsung-sync")
def sync_samsung_steps(data: SamsungSyncSchema, db: Session = Depends(get_db)):
    # Pull user based on device sent username parameter
    user = get_or_create_user(db, data.username)
        
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
        # Check if user is in active competition, if not join them
        participant = db.query(CompetitionParticipant).filter(
            CompetitionParticipant.competition_id == active_comp.id,
            CompetitionParticipant.user_id == user.id
        ).first()
        if not participant:
            participant = CompetitionParticipant(competition_id=active_comp.id, user_id=user.id, steps_logged=0)
            db.add(participant)
            db.commit()
        
        participant.steps_logged += diff
        db.commit()
            
    return {
        "status": "success", 
        "source": "Samsung Health Integration",
        "device_id": data.device_id,
        "date": data.date, 
        "steps": log.steps, 
        "goal": log.goal,
        "username": user.username
    }

@app.post("/api/steps/import-samsung-file")
def import_samsung_file(
    file: UploadFile = File(...), 
    username: str = Form("Alex"), 
    db: Session = Depends(get_db)
):
    import json
    import csv
    import io
    
    user = get_or_create_user(db, username)
        
    filename = file.filename.lower()
    content = file.file.read()
    
    daily_steps = {}
    
    try:
        if filename.endswith('.json'):
            data = json.loads(content.decode('utf-8'))
            if isinstance(data, list):
                for record in data:
                    count = record.get('count')
                    start_time = record.get('start_time') or record.get('create_time')
                    if count is not None and start_time:
                        date_str = start_time.split(' ')[0]
                        if len(date_str) == 10:
                            daily_steps[date_str] = daily_steps.get(date_str, 0) + int(count)
            else:
                raise HTTPException(status_code=400, detail="Invalid JSON format. Expected list of records.")
                
        elif filename.endswith('.csv'):
            csv_text = content.decode('utf-8')
            csv_file = io.StringIO(csv_text)
            reader = csv.DictReader(csv_file)
            
            count_col = None
            time_col = None
            
            if reader.fieldnames:
                for field in reader.fieldnames:
                    field_lower = field.lower()
                    if 'count' in field_lower:
                        count_col = field
                    if 'start_time' in field_lower or 'create_time' in field_lower:
                        time_col = field
            
            if not count_col or not time_col:
                csv_file.seek(0)
                reader = csv.reader(csv_file)
                header = next(reader)
                for i, h in enumerate(header):
                    h_lower = h.lower()
                    if 'count' in h_lower: count_col = i
                    if 'start' in h_lower or 'create' in h_lower: time_col = i
                
                if count_col is None or time_col is None:
                    raise HTTPException(status_code=400, detail="Could not identify 'count' or 'start_time' columns in Samsung CSV.")
                
                for row in reader:
                    try:
                        count = int(row[count_col])
                        date_str = row[time_col].split(' ')[0]
                        if len(date_str) == 10:
                            daily_steps[date_str] = daily_steps.get(date_str, 0) + count
                    except Exception:
                        continue
            else:
                for row in reader:
                    try:
                        count = int(row[count_col])
                        date_str = row[time_col].split(' ')[0]
                        if len(date_str) == 10:
                            daily_steps[date_str] = daily_steps.get(date_str, 0) + count
                    except Exception:
                        continue
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Please upload .json or .csv files exported from Samsung Health.")
            
        if not daily_steps:
            raise HTTPException(status_code=400, detail="No step records could be parsed. Check that the file contains 'count' and 'start_time' fields.")
            
        imported_count = 0
        for date_str, steps_count in daily_steps.items():
            log = db.query(StepLog).filter(StepLog.user_id == user.id, StepLog.date == date_str).first()
            if log:
                log.steps = steps_count
            else:
                log = StepLog(user_id=user.id, date=date_str, steps=steps_count, goal=10000)
                db.add(log)
            imported_count += 1
            
        db.commit()
        
        today = datetime.date.today().isoformat()
        today_log = db.query(StepLog).filter(StepLog.user_id == user.id, StepLog.date == today).first()
        today_steps = today_log.steps if today_log else 0
        
        # Add to competition
        active_comp = db.query(Competition).first()
        if active_comp and today_steps > 0:
            participant = db.query(CompetitionParticipant).filter(
                CompetitionParticipant.competition_id == active_comp.id,
                CompetitionParticipant.user_id == user.id
            ).first()
            if not participant:
                participant = CompetitionParticipant(competition_id=active_comp.id, user_id=user.id, steps_logged=today_steps)
                db.add(participant)
            else:
                participant.steps_logged = today_steps
            db.commit()
        
        return {
            "status": "success",
            "message": f"Successfully imported {imported_count} days of steps for user '{user.username}'!",
            "imported_days": imported_count,
            "today_steps": today_steps
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to parse file: {str(e)}")

@app.post("/api/bmi")
def calculate_bmi(data: BMICalculatorSchema, username: str = "Alex", db: Session = Depends(get_db)):
    user = get_or_create_user(db, username)
    user.height = data.height
    user.weight = data.weight
    if data.age is not None:
        user.age = data.age
    if data.gender is not None:
        user.gender = data.gender
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
        "weight": data.weight,
        "age": user.age,
        "gender": user.gender
    }

@app.get("/api/meals")
def get_meals(username: str = "Alex", db: Session = Depends(get_db)):
    user = get_or_create_user(db, username)
    today = datetime.date.today().isoformat()
    meals = db.query(MealLog).filter(MealLog.user_id == user.id, MealLog.date == today).all()
    return meals

@app.post("/api/meals")
def log_meal(
    meal_name: str = Form(...),
    photo: Optional[UploadFile] = File(None),
    username: str = Form("Alex"),
    db: Session = Depends(get_db)
):
    user = get_or_create_user(db, username)
    today = datetime.date.today().isoformat()
    
    photo_bytes = None
    mime_type = None
    image_url = "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=500"
    
    if photo:
        try:
            photo_bytes = photo.file.read()
            mime_type = photo.content_type
            
            # Save file locally
            filename = f"{user.username}_{int(time.time())}_{photo.filename}"
            filepath = os.path.join(UPLOAD_DIR, filename)
            with open(filepath, "wb") as f:
                f.write(photo_bytes)
            image_url = f"http://localhost:8000/uploads/{filename}"
        except Exception as file_err:
            print(f"Error handling uploaded photo: {file_err}")
            
    # Analyze nutrition values with Gemini API using 2.5-flash
    analysis = analyze_meal_with_gemini(meal_name, photo_bytes, mime_type)
    
    calories = int(analysis.get("calories", 350))
    protein = float(analysis.get("protein", 15.0))
    carbs = float(analysis.get("carbs", 45.0))
    fat = float(analysis.get("fat", 12.0))
    description = analysis.get("description", f"Estimated nutrition facts for {meal_name}.")
    
    meal = MealLog(
        user_id=user.id,
        date=today,
        meal_name=meal_name,
        image_url=image_url,
        calories=calories,
        protein=protein,
        carbs=carbs,
        fat=fat,
        description=description
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
            "fat": meal.fat,
            "description": meal.description
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

@app.get("/api/competitions/local")
def get_local_challenges(city: Optional[str] = None, lat: Optional[float] = None, lon: Optional[float] = None):
    # Default location: Munich, Germany
    default_city = "Munich"
    default_lat = 48.1351
    default_lon = 11.5820
    
    resolved_city = None
    resolved_lat = None
    resolved_lon = None
    
    # 1. If lat/lon are provided, try reverse geocoding to find city
    if lat is not None and lon is not None:
        resolved_lat = lat
        resolved_lon = lon
        resolved_city = reverse_geocode(lat, lon)
        # If reverse geocode failed or didn't return a valid string, fallback
        if not resolved_city or resolved_city == "Unknown Location":
            resolved_city = "Your Location"
    
    # 2. Else if city name is provided, geocode it to find coordinates
    elif city and city.strip():
        search_result = geocode_city(city.strip())
        if search_result:
            resolved_city = search_result["display_name"]
            resolved_lat = search_result["lat"]
            resolved_lon = search_result["lon"]
        else:
            # If search fails, use the city name directly but fallback to default coords
            resolved_city = city.strip()
            resolved_lat = default_lat
            resolved_lon = default_lon
            
    # 3. Else (no params), fallback to Munich
    else:
        resolved_city = default_city
        resolved_lat = default_lat
        resolved_lon = default_lon

    # Offset coordinates slightly so they look like distinct venues in/around the city
    # Event 1: Hyrox (close to center, indoor convention center)
    hyrox_lat = resolved_lat + 0.015
    hyrox_lon = resolved_lon - 0.012
    hyrox_dist = calculate_haversine(resolved_lat, resolved_lon, hyrox_lat, hyrox_lon)
    
    # Event 2: Ironman (further away, e.g. lake/coastal park)
    ironman_lat = resolved_lat + 0.15
    ironman_lon = resolved_lon + 0.22
    ironman_dist = calculate_haversine(resolved_lat, resolved_lon, ironman_lat, ironman_lon)
    
    # Event 3: Trail Run (park/forest)
    trail_lat = resolved_lat - 0.045
    trail_lon = resolved_lon + 0.062
    trail_dist = calculate_haversine(resolved_lat, resolved_lon, trail_lat, trail_lon)
    
    # Custom venue names depending on the city name
    c_lower = resolved_city.lower()
    if "london" in c_lower:
        hyrox_venue = "ExCeL London"
        ironman_venue = "Weymouth Beach & Coast"
        trail_venue = "Richmond Park Forest Trails"
    elif "new york" in c_lower or "nyc" in c_lower:
        hyrox_venue = "Javits Center (Manhattan)"
        ironman_venue = "Lake Placid Outdoor Center"
        trail_venue = "Central Park Loop Paths"
    elif "munich" in c_lower or "münchen" in c_lower:
        hyrox_venue = "Messe München (Hall C6)"
        ironman_venue = "Lake Starnberg Marina"
        trail_venue = "Englischer Garten Trails"
    elif "bengaluru" in c_lower or "bangalore" in c_lower:
        hyrox_venue = "Bangalore International Exhibition Centre (BIEC)"
        ironman_venue = "Chikkaballapur Lakes"
        trail_venue = "Cubbon Park & Nandi Hills Trails"
    elif "mumbai" in c_lower or "bombay" in c_lower:
        hyrox_venue = "Bombay Exhibition Centre (Nesco)"
        ironman_venue = "Pawna Lake Marina"
        trail_venue = "Sanjay Gandhi National Park Trails"
    elif "sydney" in c_lower:
        hyrox_venue = "Sydney Showground (Olympic Park)"
        ironman_venue = "Manly Beach Coastline"
        trail_venue = "Centennial Parklands"
    elif "tokyo" in c_lower:
        hyrox_venue = "Tokyo Big Sight (East Hall)"
        ironman_venue = "Lake Motosu Marina (Mount Fuji)"
        trail_venue = "Yoyogi Park Forest paths"
    else:
        hyrox_venue = f"{resolved_city} Convention Center"
        ironman_venue = f"{resolved_city} Lakeside Park"
        trail_venue = f"{resolved_city} Nature Reserve Trails"

    return {
        "city": resolved_city,
        "lat": resolved_lat,
        "lon": resolved_lon,
        "challenges": [
            {
                "id": 101,
                "title": f"Hyrox {resolved_city}",
                "type": "Functional Fitness",
                "location": f"{hyrox_venue} ({hyrox_dist:.1f} km away)",
                "date": "July 12, 2026",
                "description": "The global fitness race combining 8x 1km running loops and 8 functional workouts (Sled Push, Burpees, Rowing).",
                "difficulty": "Advanced",
                "participants_count": 342,
                "registration_url": "https://hyrox.com/"
            },
            {
                "id": 102,
                "title": f"Ironman 70.3 {resolved_city} Regional",
                "type": "Triathlon",
                "location": f"{ironman_venue} ({ironman_dist:.1f} km away)",
                "date": "August 24, 2026",
                "description": "The ultimate test of endurance: 1.9 km swim, 90 km bike ride, and 21.1 km half-marathon run.",
                "difficulty": "Extreme",
                "participants_count": 895,
                "registration_url": "https://www.ironman.com/"
            },
            {
                "id": 103,
                "title": f"{resolved_city} Forest Trail Run",
                "type": "Trail Running",
                "location": f"{trail_venue} ({trail_dist:.1f} km away)",
                "date": "July 28, 2026",
                "description": "A scenic but rugged 15K trail run through mud paths, steep inclines, and forest tracks.",
                "difficulty": "Intermediate",
                "participants_count": 128,
                "registration_url": "https://www.active.com/running"
            }
        ]
    }

@app.get("/api/competitions")
def get_competitions(username: str = "Alex", db: Session = Depends(get_db)):
    comp = db.query(Competition).first()
    if not comp:
        return {"competition": None, "leaderboard": []}
        
    participants = db.query(CompetitionParticipant).filter(
        CompetitionParticipant.competition_id == comp.id
    ).all()
    
    leaderboard = []
    for p in participants:
        leaderboard.append({
            "username": p.user.username,
            "steps": p.steps_logged,
            "is_me": p.user.username == username
        })
    leaderboard.sort(key=lambda x: x["steps"], reverse=True)
    
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
def join_competition(data: JoinCompetitionSchema, username: str = "Alex", db: Session = Depends(get_db)):
    user = get_or_create_user(db, username)
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
def get_weekly_report(username: str = "Alex", db: Session = Depends(get_db)):
    user = get_or_create_user(db, username)
    today = datetime.date.today()
    
    daily_stats = []
    total_steps = 0
    total_calories = 0
    active_days_count = 0
    
    for i in range(7):
        day = (today - datetime.timedelta(days=i)).isoformat()
        
        steps_log = db.query(StepLog).filter(StepLog.user_id == user.id, StepLog.date == day).first()
        steps = steps_log.steps if steps_log else 0
        total_steps += steps
        if steps > 3000:
            active_days_count += 1
            
        meal_logs = db.query(MealLog).filter(MealLog.user_id == user.id, MealLog.date == day).all()
        calories = sum(m.calories for m in meal_logs)
        total_calories += calories
        
        day_name = (today - datetime.timedelta(days=i)).strftime("%a")
        
        daily_stats.append({
            "date": day,
            "day": day_name,
            "steps": steps,
            "calories": calories
        })
        
    daily_stats.reverse()
    
    avg_steps = round(total_steps / 7)
    avg_calories = round(total_calories / 7)
    
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
