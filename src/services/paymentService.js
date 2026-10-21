import { STORAGE_KEYS } from './storageKeys';

export const DEFAULT_PLATFORM_SETTINGS = {
  platformCommission: 10, // 10%
  tourismLevyVat: 5,      // 5%
  supportEmail: 'support@lodgekeys.com',
  supportPhone: '+234 800 563 4353',
  autoPublishApproved: true,
  escrowHoldDays: 1,
};

export const paymentService = {
  getSettings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ADMIN_SETTINGS);
      return raw ? JSON.parse(raw) : DEFAULT_PLATFORM_SETTINGS;
    } catch {
      return DEFAULT_PLATFORM_SETTINGS;
    }
  },

  saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEYS.ADMIN_SETTINGS, JSON.stringify(settings));
      window.dispatchEvent(new Event('storage'));
      return settings;
    } catch (e) {
      console.error('Failed saving platform settings', e);
      return settings;
    }
  },

  calculateFinancials(grossAmount, commissionPct = 10, vatPct = 5) {
    const gross = Number(grossAmount) || 0;
    const commission = Math.round((gross * commissionPct) / 100);
    const tax = Math.round((gross * vatPct) / 100);
    const netPayout = Math.max(0, gross - commission);

    return {
      gross,
      commission,
      commissionPct,
      tax,
      vatPct,
      netPayout,
    };
  },
};
