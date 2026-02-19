/**
 * SOFIYA Settings
 * Phase 11.3: Settings & Customization Panels
 * 
 * Personality, Integrations, Preferences, Appearance.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Plug, Sliders, Palette, Shield } from 'lucide-react';
import { PrivacyDashboard } from './PrivacyDashboard';

type Tab = 'personality' | 'integrations' | 'preferences' | 'appearance' | 'privacy';

interface SettingsProps {
  accentColor?: string;
  onClose?: () => void;
}

const PERSONALITY_MODES = [
  { id: 'focus', name: 'Focus', desc: 'Brief, efficient responses' },
  { id: 'storyteller', name: 'Storyteller', desc: 'Rich, descriptive replies' },
  { id: 'sass', name: 'Sass', desc: 'Playful, witty tone' },
  { id: 'professional', name: 'Professional', desc: 'Formal, polished' }
];

export function Settings({ accentColor = '#8b5cf6', onClose }: SettingsProps) {
  const [tab, setTab] = useState<Tab>('personality');
  const [personality, setPersonality] = useState('focus');
  const [wakeWord, setWakeWord] = useState('SOFIYA');
  const [theme, setTheme] = useState('sofiya');

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'personality', label: 'Personality', icon: User },
    { id: 'integrations', label: 'Integrations', icon: Plug },
    { id: 'preferences', label: 'Preferences', icon: Sliders },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'privacy', label: 'Privacy', icon: Shield }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-3xl mx-auto p-6"
    >
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-white">Close</button>
        )}
      </div>

      <div className="flex gap-6">
        <nav className="w-48 flex-shrink-0 space-y-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                tab === id ? 'bg-white/10' : 'hover:bg-white/5'
              }`}
            >
              <Icon className="w-5 h-5" style={{ color: tab === id ? accentColor : undefined }} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="flex-1 bg-white/5 rounded-2xl border border-white/10 p-6 min-h-[400px]">
          {tab === 'personality' && (
            <div className="space-y-6">
              <h2 className="font-semibold">Personality Mode</h2>
              <div className="grid gap-3">
                {PERSONALITY_MODES.map(m => (
                  <label
                    key={m.id}
                    className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${
                      personality === m.id ? 'border-white/20 bg-white/5' : 'border-white/5 hover:border-white/10'
                    }`}
                  >
                    <input
                      type="radio"
                      name="personality"
                      value={m.id}
                      checked={personality === m.id}
                      onChange={() => setPersonality(m.id)}
                      className="sr-only"
                    />
                    <span className="font-medium">{m.name}</span>
                    <span className="text-sm text-slate-500">{m.desc}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {tab === 'integrations' && (
            <div className="space-y-6">
              <h2 className="font-semibold">Connected Services</h2>
              <div className="space-y-3">
                {['WhatsApp', 'Google Calendar', 'Fitbit', 'Smart Home'].map(s => (
                  <div key={s} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                    <span>{s}</span>
                    <button className="text-sm px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20">
                      Connect
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'preferences' && (
            <div className="space-y-6">
              <h2 className="font-semibold">Preferences</h2>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Wake word</label>
                <input
                  type="text"
                  value={wakeWord}
                  onChange={e => setWakeWord(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white"
                />
              </div>
            </div>
          )}

          {tab === 'appearance' && (
            <div className="space-y-6">
              <h2 className="font-semibold">Theme</h2>
              <div className="flex gap-3">
                {['sofiya', 'classic', 'focus', 'zen'].map(t => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`px-4 py-2 rounded-xl capitalize ${theme === t ? 'bg-white/10' : 'bg-white/5'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {tab === 'privacy' && <PrivacyDashboard />}
        </div>
      </div>
    </motion.div>
  );
}
