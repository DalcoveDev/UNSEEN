import React, { useEffect, useMemo } from 'react';
import { ArrowLeft, MapPin, MessageSquare, X } from 'lucide-react';
import { useUnseen } from '../context/UnseenContext';
import { ArtworkImage } from './ArtworkImage';
import { CreatorAvatar } from './CreatorAvatar';

export const CreatorProfileSheet: React.FC = () => {
  const {
    inspectedCreatorId,
    setInspectedCreatorId,
    setInspectedProjectId,
    getCreatorById,
    projects,
    currentUser,
    setActiveTab,
    startConversationWithCreator,
  } = useUnseen();

  const creator = inspectedCreatorId ? getCreatorById(inspectedCreatorId) : undefined;

  const creatorProjects = useMemo(
    () => (creator ? projects.filter((p) => p.creatorId === creator.id) : []),
    [creator, projects]
  );

  useEffect(() => {
    if (!inspectedCreatorId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setInspectedCreatorId(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [inspectedCreatorId, setInspectedCreatorId]);

  if (!creator) return null;

  const isCurrentUser = Boolean(currentUser && currentUser.id === creator.id);

  return (
    <div
      className="fixed inset-0 z-50 bg-[#000000]/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="creator-sheet-name"
      onClick={(e) => {
        if (e.target === e.currentTarget) setInspectedCreatorId(null);
      }}
    >
      <div className="w-full sm:max-w-3xl max-h-[92vh] overflow-y-auto bg-[#1A1A1A] border-2 border-[#FFFFFF] shadow-[8px_8px_0_0_#FFE600]">
        {/* Sticky Sheet Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 sm:px-6 py-3 bg-[#1A1A1A]/95 backdrop-blur-md border-b border-white/15">
          <button
            type="button"
            onClick={() => setInspectedCreatorId(null)}
            className="inline-flex items-center gap-1.5 min-h-[44px] px-2 -ml-2 text-xs font-bold text-[#A0A0A0] hover:text-[#FFFFFF]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Exhibition</span>
          </button>

          <button
            type="button"
            onClick={() => setInspectedCreatorId(null)}
            aria-label="Close creator profile"
            className="min-w-[44px] min-h-[44px] -mr-2 flex items-center justify-center text-[#A0A0A0] hover:text-[#FFFFFF]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 sm:p-8">
          {/* Creator Monograph Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-6 border-b border-white/15">
            <div className="flex items-start gap-4">
              <div className="relative shrink-0">
                <CreatorAvatar
                  src={creator.avatarUrl}
                  name={creator.displayName}
                  size="lg"
                  className="rounded-[2px] border-2 border-[#FFFFFF]"
                />
                <span
                  aria-hidden="true"
                  className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-[#00D4FF] border-2 border-[#000000]"
                />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#A0A0A0]">
                  <span className="font-mono-tabular font-bold text-[#00D4FF]">
                    @{creator.username}
                  </span>
                  {creator.location && (
                    <>
                      <span aria-hidden="true">/</span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {creator.location}
                      </span>
                    </>
                  )}
                  {creator.isSample && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>Sample creator</span>
                    </>
                  )}
                </div>

                <h2
                  id="creator-sheet-name"
                  className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#FFFFFF] mt-1"
                >
                  {creator.displayName}
                </h2>

                {creator.disciplines.length > 0 && (
                  <p className="mt-1.5 text-xs font-bold text-[#FFE600]">
                    {creator.disciplines.join(' · ')}
                  </p>
                )}

                {creator.bio && (
                  <p className="mt-3 text-sm text-[#A0A0A0] leading-relaxed max-w-xl">
                    {creator.bio}
                  </p>
                )}
              </div>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0">
              <div className="text-left sm:text-right">
                <span className="block text-[11px] font-mono-tabular text-[#A0A0A0]">WORKS</span>
                <span className="font-display font-mono-tabular text-2xl font-extrabold text-[#FFFFFF]">
                  {String(creatorProjects.length).padStart(2, '0')}
                </span>
              </div>

              {isCurrentUser ? (
                <button
                  type="button"
                  onClick={() => {
                    setInspectedCreatorId(null);
                    setActiveTab('profile');
                  }}
                  className="min-h-[42px] px-4 py-2 bg-[#FFE600] text-[#000000] border border-[#FFFFFF] text-xs font-bold hover:bg-[#00FF99]"
                >
                  Open My Profile
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void startConversationWithCreator(creator.id)}
                  className="inline-flex items-center gap-1.5 min-h-[42px] px-4 py-2 bg-[#00D4FF] text-[#000000] border border-[#FFFFFF] text-xs font-bold hover:bg-[#00FF99] transition-colors whitespace-nowrap"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Message Creator</span>
                </button>
              )}
            </div>
          </div>

          {/* Portfolio Works */}
          <div className="mt-6">
            <h3 className="text-xs font-mono-tabular font-bold text-[#A0A0A0] mb-4">
              EXHIBITION PORTFOLIO
            </h3>

            {creatorProjects.length === 0 ? (
              <div className="py-10 px-6 border border-white/20 bg-[#2A2A2A] text-center text-sm text-[#A0A0A0]">
                No published works yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {creatorProjects.map((project, idx) => (
                  <article
                    key={project.id}
                    className={`group ${idx === 0 && creatorProjects.length > 1 ? 'sm:col-span-2' : ''}`}
                  >
                    <div className="flex items-center justify-between text-xs pb-1.5 border-b border-white/15 mb-2">
                      <span className="font-mono-tabular font-bold text-[#00FF99]">
                        {String(idx + 1).padStart(2, '0')}.
                      </span>
                      <span className="text-[#A0A0A0]">{project.category}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setInspectedCreatorId(null);
                        setInspectedProjectId(project.id);
                      }}
                      className={`block w-full border-2 border-white/25 group-hover:border-[#00D4FF] bg-[#000000] text-left overflow-hidden ${
                        idx === 0 && creatorProjects.length > 1 ? 'aspect-[16/9]' : 'aspect-[4/3]'
                      }`}
                    >
                      <ArtworkImage
                        src={project.imageUrl}
                        alt={project.title}
                        titleFallback={project.title}
                        className="transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                    </button>
                    <h4 className="font-display text-base font-bold text-[#FFFFFF] mt-2.5 truncate group-hover:text-[#00D4FF] transition-colors">
                      {project.title}
                    </h4>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
