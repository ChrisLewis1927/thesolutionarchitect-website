// ArchLens — Settings state management via Zustand
// Implemented in Task 15.1 / 15.2

import { create } from 'zustand';

export interface AppSettings {
  aiProvider: 'openai' | 'gemini';
  openaiApiKey: string;
  geminiApiKey: string;
  articleRefreshHour: number;
  articleRefreshMinute: number;
  targetRole: string;
  theme: 'light' | 'dark';
}

const DEFAULT_SETTINGS: AppSettings = {
  aiProvider: 'openai',
  openaiApiKey: '',
  geminiApiKey: '',
  articleRefreshHour: 7,
  articleRefreshMinute: 0,
  targetRole: '',
  theme: 'light',
};

export interface SettingsState {
  settings: AppSettings;
  loading: boolean;
  error: string | null;
  validatingKey: boolean;
  keyValidationResult: { valid: boolean; message: string } | null;

  loadSettings: () => Promise<void>;
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>;
  validateApiKey: (provider: 'openai' | 'gemini', key: string) => Promise<boolean>;
  clearKeyValidation: () => void;
}

declare global {
  interface Window {
    archlens: {
      settings: {
        get: () => Promise<AppSettings>;
        update: (settings: Partial<AppSettings>) => Promise<void>;
      };
      ai: {
        validateKey: (provider: 'openai' | 'gemini', key: string) => Promise<boolean>;
        [key: string]: unknown;
      };
      [key: string]: unknown;
    };
  }
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: DEFAULT_SETTINGS,
  loading: false,
  error: null,
  validatingKey: false,
  keyValidationResult: null,

  loadSettings: async () => {
    set({ loading: true, error: null });
    try {
      const settings = await window.archlens.settings.get();
      set({ settings, loading: false });
    } catch {
      set({ error: 'Failed to load settings', loading: false });
    }
  },

  updateSettings: async (partial) => {
    set({ error: null });
    try {
      await window.archlens.settings.update(partial);
      set((state) => ({
        settings: { ...state.settings, ...partial },
      }));
    } catch {
      set({ error: 'Failed to save settings' });
    }
  },

  validateApiKey: async (provider, key) => {
    set({ validatingKey: true, keyValidationResult: null });
    try {
      const valid = await window.archlens.ai.validateKey(provider, key);
      const message = valid ? 'API key is valid' : 'API key is invalid';
      set({ validatingKey: false, keyValidationResult: { valid, message } });
      return valid;
    } catch {
      set({
        validatingKey: false,
        keyValidationResult: { valid: false, message: 'Failed to validate API key' },
      });
      return false;
    }
  },

  clearKeyValidation: () => set({ keyValidationResult: null }),
}));
