import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import dotenv from 'dotenv';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import { WebSocket, WebSocketServer } from 'ws';
import { getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';

dotenv.config();

function getFirebaseAdminAuth() {
  try {
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (!fs.existsSync(configPath)) return null;
    const raw = JSON.parse(fs.readFileSync(configPath, 'utf8')) as { projectId?: string };
    const projectId = raw.projectId?.trim();
    if (!projectId || projectId === 'remixed-project-id') return null;
    const adminApp = getApps().length ? getApp() : initializeApp({ projectId });
    return getAdminAuth(adminApp);
  } catch (err) {
    console.error('Could not initialize Firebase ID token verifier:', err);
    return null;
  }
}

const firebaseAdminAuth = getFirebaseAdminAuth();

const PORT = Number(process.env.PORT || 3000);
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Ephemeral fallback signing key when SESSION_SECRET is unset
const SESSION_SECRET =
  process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 16
    ? process.env.SESSION_SECRET
    : crypto.randomBytes(32).toString('hex');

const VALID_CATEGORIES = new Set([
  'Graphic Design',
  'UI/UX',
  'Photography',
  'Architecture',
  'Development',
  'Illustration',
  'Writing',
  'Video',
  'Art',
  'Other',
]);

interface StoredAccount {
  id: string;
  googleUid?: string;
  username: string;
  displayName: string;
  email: string;
  passwordHash: string;
  bio: string;
  disciplines: string[];
  avatarUrl?: string;
  location?: string;
  onboardingComplete: boolean;
  savedProjectIds: string[];
  likedProjectIds: string[];
  createdAt: string;
}

interface StoredProject {
  id: string;
  title: string;
  description: string;
  category: string;
  imageUrl: string;
  externalUrl?: string;
  creatorId: string;
  createdAt: string;
  aspectHint?: 'portrait' | 'landscape' | 'square';
  likesCount: number;
  isSample?: boolean;
}

interface Community {
  id: string;
  name: string;
  category: string;
  description: string;
  memberIds: string[];
  createdBy: string;
  createdAt: string;
}

interface CommunityMessage {
  id: string;
  clientMsgId?: string;
  communityId: string;
  senderId: string;
  senderUsername: string;
  senderDisplayName: string;
  senderAvatarUrl?: string;
  text: string;
  createdAt: string;
}

interface DirectParticipant {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
}

interface DirectConversation {
  id: string;
  participantIds: string[];
  participants: DirectParticipant[];
  updatedAt: string;
}

interface DirectMessage {
  id: string;
  clientMsgId?: string;
  conversationId: string;
  senderId: string;
  senderUsername: string;
  senderDisplayName: string;
  senderAvatarUrl?: string;
  text: string;
  createdAt: string;
}

interface StoreState {
  accounts: StoredAccount[];
  projects: StoredProject[];
  sampleLikesDelta: Record<string, number>;
  communities: Community[];
  communityMessages: CommunityMessage[];
  directConversations: DirectConversation[];
  directMessages: DirectMessage[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const STORE_PATH = path.join(DATA_DIR, 'community-store.json');

const SEED_COMMUNITIES: Community[] = [
  {
    id: 'comm-print-type',
    name: 'Print & Type Studio',
    category: 'Graphic Design',
    description:
      'Editorial layout systems, risograph printmaking, Swiss grid studies, and independent zine craft.',
    memberIds: ['sample-creator-lin', 'sample-creator-nadia'],
    createdBy: 'sample-creator-lin',
    createdAt: '2026-11-01T10:00:00Z',
  },
  {
    id: 'comm-lens-darkroom',
    name: 'Lens & Darkroom',
    category: 'Photography',
    description:
      'Medium-format film, architectural light studies, documentary storytelling, and 35mm cinematography.',
    memberIds: ['sample-creator-kofi', 'sample-creator-einar'],
    createdBy: 'sample-creator-kofi',
    createdAt: '2026-11-02T14:00:00Z',
  },
  {
    id: 'comm-spatial-lab',
    name: 'Spatial & Object Lab',
    category: 'Architecture',
    description:
      'Physical scale models, raw stoneware ceramics, timber joinery, and quiet material investigations.',
    memberIds: ['sample-creator-kenji', 'sample-creator-clara'],
    createdBy: 'sample-creator-kenji',
    createdAt: '2026-11-03T09:30:00Z',
  },
  {
    id: 'comm-code-interfaces',
    name: 'Code & Interfaces',
    category: 'UI/UX',
    description:
      'Creative coding, pen-plotter algorithms, distraction-free instruments, and tactile digital tools.',
    memberIds: ['sample-creator-soren', 'sample-creator-arjun'],
    createdBy: 'sample-creator-soren',
    createdAt: '2026-11-04T16:15:00Z',
  },
  {
    id: 'comm-emerging-voices',
    name: 'Emerging Voices Circle',
    category: 'Other',
    description:
      'An open studio table across all disciplines. Share works-in-progress, ask questions, and encourage peers.',
    memberIds: ['sample-creator-marta', 'sample-creator-tomas', 'sample-creator-clara'],
    createdBy: 'sample-creator-clara',
    createdAt: '2026-11-05T11:00:00Z',
  },
];

const SEED_COMMUNITY_MESSAGES: CommunityMessage[] = [
  {
    id: 'seed-msg-1',
    communityId: 'comm-print-type',
    senderId: 'sample-creator-lin',
    senderUsername: 'lin.zhao',
    senderDisplayName: 'Lin Zhao',
    senderAvatarUrl: '/src/assets/images/creator_avatar_one_1795766390858.jpg',
    text: 'Welcome to Print & Type Studio. Feel free to share paper stock experiments, poster drafts, or grid questions.',
    createdAt: '2026-11-24T09:15:00Z',
  },
  {
    id: 'seed-msg-2',
    communityId: 'comm-lens-darkroom',
    senderId: 'sample-creator-kofi',
    senderUsername: 'kofi.mensah',
    senderDisplayName: 'Kofi Mensah',
    senderAvatarUrl: '/src/assets/images/creator_avatar_two_1795766391168.jpg',
    text: 'Curious what film stocks or focal lengths everyone is shooting for late-autumn architectural light.',
    createdAt: '2026-11-24T13:40:00Z',
  },
  {
    id: 'seed-msg-3',
    communityId: 'comm-spatial-lab',
    senderId: 'sample-creator-kenji',
    senderUsername: 'kenji.mori',
    senderDisplayName: 'Kenji Mori',
    text: 'Just uploaded a 1:50 rammed-earth and charred cedar pavilion study — happy to talk physical model making.',
    createdAt: '2026-11-25T08:20:00Z',
  },
  {
    id: 'seed-msg-4',
    communityId: 'comm-code-interfaces',
    senderId: 'sample-creator-soren',
    senderUsername: 'soren.lind',
    senderDisplayName: 'Soren Lind',
    text: 'Exploring monochrome hardware displays and generative SVG plotters here. Drop links to anything tactile you are building.',
    createdAt: '2026-11-25T15:10:00Z',
  },
  {
    id: 'seed-msg-5',
    communityId: 'comm-emerging-voices',
    senderId: 'sample-creator-clara',
    senderUsername: 'clara.morel',
    senderDisplayName: 'Clara Morel',
    senderAvatarUrl: '/src/assets/images/creator_avatar_four_1795766392015.jpg',
    text: 'Every creator starts somewhere unseen. Introduce your medium and what you are working on this week.',
    createdAt: '2026-11-26T10:00:00Z',
  },
];

function loadStore(): StoreState {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf8');
      const parsed = JSON.parse(raw) as Partial<StoreState>;
      return {
        accounts: Array.isArray(parsed.accounts) ? parsed.accounts : [],
        projects: Array.isArray(parsed.projects) ? parsed.projects : [],
        sampleLikesDelta:
          parsed.sampleLikesDelta && typeof parsed.sampleLikesDelta === 'object'
            ? parsed.sampleLikesDelta
            : {},
        communities:
          Array.isArray(parsed.communities) && parsed.communities.length > 0
            ? parsed.communities
            : SEED_COMMUNITIES,
        communityMessages: Array.isArray(parsed.communityMessages)
          ? parsed.communityMessages
          : SEED_COMMUNITY_MESSAGES,
        directConversations: Array.isArray(parsed.directConversations)
          ? parsed.directConversations
          : [],
        directMessages: Array.isArray(parsed.directMessages) ? parsed.directMessages : [],
      };
    }
  } catch (err) {
    console.error('Failed to read store, initializing fresh state:', err);
  }
  return {
    accounts: [],
    projects: [],
    sampleLikesDelta: {},
    communities: [...SEED_COMMUNITIES],
    communityMessages: [...SEED_COMMUNITY_MESSAGES],
    directConversations: [],
    directMessages: [],
  };
}

let store: StoreState = loadStore();

function saveStore(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to persist store:', err);
  }
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash) return false;
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  if (!salt || !keyHex) return false;
  const derived = crypto.scryptSync(password, salt, 64);
  const keyBuf = Buffer.from(keyHex, 'hex');
  if (derived.length !== keyBuf.length) return false;
  return crypto.timingSafeEqual(derived, keyBuf);
}

interface TokenPayload {
  sub: string;
  username: string;
  exp: number;
}

function signToken(account: StoredAccount): string {
  const payload: TokenPayload = {
    sub: account.id,
    username: account.username,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

function verifyToken(token: string): TokenPayload | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  if (!encoded || !sig) return null;
  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(encoded)
    .digest('base64url');

  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as TokenPayload;
    if (!payload.sub || typeof payload.exp !== 'number' || payload.exp < Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

function sanitizeAccount(account: StoredAccount) {
  return {
    id: account.id,
    username: account.username,
    displayName: account.displayName,
    email: account.email,
    bio: account.bio,
    disciplines: account.disciplines,
    avatarUrl: account.avatarUrl,
    location: account.location,
    onboardingComplete: account.onboardingComplete,
    savedProjectIds: account.savedProjectIds,
    likedProjectIds: account.likedProjectIds,
    isSample: false,
  };
}

interface AuthenticatedRequest extends Request {
  authUser?: StoredAccount;
}

function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  return header.slice(7).trim();
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const token = extractBearerToken(req);
  if (!token) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Session expired. Please sign in again.' });
    return;
  }
  const account = store.accounts.find((a) => a.id === payload.sub);
  if (!account) {
    res.status(401).json({ error: 'Account not found.' });
    return;
  }
  req.authUser = account;
  next();
}

function isSafeImageString(val: unknown): val is string {
  if (typeof val !== 'string') return false;
  if (val.startsWith('/src/assets/images/')) return true;
  if (/^\/api\/uploads\/[a-zA-Z0-9_-]+\.(png|jpg|jpeg|webp|gif)$/.test(val)) return true;
  if (val.startsWith('https://') && val.length <= 500) {
    try {
      const parsed = new URL(val);
      if (parsed.protocol === 'https:' && parsed.hostname.endsWith('.googleusercontent.com')) {
        return true;
      }
    } catch {
      return false;
    }
  }
  if (/^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(val)) {
    return val.length <= 3_500_000;
  }
  return false;
}

function persistImageInput(raw: string): string | null {
  if (raw.startsWith('/src/assets/images/') || /^\/api\/uploads\/[a-zA-Z0-9_-]+\.(png|jpg|jpeg|webp|gif)$/.test(raw)) {
    return raw;
  }
  const match = raw.match(/^data:image\/(png|jpeg|jpg|webp|gif);base64,([A-Za-z0-9+/=]+)$/);
  if (!match) return null;
  if (raw.length > 3_500_000) return null;

  const rawExt = match[1].toLowerCase();
  const ext = rawExt === 'jpeg' ? 'jpg' : rawExt;
  const filename = `img-${crypto.randomUUID()}.${ext}`;
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
  const buffer = Buffer.from(match[2], 'base64');
  fs.writeFileSync(path.join(UPLOADS_DIR, filename), buffer);
  return `/api/uploads/${filename}`;
}

function generateUniqueUsername(email: string, displayName?: string): string {
  const baseRaw = (email.split('@')[0] || displayName || 'creator')
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '.')
    .replace(/\.{2,}/g, '.')
    .replace(/^[._-]+|[._-]+$/g, '');
  let base = baseRaw.length >= 3 ? baseRaw.slice(0, 18) : `${baseRaw}studio`.slice(0, 18);
  if (!/^[a-z0-9._-]{3,24}$/.test(base)) {
    base = 'creator';
  }
  let candidate = base;
  let counter = 1;
  while (
    RESERVED_SAMPLE_USERNAMES.has(candidate) ||
    store.accounts.some((a) => a.username.toLowerCase() === candidate)
  ) {
    const suffix = `${counter}`;
    candidate = `${base.slice(0, 24 - suffix.length)}${suffix}`;
    counter += 1;
  }
  return candidate;
}

const SAMPLE_PARTICIPANTS: Record<string, DirectParticipant> = {
  'sample-creator-lin': {
    id: 'sample-creator-lin',
    username: 'lin.zhao',
    displayName: 'Lin Zhao',
    avatarUrl: '/src/assets/images/creator_avatar_one_1795766390858.jpg',
  },
  'sample-creator-kofi': {
    id: 'sample-creator-kofi',
    username: 'kofi.mensah',
    displayName: 'Kofi Mensah',
    avatarUrl: '/src/assets/images/creator_avatar_two_1795766391168.jpg',
  },
  'sample-creator-clara': {
    id: 'sample-creator-clara',
    username: 'clara.morel',
    displayName: 'Clara Morel',
    avatarUrl: '/src/assets/images/creator_avatar_four_1795766392015.jpg',
  },
  'sample-creator-kenji': {
    id: 'sample-creator-kenji',
    username: 'kenji.mori',
    displayName: 'Kenji Mori',
  },
  'sample-creator-soren': {
    id: 'sample-creator-soren',
    username: 'soren.lind',
    displayName: 'Soren Lind',
  },
  'sample-creator-arjun': {
    id: 'sample-creator-arjun',
    username: 'arjun.k',
    displayName: 'Arjun Kulkarni',
  },
  'sample-creator-marta': {
    id: 'sample-creator-marta',
    username: 'marta.soler',
    displayName: 'Marta Soler',
  },
  'sample-creator-einar': {
    id: 'sample-creator-einar',
    username: 'einar.holm',
    displayName: 'Einar Holm',
  },
  'sample-creator-nadia': {
    id: 'sample-creator-nadia',
    username: 'nadia.benali',
    displayName: 'Nadia Benali',
  },
  'sample-creator-tomas': {
    id: 'sample-creator-tomas',
    username: 'tomas.novak',
    displayName: 'Tomáš Novák',
  },
};

function findParticipantInfo(creatorId: string): DirectParticipant | null {
  const registered = store.accounts.find((a) => a.id === creatorId);
  if (registered) {
    return {
      id: registered.id,
      username: registered.username,
      displayName: registered.displayName,
      avatarUrl: registered.avatarUrl,
    };
  }
  return SAMPLE_PARTICIPANTS[creatorId] ?? null;
}

const RESERVED_SAMPLE_USERNAMES = new Set(
  Object.values(SAMPLE_PARTICIPANTS).map((p) => p.username.toLowerCase())
);

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '4mb' }));

  const httpServer = http.createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  interface ConnectedClient {
    ws: WebSocket;
    userId: string | null;
    username: string | null;
  }

  const clients = new Set<ConnectedClient>();

  function broadcastAll(event: { type: string; payload: unknown }) {
    const serialized = JSON.stringify(event);
    for (const client of clients) {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(serialized);
      }
    }
  }

  function broadcastToUsers(userIds: string[], event: { type: string; payload: unknown }) {
    const allowed = new Set(userIds);
    const serialized = JSON.stringify(event);
    for (const client of clients) {
      if (client.ws.readyState === WebSocket.OPEN && client.userId && allowed.has(client.userId)) {
        client.ws.send(serialized);
      }
    }
  }

  function broadcastPresence() {
    const onlineUsernames = Array.from(
      new Set(
        Array.from(clients)
          .map((c) => c.username)
          .filter((u): u is string => Boolean(u))
      )
    );
    broadcastAll({
      type: 'presence:update',
      payload: {
        connectedCount: clients.size,
        onlineUsernames,
      },
    });
  }

  wss.on('connection', (ws) => {
    const client: ConnectedClient = { ws, userId: null, username: null };
    clients.add(client);

    // Send immediate presence snapshot to newly connected client
    broadcastPresence();

    ws.on('message', (rawData) => {
      try {
        const parsed = JSON.parse(rawData.toString()) as {
          type?: string;
          token?: string;
        };

        if (parsed.type === 'auth' && typeof parsed.token === 'string') {
          const payload = verifyToken(parsed.token);
          if (payload) {
            const acc = store.accounts.find((a) => a.id === payload.sub);
            if (acc) {
              client.userId = acc.id;
              client.username = acc.username;
              broadcastPresence();
            }
          }
        }
      } catch {
        // Ignore malformed WebSocket frames
      }
    });

    ws.on('close', () => {
      clients.delete(client);
      broadcastPresence();
    });
  });

  // Health
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  // Public creators directory (safe fields only)
  app.get('/api/creators', (_req, res) => {
    const registered = store.accounts.map((a) => ({
      id: a.id,
      username: a.username,
      displayName: a.displayName,
      bio: a.bio,
      disciplines: a.disciplines,
      avatarUrl: a.avatarUrl,
      location: a.location,
      isSample: false,
    }));
    res.json({ creators: registered });
  });

  // Uploaded Artwork Static Serving (strict allowlisted filenames only)
  app.get('/api/uploads/:filename', (req, res) => {
    const filename = path.basename(req.params.filename);
    if (!/^[a-zA-Z0-9_-]+\.(png|jpg|jpeg|webp|gif)$/.test(filename)) {
      res.status(404).end();
      return;
    }
    const filePath = path.join(UPLOADS_DIR, filename);
    if (!fs.existsSync(filePath)) {
      res.status(404).end();
      return;
    }
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.sendFile(filePath);
  });

  // Public Projects Exhibition Feed
  app.get('/api/projects', (_req, res) => {
    res.json({
      projects: store.projects,
      sampleLikesDelta: store.sampleLikesDelta,
    });
  });

  // Publish New Project
  app.post('/api/projects', requireAuth, (req: AuthenticatedRequest, res) => {
    const account = req.authUser!;
    const body = req.body as {
      id?: unknown;
      title?: unknown;
      description?: unknown;
      category?: unknown;
      imageUrl?: unknown;
      externalUrl?: unknown;
      aspectHint?: unknown;
    };

    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const category = typeof body.category === 'string' ? body.category.trim() : 'Other';
    const rawImage = typeof body.imageUrl === 'string' ? body.imageUrl.trim() : '';
    const rawExternal = typeof body.externalUrl === 'string' ? body.externalUrl.trim() : '';
    const aspectHint =
      body.aspectHint === 'portrait' ||
      body.aspectHint === 'landscape' ||
      body.aspectHint === 'square'
        ? body.aspectHint
        : 'portrait';

    if (title.length < 2 || title.length > 100) {
      res.status(400).json({ error: 'Project title must be 2–100 characters.' });
      return;
    }
    if (description.length < 10 || description.length > 1200) {
      res.status(400).json({ error: 'Description must be 10–1200 characters.' });
      return;
    }
    if (!VALID_CATEGORIES.has(category)) {
      res.status(400).json({ error: 'Select a valid creative discipline.' });
      return;
    }
    if (!isSafeImageString(rawImage)) {
      res.status(400).json({ error: 'Provide a valid artwork image (max ~2.5MB).' });
      return;
    }

    let externalUrl: string | undefined;
    if (rawExternal) {
      try {
        const candidate = /^https?:\/\//i.test(rawExternal) ? rawExternal : `https://${rawExternal}`;
        const parsed = new URL(candidate);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          res.status(400).json({ error: 'External URL must use http or https.' });
          return;
        }
        externalUrl = parsed.toString().slice(0, 500);
      } catch {
        res.status(400).json({ error: 'Enter a valid external URL.' });
        return;
      }
    }

    const storedImageUrl = persistImageInput(rawImage);
    if (!storedImageUrl) {
      res.status(400).json({ error: 'Could not store uploaded image.' });
      return;
    }

    const cleanCustomId =
      typeof body.id === 'string' && /^[a-zA-Z0-9_-]{3,80}$/.test(body.id)
        ? body.id
        : `proj-${crypto.randomUUID().slice(0, 12)}`;

    const project: StoredProject = {
      id: cleanCustomId,
      title,
      description,
      category,
      imageUrl: storedImageUrl,
      externalUrl,
      creatorId: account.id,
      createdAt: new Date().toISOString(),
      aspectHint,
      likesCount: 0,
      isSample: false,
    };

    store.projects.unshift(project);
    saveStore();
    broadcastAll({ type: 'project:created', payload: project });
    res.status(201).json({ project });
  });

  // Delete Own Published Project
  app.delete('/api/projects/:id', requireAuth, (req: AuthenticatedRequest, res) => {
    const account = req.authUser!;
    const projectId = req.params.id;
    const idx = store.projects.findIndex((p) => p.id === projectId);
    if (idx === -1) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }
    const target = store.projects[idx];
    if (target.creatorId !== account.id) {
      res.status(403).json({ error: 'You can only delete your own published works.' });
      return;
    }
    store.projects.splice(idx, 1);

    // Clean up local uploaded image if unused elsewhere
    if (target.imageUrl.startsWith('/api/uploads/')) {
      const filename = path.basename(target.imageUrl);
      const stillReferenced = store.projects.some((p) => p.imageUrl === target.imageUrl);
      if (!stillReferenced) {
        const filePath = path.join(UPLOADS_DIR, filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }

    saveStore();
    broadcastAll({ type: 'project:deleted', payload: { projectId } });
    res.json({ ok: true });
  });

  // Auth: Google / Gmail Firebase ID Token Sign-In
  app.post('/api/auth/google', async (req, res) => {
    if (!firebaseAdminAuth) {
      res.status(503).json({ error: 'Google sign-in is not configured on this server.' });
      return;
    }

    const body = req.body as { idToken?: unknown };
    const idToken = typeof body.idToken === 'string' ? body.idToken.trim() : '';
    if (!idToken) {
      res.status(400).json({ error: 'Missing Google sign-in credential.' });
      return;
    }

    try {
      const decoded = await firebaseAdminAuth.verifyIdToken(idToken);
      const cleanEmail = typeof decoded.email === 'string' ? decoded.email.trim().toLowerCase() : '';
      if (!cleanEmail || decoded.email_verified !== true) {
        res.status(403).json({ error: 'Verified Gmail or Google email is required.' });
        return;
      }

      let account = store.accounts.find(
        (a) => a.googleUid === decoded.uid || a.id === decoded.uid || a.email.toLowerCase() === cleanEmail
      );
      let isNewUser = false;

      if (!account) {
        isNewUser = true;
        const username = generateUniqueUsername(cleanEmail, decoded.name);
        const displayName =
          typeof decoded.name === 'string' && decoded.name.trim()
            ? decoded.name.trim().slice(0, 60)
            : username;
        const picture =
          typeof decoded.picture === 'string' && isSafeImageString(decoded.picture)
            ? decoded.picture
            : undefined;

        account = {
          id: decoded.uid,
          googleUid: decoded.uid,
          email: cleanEmail,
          username,
          displayName,
          passwordHash: '',
          bio: '',
          disciplines: [],
          avatarUrl: picture,
          onboardingComplete: false,
          savedProjectIds: [],
          likedProjectIds: [],
          createdAt: new Date().toISOString(),
        };
        store.accounts.push(account);
        saveStore();
      } else {
        let dirty = false;
        if (!account.googleUid) {
          account.googleUid = decoded.uid;
          dirty = true;
        }
        if (
          !account.avatarUrl &&
          typeof decoded.picture === 'string' &&
          isSafeImageString(decoded.picture)
        ) {
          account.avatarUrl = decoded.picture;
          dirty = true;
        }
        if (dirty) {
          saveStore();
        }
      }

      const token = signToken(account);
      res.json({ token, user: sanitizeAccount(account), isNewUser });
    } catch {
      res.status(401).json({ error: 'Invalid or expired Google credential.' });
    }
  });

  // Auth: Sign Up
  app.post('/api/auth/signup', (req, res) => {
    const body = req.body as { email?: unknown; username?: unknown; password?: unknown };
    const cleanEmail = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const cleanUsername =
      typeof body.username === 'string' ? body.username.trim().toLowerCase().replace(/^@/, '') : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!cleanEmail || !cleanEmail.includes('@') || cleanEmail.length > 120) {
      res.status(400).json({ error: 'Enter a valid email address.' });
      return;
    }
    if (!/^[a-z0-9._-]{3,24}$/.test(cleanUsername)) {
      res.status(400).json({
        error: 'Username must be 3–24 characters using letters, numbers, dots, or underscores.',
      });
      return;
    }
    if (password.length < 6 || password.length > 128) {
      res.status(400).json({ error: 'Password must be between 6 and 128 characters.' });
      return;
    }

    if (store.accounts.some((a) => a.email.toLowerCase() === cleanEmail)) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }
    if (
      RESERVED_SAMPLE_USERNAMES.has(cleanUsername) ||
      store.accounts.some((a) => a.username.toLowerCase() === cleanUsername)
    ) {
      res.status(409).json({ error: 'That username is already taken. Try another.' });
      return;
    }

    const newAccount: StoredAccount = {
      id: `creator-${crypto.randomUUID()}`,
      email: cleanEmail,
      username: cleanUsername,
      displayName: cleanUsername,
      passwordHash: hashPassword(password),
      bio: '',
      disciplines: [],
      onboardingComplete: false,
      savedProjectIds: [],
      likedProjectIds: [],
      createdAt: new Date().toISOString(),
    };

    store.accounts.push(newAccount);
    saveStore();

    const token = signToken(newAccount);
    res.status(201).json({ token, user: sanitizeAccount(newAccount) });
  });

  // Auth: Log In
  app.post('/api/auth/login', (req, res) => {
    const body = req.body as { identifier?: unknown; password?: unknown };
    const cleanId =
      typeof body.identifier === 'string'
        ? body.identifier.trim().toLowerCase().replace(/^@/, '')
        : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!cleanId || !password) {
      res.status(400).json({ error: 'Enter both your username/email and password.' });
      return;
    }

    const account = store.accounts.find(
      (a) => a.email.toLowerCase() === cleanId || a.username.toLowerCase() === cleanId
    );
    if (!account || !verifyPassword(password, account.passwordHash)) {
      res.status(401).json({ error: 'Invalid username/email or password.' });
      return;
    }

    const token = signToken(account);
    res.json({ token, user: sanitizeAccount(account) });
  });

  // Update Profile / Onboarding
  app.put('/api/auth/profile', requireAuth, (req: AuthenticatedRequest, res) => {
    const account = req.authUser!;
    const body = req.body as {
      displayName?: unknown;
      username?: unknown;
      bio?: unknown;
      disciplines?: unknown;
      avatarUrl?: unknown;
      location?: unknown;
      onboardingComplete?: unknown;
    };

    if (typeof body.username === 'string') {
      const cleanUsername = body.username.trim().toLowerCase().replace(/^@/, '');
      if (!/^[a-z0-9._-]{3,24}$/.test(cleanUsername)) {
        res.status(400).json({
          error: 'Username must be 3–24 characters using letters, numbers, dots, or underscores.',
        });
        return;
      }
      const conflict =
        RESERVED_SAMPLE_USERNAMES.has(cleanUsername) ||
        store.accounts.some(
          (a) => a.id !== account.id && a.username.toLowerCase() === cleanUsername
        );
      if (conflict) {
        res.status(409).json({ error: 'That username is already in use.' });
        return;
      }
      account.username = cleanUsername;
    }

    if (typeof body.displayName === 'string') {
      account.displayName = body.displayName.trim().slice(0, 60) || account.username;
    }
    if (typeof body.bio === 'string') {
      account.bio = body.bio.trim().slice(0, 280);
    }
    if (typeof body.location === 'string') {
      account.location = body.location.trim().slice(0, 60) || undefined;
    }
    if (Array.isArray(body.disciplines)) {
      account.disciplines = body.disciplines.filter(
        (d): d is string => typeof d === 'string' && VALID_CATEGORIES.has(d)
      );
    }
    if (body.avatarUrl === null || body.avatarUrl === '') {
      account.avatarUrl = undefined;
    } else if (body.avatarUrl !== undefined && isSafeImageString(body.avatarUrl)) {
      account.avatarUrl = body.avatarUrl;
    }
    if (typeof body.onboardingComplete === 'boolean') {
      account.onboardingComplete = body.onboardingComplete;
    }

    saveStore();
    res.json({ user: sanitizeAccount(account) });
  });

  // Toggle Like / Save
  app.post('/api/auth/interactions', requireAuth, (req: AuthenticatedRequest, res) => {
    const account = req.authUser!;
    const body = req.body as { type?: unknown; projectId?: unknown };
    const projectId = typeof body.projectId === 'string' ? body.projectId.trim() : '';

    if (!projectId || projectId.length > 100) {
      res.status(400).json({ error: 'Invalid project ID.' });
      return;
    }

    if (body.type === 'like') {
      const exists = account.likedProjectIds.includes(projectId);
      account.likedProjectIds = exists
        ? account.likedProjectIds.filter((id) => id !== projectId)
        : [...account.likedProjectIds, projectId];

      const delta = exists ? -1 : 1;
      const userProj = store.projects.find((p) => p.id === projectId);
      if (userProj) {
        userProj.likesCount = Math.max(0, userProj.likesCount + delta);
        broadcastAll({
          type: 'project:liked',
          payload: { projectId, likesCount: userProj.likesCount },
        });
      } else {
        store.sampleLikesDelta[projectId] = (store.sampleLikesDelta[projectId] ?? 0) + delta;
        broadcastAll({
          type: 'project:liked',
          payload: { projectId, sampleLikesDelta: store.sampleLikesDelta[projectId] },
        });
      }
    } else if (body.type === 'save') {
      const exists = account.savedProjectIds.includes(projectId);
      account.savedProjectIds = exists
        ? account.savedProjectIds.filter((id) => id !== projectId)
        : [...account.savedProjectIds, projectId];
    } else {
      res.status(400).json({ error: 'Invalid interaction type.' });
      return;
    }

    saveStore();
    res.json({
      user: sanitizeAccount(account),
      sampleLikesDelta: store.sampleLikesDelta,
    });
  });

  // Communities: List all
  app.get('/api/communities', (_req, res) => {
    const enriched = store.communities.map((c) => {
      const msgs = store.communityMessages.filter((m) => m.communityId === c.id);
      const last = msgs[msgs.length - 1];
      return {
        ...c,
        messageCount: msgs.length,
        lastMessageText: last?.text ?? null,
        lastMessageAt: last?.createdAt ?? c.createdAt,
      };
    });
    res.json({ communities: enriched });
  });

  // Communities: Create
  app.post('/api/communities', requireAuth, (req: AuthenticatedRequest, res) => {
    const account = req.authUser!;
    const body = req.body as { name?: unknown; category?: unknown; description?: unknown };
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const category = typeof body.category === 'string' ? body.category.trim() : 'Other';
    const description = typeof body.description === 'string' ? body.description.trim() : '';

    if (name.length < 3 || name.length > 50) {
      res.status(400).json({ error: 'Community name must be 3–50 characters.' });
      return;
    }
    if (!VALID_CATEGORIES.has(category)) {
      res.status(400).json({ error: 'Select a valid creative discipline.' });
      return;
    }
    if (description.length < 6 || description.length > 240) {
      res.status(400).json({ error: 'Description must be 6–240 characters.' });
      return;
    }

    if (store.communities.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      res.status(409).json({ error: 'A community with that name already exists.' });
      return;
    }

    const community: Community = {
      id: `comm-${crypto.randomUUID().slice(0, 8)}`,
      name,
      category,
      description,
      memberIds: [account.id],
      createdBy: account.id,
      createdAt: new Date().toISOString(),
    };

    store.communities.unshift(community);
    saveStore();

    const enriched = {
      ...community,
      messageCount: 0,
      lastMessageText: null,
      lastMessageAt: community.createdAt,
    };

    broadcastAll({ type: 'community:created', payload: enriched });
    res.status(201).json({ community: enriched });
  });

  // Communities: Join or Leave
  app.post('/api/communities/:id/membership', requireAuth, (req: AuthenticatedRequest, res) => {
    const account = req.authUser!;
    const communityId = req.params.id;
    const body = req.body as { action?: unknown };

    const community = store.communities.find((c) => c.id === communityId);
    if (!community) {
      res.status(404).json({ error: 'Community not found.' });
      return;
    }

    if (body.action === 'join') {
      if (!community.memberIds.includes(account.id)) {
        community.memberIds.push(account.id);
      }
    } else if (body.action === 'leave') {
      community.memberIds = community.memberIds.filter((id) => id !== account.id);
    } else {
      res.status(400).json({ error: 'Action must be join or leave.' });
      return;
    }

    saveStore();
    broadcastAll({
      type: 'community:membership',
      payload: {
        communityId: community.id,
        memberIds: community.memberIds,
      },
    });
    res.json({ communityId: community.id, memberIds: community.memberIds });
  });

  // Communities: Get messages
  app.get('/api/communities/:id/messages', (req, res) => {
    const communityId = req.params.id;
    const community = store.communities.find((c) => c.id === communityId);
    if (!community) {
      res.status(404).json({ error: 'Community not found.' });
      return;
    }
    const messages = store.communityMessages
      .filter((m) => m.communityId === communityId)
      .slice(-150);
    res.json({ messages });
  });

  // Communities: Send message
  app.post('/api/communities/:id/messages', requireAuth, (req: AuthenticatedRequest, res) => {
    const account = req.authUser!;
    const communityId = req.params.id;
    const body = req.body as { text?: unknown; clientMsgId?: unknown };

    const community = store.communities.find((c) => c.id === communityId);
    if (!community) {
      res.status(404).json({ error: 'Community not found.' });
      return;
    }

    const text = typeof body.text === 'string' ? body.text.trim() : '';
    if (!text || text.length > 1000) {
      res.status(400).json({ error: 'Message must be 1–1000 characters.' });
      return;
    }

    const clientMsgId = typeof body.clientMsgId === 'string' ? body.clientMsgId : undefined;
    if (clientMsgId) {
      const existing = store.communityMessages.find((m) => m.clientMsgId === clientMsgId);
      if (existing) {
        res.json({ message: existing });
        return;
      }
    }

    // Automatically join community if user chats in it
    if (!community.memberIds.includes(account.id)) {
      community.memberIds.push(account.id);
      broadcastAll({
        type: 'community:membership',
        payload: { communityId: community.id, memberIds: community.memberIds },
      });
    }

    const message: CommunityMessage = {
      id: `msg-${crypto.randomUUID()}`,
      clientMsgId,
      communityId,
      senderId: account.id,
      senderUsername: account.username,
      senderDisplayName: account.displayName,
      senderAvatarUrl: account.avatarUrl,
      text,
      createdAt: new Date().toISOString(),
    };

    store.communityMessages.push(message);
    if (store.communityMessages.length > 1500) {
      store.communityMessages = store.communityMessages.slice(-1500);
    }
    saveStore();

    broadcastAll({ type: 'community:message', payload: message });
    res.status(201).json({ message });
  });

  // Direct Conversations: List user's threads
  app.get('/api/conversations', requireAuth, (req: AuthenticatedRequest, res) => {
    const account = req.authUser!;
    const conversations = store.directConversations
      .filter((conv) => conv.participantIds.includes(account.id))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map((conv) => {
        const msgs = store.directMessages.filter((m) => m.conversationId === conv.id).slice(-100);
        return {
          ...conv,
          messages: msgs,
        };
      });

    res.json({ conversations });
  });

  // Direct Conversations: Start or retrieve 1-on-1 thread
  app.post('/api/conversations/start', requireAuth, (req: AuthenticatedRequest, res) => {
    const account = req.authUser!;
    const body = req.body as { targetCreatorId?: unknown };
    const targetCreatorId = typeof body.targetCreatorId === 'string' ? body.targetCreatorId.trim() : '';

    if (!targetCreatorId || targetCreatorId === account.id) {
      res.status(400).json({ error: 'Select another creator to message.' });
      return;
    }

    const target = findParticipantInfo(targetCreatorId);
    if (!target) {
      res.status(404).json({ error: 'Creator not found.' });
      return;
    }

    const pair = [account.id, target.id].sort();
    let conversation = store.directConversations.find(
      (c) => c.participantIds[0] === pair[0] && c.participantIds[1] === pair[1]
    );

    if (!conversation) {
      conversation = {
        id: `dm-${crypto.randomUUID().slice(0, 8)}`,
        participantIds: pair,
        participants: [
          {
            id: account.id,
            username: account.username,
            displayName: account.displayName,
            avatarUrl: account.avatarUrl,
          },
          target,
        ],
        updatedAt: new Date().toISOString(),
      };
      store.directConversations.unshift(conversation);
      saveStore();
      broadcastToUsers(pair, {
        type: 'conversation:started',
        payload: { ...conversation, messages: [] },
      });
    }

    const messages = store.directMessages
      .filter((m) => m.conversationId === conversation!.id)
      .slice(-100);
    res.json({ conversation: { ...conversation, messages } });
  });

  // Direct Conversations: Send message
  app.post('/api/conversations/:id/messages', requireAuth, (req: AuthenticatedRequest, res) => {
    const account = req.authUser!;
    const conversationId = req.params.id;
    const body = req.body as { text?: unknown; clientMsgId?: unknown };

    const conversation = store.directConversations.find((c) => c.id === conversationId);
    if (!conversation || !conversation.participantIds.includes(account.id)) {
      res.status(404).json({ error: 'Conversation not found.' });
      return;
    }

    const text = typeof body.text === 'string' ? body.text.trim() : '';
    if (!text || text.length > 1000) {
      res.status(400).json({ error: 'Message must be 1–1000 characters.' });
      return;
    }

    const clientMsgId = typeof body.clientMsgId === 'string' ? body.clientMsgId : undefined;
    if (clientMsgId) {
      const existing = store.directMessages.find((m) => m.clientMsgId === clientMsgId);
      if (existing) {
        res.json({ message: existing });
        return;
      }
    }

    const message: DirectMessage = {
      id: `dmsg-${crypto.randomUUID()}`,
      clientMsgId,
      conversationId,
      senderId: account.id,
      senderUsername: account.username,
      senderDisplayName: account.displayName,
      senderAvatarUrl: account.avatarUrl,
      text,
      createdAt: new Date().toISOString(),
    };

    store.directMessages.push(message);
    conversation.updatedAt = message.createdAt;
    saveStore();

    broadcastToUsers(conversation.participantIds, {
      type: 'dm:message',
      payload: message,
    });
    res.status(201).json({ message });
  });

  // Mount Vite middleware in development or static dist/ in production
  if (!IS_PRODUCTION) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`UNSEEN server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start UNSEEN server:', err);
  process.exit(1);
});
