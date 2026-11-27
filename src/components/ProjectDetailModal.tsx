import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, Bookmark, Heart, Trash2, X } from 'lucide-react';
import { useUnseen } from '../context/UnseenContext';
import { ArtworkImage } from './ArtworkImage';
import { CreatorAvatar } from './CreatorAvatar';

export const ProjectDetailModal: React.FC = () => {
  const {
    inspectedProjectId,
    setInspectedProjectId,
    setInspectedCreatorId,
    projects,
    getCreatorById,
    currentUser,
    isLiked,
    isSaved,
    toggleLike,
    toggleSave,
    deletePublishedProject,
  } = useUnseen();

  const [confirmDelete, setConfirmDelete] = useState(false);

  const project = projects.find((p) => p.id === inspectedProjectId);
  const creator = project ? getCreatorById(project.creatorId) : undefined;

  useEffect(() => {
    setConfirmDelete(false);
  }, [inspectedProjectId]);

  useEffect(() => {
    if (!inspectedProjectId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setInspectedProjectId(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [inspectedProjectId, setInspectedProjectId]);

  if (!project) return null;

  const liked = isLiked(project.id);
  const saved = isSaved(project.id);
  const isOwner = Boolean(currentUser && currentUser.id === project.creatorId);

  return (
    <div
      className="fixed inset-0 z-50 bg-[#000000]/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-project-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) setInspectedProjectId(null);
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="w-full sm:max-w-3xl max-h-[92vh] overflow-y-auto bg-[#1A1A1A] border-2 border-[#FFFFFF] shadow-[8px_8px_0_0_#00D4FF]"
      >
        {/* Top bar */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-3 bg-[#1A1A1A]/95 backdrop-blur-md border-b border-white/15">
          <div className="text-xs text-[#A0A0A0] flex items-center gap-2 truncate">
            <span className="font-mono-tabular font-bold text-[#00FF99]">{project.category}</span>
            <span aria-hidden="true">/</span>
            <span>
              {new Date(project.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
            {project.isSample && (
              <>
                <span aria-hidden="true">·</span>
                <span>Sample work</span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setInspectedProjectId(null)}
            aria-label="Close project detail"
            className="min-w-[44px] min-h-[44px] -mr-2 flex items-center justify-center text-[#FFFFFF] hover:text-[#FFE600]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pure Black Lightbox Artwork Presentation */}
        <div className="bg-[#000000] border-b-2 border-[#FFFFFF] flex items-center justify-center max-h-[60vh] overflow-hidden p-4 sm:p-6 relative">
          {/* Playful Geometric Corner Brackets */}
          <span aria-hidden="true" className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-[#00D4FF]" />
          <span aria-hidden="true" className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-[#FFE600]" />
          <span aria-hidden="true" className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-[#FF3DAE]" />
          <span aria-hidden="true" className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-[#00FF99]" />

          <div className="w-full max-h-[54vh] flex items-center justify-center">
            <ArtworkImage
              src={project.imageUrl}
              alt={project.title}
              titleFallback={project.title}
              className="max-h-[54vh] !object-contain"
            />
          </div>
        </div>

        {/* Project Copy & Creator Attribution */}
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="min-w-0">
              <h2
                id="detail-project-title"
                className="font-display text-2xl sm:text-3xl font-extrabold tracking-[-0.025em] text-[#FFFFFF] leading-tight [text-wrap:balance]"
              >
                {project.title}
              </h2>

              <button
                type="button"
                onClick={() => {
                  setInspectedProjectId(null);
                  setInspectedCreatorId(project.creatorId);
                }}
                className="mt-4 inline-flex items-center gap-3 group text-left pr-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D4FF]"
              >
                <CreatorAvatar
                  src={creator?.avatarUrl}
                  name={creator?.displayName ?? creator?.username ?? 'Creator'}
                  size="md"
                  className="rounded-[2px] border-[#00D4FF]"
                />
                <div>
                  <p className="text-sm font-bold text-[#FFFFFF] group-hover:text-[#00D4FF] transition-colors">
                    {creator?.displayName ?? 'Emerging Creator'}
                  </p>
                  <p className="text-xs text-[#A0A0A0]">
                    @{creator?.username ?? 'creator'} · Explore portfolio
                  </p>
                </div>
              </button>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <motion.button
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={() => toggleLike(project.id)}
                aria-pressed={liked}
                className={`inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 border-2 text-sm font-bold transition-colors ${
                  liked
                    ? 'bg-[#FF3DAE] border-[#FFFFFF] text-[#000000]'
                    : 'bg-[#2A2A2A] border-white/25 text-[#FFFFFF] hover:border-[#FF3DAE]'
                }`}
              >
                <Heart className="w-4 h-4" fill={liked ? 'currentColor' : 'none'} />
                <span className="font-mono-tabular">{project.likesCount}</span>
              </motion.button>

              <motion.button
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={() => toggleSave(project.id)}
                aria-pressed={saved}
                className={`inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 border-2 text-sm font-bold transition-colors ${
                  saved
                    ? 'bg-[#FFE600] border-[#FFFFFF] text-[#000000]'
                    : 'bg-[#2A2A2A] border-white/25 text-[#FFFFFF] hover:border-[#FFE600]'
                }`}
              >
                <Bookmark className="w-4 h-4" fill={saved ? 'currentColor' : 'none'} />
                <span>{saved ? 'Saved' : 'Save'}</span>
              </motion.button>
            </div>
          </div>

          <p className="mt-6 text-[15px] leading-relaxed text-[#A0A0A0] whitespace-pre-line max-w-[68ch]">
            {project.description}
          </p>

          <div className="mt-6 pt-5 border-t border-white/15 flex flex-wrap items-center justify-between gap-3">
            {project.externalUrl ? (
              <a
                href={project.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 min-h-[44px] px-4 py-2 bg-[#00D4FF] text-[#000000] border border-[#FFFFFF] text-sm font-bold hover:bg-[#00FF99] transition-colors"
              >
                <span>Open External Link</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            ) : (
              <span className="text-xs font-mono-tabular text-[#A0A0A0]">
                UNSEEN · EVERY CREATOR DESERVES TO BE SEEN
              </span>
            )}

            {isOwner && (
              <div className="flex items-center gap-2">
                {confirmDelete ? (
                  <>
                    <span className="text-xs text-[#FF3DAE]">Remove this work?</span>
                    <button
                      type="button"
                      onClick={() => deletePublishedProject(project.id)}
                      className="min-h-[40px] px-3 bg-[#FF3DAE] text-[#000000] text-xs font-bold"
                    >
                      Confirm Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="min-h-[40px] px-2.5 text-xs text-[#A0A0A0]"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="inline-flex items-center gap-1.5 min-h-[44px] px-3 text-xs font-medium text-[#A0A0A0] hover:text-[#FF3DAE]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Work</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
