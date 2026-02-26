# SOFIYA Smart Home Guide (v5.1.0)

## 🏠 Overview

SOFIYA integrates with Google Home, Amazon Alexa, and IFTTT for comprehensive smart home control.

---

## 🔌 Platform Connectors

### Google Home

```javascript
import { GoogleHomeConnector } from './integrations/google-home-connector.js';

const googleHome = new GoogleHomeConnector({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET
});

// Get authorization URL
const authUrl = googleHome.getAuthUrl();
// User visits URL, authorizes, gets code

// Exchange code for tokens
const tokens = await googleHome.exchangeCode(authCode);

// Discover devices
const devices = await googleHome.discoverDevices();
// Returns: [{ id: 'light_living_room', type: 'light', name: 'Living Room Light', ... }]

// Control device
await googleHome.controlDevice('light_living_room', 'action.devices.commands.OnOff', true);
await googleHome.controlDevice('light_living_room', 'action.devices.commands.BrightnessAbsolute', 80);

// Get device status
const status = await googleHome.getDeviceStatus('light_living_room');
```

### Amazon Alexa

```javascript
import { AlexaConnector } from './integrations/alexa-connector.js';

const alexa = new AlexaConnector({
    clientId: process.env.ALEXA_CLIENT_ID,
    clientSecret: process.env.ALEXA_CLIENT_SECRET
});

await alexa.initialize();

// Discover devices
const devices = await alexa.discoverDevices();

// Control device
await alexa.controlDevice('alexa_light_1', 'turnOn');
await alexa.controlDevice('alexa_light_1', 'setBrightness', 75);
```

### IFTTT

```javascript
import { IFTTTConnector } from './integrations/ifttt-connector.js';

const ifttt = new IFTTTConnector({
    webhookKey: process.env.IFTTT_WEBHOOK_KEY
});

await ifttt.initialize();

// Trigger webhook
await ifttt.triggerWebhook('sofiya_notification', {
    value1: 'Hello from SOFIYA!'
});

// Control device via IFTTT
await ifttt.controlDevice('living_room_lights', 'on');

// Trigger scene
await ifttt.triggerScene('movie_night');
```

---

## 🎬 Scene Manager

### Pre-Built Scenes

SOFIYA includes 8 pre-built scenes:

1. **Movie Night**
   - Dims lights to 20%
   - Closes blinds
   - Sets thermostat to 68°F
   - Turns on TV
   - Mutes notifications

2. **Good Morning**
   - Turns on bedroom lights (80% brightness)
   - Sets thermostat to 72°F
   - Opens blinds
   - Plays morning music

3. **Focus Work**
   - Bright lights (100%)
   - Cool white color
   - Mutes notifications
   - Closes blinds

4. **Bedtime**
   - Turns off living room lights
   - Dims bedroom lights (10%)
   - Warm white color
   - Sets thermostat to 65°F
   - Closes blinds
   - Plays sleep sounds

5. **Party Mode**
   - Bright colorful lights
   - Plays party music
   - Sets comfortable temperature

6. **Relax**
   - Dim warm lights (40%)
   - Plays relaxing music
   - Comfortable temperature

7. **Away Mode**
   - Turns off all lights
   - Arms security system
   - Closes blinds

8. **Arriving Home**
   - Turns on lights (60%)
   - Sets thermostat to 72°F
   - Disarms security
   - Plays welcome sound

### Using Scenes

```javascript
import { SceneManager } from './backend/scene-manager.js';

const sceneManager = new SceneManager({
    db: dbConnection,
    googleHome: googleHomeConnector,
    alexa: alexaConnector,
    ifttt: iftttConnector
});

// Execute pre-built scene
const result = await sceneManager.executeScene('movie_night', 'user123');
// Returns: { sceneId, sceneName, executed, failed, results, errors }

// Get all available scenes
const scenes = await sceneManager.getAllScenes('user123');
// Returns: [{ id, name, description, type: 'pre-built' | 'custom', ... }]
```

### Creating Custom Scenes

```javascript
// Create custom scene
await sceneManager.createScene(
    'user123',
    'my_custom_scene',
    'My Custom Scene',
    'Description of what this scene does',
    [
        { service: 'google_home', device: 'light_living_room', command: 'turn_on', value: true },
        { service: 'google_home', device: 'light_living_room', command: 'set_brightness', value: 50 },
        { service: 'ifttt', action: 'play_music', value: 'jazz' }
    ],
    true // atomic execution
);

// Execute custom scene
await sceneManager.executeScene('my_custom_scene', 'user123');
```

---

## 🎛️ Device Controller

### Unified Device Control

```javascript
import { DeviceController } from './integrations/device-controller.js';

const controller = new DeviceController({
    googleHome: googleHomeConnector,
    alexa: alexaConnector,
    ifttt: iftttConnector
});

await controller.initialize();

// Control device by friendly name
await controller.controlDevice('living room light', 'turn_on', true);
await controller.controlDevice('thermostat', 'set_temperature', 72);
await controller.controlDevice('lights', 'set_brightness', 80);

// Get device status
const status = await controller.getDeviceStatus('living room light');

// Get all devices
const allDevices = controller.getAllDevices();

// Get devices by type
const lights = controller.getDevicesByType('light');
```

### Supported Actions

- **turn_on** / **turn_off** - Power control
- **toggle** - Toggle power state
- **set_brightness** - Set brightness (0-100)
- **set_temperature** - Set temperature (Fahrenheit)
- **set_volume** - Set volume (0-100)
- **set_color** - Set color (via IFTTT)

---

## 🗣️ Voice Commands

### Device Control

- "Turn on the lights" → `controlDevice('lights', 'turn_on')`
- "Dim the bedroom light to 30%" → `controlDevice('bedroom light', 'set_brightness', 30)`
- "Set thermostat to 70 degrees" → `controlDevice('thermostat', 'set_temperature', 70)`
- "Turn off the TV" → `controlDevice('tv', 'turn_off')`

### Scene Activation

- "Movie night" → `executeScene('movie_night')`
- "Good morning" → `executeScene('good_morning')`
- "Focus mode" → `executeScene('focus_work')`
- "Bedtime" → `executeScene('bedtime')`
- "Party mode" → `executeScene('party_mode')`
- "Relax" → `executeScene('relax')`
- "I'm leaving" → `executeScene('away_mode')`
- "I'm home" → `executeScene('arriving_home')`

---

## 🔧 Integration with Command Router

The smart home features are integrated into the command router:

```javascript
// In command-router.js
async handleDeviceControl(entities, context) {
    const device = entities.device || 'lights';
    const action = entities.action || 'toggle';
    const value = entities.value || null;

    const result = await this.services.smartHome.controlDevice(device, action, value);
    return {
        status: 'success',
        service: 'smart-home',
        action: 'control',
        data: { device, action, value, state: result.state }
    };
}

async handleSmartHomeScene(entities, context) {
    const sceneName = entities.scene || 'movie_night';
    const result = await this.services.smartHome.executeScene(sceneName);
    return {
        status: 'success',
        service: 'smart-home',
        action: 'scene',
        data: { scene: sceneName, devices: result.devices }
    };
}
```

---

## 📊 Scene Execution Results

```javascript
const result = await sceneManager.executeScene('movie_night', 'user123');

// Result structure:
{
    sceneId: 'movie_night',
    sceneName: 'Movie Night',
    executed: 6, // Number of actions executed
    failed: 0,   // Number of failed actions
    results: [
        { deviceId: 'light_living_room', command: 'set_brightness', status: 'success', ... },
        { service: 'ifttt', action: 'close_blinds', status: 'success', ... },
        // ... more results
    ],
    errors: [], // Any errors encountered
    timestamp: '2026-02-19T...'
}
```

---

## 🛡️ Error Handling

### Atomic Execution

If a scene is marked as `atomic: true`, all actions must succeed or the scene is rolled back:

```javascript
// Create atomic scene
await sceneManager.createScene(
    'user123',
    'critical_scene',
    'Critical Scene',
    'All actions must succeed',
    [...actions],
    true // atomic = true
);

// If any action fails, all previous actions are reversed
try {
    await sceneManager.executeScene('critical_scene', 'user123');
} catch (error) {
    // Scene was rolled back
    console.error('Scene failed and was rolled back:', error);
}
```

### Command Queue

Multiple device control requests are automatically queued:

```javascript
// These will be executed sequentially
await controller.controlDevice('light1', 'turn_on');
await controller.controlDevice('light2', 'turn_on');
await controller.controlDevice('light3', 'turn_on');
```

---

## 🔐 Security & Privacy

- ✅ OAuth2 authentication for Google Home and Alexa
- ✅ API keys stored securely (environment variables)
- ✅ User-specific device access
- ✅ Scene execution logging for audit
- ✅ No device credentials stored in plain text

---

## 📚 Further Reading

- `google-home-connector.js` - Google Home integration
- `alexa-connector.js` - Alexa integration
- `ifttt-connector.js` - IFTTT webhook integration
- `scene-manager.js` - Scene orchestration
- `device-controller.js` - Unified device control

---

## 🚀 Standalone Demo Features (`sofiya-assistant.html`)

The standalone demo simulates smart home states locally within the UI:

- **Mock Lights**: "Turn on lights" / "बत्ती जलाओ"
- **Mock Scenes**: "Movie night" / "मूवी" (Dims lights + sets UI theme)
- **Visual Feedback**: The command log and spoken response confirm the state change.
- **Prototypes**: Demonstrates intent mapping without needing physical hardware.
