import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";

function LeadProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [lead, setLead] = useState(null);
  const [notes, setNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [aiMessage, setAiMessage] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const fetchLead = () => {
    fetch("http://127.0.0.1:8001/leads")
      .then((res) => res.json())
      .then((data) => {
        const foundLead = data.leads.find(
          (item) => String(item.id) === String(id)
        );

        setLead(foundLead);
        setNotes(foundLead?.notes || "");
        setFollowUpDate(foundLead?.follow_up_date || "");
      });
  };

  useEffect(() => {
    fetchLead();
  }, [id]);

  const updateStatus = async () => {
    await fetch(`http://127.0.0.1:8001/leads/${id}/status`, {
      method: "PUT",
    });

    fetchLead();
  };

  const saveNotes = async () => {
    await fetch(`http://127.0.0.1:8001/leads/${id}/notes`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ notes }),
    });

    fetchLead();
  };

  const saveFollowUp = async () => {
    await fetch(`http://127.0.0.1:8001/leads/${id}/follow-up`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ follow_up_date: followUpDate }),
    });

    fetchLead();
  };

  const generateAiMessage = async () => {
    setAiLoading(true);
    setAiMessage("");

    try {
      const response = await fetch(
        `http://127.0.0.1:8001/leads/${id}/ai-message`,
        {
          method: "POST",
        }
      );

      const data = await response.json();
      setAiMessage(data.message || "No message generated.");
    } catch (error) {
      setAiMessage("Error generating AI message.");
    } finally {
      setAiLoading(false);
    }
  };

  const copyAiMessage = () => {
    if (!aiMessage) return;
    navigator.clipboard.writeText(aiMessage);
  };

  const sendAiMessageToWhatsApp = () => {
    if (!lead?.phone || !aiMessage) return;

    const cleanPhone = lead.phone.startsWith("0")
      ? "962" + lead.phone.slice(1)
      : lead.phone;

    const encodedMessage = encodeURIComponent(aiMessage);

    window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, "_blank");
  };

  const deleteLead = async () => {
    await fetch(`http://127.0.0.1:8001/leads/${id}`, {
      method: "DELETE",
    });

    navigate("/leads");
  };

  const openWhatsApp = () => {
    if (!lead?.phone) return;

    const cleanPhone = lead.phone.startsWith("0")
      ? "962" + lead.phone.slice(1)
      : lead.phone;

    window.open(`https://wa.me/${cleanPhone}`, "_blank");
  };

  if (!lead) {
    return (
      <div style={pageStyle}>
        <h1>Lead Not Found</h1>
        <Link to="/leads" style={backLinkStyle}>
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <Link to="/leads" style={backLinkStyle}>
        ← Back to Dashboard
      </Link>

      <div style={profileCardStyle}>
        <div style={headerStyle}>
          <div>
            <h1 style={titleStyle}>{lead.name || "No Name"}</h1>
            <p style={subtitleStyle}>{lead.service || "No Service"}</p>
          </div>

          <span style={statusBadgeStyle}>{lead.status || "New"}</span>
        </div>

        <div style={gridStyle}>
          <Info title="Phone" value={lead.phone || "-"} />
          <Info title="Company" value={lead.company || "-"} />
          <Info title="Service" value={lead.service || "-"} />
          <Info title="Status" value={lead.status || "New"} />
          <Info title="Date" value={lead.date || "-"} />
          <Info title="Follow Up" value={lead.follow_up_date || "-"} />
        </div>

        <section style={sectionStyle}>
          <h2>Message</h2>
          <p>{lead.message || "-"}</p>
        </section>

        <section style={sectionStyle}>
          <h2>Notes</h2>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={textareaStyle}
            placeholder="Write notes..."
          />

          <button onClick={saveNotes} style={blueButtonStyle}>
            Save Notes
          </button>
        </section>

        <section style={sectionStyle}>
          <h2>Follow Up</h2>

          <input
            type="date"
            value={followUpDate}
            onChange={(e) => setFollowUpDate(e.target.value)}
            style={inputStyle}
          />

          <button onClick={saveFollowUp} style={purpleButtonStyle}>
            Save Follow Up
          </button>
        </section>

        <section style={aiSectionStyle}>
          <h2>✨ AI Follow-up Message</h2>

          <button onClick={generateAiMessage} style={aiButtonStyle}>
            {aiLoading ? "Generating..." : "Generate AI Message"}
          </button>

          {aiMessage && (
            <div style={aiMessageBoxStyle}>
              <p>{aiMessage}</p>

              <button onClick={copyAiMessage} style={copyButtonStyle}>
                Copy Message
              </button>

              <button
                onClick={sendAiMessageToWhatsApp}
                style={sendWhatsappButtonStyle}
              >
                Send on WhatsApp
              </button>
            </div>
          )}
        </section>

        <section style={timelineStyle}>
          <h2>Activity Timeline</h2>

          <div style={timelineItemStyle}>🟢 Lead Created: {lead.date || "-"}</div>
          <div style={timelineItemStyle}>🔵 Current Status: {lead.status || "New"}</div>
          <div style={timelineItemStyle}>🟣 Follow Up: {lead.follow_up_date || "-"}</div>
          <div style={timelineItemStyle}>📝 Notes Updated</div>
        </section>

        <div style={actionsStyle}>
          <button style={redButtonStyle} onClick={updateStatus}>
            Change Status
          </button>

          <button style={whatsappButtonStyle} onClick={openWhatsApp}>
            WhatsApp
          </button>

          <button style={deleteButtonStyle} onClick={deleteLead}>
            Delete Lead
          </button>
        </div>
      </div>
    </div>
  );
}

function Info({ title, value }) {
  return (
    <div style={infoBoxStyle}>
      <strong>{title}</strong>
      <p>{value}</p>
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background: "#0f0f0f",
  color: "#fff",
  padding: "40px",
};

const backLinkStyle = {
  color: "#ff3b3b",
  textDecoration: "none",
  fontWeight: "bold",
};

const profileCardStyle = {
  marginTop: "25px",
  background: "linear-gradient(145deg, #151515, #202020)",
  border: "1px solid #333",
  borderRadius: "22px",
  padding: "30px",
  boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "20px",
};

const titleStyle = {
  color: "#ff3b3b",
  fontSize: "42px",
  margin: 0,
};

const subtitleStyle = {
  color: "#aaa",
  marginTop: "8px",
};

const statusBadgeStyle = {
  background: "#f59e0b",
  color: "#fff",
  padding: "10px 18px",
  borderRadius: "999px",
  fontWeight: "bold",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "16px",
  margin: "25px 0",
};

const infoBoxStyle = {
  background: "#111",
  border: "1px solid #333",
  borderRadius: "14px",
  padding: "16px",
};

const sectionStyle = {
  background: "#111",
  border: "1px solid #333",
  borderRadius: "14px",
  padding: "18px",
  marginTop: "20px",
  lineHeight: "1.8",
};

const aiSectionStyle = {
  background: "linear-gradient(145deg, #1b1028, #111)",
  border: "1px solid #7c3aed",
  borderRadius: "14px",
  padding: "18px",
  marginTop: "20px",
  lineHeight: "1.8",
};

const aiButtonStyle = {
  background: "#7c3aed",
  color: "#fff",
  border: "none",
  padding: "12px 22px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "bold",
};

const aiMessageBoxStyle = {
  background: "#111",
  border: "1px solid #333",
  borderRadius: "12px",
  padding: "16px",
  marginTop: "14px",
  whiteSpace: "pre-line",
};

const copyButtonStyle = {
  background: "#16a34a",
  color: "#fff",
  border: "none",
  padding: "10px 18px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "bold",
  marginTop: "10px",
};

const sendWhatsappButtonStyle = {
  background: "#25D366",
  color: "#fff",
  border: "none",
  padding: "10px 18px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "bold",
  marginTop: "10px",
  marginLeft: "10px",
};

const textareaStyle = {
  width: "100%",
  minHeight: "130px",
  background: "#1b1b1b",
  color: "#fff",
  border: "1px solid #333",
  borderRadius: "10px",
  padding: "14px",
  fontSize: "16px",
  resize: "vertical",
};

const inputStyle = {
  background: "#1b1b1b",
  color: "#fff",
  border: "1px solid #333",
  borderRadius: "10px",
  padding: "14px",
  fontSize: "16px",
};

const actionsStyle = {
  display: "flex",
  gap: "12px",
  marginTop: "25px",
  flexWrap: "wrap",
};

const redButtonStyle = {
  background: "#ff3b3b",
  color: "#fff",
  border: "none",
  padding: "12px 22px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "bold",
};

const blueButtonStyle = {
  background: "#2563eb",
  color: "#fff",
  border: "none",
  padding: "12px 22px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "bold",
  marginTop: "12px",
};

const purpleButtonStyle = {
  background: "#7c3aed",
  color: "#fff",
  border: "none",
  padding: "12px 22px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "bold",
  marginLeft: "10px",
};

const whatsappButtonStyle = {
  background: "#25D366",
  color: "#fff",
  border: "none",
  padding: "12px 22px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "bold",
};

const deleteButtonStyle = {
  background: "#dc2626",
  color: "#fff",
  border: "none",
  padding: "12px 22px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "bold",
};

const timelineStyle = {
  background: "#111",
  border: "1px solid #333",
  borderRadius: "14px",
  padding: "18px",
  marginTop: "20px",
};

const timelineItemStyle = {
  padding: "12px",
  borderBottom: "1px solid #333",
  color: "#ddd",
};

export default LeadProfile;