import { Link } from "react-router-dom";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Home.css";
import DarkModeToggle from "../components/DarkModeToggle";
import TextField from "@mui/material/TextField";

const Home = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cpassword, setcPassword] = useState("");
  const [role, setRole] = useState("student");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1);
  const [otpExpiry, setOtpExpiry] = useState(120);
  const [isOtpExpired, setIsOtpExpired] = useState(false);

  const [errors, setErrors] = useState({
    registrationNumber: "",
    password: "",
    confirmPassword: "",
    fields: "",
  });

  const navigate = useNavigate();
  const handleLogin = async () => {
    if (!registrationNumber || !password) {
      setErrors({ fields: "All fields must be filled" });
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationNumber, password }),
      });

      const data = await res.json();

      if (res.ok && data.role) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role);
        localStorage.setItem("registrationNumber", data.registrationNumber);
        localStorage.setItem("section", data.section);
        localStorage.setItem("name", data.name);
        localStorage.setItem("darkMode", true);

        setTimeout(() => {
          const storedRole = localStorage.getItem("role");
          storedRole === "teacher"
            ? (window.location.href = "/teacherDash")
            : (window.location.href = "/studentDash");
        }, 200);
      } else {
        if (data.error === "User not found") {
          setErrors({
            fields: "User not found. Please check your registration number.",
          });
        } else if (data.error === "Invalid credentials") {
          setErrors({ fields: "Incorrect password. Please try again." });
        } else {
          setErrors({ fields: "Login failed. Please try again later." });
        }
      }
    } catch (err) {
      console.error("Error logging in:", err);
      setErrors({ fields: "Error logging in! Check your network connection." });
    }
  };

  const startOtpCountdown = () => {
    setOtpExpiry(120); // Reset OTP Timer
    setIsOtpExpired(false); // Reset Expiry

    let timeLeft = 120;
    const timer = setInterval(() => {
      timeLeft -= 1;
      setOtpExpiry(timeLeft);

      if (timeLeft <= 0) {
        clearInterval(timer);
        setIsOtpExpired(true);
      }
    }, 1000);
  };

  const sendOtp = async () => {
    if (!name || !registrationNumber || !email || !password || !cpassword) {
      setErrors({ fields: "All fields must be filled" });
      return;
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      setErrors({ email: "Invalid email format" });
      return;
    }
    if (password !== cpassword) {
      setErrors({ confirmPassword: "Passwords must match" });
      return;
    }
    if (role === "student" && !/^122\d{5}$/.test(registrationNumber)) {
      setErrors({
        registrationNumber:
          "Invalid registration number format. Should be: 122XXXXX",
      });
      return;
    }
    if (role === "teacher" && !/^\d{5}$/.test(registrationNumber)) {
      setErrors({
        registrationNumber:
          "Invalid registration number format. Should be: XXXXX",
      });
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (res.ok) {
        setStep(2); // Move to OTP verification step
        setOtpExpiry(120); // Reset timer to 30 seconds
        setIsOtpExpired(false); // Reset expiration state
        startOtpCountdown(); // Start countdown
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error("Error sending OTP:", err);
      alert("Error sending OTP. Check console.");
    }
  };
  const verifyOtpAndRegister = async () => {
    try {
      const res = await fetch("http://localhost:5000/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          otp,
          name,
          password,
          role,
          registrationNumber,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("Registration successful!");
        window.location.href = "/";
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error("Error verifying OTP:", err);
      alert("Error verifying OTP. Check console.");
    }
  };

  return (
    <div>
      <div className="header-top">
        <h1>Welcome to Quiz Portal</h1>
        <DarkModeToggle />
      </div>
      <div className="auth-container">
        <div className="tabs">
          <button
            className={isLogin ? "active" : ""}
            onClick={() => setIsLogin(true)}
          >
            Login
          </button>
          <button
            className={!isLogin ? "active" : ""}
            onClick={() => setIsLogin(false)}
          >
            Register
          </button>
        </div>

        {isLogin ? (
          <div className="login-form">
            <h2>Login</h2>
            <input
              type="text"
              placeholder="Registration Number"
              onChange={(e) => setRegistrationNumber(e.target.value)}
            />
            {errors.registrationNumber && (
              <p className="error">{errors.registrationNumber}</p>
            )}

            <input
              type="password"
              placeholder="Password"
              onChange={(e) => setPassword(e.target.value)}
            />
            <button onClick={handleLogin}>Login</button>
            {errors.fields && <p className="error">{errors.fields}</p>}
          </div>
        ) : (
          <div className="register-form">
            {step === 1 ? (
              <>
                {/* <input
                  type="text"
                  placeholder="Name"
                  onChange={(e) => setName(e.target.value)}
                />

                <input
                  type="text"
                  placeholder="Registration Number"
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                /> */}
                <TextField
                  id="outlined-basic"
                  label="Name"
                  variant="outlined"
                  size="small"
                  onChange={(e) => setName(e.target.value)}
                />
                <TextField
                  id="outlined-basic"
                  label="Registration Number"
                  variant="outlined"
                  size="small"
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                />
                {errors.registrationNumber && (
                  <p className="error">{errors.registrationNumber}</p>
                )}

                <input
                  type="email"
                  placeholder="Email"
                  onChange={(e) => setEmail(e.target.value)}
                />
                {errors.email && <p className="error">{errors.email}</p>}
                <input
                  type="password"
                  placeholder="Password"
                  onChange={(e) => setPassword(e.target.value)}
                />
                <input
                  type="password"
                  placeholder="Confirm Password"
                  onChange={(e) => setcPassword(e.target.value)}
                />
                {errors.confirmPassword && (
                  <p className="error">{errors.confirmPassword}</p>
                )}

                <div style={{ display: "flex", alignItems: "center" }}>
                  <input
                    type="radio"
                    id="student"
                    name="role"
                    value="student"
                    onChange={(e) => setRole(e.target.value)}
                  />
                  <label
                    htmlFor="student"
                    style={{ marginLeft: "1px", marginRight: "100px" }}
                  >
                    Student
                  </label>

                  <input
                    type="radio"
                    id="teacher"
                    name="role"
                    value="teacher"
                    onChange={(e) => setRole(e.target.value)}
                  />
                  <label
                    htmlFor="teacher"
                    style={{ marginLeft: "1px", marginRight: "150px" }}
                  >
                    Teacher
                  </label>
                </div>

                <button onClick={sendOtp}>Send OTP</button>
                {errors.fields && <p className="error">{errors.fields}</p>}
              </>
            ) : (
              <>
                <h2>Email sent to {email}</h2>
                {isOtpExpired ? (
                  <h3 className="otp-expired">OTP Expired</h3>
                ) : (
                  <h3>OTP expires in {otpExpiry} seconds</h3>
                )}
                <input
                  type="text"
                  placeholder="Enter OTP"
                  value={otp ?? ""}
                  onChange={(e) => setOtp(e.target.value)}
                />
                {isOtpExpired ? (
                  <button onClick={sendOtp}>Resend OTP</button>
                ) : (
                  <button disabled>{`Wait (${otpExpiry}s)`}</button>
                )}
                <button onClick={verifyOtpAndRegister}>Register</button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
