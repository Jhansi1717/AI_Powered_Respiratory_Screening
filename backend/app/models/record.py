from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from datetime import datetime
from app.core.database import Base

class Record(Base):
    __tablename__ = "records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)  # 🔥 optional for now
    file_url = Column(String)
    prediction = Column(String)
    confidence = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)