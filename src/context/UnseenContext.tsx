import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { SAMPLE_CREATORS, SAMPLE_PROJECTS } from '../data/sampleData';
import { auth, googleProvider } from '../firebase';
import {
  deleteProjectFromFirestore,
  syncGoogleAccountToFirestore,
  syncInteractionsToFirestore,
  syncProjectToFirestore,
} from '../services/firestoreSync';
import {
  Community,
  CommunityMessage,
  CreativeCategory,
  CreatorProfile,
  DirectConversation,
  DirectMessage,
  PrimaryTab,
  Project,
  ProjectDraft,
  UserAccount,
} from '../types/unseen';
import { rotateProjectsForDiscovery } from '../utils/discovery';
import { readStorage, writeStorage } from '../utils/storage';

const STORAGE_KEYS = {
  DRAFTS: 'unseen_drafts_v1',
  ACTIVE_EDITOR: 'unseen_active_editor_v1',
  RECENT_CREATORS: 'unseen_recent_creators_v1',
} as const;

export interface ActiveEditorState {
  editingDraftId: string | null;
  title: string;
  description: string;
  category: CreativeCategory;
  imageUrl: string;
  externalUrl: string;
  aspectHint: 'portrait' | 'landscape' | 'square';
}

const DEFAULT_EDITOR_STATE: ActiveEditorState = {
  editingDraftId: null,
  title: '',
  description: '',
  category: 'Graphic Design',
  imageUrl: '',
  externalUrl: '',
  aspectHint: 'portrait',
};

interface ToastState {
  id: number;
  message: string;
  tone?: 'default' | 'error';
}

interface UnseenContextValue {
  activeTab: PrimaryTab;
  setActiveTab: (tab: PrimaryTab) => void;
  currentUser: UserAccount | null;
  allCreators: CreatorProfile[];
  projects: Project[];
  orderedExploreProjects: Project[];
  rotateExploreFeed: () => void;
  getCreatorById: (id: string) => CreatorProfile | undefined;

  // Auth & Profile
  authModalOpen: boolean;
  authModalMode: 'login' | 'signup';
  authPromptReason: string | null;
  openAuthModal: (mode?: 'login' | 'signup', reason?: string) => void;
  closeAuthModal: () => void;
  signInWithGoogle: () => Promise<{ ok: boolean; isNewUser?: boolean; error?: string }>;
  signUp: (input: {
    email: string;
    username: string;
    password: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  login: (input: {
    identifier: string;
    password: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  completeOnboarding: (input: {
    displayName: string;
    bio: string;
    disciplines: CreativeCategory[];
    avatarUrl?: string;
    location?: string;
  }) => Promise<void>;
  updateProfile: (input: {
    displayName: string;
    username: string;
    bio: string;
    disciplines: CreativeCategory[];
    avatarUrl?: string;
    location?: string;
  }) => Promise<{ ok: boolean; error?: string }>;

  // Interactions
  toggleLike: (projectId: string) => void;
  toggleSave: (projectId: string) => void;
  isLiked: (projectId: string) => boolean;
  isSaved: (projectId: string) => boolean;

  // Publishing & Drafts
  activeEditor: ActiveEditorState;
  updateEditorField: <K extends keyof ActiveEditorState>(field: K, value: ActiveEditorState[K]) => void;
  resetEditor: () => void;
  drafts: ProjectDraft[];
  saveCurrentAsDraft: () => { ok: boolean; error?: string };
  loadDraftIntoEditor: (draftId: string) => void;
  deleteDraft: (draftId: string) => void;
  publishFromEditor: () => Promise<{ ok: boolean; project?: Project; error?: string }>;
  publishExistingDraft: (draftId: string) => Promise<{ ok: boolean; project?: Project; error?: string }>;
  deletePublishedProject: (projectId: string) => Promise<void>;

  // Communities & Real-time Chat
  wsConnected: boolean;
  onlineCount: number;
  onlineUsernames: string[];
  communities: Community[];
  communitiesLoading: boolean;
  activeCommunityId: string | null;
  selectCommunity: (communityId: string | null) => void;
  communityMessagesByRoom: Record<string, CommunityMessage[]>;
  loadingRoomMessages: boolean;
  createCommunity: (input: {
    name: string;
    category: CreativeCategory;
    description: string;
  }) => Promise<{ ok: boolean; community?: Community; error?: string }>;
  toggleCommunityMembership: (communityId: string) => Promise<void>;
  sendCommunityMessage: (
    communityId: string,
    text: string
  ) => Promise<{ ok: boolean; error?: string }>;

  // Direct Creator Conversations
  conversations: DirectConversation[];
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  communitySection: 'circles' | 'messages';
  setCommunitySection: (section: 'circles' | 'messages') => void;
  startConversationWithCreator: (creatorId: string) => Promise<void>;
  sendDirectMessage: (
    conversationId: string,
    text: string
  ) => Promise<{ ok: boolean; error?: string }>;

  // Inspection modals
  inspectedProjectId: string | null;
  setInspectedProjectId: (id: string | null) => void;
  inspectedCreatorId: string | null;
  setInspectedCreatorId: (id: string | null) => void;

  // Feedback
  toast: ToastState | null;
  showToast: (message: string, tone?: 'default' | 'error') => void;
}

const UnseenContext = createContext<UnseenContextValue | null>(null);

export const UnseenProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<PrimaryTab>('explore');

  // Auth token held strictly in React state memory (never localStorage)
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [registeredCreators, setRegisteredCreators] = useState<CreatorProfile[]>([]);

  // Backend-persisted published works & sample likes delta
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [drafts, setDrafts] = useState<ProjectDraft[]>(() =>
    readStorage<ProjectDraft[]>(STORAGE_KEYS.DRAFTS, [])
  );
  const [activeEditor, setActiveEditor] = useState<ActiveEditorState>(() =>
    readStorage<ActiveEditorState>(STORAGE_KEYS.ACTIVE_EDITOR, DEFAULT_EDITOR_STATE)
  );
  const [likesDelta, setLikesDelta] = useState<Record<string, number>>({});

  // Real-time community & conversation state
  const [wsConnected, setWsConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [onlineUsernames, setOnlineUsernames] = useState<string[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [communitiesLoading, setCommunitiesLoading] = useState(true);
  const [activeCommunityId, setActiveCommunityId] = useState<string | null>(null);
  const [communityMessagesByRoom, setCommunityMessagesByRoom] = useState<
    Record<string, CommunityMessage[]>
  >({});
  const [loadingRoomMessages, setLoadingRoomMessages] = useState(false);

  const [conversations, setConversations] = useState<DirectConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [communitySection, setCommunitySection] = useState<'circles' | 'messages'>('circles');

  const [inspectedProjectId, setInspectedProjectId] = useState<string | null>(null);
  const [inspectedCreatorId, setInspectedCreatorId] = useState<string | null>(null);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('signup');
  const [authPromptReason, setAuthPromptReason] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const authTokenRef = useRef<string | null>(null);
  authTokenRef.current = authToken;
  const activeCommunityIdRef = useRef<string | null>(null);
  activeCommunityIdRef.current = activeCommunityId;
  const googleSignInInFlightRef = useRef(false);

  const showToast = useCallback((message: string, tone: 'default' | 'error' = 'default') => {
    setToast({ id: Date.now(), message, tone });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // Persist local studio drafts & editor state on device
  useEffect(() => {
    writeStorage(STORAGE_KEYS.DRAFTS, drafts);
  }, [drafts]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.ACTIVE_EDITOR, activeEditor);
  }, [activeEditor]);

  const fetchInitialServerData = useCallback(async () => {
    try {
      const [commRes, creatorsRes, projRes] = await Promise.all([
        fetch('/api/communities'),
        fetch('/api/creators'),
        fetch('/api/projects'),
      ]);
      if (commRes.ok) {
        const data = (await commRes.json()) as { communities: Community[] };
        setCommunities(data.communities);
      }
      if (creatorsRes.ok) {
        const data = (await creatorsRes.json()) as { creators: CreatorProfile[] };
        setRegisteredCreators(data.creators);
      }
      if (projRes.ok) {
        const data = (await projRes.json()) as {
          projects: Project[];
          sampleLikesDelta: Record<string, number>;
        };
        setUserProjects(data.projects);
        setLikesDelta(data.sampleLikesDelta ?? {});
      }
    } catch {
      // Handled smoothly in UI
    } finally {
      setCommunitiesLoading(false);
    }
  }, []);

  const fetchConversations = useCallback(async (token: string) => {
    try {
      const res = await fetch('/api/conversations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = (await res.json()) as { conversations: DirectConversation[] };
        setConversations(data.conversations);
      }
    } catch {
      // Ignore network transient
    }
  }, []);

  const loadRoomMessages = useCallback(async (communityId: string) => {
    setLoadingRoomMessages(true);
    try {
      const res = await fetch(`/api/communities/${encodeURIComponent(communityId)}/messages`);
      if (res.ok) {
        const data = (await res.json()) as { messages: CommunityMessage[] };
        setCommunityMessagesByRoom((prev) => ({
          ...prev,
          [communityId]: data.messages,
        }));
      }
    } finally {
      setLoadingRoomMessages(false);
    }
  }, []);

  const selectCommunity = useCallback(
    (communityId: string | null) => {
      setActiveCommunityId(communityId);
      if (communityId) {
        void loadRoomMessages(communityId);
      }
    },
    [loadRoomMessages]
  );

  // Fetch initial server data on mount
  useEffect(() => {
    void fetchInitialServerData();
  }, [fetchInitialServerData]);

  // Restore Google / Firebase Auth session silently on page reload
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser || googleSignInInFlightRef.current || authTokenRef.current) {
        return;
      }
      try {
        const idToken = await fbUser.getIdToken();
        const res = await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        });
        if (!res.ok) return;
        const data = (await res.json()) as {
          token?: string;
          user?: UserAccount;
          isNewUser?: boolean;
        };
        if (data.token && data.user) {
          setAuthToken(data.token);
          setCurrentUser(data.user);
          setRegisteredCreators((prev) =>
            prev.some((c) => c.id === data.user!.id) ? prev : [...prev, data.user!]
          );
          void syncGoogleAccountToFirestore(fbUser, data.user).catch((err) =>
            console.error('Firestore initial sync error:', err)
          );
        }
      } catch {
        // Ignore transient restore error
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch private conversations when user signs in
  useEffect(() => {
    if (authToken) {
      void fetchConversations(authToken);
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'auth', token: authToken }));
      }
    } else {
      setConversations([]);
      setActiveConversationId(null);
    }
  }, [authToken, fetchConversations]);

  // WebSocket lifecycle with automatic reconnect + state sync
  useEffect(() => {
    let closedByCleanup = false;
    let reconnectAttempt = 0;
    let reconnectTimer: number | null = null;

    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
        reconnectAttempt = 0;
        if (authTokenRef.current) {
          ws.send(JSON.stringify({ type: 'auth', token: authTokenRef.current }));
          void fetchConversations(authTokenRef.current);
        }
        // Sync latest state on connect/reconnect
        void fetchInitialServerData();
        if (activeCommunityIdRef.current) {
          void loadRoomMessages(activeCommunityIdRef.current);
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string) as { type: string; payload: unknown };

          if (msg.type === 'presence:update') {
            const p = msg.payload as { connectedCount: number; onlineUsernames: string[] };
            setOnlineCount(p.connectedCount);
            setOnlineUsernames(p.onlineUsernames);
            return;
          }

          if (msg.type === 'project:created') {
            const created = msg.payload as Project;
            setUserProjects((prev) =>
              prev.some((p) => p.id === created.id) ? prev : [created, ...prev]
            );
            setExploreOrderIds((prev) =>
              prev.includes(created.id) ? prev : [created.id, ...prev]
            );
            return;
          }

          if (msg.type === 'project:deleted') {
            const { projectId } = msg.payload as { projectId: string };
            setUserProjects((prev) => prev.filter((p) => p.id !== projectId));
            setExploreOrderIds((prev) => prev.filter((id) => id !== projectId));
            return;
          }

          if (msg.type === 'project:liked') {
            const { projectId, likesCount, sampleLikesDelta } = msg.payload as {
              projectId: string;
              likesCount?: number;
              sampleLikesDelta?: number;
            };
            if (typeof likesCount === 'number') {
              setUserProjects((prev) =>
                prev.map((p) => (p.id === projectId ? { ...p, likesCount } : p))
              );
            }
            if (typeof sampleLikesDelta === 'number') {
              setLikesDelta((prev) => ({
                ...prev,
                [projectId]: sampleLikesDelta,
              }));
            }
            return;
          }

          if (msg.type === 'community:created') {
            const created = msg.payload as Community;
            setCommunities((prev) =>
              prev.some((c) => c.id === created.id) ? prev : [created, ...prev]
            );
            return;
          }

          if (msg.type === 'community:membership') {
            const { communityId, memberIds } = msg.payload as {
              communityId: string;
              memberIds: string[];
            };
            setCommunities((prev) =>
              prev.map((c) => (c.id === communityId ? { ...c, memberIds } : c))
            );
            return;
          }

          if (msg.type === 'community:message') {
            const incoming = msg.payload as CommunityMessage;
            setCommunityMessagesByRoom((prev) => {
              const existing = prev[incoming.communityId] ?? [];
              if (existing.some((m) => m.id === incoming.id)) return prev;
              return {
                ...prev,
                [incoming.communityId]: [...existing, incoming],
              };
            });
            setCommunities((prev) =>
              prev.map((c) =>
                c.id === incoming.communityId
                  ? {
                      ...c,
                      messageCount: c.messageCount + 1,
                      lastMessageText: incoming.text,
                      lastMessageAt: incoming.createdAt,
                    }
                  : c
              )
            );
            return;
          }

          if (msg.type === 'conversation:started') {
            const conv = msg.payload as DirectConversation;
            setConversations((prev) =>
              prev.some((c) => c.id === conv.id) ? prev : [conv, ...prev]
            );
            return;
          }

          if (msg.type === 'dm:message') {
            const incoming = msg.payload as DirectMessage;
            setConversations((prev) =>
              prev.map((conv) => {
                if (conv.id !== incoming.conversationId) return conv;
                if (conv.messages.some((m) => m.id === incoming.id)) return conv;
                return {
                  ...conv,
                  updatedAt: incoming.createdAt,
                  messages: [...conv.messages, incoming],
                };
              })
            );
          }
        } catch {
          // Ignore malformed frame
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        if (!closedByCleanup) {
          const delay = Math.min(8000, 1000 * 2 ** reconnectAttempt);
          reconnectAttempt += 1;
          reconnectTimer = window.setTimeout(connect, delay);
        }
      };
    };

    connect();

    return () => {
      closedByCleanup = true;
      if (reconnectTimer !== null) {
        window.clearTimeout(reconnectTimer);
      }
      wsRef.current?.close();
    };
  }, [fetchConversations, fetchInitialServerData, loadRoomMessages]);

  const allCreators = useMemo<CreatorProfile[]>(() => {
    const map = new Map<string, CreatorProfile>();
    for (const c of SAMPLE_CREATORS) {
      map.set(c.id, c);
    }
    for (const c of registeredCreators) {
      map.set(c.id, c);
    }
    if (currentUser) {
      map.set(currentUser.id, currentUser);
    }
    return Array.from(map.values());
  }, [registeredCreators, currentUser]);

  const projects = useMemo<Project[]>(() => {
    const merged = [...userProjects, ...SAMPLE_PROJECTS];
    return merged.map((p) => ({
      ...p,
      likesCount: p.isSample === false ? p.likesCount : Math.max(0, p.likesCount + (likesDelta[p.id] ?? 0)),
    }));
  }, [userProjects, likesDelta]);

  const [exploreOrderIds, setExploreOrderIds] = useState<string[]>(() => {
    const recentCreators = readStorage<string[]>(STORAGE_KEYS.RECENT_CREATORS, []);
    const { ordered, nextRecentCreatorIds } = rotateProjectsForDiscovery(
      SAMPLE_PROJECTS,
      recentCreators
    );
    writeStorage(STORAGE_KEYS.RECENT_CREATORS, nextRecentCreatorIds);
    return ordered.map((p) => p.id);
  });

  const rotateExploreFeed = useCallback(() => {
    const recentCreators = readStorage<string[]>(STORAGE_KEYS.RECENT_CREATORS, []);
    const { ordered, nextRecentCreatorIds } = rotateProjectsForDiscovery(projects, recentCreators);
    writeStorage(STORAGE_KEYS.RECENT_CREATORS, nextRecentCreatorIds);
    setExploreOrderIds(ordered.map((p) => p.id));
  }, [projects]);

  const orderedExploreProjects = useMemo(() => {
    const projectMap = new Map(projects.map((p) => [p.id, p]));
    const ordered: Project[] = [];
    const seen = new Set<string>();

    for (const p of userProjects) {
      if (!exploreOrderIds.includes(p.id)) {
        const live = projectMap.get(p.id);
        if (live) {
          ordered.push(live);
          seen.add(live.id);
        }
      }
    }

    for (const id of exploreOrderIds) {
      const live = projectMap.get(id);
      if (live && !seen.has(id)) {
        ordered.push(live);
        seen.add(id);
      }
    }

    for (const p of projects) {
      if (!seen.has(p.id)) {
        ordered.push(p);
      }
    }

    return ordered;
  }, [projects, userProjects, exploreOrderIds]);

  const getCreatorById = useCallback(
    (id: string) => allCreators.find((c) => c.id === id),
    [allCreators]
  );

  const openAuthModal = useCallback((mode: 'login' | 'signup' = 'signup', reason?: string) => {
    setAuthModalMode(mode);
    setAuthPromptReason(reason ?? null);
    setAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModalOpen(false);
    setAuthPromptReason(null);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    googleSignInInFlightRef.current = true;
    try {
      const credential = await signInWithPopup(auth, googleProvider);
      const idToken = await credential.user.getIdToken();

      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      const data = (await res.json()) as {
        token?: string;
        user?: UserAccount;
        isNewUser?: boolean;
        error?: string;
      };

      if (!res.ok || !data.token || !data.user) {
        return { ok: false, error: data.error ?? 'Could not sign in with Google.' };
      }

      setAuthToken(data.token);
      setCurrentUser(data.user);
      setRegisteredCreators((prev) =>
        prev.some((c) => c.id === data.user!.id) ? prev : [...prev, data.user!]
      );

      void syncGoogleAccountToFirestore(credential.user, data.user).catch((err) =>
        console.error('Firestore Google user sync error:', err)
      );

      if (data.isNewUser || !data.user.onboardingComplete) {
        return { ok: true, isNewUser: true };
      }

      setAuthModalOpen(false);
      setAuthPromptReason(null);
      showToast(`Welcome back, @${data.user.username}`);
      return { ok: true, isNewUser: false };
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        return { ok: false, error: 'Google sign-in popup was closed before completing.' };
      }
      if (code === 'auth/popup-blocked') {
        return {
          ok: false,
          error: 'Pop-up was blocked by the browser. Allow pop-ups for UNSEEN to sign in with Google.',
        };
      }
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Unable to sign in with Google.',
      };
    } finally {
      googleSignInInFlightRef.current = false;
    }
  }, [showToast]);

  const signUp = useCallback(
    async ({ email, username, password }: { email: string; username: string; password: string }) => {
      try {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, username, password }),
        });
        const data = (await res.json()) as { token?: string; user?: UserAccount; error?: string };
        if (!res.ok || !data.token || !data.user) {
          return { ok: false, error: data.error ?? 'Could not create account.' };
        }
        setAuthToken(data.token);
        setCurrentUser(data.user);
        setRegisteredCreators((prev) =>
          prev.some((c) => c.id === data.user!.id) ? prev : [...prev, data.user!]
        );
        return { ok: true };
      } catch {
        return { ok: false, error: 'Network error while creating account.' };
      }
    },
    []
  );

  const login = useCallback(
    async ({ identifier, password }: { identifier: string; password: string }) => {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier, password }),
        });
        const data = (await res.json()) as { token?: string; user?: UserAccount; error?: string };
        if (!res.ok || !data.token || !data.user) {
          return { ok: false, error: data.error ?? 'Invalid credentials.' };
        }
        setAuthToken(data.token);
        setCurrentUser(data.user);
        setAuthModalOpen(false);
        setAuthPromptReason(null);
        showToast(`Welcome back, @${data.user.username}`);
        return { ok: true };
      } catch {
        return { ok: false, error: 'Network error while signing in.' };
      }
    },
    [showToast]
  );

  const logout = useCallback(() => {
    if (auth.currentUser) {
      void signOut(auth).catch(() => {});
    }
    setAuthToken(null);
    setCurrentUser(null);
    showToast('Signed out of your creator account');
  }, [showToast]);

  const completeOnboarding = useCallback(
    async (input: {
      displayName: string;
      bio: string;
      disciplines: CreativeCategory[];
      avatarUrl?: string;
      location?: string;
    }) => {
      if (!authToken) return;
      try {
        const res = await fetch('/api/auth/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            displayName: input.displayName,
            bio: input.bio,
            disciplines: input.disciplines.length > 0 ? input.disciplines : ['Other'],
            avatarUrl: input.avatarUrl ?? null,
            location: input.location ?? '',
            onboardingComplete: true,
          }),
        });
        const data = (await res.json()) as { user?: UserAccount };
        if (res.ok && data.user) {
          setCurrentUser(data.user);
          setRegisteredCreators((prev) =>
            prev.map((c) => (c.id === data.user!.id ? data.user! : c))
          );
          if (auth.currentUser) {
            void syncGoogleAccountToFirestore(auth.currentUser, data.user).catch((err) =>
              console.error('Firestore onboarding sync error:', err)
            );
          }
          setAuthModalOpen(false);
          setAuthPromptReason(null);
          showToast('Creator profile ready. Welcome to UNSEEN.');
        }
      } catch {
        showToast('Could not save profile setup', 'error');
      }
    },
    [authToken, showToast]
  );

  const updateProfile = useCallback(
    async (input: {
      displayName: string;
      username: string;
      bio: string;
      disciplines: CreativeCategory[];
      avatarUrl?: string;
      location?: string;
    }) => {
      if (!authToken) return { ok: false, error: 'You must be signed in.' };
      try {
        const res = await fetch('/api/auth/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            displayName: input.displayName,
            username: input.username,
            bio: input.bio,
            disciplines: input.disciplines,
            avatarUrl: input.avatarUrl ?? null,
            location: input.location ?? '',
          }),
        });
        const data = (await res.json()) as { user?: UserAccount; error?: string };
        if (!res.ok || !data.user) {
          return { ok: false, error: data.error ?? 'Could not update profile.' };
        }
        setCurrentUser(data.user);
        setRegisteredCreators((prev) =>
          prev.map((c) => (c.id === data.user!.id ? data.user! : c))
        );
        if (auth.currentUser) {
          void syncGoogleAccountToFirestore(auth.currentUser, data.user).catch((err) =>
            console.error('Firestore profile update sync error:', err)
          );
        }
        showToast('Profile updated');
        return { ok: true };
      } catch {
        return { ok: false, error: 'Network error while updating profile.' };
      }
    },
    [authToken, showToast]
  );

  const isLiked = useCallback(
    (projectId: string) => Boolean(currentUser?.likedProjectIds.includes(projectId)),
    [currentUser]
  );

  const isSaved = useCallback(
    (projectId: string) => Boolean(currentUser?.savedProjectIds.includes(projectId)),
    [currentUser]
  );

  const toggleLike = useCallback(
    (projectId: string) => {
      if (!currentUser || !authToken) {
        openAuthModal('signup', 'Create an account or sign in to appreciate creative works.');
        return;
      }
      const alreadyLiked = currentUser.likedProjectIds.includes(projectId);
      const nextLiked = alreadyLiked
        ? currentUser.likedProjectIds.filter((id) => id !== projectId)
        : [...currentUser.likedProjectIds, projectId];
      const delta = alreadyLiked ? -1 : 1;

      setCurrentUser((prev) =>
        prev
          ? {
              ...prev,
              likedProjectIds: nextLiked,
            }
          : null
      );

      const isUserProj = userProjects.some((p) => p.id === projectId);
      if (isUserProj) {
        setUserProjects((prev) =>
          prev.map((p) =>
            p.id === projectId ? { ...p, likesCount: Math.max(0, p.likesCount + delta) } : p
          )
        );
      } else {
        setLikesDelta((prev) => ({
          ...prev,
          [projectId]: (prev[projectId] ?? 0) + delta,
        }));
      }

      if (auth.currentUser) {
        void syncInteractionsToFirestore(
          auth.currentUser,
          currentUser.savedProjectIds,
          nextLiked
        ).catch((err) => console.error('Firestore like sync error:', err));
      }

      void fetch('/api/auth/interactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ type: 'like', projectId }),
      });
    },
    [currentUser, authToken, openAuthModal, userProjects]
  );

  const toggleSave = useCallback(
    (projectId: string) => {
      if (!currentUser || !authToken) {
        openAuthModal('signup', 'Create an account or sign in to save projects to your archive.');
        return;
      }
      const alreadySaved = currentUser.savedProjectIds.includes(projectId);
      const nextSaved = alreadySaved
        ? currentUser.savedProjectIds.filter((id) => id !== projectId)
        : [...currentUser.savedProjectIds, projectId];

      setCurrentUser((prev) =>
        prev
          ? {
              ...prev,
              savedProjectIds: nextSaved,
            }
          : null
      );
      showToast(alreadySaved ? 'Removed from saved works' : 'Saved to your archive');

      if (auth.currentUser) {
        void syncInteractionsToFirestore(
          auth.currentUser,
          nextSaved,
          currentUser.likedProjectIds
        ).catch((err) => console.error('Firestore save sync error:', err));
      }

      void fetch('/api/auth/interactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ type: 'save', projectId }),
      });
    },
    [currentUser, authToken, openAuthModal, showToast]
  );

  const updateEditorField = useCallback(
    <K extends keyof ActiveEditorState>(field: K, value: ActiveEditorState[K]) => {
      setActiveEditor((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const resetEditor = useCallback(() => {
    setActiveEditor(DEFAULT_EDITOR_STATE);
  }, []);

  const saveCurrentAsDraft = useCallback(() => {
    const hasContent =
      activeEditor.title.trim() ||
      activeEditor.description.trim() ||
      activeEditor.imageUrl ||
      activeEditor.externalUrl.trim();

    if (!hasContent) {
      return { ok: false, error: 'Add an image, title, or note before saving a draft.' };
    }

    const now = new Date().toISOString();
    if (activeEditor.editingDraftId) {
      setDrafts((prev) =>
        prev.map((d) =>
          d.id === activeEditor.editingDraftId
            ? {
                ...d,
                title: activeEditor.title.trim(),
                description: activeEditor.description.trim(),
                category: activeEditor.category,
                imageUrl: activeEditor.imageUrl,
                externalUrl: activeEditor.externalUrl.trim(),
                updatedAt: now,
              }
            : d
        )
      );
      showToast('Draft updated');
      return { ok: true };
    }

    const newDraftId = `draft-${Date.now()}`;
    const newDraft: ProjectDraft = {
      id: newDraftId,
      title: activeEditor.title.trim(),
      description: activeEditor.description.trim(),
      category: activeEditor.category,
      imageUrl: activeEditor.imageUrl,
      externalUrl: activeEditor.externalUrl.trim(),
      updatedAt: now,
    };

    setDrafts((prev) => [newDraft, ...prev]);
    setActiveEditor((prev) => ({ ...prev, editingDraftId: newDraftId }));
    showToast('Saved to drafts');
    return { ok: true };
  }, [activeEditor, showToast]);

  const loadDraftIntoEditor = useCallback(
    (draftId: string) => {
      const target = drafts.find((d) => d.id === draftId);
      if (!target) return;
      setActiveEditor({
        editingDraftId: target.id,
        title: target.title,
        description: target.description,
        category: target.category,
        imageUrl: target.imageUrl,
        externalUrl: target.externalUrl,
        aspectHint: 'portrait',
      });
      setActiveTab('publish');
      showToast('Draft loaded into studio');
    },
    [drafts, showToast]
  );

  const deleteDraft = useCallback(
    (draftId: string) => {
      setDrafts((prev) => prev.filter((d) => d.id !== draftId));
      setActiveEditor((prev) =>
        prev.editingDraftId === draftId ? { ...prev, editingDraftId: null } : prev
      );
      showToast('Draft deleted');
    },
    [showToast]
  );

  const validateProjectFields = (data: {
    title: string;
    description: string;
    imageUrl: string;
    externalUrl: string;
  }): string | null => {
    if (!data.imageUrl) return 'Upload an artwork or project image before publishing.';
    if (data.title.trim().length < 2) return 'Add a project title (at least 2 characters).';
    if (data.description.trim().length < 10)
      return 'Write a brief project description (at least 10 characters).';
    if (data.externalUrl.trim()) {
      try {
        const parsed = new URL(
          data.externalUrl.trim().startsWith('http')
            ? data.externalUrl.trim()
            : `https://${data.externalUrl.trim()}`
        );
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          return 'External link must be an http or https URL.';
        }
      } catch {
        return 'Enter a valid external URL (e.g. https://studio.example.com).';
      }
    }
    return null;
  };

  const normalizeExternalUrl = (raw: string): string | undefined => {
    const trimmed = raw.trim();
    if (!trimmed) return undefined;
    return trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed
      : `https://${trimmed}`;
  };

  const publishFromEditor = useCallback(async () => {
    if (!currentUser || !authToken) {
      openAuthModal('signup', 'Sign in with Google or create an account to publish to UNSEEN.');
      return { ok: false, error: 'Sign in required to publish.' };
    }

    const validationError = validateProjectFields(activeEditor);
    if (validationError) {
      return { ok: false, error: validationError };
    }

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title: activeEditor.title.trim(),
          description: activeEditor.description.trim(),
          category: activeEditor.category,
          imageUrl: activeEditor.imageUrl,
          externalUrl: normalizeExternalUrl(activeEditor.externalUrl) ?? '',
          aspectHint: activeEditor.aspectHint,
        }),
      });

      const data = (await res.json()) as { project?: Project; error?: string };
      if (!res.ok || !data.project) {
        return { ok: false, error: data.error ?? 'Could not publish project.' };
      }

      const published = data.project;
      setUserProjects((prev) => (prev.some((p) => p.id === published.id) ? prev : [published, ...prev]));
      setExploreOrderIds((prev) => (prev.includes(published.id) ? prev : [published.id, ...prev]));

      if (auth.currentUser) {
        void syncProjectToFirestore(auth.currentUser, published).catch((err) =>
          console.error('Firestore project sync error:', err)
        );
      }

      if (activeEditor.editingDraftId) {
        setDrafts((prev) => prev.filter((d) => d.id !== activeEditor.editingDraftId));
      }

      setActiveEditor(DEFAULT_EDITOR_STATE);
      showToast('Published to Explore & your Profile');
      return { ok: true, project: published };
    } catch {
      return { ok: false, error: 'Network error while publishing work.' };
    }
  }, [activeEditor, authToken, currentUser, openAuthModal, showToast]);

  const publishExistingDraft = useCallback(
    async (draftId: string) => {
      if (!currentUser || !authToken) {
        openAuthModal('signup', 'Sign in to publish this draft to UNSEEN.');
        return { ok: false, error: 'Sign in required to publish.' };
      }

      const target = drafts.find((d) => d.id === draftId);
      if (!target) {
        return { ok: false, error: 'Draft not found.' };
      }

      const validationError = validateProjectFields(target);
      if (validationError) {
        loadDraftIntoEditor(draftId);
        return { ok: false, error: `${validationError} Loaded into studio to finish.` };
      }

      try {
        const res = await fetch('/api/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            title: target.title.trim(),
            description: target.description.trim(),
            category: target.category,
            imageUrl: target.imageUrl,
            externalUrl: normalizeExternalUrl(target.externalUrl) ?? '',
            aspectHint: 'portrait',
          }),
        });
        const data = (await res.json()) as { project?: Project; error?: string };
        if (!res.ok || !data.project) {
          return { ok: false, error: data.error ?? 'Could not publish draft.' };
        }

        const published = data.project;
        setUserProjects((prev) => (prev.some((p) => p.id === published.id) ? prev : [published, ...prev]));
        setExploreOrderIds((prev) => (prev.includes(published.id) ? prev : [published.id, ...prev]));

        if (auth.currentUser) {
          void syncProjectToFirestore(auth.currentUser, published).catch((err) =>
            console.error('Firestore draft publish sync error:', err)
          );
        }

        setDrafts((prev) => prev.filter((d) => d.id !== draftId));
        if (activeEditor.editingDraftId === draftId) {
          setActiveEditor(DEFAULT_EDITOR_STATE);
        }
        showToast('Draft published to Explore & your Profile');
        return { ok: true, project: published };
      } catch {
        return { ok: false, error: 'Network error while publishing draft.' };
      }
    },
    [activeEditor.editingDraftId, authToken, currentUser, drafts, loadDraftIntoEditor, openAuthModal, showToast]
  );

  const deletePublishedProject = useCallback(
    async (projectId: string) => {
      if (!authToken) return;
      setUserProjects((prev) => prev.filter((p) => p.id !== projectId));
      setExploreOrderIds((prev) => prev.filter((id) => id !== projectId));
      setCurrentUser((prev) =>
        prev
          ? {
              ...prev,
              savedProjectIds: prev.savedProjectIds.filter((id) => id !== projectId),
              likedProjectIds: prev.likedProjectIds.filter((id) => id !== projectId),
            }
          : null
      );
      if (inspectedProjectId === projectId) {
        setInspectedProjectId(null);
      }

      try {
        await fetch(`/api/projects/${encodeURIComponent(projectId)}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (auth.currentUser) {
          void deleteProjectFromFirestore(auth.currentUser, projectId).catch((err) =>
            console.error('Firestore project delete sync error:', err)
          );
        }
        showToast('Project removed from UNSEEN');
      } catch {
        showToast('Could not remove project from server', 'error');
      }
    },
    [authToken, inspectedProjectId, showToast]
  );

  // Communities actions
  const createCommunity = useCallback(
    async (input: { name: string; category: CreativeCategory; description: string }) => {
      if (!authToken || !currentUser) {
        openAuthModal('signup', 'Sign in or create an account to start a creative circle.');
        return { ok: false, error: 'Sign in required.' };
      }
      try {
        const res = await fetch('/api/communities', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(input),
        });
        const data = (await res.json()) as { community?: Community; error?: string };
        if (!res.ok || !data.community) {
          return { ok: false, error: data.error ?? 'Could not create community.' };
        }
        setCommunities((prev) =>
          prev.some((c) => c.id === data.community!.id) ? prev : [data.community!, ...prev]
        );
        selectCommunity(data.community.id);
        showToast(`Created "${data.community.name}"`);
        return { ok: true, community: data.community };
      } catch {
        return { ok: false, error: 'Network error while creating community.' };
      }
    },
    [authToken, currentUser, openAuthModal, selectCommunity, showToast]
  );

  const toggleCommunityMembership = useCallback(
    async (communityId: string) => {
      if (!authToken || !currentUser) {
        openAuthModal('signup', 'Create an account or sign in to join communities.');
        return;
      }
      const target = communities.find((c) => c.id === communityId);
      if (!target) return;
      const isMember = target.memberIds.includes(currentUser.id);
      const action = isMember ? 'leave' : 'join';

      setCommunities((prev) =>
        prev.map((c) =>
          c.id === communityId
            ? {
                ...c,
                memberIds: isMember
                  ? c.memberIds.filter((id) => id !== currentUser.id)
                  : [...c.memberIds, currentUser.id],
              }
            : c
        )
      );

      try {
        const res = await fetch(`/api/communities/${encodeURIComponent(communityId)}/membership`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ action }),
        });
        if (!res.ok) {
          setCommunities((prev) =>
            prev.map((c) => (c.id === communityId ? { ...c, memberIds: target.memberIds } : c))
          );
          showToast('Could not update community membership', 'error');
        } else {
          showToast(isMember ? `Left ${target.name}` : `Joined ${target.name}`);
        }
      } catch {
        setCommunities((prev) =>
          prev.map((c) => (c.id === communityId ? { ...c, memberIds: target.memberIds } : c))
        );
      }
    },
    [authToken, communities, currentUser, openAuthModal, showToast]
  );

  const sendCommunityMessage = useCallback(
    async (communityId: string, text: string) => {
      if (!authToken || !currentUser) {
        openAuthModal('signup', 'Sign in to chat in community rooms.');
        return { ok: false, error: 'Sign in required.' };
      }
      const clean = text.trim();
      if (!clean) return { ok: false, error: 'Enter a message.' };

      const clientMsgId = `cmsg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      try {
        const res = await fetch(`/api/communities/${encodeURIComponent(communityId)}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ text: clean, clientMsgId }),
        });
        const data = (await res.json()) as { message?: CommunityMessage; error?: string };
        if (!res.ok || !data.message) {
          return { ok: false, error: data.error ?? 'Failed to send message.' };
        }
        setCommunityMessagesByRoom((prev) => {
          const existing = prev[communityId] ?? [];
          if (existing.some((m) => m.id === data.message!.id)) return prev;
          return { ...prev, [communityId]: [...existing, data.message!] };
        });
        return { ok: true };
      } catch {
        return { ok: false, error: 'Network error sending message.' };
      }
    },
    [authToken, currentUser, openAuthModal]
  );

  const startConversationWithCreator = useCallback(
    async (creatorId: string) => {
      if (!authToken || !currentUser) {
        openAuthModal('signup', 'Create an account or sign in to message creators directly.');
        return;
      }
      if (creatorId === currentUser.id) {
        showToast('Select another creator to message');
        return;
      }
      try {
        const res = await fetch('/api/conversations/start', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ targetCreatorId: creatorId }),
        });
        const data = (await res.json()) as { conversation?: DirectConversation; error?: string };
        if (!res.ok || !data.conversation) {
          showToast(data.error ?? 'Could not start conversation', 'error');
          return;
        }
        setConversations((prev) =>
          prev.some((c) => c.id === data.conversation!.id) ? prev : [data.conversation!, ...prev]
        );
        setCommunitySection('messages');
        setActiveConversationId(data.conversation.id);
        setInspectedCreatorId(null);
        setInspectedProjectId(null);
        setActiveTab('community');
      } catch {
        showToast('Network error starting conversation', 'error');
      }
    },
    [authToken, currentUser, openAuthModal, showToast]
  );

  const sendDirectMessage = useCallback(
    async (conversationId: string, text: string) => {
      if (!authToken || !currentUser) {
        openAuthModal('signup', 'Sign in to send direct messages.');
        return { ok: false, error: 'Sign in required.' };
      }
      const clean = text.trim();
      if (!clean) return { ok: false, error: 'Enter a message.' };

      const clientMsgId = `dmc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      try {
        const res = await fetch(`/api/conversations/${encodeURIComponent(conversationId)}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ text: clean, clientMsgId }),
        });
        const data = (await res.json()) as { message?: DirectMessage; error?: string };
        if (!res.ok || !data.message) {
          return { ok: false, error: data.error ?? 'Could not send message.' };
        }
        setConversations((prev) =>
          prev.map((conv) => {
            if (conv.id !== conversationId) return conv;
            if (conv.messages.some((m) => m.id === data.message!.id)) return conv;
            return {
              ...conv,
              updatedAt: data.message!.createdAt,
              messages: [...conv.messages, data.message!],
            };
          })
        );
        return { ok: true };
      } catch {
        return { ok: false, error: 'Network error sending message.' };
      }
    },
    [authToken, currentUser, openAuthModal]
  );

  const value: UnseenContextValue = {
    activeTab,
    setActiveTab,
    currentUser,
    allCreators,
    projects,
    orderedExploreProjects,
    rotateExploreFeed,
    getCreatorById,
    authModalOpen,
    authModalMode,
    authPromptReason,
    openAuthModal,
    closeAuthModal,
    signInWithGoogle,
    signUp,
    login,
    logout,
    completeOnboarding,
    updateProfile,
    toggleLike,
    toggleSave,
    isLiked,
    isSaved,
    activeEditor,
    updateEditorField,
    resetEditor,
    drafts,
    saveCurrentAsDraft,
    loadDraftIntoEditor,
    deleteDraft,
    publishFromEditor,
    publishExistingDraft,
    deletePublishedProject,
    wsConnected,
    onlineCount,
    onlineUsernames,
    communities,
    communitiesLoading,
    activeCommunityId,
    selectCommunity,
    communityMessagesByRoom,
    loadingRoomMessages,
    createCommunity,
    toggleCommunityMembership,
    sendCommunityMessage,
    conversations,
    activeConversationId,
    setActiveConversationId,
    communitySection,
    setCommunitySection,
    startConversationWithCreator,
    sendDirectMessage,
    inspectedProjectId,
    setInspectedProjectId,
    inspectedCreatorId,
    setInspectedCreatorId,
    toast,
    showToast,
  };

  return <UnseenContext.Provider value={value}>{children}</UnseenContext.Provider>;
};

export function useUnseen(): UnseenContextValue {
  const ctx = useContext(UnseenContext);
  if (!ctx) {
    throw new Error('useUnseen must be used inside UnseenProvider');
  }
  return ctx;
}
