// ArchLens — Settings page
// Implemented in Task 15.2

import { useEffect, useState } from 'react';
import { useSettingsStore } from '../stores/settings-store';

const DDAT_ROLES = [
  'Junior Solution Architect',
  'Solution Architect',
  'Senior Solution Architect',
  'Lead Solution Architect',
  'Head of Architecture',
];

export default function Settings() {
  const {
    settings,
    loading,
    error,
    validatingKey,
    keyValidationResult,
    loadSettings,
    updateSettings,
    validateApiKey,
    clearKeyValidation,
  } = useSettingsStore();

  const [localSettings, setLocalSettings] = useState(settings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleChange = (key: string, value: string | number) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
    clearKeyValidation();
  };

  const handleProviderChange = async (provider: 'openai' | 'gemini') => {
    handleChange('aiProvider', provider);
    const key = provider === 'openai' ? localSettings.openaiApiKey : localSettings.geminiApiKey;
    if (key) {
      await validateApiKey(provider, key);
    }
  };

  const handleSave = async () => {
    await updateSettings(localSettings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleValidateKey = async () => {
    const provider = localSettings.aiProvider;
    const key =
      provider === 'openai' ? localSettings.openaiApiKey : localSettings.geminiApiKey;
    await validateApiKey(provider, key);
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem' }}>
        <p style={{ color: '#666' }}>Loading settings...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '640px' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1a1a2e', marginBottom: '1.5rem' }}>
        Settings
      </h2>

      {error && (
        <div
          role="alert"
          style={{
            padding: '0.75rem 1rem',
            background: '#fef2f2',
            border: '1px solid #fca5a5',
            borderRadius: '6px',
            color: '#b91c1c',
            marginBottom: '1rem',
            fontSize: '0.9rem',
          }}
        >
          {error}
        </div>
      )}

      {/* AI Provider */}
      <fieldset style={{ border: 'none', padding: 0, margin: '0 0 1.5rem 0' }}>
        <legend style={{ fontWeight: 600, fontSize: '1rem', color: '#1a1a2e', marginBottom: '0.5rem' }}>
          AI Provider
        </legend>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {(['openai', 'gemini'] as const).map((provider) => (
            <label
              key={provider}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 1rem',
                border: `2px solid ${localSettings.aiProvider === provider ? '#4a6cf7' : '#e0e0e0'}`,
                borderRadius: '6px',
                cursor: 'pointer',
                background: localSettings.aiProvider === provider ? '#f0f4ff' : '#fff',
                fontSize: '0.9rem',
              }}
            >
              <input
                type="radio"
                name="aiProvider"
                value={provider}
                checked={localSettings.aiProvider === provider}
                onChange={() => handleProviderChange(provider)}
              />
              {provider === 'openai' ? 'OpenAI' : 'Google Gemini'}
            </label>
          ))}
        </div>
      </fieldset>

      {/* API Keys */}
      <div style={{ marginBottom: '1rem' }}>
        <label
          htmlFor="openaiApiKey"
          style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', color: '#1a1a2e', marginBottom: '0.25rem' }}
        >
          OpenAI API Key
        </label>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input
            id="openaiApiKey"
            type="password"
            value={localSettings.openaiApiKey}
            onChange={(e) => handleChange('openaiApiKey', e.target.value)}
            placeholder="sk-..."
            style={{
              flex: 1,
              padding: '0.5rem 0.75rem',
              border: '1px solid #d0d0d0',
              borderRadius: '6px',
              fontSize: '0.9rem',
              boxSizing: 'border-box',
            }}
          />
          <button
            onClick={() => validateApiKey('openai', localSettings.openaiApiKey)}
            disabled={validatingKey || !localSettings.openaiApiKey}
            style={{
              padding: '0.5rem 0.75rem',
              background: !localSettings.openaiApiKey ? '#a0a0a0' : '#4a6cf7',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: validatingKey || !localSettings.openaiApiKey ? 'not-allowed' : 'pointer',
              fontSize: '0.8rem',
              opacity: validatingKey ? 0.7 : 1,
              whiteSpace: 'nowrap',
            }}
          >
            {validatingKey ? '...' : 'Validate'}
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label
          htmlFor="geminiApiKey"
          style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', color: '#1a1a2e', marginBottom: '0.25rem' }}
        >
          Gemini API Key
        </label>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input
            id="geminiApiKey"
            type="password"
            value={localSettings.geminiApiKey}
            onChange={(e) => handleChange('geminiApiKey', e.target.value)}
            placeholder="AI..."
            style={{
              flex: 1,
              padding: '0.5rem 0.75rem',
              border: '1px solid #d0d0d0',
              borderRadius: '6px',
              fontSize: '0.9rem',
              boxSizing: 'border-box',
            }}
          />
          <button
            onClick={() => validateApiKey('gemini', localSettings.geminiApiKey)}
            disabled={validatingKey || !localSettings.geminiApiKey}
            style={{
              padding: '0.5rem 0.75rem',
              background: !localSettings.geminiApiKey ? '#a0a0a0' : '#4a6cf7',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: validatingKey || !localSettings.geminiApiKey ? 'not-allowed' : 'pointer',
              fontSize: '0.8rem',
              opacity: validatingKey ? 0.7 : 1,
              whiteSpace: 'nowrap',
            }}
          >
            {validatingKey ? '...' : 'Validate'}
          </button>
        </div>
        {keyValidationResult && (
          <p
            role="status"
            style={{
              marginTop: '0.5rem',
              fontSize: '0.85rem',
              color: keyValidationResult.valid ? '#16a34a' : '#dc2626',
            }}
          >
            {keyValidationResult.message}
          </p>
        )}
      </div>

      {/* Article Refresh Time */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label
          htmlFor="articleRefreshHour"
          style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', color: '#1a1a2e', marginBottom: '0.25rem' }}
        >
          Article Refresh Time
        </label>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input
            id="articleRefreshHour"
            type="number"
            min={0}
            max={23}
            value={localSettings.articleRefreshHour}
            onChange={(e) => handleChange('articleRefreshHour', Number(e.target.value))}
            style={{
              width: '60px',
              padding: '0.5rem',
              border: '1px solid #d0d0d0',
              borderRadius: '6px',
              fontSize: '0.9rem',
              textAlign: 'center',
            }}
          />
          <span style={{ color: '#666' }}>:</span>
          <input
            id="articleRefreshMinute"
            type="number"
            min={0}
            max={59}
            value={localSettings.articleRefreshMinute}
            onChange={(e) => handleChange('articleRefreshMinute', Number(e.target.value))}
            style={{
              width: '60px',
              padding: '0.5rem',
              border: '1px solid #d0d0d0',
              borderRadius: '6px',
              fontSize: '0.9rem',
              textAlign: 'center',
            }}
          />
        </div>
      </div>

      {/* Target Role */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label
          htmlFor="targetRole"
          style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', color: '#1a1a2e', marginBottom: '0.25rem' }}
        >
          Target Role (DDAT)
        </label>
        <select
          id="targetRole"
          value={localSettings.targetRole}
          onChange={(e) => handleChange('targetRole', e.target.value)}
          style={{
            width: '100%',
            padding: '0.5rem 0.75rem',
            border: '1px solid #d0d0d0',
            borderRadius: '6px',
            fontSize: '0.9rem',
            background: '#fff',
            boxSizing: 'border-box',
          }}
        >
          <option value="">Select a target role...</option>
          {DDAT_ROLES.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      </div>

      {/* Theme */}
      <fieldset style={{ border: 'none', padding: 0, margin: '0 0 1.5rem 0' }}>
        <legend style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1a1a2e', marginBottom: '0.5rem' }}>
          Theme
        </legend>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {(['light', 'dark'] as const).map((theme) => (
            <label
              key={theme}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 1rem',
                border: `2px solid ${localSettings.theme === theme ? '#4a6cf7' : '#e0e0e0'}`,
                borderRadius: '6px',
                cursor: 'pointer',
                background: localSettings.theme === theme ? '#f0f4ff' : '#fff',
                fontSize: '0.9rem',
                textTransform: 'capitalize',
              }}
            >
              <input
                type="radio"
                name="theme"
                value={theme}
                checked={localSettings.theme === theme}
                onChange={() => handleChange('theme', theme)}
              />
              {theme}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Save Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button
          onClick={handleSave}
          style={{
            padding: '0.6rem 1.5rem',
            background: '#4a6cf7',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: 600,
          }}
        >
          Save Settings
        </button>
        {saved && (
          <span role="status" style={{ color: '#16a34a', fontSize: '0.85rem' }}>
            Settings saved
          </span>
        )}
      </div>
    </div>
  );
}
