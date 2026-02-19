# 🛠️ SOFIYA — Development Guide

This guide is for developers looking to extend or modify SOFIYA's capabilities.

## 📁 Key File Structure

- `App.tsx`: The main UI shell and orchestration hub.
- `hooks/useAssistant.ts`: **Core Logic**. State management, command execution, and service integration.
- `services/commandProcessor.ts`: **The Brain**. Intent recognition via regex and language scoring.
- `services/voiceService.ts`: Integration with Web Speech API for TTS and STT.
- `services/soundService.ts`: Procedural UI sound generation.
- `services/weatherService.ts`: Standalone module for fetching meteorological data.
- `services/newsService.ts`: Standalone module for retrieving live global headlines.
- `components/`: Individual UI widgets (Weather, Media, Health, etc.).

## 🚀 Adding a New Command

1. **Define Intent**: Go to `services/commandProcessor.ts`.
2. **Add Regex**: Add a new `if` block with a `lowerText.match()` regex.
3. **Create Response**: Return `createResponse('YOUR_ACTION_TYPE', 'Response text', { ...optionalData })`.
4. **Handle Action**: (Optional) In `hooks/useAssistant.ts`, add a handler for `YOUR_ACTION_TYPE` if you need to update UI state.

## 🎨 Changing Themes

Themes (Protocols) are defined in `index.html` (for global styles) and handled via state in `useAssistant`.

- **Colors**: CSS variables in `index.html` or inline Tailwind classes in `App.tsx`.
- **Transitions**: UI uses Framer Motion (if installed) or standard CSS transitions.

## 🧪 Testing

Since SOFIYA uses the Web Speech API, testing is best done manually in a browser:

1. Run `npm run dev`.
2. Open Chrome or Edge.
3. Use the **Interactive Marquee** to test command routing without speaking.
4. Use the console to monitor `ProcessedCommand` objects from `commandProcessor.ts`.

## 🛠️ Performance Optimization

- **Rerenders**: Most state is centralized in `useAssistant`. Avoid putting heavy logic inside components that rerender frequently (like the `ArcReactor`).
- **Audio**: Procedural sounds are generated on the fly. Don't trigger too many sound effects simultaneously to avoid audio clipping.

---
*See [ARCHITECTURE.md](ARCHITECTURE.md) for data flow diagrams.*
