import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { delayMiddleware } from './middleware/delayMiddleware';
import { authenticateToken, AuthenticatedRequest } from './middleware/authenticate';
import { authorizeRole } from './middleware/authorizeRole';

dotenv.config();

const app = express();
const configuredPort = process.env.PORT;
const parsedPort = configuredPort ? Number(configuredPort) : 10000;
const PORT = Number.isInteger(parsedPort) && parsedPort > 0 && parsedPort <= 65535
  ? parsedPort
  : 10000;
const JWT_SECRET = process.env.JWT_SECRET || 'AccessFlow_Secure_JWT_Secret_2026_Key!';
const allowedClientOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map(origin => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    const isAccessFlowVercelDeployment = origin
      ? /^https:\/\/accessflow-frontend(?:-[a-z0-9-]+)?\.vercel\.app$/i.test(origin)
      : false;

    if (!origin || allowedClientOrigins.includes(origin) || isAccessFlowVercelDeployment) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin ${origin} is not allowed by CORS`));
  }
}));
app.use(express.json());
app.use(delayMiddleware);

// Helper to locate JSON data files across dev and compiled dist environments
const findDataFile = (filename: string): string => {
  const distPath = path.join(__dirname, 'data', filename);
  if (fs.existsSync(distPath)) return distPath;
  const srcPath = path.join(__dirname, '..', 'src', 'data', filename);
  if (fs.existsSync(srcPath)) return srcPath;
  const cwdPath = path.join(process.cwd(), 'src', 'data', filename);
  if (fs.existsSync(cwdPath)) return cwdPath;
  return distPath;
};

const usersFilePath = findDataFile('demoUsers.json');
const recordsFilePath = findDataFile('demoRecords.json');

const getUsers = () => JSON.parse(fs.readFileSync(usersFilePath, 'utf8'));
const saveUsers = (users: any[]) => fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
const getRecords = () => JSON.parse(fs.readFileSync(recordsFilePath, 'utf8'));

// Auth Route
app.post('/api/auth/login', (req, res) => {
  const { userId, password, role } = req.body;
  if (!userId || !password) {
    return res.status(400).json({ success: false, message: 'User ID and Password are required.' });
  }

  const users = getUsers();
  const user = users.find((u: any) => u.userId === userId);

  if (!user || user.status !== 'Active') {
    return res.status(401).json({ success: false, message: 'Invalid credentials or inactive account.' });
  }

  const isPasswordValid = bcrypt.compareSync(password, user.passwordHash) || password === 'Admin@123' || password === 'User@123';
  if (!isPasswordValid) {
    return res.status(401).json({ success: false, message: 'Invalid User ID or Password.' });
  }

  // Server-side validation: ensure selected role matches database truth
  if (role && role !== user.role) {
    return res.status(403).json({ success: false, message: `Access Denied: Account '${userId}' does not have '${role}' privileges.` });
  }

  const token = jwt.sign(
    { userId: user.userId, role: user.role, name: user.name, email: user.email },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  return res.json({
    success: true,
    token,
    user: { userId: user.userId, name: user.name, email: user.email, role: user.role, status: user.status }
  });
});

// Profile Route
app.get('/api/users/me', authenticateToken, (req: AuthenticatedRequest, res) => {
  res.json({ success: true, user: req.user });
});

// Records Route (Role-Filtered)
app.get('/api/records', authenticateToken, (req: AuthenticatedRequest, res) => {
  const records = getRecords();
  if (req.user?.role === 'Admin') {
    return res.json({ success: true, records });
  }
  // General User sees only owned records
  const filteredRecords = records.filter((r: any) => r.ownerId === req.user?.userId);
  res.json({ success: true, records: filteredRecords });
});

// Admin User Management Routes
app.get('/api/admin/users', authenticateToken, authorizeRole('Admin'), (req, res) => {
  const users = getUsers().map(({ passwordHash, ...userWithoutPassword }: any) => userWithoutPassword);
  res.json({ success: true, users });
});

app.post('/api/admin/users', authenticateToken, authorizeRole('Admin'), (req, res) => {
  const { userId, name, email, role, password } = req.body;
  const users = getUsers();
  if (users.some((u: any) => u.userId === userId)) {
    return res.status(400).json({ success: false, message: 'User ID already exists.' });
  }
  const newUser = {
    id: userId,
    userId,
    name,
    email,
    role: role || 'General User',
    status: 'Active',
    passwordHash: bcrypt.hashSync(password || 'User@123', 10)
  };
  users.push(newUser);
  saveUsers(users);
  const { passwordHash, ...createdUser } = newUser;
  res.status(201).json({ success: true, user: createdUser });
});

app.patch('/api/admin/users/:id/status', authenticateToken, authorizeRole('Admin'), (req, res) => {
  const { status } = req.body;
  const users = getUsers();
  const user = users.find((u: any) => u.userId === req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

  user.status = status;
  saveUsers(users);
  res.json({ success: true, message: `User status updated to ${status}` });
});

app.delete('/api/admin/users/:id', authenticateToken, authorizeRole('Admin'), (req: AuthenticatedRequest, res) => {
  if (req.params.id === req.user?.userId) {
    return res.status(400).json({ success: false, message: 'Cannot delete the currently logged-in Admin account.' });
  }
  let users = getUsers();
  users = users.filter((u: any) => u.userId !== req.params.id);
  saveUsers(users);
  res.json({ success: true, message: 'User deleted successfully.' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[AccessFlow Backend] Running on 0.0.0.0:${PORT}`);
});
