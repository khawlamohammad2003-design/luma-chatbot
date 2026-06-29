from fastapi import FastAPI, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
import os
import re
from datetime import datetime
from dotenv import load_dotenv
from sqlalchemy.orm import Session

from database import Base, engine, SessionLocal
from models import Lead
from fastapi.responses import FileResponse
from openpyxl import Workbook
import json
load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

Base.metadata.create_all(bind=engine)

app = FastAPI()
@app.get("/")
def home():
    return {
        "status": "running",
        "message": "Luma Chatbot API is running successfully"
    }
connected_clients = []

@app.websocket("/ws/leads")
async def websocket_leads(websocket: WebSocket):
    await websocket.accept()
    connected_clients.append(websocket)

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        connected_clients.remove(websocket)

async def notify_clients():
    for client in connected_clients:
        await client.send_text("new_lead")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://luma-chatbot-zgcx.vercel.app",
        "https://luma-chatbot-green.vercel.app",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class MessageItem(BaseModel):
    sender: str
    text: str

class ChatRequest(BaseModel):
    message: str
    history: list[MessageItem] = []

class NotesRequest(BaseModel):
    notes: str

class FollowUpRequest(BaseModel):
    follow_up_date: str

LUMA_INFO = """
أنت مساعد ذكي لشركة Luma Agency.

معلومات الشركة:

📞 رقم الهاتف:
+962 7 9336 3006

📧 البريد الإلكتروني:
info@luma-jo.com

🌐 الموقع الإلكتروني:
https://luma-jo.com

📍 الموقع:
Blue Eagle Est
شارع الملك عبدالله الثاني
عمّان - الأردن

خدمات لوما:
- إدارة صفحات السوشيال ميديا
- تصميم بوستات
- كتابة محتوى تسويقي
- تصوير ومونتاج Reels
- إعلانات ممولة
- مواقع إلكترونية
- متاجر Shopify
- Chatbots
- AI Automation

إذا سأل العميل عن:
- رقم الهاتف ➜ أعطه الرقم كاملاً:
+962 7 9336 3006

- الإيميل ➜
info@luma-jo.com

- الموقع الإلكتروني ➜
https://luma-jo.com

- العنوان ➜
Blue Eagle Est
شارع الملك عبدالله الثاني
عمّان - الأردن

إذا أبدى العميل اهتمامه بأي خدمة، اطلب منه:
- الاسم
- رقم الهاتف
- اسم الشركة
- الخدمة المطلوبة

كن ودوداً، احترافياً، واكتب الردود بشكل قصير وواضح.
إذا سأل العميل عن تدريب، internship، تقديم، وظيفة، أو إرسال CV:
أخبره أن يرسل السيرة الذاتية على واتساب من خلال الرابط التالي:
https://wa.me/962793363006?text=مرحبا%20لوما،%20بدي%20أقدم%20على%20تدريب%20وأرسل%20الـCV
ولا تطلب منه إرسال CV داخل الشات.
"""

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def extract_phone(text):
    phone_match = re.search(r"(?:\+962|00962|0)?7\d{8}", text)
    return phone_match.group() if phone_match else ""

def extract_name(text):
    patterns = [
        r"اسمي\s+([^\s،,]+)",
        r"انا\s+اسمي\s+([^\s،,]+)",
        r"أنا\s+اسمي\s+([^\s،,]+)",
        r"انا\s+([^\s،,]+)",
        r"أنا\s+([^\s،,]+)",
    ]

    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            return match.group(1)

    return ""

def extract_company(text):
    patterns = [
        r"عندي\s+شركة\s+([^\s،,]+)",
        r"شركة\s+([^\s،,]+)",
        r"اسم\s+الشركة\s+([^\s،,]+)",
        r"شركتي\s+([^\s،,]+)",
    ]

    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            return match.group(1)

    return ""

def extract_service(text):
    services = [
        "إدارة السوشيال ميديا",
        "سوشيال ميديا",
        "إدارة صفحات",
        "ادارة صفحات",
        "تصميم بوستات",
        "كتابة محتوى",
        "Reels",
        "ريلز",
        "مونتاج",
        "إعلانات ممولة",
        "اعلانات ممولة",
        "موقع",
        "متجر إلكتروني",
        "متجر",
        "Shopify",
        "شات بوت",
        "Chatbot",
        "ذكاء اصطناعي",
        "AI Automation",
        "Automation",
    ]

    for service in services:
        if service.lower() in text.lower():
            if service == "سوشيال ميديا":
                return "إدارة السوشيال ميديا"
            if service == "متجر":
                return "متجر إلكتروني"
            return service

    return ""
def extract_lead_with_ai(text):
    prompt = f"""
استخرج بيانات العميل من الرسالة التالية بصيغة JSON فقط بدون شرح.

الرسالة:
{text}

المطلوب:
{{
  "name": "",
  "phone": "",
  "company": "",
  "service": ""
}}

إذا لم تجد قيمة اتركها فارغة.
"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": "أنت مساعد متخصص باستخراج بيانات العملاء من الرسائل العربية والإنجليزية."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
    )

    try:
        return json.loads(response.choices[0].message.content)
    except:
        return {
            "name": "",
            "phone": "",
            "company": "",
            "service": ""
        }
def save_lead(text, db: Session):
    lead_data = extract_lead_with_ai(text)

    name = lead_data.get("name", "")
    phone = lead_data.get("phone", "")
    company = lead_data.get("company", "")
    service = lead_data.get("service", "")

    if phone and name:
        lead = Lead(
            message=text,
            name=name,
            phone=phone,
            company=company,
            service=service,
            status="New",
            date=datetime.now().strftime("%Y-%m-%d %H:%M"),
            notes="",
            follow_up_date="",
        )

        try:
            db.add(lead)
            db.commit()
            db.refresh(lead)

            import asyncio
            asyncio.create_task(notify_clients())

        except Exception as e:
            db.rollback()
            print("Lead save failed:", e)
        
        

@app.post("/chat")
async def chat(request: ChatRequest, db: Session = Depends(get_db)):
    save_lead(request.message, db)

    chat_history = []

    for msg in request.history:
        role = "user" if msg.sender == "user" else "assistant"
        chat_history.append({
            "role": role,
            "content": msg.text
        })

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": LUMA_INFO},
            *chat_history,
            {"role": "user", "content": request.message},
        ],
    )

    return {
        "reply": response.choices[0].message.content
    }

@app.get("/leads")
def get_leads(db: Session = Depends(get_db)):
    leads = db.query(Lead).all()

    return {
        "leads": [
            {
                "id": lead.id,
                "name": lead.name,
                "phone": lead.phone,
                "company": lead.company,
                "service": lead.service,
                "status": lead.status,
                "date": lead.date,
                "message": lead.message,
                "notes": lead.notes or "",
                "follow_up_date": lead.follow_up_date or "",
            }
            for lead in leads
        ]
    }

@app.put("/leads/{lead_id}/status")
def update_lead_status(lead_id: int, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()

    if not lead:
        return {"error": "Lead not found"}

    if lead.status == "New":
        lead.status = "Contacted"
    elif lead.status == "Contacted":
        lead.status = "Won"
    elif lead.status == "Won":
        lead.status = "Lost"
    else:
        lead.status = "New"

    db.commit()
    db.refresh(lead)

    return {
        "message": "Status updated",
        "status": lead.status
    }

@app.put("/leads/{lead_id}/notes")
def update_lead_notes(
    lead_id: int,
    request: NotesRequest,
    db: Session = Depends(get_db)
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()

    if not lead:
        return {"error": "Lead not found"}

    lead.notes = request.notes
    db.commit()
    db.refresh(lead)

    return {
        "message": "Notes updated",
        "notes": lead.notes
    }

@app.put("/leads/{lead_id}/follow-up")
def update_follow_up_date(
    lead_id: int,
    request: FollowUpRequest,
    db: Session = Depends(get_db)
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()

    if not lead:
        return {"error": "Lead not found"}

    lead.follow_up_date = request.follow_up_date
    db.commit()
    db.refresh(lead)

    return {
        "message": "Follow-up date updated",
        "follow_up_date": lead.follow_up_date
    }

@app.delete("/leads/{lead_id}")
def delete_lead(lead_id: int, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()

    if not lead:
        return {"error": "Lead not found"}

    db.delete(lead)
    db.commit()

    return {
        "message": "Lead deleted",
        "success": True
    }

@app.get("/export-leads")
def export_leads(db: Session = Depends(get_db)):
    leads = db.query(Lead).all()

    wb = Workbook()
    ws = wb.active
    ws.title = "Leads"

    ws.append([
        "ID",
        "Name",
        "Phone",
        "Company",
        "Service",
        "Status",
        "Date",
        "Message",
        "Notes",
        "Follow Up Date",
    ])

    for lead in leads:
        ws.append([
            lead.id,
            lead.name,
            lead.phone,
            lead.company,
            lead.service,
            lead.status,
            lead.date,
            lead.message,
            lead.notes or "",
            lead.follow_up_date or "",
        ])

    file_name = "luma_leads.xlsx"
    wb.save(file_name)

    return FileResponse(
        path=file_name,
        filename=file_name,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
@app.post("/leads/{lead_id}/ai-message")
def generate_ai_message(lead_id: int, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()

    if not lead:
        return {"error": "Lead not found"}

    prompt = f"""
اكتب رسالة واتساب قصيرة واحترافية باللهجة الأردنية لعميل محتمل.

بيانات العميل:
الاسم: {lead.name or "العميل"}
الشركة: {lead.company or "-"}
الخدمة المهتم فيها: {lead.service or "-"}
الحالة الحالية: {lead.status or "New"}
الملاحظات: {lead.notes or "-"}
رسالة العميل الأصلية: {lead.message or "-"}

المطلوب:
- رسالة ودودة ومهنية
- قصيرة
- تشجع العميل على الرد
- لا تذكر أنك ذكاء اصطناعي
"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": "أنت كاتب رسائل مبيعات محترف لشركة Luma Agency.",
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
    )

    return {
        "message": response.choices[0].message.content
    }