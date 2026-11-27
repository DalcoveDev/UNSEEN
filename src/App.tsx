/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { MotionConfig } from 'motion/react';
import { PRIMARY_TABS } from './types/unseen';
import { UnseenProvider, useUnseen } from './context/UnseenContext';
import { ExploreView } from './components/ExploreView';
import { CommunityView } from './components/CommunityView';
import { PublishView } from './components/PublishView';
import { ProfileView } from './components/ProfileView';
import { BottomNav } from './components/BottomNav';
import { ProjectDetailModal } from './components/ProjectDetailModal';
import { CreatorProfileSheet } from './components/CreatorProfileSheet';
import { AuthModal } from './components/AuthModal';
import { CreatorAvatar } from './components/CreatorAvatar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { UnseenWordmark } from './components/UnseenMark';

const UnseenShell: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    currentUser,
    openAuthModal,
    inspectedProjectId,
    inspectedCreatorId,
    authModalOpen,
    toast,
  } = useUnseen();

  const activeIndex = PRIMARY_TABS.indexOf(activeTab);

  // Horizontal swipe gesture state
  const [dragOffsetPx, setDragOffsetPx] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const touchStateRef = useRef<{
    startX: number;
    startY: number;
    startTime: number;
    axisLocked: 'none' | 'horizontal' | 'vertical';
    ignored: boolean;
  }>({
    startX: 0,
    startY: 0,
    startTime: 0,
    axisLocked: 'none',
    ignored: false,
  });

  const modalActive = Boolean(inspectedProjectId || inspectedCreatorId || authModalOpen);

  const shouldIgnoreTouchTarget = (target: EventTarget | null): boolean => {
    if (!(target instanceof HTMLElement)) return false;
    return Boolean(
      target.closest('[data-no-swipe="true"], input, textarea, select, [role="slider"]')
    );
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (modalActive || e.touches.length !== 1) return;
    const touch = e.touches[0];
    touchStateRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
      axisLocked: 'none',
      ignored: shouldIgnoreTouchTarget(e.target),
    };
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const state = touchStateRef.current;
    if (modalActive || state.ignored || e.touches.length !== 1) return;

    const touch = e.touches[0];
    const dx = touch.clientX - state.startX;
    const dy = touch.clientY - state.startY;

    if (state.axisLocked === 'none') {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      if (Math.abs(dx) > Math.abs(dy) * 1.35) {
        state.axisLocked = 'horizontal';
        setIsDragging(true);
      } else {
        state.axisLocked = 'vertical';
        return;
      }
    }

    if (state.axisLocked === 'horizontal') {
      const atStartEdge = activeIndex === 0 && dx > 0;
      const atEndEdge = activeIndex === PRIMARY_TABS.length - 1 && dx < 0;
      const dampened = atStartEdge || atEndEdge ? dx * 0.25 : dx;
      setDragOffsetPx(dampened);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const state = touchStateRef.current;
    if (state.axisLocked !== 'horizontal') {
      setDragOffsetPx(0);
      setIsDragging(false);
      return;
    }

    const touch = e.changedTouches[0];
    const dx = touch.clientX - state.startX;
    const elapsed = Math.max(1, Date.now() - state.startTime);
    const velocity = Math.abs(dx) / elapsed;

    const thresholdMet = Math.abs(dx) > 56 || (velocity > 0.35 && Math.abs(dx) > 24);

    if (thresholdMet) {
      if (dx < 0 && activeIndex < PRIMARY_TABS.length - 1) {
        setActiveTab(PRIMARY_TABS[activeIndex + 1]);
      } else if (dx > 0 && activeIndex > 0) {
        setActiveTab(PRIMARY_TABS[activeIndex - 1]);
      }
    }

    setDragOffsetPx(0);
    setIsDragging(false);
    touchStateRef.current.axisLocked = 'none';
  };

  return (
    <div className="h-dvh flex flex-col bg-[#000000] text-[#FFFFFF] overflow-hidden">
      {/* 3-Zone Top Navigation Bar */}
      <header className="sticky top-0 z-30 h-12 shrink-0 bg-[#000000]/92 backdrop-blur-md border-b border-white/15">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-8">
          {/* Zone 1: Custom Animated UNSEEN Wordmark */}
          <button
            type="button"
            onClick={() => setActiveTab('explore')}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D4FF]"
            aria-label="UNSEEN Home"
          >
            <UnseenWordmark compact />
          </button>

          {/* Zone 2: Clean Single-Line Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium" aria-label="Primary sections">
            {PRIMARY_TABS.map((tab) => {
              const label = tab.charAt(0).toUpperCase() + tab.slice(1);
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
                    isActive
                      ? 'border-[#00FF99] text-[#FFFFFF] font-semibold'
                      : 'border-transparent text-[#A0A0A0] hover:text-[#FFFFFF]'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Single Primary Action */}
          <div className="flex items-center shrink-0">
            {currentUser ? (
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className="inline-flex items-center gap-2 min-h-[40px] px-2 hover:bg-[#1A1A1A] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D4FF]"
                aria-label="Open your creator profile"
              >
                <CreatorAvatar
                  src={currentUser.avatarUrl}
                  name={currentUser.displayName || currentUser.username}
                  size="xs"
                />
                <span className="text-xs font-medium text-[#FFFFFF] max-w-[110px] truncate">
                  @{currentUser.username}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => openAuthModal('signup')}
                className="min-h-[36px] px-3.5 py-1.5 bg-[#FFE600] text-[#000000] border border-[#FFFFFF] text-xs font-bold hover:bg-[#00FF99] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D4FF]"
              >
                Join UNSEEN
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Horizontal Swipeable 4-View Stage */}
      <main
        className="flex-1 relative overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={() => {
          setDragOffsetPx(0);
          setIsDragging(false);
        }}
      >
        <div
          className="h-full flex w-[400%]"
          style={{
            transform: `translate3d(calc(-${(activeIndex * 100) / 4}% + ${dragOffsetPx}px), 0, 0)`,
            transition: isDragging ? 'none' : 'transform 220ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <section
            aria-label="Explore view"
            inert={activeTab !== 'explore'}
            className="w-1/4 h-full overflow-y-auto overscroll-y-contain"
          >
            <ExploreView />
          </section>

          <section
            aria-label="Community view"
            inert={activeTab !== 'community'}
            className="w-1/4 h-full overflow-y-auto overscroll-y-contain"
          >
            <CommunityView />
          </section>

          <section
            aria-label="Publish view"
            inert={activeTab !== 'publish'}
            className="w-1/4 h-full overflow-y-auto overscroll-y-contain"
          >
            <PublishView />
          </section>

          <section
            aria-label="Profile view"
            inert={activeTab !== 'profile'}
            className="w-1/4 h-full overflow-y-auto overscroll-y-contain"
          >
            <ProfileView />
          </section>
        </div>
      </main>

      {/* Non-Intrusive Feedback Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-18 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-[#1A1A1A] text-[#FFFFFF] text-xs font-semibold shadow-2xl max-w-[90vw] text-center whitespace-nowrap truncate border border-white/25 border-b-2 border-b-[#00FF99]"
        >
          {toast.message}
        </div>
      )}

      {/* Persistent Bottom Navigation Bar */}
      <BottomNav />

      {/* Modals & Sheets */}
      <ProjectDetailModal />
      <CreatorProfileSheet />
      <AuthModal />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <MotionConfig reducedMotion="user">
        <UnseenProvider>
          <UnseenShell />
        </UnseenProvider>
      </MotionConfig>
    </ErrorBoundary>
  );
}
