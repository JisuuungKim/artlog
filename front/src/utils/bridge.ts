export type BridgeMessage = {
  type: string;
  payload?: any;
};

declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
  }
}

/**
 * Sends a message to the native app shell via React Native WebView bridge.
 * @param type - The action type string
 * @param payload - Optional data payload
 */
export const sendBridgeMessage = (type: string, payload?: any) => {
  if (window.ReactNativeWebView) {
    const message = JSON.stringify({ type, payload });
    window.ReactNativeWebView.postMessage(message);
    console.log('[Bridge] Sent:', message);
  } else {
    console.warn('[Bridge] Native bridge is not available. Message not sent:', {
      type,
      payload,
    });
  }
};
