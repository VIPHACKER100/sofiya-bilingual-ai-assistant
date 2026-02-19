/**
 * SOFIYA Help Center
 * Phase 16.3: FAQ, troubleshooting, integration setup
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, HelpCircle, ChevronDown, BookOpen, Wrench, Plug, ExternalLink } from 'lucide-react';
import { soundService } from '../services/soundService';

interface HelpCenterProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'en' | 'hi';
  accentColor: string;
  onReportIssue?: () => void;
}

const FAQ_ITEMS = [
  {
    q: { en: 'What voice commands does SOFIYA support?', hi: 'SOFIYA कौन से वॉयस कमांड समर्थन करता है?' },
    a: { en: 'Say "Hello Sofiya" to start. Try: "What\'s the weather?", "Turn on the lights", "Add task buy milk", "Set timer for 5 minutes", "Show news". Press L to switch language.', hi: '"नमस्ते सोफिया" बोलकर शुरू करें। "मौसम कैसा है?", "लाइट जलाओ", "टास्क जोड़ो दूध खरीदना" आज़माएं।' }
  },
  {
    q: { en: 'How do I connect WhatsApp?', hi: 'WhatsApp कैसे कनेक्ट करूं?' },
    a: { en: 'Go to Settings → Integrations. You need a Twilio account and WhatsApp Business API. Add TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN to your .env.', hi: 'सेटिंग्स → इंटीग्रेशन में जाएं। Twilio अकाउंट और WhatsApp Business API चाहिए।' }
  },
  {
    q: { en: 'Voice not working?', hi: 'वॉयस काम नहीं कर रहा?' },
    a: { en: '1) Allow microphone permission. 2) Use Chrome/Edge for best support. 3) Check GOOGLE_APPLICATION_CREDENTIALS for Speech-to-Text. 4) Try "Status report" to test.', hi: '1) माइक्रोफोन अनुमति दें। 2) Chrome/Edge उपयोग करें। 3) Speech-to-Text क्रेडेंशियल जांचें।' }
  },
  {
    q: { en: 'Smart home not responding?', hi: 'स्मार्ट होम जवाब नहीं दे रहा?' },
    a: { en: 'Connect Google Home, Alexa, or IFTTT in Settings. Add API keys to .env. Say "Movie night" or "Lights on" after setup.', hi: 'सेटिंग्स में Google Home, Alexa या IFTTT कनेक्ट करें। API कुंजी .env में जोड़ें।' }
  },
  {
    q: { en: 'How do I change personality mode?', hi: 'पर्सनैलिटी मोड कैसे बदलूं?' },
    a: { en: 'Say "Activate sass mode", "Switch to focus mode", or "Storyteller mode". Or use the theme selector (colored dots) in the header.', hi: '"Sass mode चालू करो", "Focus mode पर जाओ" बोलें। या हेडर में थीम सेलेक्टर उपयोग करें।' }
  }
];

const TROUBLESHOOTING = [
  { title: { en: 'Microphone access denied', hi: 'माइक एक्सेस नहीं मिला' }, steps: { en: 'Click the lock icon in the address bar → Site settings → Microphone → Allow', hi: 'एड्रेस बार में लॉक आइकन → साइट सेटिंग्स → माइक्रोफोन → अनुमति दें' } },
  { title: { en: 'Backend not responding', hi: 'बैकएंड जवाब नहीं दे रहा' }, steps: { en: 'Ensure backend runs on port 3001. Check VITE_API_URL in .env. Run: cd backend && npm run dev', hi: 'बैकएंड पोर्ट 3001 पर चल रहा हो। .env में VITE_API_URL जांचें।' } },
  { title: { en: 'Voice recognition slow', hi: 'वॉयस रिकग्निशन धीमा' }, steps: { en: 'Google Cloud Speech-to-Text needs credentials. Use streaming mode. Check network latency.', hi: 'Google Cloud Speech-to-Text क्रेडेंशियल चाहिए। स्ट्रीमिंग मोड उपयोग करें।' } }
];

const INTEGRATIONS = [
  { name: 'WhatsApp', doc: 'Twilio WhatsApp Business API', env: 'TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN' },
  { name: 'Google Calendar', doc: 'OAuth2 with googleapis', env: 'GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET' },
  { name: 'Smart Home', doc: 'Google Home / Alexa / IFTTT', env: 'GOOGLE_HOME_API_KEY, ALEXA_SKILL_ID, IFTTT_WEBHOOK_KEY' },
  { name: 'Fitbit', doc: 'OAuth2 Fitbit API', env: 'FITBIT_CLIENT_ID, FITBIT_CLIENT_SECRET' },
  { name: 'News', doc: 'NewsAPI', env: 'NEWS_API_KEY' }
];

export const HelpCenter = React.memo(({ isOpen, onClose, language, accentColor, onReportIssue }: HelpCenterProps) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [tab, setTab] = useState<'faq' | 'troubleshoot' | 'integrations'>('faq');

  if (!isOpen) return null;

  const t = (obj: { en: string; hi: string }) => (language === 'hi' ? obj.hi : obj.en);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/90 backdrop-blur-2xl"
      />

      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-3xl border border-white/10 bg-black/80 backdrop-blur-xl z-10 flex flex-col"
      >
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <HelpCircle className="w-6 h-6" style={{ color: accentColor }} />
            <h2 className="text-xl font-bold text-white">
              {language === 'hi' ? 'सहायता केंद्र' : 'Help Center'}
            </h2>
          </div>
          <button
            onClick={() => { soundService.playUIClick(); onClose(); }}
            className="p-2 text-slate-500 hover:text-white rounded-lg hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-white/5">
          {(['faq', 'troubleshoot', 'integrations'] as const).map((tabs) => (
            <button
              key={tabs}
              onClick={() => { soundService.playUIClick(); setTab(tabs); }}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                tab === tabs ? 'text-white border-b-2' : 'text-slate-500 hover:text-slate-300'
              }`}
              style={tab === tabs ? { borderColor: accentColor } : {}}
            >
              {tabs === 'faq' && (language === 'hi' ? 'सामान्य प्रश्न' : 'FAQ')}
              {tabs === 'troubleshoot' && (language === 'hi' ? 'समस्या निवारण' : 'Troubleshooting')}
              {tabs === 'integrations' && (language === 'hi' ? 'इंटीग्रेशन' : 'Integrations')}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          <AnimatePresence mode="wait">
            {tab === 'faq' && (
              <motion.div
                key="faq"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-3"
              >
                {FAQ_ITEMS.map((item, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-white/5 bg-white/5 overflow-hidden"
                  >
                    <button
                      onClick={() => { soundService.playUIClick(); setOpenFaq(openFaq === i ? null : i); }}
                      className="w-full flex justify-between items-center p-4 text-left hover:bg-white/5 transition-colors"
                    >
                      <span className="font-medium text-white">{t(item.q)}</span>
                      <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                    </button>
                    {openFaq === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-4 pb-4 text-slate-400 text-sm"
                      >
                        {t(item.a)}
                      </motion.div>
                    )}
                  </div>
                ))}
              </motion.div>
            )}

            {tab === 'troubleshoot' && (
              <motion.div
                key="troubleshoot"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4"
              >
                {TROUBLESHOOTING.map((item, i) => (
                  <div key={i} className="rounded-xl border border-white/5 p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Wrench className="w-4 h-4" style={{ color: accentColor }} />
                      <h3 className="font-semibold text-white">{t(item.title)}</h3>
                    </div>
                    <p className="text-slate-400 text-sm pl-6">{t(item.steps)}</p>
                  </div>
                ))}
              </motion.div>
            )}

            {tab === 'integrations' && (
              <motion.div
                key="integrations"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4"
              >
                <p className="text-slate-500 text-sm">
                  {language === 'hi' ? 'प्रत्येक इंटीग्रेशन के लिए .env में निम्न चर सेट करें:' : 'Set the following env vars in .env for each integration:'}
                </p>
                {INTEGRATIONS.map((int, i) => (
                  <div key={i} className="rounded-xl border border-white/5 p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Plug className="w-4 h-4" style={{ color: accentColor }} />
                      <h3 className="font-semibold text-white">{int.name}</h3>
                    </div>
                    <p className="text-slate-400 text-sm">{int.doc}</p>
                    <code className="block text-xs text-slate-500 font-mono bg-black/40 px-2 py-1 rounded">{int.env}</code>
                  </div>
                ))}
                <a
                  href="/docs/INTEGRATION_GUIDE.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm"
                  style={{ color: accentColor }}
                >
                  <BookOpen className="w-4 h-4" />
                  {language === 'hi' ? 'पूर्ण गाइड देखें' : 'View full integration guide'}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {onReportIssue && (
          <div className="p-4 border-t border-white/5">
            <button
              onClick={() => { soundService.playUIClick(); onReportIssue(); onClose(); }}
              className="w-full py-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors text-sm font-medium"
            >
              {language === 'hi' ? 'समस्या की रिपोर्ट करें' : 'Report an issue'}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
});
