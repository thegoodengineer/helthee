import datetime
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship

DATABASE_URL = "sqlite:///./helthee.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    current_streak = Column(Integer, default=0)
    max_streak = Column(Integer, default=0)
    last_active_date = Column(String, nullable=True) # YYYY-MM-DD
    height = Column(Float, default=175.0) # in cm
    weight = Column(Float, default=70.0) # in kg

class StepLog(Base):
    __tablename__ = "step_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    date = Column(String, index=True) # YYYY-MM-DD
    steps = Column(Integer, default=0)
    goal = Column(Integer, default=10000)

class MealLog(Base):
    __tablename__ = "meal_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    date = Column(String, index=True) # YYYY-MM-DD
    meal_name = Column(String)
    image_url = Column(String)
    calories = Column(Integer)
    protein = Column(Float) # grams
    carbs = Column(Float) # grams
    fat = Column(Float) # grams

class Competition(Base):
    __tablename__ = "competitions"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)
    description = Column(String)
    start_date = Column(String) # YYYY-MM-DD
    end_date = Column(String) # YYYY-MM-DD

class CompetitionParticipant(Base):
    __tablename__ = "competition_participants"
    
    id = Column(Integer, primary_key=True, index=True)
    competition_id = Column(Integer, ForeignKey("competitions.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    steps_logged = Column(Integer, default=0)
    
    # Relationships for easier querying
    user = relationship("User")

def init_db():
    Base.metadata.create_all(bind=engine)
    
    # Seed default data if database is empty
    db = SessionLocal()
    try:
        if not db.query(User).first():
            # Seed main user
            main_user = User(username="Alex", current_streak=5, max_streak=12, last_active_date=datetime.date.today().isoformat(), height=178.0, weight=75.0)
            db.add(main_user)
            
            # Seed other users for competition leaderboard
            users = [
                User(username="Sarah", current_streak=8, max_streak=20, last_active_date=datetime.date.today().isoformat(), height=165.0, weight=58.0),
                User(username="Michael", current_streak=3, max_streak=8, last_active_date=datetime.date.today().isoformat(), height=182.0, weight=88.0),
                User(username="Emma", current_streak=14, max_streak=30, last_active_date=datetime.date.today().isoformat(), height=168.0, weight=60.0),
            ]
            for u in users:
                db.add(u)
            db.commit()
            
            # Seed active competition
            challenge = Competition(
                name="Summer Step Challenge",
                description="Who can walk the most steps this week? Join forces and compete for the golden sneakers badge!",
                start_date=(datetime.date.today() - datetime.timedelta(days=2)).isoformat(),
                end_date=(datetime.date.today() + datetime.timedelta(days=5)).isoformat()
            )
            db.add(challenge)
            db.commit()
            
            # Add participants
            alex = db.query(User).filter(User.username == "Alex").first()
            sarah = db.query(User).filter(User.username == "Sarah").first()
            michael = db.query(User).filter(User.username == "Michael").first()
            emma = db.query(User).filter(User.username == "Emma").first()
            
            participants = [
                CompetitionParticipant(competition_id=challenge.id, user_id=alex.id, steps_logged=15200),
                CompetitionParticipant(competition_id=challenge.id, user_id=sarah.id, steps_logged=24150),
                CompetitionParticipant(competition_id=challenge.id, user_id=michael.id, steps_logged=9400),
                CompetitionParticipant(competition_id=challenge.id, user_id=emma.id, steps_logged=28900),
            ]
            for p in participants:
                db.add(p)
                
            # Seed some steps for Alex over the last week
            today = datetime.date.today()
            for i in range(7):
                day = (today - datetime.timedelta(days=i)).isoformat()
                # Alex's steps
                db.add(StepLog(user_id=alex.id, date=day, steps=7000 + (i * 800) % 6000, goal=10000))
                # Alex's meals
                if i % 2 == 0:
                    db.add(MealLog(user_id=alex.id, date=day, meal_name="Oatmeal with berries", image_url="https://images.unsplash.com/photo-1517881917430-e70dfb3610aa?w=500", calories=350, protein=12.0, carbs=55.0, fat=6.0))
                    db.add(MealLog(user_id=alex.id, date=day, meal_name="Grilled chicken salad", image_url="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500", calories=550, protein=42.0, carbs=15.0, fat=18.0))
                else:
                    db.add(MealLog(user_id=alex.id, date=day, meal_name="Avocado toast & eggs", image_url="https://images.unsplash.com/photo-1525351484163-7529414344d8?w=500", calories=420, protein=18.0, carbs=30.0, fat=22.0))
                    db.add(MealLog(user_id=alex.id, date=day, meal_name="Salmon and broccoli", image_url="https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=500", calories=620, protein=48.0, carbs=12.0, fat=28.0))
            
            db.commit()
    finally:
        db.close()
