const ACCESS_TOKEN_KEY = 'artlog_access_token';

export const authTokenStorage = {
  get() {
    if (typeof window === 'undefined') {
      return null;
    }

    return window.localStorage.getItem(ACCESS_TOKEN_KEY);
  },
  set(token: string) {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
  },
  clear() {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  },
};
