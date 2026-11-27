import React from 'react';
import { motion } from 'motion/react';
import { PrimaryTab } from '../types/unseen';
import { useUnseen } from '../context/UnseenContext';

const NavApertureIcon: React.FC<{ active: boolean }> = ({ active }) => (
  <motion.svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    animate={active ? { rotate: [0, -6, 0], scale: 1.08 } : { rotate: 0, scale: 1 }}
    transition={{ duration: 0.25 }}
  >
    <rect
      x="3.5"
      y="3.5"
      width="17"
      height="17"
      stroke="currentColor"
      strokeWidth={active ? 2.2 : 1.6}
    />
    <circle
      cx="12"
      cy="12"
      r="3.5"
      fill={active ? '#00D4FF' : 'none'}
      stroke={active ? '#00D4FF' : 'currentColor'}
      strokeWidth={active ? 2 : 1.6}
    />
  </motion.svg>
);

const NavSalonIcon: React.FC<{ active: boolean }> = ({ active }) => (
  <motion.svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    animate={active ? { y: -1, scale: 1.08 } : { y: 0, scale: 1 }}
    transition={{ duration: 0.2 }}
  >
    <path
      d="M4 5.5H20V16.5H9L5 20V16.5H4V5.5Z"
      stroke="currentColor"
      strokeWidth={active ? 2.2 : 1.6}
      strokeLinejoin="miter"
    />
    <rect
      x="10.2"
      y="9.2"
      width="3.6"
      height="3.6"
      fill={active ? '#9933FF' : 'currentColor'}
    />
  </motion.svg>
);

const NavStudioIcon: React.FC<{ active: boolean }> = ({ active }) => (
  <motion.svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    animate={active ? { rotate: 90, scale: 1.08 } : { rotate: 0, scale: 1 }}
    transition={{ duration: 0.25 }}
  >
    <path
      d="M4 9V4H9M15 4H20V9M20 15V20H15M9 20H4V15"
      stroke="currentColor"
      strokeWidth={active ? 2.2 : 1.6}
    />
    <path
      d="M12 7.5V16.5M7.5 12H16.5"
      stroke={active ? '#00FF99' : 'currentColor'}
      strokeWidth={active ? 2.4 : 1.6}
    />
  </motion.svg>
);

const NavMonographIcon: React.FC<{ active: boolean }> = ({ active }) => (
  <motion.svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    animate={active ? { scale: 1.08 } : { scale: 1 }}
    transition={{ duration: 0.2 }}
  >
    <circle
      cx="12"
      cy="8.5"
      r="3.4"
      fill={active ? '#FFE600' : 'none'}
      stroke={active ? '#FFE600' : 'currentColor'}
      strokeWidth={active ? 2 : 1.6}
    />
    <path
      d="M5.5 20C5.5 16.5 8.4 14 12 14C15.6 14 18.5 16.5 18.5 20"
      stroke="currentColor"
      strokeWidth={active ? 2.2 : 1.6}
    />
  </motion.svg>
);

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, drafts } = useUnseen();

  const items: {
    id: PrimaryTab;
    label: string;
    activeBarColor: string;
    icon: (active: boolean) => React.ReactNode;
    badgeCount?: number;
  }[] = [
    {
      id: 'explore',
      label: 'Explore',
      activeBarColor: 'bg-[#00D4FF]',
      icon: (active) => <NavApertureIcon active={active} />,
    },
    {
      id: 'community',
      label: 'Community',
      activeBarColor: 'bg-[#9933FF]',
      icon: (active) => <NavSalonIcon active={active} />,
    },
    {
      id: 'publish',
      label: 'Publish',
      activeBarColor: 'bg-[#00FF99]',
      icon: (active) => <NavStudioIcon active={active} />,
      badgeCount: drafts.length > 0 ? drafts.length : undefined,
    },
    {
      id: 'profile',
      label: 'Profile',
      activeBarColor: 'bg-[#FFE600]',
      icon: (active) => <NavMonographIcon active={active} />,
    },
  ];

  return (
    <nav
      aria-label="Primary views"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#000000]/95 backdrop-blur-md border-t border-white/15 pb-safe"
    >
      <div className="max-w-lg mx-auto grid grid-cols-4 h-14">
        {items.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center min-h-[44px] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D4FF] focus-visible:ring-inset ${
                isActive ? 'text-[#FFFFFF]' : 'text-[#A0A0A0] hover:text-[#FFFFFF]'
              }`}
            >
              {isActive && (
                <span
                  aria-hidden="true"
                  className={`absolute top-0 left-1/2 -translate-x-1/2 w-10 h-[3px] ${item.activeBarColor}`}
                />
              )}
              <span className="relative flex items-center justify-center">
                {item.icon(isActive)}
                {item.badgeCount !== undefined && (
                  <span
                    className="absolute -top-1 -right-2.5 min-w-[15px] h-[15px] px-1 bg-[#FF3DAE] text-[#000000] text-[9px] font-mono-tabular font-bold flex items-center justify-center"
                    aria-label={`${item.badgeCount} saved drafts`}
                  >
                    {item.badgeCount}
                  </span>
                )}
              </span>
              <span
                className={`text-[11px] leading-none mt-1 tracking-tight whitespace-nowrap shrink-0 ${
                  isActive ? 'font-bold text-[#FFFFFF]' : 'font-medium'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
