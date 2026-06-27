import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const login = () => {
    if (email === "admin@luma.com" && password === "123456") {
      localStorage.setItem("luma_admin", "true");
      navigate("/leads");
    } else {
      setError("Email أو Password غلط");
    }
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <h1 style={{ color: "#ff3b3b" }}>Luma Admin Login</h1>

        <input
          style={inputStyle}
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          style={inputStyle}
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p style={{ color: "#ff3b3b" }}>{error}</p>}

        <button style={buttonStyle} onClick={login}>
          Login
        </button>
      </div>
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background: "#0f0f0f",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const cardStyle = {
  width: "400px",
  background: "#1b1b1b",
  padding: "30px",
  borderRadius: "16px",
  textAlign: "center",
  border: "1px solid #333",
};

const inputStyle = {
  width: "100%",
  padding: "14px",
  margin: "10px 0",
  borderRadius: "10px",
  border: "1px solid #333",
  background: "#111",
  color: "#fff",
  fontSize: "16px",
};

const buttonStyle = {
  width: "100%",
  padding: "14px",
  marginTop: "15px",
  borderRadius: "10px",
  border: "none",
  background: "#ff3b3b",
  color: "#fff",
  fontWeight: "bold",
  cursor: "pointer",
};

export default Login;