import { User as FirebaseUser } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { CREATIVE_CATEGORIES, Project, UserAccount } from '../types/unseen';

const VALID_CATEGORIES_SET = new Set<string>(CREATIVE_CATEGORIES);

function sanitizeId(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
}

function sanitizeUsername(raw: string): string {
  const cleaned = raw
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '')
    .slice(0, 24);
  return cleaned.length >= 3 ? cleaned : `${cleaned}art`.slice(0, 24);
}

function sanitizeUrl(raw?: string): string {
  if (!raw) return '';
  const trimmed = raw.trim().slice(0, 500);
  if (
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('/api/uploads/') ||
    trimmed.startsWith('/src/assets/images/')
  ) {
    return trimmed;
  }
  return '';
}

function sanitizeDisciplines(list: string[]): string[] {
  return list.filter((d) => VALID_CATEGORIES_SET.has(d)).slice(0, 10);
}

export async function syncGoogleAccountToFirestore(
  fbUser: FirebaseUser,
  account: UserAccount
): Promise<void> {
  if (!fbUser.emailVerified) return;
  const uid = sanitizeId(fbUser.uid);
  const creatorPath = `creators/${uid}`;
  const userPath = `users/${uid}`;

  const creatorPayload = {
    id: uid,
    username: sanitizeUsername(account.username),
    displayName: (account.displayName || account.username).trim().slice(0, 60) || 'Creator',
    bio: (account.bio || '').trim().slice(0, 280),
    disciplines: sanitizeDisciplines(account.disciplines),
    avatarUrl: sanitizeUrl(account.avatarUrl),
    location: (account.location || '').trim().slice(0, 60),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'creators', uid), creatorPayload, { merge: false });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, creatorPath);
  }

  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, {
        uid,
        email: (fbUser.email || account.email).trim().slice(0, 120),
        username: sanitizeUsername(account.username),
        onboardingComplete: Boolean(account.onboardingComplete),
        savedProjectIds: account.savedProjectIds.slice(0, 200),
        likedProjectIds: account.likedProjectIds.slice(0, 500),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(userRef, {
        username: sanitizeUsername(account.username),
        onboardingComplete: Boolean(account.onboardingComplete),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath);
  }
}

export async function syncInteractionsToFirestore(
  fbUser: FirebaseUser,
  savedProjectIds: string[],
  likedProjectIds: string[]
): Promise<void> {
  if (!fbUser.emailVerified) return;
  const uid = sanitizeId(fbUser.uid);
  const userPath = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      savedProjectIds: savedProjectIds.slice(0, 200),
      likedProjectIds: likedProjectIds.slice(0, 500),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, userPath);
  }
}

export async function syncProjectToFirestore(
  fbUser: FirebaseUser,
  project: Project
): Promise<void> {
  if (!fbUser.emailVerified) return;
  const uid = sanitizeId(fbUser.uid);
  const projectId = sanitizeId(project.id);
  const projectPath = `projects/${projectId}`;

  const safeImage = sanitizeUrl(project.imageUrl);
  if (!safeImage) return;

  try {
    await setDoc(doc(db, 'projects', projectId), {
      id: projectId,
      title: project.title.trim().slice(0, 100),
      description: project.description.trim().slice(0, 1200),
      category: VALID_CATEGORIES_SET.has(project.category) ? project.category : 'Other',
      imageUrl: safeImage,
      externalUrl: sanitizeUrl(project.externalUrl),
      creatorId: uid,
      aspectHint: project.aspectHint ?? 'portrait',
      likesCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, projectPath);
  }
}

export async function deleteProjectFromFirestore(
  fbUser: FirebaseUser,
  projectId: string
): Promise<void> {
  if (!fbUser.emailVerified) return;
  const cleanId = sanitizeId(projectId);
  const projectPath = `projects/${cleanId}`;
  try {
    const ref = doc(db, 'projects', cleanId);
    const existing = await getDoc(ref);
    if (existing.exists() && existing.data()?.creatorId === fbUser.uid) {
      await deleteDoc(ref);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, projectPath);
  }
}

export async function fetchUserProjectsFromFirestore(
  fbUser: FirebaseUser
): Promise<Project[]> {
  const path = 'projects';
  try {
    const q = query(collection(db, path), where('creatorId', '==', fbUser.uid));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: String(data.id || d.id),
        title: String(data.title || 'Untitled'),
        description: String(data.description || ''),
        category: (VALID_CATEGORIES_SET.has(String(data.category))
          ? data.category
          : 'Other') as Project['category'],
        imageUrl: String(data.imageUrl || ''),
        externalUrl: data.externalUrl ? String(data.externalUrl) : undefined,
        creatorId: String(data.creatorId || fbUser.uid),
        createdAt:
          data.createdAt && typeof data.createdAt.toDate === 'function'
            ? data.createdAt.toDate().toISOString()
            : new Date().toISOString(),
        aspectHint: (data.aspectHint || 'portrait') as Project['aspectHint'],
        likesCount: typeof data.likesCount === 'number' ? data.likesCount : 0,
        isSample: false,
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}
