import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, Bookmark, Heart, RefreshCw, Search, X } from 'lucide-react';
import { CREATIVE_CATEGORIES, CreativeCategory, Project } from '../types/unseen';
import { useUnseen } from '../context/UnseenContext';
import { ArtworkImage } from './ArtworkImage';
import { CreatorAvatar } from './CreatorAvatar';
import {
  KineticRibbonDivider,
  MorphingEyeCreature,
  OrbitingSphereCluster,
  StudioPlaygroundSticker,
} from './UnseenPlaygroundGraphics';

const PLATE_COMPOSITIONS = [
  {
    span: 'md:col-span-7',
    aspect: 'aspect-[16/10]',
    frame: 'bg-[#1A1A1A] border-2 border-[#FFFFFF] p-2.5 sm:p-3 relative',
    offsetColor: 'bg-[#00D4FF]',
    indexColor: 'text-[#00D4FF]',
    checkerEdge: true,
  },
  {
    span: 'md:col-span-5',
    aspect: 'aspect-[3/4]',
    frame: 'bg-[#1A1A1A] border-2 border-[#FFFFFF] relative',
    offsetColor: 'bg-[#9933FF]',
    indexColor: 'text-[#FF3DAE]',
    checkerEdge: false,
  },
  {
    span: 'md:col-span-4 md:mt-6',
    aspect: 'aspect-square',
    frame: 'bg-[#1A1A1A] border-2 border-[#FFFFFF] p-2 relative',
    offsetColor: 'bg-[#FFE600]',
    indexColor: 'text-[#FFE600]',
    checkerEdge: false,
  },
  {
    span: 'md:col-span-8',
    aspect: 'aspect-[16/9]',
    frame: 'bg-[#1A1A1A] border-2 border-[#FFFFFF] relative',
    offsetColor: 'bg-[#00FF99]',
    indexColor: 'text-[#00FF99]',
    checkerEdge: true,
  },
  {
    span: 'md:col-span-6',
    aspect: 'aspect-[4/3]',
    frame: 'bg-[#1A1A1A] border-2 border-[#FFFFFF] p-2.5 relative',
    offsetColor: 'bg-[#FF3DAE]',
    indexColor: 'text-[#00D4FF]',
    checkerEdge: false,
  },
  {
    span: 'md:col-span-6 md:mt-6',
    aspect: 'aspect-[5/4]',
    frame: 'bg-[#1A1A1A] border-2 border-[#FFFFFF] relative',
    offsetColor: 'bg-[#9933FF]',
    indexColor: 'text-[#FFE600]',
    checkerEdge: false,
  },
] as const;

export const ExploreView: React.FC = () => {
  const {
    orderedExploreProjects,
    getCreatorById,
    rotateExploreFeed,
    toggleLike,
    toggleSave,
    isLiked,
    isSaved,
    setInspectedProjectId,
    setInspectedCreatorId,
    setActiveTab,
    showToast,
  } = useUnseen();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | CreativeCategory>('All');
  const [isRotating, setIsRotating] = useState(false);

  const filteredProjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return orderedExploreProjects.filter((project) => {
      if (selectedCategory !== 'All' && project.category !== selectedCategory) {
        return false;
      }
      if (!q) return true;
      const creator = getCreatorById(project.creatorId);
      const haystack = [
        project.title,
        project.description,
        project.category,
        creator?.username ?? '',
        creator?.displayName ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [orderedExploreProjects, selectedCategory, searchQuery, getCreatorById]);

  const handleRotate = () => {
    setIsRotating(true);
    rotateExploreFeed();
    showToast('Exhibition rotated to surface emerging creators');
    window.setTimeout(() => setIsRotating(false), 320);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
  };

  const featuredProject = filteredProjects[0];
  const galleryProjects = filteredProjects.slice(1);

  return (
    <div className="bg-[#000000] bg-playground-grid min-h-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24">
        {/* Expressive Digital Playground Masthead */}
        <section className="pb-6 border-b border-white/15">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-8">
              <div className="flex items-center gap-3 text-xs font-medium text-[#A0A0A0] mb-3">
                <span className="font-mono-tabular font-bold text-[#00FF99]">LIVE EXHIBITION</span>
                <span aria-hidden="true">/</span>
                <span className="font-mono-tabular text-[#FFFFFF]">
                  {String(filteredProjects.length).padStart(2, '0')} WORKS IN ROTATION
                </span>
              </div>

              <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.85rem] font-extrabold tracking-[-0.035em] text-[#FFFFFF] leading-[0.94] [text-wrap:balance]">
                Every Creator{' '}
                <span className="inline-block text-[#FFE600] transform -skew-x-6">
                  Deserves
                </span>{' '}
                to Be{' '}
                <span className="inline-block bg-[#9933FF] text-[#FFFFFF] px-2.5 py-0.5 border-2 border-[#FFFFFF]">
                  Seen.
                </span>
              </h1>
            </div>

            {/* Animated 2D+3D Geometric Composition + Rotate Trigger */}
            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-4">
              <div className="w-48 sm:w-52 lg:w-56 hidden sm:block">
                <OrbitingSphereCluster className="w-full h-auto" />
              </div>

              <motion.button
                type="button"
                onClick={handleRotate}
                whileTap={{ scale: 0.96 }}
                className="inline-flex items-center justify-center gap-2.5 min-h-[48px] px-5 py-2.5 text-sm font-bold bg-[#00FF99] text-[#000000] border-2 border-[#FFFFFF] shadow-[4px_4px_0_0_#9933FF] hover:bg-[#FFE600] hover:shadow-[4px_4px_0_0_#FF3DAE] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D4FF]"
              >
                <RefreshCw
                  className={`w-4 h-4 transition-transform duration-300 ${
                    isRotating ? 'rotate-180' : ''
                  }`}
                  strokeWidth={2.2}
                />
                <span>Rotate Exhibition</span>
              </motion.button>
            </div>
          </div>

          {/* Search & Discipline Filters */}
          <div className="mt-6 flex flex-col lg:flex-row lg:items-center gap-3.5">
            <div className="relative w-full lg:w-72 shrink-0">
              <Search
                className="w-4 h-4 text-[#A0A0A0] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                strokeWidth={1.9}
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search works, creators..."
                aria-label="Search creative projects"
                className="w-full min-h-[44px] pl-10 pr-10 py-2 bg-[#1A1A1A] border border-white/25 text-sm text-[#FFFFFF] placeholder:text-[#A0A0A0] focus:outline-none focus:border-[#00D4FF]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-1 top-1/2 -translate-y-1/2 min-w-[40px] min-h-[40px] flex items-center justify-center text-[#A0A0A0] hover:text-[#FFFFFF]"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div
              data-no-swipe="true"
              className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 -mx-4 px-4 sm:mx-0 sm:px-0"
              role="tablist"
              aria-label="Filter projects by discipline"
            >
              {(['All', ...CREATIVE_CATEGORIES] as const).map((cat) => {
                const active = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setSelectedCategory(cat)}
                    className={`min-h-[40px] px-3.5 py-1.5 text-xs font-bold whitespace-nowrap shrink-0 border transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D4FF] ${
                      active
                        ? 'bg-[#FFE600] border-[#FFE600] text-[#000000]'
                        : 'bg-[#1A1A1A] border-white/20 text-[#A0A0A0] hover:border-[#FFFFFF] hover:text-[#FFFFFF]'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Empty State with Animated Mascot */}
        {filteredProjects.length === 0 ? (
          <div className="mt-8 py-14 px-6 text-center border-2 border-[#FFFFFF] bg-[#1A1A1A] shadow-[6px_6px_0_0_#9933FF]">
            <div className="flex justify-center mb-4">
              <MorphingEyeCreature size={96} />
            </div>
            <p className="font-display text-2xl font-extrabold text-[#FFFFFF]">
              No works match this filter yet
            </p>
            <p className="text-sm text-[#A0A0A0] mt-2 max-w-md mx-auto">
              Clear your search or switch disciplines to explore fresh creations across the playground.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-5 inline-flex items-center justify-center min-h-[44px] px-5 py-2 text-sm font-bold bg-[#00D4FF] text-[#000000] border border-[#FFFFFF] hover:bg-[#00FF99] transition-colors"
            >
              Show All Works
            </button>
          </div>
        ) : (
          <>
            {/* Featured Exhibition Stage */}
            {featuredProject && (
              <FeaturedExhibitionStage
                project={featuredProject}
                creator={getCreatorById(featuredProject.creatorId)}
                liked={isLiked(featuredProject.id)}
                saved={isSaved(featuredProject.id)}
                onOpenProject={() => setInspectedProjectId(featuredProject.id)}
                onOpenCreator={() => setInspectedCreatorId(featuredProject.creatorId)}
                onToggleLike={() => toggleLike(featuredProject.id)}
                onToggleSave={() => toggleSave(featuredProject.id)}
              />
            )}

            {/* Kinetic Checkerboard & Typography Ribbon Divider */}
            {galleryProjects.length > 0 && (
              <KineticRibbonDivider label="ROTATING EXHIBITION PLATES" accent="cyan" />
            )}

            {/* Asymmetric Exhibition Plates */}
            {galleryProjects.length > 0 && (
              <section aria-label="Exhibition plates">
                <div className="flex items-center justify-between gap-4 mb-7">
                  <div className="flex items-center gap-3">
                    <span className="font-mono-tabular text-xs font-bold text-[#00D4FF]">
                      02—{String(galleryProjects.length + 1).padStart(2, '0')}
                    </span>
                    <span className="text-xs font-medium text-[#A0A0A0]">
                      Curated Rotation · Unranked Discovery
                    </span>
                  </div>
                  <StudioPlaygroundSticker className="w-20 h-11 hidden sm:block" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-x-7 gap-y-12 items-start">
                  {galleryProjects.map((project, idx) => {
                    const composition = PLATE_COMPOSITIONS[idx % PLATE_COMPOSITIONS.length];
                    return (
                      <React.Fragment key={project.id}>
                        <ExhibitionPlate
                          indexNumber={idx + 2}
                          composition={composition}
                          project={project}
                          creator={getCreatorById(project.creatorId)}
                          liked={isLiked(project.id)}
                          saved={isSaved(project.id)}
                          onOpenProject={() => setInspectedProjectId(project.id)}
                          onOpenCreator={() => setInspectedCreatorId(project.creatorId)}
                          onToggleLike={() => toggleLike(project.id)}
                          onToggleSave={() => toggleSave(project.id)}
                        />

                        {/* Occasional Playful Animated Interlude between gallery plates */}
                        {idx === 3 && galleryProjects.length > 4 && (
                          <div className="md:col-span-12 my-2 border-2 border-[#FFFFFF] bg-[#1A1A1A] p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-[6px_6px_0_0_#FF3DAE]">
                            <div className="flex items-center gap-4">
                              <MorphingEyeCreature size={72} className="shrink-0" />
                              <div>
                                <p className="font-mono-tabular text-xs font-bold text-[#00FF99]">
                                  OPEN STUDIO CALL
                                </p>
                                <h3 className="font-display text-xl sm:text-2xl font-extrabold text-[#FFFFFF] leading-tight mt-0.5">
                                  Got unfinished experiments or fresh work?
                                </h3>
                                <p className="text-xs text-[#A0A0A0] mt-1">
                                  Every published plate enters the fair rotation alongside emerging voices.
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setActiveTab('publish')}
                              className="min-h-[44px] px-5 bg-[#FFE600] text-[#000000] border-2 border-[#FFFFFF] text-xs font-bold hover:bg-[#00D4FF] transition-colors whitespace-nowrap shrink-0"
                            >
                              Open Publish Studio
                            </button>
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}

        {/* Archival Footnote */}
        <footer className="mt-16 pt-6 border-t border-white/15 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-[#A0A0A0]">
          <p>
            UNSEEN rotates exhibition order fairly so emerging work is never buried by popularity.
          </p>
          <p>
            Includes demonstration exhibition pieces alongside works published on this device.
          </p>
        </footer>
      </div>
    </div>
  );
};

interface FeaturedStageProps {
  project: Project;
  creator: ReturnType<ReturnType<typeof useUnseen>['getCreatorById']>;
  liked: boolean;
  saved: boolean;
  onOpenProject: () => void;
  onOpenCreator: () => void;
  onToggleLike: () => void;
  onToggleSave: () => void;
}

const FeaturedExhibitionStage: React.FC<FeaturedStageProps> = ({
  project,
  creator,
  liked,
  saved,
  onOpenProject,
  onOpenCreator,
  onToggleLike,
  onToggleSave,
}) => (
  <motion.section
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    className="mt-8 bg-[#1A1A1A] text-[#FFFFFF] border-2 border-[#FFFFFF] p-5 sm:p-8 lg:p-10 relative shadow-[8px_8px_0_0_#9933FF]"
    aria-label="Featured exhibition work"
  >
    {/* Crisp Checkerboard Corner Strip */}
    <div
      aria-hidden="true"
      className="hidden sm:block absolute top-0 right-10 w-24 h-3 bg-checker-yellow border-x border-b border-[#FFFFFF]"
    />

    <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 lg:gap-10 items-stretch">
      {/* Overlapping Framed Artwork */}
      <div className="lg:col-span-7 relative">
        <div
          aria-hidden="true"
          className="hidden sm:block absolute top-3 left-3 right-0 bottom-0 border-2 border-[#00D4FF] pointer-events-none"
        />
        <button
          type="button"
          onClick={onOpenProject}
          className="relative block w-full h-full min-h-[260px] sm:min-h-[380px] aspect-[16/11] lg:aspect-auto overflow-hidden border-2 border-[#FFFFFF] bg-[#000000] text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D4FF]"
          aria-label={`Inspect featured work ${project.title}`}
        >
          <ArtworkImage
            src={project.imageUrl}
            alt={project.title}
            titleFallback={project.title}
            className="transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        </button>
      </div>

      {/* Curatorial Editorial Column */}
      <div className="lg:col-span-5 flex flex-col justify-between py-1">
        <div>
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/20">
            <div className="flex items-center gap-2.5 text-xs">
              <span className="font-mono-tabular font-bold text-[#FFE600]">01.</span>
              <span className="text-[#00FF99] font-bold">SPOTLIGHT WORK</span>
              <span aria-hidden="true" className="text-white/40">
                /
              </span>
              <span className="text-[#FFFFFF]">{project.category}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenProject}
            className="block w-full text-left mt-5 group focus-visible:outline-none"
          >
            <h2 className="font-display text-2xl sm:text-3xl lg:text-[2.2rem] font-extrabold tracking-[-0.025em] text-[#FFFFFF] leading-[1.04] group-hover:text-[#00D4FF] transition-colors [text-wrap:balance]">
              {project.title}
            </h2>
          </button>

          <p className="mt-4 text-sm sm:text-[15px] leading-relaxed text-[#A0A0A0] line-clamp-4">
            {project.description}
          </p>
        </div>

        <div className="mt-6 pt-5 border-t border-white/20 flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={onOpenCreator}
            className="inline-flex items-center gap-3 text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D4FF]"
          >
            <CreatorAvatar
              src={creator?.avatarUrl}
              name={creator?.displayName ?? creator?.username ?? 'Creator'}
              size="md"
              className="border-[#00D4FF]"
            />
            <div>
              <p className="text-sm font-bold text-[#FFFFFF] group-hover:text-[#00D4FF] transition-colors">
                {creator?.displayName ?? 'Emerging Creator'}
              </p>
              <p className="text-xs text-[#A0A0A0]">
                @{creator?.username ?? 'creator'}
                {creator?.location ? ` · ${creator.location}` : ''}
              </p>
            </div>
          </button>

          <div className="flex items-center gap-1.5">
            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={onToggleLike}
              aria-label={liked ? `Unlike ${project.title}` : `Like ${project.title}`}
              aria-pressed={liked}
              className={`min-w-[44px] min-h-[44px] px-2.5 flex items-center justify-center gap-1.5 border transition-colors ${
                liked
                  ? 'border-[#FF3DAE] bg-[#FF3DAE] text-[#000000]'
                  : 'border-white/30 bg-[#2A2A2A] text-[#FFFFFF] hover:border-[#FF3DAE]'
              }`}
            >
              <Heart className="w-4 h-4" strokeWidth={2} fill={liked ? 'currentColor' : 'none'} />
              <span className="text-xs font-mono-tabular font-bold">{project.likesCount}</span>
            </motion.button>

            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={onToggleSave}
              aria-label={saved ? `Remove ${project.title} from saved` : `Save ${project.title}`}
              aria-pressed={saved}
              className={`min-w-[44px] min-h-[44px] flex items-center justify-center border transition-colors ${
                saved
                  ? 'border-[#FFE600] bg-[#FFE600] text-[#000000]'
                  : 'border-white/30 bg-[#2A2A2A] text-[#FFFFFF] hover:border-[#FFE600]'
              }`}
            >
              <Bookmark className="w-4 h-4" strokeWidth={2} fill={saved ? 'currentColor' : 'none'} />
            </motion.button>

            <button
              type="button"
              onClick={onOpenProject}
              aria-label={`Open ${project.title}`}
              className="min-w-[44px] min-h-[44px] px-3 flex items-center justify-center border border-[#FFFFFF] bg-[#00D4FF] text-[#000000] hover:bg-[#00FF99] transition-colors"
            >
              <ArrowUpRight className="w-4 h-4" strokeWidth={2.2} />
            </button>
          </div>
        </div>
      </div>
    </div>
  </motion.section>
);

interface ExhibitionPlateProps {
  indexNumber: number;
  composition: (typeof PLATE_COMPOSITIONS)[number];
  project: Project;
  creator: ReturnType<ReturnType<typeof useUnseen>['getCreatorById']>;
  liked: boolean;
  saved: boolean;
  onOpenProject: () => void;
  onOpenCreator: () => void;
  onToggleLike: () => void;
  onToggleSave: () => void;
}

const ExhibitionPlate: React.FC<ExhibitionPlateProps> = ({
  indexNumber,
  composition,
  project,
  creator,
  liked,
  saved,
  onOpenProject,
  onOpenCreator,
  onToggleLike,
  onToggleSave,
}) => {
  const plateNumber = String(indexNumber).padStart(2, '0');

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      className={`${composition.span} group`}
    >
      {/* Top Plate Annotation */}
      <div className="flex items-center justify-between text-xs pb-2 border-b border-white/20 mb-3">
        <span className={`font-mono-tabular font-bold ${composition.indexColor}`}>
          {plateNumber}.
        </span>
        <span className="text-[#A0A0A0] truncate">{project.category}</span>
      </div>

      {/* Playful Geometric Cutout Framed Artwork */}
      <div className="relative">
        <div
          aria-hidden="true"
          className={`hidden sm:block absolute inset-0 translate-x-2 translate-y-2 ${composition.offsetColor} pointer-events-none transition-transform duration-200 group-hover:translate-x-2.5 group-hover:translate-y-2.5`}
        />
        <div className={composition.frame}>
          {composition.checkerEdge && (
            <span
              aria-hidden="true"
              className="hidden sm:block absolute -top-2.5 -right-2.5 w-6 h-6 bg-checker-strip border border-[#FFFFFF] pointer-events-none"
            />
          )}
          <button
            type="button"
            onClick={onOpenProject}
            className={`block w-full overflow-hidden bg-[#000000] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D4FF] ${composition.aspect}`}
            aria-label={`View project ${project.title}`}
          >
            <ArtworkImage
              src={project.imageUrl}
              alt={project.title}
              titleFallback={project.title}
              className="transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            />
          </button>
        </div>
      </div>

      {/* Editorial Caption & Expressive Reaction Controls */}
      <div className="pt-4 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={onOpenProject}
            className="text-left block w-full focus-visible:outline-none focus-visible:underline"
          >
            <h3 className="font-display text-xl font-bold tracking-[-0.02em] text-[#FFFFFF] leading-snug line-clamp-2 group-hover:text-[#00D4FF] transition-colors">
              {project.title}
            </h3>
          </button>

          <button
            type="button"
            onClick={onOpenCreator}
            className="mt-1.5 inline-flex items-center gap-2 text-xs text-[#A0A0A0] hover:text-[#FFFFFF] transition-colors min-w-0 focus-visible:outline-none focus-visible:underline"
          >
            <CreatorAvatar
              src={creator?.avatarUrl}
              name={creator?.displayName ?? creator?.username ?? 'Creator'}
              size="xs"
            />
            <span className="font-medium text-[#FFFFFF] truncate">
              {creator?.displayName ?? `@${creator?.username ?? 'creator'}`}
            </span>
          </button>
        </div>

        <div className="flex items-center -mr-2 shrink-0">
          <motion.button
            type="button"
            whileTap={{ scale: 0.85 }}
            onClick={onToggleLike}
            aria-label={liked ? `Unlike ${project.title}` : `Like ${project.title}`}
            aria-pressed={liked}
            className={`min-w-[44px] min-h-[44px] px-1.5 flex items-center justify-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D4FF] ${
              liked ? 'text-[#FF3DAE]' : 'text-[#A0A0A0] hover:text-[#FFFFFF]'
            }`}
          >
            <Heart
              className="w-[18px] h-[18px]"
              strokeWidth={1.9}
              fill={liked ? 'currentColor' : 'none'}
            />
            <span className="text-xs font-mono-tabular font-bold">{project.likesCount}</span>
          </motion.button>

          <motion.button
            type="button"
            whileTap={{ scale: 0.85 }}
            onClick={onToggleSave}
            aria-label={saved ? `Remove ${project.title} from saved` : `Save ${project.title}`}
            aria-pressed={saved}
            className={`min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D4FF] ${
              saved ? 'text-[#FFE600]' : 'text-[#A0A0A0] hover:text-[#FFFFFF]'
            }`}
          >
            <Bookmark
              className="w-[18px] h-[18px]"
              strokeWidth={1.9}
              fill={saved ? 'currentColor' : 'none'}
            />
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
};
