import { useState, useRef } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Tabs,
  Tab,
  Divider,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  Grid,
  Fade,
  Zoom,
  useTheme,
  useMediaQuery,
  Avatar,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  SvgIcon,
} from "@mui/material";
import {
  Assignment as AssignmentIcon,
  People as PeopleIcon,
  Quiz as QuizIcon,
  AccessTime as AccessTimeIcon,
  Visibility as VisibilityIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  VerifiedUser as VerifiedUserIcon,
  Code as CodeIcon,
  Storage as StorageIcon,
  Security as SecurityIcon,
  BuildCircle as BuildCircleIcon,
} from "@mui/icons-material";
import DarkModeToggle from "../components/DarkModeToggle";

const Home = () => {
  const API_BASE = process.env.REACT_APP_API_URL;
  const [isLoading] = useState(false);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode == "dark";
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState(1);
  const [otpExpiry, setOtpExpiry] = useState(120);
  const [isOtpExpired, setIsOtpExpired] = useState(false);
  const [canResendOtp, setCanResendOtp] = useState(false);
  const [name, setName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cpassword, setcPassword] = useState("");
  const [role, setRole] = useState("student");
  const [otp, setOtp] = useState("");
  const [errors, setErrors] = useState({});
  const formRef = useRef(null);
  const techStack = [
    { Icon: CodeIcon, label: "React + MUI", desc: "Frontend UI & logic" },
    {
      Icon: BuildCircleIcon,
      label: "Node.js",
      desc: "Backend server handling",
    },
    {
      Icon: StorageIcon,
      label: "MongoDB",
      desc: "Database for quizzes & users",
    },
    {
      Icon: SecurityIcon,
      label: "OTP Verification",
      desc: "Secure authentication system",
    },
  ];
  const teacherFeatures = [
    "Create and allot quizzes ",
    "Set quiz durations and password protection",
    "Edit quiz title, section, timings, and questions",
    "Approve student registrations",
    "View student results",
  ];

  const studentFeatures = [
    "Register via OTP",
    "Enroll in courses and view registered quizzes",
    "Attempt quizzes within allowed time",
    "One-time submission, no re-attempt",
    "Color-coded navigation with review tracking",
  ];

  const quizSecurity = [
    "Password protected access",
    "Auto-submit on time end",
    "Tab-switch detection",
    "Auto-submit on 3 attempts",
  ];

  const renderList = (items, Icon) =>
    items.map((text, i) => (
      <ListItem key={i}>
        <ListItemIcon>
          <SvgIcon component={Icon} color="primary" />
        </ListItemIcon>
        <ListItemText primary={text} />
      </ListItem>
    ));

  const handleLogin = async () => {
    if (!registrationNumber || !password) {
      setErrors({ fields: "All fields must be filled" });
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationNumber, password }),
      });

      const data = await res.json();

      if (res.ok && data.role) {
        localStorage.setItem("role", data.role);
        localStorage.setItem("registrationNumber", data.registrationNumber);
        localStorage.setItem("section", data.section);
        localStorage.setItem("name", data.name);
        localStorage.setItem("darkMode", true);

        setTimeout(() => {
          const storedRole = localStorage.getItem("role");
          if (
            storedRole === "teacher"
              ? (window.location.href = "/TeacherDash")
              : (window.location.href = "/StudentDash")
          );
        }, 200);
      } else {
        const msg =
          data.error === "User not found"
            ? "User not found. Check registration number."
            : data.error === "Invalid credentials"
            ? "Incorrect password. Try again."
            : "Login failed. Try later.";
        setErrors({ fields: msg });
      }
    } catch (err) {
      setErrors({ fields: "Network error. Try again." });
    }
  };

  const sendOtp = async () => {
    if (!name || !registrationNumber || !email || !password || !cpassword) {
      setErrors({ fields: "All fields must be filled" });
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setErrors({ email: "Invalid email format" });
      return;
    }

    if (password !== cpassword) {
      setErrors({ confirmPassword: "Passwords must match" });
      return;
    }

    const validReg =
      role === "student"
        ? /^122\d{5}$/.test(registrationNumber)
        : /^\d{5}$/.test(registrationNumber);

    if (!validReg) {
      setErrors({
        registrationNumber:
          role === "student"
            ? "Format: 122XXXXX"
            : "Teacher format: 5 digits only",
      });
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (res.ok) {
        setOtp("");
        setStep(2);
        startOtpCountdown();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert("Error sending OTP.");
    }
  };

  const verifyOtpAndRegister = async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
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
      alert("Error verifying OTP.");
    }
  };

  const startOtpCountdown = () => {
    let timeLeft = 120;
    setOtpExpiry(timeLeft);
    setIsOtpExpired(false);
    setCanResendOtp(false);

    const timer = setInterval(() => {
      timeLeft -= 1;
      setOtpExpiry(timeLeft);

      if (timeLeft === 90) {
        setCanResendOtp(true);
      }

      if (timeLeft <= 0) {
        clearInterval(timer);
        setIsOtpExpired(true);
      }
    }, 1000);
  };

  return (
    <Box sx={{ px: isMobile ? 2 : 6, py: 6 }}>
      {/* Hero Section */}
      <Box textAlign="center" mb={8}>
        <Zoom in={true} style={{ transitionDelay: "100ms" }}>
          <Box>
            <Typography
              variant={isMobile ? "h4" : "h3"}
              fontWeight="bold"
              gutterBottom
              sx={{
                background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                display: "inline-block",
              }}
            >
              Welcome to QuizMaster 🚀
            </Typography>
            <DarkModeToggle color="#000" />
            <Typography
              variant={isMobile ? "body1" : "h6"}
              color="text.secondary"
              paragraph
            >
              The ultimate platform for creating, managing, and participating in
              quizzes
            </Typography>
            <Button
              variant="contained"
              size="large"
              sx={{
                mt: 3,
                borderRadius: 5,
                px: 4,
                py: 1.5,
                fontWeight: "bold",
                boxShadow: `0 2px 5px ${theme.palette.primary.light}`,
                backgroundColor: "#5a6cd2",
              }}
              endIcon={<SchoolIcon />}
              onClick={() =>
                formRef.current.scrollIntoView({ behavior: "smooth" })
              }
            >
              Get Started
            </Button>
          </Box>
        </Zoom>
      </Box>
      {/* Features Grid */}
      <Box sx={{ mb: 10 }}>
        <Typography variant="h5" textAlign="center" mb={4} fontWeight="bold">
          Why Choose QuizMaster?
        </Typography>
        <Grid container spacing={3} justifyContent="center">
          {[
            {
              icon: <QuizIcon fontSize="large" color="primary" />,
              title: "Interactive Quizzes",
              desc: "Engaging question formats with multimedia support.",
            },
            {
              icon: <AccessTimeIcon fontSize="large" color="primary" />,
              title: "Real-time Analytics",
              desc: "Instant results and performance tracking.",
            },
            {
              icon: <VisibilityIcon fontSize="large" color="primary" />,
              title: "Secure Environment",
              desc: "Proctoring features to ensure quiz integrity.",
            },
            {
              icon: <VerifiedUserIcon fontSize="large" color="primary" />,
              title: "Easy Grading",
              desc: "Automated grading with manual override options.",
            },
          ].map((feature, index) => (
            <Grid xs={12} sm={6} md={3} key={index}>
              <Paper
                elevation={3}
                sx={{
                  p: 2,
                  textAlign: "center",
                  height: "100%",
                  borderRadius: 3,
                  transition: "transform 0.3s",
                  "&:hover": {
                    transform: "translateY(-5px)",
                    boxShadow: theme.shadows[6],
                  },
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: theme.palette.primary.light,
                    width: 60,
                    height: 60,
                    mx: "auto",
                    mb: 2,
                  }}
                >
                  {feature.icon}
                </Avatar>
                <Typography variant="h6" sx={{ mt: 1, fontWeight: 600 }}>
                  {feature.title}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  {feature.desc}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
      <Box sx={{ mb: 10, px: 2 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Power Features
        </Typography>
        <Divider />
        <Grid container spacing={3} mt={2}>
          <Grid xs={12} sm={6} md={4}>
            <Paper
              elevation={4}
              sx={{
                p: 2,
                height: "100%",
                transition: "transform 0.3s ease",
                "&:hover": { transform: "scale(1.05)", boxShadow: 10 },
              }}
            >
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                👨‍🏫 Teacher Features
              </Typography>
              <List>{renderList(teacherFeatures, AssignmentIcon)}</List>
            </Paper>
          </Grid>
          <Grid xs={12} sm={6} md={4}>
            <Paper
              elevation={4}
              sx={{
                p: 2,
                height: "100%",
                transition: "transform 0.3s ease",
                "&:hover": { transform: "scale(1.05)", boxShadow: 10 },
              }}
            >
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                👨‍🎓 Student Features
              </Typography>
              <List>{renderList(studentFeatures, PeopleIcon)}</List>
            </Paper>
          </Grid>
          <Grid xs={12} sm={12} md={4}>
            <Paper
              elevation={4}
              sx={{
                p: 2,
                height: "100%",
                transition: "transform 0.3s ease",
                "&:hover": { transform: "scale(1.05)", boxShadow: 10 },
              }}
            >
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                🔐 Security & Timing ㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤ
              </Typography>
              <List>{renderList(quizSecurity, LockIcon)}</List>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Auth Form */}
      <Box ref={formRef} sx={{ maxWidth: 600, mx: "auto" }}>
        <Paper
          elevation={4}
          sx={{
            p: 4,
            borderRadius: 3,
            background: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: theme.shadows[10],
          }}
        >
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={3}
          >
            <Typography variant="h4" fontWeight="bold">
              {isLogin ? "Welcome Back!" : "Create Account"}
            </Typography>
            <DarkModeToggle />
          </Box>

          <Tabs
            value={isLogin ? 0 : 1}
            onChange={(_, val) => setIsLogin(val === 0)}
            variant="fullWidth"
          >
            <Tab
              label="Login"
              icon={<PersonIcon />}
              iconPosition="start"
              sx={{
                fontWeight: 600,
                "&:hover": {
                  color: isDarkMode ? "#ff4d4d" : "#fff", // light red shade for hover
                },
              }}
            />
            <Tab
              label="Register"
              icon={<EmailIcon />}
              iconPosition="start"
              sx={{ fontWeight: 600 }}
            />
          </Tabs>

          <Divider sx={{ my: 3 }} />

          {isLogin ? (
            <Box component="form" sx={{ mt: 2 }}>
              <TextField
                fullWidth
                size="medium"
                label="Registration Number"
                margin="large"
                InputProps={{
                  startAdornment: <PersonIcon color="action" sx={{ mr: 2 }} />,
                }}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                size="medium"
                label="Password"
                type="password"
                margin="normal"
                InputProps={{
                  startAdornment: <LockIcon color="action" sx={{ mr: 2 }} />,
                }}
                onChange={(e) => setPassword(e.target.value)}
                sx={{ mb: 2 }}
              />
              {errors.fields && (
                <Typography color="error" variant="body2" sx={{ mb: 2 }}>
                  {errors.fields}
                </Typography>
              )}
              <Button
                fullWidth
                variant="contained"
                size="large"
                sx={{
                  mt: 2,
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: "bold",
                  fontSize: "1rem",
                  backgroundColor: "#5a6cd2",
                }}
                onClick={handleLogin}
                disabled={isLoading}
                startIcon={isLoading ? <CircularProgress size={20} /> : null}
              >
                {isLoading ? "Signing In..." : "Login"}
              </Button>
            </Box>
          ) : step === 1 ? (
            <Box component="form" sx={{ mt: 1 }}>
              <TextField
                fullWidth
                size="small"
                label="Full Name"
                margin="normal"
                onChange={(e) => setName(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                size="small"
                label="Registration Number"
                margin="normal"
                onChange={(e) => setRegistrationNumber(e.target.value)}
                sx={{ mb: errors.registrationNumber ? 0 : 2 }}
              />
              {errors.registrationNumber && (
                <Typography color="error" variant="body2" sx={{ mb: 2 }}>
                  {errors.registrationNumber}
                </Typography>
              )}
              <TextField
                fullWidth
                size="small"
                label="Email Address"
                margin="normal"
                onChange={(e) => setEmail(e.target.value)}
                sx={{ mb: errors.email ? 0 : 2 }}
              />
              {errors.email && (
                <Typography color="error" variant="body2" sx={{ mb: 2 }}>
                  {errors.email}
                </Typography>
              )}
              <TextField
                fullWidth
                size="small"
                label="Password"
                type="password"
                margin="normal"
                onChange={(e) => setPassword(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                size="small"
                label="Confirm Password"
                type="password"
                margin="normal"
                onChange={(e) => setcPassword(e.target.value)}
                sx={{ mb: errors.confirmPassword ? 0 : 2 }}
              />
              {errors.confirmPassword && (
                <Typography color="error" variant="body2" sx={{ mb: 2 }}>
                  {errors.confirmPassword}
                </Typography>
              )}
              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                Select your role:
              </Typography>
              <RadioGroup
                row
                value={role}
                onChange={(e) => setRole(e.target.value)}
                sx={{ mb: 2, justifyContent: "center" }}
              >
                <FormControlLabel
                  value="student"
                  control={<Radio color="primary" />}
                  label="Student"
                  sx={{ mr: 3 }}
                />
                <FormControlLabel
                  value="teacher"
                  control={<Radio color="primary" />}
                  label="Teacher"
                />
              </RadioGroup>
              {errors.fields && (
                <Typography color="error" variant="body2" sx={{ mb: 2 }}>
                  {errors.fields}
                </Typography>
              )}
              <Button
                variant="contained"
                fullWidth
                size="large"
                sx={{
                  mt: 2,
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: "bold",
                  fontSize: "1rem",
                }}
                onClick={sendOtp}
                disabled={isLoading}
                startIcon={isLoading ? <CircularProgress size={20} /> : null}
              >
                {isLoading ? "Sending OTP..." : "Continue"}
              </Button>
            </Box>
          ) : (
            <Box sx={{ textAlign: "center" }}>
              <VerifiedUserIcon color="primary" sx={{ fontSize: 60, mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 1 }}>
                Verification Code Sent
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                We've sent a 6-digit code to <br />
                <strong>{email}</strong>
              </Typography>
              <Typography
                variant="body2"
                color={isOtpExpired ? "error" : "text.secondary"}
                sx={{ mb: 3 }}
              >
                {isOtpExpired
                  ? "Code expired. Please request a new one."
                  : `Expires in ${otpExpiry} seconds`}
              </Typography>
              <TextField
                fullWidth
                size="small"
                label="Enter Verification Code"
                margin="normal"
                onChange={(e) => setOtp(e.target.value)}
                sx={{ mb: 3 }}
                inputProps={{ maxLength: 6 }}
              />
              <Box sx={{ display: "flex", gap: 2 }}>
                {canResendOtp ? (
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={sendOtp}
                    sx={{ py: 1.5 }}
                  >
                    Resend Code
                  </Button>
                ) : (
                  <Button fullWidth disabled sx={{ py: 1.5 }}>
                    Wait ({otpExpiry - 30}s)
                  </Button>
                )}
                <Button
                  variant="contained"
                  fullWidth
                  sx={{ py: 1.5 }}
                  onClick={verifyOtpAndRegister}
                >
                  Verify & Register
                </Button>
              </Box>
            </Box>
          )}
        </Paper>
      </Box>

      <Box sx={{ mt: 10, textAlign: "center" }}>
        <Typography variant="h5" fontWeight="bold" mb={4}>
          Behind the Scenes
        </Typography>
        <Grid container spacing={3} justifyContent="center">
          {techStack.map((item, index) => (
            <Grid
              xs={12}
              sm={6}
              md={4}
              key={index}
              sx={{
                transition: "transform 0.3s",
                "&:hover": {
                  transform: "translateY(-5px)",
                },
              }}
            >
              <Fade in={true} style={{ transitionDelay: `${index * 150}ms` }}>
                <Paper
                  elevation={3}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 1.5,
                    backgroundColor: (theme) =>
                      theme.palette.mode === "dark" ? "#1e1e1e" : "#f9f9f9",
                  }}
                >
                  <SvgIcon
                    component={item.Icon}
                    sx={{ fontSize: 40, color: "primary.main" }}
                  />
                  <Typography variant="h6" fontWeight="bold">
                    {item.label}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.desc}
                  </Typography>
                </Paper>
              </Fade>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
};

export default Home;
