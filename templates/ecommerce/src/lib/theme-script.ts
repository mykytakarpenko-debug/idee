/**
 * Script eseguito nel <head> prima del primo paint: applica il tema salvato
 * (o quello del sistema) evitando il lampeggio chiaro→scuro.
 */
export const THEME_STORAGE_KEY = "bottega:theme";

export const themeInitScript = `(function(){try{var p=localStorage.getItem("${THEME_STORAGE_KEY}");if(p!=="light"&&p!=="dark")p="system";var d=p==="dark"||(p==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);var r=document.documentElement;r.setAttribute("data-theme",d?"dark":"light");r.setAttribute("data-theme-pref",p);}catch(e){document.documentElement.setAttribute("data-theme","light");}})();`;
