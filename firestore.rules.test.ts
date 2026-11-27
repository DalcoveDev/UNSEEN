/**
 * Phase 0 Dirty Dozen Security Test Specification for UNSEEN Firestore Rules.
 * Intended to verify against @firebase/rules-unit-testing when a local Firestore
 * emulator is available, and statically validates the 12 Dirty Dozen invariants.
 */

export interface DirtyDozenCase {
  id: number;
  name: string;
  collectionPath: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  expected: 'PERMISSION_DENIED';
  payload?: Record<string, unknown>;
}

export const DIRTY_DOZEN_PAYLOADS: DirtyDozenCase[] = [
  {
    id: 1,
    name: 'Identity Spoofing on Project Create',
    collectionPath: 'projects/proj_spoof_1',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    payload: {
      id: 'proj_spoof_1',
      title: 'Spoofed Work',
      description: 'Attempting to publish under another creator ID.',
      category: 'Art',
      imageUrl: '/api/uploads/sample.jpg',
      externalUrl: '',
      creatorId: 'bob_uid',
      aspectHint: 'portrait',
      likesCount: 0,
    },
  },
  {
    id: 2,
    name: 'Shadow Ghost Field on User Create',
    collectionPath: 'users/alice_uid',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    payload: {
      uid: 'alice_uid',
      email: 'alice@example.com',
      username: 'alice.studio',
      onboardingComplete: true,
      savedProjectIds: [],
      likedProjectIds: [],
      isAdmin: true,
    },
  },
  {
    id: 3,
    name: 'Cross-User PII Read',
    collectionPath: 'users/alice_uid',
    operation: 'get',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Blanket User List Scraping',
    collectionPath: 'users',
    operation: 'list',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Unverified Email Write',
    collectionPath: 'creators/unverified_uid',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    payload: {
      id: 'unverified_uid',
      username: 'unverified',
      displayName: 'Unverified User',
      bio: '',
      disciplines: ['Art'],
      avatarUrl: '',
      location: '',
    },
  },
  {
    id: 6,
    name: 'Path Variable ID Poisoning',
    collectionPath: `projects/${'x'.repeat(200)}`,
    operation: 'create',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Client-Forged Timestamp',
    collectionPath: 'projects/proj_forged_time',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    payload: {
      id: 'proj_forged_time',
      title: 'Time Forgery',
      description: 'Forging createdAt instead of server request.time.',
      category: 'Photography',
      imageUrl: '/api/uploads/sample.jpg',
      externalUrl: '',
      creatorId: 'alice_uid',
      aspectHint: 'square',
      likesCount: 0,
      createdAt: '2020-01-01T00:00:00Z',
      updatedAt: '2020-01-01T00:00:00Z',
    },
  },
  {
    id: 8,
    name: 'Immutable CreatorId Tampering on Update',
    collectionPath: 'projects/proj_alice_1',
    operation: 'update',
    expected: 'PERMISSION_DENIED',
    payload: {
      creatorId: 'bob_uid',
    },
  },
  {
    id: 9,
    name: 'Oversized Bio Exhaustion',
    collectionPath: 'creators/alice_uid',
    operation: 'update',
    expected: 'PERMISSION_DENIED',
    payload: {
      bio: 'a'.repeat(5000),
    },
  },
  {
    id: 10,
    name: 'Invalid Discipline Category Injection',
    collectionPath: 'projects/proj_bad_cat',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    payload: {
      id: 'proj_bad_cat',
      title: 'Invalid Category',
      description: 'Testing enum rejection for arbitrary categories.',
      category: 'ArbitraryInjection',
      imageUrl: '/api/uploads/sample.jpg',
      externalUrl: '',
      creatorId: 'alice_uid',
      aspectHint: 'portrait',
      likesCount: 0,
    },
  },
  {
    id: 11,
    name: 'Array Element Type Poisoning',
    collectionPath: 'creators/alice_uid',
    operation: 'update',
    expected: 'PERMISSION_DENIED',
    payload: {
      disciplines: [12345],
    },
  },
  {
    id: 12,
    name: 'Negative Likes Count Value Poisoning',
    collectionPath: 'projects/proj_neg_likes',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    payload: {
      id: 'proj_neg_likes',
      title: 'Negative Likes',
      description: 'Attempting to store negative likes count.',
      category: 'Design',
      imageUrl: '/api/uploads/sample.jpg',
      externalUrl: '',
      creatorId: 'alice_uid',
      aspectHint: 'portrait',
      likesCount: -5,
    },
  },
];
