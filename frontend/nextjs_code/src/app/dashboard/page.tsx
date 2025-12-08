/**
 * Dashboard Page - Persian Version
 *
 * Protected page for authenticated users
 */

'use client';

import React, { useEffect } from 'react';
import { useUser, useIsAuthenticated, useAuthLoading } from '@/store/authStore';
import { UserProfile } from '@/components/auth/UserProfile';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const user = useUser();
  const isAuthenticated = useIsAuthenticated();
  const isLoading = useAuthLoading();
  const router = useRouter();

  // Debug logs
  useEffect(() => {
    console.log('🎯 Dashboard state:', {
      isAuthenticated,
      isLoading,
      hasUser: !!user,
      user: user?.mobile
    });
  }, [isAuthenticated, isLoading, user]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log('❌ Not authenticated, redirecting to login');
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-text">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  // Not authenticated (while redirecting)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-text">داشبورد</h1>
            <nav className="flex gap-4 items-center">
              <a
                href="/menu"
                className="text-text-light hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                منوی کافه
              </a>
              <LogoutButton />
            </nav>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8 bg-gradient-to-br from-primary-light/20 to-primary/10 rounded-2xl p-6 border border-primary-light">
          <h2 className="text-3xl font-bold text-text mb-2">
            خوش آمدید! 👋
          </h2>
          <p className="text-text-light">
            شماره موبایل: <span className="font-semibold ltr inline-block">{user?.mobile}</span>
          </p>
          {user?.is_staff && (
            <div className="mt-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary text-text-inverted">
                👨‍💼 کارمند
              </span>
            </div>
          )}
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column - Stats & Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {/* Stat 1 */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md border border-border p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary-light rounded-lg">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-light">کل سفارشات</p>
                    <p className="text-2xl font-bold text-text">24</p>
                  </div>
                </div>
              </div>

              {/* Stat 2 */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md border border-border p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-light">تکمیل شده</p>
                    <p className="text-2xl font-bold text-text">18</p>
                  </div>
                </div>
              </div>

              {/* Stat 3 */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md border border-border p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-light">در انتظار</p>
                    <p className="text-2xl font-bold text-text">6</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md border border-border overflow-hidden">
              <div className="px-6 py-4 border-b border-border bg-gradient-to-l from-background-dark/30">
                <h3 className="text-lg font-bold text-text">
                  فعالیت‌های اخیر
                </h3>
              </div>
              <div className="p-6">
                <div className="text-center py-12">
                  <svg className="w-16 h-16 mx-auto text-text-light opacity-50 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-text-light">
                    هیچ فعالیت اخیری وجود ندارد
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md border border-border p-6">
              <h3 className="text-lg font-bold text-text mb-4">
                دسترسی سریع
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <a
                  href="/menu"
                  className="flex items-center gap-3 p-4 rounded-lg border-2 border-border hover:border-primary hover:bg-primary-light/10 transition-all group"
                >
                  <svg className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span className="font-medium text-text">مشاهده منو</span>
                </a>

                <button
                  disabled
                  className="flex items-center gap-3 p-4 rounded-lg border-2 border-border opacity-50 cursor-not-allowed"
                >
                  <svg className="w-6 h-6 text-text-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="font-medium text-text-light">پروفایل</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right column - User Profile */}
          <div className="lg:col-span-1">
            <UserProfile showLogout showBadges />
          </div>
        </div>
      </main>
    </div>
  );
}
