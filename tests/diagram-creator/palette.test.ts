/**
 * Unit tests for the Palette module.
 * Tests the filterServices pure function and the Palette class UI rendering,
 * search filtering, and drag initiation.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { filterServices, Palette } from '../../js/diagram-creator/palette';
import { createServiceIcon } from './helpers';
import type { IconManifest, ServiceIcon } from '../../js/diagram-creator/types';

// --- filterServices pure function tests ---

describe('filterServices', () => {
  const services: ServiceIcon[] = [
    createServiceIcon({ id: 'ec2', name: 'EC2' }),
    createServiceIcon({ id: 'lambda', name: 'Lambda' }),
    createServiceIcon({ id: 'ecs', name: 'ECS' }),
    createServiceIcon({ id: 'elb', name: 'Elastic Load Balancing' }),
    createServiceIcon({ id: 'api-gateway', name: 'API Gateway' }),
    createServiceIcon({ id: 's3', name: 'S3' }),
  ];

  it('should return all services when search term is empty', () => {
    const result = filterServices(services, '');
    expect(result).toEqual(services);
  });

  it('should filter services by case-insensitive name match', () => {
    const result = filterServices(services, 'lambda');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('lambda');
  });

  it('should match regardless of case', () => {
    const result = filterServices(services, 'LAMBDA');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('lambda');
  });

  it('should match partial names', () => {
    const result = filterServices(services, 'elastic');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('elb');
  });

  it('should return multiple matches', () => {
    const result = filterServices(services, 'ec');
    // "EC2" and "ECS" both contain "ec"
    expect(result).toHaveLength(2);
    expect(result.map((s) => s.id)).toContain('ec2');
    expect(result.map((s) => s.id)).toContain('ecs');
  });

  it('should return empty array when no services match', () => {
    const result = filterServices(services, 'nonexistent');
    expect(result).toHaveLength(0);
  });

  it('should return empty array when services array is empty', () => {
    const result = filterServices([], 'anything');
    expect(result).toHaveLength(0);
  });

  it('should match services containing spaces in name', () => {
    const result = filterServices(services, 'api g');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('api-gateway');
  });
});

// --- Palette class tests ---

describe('Palette', () => {
  let containerEl: HTMLElement;
  let manifest: IconManifest;

  beforeEach(() => {
    // Set up a DOM container
    containerEl = document.createElement('div');
    containerEl.id = 'palette-container';
    document.body.appendChild(containerEl);

    manifest = {
      platformId: 'aws',
      categories: [
        {
          id: 'compute',
          name: 'Compute',
          services: [
            createServiceIcon({ id: 'ec2', name: 'EC2' }),
            createServiceIcon({ id: 'lambda', name: 'Lambda' }),
          ],
        },
        {
          id: 'storage',
          name: 'Storage',
          services: [
            createServiceIcon({ id: 's3', name: 'S3' }),
          ],
        },
      ],
    };
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should throw if container element is not found', () => {
    expect(() => new Palette('nonexistent', manifest)).toThrow(
      'Palette container element not found: #nonexistent'
    );
  });

  it('should render the palette into the container element', () => {
    new Palette('palette-container', manifest);
    expect(containerEl.querySelector('.palette-search-input')).not.toBeNull();
    expect(containerEl.querySelector('.palette-categories')).not.toBeNull();
  });

  it('should render all categories with headings', () => {
    new Palette('palette-container', manifest);
    const headings = containerEl.querySelectorAll('.palette-category-heading');
    expect(headings).toHaveLength(2);
    expect(headings[0].textContent).toBe('Compute');
    expect(headings[1].textContent).toBe('Storage');
  });

  it('should render all service items with icons and names', () => {
    new Palette('palette-container', manifest);
    const items = containerEl.querySelectorAll('.palette-service-item');
    expect(items).toHaveLength(3);

    const firstItem = items[0];
    const img = firstItem.querySelector('img') as HTMLImageElement;
    const label = firstItem.querySelector('.palette-service-name');
    expect(img).not.toBeNull();
    expect(label?.textContent).toBe('EC2');
  });

  it('should make palette items draggable', () => {
    new Palette('palette-container', manifest);
    const items = containerEl.querySelectorAll('.palette-service-item');
    for (const item of items) {
      expect((item as HTMLElement).draggable).toBe(true);
    }
  });

  it('should filter services in real-time as user types in search', () => {
    const palette = new Palette('palette-container', manifest);

    // Type "lambda" into search
    palette.setSearchTerm('lambda');

    const items = containerEl.querySelectorAll('.palette-service-item');
    expect(items).toHaveLength(1);
    expect(items[0].querySelector('.palette-service-name')?.textContent).toBe('Lambda');
  });

  it('should hide empty categories during filtering', () => {
    const palette = new Palette('palette-container', manifest);
    palette.setSearchTerm('s3');

    // Only Storage category should be visible
    const categories = containerEl.querySelectorAll('.palette-category');
    expect(categories).toHaveLength(1);
    expect(categories[0].querySelector('.palette-category-heading')?.textContent).toBe('Storage');
  });

  it('should restore all items when search is cleared', () => {
    const palette = new Palette('palette-container', manifest);
    palette.setSearchTerm('lambda');

    let items = containerEl.querySelectorAll('.palette-service-item');
    expect(items).toHaveLength(1);

    palette.setSearchTerm('');
    items = containerEl.querySelectorAll('.palette-service-item');
    expect(items).toHaveLength(3);
  });

  it('should update manifest and re-render when updateManifest is called', () => {
    const palette = new Palette('palette-container', manifest);

    const newManifest: IconManifest = {
      platformId: 'azure',
      categories: [
        {
          id: 'compute',
          name: 'Compute',
          services: [
            createServiceIcon({ id: 'vm', name: 'Virtual Machines' }),
          ],
        },
      ],
    };

    palette.updateManifest(newManifest);

    const items = containerEl.querySelectorAll('.palette-service-item');
    expect(items).toHaveLength(1);
    expect(items[0].querySelector('.palette-service-name')?.textContent).toBe('Virtual Machines');
  });

  it('should store service data in item dataset for drag transfer', () => {
    new Palette('palette-container', manifest);
    const item = containerEl.querySelector('.palette-service-item') as HTMLElement;

    expect(item.dataset.serviceId).toBe('ec2');
    expect(item.dataset.serviceName).toBe('EC2');
    expect(item.dataset.iconPath).toBeDefined();
  });

  describe('onDrop callback', () => {
    it('should allow setting and getting onDrop callback', () => {
      const palette = new Palette('palette-container', manifest);
      const callback = vi.fn();

      palette.onDrop = callback;
      expect(palette.onDrop).toBe(callback);
    });

    it('should allow setting onDrop to null', () => {
      const palette = new Palette('palette-container', manifest);
      palette.onDrop = vi.fn();
      palette.onDrop = null;
      expect(palette.onDrop).toBeNull();
    });
  });

  describe('wireDropTarget', () => {
    it('should not throw if canvas element does not exist', () => {
      const palette = new Palette('palette-container', manifest);
      expect(() => palette.wireDropTarget('nonexistent')).not.toThrow();
    });

    it('should set up dragover and drop listeners on canvas element', () => {
      const canvasEl = document.createElement('div');
      canvasEl.id = 'canvas-container';
      document.body.appendChild(canvasEl);

      const addEventSpy = vi.spyOn(canvasEl, 'addEventListener');
      const palette = new Palette('palette-container', manifest);
      palette.wireDropTarget('canvas-container');

      expect(addEventSpy).toHaveBeenCalledWith('dragover', expect.any(Function));
      expect(addEventSpy).toHaveBeenCalledWith('drop', expect.any(Function));
    });
  });
});
