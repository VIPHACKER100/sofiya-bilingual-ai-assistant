import { privacyControlService, PrivacyMode } from '../services/privacyControlService';

describe('Privacy Control Service', () => {
  const testUserId = 'test-user-123';

  afterEach(() => {
    privacyControlService.resetToDefaults(testUserId);
  });

  test('default privacy mode is standard', () => {
    const mode = privacyControlService.getPrivacyMode(testUserId);
    expect(mode).toBe('standard');
  });

  test('can set privacy mode to private', () => {
    privacyControlService.setPrivacyMode(testUserId, 'private');
    const mode = privacyControlService.getPrivacyMode(testUserId);
    expect(mode).toBe('private');
  });

  test('can set privacy mode to optimized', () => {
    privacyControlService.setPrivacyMode(testUserId, 'optimized');
    const mode = privacyControlService.getPrivacyMode(testUserId);
    expect(mode).toBe('optimized');
  });

  test('can set individual feature preference', () => {
    privacyControlService.setFeaturePreference(testUserId, 'health', {
      enabled: true,
      processedLocally: true,
      processedOnCloud: true,
      sharedWithThirdParties: false
    });

    const pref = privacyControlService.getFeaturePreference(testUserId, 'health');
    expect(pref?.processedOnCloud).toBe(true);
    expect(pref?.sharedWithThirdParties).toBe(false);
  });

  test('blocks cloud operation when not allowed', () => {
    privacyControlService.setPrivacyMode(testUserId, 'private');
    
    const allowed = privacyControlService.isOperationAllowed(testUserId, 'cloud', 'health');
    expect(allowed).toBe(false);
  });

  test('allows cloud operation in standard mode', () => {
    privacyControlService.setPrivacyMode(testUserId, 'standard');
    
    const allowed = privacyControlService.isOperationAllowed(testUserId, 'cloud', 'health');
    expect(allowed).toBe(true);
  });

  test('generates privacy report', () => {
    privacyControlService.setPrivacyMode(testUserId, 'standard');
    
    const report = privacyControlService.generatePrivacyReport(testUserId);
    
    expect(report.mode).toBeDefined();
    expect(Array.isArray(report.features)).toBe(true);
  });

  test('resets to defaults', () => {
    privacyControlService.setPrivacyMode(testUserId, 'private');
    privacyControlService.resetToDefaults(testUserId);
    
    const mode = privacyControlService.getPrivacyMode(testUserId);
    expect(mode).toBe('standard');
  });
});
