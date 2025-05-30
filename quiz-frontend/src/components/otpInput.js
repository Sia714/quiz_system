import React, { useRef, useState, useEffect } from "react";
import { Box, TextField } from "@mui/material";
import { keyframes } from "@mui/material";
const shake = keyframes`
  0% { transform: translateX(0); }
  20% { transform: translateX(-5px); }
  40% { transform: translateX(5px); }
  60% { transform: translateX(-5px); }
  80% { transform: translateX(5px); }
  100% { transform: translateX(0); }
`;

const OtpInput = ({ onOtpChange, hasError, disabled }) => {
  const [otpDigits, setOtpDigits] = useState(new Array(6).fill(""));
  const inputRefs = useRef([]);
  const dark = localStorage.getItem("darkMode");
  useEffect(() => {
    onOtpChange(otpDigits.join(""));
  }, [otpDigits, onOtpChange]);

  const handleChange = (index, value) => {
    if (!/^\d?$/.test(value) || disabled) return;
    const updated = [...otpDigits];
    updated[index] = value;
    setOtpDigits(updated);
    onOtpChange(updated.join(""));

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (disabled) return;

    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    if (disabled) return;
    const paste = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d{1,6}$/.test(paste)) return;

    const updated = paste.split("");
    while (updated.length < 6) updated.push("");

    setOtpDigits(updated);
    onOtpChange(updated.join(""));

    updated.forEach((val, i) => {
      if (val && inputRefs.current[i]) {
        inputRefs.current[i].value = val;
      }
    });

    inputRefs.current[Math.min(paste.length, 5)]?.focus();
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        gap: 1,
        mb: 3,
        animation: hasError ? `${shake} 0.4s ease-in-out` : "none",
      }}
    >
      {otpDigits.map((digit, index) => (
        <TextField
          key={index}
          inputRef={(el) => (inputRefs.current[index] = el)}
          value={digit}
          disabled={disabled}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          inputProps={{
            maxLength: 1,
            style: {
              textAlign: "center",
              fontSize: "24px",
              width: "36px",
              height: "42px",
              borderRadius: "8px",
              boxShadow: "0 2px 5px rgba(0, 0, 0, 0.15)",
              border: hasError ? "2px solid #f44336" : "2px solid #ccc",
              color: dark ? "#000" : "#fff", // text color
              backgroundColor: disabled
                ? dark
                  ? "#ccc" // dark mode + disabled
                  : "#444" // light mode + disabled
                : "#ddd",
              pointerEvents: disabled ? "none" : "auto",
              transition: "all 0.2s ease-in-out",
            },
          }}
          variant="outlined"
        />
      ))}
    </Box>
  );
};

export default OtpInput;
