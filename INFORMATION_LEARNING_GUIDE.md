# SOFIYA Information & Learning Guide

## 📰 News Curation

### Setting Up News Service

```javascript
import { NewsService } from './integrations/news-service.js';

const news = new NewsService({
    db: dbConnection,
    apiKey: process.env.NEWS_API_KEY
});

await news.initialize();

// Set user interests
await news.setUserInterests('user123', ['tech', 'sports', 'business']);
```

### Getting Personalized News

```javascript
// Get personalized news feed
const articles = await news.getPersonalizedNews('user123', {
    maxArticles: 10,
    perspective: 'factual' // Optional: 'conservative', 'liberal', 'factual'
});

// Get daily digest
const digest = await news.getDailyDigest('user123');
// Returns: { articles: [...], summary: '...', topics: [...] }
```

### Searching News

```javascript
// Search for specific topics
const results = await news.searchNews('artificial intelligence', {
    pageSize: 20,
    sortBy: 'relevancy'
});
```

### Fetching News by Category

```javascript
// Get news by category
const techNews = await news.fetchNews({
    category: 'technology',
    country: 'us',
    pageSize: 10
});
```

---

## 🔗 Knowledge Integration

### Finding Related Information

```javascript
import { KnowledgeIntegrator } from './backend/knowledge-integrator.js';

const integrator = new KnowledgeIntegrator({ db });
await integrator.initialize();

// Find related information for a topic
const related = await integrator.findRelatedInformation('Artificial Intelligence', {
    types: ['wikipedia', 'maps', 'videos', 'documents']
});

// Returns:
// {
//   topic: 'Artificial Intelligence',
//   wikipedia: { title: '...', extract: '...', url: '...' },
//   maps: [...],
//   videos: [...],
//   documents: [...],
//   historicalContext: {...},
//   relatedTopics: [...]
// }
```

### Surfacing Related Info When Reading

```javascript
// When user reads an article, surface related content
const related = await integrator.surfaceRelatedInfo(
    'user123',
    'Machine Learning',
    'news'
);

// Returns related info + connections to previously read topics + suggestions
```

### Getting Wikipedia Articles

```javascript
// Get Wikipedia article directly
const article = await integrator.getWikipediaArticle('Quantum Computing');
// Returns: { title: '...', extract: '...', url: '...', thumbnail: '...' }
```

---

## 📚 Learning Pathways

### Creating Learning Paths

```javascript
import { LearningEngine } from './backend/learning-engine.js';

const learning = new LearningEngine({ db });
await learning.initialize();

// Assess knowledge level first
const assessment = await learning.assessKnowledgeLevel('user123', 'Machine Learning');
// Returns: { score: 45, level: 'beginner', questions: [...], answers: [...] }

// Create personalized learning path
const path = await learning.createLearningPath(
    'user123',
    'Machine Learning',
    '7days', // or '30days'
    'beginner' // Optional: will assess if not provided
);

// Returns:
// {
//   pathId: 'path_...',
//   topic: 'Machine Learning',
//   level: 'beginner',
//   duration: '7days',
//   path: [
//     { day: 1, step: 1, title: '...', type: 'video', content: {...}, ... },
//     { day: 1, step: 2, title: '...', type: 'article', ... },
//     ...
//   ]
// }
```

### Tracking Progress

```javascript
// Mark step as completed
const progress = await learning.trackProgress(path.pathId, 1);
// Returns: { progress: 14.3, completedSteps: 1, totalSteps: 7, nextStep: {...} }

// Get all user's learning paths
const userPaths = await learning.getUserProgress('user123');
```

### Adjusting Difficulty

```javascript
// Adjust path based on performance
const adjustedPath = await learning.adjustDifficulty(path.pathId, {
    averageScore: 75,
    averageTime: 0.8 // 80% of estimated time
});
```

---

## 🗣️ Voice Commands

### News Commands

- "What's the news today?" → `getDailyDigest()`
- "Show me tech news" → `fetchNews({ category: 'technology' })`
- "Search for AI news" → `searchNews('artificial intelligence')`
- "Set my news interests to tech and sports" → `setUserInterests(['tech', 'sports'])`

### Knowledge Commands

- "Tell me more about [topic]" → `findRelatedInformation(topic)`
- "Show me Wikipedia article on [topic]" → `getWikipediaArticle(topic)`
- "What's related to [topic]?" → `surfaceRelatedInfo(userId, topic, source)`

### Learning Commands

- "Create a learning path for [topic]" → `createLearningPath(userId, topic)`
- "Assess my knowledge of [topic]" → `assessKnowledgeLevel(userId, topic)`
- "Mark step [N] as complete" → `trackProgress(pathId, stepNumber)`
- "Show my learning progress" → `getUserProgress(userId)`

---

## 🔗 Integration with Command Router

```javascript
// In command-router.js
async handleNews(entities, context) {
    const { category, search } = entities;
    
    if (search) {
        const articles = await this.services.news.searchNews(search);
        return { status: 'success', service: 'news', data: articles };
    }
    
    if (category) {
        const articles = await this.services.news.fetchNews({ category });
        return { status: 'success', service: 'news', data: articles };
    }
    
    // Default: personalized news
    const articles = await this.services.news.getPersonalizedNews(context.userId);
    return { status: 'success', service: 'news', data: articles };
}

async handleLearning(entities, context) {
    const { topic, action } = entities;
    
    if (action === 'create_path') {
        const path = await this.services.learning.createLearningPath(
            context.userId,
            topic
        );
        return { status: 'success', service: 'learning', data: path };
    }
    
    if (action === 'assess') {
        const assessment = await this.services.learning.assessKnowledgeLevel(
            context.userId,
            topic
        );
        return { status: 'success', service: 'learning', data: assessment };
    }
}
```

---

## 📊 Database Schema

### Reading History Table

```sql
CREATE TABLE reading_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    topic VARCHAR(255) NOT NULL,
    source VARCHAR(50) NOT NULL,
    read_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_reading_history_user ON reading_history(user_id);
CREATE INDEX idx_reading_history_topic ON reading_history(topic);
```

### Knowledge Assessments Table

```sql
CREATE TABLE knowledge_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    topic VARCHAR(255) NOT NULL,
    score DECIMAL NOT NULL,
    level VARCHAR(20) NOT NULL,
    assessed_at TIMESTAMP DEFAULT NOW()
);
```

### Learning Paths Table

```sql
CREATE TABLE learning_paths (
    path_id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    topic VARCHAR(255) NOT NULL,
    path_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Learning Progress Table

```sql
CREATE TABLE learning_progress (
    path_id VARCHAR(255) NOT NULL,
    step_number INTEGER NOT NULL,
    progress DECIMAL NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (path_id, step_number)
);
```

---

## 🎯 Best Practices

1. **News Personalization**: Set user interests early for better curation
2. **Knowledge Integration**: Automatically surface related content when user reads articles
3. **Learning Paths**: Start with assessment to create appropriate difficulty level
4. **Progress Tracking**: Regularly track progress to adjust learning paths
5. **Content Variety**: Mix videos, articles, quizzes, and projects for engagement

---

## 📚 Further Reading

- `news-service.js` - News curation and personalization
- `knowledge-integrator.js` - Knowledge linking and discovery
- `learning-engine.js` - Adaptive learning pathways
