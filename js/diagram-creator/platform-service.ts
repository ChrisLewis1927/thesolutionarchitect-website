/**
 * PlatformService — manages cloud platform selection and icon loading.
 *
 * Provides the list of supported platforms, loads icon manifests from static
 * JSON files, and resolves icon URLs for individual services.
 */

import type { Platform, IconManifest, ServiceIcon } from './types.js';

/** Base path for icon manifest JSON files. */
const ICON_MANIFEST_BASE = '/js/diagram-creator/icons';

/** The three supported cloud platforms with logos. */
const PLATFORMS: Platform[] = [
  {
    id: 'aws',
    name: 'Amazon Web Services',
    logoUrl: '/images/diagram-icons/aws/aws-logo.svg',
  },
  {
    id: 'azure',
    name: 'Microsoft Azure',
    logoUrl: '/images/diagram-icons/azure/azure-logo.svg',
  },
  {
    id: 'gcp',
    name: 'Google Cloud Platform',
    logoUrl: '/images/diagram-icons/gcp/gcp-logo.svg',
  },
];

export class PlatformService {
  private currentPlatform: Platform | null = null;
  private manifestCache: Map<string, IconManifest> = new Map();

  /**
   * Returns the list of available cloud platforms.
   */
  getAvailablePlatforms(): Platform[] {
    return PLATFORMS;
  }

  /**
   * Selects a platform by ID and loads its icon manifest.
   * Throws if the platformId is not recognised.
   */
  async selectPlatform(platformId: string): Promise<void> {
    const platform = PLATFORMS.find((p) => p.id === platformId);
    if (!platform) {
      throw new Error(`Unknown platform: ${platformId}`);
    }

    // Load the manifest if not already cached
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
  async getIconManifest(platformId: string): Promise<IconManifest> {
    if (this.manifestCache.has(platformId)) {
      return this.manifestCache.get(platformId)!;
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
  getIconUrl(platformId: string, serviceId: string): string {
    const manifest = this.manifestCache.get(platformId);
    if (!manifest) {
      return '';
    }

    for (const category of manifest.categories) {
      const service = category.services.find((s: ServiceIcon) => s.id === serviceId);
      if (service) {
        // iconPath in the manifest is relative (e.g. "images/diagram-icons/aws/compute/ec2.svg")
        // Return as an absolute path from site root
        return `/${service.iconPath}`;
      }
    }

    return '';
  }

  /**
   * Returns the currently selected platform, or null if none has been selected.
   */
  getCurrentPlatform(): Platform | null {
    return this.currentPlatform;
  }

  /**
   * Fetches and parses the icon manifest JSON for a given platform.
   */
  private async fetchManifest(platformId: string): Promise<IconManifest> {
    const url = `${ICON_MANIFEST_BASE}/${platformId}.json`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Failed to load icon manifest for "${platformId}": ${response.status} ${response.statusText}`
      );
    }

    const data: IconManifest = await response.json();
    return data;
  }
}
