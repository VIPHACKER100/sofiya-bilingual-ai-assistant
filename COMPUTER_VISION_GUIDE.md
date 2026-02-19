# SOFIYA Computer Vision & AR Guide

## 📷 Vision Service

### Item Recognition

Find items using camera:

```javascript
import { VisionService } from './integrations/vision-service.js';

const vision = new VisionService({ db: dbConnection });
await vision.initialize();

// Process camera frame
const detections = await vision.processImage(cameraFrame, 'kitchen');
// Returns: [{ class: 'keys', confidence: 0.85, bbox: [...], location: 'kitchen' }]

// Find specific item
const location = await vision.findItem('keys', 'user123');
// Returns: { item: 'keys', location: 'kitchen', lastSeen: '2026-02-19T...', confidence: 0.85 }

// Scan fridge
const fridgeItems = await vision.scanFridge(fridgeImage);
// Returns: [{ name: 'milk', quantity: 1 }, { name: 'eggs', quantity: 6 }]

// Continuous monitoring
vision.startMonitoring((detection) => {
    console.log(`Found ${detection.class} at ${detection.location}`);
}, 5000); // Check every 5 seconds
```

### Trackable Items

Default items tracked:
- keys, wallet, phone, remote, glasses, watch
- backpack, laptop, book, pen, umbrella, bag

---

## 📄 Document Scanning

### Receipt Scanning

```javascript
import { DocumentScanner } from './integrations/document-scanner.js';

const scanner = new DocumentScanner({ db: dbConnection });

// Scan receipt
const receipt = await scanner.scanReceipt(receiptImage, 'user123');
// Returns: {
//   type: 'receipt',
//   merchant: 'Coffee Shop',
//   date: '02/19/2026',
//   amount: 12.50,
//   total: 13.50,
//   tax: 1.00,
//   items: [{ name: 'Coffee', price: 4.50 }, ...],
//   scannedAt: '...'
// }

// Expense automatically created if enabled
```

### Invoice Scanning

```javascript
const invoice = await scanner.scanInvoice(invoiceImage);
// Returns: {
//   type: 'invoice',
//   invoiceNumber: 'INV-12345',
//   vendor: 'Company Name',
//   date: '02/01/2026',
//   dueDate: '02/15/2026',
//   amount: 500.00,
//   lineItems: [...]
// }
```

### QR Code Scanning

```javascript
const qrCode = await scanner.scanQRCode(qrImage);
// Returns: {
//   type: 'qr_code',
//   data: 'https://example.com',
//   format: 'QR_CODE'
// }

// Can trigger actions based on QR content
if (qrCode.data.startsWith('http')) {
    // Open URL
} else if (qrCode.data.startsWith('sofiya:')) {
    // Execute SOFIYA command
}
```

### Whiteboard Scanning

```javascript
const whiteboard = await scanner.scanWhiteboard(whiteboardImage);
// Returns: {
//   type: 'whiteboard',
//   text: 'Full OCR text...',
//   structured: {
//     bullets: ['Item 1', 'Item 2'],
//     numbered: ['Step 1', 'Step 2'],
//     headings: ['TITLE'],
//     plain: ['Regular text']
//   }
// }
```

### Expense History

```javascript
const expenses = await scanner.getExpenseHistory('user123', 30); // Last 30 days
// Returns array of expense records
```

---

## 👤 Facial Recognition

### Training Face Model

```javascript
import { FacialRecognition } from './integrations/facial-recognition.js';

const faceRec = new FacialRecognition({ db: dbConnection });
await faceRec.initialize();

// Train face embedding (10-20 images)
const embeddingId = await faceRec.trainFaceEmbedding('user123', faceImages);
// Images are processed, embeddings stored (not images)
```

### Recognizing Faces

```javascript
// Recognize face in camera frame
const recognized = await faceRec.recognizeFace(cameraImage);

if (recognized) {
    console.log(`Recognized: ${recognized.name} (confidence: ${recognized.confidence})`);
    // Switch to recognized user's profile
    await switchUserProfile(recognized.userId);
}

// Real-time recognition
faceRec.startRecognition((recognized) => {
    console.log('Face recognized:', recognized);
    // Auto-switch profile
}, 1000); // Check every second
```

### Privacy Controls

```javascript
// Disable facial recognition for user
await faceRec.setEnabled('user123', false);

// Delete face embedding (privacy)
await faceRec.deleteEmbedding('user123');
```

---

## 🥽 Augmented Reality Interface

### AR Translation Overlay

```javascript
import ARInterface from './frontend/ar/ARInterface.jsx';

// In React component
<ARInterface 
    enabled={true}
    features={{
        translation: true,
        notifications: true,
        deviceControls: true,
        navigation: true
    }}
/>

// Add translation overlay
addTranslationOverlay('Exit', { x: 100, y: 200, z: 0 }, 'hi');
// Overlays "निकास" on sign in AR view
```

### AR Device Controls

```javascript
// Show smart home device controls in AR
addDeviceControlOverlay(
    { id: 'lamp_1', name: 'Living Room Light', state: 'on' },
    { x: 150, y: 300, z: -1 }
);
// Shows control button floating near actual device
```

### AR Navigation

```javascript
// Show navigation arrows
addNavigationOverlay('Kitchen', { x: 200, y: 400, z: -2 });
// Displays arrow pointing to kitchen
```

### AR Notifications

```javascript
// Show notification in AR space
addNotificationOverlay(
    'Reminder: Meeting in 15 minutes',
    { x: 50, y: 100, z: 0 },
    5000 // 5 second duration
);
```

---

## 🔧 Integration Examples

### "Where are my keys?" Feature

```javascript
// User asks: "Where are my keys?"
const location = await vision.findItem('keys', userId);

if (location) {
    // Show in AR or respond
    responseFormatter.format({
        service: 'vision',
        action: 'find_item',
        data: {
            item: 'keys',
            location: location.location,
            lastSeen: location.lastSeen
        }
    });
    // "Your keys were last seen in the kitchen 5 minutes ago"
} else {
    // "I haven't seen your keys recently. Let me scan the current room..."
    const detections = await vision.processImage(currentCameraFrame, 'current_room');
    // Check if keys detected
}
```

### Fridge Inventory Management

```javascript
// Scan fridge
const items = await vision.scanFridge(fridgeImage);

// Suggest recipes based on available ingredients
const recipes = await recipeService.suggestRecipes(items.map(i => i.name));

// Generate shopping list for missing ingredients
const shoppingList = await recipeService.getShoppingList(recipes[0], items);
```

### Receipt Auto-Expense

```javascript
// User takes photo of receipt
const receipt = await scanner.scanReceipt(receiptImage, userId);

// Expense automatically created
// User can review and categorize later

// Get expense summary
const expenses = await scanner.getExpenseHistory(userId, 30);
const total = expenses.reduce((sum, e) => sum + e.amount, 0);
// "You've spent $450 this month"
```

---

## 🎯 Use Cases

### Spatial Awareness
- "Where are my keys?" → Camera scans room, finds keys
- "What's in the fridge?" → Scans fridge, lists items
- "Is my laptop on my desk?" → Scans workspace, confirms

### Expense Tracking
- Take photo of receipt → Auto-creates expense record
- Scan invoice → Extracts vendor, amount, due date
- Monthly summary → "You spent $X this month"

### Multi-User Household
- Face detected → Auto-switch to that user's profile
- Privacy enforced → Each user only sees their data
- Guest mode → Limited access for visitors

### AR Assistance
- Travel → Overlay translations on signs
- Navigation → Arrows on floor pointing to destination
- Smart Home → Device controls visible in room
- Notifications → Floating reminders in AR space

---

## 🔒 Privacy & Security

### Vision Service
- ✅ Images processed locally when possible
- ✅ Only item locations stored, not images
- ✅ User can disable item tracking
- ✅ Location data encrypted

### Facial Recognition
- ✅ Opt-in only
- ✅ Only embeddings stored, not images
- ✅ User can delete embeddings anytime
- ✅ No sharing between users

### Document Scanning
- ✅ Receipts: Full data stored (for expense tracking)
- ✅ IDs: Only contact info extracted (optional)
- ✅ User can delete scanned documents
- ✅ OCR text can be redacted

---

## 📚 Further Reading

- `vision-service.js` - Full vision implementation
- `document-scanner.js` - Document scanning and OCR
- `facial-recognition.js` - Face recognition
- `frontend/ar/ARInterface.jsx` - AR overlay component
