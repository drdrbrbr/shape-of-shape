
declare global {
  interface Window {
    dataLayer: any;
    gtag: (...args: any[]) => void;
  }
  function gtag(...args: any[]): void;
}

export {};