import 'dotenv/config';
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "../models/User.js";

// Read envs directly and log if missing
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID?.trim();
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET?.trim();
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL?.trim();

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_CALLBACK_URL) {
  console.error("[AUTH] Missing Google OAuth envs:", {
    hasId: !!GOOGLE_CLIENT_ID,
    hasSecret: !!GOOGLE_CLIENT_SECRET,
    hasCb: !!GOOGLE_CALLBACK_URL,
  });
}

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: GOOGLE_CALLBACK_URL,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const googleId = profile?.id;
        const emails = profile?.emails || [];
        const primaryEmail = emails.find((e) => e.verified) || emails[0];
        const email = primaryEmail?.value?.toLowerCase?.();

        const name = profile?.name || {};
        const firstName = name.givenName || "";
        const lastName = name.familyName || "";
        const displayName = profile?.displayName || [firstName, lastName].filter(Boolean).join(" ");
        const photos = profile?.photos || [];
        const profilePictureUrl = photos[0]?.value || null;

        // Upsert by googleId; fallback to email
        let user = null;
        if (googleId) {
          user = await User.findOne({ googleId });
        }
        if (!user && email) {
          user = await User.findOne({ email });
        }

        if (!user) {
          user = new User({
            email,
            googleId,
            profilePictureUrl,
            identity: {
              firstName,
              lastName,
              displayName,
            },
            // Fallbacks for required fields
            fullName: displayName || email || "Anonymous",
            displayName: (displayName || email || "anonymous").toLowerCase().replace(/\s+/g, ""),
            isVerified: true,
          });
        } else {
          // Merge latest profile
          user.googleId = user.googleId || googleId;
          if (email && !user.email) user.email = email;
          if (profilePictureUrl) user.profilePictureUrl = profilePictureUrl;
          user.identity = {
            firstName: firstName || user.identity?.firstName || "",
            lastName: lastName || user.identity?.lastName || "",
            displayName: displayName || user.identity?.displayName || user.displayName || user.fullName,
          };
        }

        await user.save();
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

export default passport;


