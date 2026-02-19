# SOFIYA Health & Wellness Guide

## 🏃 Wearable Integration

### Fitbit

```javascript
import { FitbitConnector } from './integrations/fitbit-connector.js';

const fitbit = new FitbitConnector({
    clientId: process.env.FITBIT_CLIENT_ID,
    clientSecret: process.env.FITBIT_CLIENT_SECRET
});

await fitbit.initialize();

// Get authorization URL
const authUrl = fitbit.getAuthUrl();
// User visits URL, authorizes, gets code

// Exchange code for tokens
const tokens = await fitbit.exchangeCode(authCode);

// Get daily data
const steps = await fitbit.getSteps('today');
const sleep = await fitbit.getSleepData('today');
const heartRate = await fitbit.getHeartRate('today');
const weight = await fitbit.getWeight('today');

// Sync all health data
const healthData = await fitbit.syncHealthData('user123', 'today');
```

### Google Fit

```javascript
import { GoogleFitConnector } from './integrations/google-fit-connector.js';

const googleFit = new GoogleFitConnector({
    clientId: process.env.GOOGLE_FIT_CLIENT_ID,
    clientSecret: process.env.GOOGLE_FIT_CLIENT_SECRET
});

await googleFit.initialize();

// Get authorization URL
const authUrl = googleFit.getAuthUrl();

// Exchange code for tokens
const tokens = await googleFit.exchangeCode(authCode);

// Get health data
const steps = await googleFit.getSteps('today');
const heartRate = await googleFit.getHeartRate('today');
const sleep = await googleFit.getSleepData('today');
const weight = await googleFit.getWeight('today');
```

### Apple HealthKit

```javascript
import { AppleHealthConnector } from './integrations/apple-health-connector.js';

const appleHealth = new AppleHealthConnector();

await appleHealth.initialize();

// Receive data from iOS app via webhook
const data = await appleHealth.receiveHealthData({
    userId: 'user123',
    steps: 8500,
    heartRate: 72,
    sleep: { duration: 7.5, quality: 'good' },
    weight: 150
});
```

---

## 📊 Health Analytics

### Calculating Averages

```javascript
import { HealthAnalytics } from './backend/health-analytics.js';

const analytics = new HealthAnalytics({ db });

// Calculate rolling averages
const sleepAvg = await analytics.calculateRollingAverages('user123', 'sleep_hours', 7);
// Returns: { average: 7.2, trend: { direction: 'improving', change: 0.5, percentChange: 7.5 }, ... }

const stepsAvg = await analytics.calculateRollingAverages('user123', 'steps', 30);
```

### Detecting Anomalies

```javascript
// Detect anomalies in sleep patterns
const anomalies = await analytics.detectAnomalies('user123', 'sleep_hours', 2);
// Returns: [{ date: '2026-02-19', value: 4.5, expected: 7.2, deviation: 2.7, severity: 'high' }, ...]
```

### Correlating Behaviors

```javascript
// Correlate screen time with sleep quality
const correlations = await analytics.correlateBehaviors(
    'user123',
    'sleep_quality',
    ['screen_time', 'exercise_minutes', 'caffeine_intake']
);
// Returns: { correlations: [{ behavior: 'screen_time', outcome: 'sleep_quality', correlation: 'negative', ... }] }
```

### Generating Insights

```javascript
// Get comprehensive health summary with insights
const summary = await analytics.getHealthSummary('user123');
// Returns: {
//   metrics: { steps: {...}, sleep: {...}, heartRate: {...}, weight: {...} },
//   insights: [
//     { type: 'warning', metric: 'sleep', message: '...', recommendation: '...' },
//     { type: 'suggestion', metric: 'activity', message: '...', recommendation: '...' }
//   ]
// }
```

---

## 🧘 Wellness Guide

### Meditations

```javascript
import { WellnessGuide } from './backend/wellness-guide.js';

const wellness = new WellnessGuide();

// Get meditation by duration
const meditation = wellness.getMeditation('5min');
// Returns: { title: '5-Minute Body Scan', duration: 300, steps: [...] }

// Get stress relief meditation
const stressMeditation = wellness.getMeditation('stress_relief');

// Get all available meditations
const allMeditations = wellness.getAllMeditations();
```

### Breathing Exercises

```javascript
// Get 4-7-8 breathing exercise
const breathing = wellness.getBreathingExercise('478');
// Returns: {
//   name: '4-7-8 Breathing',
//   pattern: { inhale: 4, hold: 7, exhale: 8, cycles: 4 },
//   instructions: [...]
// }

// Get box breathing
const boxBreathing = wellness.getBreathingExercise('box');

// Get all breathing exercises
const allBreathing = wellness.getAllBreathingExercises();
```

### Bedtime Stories

```javascript
// Get bedtime story
const story = wellness.getBedtimeStory('ocean_waves');
// Returns: { title: 'Ocean Waves', story: [...], duration: 600 }

// Get all bedtime stories
const allStories = wellness.getAllBedtimeStories();
```

### Stress-Based Suggestions

```javascript
// Get suggestion based on stress level
const suggestion = wellness.suggestActivity(7, { timeOfDay: 'afternoon' });
// Returns: {
//   type: 'meditation',
//   activity: {...},
//   message: 'A quick meditation can help reduce stress.',
//   priority: 'medium'
// }
```

---

## 🥗 Nutrition Service

### Fridge Inventory

```javascript
import { NutritionService } from './integrations/nutrition-service.js';

const nutrition = new NutritionService({ db });

// Scan fridge (from camera or manual input)
await nutrition.scanFridge('user123', [
    'chicken', 'broccoli', 'rice', 'soy sauce', 'eggs', 'bacon'
]);

// Get current inventory
const inventory = await nutrition.getFridgeInventory('user123');
```

### Recipe Suggestions

```javascript
// Suggest recipes based on available ingredients
const suggestions = await nutrition.suggestRecipes('user123', {
    cuisine: 'Asian',
    dietaryRestrictions: ['gluten'] // Will filter out gluten-containing recipes
});
// Returns: [
//   {
//     name: 'Chicken Stir Fry',
//     matchScore: 0.85,
//     missingIngredients: ['ginger', 'garlic'],
//     calories: 380,
//     ...
//   },
//   ...
// ]
```

### Shopping Lists

```javascript
// Generate shopping list for a recipe
const shoppingList = await nutrition.generateShoppingList('user123', 'chicken_stir_fry');
// Returns: {
//   recipeName: 'Chicken Stir Fry',
//   items: ['ginger', 'garlic'],
//   ...
// }

// Get all shopping lists
const lists = await nutrition.getShoppingLists('user123');
```

### Dietary Restrictions

```javascript
// Set dietary restrictions
await nutrition.setDietaryRestrictions('user123', ['gluten', 'dairy']);

// Recipes will be filtered based on restrictions
```

### Grocery Delivery

```javascript
// Order groceries via delivery service
const order = await nutrition.orderGroceryDelivery(
    'user123',
    ['ginger', 'garlic', 'broccoli'],
    'amazon_fresh'
);
// Returns: { success: true, orderId: '...', estimatedDelivery: '...' }
```

---

## 🗣️ Voice Commands

### Health Data

- "How many steps did I take today?" → `getSteps('today')`
- "What's my sleep quality?" → `getSleepData('today')`
- "Show my heart rate" → `getHeartRate('today')`
- "Sync my health data" → `syncHealthData()`

### Wellness

- "Guide me through a 5-minute meditation" → `getMeditation('5min')`
- "Help me with breathing exercises" → `getBreathingExercise('478')`
- "Tell me a bedtime story" → `getBedtimeStory('ocean_waves')`
- "I'm stressed, what should I do?" → `suggestActivity(stressLevel)`

### Nutrition

- "What can I cook with what's in my fridge?" → `suggestRecipes()`
- "Generate a shopping list for pasta carbonara" → `generateShoppingList()`
- "Order groceries from Instacart" → `orderGroceryDelivery()`
- "Set my dietary restrictions to gluten-free" → `setDietaryRestrictions()`

---

## 🔗 Integration with Command Router

```javascript
// In command-router.js
async handleHealth(entities, context) {
    const { metric, date } = entities;
    
    const healthData = await this.services.fitbit.getSteps(date || 'today');
    
    return {
        status: 'success',
        service: 'health',
        action: 'query',
        data: healthData
    };
}

async handleWellness(entities, context) {
    const { activity, stressLevel } = entities;
    
    if (activity === 'meditation') {
        const meditation = this.services.wellness.getMeditation('5min');
        return { status: 'success', service: 'wellness', data: meditation };
    }
    
    if (stressLevel) {
        const suggestion = this.services.wellness.suggestActivity(stressLevel, context);
        return { status: 'success', service: 'wellness', data: suggestion };
    }
}
```

---

## 📊 Database Schema

### Health Data Table

```sql
CREATE TABLE health_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    metric VARCHAR(50) NOT NULL,
    value DECIMAL NOT NULL,
    date DATE NOT NULL,
    source VARCHAR(50), -- 'fitbit', 'google_fit', 'apple_health'
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_health_data_user_metric ON health_data(user_id, metric);
CREATE INDEX idx_health_data_date ON health_data(date);
```

### Fridge Inventory Table

```sql
CREATE TABLE fridge_inventory (
    user_id VARCHAR(255) PRIMARY KEY,
    items JSONB NOT NULL,
    scanned_at TIMESTAMP DEFAULT NOW()
);
```

### Shopping Lists Table

```sql
CREATE TABLE shopping_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    recipe_id VARCHAR(100),
    items JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🎯 Best Practices

1. **Health Data Sync**: Sync wearable data daily to maintain accurate analytics
2. **Wellness Timing**: Suggest meditations in the morning, breathing exercises during stress, bedtime stories in the evening
3. **Recipe Matching**: Update fridge inventory regularly for better recipe suggestions
4. **Dietary Restrictions**: Set restrictions once and they'll be applied to all recipe suggestions
5. **Anomaly Alerts**: Monitor health anomalies and provide proactive recommendations

---

## 📚 Further Reading

- `fitbit-connector.js` - Fitbit integration
- `google-fit-connector.js` - Google Fit integration
- `apple-health-connector.js` - Apple HealthKit integration
- `health-analytics.js` - Health data analysis
- `wellness-guide.js` - Wellness content
- `nutrition-service.js` - Meal planning and nutrition
