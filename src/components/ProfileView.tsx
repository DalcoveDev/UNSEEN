import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowUpRight,
  Bookmark,
  Camera,
  Edit3,
  LogOut,
  MapPin,
  Settings,
  Trash2,
  X,
} from 'lucide-react';
import { CREATIVE_CATEGORIES, CreativeCategory } from '../types/unseen';
import { useUnseen } from '../context/UnseenContext';
import { compressImageFile } from '../utils/storage';
import { ArtworkImage } from './ArtworkImage';
import { CreatorAvatar } from './CreatorAvatar';
import { UnseenSymbol } from './UnseenMark';
import { MorphingEyeCreature } from './UnseenPlaygroundGraphics';

type ProfileSection = 'published' | 'saved' | 'drafts';

export const ProfileView: React.FC = () => {
  const {
    currentUser,
    projects,
    drafts,
    openAuthModal,
    logout,
    updateProfile,
    setInspectedProjectId,
    deletePublishedProject,
    toggleSave,
    loadDraftIntoEditor,
    deleteDraft,
    setActiveTab,
  } = useUnseen();

  const [section, setSection] = useState<ProfileSection>('published');
  const [editOpen, setEditOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirmDeleteProjectId, setConfirmDeleteProjectId] = useState<string | null>(null);

  const myPublished = useMemo(
    () => (currentUser ? projects.filter((p) => p.creatorId === currentUser.id) : []),
    [currentUser, projects]
  );

  const mySaved = useMemo(
    () => (currentUser ? projects.filter((p) => currentUser.savedProjectIds.includes(p.id)) : []),
    [currentUser, projects]
  );

  if (!currentUser) {
    return (
      <div className="bg-[#000000] bg-playground-grid min-h-full">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 pb-24">
          <div className="border-2 border-[#FFFFFF] bg-[#1A1A1A] text-[#FFFFFF] p-7 sm:p-10 relative shadow-[8px_8px_0_0_#9933FF]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2.5 text-xs font-mono-tabular font-bold text-[#00FF99]">
                  <UnseenSymbol size={20} />
                  <span>CREATOR MONOGRAPH</span>
                </div>

                <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-[-0.025em] text-[#FFFFFF] mt-4 leading-[1.04] [text-wrap:balance]">
                  Your work belongs in an exhibition,{' '}
                  <span className="text-[#FFE600]">not buried by an algorithm.</span>
                </h1>
              </div>

              <MorphingEyeCreature size={104} className="shrink-0 self-start sm:self-center" />
            </div>

            <p className="text-sm sm:text-[15px] text-[#A0A0A0] leading-relaxed mt-4 max-w-xl">
              Create a personal UNSEEN portfolio to present your works across disciplines, join creative circles, save pieces that inspire you, and enter the rotating discovery exhibition.
            </p>

            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => openAuthModal('signup')}
                className="min-h-[48px] px-6 py-2.5 bg-[#00FF99] text-[#000000] border-2 border-[#FFFFFF] text-sm font-bold hover:bg-[#FFE600] transition-colors"
              >
                Create Creator Account
              </button>
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="min-h-[48px] px-6 py-2.5 border border-white/30 bg-[#2A2A2A] text-[#FFFFFF] text-sm font-bold hover:border-[#00D4FF] transition-colors"
              >
                Log In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const featuredWork = myPublished[0];
  const remainingWorks = myPublished.slice(1);

  return (
    <div className="bg-[#000000] bg-playground-grid min-h-full">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24">
        {/* Creator Monograph Header */}
        <section className="pb-7 border-b border-white/15">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 flex flex-col sm:flex-row sm:items-start gap-5">
              <div className="relative shrink-0 self-start">
                <CreatorAvatar
                  src={currentUser.avatarUrl}
                  name={currentUser.displayName || currentUser.username}
                  size="lg"
                  className="rounded-[2px] border-2 border-[#FFFFFF]"
                />
                <span
                  aria-hidden="true"
                  className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-[#00FF99] border-2 border-[#000000]"
                />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[#A0A0A0]">
                  <span className="font-mono-tabular font-bold text-[#00D4FF]">
                    @{currentUser.username}
                  </span>
                  {currentUser.location && (
                    <>
                      <span aria-hidden="true">/</span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {currentUser.location}
                      </span>
                    </>
                  )}
                </div>

                <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-[-0.025em] text-[#FFFFFF] mt-1.5 leading-tight">
                  {currentUser.displayName || currentUser.username}
                </h1>

                {currentUser.disciplines.length > 0 && (
                  <p className="mt-2 text-xs font-bold text-[#FFE600]">
                    {currentUser.disciplines.join(' · ')}
                  </p>
                )}

                {currentUser.bio ? (
                  <p className="mt-3 text-sm leading-relaxed text-[#A0A0A0] max-w-xl">
                    {currentUser.bio}
                  </p>
                ) : (
                  <p className="mt-3 text-sm text-[#A0A0A0]/70 italic">
                    Add a biography to introduce your practice and materials.
                  </p>
                )}
              </div>
            </div>

            {/* Right Column: Published Count & Controls */}
            <div className="lg:col-span-4 flex lg:flex-col items-center lg:items-end justify-between gap-4 pt-2 lg:pt-0 border-t lg:border-t-0 border-white/15">
              <div className="text-left lg:text-right">
                <span className="block text-[11px] font-mono-tabular text-[#A0A0A0]">
                  PUBLISHED WORKS
                </span>
                <span className="font-display font-mono-tabular text-3xl font-extrabold text-[#FFFFFF]">
                  {String(myPublished.length).padStart(2, '0')}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditOpen(true)}
                  className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2 border-2 border-[#FFFFFF] bg-[#1A1A1A] text-[#FFFFFF] text-xs font-bold hover:bg-[#FFE600] hover:text-[#000000] transition-colors whitespace-nowrap"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsOpen(true)}
                  aria-label="Account settings"
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center border border-white/25 bg-[#1A1A1A] text-[#FFFFFF] hover:border-[#00D4FF] transition-colors"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Portfolio / Saved / Drafts Switcher */}
        <div className="mt-5 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={section === 'published'}
            onClick={() => setSection('published')}
            className={`min-h-[42px] px-4 py-2 text-xs font-bold border whitespace-nowrap transition-colors ${
              section === 'published'
                ? 'bg-[#FFE600] border-[#FFE600] text-[#000000]'
                : 'bg-[#1A1A1A] border-white/20 text-[#A0A0A0] hover:border-[#FFFFFF] hover:text-[#FFFFFF]'
            }`}
          >
            Portfolio ({myPublished.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={section === 'saved'}
            onClick={() => setSection('saved')}
            className={`min-h-[42px] px-4 py-2 text-xs font-bold border whitespace-nowrap transition-colors ${
              section === 'saved'
                ? 'bg-[#FFE600] border-[#FFE600] text-[#000000]'
                : 'bg-[#1A1A1A] border-white/20 text-[#A0A0A0] hover:border-[#FFFFFF] hover:text-[#FFFFFF]'
            }`}
          >
            Saved Archive ({mySaved.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={section === 'drafts'}
            onClick={() => setSection('drafts')}
            className={`min-h-[42px] px-4 py-2 text-xs font-bold border whitespace-nowrap transition-colors ${
              section === 'drafts'
                ? 'bg-[#FFE600] border-[#FFE600] text-[#000000]'
                : 'bg-[#1A1A1A] border-white/20 text-[#A0A0A0] hover:border-[#FFFFFF] hover:text-[#FFFFFF]'
            }`}
          >
            Drafts ({drafts.length})
          </button>
        </div>

        {/* Section Content */}
        <div className="mt-7">
          {section === 'published' && (
            <>
              {myPublished.length === 0 ? (
                <div className="border-2 border-[#FFFFFF] bg-[#1A1A1A] p-10 text-center flex flex-col items-center shadow-[6px_6px_0_0_#00D4FF]">
                  <MorphingEyeCreature size={88} className="mb-4" />
                  <p className="font-display text-2xl font-extrabold text-[#FFFFFF]">
                    Your portfolio awaits its first plate
                  </p>
                  <p className="text-sm text-[#A0A0A0] mt-1.5 max-w-md mx-auto">
                    Present an artwork, design study, photograph, or architectural model in the studio to join the rotating exhibition.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('publish')}
                    className="mt-5 min-h-[46px] px-6 py-2.5 bg-[#00FF99] text-[#000000] border border-[#FFFFFF] text-sm font-bold hover:bg-[#FFE600]"
                  >
                    Open Publish Studio
                  </button>
                </div>
              ) : (
                <div className="space-y-12">
                  {/* Featured Lead Work */}
                  {featuredWork && (
                    <article className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch bg-[#1A1A1A] text-[#FFFFFF] border-2 border-[#FFFFFF] p-5 sm:p-7 shadow-[6px_6px_0_0_#9933FF]">
                      <button
                        type="button"
                        onClick={() => setInspectedProjectId(featuredWork.id)}
                        className="lg:col-span-7 block w-full aspect-[16/10] overflow-hidden border-2 border-[#00D4FF] bg-[#000000] text-left group"
                      >
                        <ArtworkImage
                          src={featuredWork.imageUrl}
                          alt={featuredWork.title}
                          titleFallback={featuredWork.title}
                          className="transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                      </button>

                      <div className="lg:col-span-5 flex flex-col justify-between py-1">
                        <div>
                          <div className="flex items-center justify-between pb-2.5 border-b border-white/15 text-xs">
                            <span className="font-mono-tabular font-bold text-[#00FF99]">
                              01. FEATURED WORK
                            </span>
                            <span className="text-[#FFE600] font-medium">{featuredWork.category}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setInspectedProjectId(featuredWork.id)}
                            className="text-left block mt-3.5 group"
                          >
                            <h2 className="font-display text-2xl font-extrabold text-[#FFFFFF] group-hover:text-[#00D4FF] transition-colors">
                              {featuredWork.title}
                            </h2>
                          </button>
                          <p className="mt-3 text-sm text-[#A0A0A0] leading-relaxed line-clamp-4">
                            {featuredWork.description}
                          </p>
                        </div>

                        <div className="mt-5 pt-4 border-t border-white/15 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => setInspectedProjectId(featuredWork.id)}
                            className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 bg-[#00D4FF] text-[#000000] text-xs font-bold hover:bg-[#00FF99]"
                          >
                            <span>Inspect Plate</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>

                          {confirmDeleteProjectId === featuredWork.id ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  deletePublishedProject(featuredWork.id);
                                  setConfirmDeleteProjectId(null);
                                }}
                                className="min-h-[38px] px-3 bg-[#FF3DAE] text-[#000000] text-xs font-bold"
                              >
                                Delete
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteProjectId(null)}
                                className="min-h-[38px] px-2 text-xs text-[#A0A0A0]"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteProjectId(featuredWork.id)}
                              aria-label={`Delete ${featuredWork.title}`}
                              className="min-w-[40px] min-h-[40px] flex items-center justify-center text-[#A0A0A0] hover:text-[#FF3DAE]"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  )}

                  {/* Asymmetric Portfolio Grid */}
                  {remainingWorks.length > 0 && (
                    <div className="pt-8 border-t border-white/15 grid grid-cols-1 md:grid-cols-12 gap-x-6 gap-y-10">
                      {remainingWorks.map((project, idx) => {
                        const isWide = idx % 3 === 0;
                        return (
                          <article
                            key={project.id}
                            className={`${isWide ? 'md:col-span-7' : 'md:col-span-5'} group`}
                          >
                            <div className="flex items-center justify-between text-xs pb-2 border-b border-white/15 mb-2.5">
                              <span className="font-mono-tabular font-bold text-[#00D4FF]">
                                {String(idx + 2).padStart(2, '0')}.
                              </span>
                              <span className="text-[#A0A0A0]">{project.category}</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => setInspectedProjectId(project.id)}
                              className={`block w-full overflow-hidden border-2 border-white/30 group-hover:border-[#00FF99] bg-[#1A1A1A] text-left ${
                                isWide ? 'aspect-[16/10]' : 'aspect-[4/4]'
                              }`}
                            >
                              <ArtworkImage
                                src={project.imageUrl}
                                alt={project.title}
                                titleFallback={project.title}
                                className="transition-transform duration-500 group-hover:scale-[1.03]"
                              />
                            </button>

                            <div className="mt-2.5 flex items-start justify-between gap-2">
                              <h3 className="font-display text-lg font-bold text-[#FFFFFF] truncate">
                                {project.title}
                              </h3>

                              {confirmDeleteProjectId === project.id ? (
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      deletePublishedProject(project.id);
                                      setConfirmDeleteProjectId(null);
                                    }}
                                    className="min-h-[36px] px-2.5 bg-[#FF3DAE] text-[#000000] text-xs font-bold"
                                  >
                                    Delete
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteProjectId(null)}
                                    className="min-h-[36px] px-2 text-xs text-[#A0A0A0]"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteProjectId(project.id)}
                                  aria-label={`Delete ${project.title}`}
                                  className="min-w-[40px] min-h-[40px] flex items-center justify-center text-[#A0A0A0] hover:text-[#FF3DAE]"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {section === 'saved' && (
            <>
              {mySaved.length === 0 ? (
                <div className="border-2 border-white/25 bg-[#1A1A1A] p-10 text-center flex flex-col items-center">
                  <MorphingEyeCreature size={80} className="mb-3" />
                  <p className="font-display text-xl font-extrabold text-[#FFFFFF]">
                    Your saved archive is empty
                  </p>
                  <p className="text-sm text-[#A0A0A0] mt-1.5 max-w-md mx-auto">
                    Bookmark works across disciplines in Explore to curate your personal reference archive.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('explore')}
                    className="mt-5 min-h-[44px] px-5 py-2.5 bg-[#00D4FF] text-[#000000] border border-[#FFFFFF] text-sm font-bold hover:bg-[#00FF99]"
                  >
                    Browse Exhibition
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {mySaved.map((project, idx) => (
                    <article key={project.id} className="group">
                      <div className="flex items-center justify-between text-xs pb-2 border-b border-white/15 mb-2">
                        <span className="font-mono-tabular font-bold text-[#FFE600]">
                          {String(idx + 1).padStart(2, '0')}.
                        </span>
                        <span className="text-[#A0A0A0]">{project.category}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setInspectedProjectId(project.id)}
                        className="block w-full aspect-[4/3] overflow-hidden border-2 border-white/25 group-hover:border-[#FFE600] bg-[#1A1A1A] text-left"
                      >
                        <ArtworkImage
                          src={project.imageUrl}
                          alt={project.title}
                          titleFallback={project.title}
                          className="transition-transform duration-300 group-hover:scale-[1.03]"
                        />
                      </button>
                      <div className="mt-2.5 flex items-start justify-between gap-2">
                        <h3 className="font-display text-base font-bold text-[#FFFFFF] truncate">
                          {project.title}
                        </h3>
                        <button
                          type="button"
                          onClick={() => toggleSave(project.id)}
                          aria-label={`Remove ${project.title} from saved`}
                          className="min-w-[40px] min-h-[40px] flex items-center justify-center text-[#FFE600] hover:bg-[#2A2A2A]"
                        >
                          <Bookmark className="w-4 h-4" fill="currentColor" />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}

          {section === 'drafts' && (
            <>
              {drafts.length === 0 ? (
                <div className="border-2 border-white/25 bg-[#1A1A1A] p-10 text-center flex flex-col items-center">
                  <MorphingEyeCreature size={80} className="mb-3" />
                  <p className="font-display text-xl font-extrabold text-[#FFFFFF]">No saved drafts</p>
                  <p className="text-sm text-[#A0A0A0] mt-1.5">
                    Start composing in the Publish studio and save unfinished works anytime.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('publish')}
                    className="mt-5 min-h-[44px] px-5 py-2.5 bg-[#00FF99] text-[#000000] border border-[#FFFFFF] text-sm font-bold"
                  >
                    Open Publish Studio
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {drafts.map((draft, idx) => (
                    <div
                      key={draft.id}
                      className="p-4 border-2 border-white/20 bg-[#1A1A1A] flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-14 h-14 border border-white/20 bg-[#000000] shrink-0 overflow-hidden">
                          <ArtworkImage
                            src={draft.imageUrl}
                            alt={draft.title || 'Draft'}
                            titleFallback={draft.title || 'Draft'}
                          />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[11px] font-mono-tabular text-[#FFE600]">
                            {String(idx + 1).padStart(2, '0')} · {draft.category}
                          </span>
                          <p className="font-display text-sm font-bold text-[#FFFFFF] truncate">
                            {draft.title || 'Untitled Draft'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => loadDraftIntoEditor(draft.id)}
                          className="min-h-[40px] px-3 bg-[#2A2A2A] border border-white/20 text-[#FFFFFF] text-xs font-bold hover:border-[#00D4FF]"
                        >
                          Continue
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteDraft(draft.id)}
                          aria-label="Delete draft"
                          className="min-w-[40px] min-h-[40px] flex items-center justify-center text-[#A0A0A0] hover:text-[#FF3DAE]"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Edit Profile Modal */}
        {editOpen && (
          <EditProfileModal
            initialDisplayName={currentUser.displayName}
            initialUsername={currentUser.username}
            initialBio={currentUser.bio}
            initialDisciplines={currentUser.disciplines}
            initialAvatarUrl={currentUser.avatarUrl}
            initialLocation={currentUser.location ?? ''}
            onClose={() => setEditOpen(false)}
            onSave={async (payload) => {
              const res = await updateProfile(payload);
              if (res.ok) setEditOpen(false);
              return res;
            }}
          />
        )}

        {/* Account Settings Modal */}
        {settingsOpen && (
          <div
            className="fixed inset-0 z-50 bg-[#000000]/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="account-settings-title"
          >
            <div className="w-full sm:max-w-md bg-[#1A1A1A] border-2 border-[#FFFFFF] p-6 shadow-[6px_6px_0_0_#FF3DAE]">
              <div className="flex items-center justify-between pb-4 border-b border-white/15">
                <h2 id="account-settings-title" className="font-display text-xl font-extrabold text-[#FFFFFF]">
                  Account Settings
                </h2>
                <button
                  type="button"
                  onClick={() => setSettingsOpen(false)}
                  aria-label="Close settings"
                  className="min-w-[44px] min-h-[44px] -mr-2 flex items-center justify-center text-[#A0A0A0] hover:text-[#FFFFFF]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="py-5 space-y-4 text-sm">
                <div>
                  <p className="text-xs text-[#A0A0A0]">Signed in as</p>
                  <p className="font-bold text-[#00D4FF] mt-0.5">@{currentUser.username}</p>
                  <p className="text-xs text-[#A0A0A0] mt-0.5">{currentUser.email}</p>
                </div>

                <div className="p-3.5 border border-white/15 bg-[#2A2A2A] text-xs text-[#A0A0A0] leading-relaxed">
                  Your creator profile, published exhibition works, saved archive, community circles, and messages sync persistently through UNSEEN&apos;s backend and Firebase, while unfinished studio drafts stay saved locally on this device.
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSettingsOpen(false);
                  logout();
                }}
                className="inline-flex items-center justify-center gap-2 min-h-[46px] w-full bg-[#FF3DAE] text-[#000000] border border-[#FFFFFF] text-sm font-bold hover:bg-[#FFE600] transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface EditProfileModalProps {
  initialDisplayName: string;
  initialUsername: string;
  initialBio: string;
  initialDisciplines: CreativeCategory[];
  initialAvatarUrl?: string;
  initialLocation: string;
  onClose: () => void;
  onSave: (input: {
    displayName: string;
    username: string;
    bio: string;
    disciplines: CreativeCategory[];
    avatarUrl?: string;
    location?: string;
  }) => Promise<{ ok: boolean; error?: string }>;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  initialDisplayName,
  initialUsername,
  initialBio,
  initialDisciplines,
  initialAvatarUrl,
  initialLocation,
  onClose,
  onSave,
}) => {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [username, setUsername] = useState(initialUsername);
  const [bio, setBio] = useState(initialBio);
  const [disciplines, setDisciplines] = useState<CreativeCategory[]>(initialDisciplines);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(initialAvatarUrl);
  const [location, setLocation] = useState(initialLocation);
  const [error, setError] = useState<string | null>(null);

  const toggleDiscipline = (cat: CreativeCategory) => {
    setDisciplines((prev) =>
      prev.includes(cat) ? prev.filter((item) => item !== cat) : [...prev, cat]
    );
  };

  const handleAvatarChange = async (file: File | undefined) => {
    if (!file) return;
    try {
      const { dataUrl } = await compressImageFile(file, 512, 0.85);
      setAvatarUrl(dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update avatar.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = await onSave({
      displayName,
      username,
      bio,
      disciplines,
      avatarUrl,
      location,
    });
    if (!res.ok && res.error) {
      setError(res.error);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#000000]/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-profile-heading"
    >
      <div className="w-full sm:max-w-lg max-h-[90vh] overflow-y-auto bg-[#1A1A1A] border-2 border-[#FFFFFF] p-6 shadow-[6px_6px_0_0_#00D4FF]">
        <div className="flex items-center justify-between pb-4 border-b border-white/15">
          <h2 id="edit-profile-heading" className="font-display text-xl font-extrabold text-[#FFFFFF]">
            Edit Creator Profile
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="min-w-[44px] min-h-[44px] -mr-2 flex items-center justify-center text-[#A0A0A0] hover:text-[#FFFFFF]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-5 space-y-4">
          {error && (
            <div className="p-3 border border-[#FF3DAE] bg-[#2A2A2A] text-xs font-medium text-[#FF3DAE]">
              {error}
            </div>
          )}

          <div className="flex items-center gap-4">
            <CreatorAvatar src={avatarUrl} name={displayName || username} size="lg" />
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  void handleAvatarChange(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 bg-[#2A2A2A] border border-white/25 text-xs font-bold text-[#FFFFFF] hover:border-[#00D4FF]"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Change Portrait</span>
              </button>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={() => setAvatarUrl(undefined)}
                  className="ml-2 text-xs text-[#A0A0A0] hover:text-[#FF3DAE]"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="edit-display-name" className="block text-xs font-bold text-[#FFFFFF] mb-1">
              Display Name
            </label>
            <input
              id="edit-display-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full min-h-[44px] px-3.5 bg-[#000000] border border-white/25 text-sm text-[#FFFFFF] focus:outline-none focus:border-[#00D4FF]"
            />
          </div>

          <div>
            <label htmlFor="edit-username" className="block text-xs font-bold text-[#FFFFFF] mb-1">
              Username
            </label>
            <input
              id="edit-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full min-h-[44px] px-3.5 bg-[#000000] border border-white/25 text-sm text-[#FFFFFF] focus:outline-none focus:border-[#00D4FF]"
            />
          </div>

          <div>
            <label htmlFor="edit-location" className="block text-xs font-bold text-[#FFFFFF] mb-1">
              Location <span className="text-[#A0A0A0] font-normal">(Optional)</span>
            </label>
            <input
              id="edit-location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City or studio location"
              className="w-full min-h-[44px] px-3.5 bg-[#000000] border border-white/25 text-sm text-[#FFFFFF] placeholder:text-[#A0A0A0] focus:outline-none focus:border-[#00D4FF]"
            />
          </div>

          <div>
            <label htmlFor="edit-bio" className="block text-xs font-bold text-[#FFFFFF] mb-1">
              Biography
            </label>
            <textarea
              id="edit-bio"
              rows={3}
              maxLength={280}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Describe your creative focus and medium..."
              className="w-full px-3.5 py-2.5 bg-[#000000] border border-white/25 text-sm text-[#FFFFFF] placeholder:text-[#A0A0A0] focus:outline-none focus:border-[#00D4FF]"
            />
          </div>

          <div>
            <span className="block text-xs font-bold text-[#FFFFFF] mb-2">
              Creative Disciplines
            </span>
            <div className="flex flex-wrap gap-1.5">
              {CREATIVE_CATEGORIES.map((cat) => {
                const active = disciplines.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleDiscipline(cat)}
                    className={`min-h-[38px] px-3 border text-xs font-bold transition-colors ${
                      active
                        ? 'bg-[#FFE600] border-[#FFE600] text-[#000000]'
                        : 'bg-[#000000] border-white/25 text-[#A0A0A0] hover:border-[#FFFFFF] hover:text-[#FFFFFF]'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 text-sm font-medium text-[#A0A0A0] hover:text-[#FFFFFF]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-5 bg-[#00FF99] text-[#000000] border border-[#FFFFFF] text-sm font-bold hover:bg-[#FFE600]"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
