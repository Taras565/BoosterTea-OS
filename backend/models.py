from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    tg_id = Column(Integer, primary_key=True, index=True)
    birth_date = Column(Date)
    profession = Column(String)
    hd_type = Column(String)
    sucay_number = Column(Integer)
    
    inventory = relationship("Inventory", back_populates="user", uselist=False)
    feedbacks = relationship("Feedback", back_populates="user")

class Inventory(Base):
    __tablename__ = "inventory"

    user_id = Column(Integer, ForeignKey("users.tg_id"), primary_key=True)
    puer_ml_left = Column(Float, default=0.0)
    dhp_ml_left = Column(Float, default=0.0)
    gaba_ml_left = Column(Float, default=0.0)

    user = relationship("User", back_populates="inventory")

class Feedback(Base):
    __tablename__ = "feedbacks"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.tg_id"))
    recipe_id = Column(String)
    rating = Column(Integer, nullable=True) # 1-5

    user = relationship("User", back_populates="feedbacks")
