import mixpanel from 'mixpanel-browser';

const TOKEN = import.meta.env.VITE_MIXPANEL_TOKEN;

const isEnabled =
  typeof TOKEN === 'string' &&
  TOKEN.trim().length > 0 &&
  !TOKEN.trim().startsWith('--');

export function initMixpanel(): void {
  if (!isEnabled) return;
  mixpanel.init(TOKEN!, { track_pageview: false, persistence: 'localStorage' });
}

export function trackEvent(
  event: string,
  properties?: Record<string, unknown>
): void {
  if (!isEnabled) return;
  try {
    mixpanel.track(event, properties);
  } catch {
    // never let analytics break the app
  }
}

export function identifyUser(
  userId: number | string,
  properties?: Record<string, unknown>
): void {
  if (!isEnabled) return;
  try {
    mixpanel.identify(String(userId));
    if (properties) {
      mixpanel.people.set(properties);
    }
  } catch {
    // never let analytics break the app
  }
}

export function resetMixpanel(): void {
  if (!isEnabled) return;
  try {
    mixpanel.reset();
  } catch {
    // never let analytics break the app
  }
}
