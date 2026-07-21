import express, { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "db.json");
const JWT_SECRET = process.env.JWT_SECRET || "trackme_secret_key_super_secure_123!";

// Ensure db.json exists with initial structure
const initialDb = {
  users: [
    {
      id: 1,
      name: "Demo User",
      email: "user@trackme.com",
      password_hash: bcrypt.hashSync("password123", 10),
      role: "user",
      tracking_enabled: true,
      created_at: new Date(Date.now() - 3600000 * 24 * 7).toISOString() // 7 days ago
    },
    {
      id: 2,
      name: "Demo Admin",
      email: "admin@trackme.com",
      password_hash: bcrypt.hashSync("admin123", 10),
      role: "admin",
      tracking_enabled: false,
      created_at: new Date(Date.now() - 3600000 * 24 * 30).toISOString() // 30 days ago
    }
  ],
  locations: [
    {
      id: 1,
      user_id: 1,
      latitude: 37.7749,
      longitude: -122.4194,
      accuracy: 15,
      created_at: new Date(Date.now() - 600000).toISOString() // 10 mins ago
    },
    {
      id: 2,
      user_id: 1,
      latitude: 37.7752,
      longitude: -122.4182,
      accuracy: 12,
      created_at: new Date(Date.now() - 300000).toISOString() // 5 mins ago
    },
    {
      id: 3,
      user_id: 1,
      latitude: 37.7755,
      longitude: -122.4170,
      accuracy: 10,
      created_at: new Date().toISOString() // just now
    }
  ]
};

if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2));
}

// Helpers for Reading/Writing Database
function readDb() {
  try {
    const data = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading database file, resetting to initial state", error);
    return initialDb;
  }
}

function writeDb(data: any) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Express Middleware
app.use(express.json());

// Extend express Request interface for typed user
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    name: string;
    email: string;
    role: string;
    tracking_enabled: boolean;
  };
}

// Authenticate JWT Middleware
const authenticateJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(" ")[1];
    jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
      if (err) {
        res.status(403).json({ error: "Invalid or expired token" });
        return;
      }
      req.user = decoded;
      next();
    });
  } else {
    res.status(401).json({ error: "Authorization header is missing" });
  }
};

// Admin Auth Middleware
const authorizeAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ error: "Access denied: Admins only" });
  }
};

// ==========================================
// API ENDPOINTS (Supports both raw / and /api/)
// ==========================================

// Helper to handle duplicate route registration
const registerRoute = (
  method: "get" | "post" | "put" | "delete",
  paths: string[],
  handler: (req: any, res: Response, next: NextFunction) => void,
  middlewares: any[] = []
) => {
  paths.forEach((p) => {
    (app as any)[method](p, ...middlewares, handler);
  });
};

// POST /register
registerRoute("post", ["/register", "/api/register"], (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ error: "Name, email, and password are required" });
    return;
  }

  const db = readDb();
  const existingUser = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());

  if (existingUser) {
    res.status(400).json({ error: "User with this email already exists" });
    return;
  }

  const newUser = {
    id: db.users.length > 0 ? Math.max(...db.users.map((u: any) => u.id)) + 1 : 1,
    name,
    email: email.toLowerCase(),
    password_hash: bcrypt.hashSync(password, 10),
    role: role === "admin" ? "admin" : "user", // support custom roles during sign-up
    tracking_enabled: true,
    created_at: new Date().toISOString()
  };

  db.users.push(newUser);
  writeDb(db);

  // Return token immediately
  const token = jwt.sign(
    { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role, tracking_enabled: newUser.tracking_enabled },
    JWT_SECRET,
    { expiresIn: "24h" }
  );

  res.status(201).json({
    message: "Registration successful",
    token,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      tracking_enabled: newUser.tracking_enabled,
      created_at: newUser.created_at
    }
  });
});

// POST /login
registerRoute("post", ["/login", "/api/login"], (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const db = readDb();
  const user = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role, tracking_enabled: user.tracking_enabled },
    JWT_SECRET,
    { expiresIn: "24h" }
  );

  res.json({
    message: "Login successful",
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tracking_enabled: user.tracking_enabled,
      created_at: user.created_at
    }
  });
});

// GET /profile
registerRoute("get", ["/profile", "/api/profile"], (req: AuthenticatedRequest, res: Response) => {
  const db = readDb();
  const user = db.users.find((u: any) => u.id === req.user?.id);

  if (!user) {
    res.status(404).json({ error: "User profile not found" });
    return;
  }

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    tracking_enabled: user.tracking_enabled,
    created_at: user.created_at
  });
}, [authenticateJWT]);

// PUT /profile (Updates name, password, email, and tracking_enabled state)
registerRoute("put", ["/profile", "/api/profile"], (req: AuthenticatedRequest, res: Response) => {
  const { name, email, password, tracking_enabled } = req.body;
  const db = readDb();
  const userIndex = db.users.findIndex((u: any) => u.id === req.user?.id);

  if (userIndex === -1) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const user = db.users[userIndex];

  if (name) user.name = name;
  if (email) {
    // Check if email already taken
    const otherUser = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase() && u.id !== user.id);
    if (otherUser) {
      res.status(400).json({ error: "Email is already taken by another user" });
      return;
    }
    user.email = email.toLowerCase();
  }
  if (password) {
    user.password_hash = bcrypt.hashSync(password, 10);
  }
  if (tracking_enabled !== undefined) {
    user.tracking_enabled = !!tracking_enabled;
  }

  db.users[userIndex] = user;
  writeDb(db);

  // Sign a new token with updated user info
  const token = jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role, tracking_enabled: user.tracking_enabled },
    JWT_SECRET,
    { expiresIn: "24h" }
  );

  res.json({
    message: "Profile updated successfully",
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tracking_enabled: user.tracking_enabled,
      created_at: user.created_at
    }
  });
}, [authenticateJWT]);

// POST /location (User shares location)
registerRoute("post", ["/location", "/api/location"], (req: AuthenticatedRequest, res: Response) => {
  const { latitude, longitude, accuracy } = req.body;

  if (latitude === undefined || longitude === undefined) {
    res.status(400).json({ error: "Latitude and longitude are required" });
    return;
  }

  const db = readDb();
  const user = db.users.find((u: any) => u.id === req.user?.id);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  // Check if tracking is disabled globally/by admin for this user
  if (!user.tracking_enabled) {
    res.status(403).json({ error: "Location tracking is disabled for this user account" });
    return;
  }

  const newLocation = {
    id: db.locations.length > 0 ? Math.max(...db.locations.map((l: any) => l.id)) + 1 : 1,
    user_id: user.id,
    latitude: Number(latitude),
    longitude: Number(longitude),
    accuracy: accuracy !== undefined ? Number(accuracy) : null,
    created_at: new Date().toISOString()
  };

  db.locations.push(newLocation);
  writeDb(db);

  res.status(201).json({
    message: "Location recorded successfully",
    location: newLocation
  });
}, [authenticateJWT]);

// GET /location/current (Gets the last updated location for the logged-in user)
registerRoute("get", ["/location/current", "/api/location/current"], (req: AuthenticatedRequest, res: Response) => {
  const db = readDb();
  const userLocations = db.locations
    .filter((l: any) => l.user_id === req.user?.id)
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (userLocations.length === 0) {
    res.status(404).json({ error: "No location data found for this user" });
    return;
  }

  res.json(userLocations[0]);
}, [authenticateJWT]);

// GET /location/history (Gets the entire travel path history for the logged-in user)
registerRoute("get", ["/location/history", "/api/location/history"], (req: AuthenticatedRequest, res: Response) => {
  const db = readDb();
  const userLocations = db.locations
    .filter((l: any) => l.user_id === req.user?.id)
    .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()); // oldest to newest to represent path

  res.json(userLocations);
}, [authenticateJWT]);

// DELETE /location/history (Clears the location history for the logged-in user)
registerRoute("delete", ["/location/history", "/api/location/history"], (req: AuthenticatedRequest, res: Response) => {
  const db = readDb();
  db.locations = db.locations.filter((l: any) => l.user_id !== req.user?.id);
  writeDb(db);

  res.json({ message: "Location history cleared successfully" });
}, [authenticateJWT]);


// ==========================================
// ADMIN ENDPOINTS
// ==========================================

// GET /admin/users (Get all users)
registerRoute("get", ["/admin/users", "/api/admin/users"], (req: AuthenticatedRequest, res: Response) => {
  const db = readDb();
  const usersSafe = db.users.map((u: any) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    tracking_enabled: u.tracking_enabled,
    created_at: u.created_at
  }));

  res.json(usersSafe);
}, [authenticateJWT, authorizeAdmin]);

// GET /admin/locations (Gets all locations for monitoring, supports user filters)
registerRoute("get", ["/admin/locations", "/api/admin/locations"], (req: AuthenticatedRequest, res: Response) => {
  const db = readDb();
  // We can join with user details to make it super rich and useful
  const enrichedLocations = db.locations.map((loc: any) => {
    const user = db.users.find((u: any) => u.id === loc.user_id);
    return {
      ...loc,
      user_name: user ? user.name : "Unknown User",
      user_email: user ? user.email : "Unknown Email"
    };
  }).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  res.json(enrichedLocations);
}, [authenticateJWT, authorizeAdmin]);

// DELETE /admin/user/:id (Deletes a user and their locations)
registerRoute("delete", ["/admin/user/:id", "/api/admin/user/:id"], (req: AuthenticatedRequest, res: Response) => {
  const userIdToDelete = parseInt(req.params.id);

  if (isNaN(userIdToDelete)) {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }

  if (userIdToDelete === req.user?.id) {
    res.status(400).json({ error: "You cannot delete your own admin account" });
    return;
  }

  const db = readDb();
  const userExists = db.users.some((u: any) => u.id === userIdToDelete);

  if (!userExists) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  // Delete user and their locations
  db.users = db.users.filter((u: any) => u.id !== userIdToDelete);
  db.locations = db.locations.filter((l: any) => l.user_id !== userIdToDelete);
  writeDb(db);

  res.json({ message: `User ID ${userIdToDelete} and all their location records deleted successfully` });
}, [authenticateJWT, authorizeAdmin]);

// PUT /admin/user/:id/toggle-tracking (Enables/disables tracking for a user by admin)
registerRoute("put", ["/admin/user/:id/toggle-tracking", "/api/admin/user/:id/toggle-tracking"], (req: AuthenticatedRequest, res: Response) => {
  const userId = parseInt(req.params.id);
  const { tracking_enabled } = req.body;

  if (isNaN(userId) || tracking_enabled === undefined) {
    res.status(400).json({ error: "Invalid user ID or missing tracking_enabled field" });
    return;
  }

  const db = readDb();
  const userIndex = db.users.findIndex((u: any) => u.id === userId);

  if (userIndex === -1) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  db.users[userIndex].tracking_enabled = !!tracking_enabled;
  writeDb(db);

  res.json({
    message: `Location tracking successfully ${tracking_enabled ? "enabled" : "disabled"} for user ${db.users[userIndex].name}`,
    user: {
      id: db.users[userIndex].id,
      name: db.users[userIndex].name,
      email: db.users[userIndex].email,
      role: db.users[userIndex].role,
      tracking_enabled: db.users[userIndex].tracking_enabled
    }
  });
}, [authenticateJWT, authorizeAdmin]);


// ==========================================
// VITE / STATIC FILE SERVING
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development Mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    // Production Mode
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[TrackMe] Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
});
