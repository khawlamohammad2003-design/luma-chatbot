import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";

function Leads() {
  const [leads, setLeads] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [notesDraft, setNotesDraft] = useState({});
  const [followUpDraft, setFollowUpDraft] = useState({});
  const [notification, setNotification] = useState("");
  const [selectedLead, setSelectedLead] = useState(null);

  const fetchLeads = () => {
    fetch("http://127.0.0.1:8001/leads")
      .then((res) => res.json())
      .then((data) => {
        setLeads(data.leads);

        const notes = {};
        const followUps = {};

        data.leads.forEach((lead) => {
          notes[lead.id] = lead.notes || "";
          followUps[lead.id] = lead.follow_up_date || "";
        });

        setNotesDraft(notes);
        setFollowUpDraft(followUps);
      });
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    const socket = new WebSocket("ws://127.0.0.1:8001/ws/leads");

    socket.onmessage = () => {
      fetchLeads();
      setNotification("New lead received 🔔");

      setTimeout(() => {
        setNotification("");
      }, 3000);
    };

    socket.onerror = (error) => {
      console.log("WebSocket error:", error);
    };

    return () => {
      socket.close();
    };
  }, []);

  const logout = () => {
    localStorage.removeItem("luma_admin");
    window.location.href = "/login";
  };

  const updateStatus = async (id) => {
    await fetch(`http://127.0.0.1:8001/leads/${id}/status`, {
      method: "PUT",
    });

    fetchLeads();
  };

  const saveNotes = async (id) => {
    await fetch(`http://127.0.0.1:8001/leads/${id}/notes`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        notes: notesDraft[id] || "",
      }),
    });

    fetchLeads();
  };

  const saveFollowUp = async (id) => {
    await fetch(`http://127.0.0.1:8001/leads/${id}/follow-up`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        follow_up_date: followUpDraft[id] || "",
      }),
    });

    fetchLeads();
  };

  const deleteLead = async (id) => {
    await fetch(`http://127.0.0.1:8001/leads/${id}`, {
      method: "DELETE",
    });

    fetchLeads();
  };

  const openWhatsApp = (phone) => {
    if (!phone) return;

    const cleanPhone = phone.startsWith("0")
      ? "962" + phone.slice(1)
      : phone;

    window.open(`https://wa.me/${cleanPhone}`, "_blank");
  };

  const exportExcel = () => {
    window.open("http://127.0.0.1:8001/export-leads", "_blank");
  };

  const today = new Date().toISOString().split("T")[0];

  const filteredLeads = leads.filter((lead) => {
    const text = `${lead.name} ${lead.phone} ${lead.company} ${lead.service} ${lead.message} ${lead.notes} ${lead.follow_up_date}`;
    const matchSearch = text.toLowerCase().includes(search.toLowerCase());

    const matchFilter =
      filter === "All"
        ? true
        : filter === "Today"
        ? lead.follow_up_date === today
        : (lead.status || "New") === filter;

    return matchSearch && matchFilter;
  });

  const total = leads.length;
  const newLeads = leads.filter((lead) => lead.status === "New").length;
  const contacted = leads.filter((lead) => lead.status === "Contacted").length;
  const won = leads.filter((lead) => lead.status === "Won").length;
  const lost = leads.filter((lead) => lead.status === "Lost").length;
  const todayFollowUps = leads.filter(
    (lead) => lead.follow_up_date === today
  ).length;

  const chartData = [
    { name: "New", value: newLeads, color: "#f59e0b" },
    { name: "Contacted", value: contacted, color: "#2563eb" },
    { name: "Won", value: won, color: "#16a34a" },
    { name: "Lost", value: lost, color: "#dc2626" },
  ];

  const getStatusStyle = (status) => {
    if (status === "Contacted") return { ...statusStyle, background: "#2563eb" };
    if (status === "Won") return { ...statusStyle, background: "#16a34a" };
    if (status === "Lost") return { ...statusStyle, background: "#dc2626" };

    return { ...statusStyle, background: "#f59e0b" };
  };

  const getFilterButtonStyle = (value) => {
    return filter === value
      ? { ...filterBtn, background: "#ff3b3b", borderColor: "#ff3b3b" }
      : filterBtn;
  };

  return (
    <div style={pageStyle}>
      <h1 style={titleStyle}>Luma Leads Dashboard</h1>

      <button onClick={logout} style={logoutButtonStyle}>
        Logout
      </button>

      {notification && <div style={notificationStyle}>{notification}</div>}

      <div style={cardsWrapper}>
        <div style={cardStyle}>Total: {total}</div>
        <div style={cardStyle}>New: {newLeads}</div>
        <div style={cardStyle}>Contacted: {contacted}</div>
        <div style={cardStyle}>Won: {won}</div>
        <div style={cardStyle}>Lost: {lost}</div>
        <div style={todayCardStyle}>Today Follow Ups: {todayFollowUps}</div>
      </div>

      <div style={chartsWrapper}>
        <div style={chartBoxStyle}>
          <h3 style={chartTitleStyle}>Leads Status Pie Chart</h3>

          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                outerRadius={90}
                label
              >
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div style={chartBoxStyle}>
          <h3 style={chartTitleStyle}>Leads Status Bar Chart</h3>

          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" stroke="#fff" />
              <YAxis stroke="#fff" />
              <Tooltip />
              <Bar dataKey="value">
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={topActionsStyle}>
        <button style={exportButtonStyle} onClick={exportExcel}>
          Export Excel
        </button>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name, phone, company, service, follow up..."
        style={searchStyle}
      />

      <div style={filterContainer}>
        <button style={getFilterButtonStyle("All")} onClick={() => setFilter("All")}>
          All
        </button>

        <button style={getFilterButtonStyle("New")} onClick={() => setFilter("New")}>
          New
        </button>

        <button
          style={getFilterButtonStyle("Contacted")}
          onClick={() => setFilter("Contacted")}
        >
          Contacted
        </button>

        <button style={getFilterButtonStyle("Won")} onClick={() => setFilter("Won")}>
          Won
        </button>

        <button style={getFilterButtonStyle("Lost")} onClick={() => setFilter("Lost")}>
          Lost
        </button>

        <button style={getFilterButtonStyle("Today")} onClick={() => setFilter("Today")}>
          Today Follow Ups
        </button>
      </div>

      <div style={leadCardsGrid}>
        {filteredLeads.map((lead) => (
          <div key={lead.id} style={leadCardStyle}>
            <div style={leadCardHeader}>
              <div>
                <h3 style={leadNameStyle}>{lead.name || "No Name"}</h3>
                <p style={leadPhoneStyle}>{lead.phone || "-"}</p>
              </div>

              <span style={getStatusStyle(lead.status || "New")}>
                {lead.status || "New"}
              </span>
            </div>

            <div style={leadInfoStyle}>
              <p><strong>Company:</strong> {lead.company || "-"}</p>
              <p><strong>Service:</strong> {lead.service || "-"}</p>
              <p><strong>Follow Up:</strong> {lead.follow_up_date || "-"}</p>
            </div>

            <p style={leadMessageStyle}>{lead.message}</p>

            <div style={cardActionsStyle}>
              <button onClick={() => updateStatus(lead.id)} style={buttonStyle}>
                Change
              </button>

              <button onClick={() => openWhatsApp(lead.phone)} style={whatsappButtonStyle}>
                WhatsApp
              </button>

              <a href={`/lead/${lead.id}`} style={detailsButtonStyle}>
  View Profile
</a>

              <button onClick={() => deleteLead(lead.id)} style={deleteButtonStyle}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={cellStyle}>#</th>
            <th style={cellStyle}>Name</th>
            <th style={cellStyle}>Phone</th>
            <th style={cellStyle}>Company</th>
            <th style={cellStyle}>Service</th>
            <th style={cellStyle}>Status</th>
            <th style={cellStyle}>Date</th>
            <th style={cellStyle}>Message</th>
            <th style={cellStyle}>Notes</th>
            <th style={cellStyle}>Follow Up</th>
            <th style={cellStyle}>Action</th>
          </tr>
        </thead>

        <tbody>
          {filteredLeads.map((lead, index) => (
            <tr key={lead.id}>
              <td style={cellStyle}>{index + 1}</td>
              <td style={cellStyle}>{lead.name || "-"}</td>
              <td style={cellStyle}>{lead.phone || "-"}</td>
              <td style={cellStyle}>{lead.company || "-"}</td>
              <td style={cellStyle}>{lead.service || "-"}</td>

              <td style={cellStyle}>
                <span style={getStatusStyle(lead.status || "New")}>
                  {lead.status || "New"}
                </span>
              </td>

              <td style={cellStyle}>{lead.date || "-"}</td>
              <td style={cellStyle}>{lead.message}</td>

              <td style={cellStyle}>
                <textarea
                  value={notesDraft[lead.id] || ""}
                  onChange={(e) =>
                    setNotesDraft({
                      ...notesDraft,
                      [lead.id]: e.target.value,
                    })
                  }
                  placeholder="اكتب ملاحظات..."
                  style={notesStyle}
                />

                <button onClick={() => saveNotes(lead.id)} style={saveNotesButtonStyle}>
                  Save Notes
                </button>
              </td>

              <td style={cellStyle}>
                <input
                  type="date"
                  value={followUpDraft[lead.id] || ""}
                  onChange={(e) =>
                    setFollowUpDraft({
                      ...followUpDraft,
                      [lead.id]: e.target.value,
                    })
                  }
                  style={dateInputStyle}
                />

                <button
                  onClick={() => saveFollowUp(lead.id)}
                  style={saveFollowUpButtonStyle}
                >
                  Save Follow Up
                </button>
              </td>

              <td style={cellStyle}>
                <div style={actionStyle}>
                  <button onClick={() => updateStatus(lead.id)} style={buttonStyle}>
                    Change
                  </button>

                  <button
                    onClick={() => openWhatsApp(lead.phone)}
                    style={whatsappButtonStyle}
                  >
                    WhatsApp
                  </button>

                  <a href={`/lead/${lead.id}`} style={detailsButtonStyle}>
  Profile
</a>

                  <button onClick={() => deleteLead(lead.id)} style={deleteButtonStyle}>
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedLead && (
        <div style={modalOverlayStyle}>
          <div style={modalStyle}>
            <button onClick={() => setSelectedLead(null)} style={closeButtonStyle}>
              ×
            </button>

            <h2 style={modalTitleStyle}>{selectedLead.name || "No Name"}</h2>

            <div style={modalGridStyle}>
              <div style={modalInfoBox}>
                <strong>Phone</strong>
                <p>{selectedLead.phone || "-"}</p>
              </div>

              <div style={modalInfoBox}>
                <strong>Company</strong>
                <p>{selectedLead.company || "-"}</p>
              </div>

              <div style={modalInfoBox}>
                <strong>Service</strong>
                <p>{selectedLead.service || "-"}</p>
              </div>

              <div style={modalInfoBox}>
                <strong>Status</strong>
                <p>{selectedLead.status || "New"}</p>
              </div>

              <div style={modalInfoBox}>
                <strong>Follow Up</strong>
                <p>{selectedLead.follow_up_date || "-"}</p>
              </div>

              <div style={modalInfoBox}>
                <strong>Date</strong>
                <p>{selectedLead.date || "-"}</p>
              </div>
            </div>

            <div style={modalSectionStyle}>
              <h3>Message</h3>
              <p>{selectedLead.message || "-"}</p>
            </div>

            <div style={modalSectionStyle}>
              <h3>Notes</h3>
              <p>{selectedLead.notes || "-"}</p>
            </div>

            <div style={modalActionsStyle}>
              <button onClick={() => updateStatus(selectedLead.id)} style={buttonStyle}>
                Change Status
              </button>

              <button
                onClick={() => openWhatsApp(selectedLead.phone)}
                style={whatsappButtonStyle}
              >
                WhatsApp
              </button>

              <button
                onClick={() => {
                  deleteLead(selectedLead.id);
                  setSelectedLead(null);
                }}
                style={deleteButtonStyle}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background: "#0f0f0f",
  color: "#fff",
  padding: "40px",
  direction: "rtl",
};

const titleStyle = {
  textAlign: "center",
  color: "#ff3b3b",
  fontSize: "46px",
};

const logoutButtonStyle = {
  background: "#333",
  color: "#fff",
  border: "1px solid #555",
  padding: "10px 20px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "bold",
  marginBottom: "20px",
};

const notificationStyle = {
  background: "#16a34a",
  color: "#fff",
  padding: "14px 20px",
  borderRadius: "12px",
  textAlign: "center",
  fontWeight: "bold",
  marginBottom: "20px",
};

const cardsWrapper = {
  display: "grid",
  gridTemplateColumns: "repeat(6, 1fr)",
  gap: "15px",
  margin: "30px 0",
};

const cardStyle = {
  background: "#1b1b1b",
  border: "1px solid #333",
  borderRadius: "12px",
  padding: "18px",
  textAlign: "center",
  fontSize: "20px",
  fontWeight: "bold",
};

const todayCardStyle = {
  background: "#7c3aed",
  border: "1px solid #7c3aed",
  borderRadius: "12px",
  padding: "18px",
  textAlign: "center",
  fontSize: "20px",
  fontWeight: "bold",
};

const chartsWrapper = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "20px",
  marginBottom: "30px",
};

const chartBoxStyle = {
  background: "#1b1b1b",
  border: "1px solid #333",
  borderRadius: "14px",
  padding: "20px",
};

const chartTitleStyle = {
  textAlign: "center",
  color: "#fff",
  marginBottom: "10px",
};

const topActionsStyle = {
  display: "flex",
  justifyContent: "center",
  marginBottom: "20px",
};

const exportButtonStyle = {
  background: "#16a34a",
  color: "#fff",
  border: "none",
  padding: "12px 24px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "16px",
};

const searchStyle = {
  width: "100%",
  padding: "16px",
  borderRadius: "12px",
  border: "1px solid #333",
  background: "#1b1b1b",
  color: "#fff",
  fontSize: "18px",
  marginBottom: "20px",
};

const filterContainer = {
  display: "flex",
  gap: "10px",
  marginBottom: "25px",
  justifyContent: "center",
  flexWrap: "wrap",
};

const filterBtn = {
  background: "#1b1b1b",
  color: "#fff",
  border: "1px solid #333",
  padding: "10px 20px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "bold",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  marginTop: "30px",
  background: "#111",
};

const cellStyle = {
  border: "1px solid #555",
  padding: "14px",
  textAlign: "center",
  fontSize: "16px",
};

const statusStyle = {
  color: "#fff",
  padding: "7px 12px",
  borderRadius: "20px",
  fontWeight: "bold",
  display: "inline-block",
};

const notesStyle = {
  width: "180px",
  minHeight: "80px",
  background: "#1b1b1b",
  color: "#fff",
  border: "1px solid #333",
  borderRadius: "8px",
  padding: "10px",
  resize: "vertical",
};

const saveNotesButtonStyle = {
  marginTop: "8px",
  background: "#2563eb",
  color: "#fff",
  border: "none",
  padding: "8px 12px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
};

const dateInputStyle = {
  background: "#1b1b1b",
  color: "#fff",
  border: "1px solid #333",
  borderRadius: "8px",
  padding: "10px",
};

const saveFollowUpButtonStyle = {
  marginTop: "8px",
  background: "#7c3aed",
  color: "#fff",
  border: "none",
  padding: "8px 12px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
};

const actionStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
};

const buttonStyle = {
  background: "#ff3b3b",
  color: "#fff",
  border: "none",
  padding: "8px 14px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
};

const whatsappButtonStyle = {
  background: "#25D366",
  color: "#fff",
  border: "none",
  padding: "8px 14px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
};

const deleteButtonStyle = {
  background: "#dc2626",
  color: "#fff",
  border: "none",
  padding: "8px 14px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
};

const detailsButtonStyle = {
  background: "#7c3aed",
  color: "#fff",
  border: "none",
  padding: "8px 14px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
};

const leadCardsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "20px",
  marginBottom: "35px",
};

const leadCardStyle = {
  background: "linear-gradient(145deg, #151515, #1f1f1f)",
  border: "1px solid #333",
  borderRadius: "18px",
  padding: "20px",
  boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
};

const leadCardHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "15px",
  marginBottom: "16px",
};

const leadNameStyle = {
  margin: 0,
  color: "#fff",
  fontSize: "22px",
};

const leadPhoneStyle = {
  margin: "6px 0 0",
  color: "#aaa",
};

const leadInfoStyle = {
  background: "#111",
  border: "1px solid #2a2a2a",
  borderRadius: "12px",
  padding: "12px",
  marginBottom: "14px",
  lineHeight: "1.7",
};

const leadMessageStyle = {
  color: "#ccc",
  fontSize: "14px",
  lineHeight: "1.6",
  minHeight: "45px",
};

const cardActionsStyle = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
};

const modalOverlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.75)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999,
};

const modalStyle = {
  width: "850px",
  maxWidth: "95%",
  background: "linear-gradient(145deg, #141414, #202020)",
  border: "1px solid #333",
  borderRadius: "20px",
  padding: "30px",
  color: "#fff",
  position: "relative",
  boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
};

const closeButtonStyle = {
  position: "absolute",
  top: "15px",
  left: "15px",
  background: "#dc2626",
  color: "#fff",
  border: "none",
  width: "36px",
  height: "36px",
  borderRadius: "50%",
  cursor: "pointer",
  fontSize: "22px",
};

const modalTitleStyle = {
  marginTop: 0,
  color: "#ff3b3b",
  fontSize: "34px",
};

const modalGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "14px",
  marginBottom: "20px",
};

const modalInfoBox = {
  background: "#111",
  border: "1px solid #333",
  borderRadius: "12px",
  padding: "14px",
};

const modalSectionStyle = {
  background: "#111",
  border: "1px solid #333",
  borderRadius: "12px",
  padding: "16px",
  marginBottom: "14px",
  lineHeight: "1.7",
};

const modalActionsStyle = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
  marginTop: "20px",
};

export default Leads;