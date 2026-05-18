import exp from "express";
import { authenticate } from "../Services/authService.js"; // Capital 'S'
import { UserTypeModel } from "../Models/UserModel.js"; // Capital 'M'
import bcrypt from "bcryptjs";

export const commonRouter = exp.Router();
// check auth status
commonRouter.get("/check-auth", verifyToken, async (req, res) => {
  try {
    // verifyToken middleware should attach 'req.user' if the token is valid
    const user = await UserTypeModel.findById(req.user.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "Authenticated", payload: user });
  } catch (error) {
    res.status(401).json({ message: "Not authenticated" });
  }
});
//login
commonRouter.post("/login", async (req, res) => {
  //get user cred object
  let userCred = req.body;
  //call authenticate service
  let { token, user } = await authenticate(userCred);
  //save tokan as httpOnly cookie
  res.cookie("token", token, {
  httpOnly: true,
  sameSite: "none",   // required for cross-origin
  secure: true,       // required when sameSite is "none"
});
  //send res
  res.status(200).json({ message: "login success", payload: user });
});

//logout for User, Author and Admin
commonRouter.get("/logout", (req, res) => {
  // Clear the cookie named 'token'
  res.clearCookie("token", {
  httpOnly: true,
  sameSite: "none",
  secure: true,
});

  res.status(200).json({ message: "Logged out successfully" });
});

//Change password(Protected route)
commonRouter.put("/change-password", async (req, res) => {
  //get current password and new password
  const { role, email, currentPassword, newPassword } = req.body;
  // Prevent same password
  if (currentPassword === newPassword) {
    return res.status(400).json({ message: "newPassword must be different from currentPassword" });
  }

  // Find user by email (works for USER, AUTHOR, ADMIN — all same collection)
  const account = await UserTypeModel.findOne({ email });
  if (!account) {
    return res.status(404).json({ message: "Account not found" });
  }

  // Verify current password
  const isMatch = await bcrypt.compare(currentPassword, account.password);
  if (!isMatch) {
    return res.status(401).json({ message: "Current password is incorrect" });
  }
  // Hash and save new password
  account.password = await bcrypt.hash(newPassword, 10);
  await account.save();

  res.status(200).json({ message: "Password changed successfully" });
});
