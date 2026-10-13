import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { updateManager } from '../services/updateManager';
import type { UpdateManagerConfig, UpdateState } from '../types/update';

interface UpdateContextValue extends UpdateState {
  applyNow: () => boolean;
  checkForUpdate: () => Promise<boolean>;
  dismissIndicator: () => void;
  markTaskComplete: () => boolean;
  registerBusyLock: (id: string, reason?: string) => () => void;
  showIndicator: boolean;
}

const UpdateContext = createContext<UpdateContextValue | undefined>(undefined);

interface UpdateProviderProps extends UpdateManagerConfig {
  children: React.ReactNode;
}

/**
 * UpdateProvider synchronizes updateManager state with React tree
 * and handles route navigation events to apply deferred updates at safe moments.
 */
export function UpdateProvider({
  children,
  checkIntervalMs,
  idleTimeoutMs,
  minReloadIntervalMs,
  showIndicator = true,
}: UpdateProviderProps) {
  const [state, setState] = useState<UpdateState>(() => updateManager.getState());
  const location = useLocation();
  const isFirstRender = useRef(true);

  // Initialize update manager on mount
  useEffect(() => {
    updateManager.init({
      checkIntervalMs,
      idleTimeoutMs,
      minReloadIntervalMs,
      showIndicator,
    });

    const unsubscribe = updateManager.subscribe((nextState) => {
      setState(nextState);
    });

    return () => {
      unsubscribe();
    };
  }, [checkIntervalMs, idleTimeoutMs, minReloadIntervalMs, showIndicator]);

  // Route navigation trigger:
  // When user navigates to another page, check if a pending update is waiting and safe to apply!
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Attempt deferred update application on navigation
    updateManager.onNavigation();
  }, [location.pathname, location.key]);

  const applyNow = useCallback(() => {
    return updateManager.applyUpdate('manual', true);
  }, []);

  const checkForUpdate = useCallback(() => {
    return updateManager.checkForUpdate();
  }, []);

  const dismissIndicator = useCallback(() => {
    updateManager.dismissIndicator();
  }, []);

  const markTaskComplete = useCallback(() => {
    return updateManager.markTaskComplete();
  }, []);

  const registerBusyLock = useCallback((id: string, reason?: string) => {
    return updateManager.registerBusyLock(id, reason);
  }, []);

  const value: UpdateContextValue = {
    ...state,
    applyNow,
    checkForUpdate,
    dismissIndicator,
    markTaskComplete,
    registerBusyLock,
    showIndicator,
  };

  return <UpdateContext.Provider value={value}>{children}</UpdateContext.Provider>;
}

/**
 * Hook to access update status and actions
 */
export function useUpdate(): UpdateContextValue {
  const context = useContext(UpdateContext);
  if (!context) {
    throw new Error('useUpdate must be used within an UpdateProvider');
  }
  return context;
}

/**
 * Hook to mark the current component as busy while active work is in progress
 * (e.g. form is dirty, modal is open, checkout in progress).
 * While isBlocked is true, deferred updates will NEVER be automatically applied.
 */
export function useBlockUpdate(isBlocked: boolean, reason: string = 'Active user task'): void {
  const { registerBusyLock } = useUpdate();
  const lockIdRef = useRef<string>('');

  if (!lockIdRef.current) {
    lockIdRef.current = 'lock_' + Math.random().toString(36).substring(2, 9);
  }

  useEffect(() => {
    if (isBlocked) {
      const cleanup = registerBusyLock(lockIdRef.current, reason);
      return cleanup;
    }
  }, [isBlocked, reason, registerBusyLock]);
}

/**
 * Hook providing a function to signal task completion.
 * Call this when a form is submitted, a sale is completed, or a critical flow finishes.
 */
export function useTaskCompletion(): () => boolean {
  const { markTaskComplete } = useUpdate();
  return markTaskComplete;
}
