/**
 * Unit tests for the PlatformService class.
 * Tests platform listing, icon manifest loading/parsing,
 * icon URL resolution, and current platform selection state.
 *
 * Validates: Requirements 1.1, 1.2, 1.4
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { PlatformService } from '../../js/diagram-creator/platform-service';
import type { IconManifest } from '../../js/diagram-creator/types';

/** Sample icon manifest used for mocked fetch responses */
const mockAwsManifest: IconManifest = {
  platformId: 'aws',
  categories: [
    {
      id: 'compute',
      name: 'Compute',
      services: [
        {
          id: 'ec2',
          name: 'EC2',
          iconPath: 'images/diagram-icons/aws/compute/ec2.svg',
          defaultWidth: 48,
          defaultHeight: 48,
        },
        {
          id: 'lambda',
          name: 'Lambda',
          iconPath: 'images/diagram-icons/aws/compute/lambda.svg',
          defaultWidth: 48,
          defaultHeight: 48,
        },
      ],
    },
    {
      id: 'storage',
      name: 'Storage',
      services: [
        {
          id: 's3',
          name: 'S3',
          iconPath: 'images/diagram-icons/aws/storage/s3.svg',
          defaultWidth: 48,
          defaultHeight: 48,
        },
      ],
    },
  ],
};

const mockAzureManifest: IconManifest = {
  platformId: 'azure',
  categories: [
    {
      id: 'compute',
      name: 'Compute',
      services: [
        {
          id: 'virtual-machines',
          name: 'Virtual Machines',
          iconPath: 'images/diagram-icons/azure/compute/virtual-machines.svg',
          defaultWidth: 48,
          defaultHeight: 48,
        },
      ],
    },
  ],
};

const mockGcpManifest: IconManifest = {
  platformId: 'gcp',
  categories: [
    {
      id: 'compute',
      name: 'Compute',
      services: [
        {
          id: 'compute-engine',
          name: 'Compute Engine',
          iconPath: 'images/diagram-icons/gcp/compute/compute-engine.svg',
          defaultWidth: 48,
          defaultHeight: 48,
        },
      ],
    },
  ],
};

function createMockFetch(manifest: IconManifest) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(manifest),
  });
}

describe('PlatformService', () => {
  let service: PlatformService;

  beforeEach(() => {
    service = new PlatformService();
    vi.stubGlobal('fetch', createMockFetch(mockAwsManifest));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getAvailablePlatforms', () => {
    it('should return exactly 3 platforms', () => {
      const platforms = service.getAvailablePlatforms();
      expect(platforms).toHaveLength(3);
    });

    it('should include AWS with correct id and name', () => {
      const platforms = service.getAvailablePlatforms();
      const aws = platforms.find((p) => p.id === 'aws');
      expect(aws).toBeDefined();
      expect(aws!.name).toBe('Amazon Web Services');
      expect(aws!.logoUrl).toContain('aws');
    });

    it('should include Azure with correct id and name', () => {
      const platforms = service.getAvailablePlatforms();
      const azure = platforms.find((p) => p.id === 'azure');
      expect(azure).toBeDefined();
      expect(azure!.name).toBe('Microsoft Azure');
      expect(azure!.logoUrl).toContain('azure');
    });

    it('should include GCP with correct id and name', () => {
      const platforms = service.getAvailablePlatforms();
      const gcp = platforms.find((p) => p.id === 'gcp');
      expect(gcp).toBeDefined();
      expect(gcp!.name).toBe('Google Cloud Platform');
      expect(gcp!.logoUrl).toContain('gcp');
    });

    it('should include logo URLs for all platforms', () => {
      const platforms = service.getAvailablePlatforms();
      for (const platform of platforms) {
        expect(platform.logoUrl).toBeTruthy();
        expect(platform.logoUrl).toMatch(/\.svg$/);
      }
    });

    it('should have unique platform IDs', () => {
      const platforms = service.getAvailablePlatforms();
      const ids = platforms.map((p) => p.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe('getCurrentPlatform', () => {
    it('should return null before any platform is selected', () => {
      expect(service.getCurrentPlatform()).toBeNull();
    });

    it('should return the selected platform after selectPlatform', async () => {
      await service.selectPlatform('aws');
      const current = service.getCurrentPlatform();
      expect(current).not.toBeNull();
      expect(current!.id).toBe('aws');
      expect(current!.name).toBe('Amazon Web Services');
    });

    it('should update when a different platform is selected', async () => {
      vi.stubGlobal('fetch', vi.fn()
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockAwsManifest) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockAzureManifest) })
      );

      await service.selectPlatform('aws');
      expect(service.getCurrentPlatform()!.id).toBe('aws');

      await service.selectPlatform('azure');
      expect(service.getCurrentPlatform()!.id).toBe('azure');
      expect(service.getCurrentPlatform()!.name).toBe('Microsoft Azure');
    });
  });

  describe('selectPlatform', () => {
    it('should throw for an unknown platform ID', async () => {
      await expect(service.selectPlatform('unknown')).rejects.toThrow('Unknown platform: unknown');
    });

    it('should fetch the icon manifest for the selected platform', async () => {
      await service.selectPlatform('aws');
      expect(fetch).toHaveBeenCalledWith('/js/diagram-creator/icons/aws.json');
    });

    it('should cache the manifest and not re-fetch on second selection', async () => {
      await service.selectPlatform('aws');
      await service.selectPlatform('aws');
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('getIconManifest', () => {
    it('should return the manifest for a platform after selection', async () => {
      await service.selectPlatform('aws');
      const manifest = await service.getIconManifest('aws');
      expect(manifest.platformId).toBe('aws');
      expect(manifest.categories).toHaveLength(2);
    });

    it('should fetch on demand if manifest is not yet cached', async () => {
      vi.stubGlobal('fetch', createMockFetch(mockAzureManifest));

      const manifest = await service.getIconManifest('azure');
      expect(manifest.platformId).toBe('azure');
      expect(fetch).toHaveBeenCalledWith('/js/diagram-creator/icons/azure.json');
    });

    it('should return cached manifest without extra fetch calls', async () => {
      await service.selectPlatform('aws');
      const manifest1 = await service.getIconManifest('aws');
      const manifest2 = await service.getIconManifest('aws');
      expect(manifest1).toBe(manifest2);
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should parse categories and services correctly', async () => {
      await service.selectPlatform('aws');
      const manifest = await service.getIconManifest('aws');

      expect(manifest.categories[0].id).toBe('compute');
      expect(manifest.categories[0].name).toBe('Compute');
      expect(manifest.categories[0].services).toHaveLength(2);
      expect(manifest.categories[0].services[0].id).toBe('ec2');
      expect(manifest.categories[0].services[0].name).toBe('EC2');
      expect(manifest.categories[0].services[0].iconPath).toContain('ec2.svg');
      expect(manifest.categories[0].services[0].defaultWidth).toBe(48);
      expect(manifest.categories[0].services[0].defaultHeight).toBe(48);
    });

    it('should throw when fetch fails', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      }));

      await expect(service.getIconManifest('aws')).rejects.toThrow(
        'Failed to load icon manifest for "aws": 404 Not Found'
      );
    });
  });

  describe('getIconUrl', () => {
    beforeEach(async () => {
      await service.selectPlatform('aws');
    });

    it('should resolve an icon URL for a known service', () => {
      const url = service.getIconUrl('aws', 'ec2');
      expect(url).toBe('/images/diagram-icons/aws/compute/ec2.svg');
    });

    it('should resolve icon URLs across different categories', () => {
      const s3Url = service.getIconUrl('aws', 's3');
      expect(s3Url).toBe('/images/diagram-icons/aws/storage/s3.svg');
    });

    it('should return empty string for an unknown service ID', () => {
      const url = service.getIconUrl('aws', 'nonexistent-service');
      expect(url).toBe('');
    });

    it('should return empty string if manifest is not loaded for the platform', () => {
      const url = service.getIconUrl('gcp', 'compute-engine');
      expect(url).toBe('');
    });

    it('should resolve URLs for each platform after loading manifests', async () => {
      // Load Azure manifest
      vi.stubGlobal('fetch', createMockFetch(mockAzureManifest));
      await service.selectPlatform('azure');

      const azureUrl = service.getIconUrl('azure', 'virtual-machines');
      expect(azureUrl).toBe('/images/diagram-icons/azure/compute/virtual-machines.svg');
    });

    it('should resolve URLs for GCP platform', async () => {
      vi.stubGlobal('fetch', createMockFetch(mockGcpManifest));
      await service.selectPlatform('gcp');

      const gcpUrl = service.getIconUrl('gcp', 'compute-engine');
      expect(gcpUrl).toBe('/images/diagram-icons/gcp/compute/compute-engine.svg');
    });

    it('should return absolute paths starting with /', () => {
      const url = service.getIconUrl('aws', 'lambda');
      expect(url).toMatch(/^\//);
    });
  });
});
