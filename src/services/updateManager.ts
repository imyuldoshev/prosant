import type {
  BusyLock,
  UpdateApplyReason,
  UpdateManagerConfig,
  UpdateState,
  VersionInfo,
} from '../types/update';

const RELOAD_GUARD_KEY = 'santexpro_update_reload_guard';
const CURRENT_VERSION_STORAGE_KEY = 'santexpro_active_version';

/**
 * UpdateManager handles background version detection, safety guard management (isBusy registry),
 * and silent deferred application of updates.
 */
class UpdateManager {
  private currentVersion: string;
  private pendingVersion: string | null = null;
  private isChecking: boolean = false;
  private lastChecked: number | null = null;
  private indicatorDismissed: boolean = false;

  private busyLocks = new Map<string, BusyLock>();
  private listeners = new Set<(state: UpdateState) => void>();

  private checkIntervalId: ReturnType<typeof setInterval> | null = null;
  private idleCheckIntervalId: ReturnType<typeof setInterval> | null = null;
  private lastUserActivityTime: number = Date.now();

  private config: Required<UpdateManagerConfig> = {
    checkIntervalMs: 5 * 60 * 1000, // 5 minutes
    idleTimeoutMs: 5 * 60 * 1000,    // 5 minutes
    minReloadIntervalMs: 15 * 1000,  // 15 seconds loop guard
    showIndicator: true,
  };

  private isInitialized = false;

  constructor() {
    // 1. Determine current running version
    let detectedVersion = '1.0.0';
    if (typeof __APP_VERSION__ !== 'undefined' && __APP_VERSION__) {
      detectedVersion = __APP_VERSION__;
    } else {
      const stored = sessionStorage.getItem(CURRENT_VERSION_STORAGE_KEY);
      if (stored) {
        detectedVersion = stored;
      }
    }
    this.currentVersion = detectedVersion;
    sessionStorage.setItem(CURRENT_VERSION_STORAGE_KEY, detectedVersion);
  }

  /**
   * Initialize background update listeners, timers, and safety guards
   */
  public init(customConfig?: UpdateManagerConfig): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    if (customConfig) {
      this.config = { ...this.config, ...customConfig };
    }

    // A. Setup periodic checking
    this.checkIntervalId = setInterval(() => {
      this.checkForUpdate();
    }, this.config.checkIntervalMs);

    // B. Visibility change listener:
    // - When visible: check if a new version was published while tab was backgrounded.
    // - When hidden: silent moment! If an update is pending and we're not busy, apply update quietly.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.checkForUpdate();
      } else if (document.visibilityState === 'hidden') {
        if (this.hasPendingUpdate() && !this.isBusy()) {
          console.info('[UpdateManager] Tab hidden with pending update and no busy locks. Applying update silently.');
          this.applyUpdate('tab_hidden');
        }
      }
    });

    // C. Window focus listener
    window.addEventListener('focus', () => {
      this.checkForUpdate();
    });

    // D. Pagehide listener
    window.addEventListener('pagehide', () => {
      if (this.hasPendingUpdate() && !this.isBusy()) {
        this.applyUpdate('page_hide');
      }
    });

    // E. User activity tracking for idle detection
    const handleUserActivity = () => {
      this.lastUserActivityTime = Date.now();
    };

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'] as const;
    let throttleTimer: ReturnType<typeof setTimeout> | null = null;
    const throttledActivity = () => {
      if (!throttleTimer) {
        handleUserActivity();
        throttleTimer = setTimeout(() => {
          throttleTimer = null;
        }, 1000);
      }
    };

    activityEvents.forEach((evt) => {
      window.addEventListener(evt, throttledActivity, { passive: true });
    });

    // F. Idle checker interval
    this.idleCheckIntervalId = setInterval(() => {
      const idleTime = Date.now() - this.lastUserActivityTime;
      if (idleTime >= this.config.idleTimeoutMs) {
        if (this.hasPendingUpdate() && !this.isBusy()) {
          console.info('[UpdateManager] User idle for 5+ minutes with pending update. Applying update silently.');
          this.applyUpdate('idle_timeout');
        }
      }
    }, 15000);

    // G. Custom event listener for task completion
    document.addEventListener('app:task-complete', () => {
      this.markTaskComplete();
    });

    // H. Vite Preload & Chunk load error handling
    window.addEventListener('vite:preloadError', (event) => {
      console.warn('[UpdateManager] Vite preload error encountered (stale chunk hash):', event);
      if (!this.isReloadLoopGuarded()) {
        this.recordReloadAttempt();
        window.location.reload();
      }
    });

    window.addEventListener('error', (event) => {
      const message = typeof event.message === 'string' ? event.message : '';
      if (
        message.includes('Failed to fetch dynamically imported module') ||
        message.includes('error loading dynamically imported module') ||
        message.includes('Importing a module script failed') ||
        message.includes('Loading chunk')
      ) {
        console.warn('[UpdateManager] Dynamic import chunk error caught:', message);
        if (!this.isReloadLoopGuarded()) {
          this.recordReloadAttempt();
          window.location.reload();
        }
      }
    });

    // I. Service Worker handling (if browser has active service workers)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg) {
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // Keep worker in waiting state! Do NOT call skipWaiting immediately.
                  console.info('[UpdateManager] Service worker updated and waiting.');
                  this.setPendingVersion('sw-' + Date.now());
                }
              });
            }
          });
        }
      }).catch((e) => {
        console.debug('[UpdateManager] Service worker check skipped:', e);
      });
    }

    // J. Developer testing API on window.__santexUpdate
    window.__santexUpdate = {
      getStatus: () => this.getState(),
      checkForUpdate: () => this.checkForUpdate(),
      simulateNewVersion: (newVersion?: string) => this.simulateNewVersion(newVersion),
      markTaskComplete: () => this.markTaskComplete(),
      applyUpdate: (reason?: UpdateApplyReason, force?: boolean) => this.applyUpdate(reason || 'manual', force),
      addBusyLock: (id: string, reason?: string) => this.registerBusyLock(id, reason),
      removeBusyLock: (id: string) => this.unregisterBusyLock(id),
    };

    // K. Initial check after 4 seconds to avoid competing with initial page render
    setTimeout(() => {
      this.checkForUpdate();
    }, 4000);
  }

  /**
   * Check /version.json on server to detect if a new build is deployed
   */
  public async checkForUpdate(): Promise<boolean> {
    if (this.isChecking) return false;
    this.isChecking = true;
    this.notify();

    try {
      // Append cache buster parameter and enforce no-cache / no-store headers
      const res = await fetch(`/version.json?_t=${Date.now()}`, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      });

      this.lastChecked = Date.now();

      if (!res.ok) {
        this.isChecking = false;
        this.notify();
        return false;
      }

      const data = (await res.json()) as VersionInfo;
      if (data && typeof data.version === 'string' && data.version.trim()) {
        const remoteVersion = data.version.trim();
        if (remoteVersion !== this.currentVersion) {
          if (this.pendingVersion !== remoteVersion) {
            this.setPendingVersion(remoteVersion);
            return true;
          }
        }
      }
    } catch (err) {
      console.debug('[UpdateManager] Version check skipped/network error:', err);
    } finally {
      this.isChecking = false;
      this.notify();
    }

    return false;
  }

  /**
   * Mark a version as pending update without immediately refreshing
   */
  public setPendingVersion(version: string): void {
    if (this.pendingVersion === version) return;
    this.pendingVersion = version;
    console.info(`[UpdateManager] New version detected: "${version}" (current: "${this.currentVersion}"). Marked as pending update.`);
    this.notify();

    // Check if we are currently safe to apply immediately (e.g. tab is hidden or idle and not busy)
    if (document.visibilityState === 'hidden' && !this.isBusy()) {
      this.applyUpdate('tab_hidden');
    }
  }

  /**
   * Check if an update is pending
   */
  public hasPendingUpdate(): boolean {
    return this.pendingVersion !== null && this.pendingVersion !== this.currentVersion;
  }

  /**
   * Register a busy lock (e.g. dirty form, open modal, items in cart).
   * While ANY busy lock is registered, updates will NEVER be auto-applied.
   * Returns a cleanup unregister function.
   */
  public registerBusyLock(id: string, reason: string = 'In-progress user task'): () => void {
    this.busyLocks.set(id, {
      id,
      reason,
      timestamp: Date.now(),
    });
    this.notify();

    return () => {
      this.unregisterBusyLock(id);
    };
  }

  /**
   * Unregister a busy lock
   */
  public unregisterBusyLock(id: string): void {
    if (this.busyLocks.has(id)) {
      this.busyLocks.delete(id);
      this.notify();
    }
  }

  /**
   * Check whether any busy locks are currently registered
   */
  public isBusy(): boolean {
    return this.busyLocks.size > 0;
  }

  /**
   * Get active busy locks list
   */
  public getBusyLocks(): BusyLock[] {
    return Array.from(this.busyLocks.values());
  }

  /**
   * Safely called on page/route navigation.
   * If a pending update exists and no busy locks are active, applies update immediately.
   */
  public onNavigation(): boolean {
    if (this.hasPendingUpdate() && !this.isBusy()) {
      console.info('[UpdateManager] Safe navigation boundary reached with pending update. Applying update.');
      return this.applyUpdate('navigation');
    }
    return false;
  }

  /**
   * Called when the user finishes a task (e.g. sale completed, form saved, dialog closed).
   * If a pending update exists and no other busy locks are active, applies update.
   */
  public markTaskComplete(): boolean {
    if (this.hasPendingUpdate() && !this.isBusy()) {
      console.info('[UpdateManager] Task completed with pending update. Applying update.');
      return this.applyUpdate('task_complete');
    }
    return false;
  }

  /**
   * Apply the update: reloads the page to activate the fresh assets and code.
   * Guarded by isBusy and reload loop detector.
   */
  public applyUpdate(reason: UpdateApplyReason = 'manual', force: boolean = false): boolean {
    if (!force) {
      if (!this.hasPendingUpdate()) {
        return false;
      }
      if (this.isBusy()) {
        const reasons = this.getBusyLocks().map((l) => l.reason).join(', ');
        console.warn(`[UpdateManager] Deferred update postponed: Application is currently busy (${reasons}).`);
        return false;
      }
    }

    if (this.isReloadLoopGuarded()) {
      console.warn('[UpdateManager] Reload loop guard prevented reload. Too frequent reload attempts.');
      return false;
    }

    this.recordReloadAttempt();

    console.info(`[UpdateManager] Applying update (reason: ${reason}, target version: ${this.pendingVersion || this.currentVersion}).`);

    // If there is a waiting Service Worker, tell it to take over
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg?.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      }).catch(() => {});
    }

    // Hard reload to guarantee fetching the new index.html and assets
    window.location.reload();
    return true;
  }

  /**
   * Check if reload happened too recently to prevent reload loops
   */
  private isReloadLoopGuarded(): boolean {
    try {
      const stored = sessionStorage.getItem(RELOAD_GUARD_KEY);
      if (stored) {
        const lastReloadTime = parseInt(stored, 10);
        if (!isNaN(lastReloadTime) && Date.now() - lastReloadTime < this.config.minReloadIntervalMs) {
          return true;
        }
      }
    } catch {
      // sessionStorage unavailable
    }
    return false;
  }

  /**
   * Record reload timestamp in sessionStorage
   */
  private recordReloadAttempt(): void {
    try {
      sessionStorage.setItem(RELOAD_GUARD_KEY, String(Date.now()));
    } catch {
      // sessionStorage unavailable
    }
  }

  /**
   * Dismiss the UI indicator for the current session
   */
  public dismissIndicator(): void {
    this.indicatorDismissed = true;
    this.notify();
  }

  /**
   * Developer helper to simulate a new version being deployed
   */
  public simulateNewVersion(version?: string): void {
    const mockVersion = version || `v2.0.0-simulated-${Date.now().toString(36)}`;
    this.setPendingVersion(mockVersion);
  }

  /**
   * Get current state snapshot
   */
  public getState(): UpdateState {
    return {
      currentVersion: this.currentVersion,
      pendingVersion: this.pendingVersion,
      hasPendingUpdate: this.hasPendingUpdate(),
      isChecking: this.isChecking,
      lastChecked: this.lastChecked,
      isBusy: this.isBusy(),
      busyLocks: this.getBusyLocks(),
      indicatorDismissed: this.indicatorDismissed,
    };
  }

  /**
   * Subscribe to state changes
   */
  public subscribe(listener: (state: UpdateState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const state = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (err) {
        console.error('[UpdateManager] Listener error:', err);
      }
    });
  }

  public destroy(): void {
    if (this.checkIntervalId) clearInterval(this.checkIntervalId);
    if (this.idleCheckIntervalId) clearInterval(this.idleCheckIntervalId);
    this.listeners.clear();
    this.busyLocks.clear();
  }
}

export const updateManager = new UpdateManager();
