
export const CONTACTS: Record<string, string> = {
  // English keys
  "mom": "919876543210",
  "dad": "919876543211",
  "boss": "919876543212",
  "raj": "919876543213",

  // Hindi keys (Devanagari)
  "मम्मी": "919876543210",
  "पिता जी": "919876543211",
  "बॉस": "919876543212",
  "राज": "919876543213",
  "दोस्तों": "919876543214"
};

export const GREETINGS = {
  en: "Hello, I am Sofiya. How can I make your day better?",
  hi: "नमस्ते, मैं सोफिया हूँ। मैं आपकी दिनचर्या को कैसे आसान बना सकती हूँ?"
};

export const UNKNOWN_COMMAND = {
  en: "I'm not sure I understand. Could you rephrase that for me?",
  hi: "मुझे समझ नहीं आया। क्या आप इसे थोड़ा अलग तरीके से कह सकते हैं?"
};

export const ERROR_MESSAGES = {
  gps: {
    en: "GPS signal unavailable. Please check your location settings.",
    hi: "जीपीएस सिग्नल उपलब्ध नहीं है। कृपया अपनी लोकेशन सेटिंग्स जांचें।"
  },
  mic: {
    en: "Microphone access denied. Please enable permissions in browser settings.",
    hi: "माइक्रोफ़ोन एक्सेस अस्वीकार कर दिया गया। कृपया ब्राउज़र सेटिंग्स में अनुमति दें।"
  },
  network: {
    en: "Network connection failed. Please check your internet.",
    hi: "नेटवर्क कनेक्शन विफल। कृपया अपना इंटरनेट जांचें।"
  },
  generic: {
    en: "I encountered a system error. Please try again.",
    hi: "सिस्टम में त्रुटि हुई। कृपया पुन: प्रयास करें।"
  }
};


export const INITIAL_VOLUME = 60;

export const TRY_COMMANDS = [
  "Play lo-fi music",
  "Send message to Mom",
  "Activate sentry mode",
  "Start breathing",
  "Turn on lights",
  "Show news",
  "Good morning",
  "Good night",
  "Status report",
  "What time is it?",
  "Tell me a joke",
  "Awaaz badhao",
  "Batti jalao",
  "Namaste Sofiya",
  "Samachar dikhao",
  "Mausam kya hai?"
];