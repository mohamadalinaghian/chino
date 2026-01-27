'use client';

import { ReactNode } from 'react';
import { THEME_COLORS } from '@/libs/constants';

interface ReportFormSectionProps {
  title: string;
  icon: string;
  description?: string;
  children: ReactNode;
}

/**
 * ReportFormSection
 * A container component for grouping related form fields
 */
export function ReportFormSection({
  title,
  icon,
  description,
  children,
}: ReportFormSectionProps) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: THEME_COLORS.bgSecondary }}
    >
      {/* Section Header */}
      <div
        className="px-5 py-4 border-b"
        style={{ borderColor: THEME_COLORS.border }}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <div>
            <h3 className="text-lg font-bold" style={{ color: THEME_COLORS.text }}>
              {title}
            </h3>
            {description && (
              <p className="text-sm" style={{ color: THEME_COLORS.subtext }}>
                {description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Section Content */}
      <div className="p-5">
        {children}
      </div>
    </div>
  );
}
