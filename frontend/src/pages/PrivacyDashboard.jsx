/**
 * SOFIYA Privacy Dashboard
 * Phase 10.4: User control over data collection
 * 
 * Toggle collection per service, view stored data,
 * delete data, export (GDPR), revoke permissions.
 */

import React, { useState, useEffect } from 'react';

export function PrivacyDashboard() {
  const [settings, setSettings] = useState({
    voiceProcessing: 'cloud',
    healthData: 'local_first',
    locationSharing: false,
    conversationHistory: true,
    analytics: true,
    personalization: true,
    dataRetentionDays: 90
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetch('/api/privacy/settings')
      .then(res => res.ok ? res.json() : {})
      .then(data => { if (data.settings) setSettings(data.settings); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateSetting = (key, value) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    fetch('/api/privacy/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next)
    })
      .then(res => res.ok && setMessage('Settings saved'))
      .catch(() => setMessage('Failed to save'));
  };

  const exportData = () => {
    fetch('/api/privacy/export')
      .then(res => res.json())
      .then(data => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `sofiya-data-export-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        setMessage('Export downloaded');
      })
      .catch(() => setMessage('Export failed'));
  };

  const deleteData = (type) => {
    if (!confirm(`Delete all ${type} data? This cannot be undone.`)) return;
    fetch(`/api/privacy/delete/${type}`, { method: 'DELETE' })
      .then(res => res.ok && setMessage(`${type} data deleted`))
      .catch(() => setMessage('Delete failed'));
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold">Privacy Dashboard</h1>
      {message && <div className="p-3 bg-green-100 text-green-800 rounded">{message}</div>}

      <section>
        <h2 className="text-lg font-semibold mb-4">Data Collection</h2>
        <div className="space-y-4">
          <Toggle
            label="Voice processing in cloud"
            checked={settings.voiceProcessing === 'cloud'}
            onChange={(v) => updateSetting('voiceProcessing', v ? 'cloud' : 'on_device')}
          />
          <Toggle
            label="Share location"
            checked={settings.locationSharing}
            onChange={(v) => updateSetting('locationSharing', v)}
          />
          <Toggle
            label="Store conversation history"
            checked={settings.conversationHistory}
            onChange={(v) => updateSetting('conversationHistory', v)}
          />
          <Toggle
            label="Analytics"
            checked={settings.analytics}
            onChange={(v) => updateSetting('analytics', v)}
          />
          <Toggle
            label="Personalization"
            checked={settings.personalization}
            onChange={(v) => updateSetting('personalization', v)}
          />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Your Data</h2>
        <div className="flex gap-3">
          <button
            onClick={exportData}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Export my data
          </button>
          <button
            onClick={() => deleteData('conversation')}
            className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
          >
            Delete conversation history
          </button>
        </div>
      </section>
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-5 h-5"
      />
    </label>
  );
}
