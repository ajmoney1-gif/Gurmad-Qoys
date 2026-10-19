import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Body parser
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Data storage configuration
const DATA_DIR = path.join(__dirname, '.data');
const DB_FILE = path.join(DATA_DIR, 'gurmad_db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Password hashing utilities using Node standard crypto
function hashPassword(password: string, salt = crypto.randomBytes(16).toString('hex')): string {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, key] = storedHash.split(':');
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

// Token generation and verification
const SECRET_KEY = process.env.SESSION_SECRET || 'gurmad-qoys-secure-local-secret-2026';

function generateToken(user: { id: string; email: string; role: string }): string {
  const payload = Buffer.from(
    JSON.stringify({
      id: user.id,
      email: user.email,
      role: user.role,
      exp: Date.now() + 30 * 24 * 60 * 60 * 1000,
    })
  ).toString('base64url');
  const signature = crypto.createHmac('sha256', SECRET_KEY).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function verifyToken(token: string): { id: string; email: string; role: string } | null {
  try {
    const [payload, signature] = token.split('.');
    if (!payload || !signature) return null;
    const expected = crypto.createHmac('sha256', SECRET_KEY).update(payload).digest('base64url');
    if (signature !== expected) return null;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (data.exp && data.exp < Date.now()) return null;
    return { id: data.id, email: data.email, role: data.role };
  } catch {
    return null;
  }
}

// Interface for DB schema
interface DatabaseSchema {
  users: Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    passwordHash: string;
    bio?: string;
    avatarUrl?: string;
    role: 'user' | 'moderator' | 'admin';
    createdAt: string;
  }>;
  people: Array<{
    id: string;
    name: string;
    age: number | string;
    category: 'Ilmo' | 'Qof weyn' | 'Waayeel' | 'Baahi gaar ah qaba';
    location: string;
    district?: string;
    city?: string;
    lastSeen: string;
    description: string;
    phone: string;
    relationship?: string;
    reportType: string;
    status: 'active' | 'found' | 'under_review';
    photoDataUrl?: string;
    ownerId?: string;
    ownerName?: string;
    createdAt: string;
    relativeTime?: string;
    likesCount: number;
    commentsCount: number;
    isPromoted?: boolean;
  }>;
  likes: Array<{
    reportId: string;
    userId: string;
    createdAt: string;
  }>;
  comments: Array<{
    id: string;
    reportId: string;
    userId?: string;
    authorName: string;
    text: string;
    createdAt: string;
  }>;
  campaigns: Array<{
    id: string;
    reportId: string;
    reportName: string;
    ownerId: string;
    objective: 'broad_awareness' | 'urgent_priority' | 'hyper_local';
    locations: string[];
    budget: number;
    durationDays: number;
    estimatedReachMin: number;
    estimatedReachMax: number;
    estimatedImpressionsMin: number;
    estimatedImpressionsMax: number;
    paymentMethod: 'evc_plus' | 'zaad' | 'sahal' | 'premier_wallet' | 'card';
    paymentPhone?: string;
    status: 'active' | 'under_review' | 'completed';
    actualImpressions: number;
    actualClicks: number;
    createdAt: string;
  }>;
  abuseReports: Array<{
    id: string;
    reportId: string;
    reason: string;
    notes: string;
    reporterContact?: string;
    createdAt: string;
  }>;
  notifications: Array<{
    id: string;
    userId: string;
    title: string;
    message: string;
    type: 'comment' | 'status_change' | 'campaign' | 'security';
    read: boolean;
    createdAt: string;
    linkId?: string;
  }>;
  supportTickets: Array<{
    id: string;
    userId?: string;
    name: string;
    contact: string;
    subject: string;
    message: string;
    status: 'open' | 'in_progress' | 'resolved';
    createdAt: string;
  }>;
}

// Initialize seed data
function getDefaultDB(): DatabaseSchema {
  const defaultUserId = 'user_ahmet_001';
  const hashedPw = hashPassword('Gurmad2026!');

  return {
    users: [
      {
        id: defaultUserId,
        name: 'Ahmet Omar',
        email: 'ahmetomarahmet0@gmail.com',
        phone: '+252615555555',
        passwordHash: hashedPw,
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
        bio: 'Xubin ka tirsan bulshada caawinta qoysaska Soomaaliyeed.',
        role: 'user',
        createdAt: '2026-10-10T08:00:00.000Z',
      },
      {
        id: 'user_admin_001',
        name: 'GURMAD QOYS Moderation',
        email: 'admin@gurmadqoys.so',
        phone: '+252615000000',
        passwordHash: hashedPw,
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
        bio: 'Kooxda xaqiijinta iyo ilaalinta xogta dadka maqan.',
        role: 'admin',
        createdAt: '2026-10-01T08:00:00.000Z',
      },
    ],
    people: [
      {
        id: 'report_cali_goobe',
        name: 'Cali Goobe',
        age: '8 sano',
        category: 'Ilmo',
        location: 'Deynile, Muqdisho',
        district: 'Deynile',
        city: 'Muqdisho',
        lastSeen: '16 Okt 2026, 10:30 subaxnimo',
        description: 'Wiil yar oo xiran funaanad buluug ah. Wuxuu ka maqan yahay xaafadda Deyniile agagaarka suuqa weyn.',
        phone: '+252615998877',
        relationship: 'Walaal',
        reportType: 'WAA LA RAADINAYAA',
        status: 'active',
        photoDataUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
        ownerId: defaultUserId,
        ownerName: 'Ahmet Omar',
        createdAt: '2026-10-18T10:30:00.000Z',
        relativeTime: '2 saac ka hor',
        likesCount: 128,
        commentsCount: 24,
        isPromoted: false,
      },
      {
        id: 'report_sahra_maxamed',
        name: 'Sahra Maxamed Warsame',
        age: '26 sano',
        category: 'Qof weyn',
        location: 'Hodan, Muqdisho',
        district: 'Hodan',
        city: 'Muqdisho',
        lastSeen: '14 Okt 2026, 6:00 galabnimo',
        description: 'Gabar xiran xijaab madoow. Waxaa ugu dambeysay agagaarka Isbitaalka Digfeer degmada Hodan.',
        phone: '+252612345678',
        relationship: 'Hooyo',
        reportType: 'WAA LA RAADINAYAA',
        status: 'active',
        photoDataUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        ownerId: defaultUserId,
        ownerName: 'Ahmet Omar',
        createdAt: '2026-10-18T07:00:00.000Z',
        relativeTime: '5 saac ka hor',
        likesCount: 92,
        commentsCount: 18,
        isPromoted: false,
      },
      {
        id: 'report_axmed_cali',
        name: 'Axmed Cali Xasan',
        age: '17 sano',
        category: 'Qof weyn',
        location: 'Kaxda, Muqdisho',
        district: 'Kaxda',
        city: 'Muqdisho',
        lastSeen: '12 Okt 2026, 3:00 galabnimo',
        description: 'Dhalinyaro 17 jir ah oo xiran hoodie madoow. Fadlan ciddii aragta ha la soo xiriirto qoyska.',
        phone: '+252619991122',
        relationship: 'Aabbe',
        reportType: 'WAA LA RAADINAYAA',
        status: 'active',
        photoDataUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
        ownerId: defaultUserId,
        ownerName: 'Ahmet Omar',
        createdAt: '2026-10-17T15:00:00.000Z',
        relativeTime: '1 maalin ka hor',
        likesCount: 210,
        commentsCount: 46,
        isPromoted: true,
      },
      {
        id: 'report_yuusuf_cali',
        name: 'Yuusuf Cali Xaashi',
        age: '76 sano',
        category: 'Waayeel',
        location: 'Kaxda, Muqdisho',
        district: 'Kaxda',
        city: 'Muqdisho',
        lastSeen: '10 Okt 2026, 05:00 galabnimo',
        description: 'Oday waayeel ah oo maqalku ku yaryahay, xiran macawis madoow iyo shaati caddaan ah.',
        phone: '+252618889900',
        relationship: 'Wiil uu dhalay',
        reportType: 'WAA LA RAADINAYAA',
        status: 'found',
        photoDataUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80',
        ownerId: 'user_admin_001',
        ownerName: 'Maamulka GURMAD',
        createdAt: '2026-10-15T15:20:00.000Z',
        relativeTime: '3 maalmood ka hor',
        likesCount: 65,
        commentsCount: 12,
        isPromoted: false,
      },
    ],
    likes: [
      {
        reportId: 'report_cali_goobe',
        userId: 'user_visitor_anon',
        createdAt: '2026-10-18T10:00:00.000Z',
      },
    ],
    comments: [
      {
        id: 'comment_001',
        reportId: 'report_cali_goobe',
        userId: 'user_axmadey',
        authorName: 'Axmadey Jaynes',
        text: 'Ninkaan wala Yaqaanaa, waxaan ku arkay agagaarka suuqa Deyniile shalay barqadii.',
        createdAt: '2026-10-18T17:22:29.000Z',
      },
      {
        id: 'comment_002',
        reportId: 'report_sahra_maxamed',
        userId: 'user_hodan',
        authorName: 'Faadumo Cali',
        text: 'Ilaahay ha soo celiyo gabadha yar. Qoyskeeda waxaan ugu baaqaynaa inay la xiriiraan ciidanka booliska saldhigga Hodan.',
        createdAt: '2026-10-18T14:10:00.000Z',
      },
    ],
    campaigns: [
      {
        id: 'camp_001',
        reportId: 'report_sahra_maxamed',
        reportName: 'Sahra Maxamed Warsame',
        ownerId: defaultUserId,
        objective: 'urgent_priority',
        locations: ['Muqdisho', 'Hodan', 'Waberi'],
        budget: 15,
        durationDays: 5,
        estimatedReachMin: 18000,
        estimatedReachMax: 45000,
        estimatedImpressionsMin: 28000,
        estimatedImpressionsMax: 65000,
        paymentMethod: 'evc_plus',
        paymentPhone: '+252615555555',
        status: 'active',
        actualImpressions: 12450,
        actualClicks: 418,
        createdAt: '2026-10-17T12:00:00.000Z',
      },
    ],
    abuseReports: [],
    notifications: [
      {
        id: 'notif_001',
        userId: defaultUserId,
        title: 'Faallo cusub',
        message: 'Axmadey Jaynes ayaa faallo ku daray warbixinta Cali Goobe.',
        type: 'comment',
        read: false,
        createdAt: '2026-10-18T17:22:30.000Z',
        linkId: 'report_cali_goobe',
      },
      {
        id: 'notif_002',
        userId: defaultUserId,
        title: 'Ololaha Promote waa firfircoon yahay',
        message: 'Ololaha Sahra Maxamed wuxuu gaaray in ka badan 12,000 oo qof.',
        type: 'campaign',
        read: true,
        createdAt: '2026-10-18T08:00:00.000Z',
        linkId: 'camp_001',
      },
    ],
    supportTickets: [],
  };
}

let db: DatabaseSchema;
try {
  if (fs.existsSync(DB_FILE)) {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    db = JSON.parse(raw);
  } else {
    db = getDefaultDB();
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  }
} catch (e) {
  console.error('Failed to load DB, initializing defaults:', e);
  db = getDefaultDB();
}

function saveDB() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  } catch (e) {
    console.error('Error saving DB to disk:', e);
  }
}

// Authentication Middleware
interface AuthenticatedRequest extends Request {
  user?: { id: string; email: string; role: string };
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Fadlan gal akoonkaaga si aad u sii wadato.' });
  }
  const token = authHeader.split(' ')[1];
  const user = verifyToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Fadhigaagu wuu dhacay. Fadlan mar kale gal.' });
  }
  req.user = user;
  next();
}

function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const user = verifyToken(token);
    if (user) req.user = user;
  }
  next();
}

// -------------------------------------------------------------
// AUTH ROUTES
// -------------------------------------------------------------
app.post('/api/auth/signup', (req: Request, res: Response) => {
  const { name, email, phone, password } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Fadlan geli magacaaga oo buuxa.' });
  }
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Fadlan geli email sax ah.' });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Furaha sirta ah waa inuu ugu yaraan ka koobnaadaa 6 xaraf.' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existing = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (existing) {
    return res.status(409).json({ error: 'Akoon leh email-kan horey ayaa loo diiwaangeliyey. Fadlan gal.' });
  }

  const newUser = {
    id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: name.trim(),
    email: normalizedEmail,
    phone: phone ? phone.trim() : '',
    passwordHash: hashPassword(password),
    role: 'user' as const,
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  saveDB();

  const token = generateToken(newUser);
  return res.status(201).json({
    token,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role,
      createdAt: newUser.createdAt,
    },
  });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Fadlan geli email-ka iyo furaha sirta ah.' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Email-ka ama furaha sirta ah ma saxna.' });
  }

  const token = generateToken(user);
  return res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      bio: user.bio,
      role: user.role,
      createdAt: user.createdAt,
    },
  });
});

app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = db.users.find((u) => u.id === req.user?.id);
  if (!user) {
    return res.status(404).json({ error: 'Akoonka lama helin.' });
  }
  return res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      bio: user.bio,
      role: user.role,
      createdAt: user.createdAt,
    },
  });
});

app.put('/api/auth/profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = db.users.find((u) => u.id === req.user?.id);
  if (!user) return res.status(404).json({ error: 'Akoonka lama helin.' });

  const { name, phone, bio } = req.body;
  if (name && name.trim()) user.name = name.trim();
  if (phone !== undefined) user.phone = phone.trim();
  if (bio !== undefined) user.bio = bio.trim();

  saveDB();
  return res.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      bio: user.bio,
      role: user.role,
      createdAt: user.createdAt,
    },
  });
});

app.post('/api/auth/forgot-password', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Fadlan geli email-kaaga.' });

  const normalized = email.toLowerCase().trim();
  const user = db.users.find((u) => u.email.toLowerCase() === normalized);
  // Return positive message even if not found to prevent user enumeration
  return res.json({
    success: true,
    message: 'Haddii email-kani jiro, fariin dib-u-dejinta furaha ah ayaa loo diray.',
  });
});

// -------------------------------------------------------------
// PEOPLE / MISSING PERSON REPORTS ROUTES
// -------------------------------------------------------------
app.get('/api/people', (req: Request, res: Response) => {
  const query = (req.query.q as string || '').toLowerCase().trim();
  const category = req.query.category as string;
  const status = req.query.status as string;

  let items = [...db.people];

  if (category && category !== 'Dhammaan' && category !== 'all') {
    items = items.filter((p) => p.category === category);
  }

  if (status && status !== 'Dhammaan' && status !== 'all') {
    items = items.filter((p) => p.status === status);
  }

  if (query) {
    items = items.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.location.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        String(p.age).includes(query)
    );
  }

  // Sort: promoted first, then newest
  items.sort((a, b) => {
    if (a.isPromoted && !b.isPromoted) return -1;
    if (!a.isPromoted && b.isPromoted) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return res.json({ items, total: items.length });
});

app.get('/api/my/people', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const items = db.people
    .filter((p) => p.ownerId === req.user?.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return res.json({ items });
});

app.get('/api/people/:id', (req: Request, res: Response) => {
  const report = db.people.find((p) => p.id === req.params.id);
  if (!report) {
    return res.status(404).json({ error: 'Warbixinta lama helin.' });
  }
  return res.json(report);
});

app.post('/api/people', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const {
    name,
    age,
    category,
    location,
    lastSeen,
    description,
    phone,
    relationship,
    reportType,
    photoDataUrl,
  } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Fadlan geli magaca oo buuxa ee qofka maqan.' });
  }
  if (!location || !location.trim()) {
    return res.status(400).json({ error: 'Fadlan geli goobtii ama degmadii ugu dambeysay.' });
  }
  if (!lastSeen || !lastSeen.trim()) {
    return res.status(400).json({ error: 'Fadlan geli taariikhda/waqtiga ugu dambeysay.' });
  }

  const user = req.user;
  const newReport = {
    id: `report_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: name.trim(),
    age: age || 'Lama yaqaan',
    category: category || 'Ilmo',
    location: location.trim(),
    lastSeen: lastSeen.trim(),
    description: description ? description.trim() : '',
    phone: phone ? phone.trim() : '',
    relationship: relationship ? relationship.trim() : 'Qaraabo',
    reportType: reportType || 'Warbixin la soo gudbiyey',
    status: 'active' as const,
    photoDataUrl: photoDataUrl || undefined,
    ownerId: user ? user.id : 'anon_' + Date.now(),
    ownerName: user ? (db.users.find((u) => u.id === user.id)?.name || 'Xubin GURMAD') : 'Xubin Bulshada',
    createdAt: new Date().toISOString(),
    likesCount: 0,
    commentsCount: 0,
    isPromoted: false,
  };

  db.people.unshift(newReport);
  saveDB();

  return res.status(201).json(newReport);
});

// Update report (status, edit details)
app.put('/api/people/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const report = db.people.find((p) => p.id === req.params.id);
  if (!report) return res.status(404).json({ error: 'Warbixinta lama helin.' });

  // Ownership check
  if (report.ownerId !== req.user?.id && req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Lama oggola: adigu ma lihid awoodda aad wax kaga beddesho warbixintan.' });
  }

  const { name, age, category, location, lastSeen, description, phone, status, photoDataUrl } = req.body;
  if (name) report.name = name.trim();
  if (age !== undefined) report.age = age;
  if (category) report.category = category;
  if (location) report.location = location.trim();
  if (lastSeen) report.lastSeen = lastSeen.trim();
  if (description !== undefined) report.description = description.trim();
  if (phone !== undefined) report.phone = phone.trim();
  if (status && ['active', 'found', 'under_review'].includes(status)) report.status = status;
  if (photoDataUrl !== undefined) report.photoDataUrl = photoDataUrl;

  saveDB();
  return res.json({ success: true, report });
});

// Toggle found status
app.post('/api/people/:id/status', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const report = db.people.find((p) => p.id === req.params.id);
  if (!report) return res.status(404).json({ error: 'Warbixinta lama helin.' });

  if (report.ownerId !== req.user?.id && req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Lama oggola: waxaad beddeli kartaa warbixinta aad adigu leedahay oo keliya.' });
  }

  report.status = report.status === 'found' ? 'active' : 'found';
  saveDB();
  return res.json({ success: true, status: report.status, report });
});

// Delete report
app.delete('/api/people/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const idx = db.people.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Warbixinta lama helin.' });

  const report = db.people[idx];
  if (report.ownerId !== req.user?.id && req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Lama oggola: ma tirtiri kartid warbixin aadan adigu lahayn.' });
  }

  db.people.splice(idx, 1);
  saveDB();
  return res.json({ success: true, message: 'Warbixinta si guul leh ayaa loo tirtiray.' });
});

// -------------------------------------------------------------
// SOCIAL: LIKES & COMMENTS
// -------------------------------------------------------------
app.get('/api/people/:id/social', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const reportId = req.params.id;
  const report = db.people.find((p) => p.id === reportId);
  if (!report) return res.status(404).json({ error: 'Warbixinta lama helin.' });

  const reportComments = db.comments.filter((c) => c.reportId === reportId);
  const currentUserId = req.user?.id || req.ip;
  const userLiked = db.likes.some((l) => l.reportId === reportId && l.userId === currentUserId);

  return res.json({
    likesCount: report.likesCount || 0,
    liked: userLiked,
    comments: reportComments,
  });
});

app.post('/api/people/:id/like', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const reportId = req.params.id;
  const report = db.people.find((p) => p.id === reportId);
  if (!report) return res.status(404).json({ error: 'Warbixinta lama helin.' });

  const currentUserId = req.user?.id || req.ip || 'guest_user';
  const likeIndex = db.likes.findIndex((l) => l.reportId === reportId && l.userId === currentUserId);

  let liked = false;
  if (likeIndex >= 0) {
    db.likes.splice(likeIndex, 1);
    report.likesCount = Math.max(0, (report.likesCount || 1) - 1);
    liked = false;
  } else {
    db.likes.push({
      reportId,
      userId: currentUserId,
      createdAt: new Date().toISOString(),
    });
    report.likesCount = (report.likesCount || 0) + 1;
    liked = true;

    // Send notification if owner is different
    if (report.ownerId && report.ownerId !== req.user?.id) {
      db.notifications.unshift({
        id: `notif_${Date.now()}`,
        userId: report.ownerId,
        title: 'Qof ayaa Like siiyey',
        message: `Warbixinta ${report.name} waxaa la siiyey Like cusub.`,
        type: 'comment',
        read: false,
        createdAt: new Date().toISOString(),
        linkId: report.id,
      });
    }
  }

  saveDB();
  return res.json({ liked, likesCount: report.likesCount });
});

app.post('/api/people/:id/comments', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const reportId = req.params.id;
  const report = db.people.find((p) => p.id === reportId);
  if (!report) return res.status(404).json({ error: 'Warbixinta lama helin.' });

  const { text, authorName } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Fadlan qor faalladaada.' });
  }

  const user = req.user ? db.users.find((u) => u.id === req.user?.id) : null;
  const name = user?.name || authorName || 'Xubin Bulshada';

  const newComment = {
    id: `comment_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    reportId,
    userId: user?.id,
    authorName: name,
    text: text.trim(),
    createdAt: new Date().toISOString(),
  };

  db.comments.push(newComment);
  report.commentsCount = (report.commentsCount || 0) + 1;

  if (report.ownerId && report.ownerId !== user?.id) {
    db.notifications.unshift({
      id: `notif_${Date.now()}`,
      userId: report.ownerId,
      title: 'Faallo cusub',
      message: `${name} ayaa faallo ku daray warbixinta ${report.name}.`,
      type: 'comment',
      read: false,
      createdAt: new Date().toISOString(),
      linkId: report.id,
    });
  }

  saveDB();
  return res.status(201).json(newComment);
});

// -------------------------------------------------------------
// CAMPAIGNS (PROMOTE)
// -------------------------------------------------------------
app.get('/api/campaigns', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const items = db.campaigns
    .filter((c) => c.ownerId === req.user?.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return res.json({ items });
});

app.post('/api/campaigns', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const {
    reportId,
    objective,
    locations,
    budget,
    durationDays,
    paymentMethod,
    paymentPhone,
  } = req.body;

  if (!reportId) {
    return res.status(400).json({ error: 'Fadlan dooro warbixinta aad rabto inaad Promote ku sameyso.' });
  }

  const report = db.people.find((p) => p.id === reportId);
  if (!report) {
    return res.status(404).json({ error: 'Warbixinta la doortay lama helin.' });
  }

  // STRICT OWNERSHIP RULE: Backend validation
  if (report.ownerId !== req.user?.id && req.user?.role !== 'admin') {
    return res.status(403).json({
      error: 'Lama oggola: dooro post aad adigu soo gudbisay oo aad leedahay.',
    });
  }

  const safeBudget = Math.max(1, Number(budget) || 5);
  const safeDays = Math.max(1, Number(durationDays) || 3);
  const mult = objective === 'urgent_priority' ? 1.25 : 1.0;

  const newCampaign = {
    id: `camp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    reportId: report.id,
    reportName: report.name,
    ownerId: req.user!.id,
    objective: objective || 'broad_awareness',
    locations: Array.isArray(locations) && locations.length > 0 ? locations : ['Muqdisho'],
    budget: safeBudget,
    durationDays: safeDays,
    estimatedReachMin: Math.round(safeBudget * 1100 * mult),
    estimatedReachMax: Math.round(safeBudget * 2900 * mult),
    estimatedImpressionsMin: Math.round(safeBudget * 1800 * mult),
    estimatedImpressionsMax: Math.round(safeBudget * 4500 * mult),
    paymentMethod: paymentMethod || 'evc_plus',
    paymentPhone: paymentPhone || '',
    status: 'active' as const,
    actualImpressions: Math.floor(Math.random() * 200) + 50,
    actualClicks: Math.floor(Math.random() * 25) + 5,
    createdAt: new Date().toISOString(),
  };

  db.campaigns.unshift(newCampaign);
  report.isPromoted = true;

  db.notifications.unshift({
    id: `notif_${Date.now()}`,
    userId: req.user!.id,
    title: 'Ololaha Promote waa bilaabmay',
    message: `Ololahaaga ${report.name} hadda waa firfircoon yahay waxaana loo gudbinayaa bulshada.`,
    type: 'campaign',
    read: false,
    createdAt: new Date().toISOString(),
    linkId: newCampaign.id,
  });

  saveDB();
  return res.status(201).json(newCampaign);
});

app.post('/api/campaigns/payment-intent', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { campaignId, method, phone, amount } = req.body;
  if (!phone || !phone.trim()) {
    return res.status(400).json({ error: 'Geli lambarka lacag-bixinta taleefanka.' });
  }

  const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  return res.json({
    success: true,
    transactionId,
    amount: Number(amount) || 5,
    method: method || 'evc_plus',
    message: `Lacag bixinta $${amount || 5} waxaa loo diray ${phone}. Fadlan aqbal USSD PIN-ka taleefankaaga.`,
  });
});

// -------------------------------------------------------------
// ABUSE & CORRECTION REPORTS
// -------------------------------------------------------------
app.post('/api/reports/abuse', (req: Request, res: Response) => {
  const { reportId, reason, notes, reporterContact } = req.body;
  if (!reportId || !reason) {
    return res.status(400).json({ error: 'Fadlan dooro sababta dacwada.' });
  }

  const newAbuseReport = {
    id: `abuse_${Date.now()}`,
    reportId,
    reason,
    notes: notes || '',
    reporterContact: reporterContact || '',
    createdAt: new Date().toISOString(),
  };

  db.abuseReports.push(newAbuseReport);
  saveDB();

  return res.status(201).json({
    success: true,
    message: 'Mahadsanid. Dacwadaada waxaa loo gudbiyey kooxda maamulka si loo xaqiijiyo.',
  });
});

// -------------------------------------------------------------
// NOTIFICATIONS
// -------------------------------------------------------------
app.get('/api/notifications', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  const userNotifs = userId
    ? db.notifications.filter((n) => n.userId === userId || !n.userId)
    : db.notifications.slice(0, 3);
  return res.json({ items: userNotifs });
});

app.post('/api/notifications/mark-read', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  db.notifications.forEach((n) => {
    if (n.userId === userId) n.read = true;
  });
  saveDB();
  return res.json({ success: true });
});

// -------------------------------------------------------------
// SUPPORT TICKETS
// -------------------------------------------------------------
app.post('/api/support', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const { name, contact, subject, message } = req.body;
  if (!subject || !message) {
    return res.status(400).json({ error: 'Fadlan geli mawduuca iyo fariintaada.' });
  }

  const ticket = {
    id: `ticket_${Date.now()}`,
    userId: req.user?.id,
    name: name || 'Xubin Bulshada',
    contact: contact || '',
    subject: subject.trim(),
    message: message.trim(),
    status: 'open' as const,
    createdAt: new Date().toISOString(),
  };

  db.supportTickets.push(ticket);
  saveDB();

  return res.status(201).json({
    success: true,
    message: 'Fariintaada waa la helay. Kooxda maamulka GURMAD QOYS ayaa sida ugu dhaqsiyaha badan kula soo xiriiraysa.',
  });
});

// -------------------------------------------------------------
// AI-ASSISTED FORM GUIDANCE & DUPLICATE DETECTION
// -------------------------------------------------------------
app.post('/api/ai/assist-report', async (req: Request, res: Response) => {
  const { name, age, category, location, lastSeen, description } = req.body;

  const suggestions: string[] = [];
  const missingPrompts: string[] = [];

  if (!description || description.trim().length < 25) {
    missingPrompts.push('Ku dar astaamo gaar ah sida: dharka uu xirnaa, midabka, hadalka ama xaalad caafimaad.');
  } else {
    const lowerDesc = description.toLowerCase();
    if (!lowerDesc.includes('dhark') && !lowerDesc.includes('xirn') && !lowerDesc.includes('shaat') && !lowerDesc.includes('funaanad') && !lowerDesc.includes('macawis') && !lowerDesc.includes('xijaab')) {
      suggestions.push('Fadlan xus midabka iyo nooca dharka uu qofku xirnaa markii ugu dambeysay.');
    }
  }

  if (category === 'Ilmo' && age && Number(age) > 17) {
    suggestions.push(`Da'da la geliyay (${age} sano) waxay ka badan tahay carruurta. Fadlan hubi qaybta.`);
  } else if (category === 'Waayeel' && age && Number(age) < 55) {
    suggestions.push(`Da'da (${age} sano) waxay u dhowdahay qof weyn. Fadlan hubi inaad doorato "Qof weyn".`);
  }

  if (location && !location.includes(',')) {
    suggestions.push('Ku dar labadaba degmada iyo magaalada (Tusaale: "Hodan, Muqdisho" ama "Deyniile, Muqdisho").');
  }

  let clarityScore = 70;
  if (name && name.trim().split(/\s+/).length >= 2) clarityScore += 10;
  if (description && description.trim().length >= 35) clarityScore += 10;
  if (location && location.trim().length >= 5) clarityScore += 10;

  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
    try {
      const ai = new GoogleGenAI();
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Adigu waxaad tahay khabiir caawiya qoysaska Soomaaliyeed ee qoraya baafinta dadka maqan (GURMAD QOYS).
Dib u eeg xogta:
- Magaca: ${name || 'Lama gelin'}
- Da'da: ${age || 'Lama gelin'} (${category || ''})
- Goobta: ${location || 'Lama gelin'}
- Waqtiga: ${lastSeen || 'Lama gelin'}
- Faahfaahinta: ${description || 'Lama gelin'}

Bixi 1 talo oo kooban (Somali hint) oo qoyska ka caawinaya inay si cad u qeexaan qofka si loo helo. Ugu badnaan 2 jumladood oo naxariis leh.`,
      });

      const aiText = response.text?.trim();
      if (aiText) {
        suggestions.unshift(aiText);
      }

      return res.json({
        suggestions,
        missingPrompts,
        clarityScore: Math.min(100, clarityScore),
        aiPowered: true,
      });
    } catch (err) {
      console.warn('Gemini assist error, using deterministic fallback', err);
    }
  }

  return res.json({
    suggestions,
    missingPrompts,
    clarityScore: Math.min(100, clarityScore),
    aiPowered: false,
  });
});

app.post('/api/ai/check-duplicate', (req: Request, res: Response) => {
  const { name, age, location } = req.body;
  if (!name || name.trim().length < 3) {
    return res.json({ isLikelyDuplicate: false, matches: [] });
  }

  const cleanName = name.trim().toLowerCase();
  const nameParts = cleanName.split(/\s+/).filter((p: string) => p.length > 2);

  const matches = db.people
    .filter((p) => p.status === 'active')
    .map((p) => {
      const pName = p.name.toLowerCase();
      const pParts = pName.split(/\s+/).filter((part: string) => part.length > 2);

      let score = 0;
      const reasons: string[] = [];

      const sharedParts = nameParts.filter((np: string) => pParts.includes(np));
      if (sharedParts.length >= 2) {
        score += 60;
        reasons.push(`Waxay wadaagaan magacyada: "${sharedParts.join(' ')}"`);
      } else if (sharedParts.length === 1 && nameParts.length === 1) {
        score += 25;
      }

      if (age && p.age) {
        const aNum = parseInt(String(age), 10);
        const bNum = parseInt(String(p.age), 10);
        if (!isNaN(aNum) && !isNaN(bNum) && Math.abs(aNum - bNum) <= 2) {
          score += 20;
          reasons.push(`Da'du waxay u dhowdahay (${p.age})`);
        }
      }

      if (location && p.location) {
        const lA = location.toLowerCase();
        const lB = p.location.toLowerCase();
        if (lA.includes(lB) || lB.includes(lA)) {
          score += 20;
          reasons.push(`Goobta waa isku mid (${p.location})`);
        }
      }

      return {
        id: p.id,
        name: p.name,
        age: p.age,
        location: p.location,
        score,
        matchReason: reasons.join(' · '),
        photoDataUrl: p.photoDataUrl,
      };
    })
    .filter((m) => m.score >= 50)
    .sort((a, b) => b.score - a.score);

  return res.json({
    isLikelyDuplicate: matches.length > 0,
    matches: matches.slice(0, 2),
  });
});

// -------------------------------------------------------------
// VITE OR STATIC FRONTEND SERVING
// -------------------------------------------------------------
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GURMAD QOYS Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
