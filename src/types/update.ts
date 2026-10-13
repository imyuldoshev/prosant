/**
 * Version metadata returned by /version.json
 */
export interface VersionInfo {
  version: string;
  buildTime: string;
  [key: string]: unknown;
}

/**
 * Busy lock representing in-progress user work
 */
export interface BusyLock {
  id: string;
  reason: string;
  timestamp: number;
}

/**
 * Snapshot of current update manager state
 */
export interface UpdateState {
  currentVersion: string;
  pendingVersion: string | null;
  hasPendingUpdate: boolean;
  isChecking: boolean;
  lastChecked: number | null;
  isBusy: boolean;
  busyLocks: BusyLock[];
  indicatorDismissed: boolean;
}

/**
 * Reasons why a deferred update might be applied
 */
export type UpdateApplyReason =
  | 'navigation'
  | 'task_complete'
  | 'tab_hidden'
  | 'page_hide'
  | 'idle_timeout'
  | 'chunk_error'
  | 'manual';

/**
 * Configuration options for the Update Manager
 */
export interface UpdateManagerConfig {
  /** Check interval in milliseconds (default: 5 minutes = 300_000ms) */
  checkIntervalMs?: number;
  /** Inactivity duration before applying update while idle (default: 5 minutes = 300_000ms) */
  idleTimeoutMs?: number;
  /** Minimum delay between reloads to prevent loops (default: 15_000ms) */
  minReloadIntervalMs?: number;
  /** Whether to show the non-intrusive UI indicator (default: true) */
  showIndicator?: boolean;
}

declare global {
  const __APP_VERSION__: string;
  const __APP_BUILD_TIME__: string;

  interface Window {
    __santexUpdate?: {
      getStatus: () => UpdateState;
      checkForUpdate: () => Promise<boolean>;
      simulateNewVersion: (newVersion?: string) => void;
      markTaskComplete: () => boolean;
      applyUpdate: (reason?: UpdateApplyReason, force?: boolean) => boolean;
      addBusyLock: (id: string, reason?: string) => () => void;
      removeBusyLock: (id: string) => void;
    };
  }
}
