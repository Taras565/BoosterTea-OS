export const openExternalLink = (url: string) => {
  try {
    const webApp = (window as any).Telegram?.WebApp;
    if (webApp && webApp.openLink) {
      webApp.openLink(url, { try_instant_view: false });
    } else {
      window.open(url, "_blank");
    }
  } catch (e) {
    window.open(url, "_blank");
  }
};
