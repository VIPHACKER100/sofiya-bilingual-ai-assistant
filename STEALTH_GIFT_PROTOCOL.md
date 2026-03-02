# 🎁 Stealth Gift Protocol — Privacy-First Social Tracking

The Stealth Gift Protocol is a specialized social intelligence module designed to help you track gift ideas for friends and family without spoiling the surprise.

## 🛡️ Privacy & Stealth Features

- **Automatic Sanitization**: If the target of a gift (e.g., "Sarah") is currently logged in or using the device, the gift idea will be **hidden** from the UI.
- **Secure Storage**: Ideas are stored with a `hidden_from` metadata field containing the user IDs who should not see the entry.
- **Discreet Notifications**: Reminders about gifts are only delivered when the target person is confirmed to be away from the device.

---

## 🗣️ Voice Commands

### 💡 Saving Ideas

- **EN**: "Gift idea for Sarah: Smartwatch." / "Add gift for Dad: Blue tie."
- **HI**: "सारा के लिए गिफ्ट आइडिया: स्मार्टवॉच।" / "पापा के लिए नीली टाई का उपहार जोड़ो।"

### 📋 Reviewing the List

- **EN**: "Show my gift list." / "What should I buy for Sarah?"
- **HI**: "गिफ्ट लिस्ट दिखाओ।" / "सारा के लिए क्या खरीदना है?"

---

## 🖱️ Manual Interaction (Discreet Mode)

For maximum privacy, use the **Gifts Widget**:

1. Open the **Gifts** panel (Gift icon).
2. Click the **+ Add Idea** button.
3. Enter the idea in the prompt.
4. **Auto-Logic**: SOFIYA automatically maps the target contact based on the text (e.g., "for Sarah").

---

## 📊 Data Mapping

| Field | Description |
| --- | --- |
| `gift_idea` | The description of the item. |
| `price_estimate` | Projected cost (if specified). |
| `target_contact_id` | Links to the person the gift is for. |
| `hidden_from` | Array of User IDs who are restricted from seeing this entry. |

---

## ⚠️ Important Notes

- **Identity Switching**: Always ensure you are logged into your private profile when reviewing the gift list.
- **Bilingual Accuracy**: When using Hindi, ensure the name of the recipient is clear (e.g., "सारा के लिए...").
- **Sharing**: Gifts can be shared with other "co-conspirators" (other family members) by specifying their names.

---

*Last Updated: March 2026 | SOFIYA v5.6.0*
