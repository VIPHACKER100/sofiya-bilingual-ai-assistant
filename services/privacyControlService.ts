export interface PrivacyPreference {
  featureName: string;
  enabled: boolean;
  processedLocally: boolean;
  processedOnCloud: boolean;
  sharedWithThirdParties: boolean;
}

export type PrivacyMode = 'private' | 'standard' | 'optimized';

const PRIVACY_MODES: Record<PrivacyMode, {
  description: string;
  localProcessing: boolean;
  cloudProcessing: boolean;
  thirdPartySharing: boolean;
}> = {
  private: {
    description: 'Maximum privacy. All processing on device only.',
    localProcessing: true,
    cloudProcessing: false,
    thirdPartySharing: false
  },
  standard: {
    description: 'Balanced. Essential cloud services with your consent.',
    localProcessing: true,
    cloudProcessing: true,
    thirdPartySharing: true
  },
  optimized: {
    description: 'Best experience. All features enabled for most accurate assistance.',
    localProcessing: true,
    cloudProcessing: true,
    thirdPartySharing: true
  }
};

class PrivacyControlService {
  private preferences: Map<string, Map<string, PrivacyPreference>> = new Map();
  private storageKey = 'sofiya_privacy_prefs';

  constructor() {
    this.loadPreferences();
  }

  private loadPreferences() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        for (const [userId, prefs] of Object.entries(parsed)) {
          this.preferences.set(userId, new Map(Object.entries(prefs as Record<string, PrivacyPreference>)));
        }
      }
    } catch (e) {
      console.error('Failed to load privacy preferences:', e);
    }
  }

  private savePreferences() {
    const obj: Record<string, Record<string, PrivacyPreference>> = {};
    for (const [userId, prefs] of this.preferences) {
      obj[userId] = Object.fromEntries(prefs);
    }
    localStorage.setItem(this.storageKey, JSON.stringify(obj));
  }

  setPrivacyMode(userId: string, mode: PrivacyMode) {
    const config = PRIVACY_MODES[mode];
    const features = ['voice', 'health', 'location', 'calendar', 'contacts', 'analytics'];

    if (!this.preferences.has(userId)) {
      this.preferences.set(userId, new Map());
    }

    const prefs = this.preferences.get(userId)!;

    for (const feature of features) {
      prefs.set(feature, {
        featureName: feature,
        enabled: mode !== 'private',
        processedLocally: true,
        processedOnCloud: config.cloudProcessing,
        sharedWithThirdParties: config.thirdPartySharing
      });
    }

    this.savePreferences();
  }

  getPrivacyMode(userId: string): PrivacyMode {
    const prefs = this.preferences.get(userId);
    if (!prefs || prefs.size === 0) return 'standard';

    const cloudEnabled = Array.from(prefs.values()).some(p => p.processedOnCloud);
    const thirdPartyEnabled = Array.from(prefs.values()).some(p => p.sharedWithThirdParties);

    if (!cloudEnabled && !thirdPartyEnabled) return 'private';
    if (cloudEnabled && thirdPartyEnabled) return 'optimized';
    return 'standard';
  }

  setFeaturePreference(userId: string, feature: string, options: Partial<PrivacyPreference>) {
    if (!this.preferences.has(userId)) {
      this.preferences.set(userId, new Map());
    }

    const prefs = this.preferences.get(userId)!;
    const existing = prefs.get(feature) || {
      featureName: feature,
      enabled: true,
      processedLocally: true,
      processedOnCloud: false,
      sharedWithThirdParties: false
    };

    prefs.set(feature, { ...existing, ...options });
    this.savePreferences();
  }

  getFeaturePreference(userId: string, feature: string): PrivacyPreference | null {
    return this.preferences.get(userId)?.get(feature) || null;
  }

  isOperationAllowed(userId: string, operation: 'cloud' | 'share', feature: string): boolean {
    const pref = this.getFeaturePreference(userId, feature);
    if (!pref || !pref.enabled) return false;

    if (operation === 'cloud') return pref.processedOnCloud;
    if (operation === 'share') return pref.sharedWithThirdParties;
    return false;
  }

  generatePrivacyReport(userId: string): {
    mode: PrivacyMode;
    features: string[];
    localOnly: string[];
    cloudEnabled: string[];
    thirdPartyShared: string[];
  } {
    const mode = this.getPrivacyMode(userId);
    const prefs = this.preferences.get(userId);

    const features: string[] = [];
    const localOnly: string[] = [];
    const cloudEnabled: string[] = [];
    const thirdPartyShared: string[] = [];

    if (prefs) {
      for (const pref of prefs.values()) {
        if (pref.enabled) {
          features.push(pref.featureName);
          if (pref.processedLocally && !pref.processedOnCloud) {
            localOnly.push(pref.featureName);
          }
          if (pref.processedOnCloud) {
            cloudEnabled.push(pref.featureName);
          }
          if (pref.sharedWithThirdParties) {
            thirdPartyShared.push(pref.featureName);
          }
        }
      }
    }

    return { mode, features, localOnly, cloudEnabled, thirdPartyShared };
  }

  resetToDefaults(userId: string) {
    this.setPrivacyMode(userId, 'standard');
  }
}

export const privacyControlService = new PrivacyControlService();
