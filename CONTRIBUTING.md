# 🤝 Contributing to SOFIYA

Thank you for your interest in contributing! Here's everything you need to know.

---

## Development Setup

```bash
git clone https://github.com/VIPHACKER100/sofiya-bilingual-ai-assistant.git
cd sofiya-bilingual-ai-assistant
npm install
cp .env.example .env.local  # Add your API key
npm run dev
```

---

## Project Structure

```
services/          — Core logic (commandProcessor, voiceService, etc.)
components/        — React UI components
types.ts           — Shared TypeScript interfaces & enums
constants.ts       — App-wide constants
App.tsx            — Root component & state
```

---

## Adding a New Voice Command

1. **Add intent rule** in `commandProcessor.ts` — use a regex pattern:

   ```typescript
   if (lowerText.match(/\b(your|trigger|words)\b/)) {
     return createResponse('YOUR_ACTION_TYPE', isHindi ? 'Hindi response' : 'English response', data);
   }
   ```

2. **Handle the action** in `App.tsx` inside `handleCommandResult()`:

   ```typescript
   else if (result.actionType === 'YOUR_ACTION_TYPE') {
     // update state, show widget, etc.
   }
   ```

3. **Add Hindi vocabulary** if needed — update `HINDI_STRONG_WORDS` or `HINDI_COMMON_WORDS` in `commandProcessor.ts`

4. **Document it** in [COMMANDS.md](COMMANDS.md)

---

## Adding Hindi Vocabulary

Open `commandProcessor.ts` and add words to the appropriate set:

- `HINDI_STRONG_WORDS` — command verbs and question words (high weight, +3.0)
- `HINDI_COMMON_WORDS` — nouns, particles, pronouns (moderate weight, +1.0)

---

## Code Style

- **TypeScript strict** typing where possible
- Prefer `const` over `let`
- Keep components under 200 lines — extract sub-components for complex UI
- Use descriptive intent names (`WEATHER_FETCH` not `WF`)
- All user-facing strings must have both `en` and `hi` variants

---

## Pull Request Guidelines

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Test in Chrome (Web Speech API required)
5. Update [CHANGELOG.md](CHANGELOG.md) under `[Unreleased]`
6. Submit a PR with a clear description

---

## Reporting Bugs

Open an issue with:

- What you said (exact command)
- What happened vs. what you expected
- Browser & OS version
- Console errors (if any)

---

## License

By contributing, you agree your code will be licensed under the MIT License.
