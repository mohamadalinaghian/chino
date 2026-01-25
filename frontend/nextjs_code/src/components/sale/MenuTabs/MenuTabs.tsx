'use client';

import { THEME_COLORS, UI_TEXT } from '@/libs/constants';

type TabType = 'BAR' | 'FOOD';

interface MenuTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function MenuTabs({ activeTab, onTabChange }: MenuTabsProps) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => onTabChange('FOOD')}
        className={`flex-1 py-2 px-4 rounded-lg font-bold transition-all ${
          activeTab === 'FOOD' ? 'scale-105' : ''
        }`}
        style={{
          backgroundColor:
            activeTab === 'FOOD'
              ? THEME_COLORS.accent
              : THEME_COLORS.surface,
          color:
            activeTab === 'FOOD'
              ? '#fff'
              : THEME_COLORS.subtext,
        }}
      >
        {UI_TEXT.TAB_FOOD}
      </button>
      <button
        onClick={() => onTabChange('BAR')}
        className={`flex-1 py-2 px-4 rounded-lg font-bold transition-all ${
          activeTab === 'BAR' ? 'scale-105' : ''
        }`}
        style={{
          backgroundColor:
            activeTab === 'BAR'
              ? THEME_COLORS.accent
              : THEME_COLORS.surface,
          color:
            activeTab === 'BAR'
              ? '#fff'
              : THEME_COLORS.subtext,
        }}
      >
        {UI_TEXT.TAB_DRINKS}
      </button>
    </div>
  );
}
