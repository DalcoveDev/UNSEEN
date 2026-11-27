import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowUpRight,
  Eye,
  FileEdit,
  ImagePlus,
  Link as LinkIcon,
  Save,
  Trash2,
} from 'lucide-react';
import { CREATIVE_CATEGORIES } from '../types/unseen';
import { useUnseen } from '../context/UnseenContext';
import { compressImageFile } from '../utils/storage';
import { ArtworkImage } from './ArtworkImage';
import { CreatorAvatar } from './CreatorAvatar';
import {
  FrameStepSpinner,
  MorphingEyeCreature,
  PixelStickerBurst,
  StudioPlaygroundSticker,
} from './UnseenPlaygroundGraphics';

export const PublishView: React.FC = () => {
  const {
    currentUser,
    openAuthModal,
    activeEditor,
    updateEditorField,
    resetEditor,
    drafts,
    saveCurrentAsDraft,
    loadDraftIntoEditor,
    deleteDraft,
    publishFromEditor,
    publishExistingDraft,
    setActiveTab,
    setInspectedProjectId,
  } = useUnseen();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [mode, setMode] = useState<'compose' | 'preview'>('compose');
  const [isUploading, setIsUploading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDeleteDraftId, setConfirmDeleteDraftId] = useState<string | null>(null);
  const [justPublishedId, setJustPublishedId] = useState<string | null>(null);

  const handleImageSelect = async (file: File | undefined) => {
    if (!file) return;
    setFormError(null);
    setIsUploading(true);
    try {
      const { dataUrl, aspectHint } = await compressImageFile(file);
      updateEditorField('imageUrl', dataUrl);
      updateEditorField('aspectHint', aspectHint);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to process image.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    void handleImageSelect(file);
  };

  const handleSaveDraft = () => {
    setFormError(null);
    const result = saveCurrentAsDraft();
    if (!result.ok && result.error) {
      setFormError(result.error);
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsPublishing(true);
    const result = await publishFromEditor();
    setIsPublishing(false);
    if (!result.ok && result.error) {
      setFormError(result.error);
      return;
    }
    if (result.project) {
      setJustPublishedId(result.project.id);
      setMode('compose');
    }
  };

  const handlePublishDraftDirect = async (draftId: string) => {
    setFormError(null);
    setIsPublishing(true);
    const result = await publishExistingDraft(draftId);
    setIsPublishing(false);
    if (!result.ok && result.error) {
      setFormError(result.error);
      return;
    }
    if (result.project) {
      setJustPublishedId(result.project.id);
    }
  };

  const hasUnsavedContent =
    Boolean(activeEditor.imageUrl) ||
    Boolean(activeEditor.title.trim()) ||
    Boolean(activeEditor.description.trim()) ||
    Boolean(activeEditor.externalUrl.trim());

  return (
    <div className="bg-[#000000] bg-playground-grid min-h-full">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24">
        {/* Studio Masthead */}
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-6 border-b border-white/15">
          <div className="flex items-center gap-4">
            <StudioPlaygroundSticker className="w-16 h-10 shrink-0 hidden sm:block" />
            <div>
              <div className="flex items-center gap-2.5 text-xs font-mono-tabular font-bold text-[#00FF99] mb-1.5">
                <span>EXHIBITION STUDIO</span>
                <span aria-hidden="true">/</span>
                <span className="text-[#A0A0A0]">MOUNT &amp; PUBLISH</span>
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-[-0.03em] text-[#FFFFFF] leading-none">
                {activeEditor.editingDraftId ? 'Refine Draft Plate' : 'Present a New Work'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="inline-flex border-2 border-[#FFFFFF] bg-[#1A1A1A]">
              <button
                type="button"
                onClick={() => setMode('compose')}
                className={`inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-1.5 text-xs font-bold transition-colors whitespace-nowrap ${
                  mode === 'compose'
                    ? 'bg-[#FFE600] text-[#000000]'
                    : 'text-[#A0A0A0] hover:text-[#FFFFFF]'
                }`}
              >
                <FileEdit className="w-3.5 h-3.5" />
                <span>Studio</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('preview')}
                className={`inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-1.5 text-xs font-bold transition-colors whitespace-nowrap ${
                  mode === 'preview'
                    ? 'bg-[#FFE600] text-[#000000]'
                    : 'text-[#A0A0A0] hover:text-[#FFFFFF]'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview</span>
              </button>
            </div>

            {hasUnsavedContent && (
              <button
                type="button"
                onClick={() => {
                  resetEditor();
                  setFormError(null);
                }}
                className="min-h-[40px] px-3 text-xs font-medium text-[#A0A0A0] hover:text-[#FF3DAE] whitespace-nowrap"
              >
                Clear Plate
              </button>
            )}
          </div>
        </header>

        {/* Guest Banner */}
        {!currentUser && (
          <div className="mt-5 p-4 border-2 border-[#FFFFFF] bg-[#1A1A1A] shadow-[4px_4px_0_0_#00D4FF] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-[#FFFFFF]">
                Sign in when ready to exhibit
              </p>
              <p className="text-xs text-[#A0A0A0] mt-0.5">
                Compose and save drafts locally right now. Create a creator profile when you are ready to publish to Explore.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="min-h-[42px] px-3.5 text-xs font-bold border border-white/30 bg-[#2A2A2A] text-[#FFFFFF] hover:border-[#FFFFFF] whitespace-nowrap"
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => openAuthModal('signup')}
                className="min-h-[42px] px-4 text-xs font-bold bg-[#00FF99] text-[#000000] border border-[#FFFFFF] hover:bg-[#FFE600] whitespace-nowrap"
              >
                Create Account
              </button>
            </div>
          </div>
        )}

        {/* Rewarding Animated Celebration After Publishing */}
        <AnimatePresence>
          {justPublishedId && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="mt-6 p-5 border-2 border-[#FFFFFF] bg-[#1A1A1A] text-[#FFFFFF] shadow-[6px_6px_0_0_#00FF99] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <PixelStickerBurst className="w-16 h-16 shrink-0" />
                <div>
                  <p className="font-mono-tabular text-xs font-bold text-[#00FF99]">
                    LIVE IN ROTATION
                  </p>
                  <p className="font-display text-lg font-extrabold text-[#FFFFFF] mt-0.5">
                    Published to the UNSEEN Exhibition!
                  </p>
                  <p className="text-xs text-[#A0A0A0] mt-0.5">
                    Your work is now part of the Explore rotation and your creator profile.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('explore');
                    setInspectedProjectId(justPublishedId);
                  }}
                  className="min-h-[44px] px-4 text-xs font-bold bg-[#00FF99] text-[#000000] border border-[#FFFFFF] hover:bg-[#FFE600] whitespace-nowrap"
                >
                  View in Explore
                </button>
                <button
                  type="button"
                  onClick={() => setJustPublishedId(null)}
                  className="min-h-[44px] px-3 text-xs text-[#A0A0A0] hover:text-[#FFFFFF]"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {formError && (
          <div
            role="alert"
            className="mt-5 p-3.5 border-2 border-[#FF3DAE] bg-[#1A1A1A] text-sm text-[#FF3DAE] font-semibold"
          >
            {formError}
          </div>
        )}

        {/* Main Studio Body */}
        {mode === 'preview' ? (
          <section className="mt-7">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch border-2 border-[#FFFFFF] bg-[#1A1A1A] text-[#FFFFFF] p-5 sm:p-8 shadow-[6px_6px_0_0_#9933FF]">
              <div className="lg:col-span-7 bg-[#000000] border border-white/25 min-h-[300px] max-h-[520px] flex items-center justify-center overflow-hidden">
                {activeEditor.imageUrl ? (
                  <img
                    src={activeEditor.imageUrl}
                    alt={activeEditor.title || 'Exhibition preview'}
                    className="w-full max-h-[520px] object-contain"
                  />
                ) : (
                  <p className="text-sm text-[#A0A0A0] p-8 text-center">
                    No artwork plate uploaded yet.
                  </p>
                )}
              </div>

              <div className="lg:col-span-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-white/15 text-xs">
                    <span className="font-mono-tabular text-[#00D4FF] font-bold">PREVIEW PLATE</span>
                    <span className="text-[#FFE600] font-medium">{activeEditor.category}</span>
                  </div>

                  <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#FFFFFF] mt-4 leading-tight">
                    {activeEditor.title.trim() || 'Untitled Exhibition Work'}
                  </h2>

                  <div className="mt-4 flex items-center gap-2.5">
                    <CreatorAvatar
                      src={currentUser?.avatarUrl}
                      name={currentUser?.displayName ?? currentUser?.username ?? 'Creator'}
                      size="sm"
                    />
                    <span className="text-sm font-semibold text-[#FFFFFF]">
                      {currentUser?.displayName ?? `@${currentUser?.username ?? 'creator'}`}
                    </span>
                  </div>

                  <p className="mt-5 text-sm leading-relaxed text-[#A0A0A0] whitespace-pre-line">
                    {activeEditor.description.trim() ||
                      'Your curatorial notes and creative context will appear here.'}
                  </p>

                  {activeEditor.externalUrl.trim() && (
                    <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#00D4FF]">
                      <span>{activeEditor.externalUrl.trim()}</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-5 border-t border-white/15 flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={() => setMode('compose')}
                    className="min-h-[44px] px-4 text-xs font-bold border border-white/30 text-[#FFFFFF] hover:border-[#FFFFFF]"
                  >
                    Back to Studio
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    className="min-h-[44px] px-4 text-xs font-bold bg-[#2A2A2A] border border-white/25 text-[#FFFFFF] hover:border-[#FFE600]"
                  >
                    Save Draft
                  </button>
                  <button
                    type="button"
                    disabled={isPublishing}
                    onClick={(e) => void handlePublish(e)}
                    className="min-h-[44px] px-5 text-xs font-bold bg-[#00FF99] text-[#000000] border border-[#FFFFFF] hover:bg-[#FFE600] disabled:opacity-60"
                  >
                    {isPublishing ? 'Publishing...' : 'Publish Work'}
                  </button>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <form onSubmit={(e) => void handlePublish(e)} className="mt-7 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 7 Columns: Artwork Mounting Board */}
            <div className="lg:col-span-7">
              <div className="flex items-center justify-between text-xs text-[#A0A0A0] pb-2 border-b border-white/15 mb-3">
                <span className="font-mono-tabular font-bold text-[#00D4FF]">01. Artwork Plate</span>
                <span>PNG, JPG, WebP</span>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  void handleImageSelect(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />

              {activeEditor.imageUrl ? (
                <div className="relative border-2 border-[#FFFFFF] bg-[#1A1A1A] shadow-[6px_6px_0_0_#00D4FF]">
                  <div className="h-2.5 w-full bg-checker-strip border-b border-[#FFFFFF]" aria-hidden="true" />
                  <div className="bg-[#000000] min-h-[280px] max-h-[460px] flex items-center justify-center overflow-hidden p-4 sm:p-6">
                    <img
                      src={activeEditor.imageUrl}
                      alt="Uploaded artwork plate"
                      className="max-h-[410px] w-auto object-contain border border-white/20"
                    />
                  </div>
                  <div className="px-4 py-3 border-t border-white/15 flex items-center justify-between gap-3">
                    <span className="text-xs font-mono-tabular text-[#00FF99]">
                      Plate mounted · auto-saved locally
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="min-h-[40px] px-3 text-xs font-bold bg-[#2A2A2A] border border-white/25 text-[#FFFFFF] hover:border-[#00D4FF]"
                      >
                        Replace Image
                      </button>
                      <button
                        type="button"
                        onClick={() => updateEditorField('imageUrl', '')}
                        className="min-h-[40px] px-3 text-xs font-bold text-[#FF3DAE] hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  className="relative cursor-pointer border-2 border-[#FFFFFF] bg-[#1A1A1A] hover:bg-[#2A2A2A] transition-colors py-20 px-6 text-center shadow-[6px_6px_0_0_#9933FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D4FF]"
                >
                  {/* Animated Corner Registration Marks */}
                  <span aria-hidden="true" className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-[#00D4FF]" />
                  <span aria-hidden="true" className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-[#FFE600]" />
                  <span aria-hidden="true" className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-[#FF3DAE]" />
                  <span aria-hidden="true" className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-[#00FF99]" />

                  <div className="w-14 h-14 mx-auto mb-4 border-2 border-[#FFFFFF] bg-[#000000] flex items-center justify-center text-[#00FF99]">
                    {isUploading ? (
                      <FrameStepSpinner size={28} label="Mounting image" />
                    ) : (
                      <ImagePlus className="w-6 h-6" strokeWidth={1.8} />
                    )}
                  </div>
                  <p className="font-display text-2xl font-extrabold text-[#FFFFFF]">
                    {isUploading ? 'Mounting image...' : 'Mount Your Artwork'}
                  </p>
                  <p className="text-xs text-[#A0A0A0] mt-1.5 max-w-xs mx-auto">
                    Tap or drop an artwork, photograph, poster, illustration, or interface study here.
                  </p>
                </div>
              )}
            </div>

            {/* Right 5 Columns: Catalogue Details */}
            <div className="lg:col-span-5 space-y-5">
              <div className="flex items-center justify-between text-xs text-[#A0A0A0] pb-2 border-b border-white/15">
                <span className="font-mono-tabular font-bold text-[#FFE600]">02. Catalogue Details</span>
                <span>Required to exhibit</span>
              </div>

              <div>
                <label htmlFor="publish-title" className="block text-xs font-bold text-[#FFFFFF] mb-1.5">
                  Work Title
                </label>
                <input
                  id="publish-title"
                  type="text"
                  maxLength={100}
                  value={activeEditor.title}
                  onChange={(e) => updateEditorField('title', e.target.value)}
                  placeholder="Title of the piece or series"
                  className="w-full min-h-[46px] px-3.5 py-2.5 bg-[#1A1A1A] border border-white/25 text-sm text-[#FFFFFF] placeholder:text-[#A0A0A0] focus:outline-none focus:border-[#00D4FF]"
                />
              </div>

              <div>
                <span className="block text-xs font-bold text-[#FFFFFF] mb-2">
                  Creative Discipline
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {CREATIVE_CATEGORIES.map((category) => {
                    const selected = activeEditor.category === category;
                    return (
                      <button
                        key={category}
                        type="button"
                        onClick={() => updateEditorField('category', category)}
                        className={`min-h-[38px] px-3 py-1.5 text-xs font-bold border transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D4FF] ${
                          selected
                            ? 'bg-[#FFE600] border-[#FFE600] text-[#000000]'
                            : 'bg-[#1A1A1A] border-white/20 text-[#A0A0A0] hover:border-[#FFFFFF] hover:text-[#FFFFFF]'
                        }`}
                      >
                        {category}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label
                  htmlFor="publish-description"
                  className="block text-xs font-bold text-[#FFFFFF] mb-1.5"
                >
                  Exhibition Notes
                </label>
                <textarea
                  id="publish-description"
                  rows={4}
                  maxLength={1200}
                  value={activeEditor.description}
                  onChange={(e) => updateEditorField('description', e.target.value)}
                  placeholder="Share the materials, concept, process, or story behind this work..."
                  className="w-full px-3.5 py-2.5 bg-[#1A1A1A] border border-white/25 text-sm text-[#FFFFFF] placeholder:text-[#A0A0A0] leading-relaxed focus:outline-none focus:border-[#00D4FF]"
                />
              </div>

              <div>
                <label htmlFor="publish-link" className="block text-xs font-bold text-[#FFFFFF] mb-1.5">
                  External Link <span className="text-[#A0A0A0] font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <LinkIcon className="w-4 h-4 text-[#A0A0A0] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="publish-link"
                    type="text"
                    value={activeEditor.externalUrl}
                    onChange={(e) => updateEditorField('externalUrl', e.target.value)}
                    placeholder="https://studio.example.com/work"
                    className="w-full min-h-[44px] pl-10 pr-3.5 py-2 bg-[#1A1A1A] border border-white/25 text-sm text-[#FFFFFF] placeholder:text-[#A0A0A0] focus:outline-none focus:border-[#00D4FF]"
                  />
                </div>
              </div>

              <div className="pt-3 flex flex-col gap-2.5">
                <motion.button
                  type="submit"
                  disabled={isPublishing}
                  whileTap={{ scale: 0.98 }}
                  className="w-full min-h-[48px] px-6 py-2.5 bg-[#00FF99] text-[#000000] border-2 border-[#FFFFFF] shadow-[4px_4px_0_0_#9933FF] text-sm font-bold hover:bg-[#FFE600] transition-colors disabled:opacity-60"
                >
                  {isPublishing ? 'Publishing to Exhibition...' : 'Publish to Exhibition'}
                </motion.button>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 bg-[#1A1A1A] border border-white/25 text-[#FFFFFF] text-xs font-bold hover:border-[#00D4FF] transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{activeEditor.editingDraftId ? 'Update Draft' : 'Save Draft'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('preview')}
                    className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 border border-white/25 bg-[#2A2A2A] text-[#FFFFFF] text-xs font-bold hover:border-[#FFE600] transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview Plate</span>
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* Persistent Archival Drafts */}
        <section className="mt-14 pt-8 border-t border-white/15" aria-labelledby="saved-drafts-heading">
          <div className="flex items-baseline justify-between gap-4 mb-5">
            <div>
              <h2 id="saved-drafts-heading" className="font-display text-2xl font-extrabold text-[#FFFFFF]">
                Studio Drafts Folio
              </h2>
              <p className="text-xs text-[#A0A0A0] mt-0.5">
                Unfinished works stay saved on this device across navigation and refreshes.
              </p>
            </div>
            <span className="text-xs font-mono-tabular font-bold text-[#00D4FF]">
              {String(drafts.length).padStart(2, '0')} saved
            </span>
          </div>

          {drafts.length === 0 ? (
            <div className="border-2 border-white/20 bg-[#1A1A1A] px-6 py-9 flex flex-col items-center text-center">
              <MorphingEyeCreature size={76} className="mb-3" />
              <p className="text-sm font-bold text-[#FFFFFF]">Your drafts folio is empty</p>
              <p className="text-xs text-[#A0A0A0] mt-1 max-w-sm">
                Save unfinished work while composing to revisit, refine, and publish later.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {drafts.map((draft, index) => {
                const isEditingThis = activeEditor.editingDraftId === draft.id;
                const confirmingDelete = confirmDeleteDraftId === draft.id;
                return (
                  <div
                    key={draft.id}
                    className={`p-4 border-2 bg-[#1A1A1A] flex flex-col justify-between gap-4 ${
                      isEditingThis ? 'border-[#00D4FF]' : 'border-white/20'
                    }`}
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="w-16 h-16 bg-[#000000] border border-white/20 shrink-0 overflow-hidden">
                        <ArtworkImage
                          src={draft.imageUrl}
                          alt={draft.title || 'Draft plate'}
                          titleFallback={draft.title || 'Draft'}
                        />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[11px] font-mono-tabular text-[#FFE600]">
                          {String(index + 1).padStart(2, '0')} · {draft.category}
                        </span>
                        <p className="font-display text-base font-bold text-[#FFFFFF] truncate mt-0.5">
                          {draft.title || 'Untitled Draft'}
                        </p>
                        <p className="text-xs text-[#A0A0A0] mt-0.5">
                          Edited{' '}
                          {new Date(draft.updatedAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/15">
                      {confirmingDelete ? (
                        <>
                          <span className="text-xs text-[#FF3DAE] mr-auto">Delete draft?</span>
                          <button
                            type="button"
                            onClick={() => {
                              deleteDraft(draft.id);
                              setConfirmDeleteDraftId(null);
                            }}
                            className="min-h-[38px] px-3 bg-[#FF3DAE] text-[#000000] text-xs font-bold"
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteDraftId(null)}
                            className="min-h-[38px] px-2.5 text-xs text-[#A0A0A0]"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => loadDraftIntoEditor(draft.id)}
                            className="min-h-[38px] px-3 bg-[#2A2A2A] border border-white/20 text-[#FFFFFF] text-xs font-bold hover:border-[#00D4FF]"
                          >
                            {isEditingThis ? 'In Studio' : 'Resume'}
                          </button>
                          <button
                            type="button"
                            disabled={isPublishing}
                            onClick={() => void handlePublishDraftDirect(draft.id)}
                            className="min-h-[38px] px-3 bg-[#00FF99] text-[#000000] text-xs font-bold hover:bg-[#FFE600] disabled:opacity-60"
                          >
                            Publish
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteDraftId(draft.id)}
                            aria-label={`Delete draft ${draft.title || 'Untitled'}`}
                            className="min-w-[38px] min-h-[38px] flex items-center justify-center text-[#A0A0A0] hover:text-[#FF3DAE]"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
