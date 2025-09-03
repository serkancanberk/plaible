import dotenv from "dotenv";
dotenv.config();
import jwt from "jsonwebtoken";

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL,
  NODE_ENV
} = process.env;

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("❌ Missing JWT_SECRET in environment variables. Check your .env file.");
  throw new Error("JWT_SECRET is not defined");
}

export const oauthConfig = {
  clientID: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  callbackURL: GOOGLE_CALLBACK_URL,
};

export function signJwt(payload, options = {}) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d", ...options });
}

export function verifyJwt(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    console.error("JWT verification failed", err);
    return null;
  }
}

export const isProduction = NODE_ENV === "production";


