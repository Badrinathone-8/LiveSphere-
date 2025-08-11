import {User} from "../models/userModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

 const register = async (req, res) => {
  const { name,username, password } = req.body;
  try {
    const userExist = await User.findOne({ username });
    if (userExist) {
      return res.status(400).json({ message: "Username already taken" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ name,username, password: hashedPassword });

    res.status(201).json({ message: "User registered", user: newUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

 const login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(200).json({ message: "Login success", token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export {login,register}