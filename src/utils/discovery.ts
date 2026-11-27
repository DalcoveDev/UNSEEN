import { Project } from '../types/unseen';

/**
 * Rotating Random Discovery Engine
 *
 * Unlike popularity-ranked feeds, UNSEEN distributes visibility across creators:
 * 1. Prioritizes creators who have not appeared in the recent discovery rotation window.
 * 2. Prevents back-to-back repetition of the same creator.
 * 3. Uses Fisher-Yates randomization within freshness tiers so every shuffle surfaces fresh voices.
 */
function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function rotateProjectsForDiscovery(
  projects: Project[],
  recentCreatorIds: string[]
): { ordered: Project[]; nextRecentCreatorIds: string[] } {
  if (projects.length <= 1) {
    return {
      ordered: projects,
      nextRecentCreatorIds: projects.map((p) => p.creatorId),
    };
  }

  const recentSet = new Set(recentCreatorIds);

  // Split into unseen-recently vs recently-shown creators
  const freshTier = shuffleArray(projects.filter((p) => !recentSet.has(p.creatorId)));
  const cooldownTier = shuffleArray(projects.filter((p) => recentSet.has(p.creatorId)));

  const combined = [...freshTier, ...cooldownTier];

  // Spread out creators so the same creator never appears consecutively when alternatives exist
  const spaced: Project[] = [];
  const pool = [...combined];

  while (pool.length > 0) {
    const lastCreator = spaced.length > 0 ? spaced[spaced.length - 1].creatorId : null;
    const prevCreator = spaced.length > 1 ? spaced[spaced.length - 2].creatorId : null;

    let candidateIndex = pool.findIndex(
      (item) => item.creatorId !== lastCreator && item.creatorId !== prevCreator
    );
    if (candidateIndex === -1) {
      candidateIndex = pool.findIndex((item) => item.creatorId !== lastCreator);
    }
    if (candidateIndex === -1) {
      candidateIndex = 0;
    }

    const [picked] = pool.splice(candidateIndex, 1);
    spaced.push(picked);
  }

  // Record the top window of surfaced creators to rotate them smoothly on next refresh
  const windowSize = Math.max(3, Math.floor(spaced.length / 2));
  const nextRecentCreatorIds = Array.from(
    new Set(spaced.slice(0, windowSize).map((p) => p.creatorId))
  );

  return { ordered: spaced, nextRecentCreatorIds };
}
