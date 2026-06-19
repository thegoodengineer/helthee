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
    age = Column(Integer, default=28)
    gender = Column(String, default="male")

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
