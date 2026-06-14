var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
const ICON_MANIFEST_BASE = "/js/diagram-creator/icons";
const PLATFORMS = [
  {
    id: "aws",
    name: "Amazon Web Services",
    logoUrl: "/images/diagram-icons/aws/aws-logo.svg"
  },
  {
    id: "azure",
    name: "Microsoft Azure",
    logoUrl: "/images/diagram-icons/azure/azure-logo.svg"
  },
  {
    id: "gcp",
    name: "Google Cloud Platform",
    logoUrl: "/images/diagram-icons/gcp/gcp-logo.svg"
  }
];
class PlatformService {
  constructor() {
    __publicField(this, "currentPlatform", null);
    __publicField(this, "manifestCache", /* @__PURE__ */ new Map());
  }
  /**
   * Returns the list of available cloud platforms.
   */
  getAvailablePlatforms() {
    return PLATFORMS;
  }
  /**
   * Selects a platform by ID and loads its icon manifest.
   * Throws if the platformId is not recognised.
   */
  async selectPlatform(platformId) {
    const platform = PLATFORMS.find((p) => p.id === platformId);
    if (!platform) {
      throw new Error(`Unknown platform: ${platformId}`);
    }
    if (!this.manifestCache.has(platformId)) {
      const manifest = await this.fetchManifest(platformId);
      this.manifestCache.set(platformId, manifest);
    }
    this.currentPlatform = platform;
  }
  /**
   * Returns the icon manifest for a given platform.
   * The manifest must have been loaded via selectPlatform() first, or this
   * method will fetch it on demand.
   */
  async getIconManifest(platformId) {
    if (this.manifestCache.has(platformId)) {
      return this.manifestCache.get(platformId);
    }
    const manifest = await this.fetchManifest(platformId);
    this.manifestCache.set(platformId, manifest);
    return manifest;
  }
  /**
   * Resolves the icon URL for a specific service within a platform.
   * Searches through all categories to find the matching serviceId and returns
   * the absolute path to the icon image.
   *
   * Returns an empty string if the service is not found.
   */
  getIconUrl(platformId, serviceId) {
    const manifest = this.manifestCache.get(platformId);
    if (!manifest) {
      return "";
    }
    for (const category of manifest.categories) {
      const service = category.services.find((s) => s.id === serviceId);
      if (service) {
        return `/${service.iconPath}`;
      }
    }
    return "";
  }
  /**
   * Returns the currently selected platform, or null if none has been selected.
   */
  getCurrentPlatform() {
    return this.currentPlatform;
  }
  /**
   * Fetches and parses the icon manifest JSON for a given platform.
   */
  async fetchManifest(platformId) {
    const url = `${ICON_MANIFEST_BASE}/${platformId}.json`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Failed to load icon manifest for "${platformId}": ${response.status} ${response.statusText}`
      );
    }
    const data = await response.json();
    return data;
  }
}
export {
  PlatformService
};
