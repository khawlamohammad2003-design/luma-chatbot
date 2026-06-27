from sqlalchemy import Column, Integer, String
from database import Base

class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String)
    phone = Column(String)
    company = Column(String)
    service = Column(String)

    status = Column(String)
    date = Column(String)

    message = Column(String)

    notes = Column(String, default="")
    follow_up_date = Column(String, default="")