import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";
import { randomBytes } from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

export function generateOTP(): string {
  return randomBytes(3).toString("hex").slice(0, 6).toUpperCase();
}

export function hashPassword(password: string): string {
  return bcryptjs.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcryptjs.compareSync(password, hash);
}

export function generateJWT(userId: string, email: string): string {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: "24h" });
}

export function verifyJWT(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export function getOTPExpiry(): Date {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + 5);
  return expiry;
}
