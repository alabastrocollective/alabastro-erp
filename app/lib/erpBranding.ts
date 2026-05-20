import brandingConfig from "~/erp-branding.config.json";

export interface ErpBrandingConfig {
  appName: string;
  shortName: string;
  primaryColor: string;
  accentColor: string;
  secondaryColor?: string;
  logoPath: string;
  logoLightPath?: string;
  faviconPath?: string;
  themeColor?: string;
  themeColorDark?: string;
}

const defaultBranding: ErpBrandingConfig = {
  appName: "ERP",
  shortName: "ERP",
  primaryColor: "#1F3666",
  accentColor: "#73CBCF",
  secondaryColor: "#3C5894",
  logoPath: "/logo.png",
  faviconPath: "/icono.png",
};

let cached: ErpBrandingConfig = { ...defaultBranding, ...(brandingConfig as ErpBrandingConfig) };

function loadBranding(): ErpBrandingConfig {
  return cached;
}

export function getAppName(): string { return loadBranding().appName; }
export function getShortName(): string { return loadBranding().shortName; }
export function getPrimaryColor(): string { return loadBranding().primaryColor; }
export function getAccentColor(): string { return loadBranding().accentColor; }
export function getSecondaryColor(): string { return loadBranding().secondaryColor ?? loadBranding().primaryColor; }
export function getLogoPath(): string { return loadBranding().logoPath; }
export function getLogoLightPath(): string { return loadBranding().logoLightPath ?? loadBranding().logoPath; }
export function getFaviconPath(): string { return loadBranding().faviconPath ?? loadBranding().logoPath; }
export function getThemeColor(): string { return loadBranding().themeColor ?? loadBranding().primaryColor; }
export function getThemeColorDark(): string { return loadBranding().themeColorDark ?? loadBranding().themeColor ?? loadBranding().primaryColor; }
export function getErpBranding(): ErpBrandingConfig { return loadBranding(); }
export function setErpBranding(config: ErpBrandingConfig): void { cached = config; }
