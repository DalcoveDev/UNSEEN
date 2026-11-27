# UNSEEN Firestore Security Specification (Phase 0)

## Data Invariants
1. **Identity Integrity**: No user may create or mutate a `users/{userId}`, `creators/{creatorId}`, or `projects/{projectId}` document where `uid`, `id`, or `creatorId` differs from `request.auth.uid`.
2. **PII Isolation**: `users/{userId}` holds email and personal saved/liked lists and is readable, creatable, updatable, and deletable ONLY by `request.auth.uid == userId`. Collection listing on `users` is unconditionally denied (`allow list: if false`).
3. **Verified Accounts Only**: All write operations require `request.auth != null && request.auth.token.email_verified == true`.
4. **No Shadow / Ghost Fields**: All document creates enforce exact `hasAll` and `hasOnly` key sets; all updates enforce explicit `affectedKeys().hasOnly(...)` action allowlists wrapped by `isValid[Entity](incoming())`.
5. **Immutable Ownership & Temporal Integrity**: `createdAt`, `uid`, `id`, and `creatorId` cannot change after creation; `createdAt` on create and `updatedAt` on create/update must equal `request.time`.
6. **Path Variable Hardening & Volumetric Bounds**: All document IDs (`creatorId`, `userId`, `projectId`) must satisfy `^[a-zA-Z0-9_-]{1,128}$`. Every string and array enforces strict min/max size bounds; arrays check first element type when non-empty.
7. **Secure List Queries**: `allow list` never delegates filtering solely to the client; queries on `/creators` and `/projects` enforce `resource.data.id == request.auth.uid` and `resource.data.creatorId == request.auth.uid` respectively.

## The "Dirty Dozen" Adversarial Payloads
1. **Identity Spoofing on Create (`projects`)**: User `alice` tries to create `projects/proj-1` with `creatorId: "bob"` -> MUST return `PERMISSION_DENIED`.
2. **Shadow Ghost Field (`users`)**: User `alice` creates `users/alice` with extra shadow key `isAdmin: true` -> MUST return `PERMISSION_DENIED`.
3. **Cross-User PII Read (`users`)**: User `bob` calls `get` on `users/alice` -> MUST return `PERMISSION_DENIED`.
4. **Blanket User List Scraping (`users`)**: User `bob` calls `list` on `/users` -> MUST return `PERMISSION_DENIED`.
5. **Unverified Email Write (`creators`)**: Signed-in user with `email_verified: false` attempts to write `creators/alice` -> MUST return `PERMISSION_DENIED`.
6. **ID Poisoning (`projects`)**: User attempts to create `projects/` with a 500-char or invalid-character ID (`../evil`) -> MUST return `PERMISSION_DENIED`.
7. **Forged Timestamp (`projects`)**: User attempts to set `createdAt` to a client-forged past timestamp instead of `request.time` -> MUST return `PERMISSION_DENIED`.
8. **Immutable Field Tampering (`projects`)**: User updates `projects/proj-1` trying to change `creatorId` or `createdAt` -> MUST return `PERMISSION_DENIED`.
9. **Value Poisoning / Oversized Bio (`creators`)**: User sets `bio` to a 5,000-character string exceeding `maxLength: 280` -> MUST return `PERMISSION_DENIED`.
10. **Invalid Category Enum (`projects`)**: User creates project with `category: "ArbitraryInjection"` -> MUST return `PERMISSION_DENIED`.
11. **Array Type Poisoning (`creators`)**: User passes `disciplines: [12345]` (number instead of string) -> MUST return `PERMISSION_DENIED`.
12. **Likes Manipulation (`projects`)**: Non-zero negative `likesCount: -5` or unauthorized update by non-owner -> MUST return `PERMISSION_DENIED`.
