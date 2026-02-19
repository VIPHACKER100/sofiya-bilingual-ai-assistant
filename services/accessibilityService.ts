export function getAriaLabel(component: string, action?: string): string {
  const labels: Record<string, Record<string, string>> = {
    arcReactor: {
      default: 'Activate voice recognition',
      listening: 'Listening for commands',
      processing: 'Processing your request',
      speaking: 'Speaking response'
    },
    microphone: {
      on: 'Microphone is active',
      off: 'Microphone is inactive'
    },
    themeSelector: {
      sofiya: 'Switch to Sofiya theme - Advanced AI Assistant',
      classic: 'Switch to Classic theme - Standard Interface',
      focus: 'Switch to Focus theme - Productivity Mode',
      zen: 'Switch to Zen theme - Mindfulness Protocol'
    },
    languageToggle: {
      en: 'Switch to English',
      hi: 'Switch to Hindi'
    },
    volumeControl: {
      up: 'Increase volume',
      down: 'Decrease volume',
      mute: 'Mute audio',
      unmute: 'Unmute audio'
    }
  };

  return labels[component]?.[action || 'default'] || `${component} ${action || ''}`;
}

export function getAriaDescription(component: string): string {
  const descriptions: Record<string, string> = {
    arcReactor: 'Click the central reactor to start or stop voice recognition. Sofiya will listen for voice commands in English or Hindi.',
    weatherWidget: 'Displays current weather conditions including temperature, humidity, and forecast for your location.',
    newsWidget: 'Shows latest news headlines from various sources.',
    taskPanel: 'Displays your todo list. You can add, complete, or delete tasks using voice commands.',
    smartHome: 'Control smart home devices including lights, thermostats, locks, and cameras.',
    healthWidget: 'Shows your health metrics including steps, heart rate, sleep score, and calories.',
    timer: 'Active countdown timer showing remaining time.',
    calculator: 'Displays calculation results.',
    mediaPlayer: 'Shows currently playing media with playback controls.',
    history: 'Shows log of recent commands and responses.'
  };

  return descriptions[component] || '';
}

export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  if (typeof document === 'undefined') return;

  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  announcement.style.cssText = `
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  `;

  document.body.appendChild(announcement);
  setTimeout(() => announcement.remove(), 1000);
}

export function trapFocus(element: HTMLElement) {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstFocusable = focusableElements[0] as HTMLElement;
  const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        lastFocusable.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        firstFocusable.focus();
        e.preventDefault();
      }
    }
  };

  element.addEventListener('keydown', handleKeyDown);
  firstFocusable?.focus();

  return () => element.removeEventListener('keydown', handleKeyDown);
}

export function handleKeyboardNavigation(
  e: KeyboardEvent,
  itemCount: number,
  currentIndex: number,
  onSelect: (index: number) => void,
  onClose?: () => void
) {
  switch (e.key) {
    case 'ArrowDown':
    case 'ArrowRight':
      e.preventDefault();
      onSelect((currentIndex + 1) % itemCount);
      break;
    case 'ArrowUp':
    case 'ArrowLeft':
      e.preventDefault();
      onSelect((currentIndex - 1 + itemCount) % itemCount);
      break;
    case 'Home':
      e.preventDefault();
      onSelect(0);
      break;
    case 'End':
      e.preventDefault();
      onSelect(itemCount - 1);
      break;
    case 'Enter':
    case ' ':
      e.preventDefault();
      onSelect(currentIndex);
      break;
    case 'Escape':
      e.preventDefault();
      onClose?.();
      break;
  }
}
