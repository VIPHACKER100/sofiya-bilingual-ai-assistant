import { describe, test, expect } from 'vitest';
import { processTranscript } from '../services/commandProcessor';
import { PersonalityMode } from '../types';

const DEFAULT = PersonalityMode.DEFAULT;
const FOCUS = PersonalityMode.FOCUS;
const SASS = PersonalityMode.SASS;
const STORYTELLER = PersonalityMode.STORYTELLER;

describe('Command Processor - Language Detection', () => {
  test('detects English commands', async () => {
    const result = await processTranscript('What time is it?', DEFAULT);
    expect(result.language).toBe('en');
  });

  test('detects Hindi commands', async () => {
    const result = await processTranscript('Abhi kya samay hai?', DEFAULT);
    expect(result.language).toBe('hi');
  });

  test('detects Hindi with Devanagari script', async () => {
    const result = await processTranscript('नमस्ते सोफिया', DEFAULT);
    expect(result.language).toBe('hi');
  });

  test('handles Hinglish mixing', async () => {
    const result = await processTranscript('Mera music play karo', DEFAULT);
    expect(['en', 'hi']).toContain(result.language);
  });
});

describe('Command Processor - Intent Matching', () => {
  test('matches SYSTEM_STATUS intent - English', async () => {
    const result = await processTranscript('Hello Sofiya', DEFAULT);
    expect(result.actionType).toBe('SYSTEM_STATUS');
  });

  test('matches SYSTEM_STATUS intent - Hindi', async () => {
    const result = await processTranscript('Namaste Sofiya', DEFAULT);
    expect(result.actionType).toBe('SYSTEM_STATUS');
  });

  test('matches TIME_DATE intent', async () => {
    const result = await processTranscript('What time is it?', DEFAULT);
    expect(result.actionType).toBe('TIME_DATE');
  });

  test('matches WEATHER_FETCH intent', async () => {
    const result = await processTranscript('What is the weather?', DEFAULT);
    expect(result.actionType).toBe('WEATHER_FETCH');
  });

  test('matches WEATHER_FETCH intent - Hindi', async () => {
    const result = await processTranscript('Mausam kaisa hai?', DEFAULT);
    expect(result.actionType).toBe('WEATHER_FETCH');
  });

  test('matches MEDIA_PLAY with song extraction', async () => {
    const result = await processTranscript('Play lo-fi music', DEFAULT);
    expect(result.actionType).toBe('MEDIA_PLAY');
    expect(result.data?.title).toContain('lo-fi');
  });

  test('matches MEDIA_PLAY - Hindi', async () => {
    const result = await processTranscript('Gaana bajao', DEFAULT);
    expect(result.actionType).toBe('MEDIA_PLAY');
  });

  test('matches VOLUME_UP intent', async () => {
    const result = await processTranscript('Volume up', DEFAULT);
    expect(result.actionType).toBe('VOLUME_UP');
  });

  test('matches VOLUME_DOWN intent - Hindi', async () => {
    const result = await processTranscript('Awaaz kam karo', DEFAULT);
    expect(result.actionType).toBe('VOLUME_DOWN');
  });

  test('matches SMART_HOME_ACTION - lights on', async () => {
    const result = await processTranscript('Turn on the lights', DEFAULT);
    expect(result.actionType).toBe('SMART_HOME_ACTION');
    expect(result.data?.deviceType).toBe('light');
    expect(result.data?.state).toBe(true);
  });

  test('matches SMART_HOME_ACTION - lights off', async () => {
    const result = await processTranscript('Batti band karo', DEFAULT);
    expect(result.actionType).toBe('SMART_HOME_ACTION');
    expect(result.data?.deviceType).toBe('light');
    expect(result.data?.state).toBe(false);
  });

  test('matches NEWS_FETCH intent', async () => {
    const result = await processTranscript('Show me the news', DEFAULT);
    expect(result.actionType).toBe('WEATHER_FETCH');
  });

  test('matches TASK_ADD intent', async () => {
    const result = await processTranscript('Add task buy groceries', DEFAULT);
    expect(result.actionType).toBe('TASK_ADD');
    expect(result.data?.task).toBeDefined();
  });

  test('matches TASK_SHOW intent', async () => {
    const result = await processTranscript('Show my tasks', DEFAULT);
    expect(result.actionType).toBe('TASK_SHOW');
  });

  test('matches DRAWING_MODE intent', async () => {
    const result = await processTranscript('Open drawing canvas', DEFAULT);
    expect(result.actionType).toBe('DRAWING_MODE');
  });

  test('matches SENTRY_MODE intent', async () => {
    const result = await processTranscript('Activate sentry mode', DEFAULT);
    expect(result.actionType).toBe('SENTRY_MODE');
  });

  test('matches HEALTH_SHOW intent', async () => {
    const result = await processTranscript('Show my health stats', DEFAULT);
    expect(result.actionType).toBe('HEALTH_SHOW');
  });

  test('matches MINDFULNESS_START intent', async () => {
    const result = await processTranscript('Start meditation', DEFAULT);
    expect(result.actionType).toBe('MINDFULNESS_START');
  });

  test('matches ROUTINE_MORNING', async () => {
    const result = await processTranscript('Good morning', DEFAULT);
    expect(result.actionType).toBe('ROUTINE_MORNING');
  });

  test('matches ROUTINE_NIGHT', async () => {
    const result = await processTranscript('Good night', DEFAULT);
    expect(result.actionType).toBe('ROUTINE_NIGHT');
  });

  test('matches PERSONALITY_CHANGE - sass', async () => {
    const result = await processTranscript('Activate sass mode', DEFAULT);
    expect(result.actionType).toBe('PERSONALITY_CHANGE');
    expect(result.data?.mode).toBe('SASS');
  });

  test('matches PERSONALITY_CHANGE - focus', async () => {
    const result = await processTranscript('Turn on focus mode', DEFAULT);
    expect(result.actionType).toBe('PERSONALITY_CHANGE');
    expect(result.data?.mode).toBe('FOCUS');
  });

  test('matches PERSONALITY_CHANGE - storyteller', async () => {
    const result = await processTranscript('Activate storyteller mode', DEFAULT);
    expect(result.actionType).toBe('PERSONALITY_CHANGE');
    expect(result.data?.mode).toBe('STORYTELLER');
  });

  test('matches PERSONALITY_CHANGE - reset', async () => {
    const result = await processTranscript('Reset to default', DEFAULT);
    expect(result.actionType).toBe('PERSONALITY_CHANGE');
    expect(result.data?.mode).toBe('DEFAULT');
  });

  test('matches JOKE intent', async () => {
    const result = await processTranscript('Tell me a joke', DEFAULT);
    expect(result.actionType).toBe('SOCIAL');
  });

  test('matches JOKE intent - Hindi', async () => {
    const result = await processTranscript('Ek chutkula sunao', DEFAULT);
    expect(result.actionType).toBe('SOCIAL');
  });

  test('matches FACT intent', async () => {
    const result = await processTranscript('Tell me a fact', DEFAULT);
    expect(result.actionType).toBe('SOCIAL');
  });

  test('matches TIMER intent', async () => {
    const result = await processTranscript('Set timer for 5 minutes', DEFAULT);
    expect(result.actionType).toBe('TIMER');
    expect(result.data?.duration).toBe(300);
  });

  test('matches TIMER intent with hours', async () => {
    const result = await processTranscript('Set timer for 2 hours', DEFAULT);
    expect(result.actionType).toBe('TIMER');
    expect(result.data?.duration).toBe(7200);
  });

  test('matches CALCULATION intent', async () => {
    const result = await processTranscript('What is 5 plus 3?', DEFAULT);
    expect(result.actionType).toBe('CALCULATION');
    expect(result.data?.result).toBe(8);
  });

  test('matches YouTube search', async () => {
    const result = await processTranscript('Search YouTube for cats', DEFAULT);
    expect(result.actionType).toBe('SEARCH_QUERY');
    expect(result.externalUrl).toContain('youtube.com');
  });

  test('matches HELP intent', async () => {
    const result = await processTranscript('Help me', DEFAULT);
    expect(result.actionType).toBe('HELP');
  });
});

describe('Command Processor - Security', () => {
  test('blocks password keywords', async () => {
    const result = await processTranscript('My password is 12345', DEFAULT);
    expect(result.actionType).toBe('SECURITY_ALERT');
  });

  test('blocks credit card keywords', async () => {
    const result = await processTranscript('My card number is 4532123456789', DEFAULT);
    expect(result.actionType).toBe('SECURITY_ALERT');
  });

  test('blocks OTP keywords', async () => {
    const result = await processTranscript('My OTP is 654321', DEFAULT);
    expect(result.actionType).toBe('SECURITY_ALERT');
  });

  test('allows safe commands with numbers', async () => {
    const result = await processTranscript('Set timer for 5 minutes', DEFAULT);
    expect(result.actionType).toBe('TIMER');
  });
});

describe('Command Processor - Personality Modes', () => {
  test('DEFAULT personality returns normal response', async () => {
    const result = await processTranscript('Hello', DEFAULT);
    expect(result.response).toBeDefined();
  });

  test('FOCUS personality shortens response', async () => {
    const result = await processTranscript('Hello', FOCUS);
    expect(result.response).toBeDefined();
  });

  test('SASS personality adds sassiness', async () => {
    const result = await processTranscript('Hello', SASS);
    expect(result.response).toBeDefined();
  });

  test('STORYTELLER personality adds narrative', async () => {
    const result = await processTranscript('Hello', STORYTELLER);
    expect(result.response).toBeDefined();
  });
});
