import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

const router = express.Router();

// Convert "DD / MM / YYYY" to a Date
function parseDob(dobStr) {
  const digits = (dobStr || "").replace(/\D/g, "");
  if (digits.length !== 8) return null;

  const day = Number(digits.slice(0, 2));
  const month = Number(digits.slice(2, 4));
  const year = Number(digits.slice(4, 8));

  const d = new Date(year, month - 1, day);

  const valid =
    d.getFullYear() === year &&
    d.getMonth() === month - 1 &&
    d.getDate() === day;

  return valid ? d : null;
}

router.post("/register", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      dob,
      phone,
      email,
      password,
      confirmPassword,
    } = req.body;

    if (!firstName || !lastName || !dob || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters." });
    }

    const dobDate = parseDob(dob);
    if (!dobDate) {
      return res.status(400).json({ message: "Invalid date of birth." });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ message: "Email already registered." });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      firstName,
      lastName,
      dob: dobDate,
      phone: phone || "",
      email: normalizedEmail,
      passwordHash,
    });

    return res.status(201).json({
      message: "Account created",
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error." });
  }
});

export default router;