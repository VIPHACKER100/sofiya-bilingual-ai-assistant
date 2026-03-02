# 📦 Household IQ — Shared Inventory & Knowledge Guide

Household IQ is SOFIYA's collective intelligence module designed to track shared physical resources and general household knowledge.

## 🌟 Key Features

1. **Shared Inventory**: Track the location of important items (keys, tools, documents).
2. **Room Mapping**: Record where everything belongs.
3. **Last Seen Tracking**: Automatic (or manual) timestamping for item movements.
4. **Bilingual Intelligence**: Full support for English and Hindi queries.

---

## 🗣️ Voice Commands

### 🔍 Finding Items

- **EN**: "Where are the car keys?" / "Find my wallet."
- **HI**: "कार की चाबियाँ कहाँ हैं?" / "मेरा वॉलेट ढूँढो।"

### 💾 Recording Locations

- **EN**: "Remember that the marriage certificate is in the blue folder."
- **HI**: "याद रखो कि मैरिज सर्टिफिकेट नीली फाइल में है।"

### 📋 Listing Knowledge

- **EN**: "Show all household items." / "List inventory."
- **HI**: "घर का सामान दिखाओ।" / "इन्वेंट्री दिखाओ।"

---

## 🖱️ Manual Interaction

If you prefer not to use voice, you can interact directly with the **Household Widget**:

1. Open the **Household IQ** panel (Home icon).
2. Click the **SCAN_INVENTORY** button.
3. **Bilingual Prompt**: SOFIYA will ask for the **Item Name** and **Location** in your current language.
4. The item is immediately synced to the household database and visible to all authorized family members.

---

## 🛠️ Configuration & Security

- **Data Source**: Items are stored in the PostgreSQL `item_locations` table.
- **Privacy**: Only authorized members of the primary household profile can access the inventory list.
- **Bridge Integration**: The system bridge helps verify physical locations if connected to smart tags or OCR-enabled cameras.

---

## 💡 Pro Tips

- **Natural Verbs**: Use verbs like "Remember", "Save", "Track", "Find", "Where is".
- **Hindi Synonyms**: SOFIYA understands synonyms like `किधर`, `कहाँ`, `मिलेगा`.
- **Default Rooms**: If no room is specified, SOFIYA defaults to the "Living Room".

---

*Last Updated: March 2026 | SOFIYA v5.6.0*
