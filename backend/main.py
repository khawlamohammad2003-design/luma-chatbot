from fastapi import FastAPI, Depends, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from openai import OpenAI
from sqlalchemy.orm import Session
from openpyxl import Workbook
from datetime import datetime
from dotenv import load_dotenv
import asyncio
import json
import os
import re

from database import Base, engine, SessionLocal
from models import Lead

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------

load_dotenv()

openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Luma Chatbot API", version="1.0.0")

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "https://luma-chatbot-zgcx.vercel.app",
    "https://luma-chatbot-green.vercel.app",
    "https://chat.luma-jo.com",
    "http://localhost:5173",
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# WebSocket Manager
# ---------------------------------------------------------------------------

class ConnectionManager:
    """Manages active WebSocket connections safely."""

    def __init__(self):
        self.active: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active:
            self.active.remove(websocket)

    async def broadcast(self, message: str):
        dead: list[WebSocket] = []
        for ws in self.active:
            try:
                await ws.send_text(message)
            except Exception:
                dead.append(ws)
        # Clean up dead connections
        for ws in dead:
            self.disconnect(ws)


manager = ConnectionManager()


@app.websocket("/ws/leads")
async def websocket_leads(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)


# ---------------------------------------------------------------------------
# Pydantic Models
# ---------------------------------------------------------------------------

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


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

BAD_WORDS: set[str] = {
    "غبي", "حقير", "تافه", "كلب", "حمار", "اهبل",
    "سخيف", "زفت", "لعنة", "fuck", "shit", "stupid", "idiot",
}

CAREER_KEYWORDS: set[str] = {
    "تدريب", "internship", "intern", "cv", "resume",
    "سيرة", "السيرة", "وظيفة", "career", "توظيف",
}

LUMA_INFO = """
أنت مساعد ذكي لشركة Luma Agency.

معلومات الشركة:
- رقم الهاتف: +962 7 9336 3006
- البريد الإلكتروني: info@luma-jo.com
- الموقع الإلكتروني: https://luma-jo.com
- العنوان: Blue Eagle Est, شارع الملك عبدالله الثاني, عمّان - الأردن

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

إذا أبدى العميل اهتمامه بأي خدمة، اطلب منه:
- الاسم
- رقم الهاتف
- اسم الشركة
- الخدمة المطلوبة

كن ودوداً واحترافياً، واكتب الردود بشكل قصير وواضح.
"""

# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ---------------------------------------------------------------------------
# Lead Extraction (AI-powered)
# ---------------------------------------------------------------------------

def extract_lead_with_ai(text: str) -> dict:
    """Extract lead data from a message using GPT."""
    prompt = (
        "استخرج بيانات العميل من الرسالة التالية بصيغة JSON فقط بدون شرح.\n\n"
        f"الرسالة:\n{text}\n\n"
        'المطلوب:\n{"name": "", "phone": "", "company": "", "service": ""}\n\n'
        "إذا لم تجد قيمة اتركها فارغة."
    )

    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "أنت مساعد متخصص باستخراج بيانات العملاء من الرسائل العربية والإنجليزية.",
                },
                {"role": "user", "content": prompt},
            ],
        )
        raw = response.choices[0].message.content.strip()
        # Strip markdown code fences if present
        if raw.startswith("```"):
            raw = re.sub(r"^```(?:json)?\n?", "", raw)
            raw = re.sub(r"\n?```$", "", raw)
        return json.loads(raw)
    except Exception as e:
        print(f"[extract_lead_with_ai] Failed: {e}")
        return {"name": "", "phone": "", "company": "", "service": ""}


async def save_lead_async(text: str, db: Session) -> None:
    """
    Extract lead data with AI and persist it to the DB.
    Runs the blocking OpenAI call in a thread pool to avoid blocking the event loop.
    """
    lead_data: dict = await asyncio.get_event_loop().run_in_executor(
        None, extract_lead_with_ai, text
    )

    name = lead_data.get("name", "").strip()
    phone = lead_data.get("phone", "").strip()
    company = lead_data.get("company", "").strip()
    service = lead_data.get("service", "").strip()

    # Only save if we have at least a name AND a phone
    if not (name and phone):
        return

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
        # Notify all connected dashboard clients
        await manager.broadcast("new_lead")
    except Exception as e:
        db.rollback()
        print(f"[save_lead_async] DB error: {e}")


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/")
def home():
    return {"status": "running", "message": "Luma Chatbot API is running successfully"}


@app.post("/chat")
async def chat(request: ChatRequest, db: Session = Depends(get_db)):
    user_message_lower = request.message.lower()

    # --- Block offensive language ---
    if any(word in user_message_lower for word in BAD_WORDS):
        return {
            "reply": (
                "نعتذر، لا يمكنني الاستمرار في المحادثة عند استخدام ألفاظ غير لائقة. "
                "يرجى التواصل باحترام حتى أتمكن من مساعدتك."
            )
        }

    # --- Career / internship enquiries ---
    if any(word in user_message_lower for word in CAREER_KEYWORDS):
        return {
            "reply": "يمكنك التقديم على التدريب وإرسال سيرتك الذاتية عبر واتساب.",
            "whatsapp": "https://wa.me/962793363006",
        }

    # --- Save lead in background (non-blocking) ---
    asyncio.create_task(save_lead_async(request.message, db))

    # --- Build chat history for GPT ---
    chat_history = [
        {
            "role": "user" if msg.sender == "user" else "assistant",
            "content": msg.text,
        }
        for msg in request.history
    ]

    # --- Call GPT (run in executor to stay non-blocking) ---
    def _call_openai():
        return openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": LUMA_INFO},
                *chat_history,
                {"role": "user", "content": request.message},
            ],
        )

    try:
        response = await asyncio.get_event_loop().run_in_executor(None, _call_openai)
        return {"reply": response.choices[0].message.content}
    except Exception as e:
        print(f"[chat] OpenAI error: {e}")
        raise HTTPException(status_code=503, detail="خطأ في الاتصال بالذكاء الاصطناعي، حاول مجدداً.")


@app.get("/leads")
def get_leads(db: Session = Depends(get_db)):
    leads = db.query(Lead).order_by(Lead.id.desc()).all()
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
        raise HTTPException(status_code=404, detail="Lead not found")

    STATUS_CYCLE = {"New": "Contacted", "Contacted": "Won", "Won": "Lost", "Lost": "New"}
    lead.status = STATUS_CYCLE.get(lead.status, "New")

    db.commit()
    db.refresh(lead)
    return {"message": "Status updated", "status": lead.status}


@app.put("/leads/{lead_id}/notes")
def update_lead_notes(lead_id: int, request: NotesRequest, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    lead.notes = request.notes
    db.commit()
    db.refresh(lead)
    return {"message": "Notes updated", "notes": lead.notes}


@app.put("/leads/{lead_id}/follow-up")
def update_follow_up_date(lead_id: int, request: FollowUpRequest, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    lead.follow_up_date = request.follow_up_date
    db.commit()
    db.refresh(lead)
    return {"message": "Follow-up date updated", "follow_up_date": lead.follow_up_date}


@app.delete("/leads/{lead_id}")
def delete_lead(lead_id: int, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    db.delete(lead)
    db.commit()
    return {"message": "Lead deleted", "success": True}


@app.get("/export-leads")
def export_leads(db: Session = Depends(get_db)):
    leads = db.query(Lead).all()

    wb = Workbook()
    ws = wb.active
    ws.title = "Leads"
    ws.append(["ID", "Name", "Phone", "Company", "Service",
               "Status", "Date", "Message", "Notes", "Follow Up Date"])

    for lead in leads:
        ws.append([
            lead.id, lead.name, lead.phone, lead.company,
            lead.service, lead.status, lead.date, lead.message,
            lead.notes or "", lead.follow_up_date or "",
        ])

    file_name = "luma_leads.xlsx"
    wb.save(file_name)

    return FileResponse(
        path=file_name,
        filename=file_name,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


@app.post("/leads/{lead_id}/ai-message")
def generate_ai_message(lead_id: int, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    prompt = f"""
اكتب رسالة واتساب قصيرة واحترافية باللهجة الأردنية لعميل محتمل.

بيانات العميل:
- الاسم: {lead.name or "العميل"}
- الشركة: {lead.company or "-"}
- الخدمة المهتم فيها: {lead.service or "-"}
- الحالة الحالية: {lead.status or "New"}
- الملاحظات: {lead.notes or "-"}
- رسالة العميل الأصلية: {lead.message or "-"}

المطلوب:
- رسالة ودودة ومهنية
- قصيرة لا تتجاوز 5 أسطر
- تشجع العميل على الرد
- لا تذكر أنك ذكاء اصطناعي
""".strip()

    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "أنت كاتب رسائل مبيعات محترف لشركة Luma Agency."},
                {"role": "user", "content": prompt},
            ],
        )
        return {"message": response.choices[0].message.content}
    except Exception as e:
        print(f"[generate_ai_message] OpenAI error: {e}")
        raise HTTPException(status_code=503, detail="خطأ في توليد الرسالة، حاول مجدداً.")
