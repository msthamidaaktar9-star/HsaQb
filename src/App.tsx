/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { ToastProvider, useToast } from './components/Toast';
import { ConfirmDialog } from './components/ConfirmDialog';
import { BottomNav, TabKey } from './components/BottomNav';
import { CreateScreen } from './screens/CreateScreen';
import { CollectionScreen } from './screens/CollectionScreen';
import { ProfileScreen } from './screens/ProfileScreen';

interface NavEntry {
  tab: TabKey;
  screenId?: string;
  data?: unknown;
}

interface DialogState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
}

const MainApp: React.FC = () => {
  const { showToast } = useToast();

  // Navigation stack state without external router library
  const [navStack, setNavStack] = useState<NavEntry[]>([{ tab: 'create' }]);
  
  // Confirmation dialog state
  const [dialogState, setDialogState] = useState<DialogState>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const lastBackPressRef = useRef<number>(0);

  const currentEntry = navStack[navStack.length - 1] || { tab: 'create' };
  const activeTab = currentEntry.tab;
  const canGoBack = navStack.length > 1;

  // Change tab
  const handleTabChange = useCallback((newTab: TabKey) => {
    setNavStack((prev) => {
      // If tapping same tab and already at root of tab, do nothing
      const current = prev[prev.length - 1];
      if (current.tab === newTab && !current.screenId) {
        return prev;
      }
      return [...prev, { tab: newTab }];
    });
  }, []);

  // Pop stack or handle exit
  const handleBack = useCallback(() => {
    // If confirmation dialog is open, close dialog first
    if (dialogState.isOpen) {
      setDialogState((prev) => ({ ...prev, isOpen: false }));
      return;
    }

    // If there is history to go back to in the stack
    if (navStack.length > 1) {
      setNavStack((prev) => prev.slice(0, -1));
      return;
    }

    // If on the root screen: handle app exit for Android / Mobile
    const now = Date.now();
    if (now - lastBackPressRef.current < 2000) {
      // Double tap to exit or direct exit
      if (Capacitor.isNativePlatform()) {
        CapApp.exitApp();
      } else {
        showToast('অ্যাপ থেকে বের হতে ব্রাউজার ট্যাব বন্ধ করুন', 'info');
      }
    } else {
      lastBackPressRef.current = now;
      showToast('অ্যাপ থেকে বের হতে আবার ব্যাক চাপুন', 'info');
    }
  }, [dialogState.isOpen, navStack.length, showToast]);

  // Capacitor Back Button integration for Android
  useEffect(() => {
    let listenerHandle: { remove: () => void } | null = null;

    const setupListener = async () => {
      try {
        const handle = await CapApp.addListener('backButton', () => {
          handleBack();
        });
        listenerHandle = handle;
      } catch {
        // Capacitor App plugin listener is only active when supported
      }
    };

    setupListener();

    // Also support keyboard ESC or browser back behavior if desired
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      if (listenerHandle) {
        listenerHandle.remove();
      }
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleBack]);

  // Request Confirmation helper for children
  const handleRequestConfirm = useCallback(
    (
      title: string,
      message: string,
      onConfirm: () => void,
      options?: {
        confirmText?: string;
        cancelText?: string;
        isDestructive?: boolean;
      }
    ) => {
      setDialogState({
        isOpen: true,
        title,
        message,
        confirmText: options?.confirmText,
        cancelText: options?.cancelText,
        isDestructive: options?.isDestructive,
        onConfirm: () => {
          setDialogState((prev) => ({ ...prev, isOpen: false }));
          onConfirm();
        },
      });
    },
    []
  );

  return (
    <div className="min-h-screen bg-[#E5E9F0] flex justify-center items-stretch antialiased font-sans">
      {/* Mobile-first viewport container (width: 390px) */}
      <div className="w-full max-w-[390px] min-h-screen bg-[#F2F4F8] shadow-2xl relative flex flex-col pb-16">
        {/* Tab View Screens */}
        <div className="flex-1 flex flex-col">
          {activeTab === 'create' && (
            <CreateScreen
              canGoBack={canGoBack}
              onBack={handleBack}
              onRequestConfirm={handleRequestConfirm}
            />
          )}

          {activeTab === 'collection' && (
            <CollectionScreen
              canGoBack={canGoBack}
              onBack={handleBack}
              onRequestConfirm={handleRequestConfirm}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileScreen
              canGoBack={canGoBack}
              onBack={handleBack}
              onRequestConfirm={handleRequestConfirm}
            />
          )}
        </div>

        {/* Fixed Bottom Navigation */}
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />

        {/* Confirmation Dialog */}
        <ConfirmDialog
          isOpen={dialogState.isOpen}
          title={dialogState.title}
          message={dialogState.message}
          confirmText={dialogState.confirmText}
          cancelText={dialogState.cancelText}
          isDestructive={dialogState.isDestructive}
          onConfirm={dialogState.onConfirm}
          onCancel={() => setDialogState((prev) => ({ ...prev, isOpen: false }))}
        />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <MainApp />
    </ToastProvider>
  );
}
