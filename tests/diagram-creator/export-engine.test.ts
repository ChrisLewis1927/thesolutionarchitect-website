/**
 * Unit tests for ExportEngine.
 *
 * Tests PNG export, SVG export, triggerDownload, and error handling.
 * Uses a mock Konva stage for PNG tests since the real canvas is not
 * available in happy-dom.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ExportEngine,
  EmptyCanvasError,
  PngExportError,
  SvgExportError,
} from '../../js/diagram-creator/export-engine';
import {
  createEmptyDiagramState,
  createComponent,
  createContainer,
  createConnector,
} from './helpers';
import type { DiagramState, PngExportOptions } from '../../js/diagram-creator/types';

// --- Mock Konva Stage ---

function createMockStage(width = 1200, height = 800) {
  const bgRect = {
    moveToBottom: vi.fn(),
    destroy: vi.fn(),
  };

  const layer = {
    add: vi.fn(),
    batchDraw: vi.fn(),
  };

  return {
    width: () => width,
    height: () => height,
    toDataURL: vi.fn(({ pixelRatio, mimeType }) => {
      // Return a minimal valid PNG data URL
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    }),
    getLayers: () => [layer],
  };
}

// Mock the Konva global for tests that need it
(globalThis as any).Konva = {
  Rect: class {
    config: any;
    constructor(config: any) {
      this.config = config;
    }
    moveToBottom() {}
    destroy() {}
  },
};

describe('ExportEngine', () => {
  let state: DiagramState;
  let mockStage: ReturnType<typeof createMockStage>;
  let engine: ExportEngine;

  beforeEach(() => {
    state = createEmptyDiagramState('aws');
    mockStage = createMockStage();
    engine = new ExportEngine(mockStage, state);
  });

  // ─── canExport ─────────────────────────────────────────────────────

  describe('canExport', () => {
    it('returns false for empty canvas (no components or containers)', () => {
      expect(engine.canExport()).toBe(false);
    });

    it('returns true when components exist', () => {
      state.components.set('comp-1', createComponent());
      expect(engine.canExport()).toBe(true);
    });

    it('returns true when containers exist (even without components)', () => {
      state.containers.set('container-1', createContainer());
      expect(engine.canExport()).toBe(true);
    });
  });

  // ─── exportAsPng ───────────────────────────────────────────────────

  describe('exportAsPng', () => {
    const defaultOptions: PngExportOptions = {
      pixelRatio: 2,
      backgroundColor: '#ffffff',
    };

    it('throws EmptyCanvasError when canvas has no components', async () => {
      await expect(engine.exportAsPng(defaultOptions)).rejects.toThrow(
        EmptyCanvasError
      );
    });

    it('throws EmptyCanvasError with descriptive message', async () => {
      await expect(engine.exportAsPng(defaultOptions)).rejects.toThrow(
        'Cannot export an empty canvas'
      );
    });

    it('returns a Blob when canvas has components', async () => {
      state.components.set('comp-1', createComponent());
      const blob = await engine.exportAsPng(defaultOptions);
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('image/png');
    });

    it('calls stage.toDataURL with correct pixelRatio', async () => {
      state.components.set('comp-1', createComponent());
      await engine.exportAsPng({ pixelRatio: 3, backgroundColor: '#ffffff' });
      expect(mockStage.toDataURL).toHaveBeenCalledWith(
        expect.objectContaining({
          pixelRatio: 3,
          mimeType: 'image/png',
        })
      );
    });

    it('throws PngExportError when stage is null', async () => {
      state.components.set('comp-1', createComponent());
      const brokenEngine = new ExportEngine(null, state);
      await expect(brokenEngine.exportAsPng(defaultOptions)).rejects.toThrow(
        PngExportError
      );
    });

    it('throws PngExportError when stage.toDataURL throws', async () => {
      state.components.set('comp-1', createComponent());
      mockStage.toDataURL.mockImplementation(() => {
        throw new Error('Canvas tainted');
      });
      await expect(engine.exportAsPng(defaultOptions)).rejects.toThrow(
        PngExportError
      );
    });

    it('includes helpful error message when export fails', async () => {
      state.components.set('comp-1', createComponent());
      mockStage.toDataURL.mockImplementation(() => {
        throw new Error('Memory limit exceeded');
      });
      await expect(engine.exportAsPng(defaultOptions)).rejects.toThrow(
        /Try reducing diagram complexity/
      );
    });
  });

  // ─── exportAsSvg ───────────────────────────────────────────────────

  describe('exportAsSvg', () => {
    it('throws EmptyCanvasError when canvas has no components or containers', () => {
      expect(() => engine.exportAsSvg()).toThrow(EmptyCanvasError);
    });

    it('returns a valid SVG string when components exist', () => {
      state.components.set('comp-1', createComponent());
      const svg = engine.exportAsSvg();
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
      expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    });

    it('includes <image> element for each component with icon', () => {
      state.components.set('comp-1', createComponent({ id: 'comp-1' }));
      state.components.set(
        'comp-2',
        createComponent({ id: 'comp-2', serviceId: 's3', label: 'S3' })
      );
      const svg = engine.exportAsSvg();
      const imageMatches = svg.match(/<image /g) || [];
      expect(imageMatches.length).toBe(2);
    });

    it('includes <rect> element for each container', () => {
      state.containers.set('c-1', createContainer({ id: 'c-1' }));
      state.containers.set(
        'c-2',
        createContainer({ id: 'c-2', type: 'subnet', label: 'Subnet' })
      );
      // Need at least a component or container to pass canExport
      const svg = engine.exportAsSvg();
      // 2 container rects + 1 background rect = 3 rects
      const rectMatches = svg.match(/<rect /g) || [];
      expect(rectMatches.length).toBeGreaterThanOrEqual(3);
    });

    it('includes <polyline> element for each connector', () => {
      state.components.set('comp-1', createComponent({ id: 'comp-1' }));
      state.components.set(
        'comp-2',
        createComponent({ id: 'comp-2', position: { x: 300, y: 100 } })
      );
      state.connectors.set('conn-1', createConnector({ id: 'conn-1' }));
      const svg = engine.exportAsSvg();
      expect(svg).toContain('<polyline');
    });

    it('includes <text> element for component labels', () => {
      state.components.set(
        'comp-1',
        createComponent({ id: 'comp-1', label: 'My Lambda' })
      );
      const svg = engine.exportAsSvg();
      expect(svg).toContain('My Lambda');
      expect(svg).toContain('<text');
    });

    it('includes <text> element for container labels', () => {
      state.containers.set(
        'c-1',
        createContainer({ id: 'c-1', label: 'Production VPC' })
      );
      const svg = engine.exportAsSvg();
      expect(svg).toContain('Production VPC');
    });

    it('includes connector labels in SVG', () => {
      state.components.set('comp-1', createComponent({ id: 'comp-1' }));
      state.components.set(
        'comp-2',
        createComponent({ id: 'comp-2', position: { x: 300, y: 100 } })
      );
      state.connectors.set(
        'conn-1',
        createConnector({ id: 'conn-1', label: 'HTTPS' })
      );
      const svg = engine.exportAsSvg();
      expect(svg).toContain('HTTPS');
    });

    it('includes arrow marker for directed connectors', () => {
      state.components.set('comp-1', createComponent({ id: 'comp-1' }));
      state.connectors.set(
        'conn-1',
        createConnector({ id: 'conn-1', directed: true })
      );
      const svg = engine.exportAsSvg();
      expect(svg).toContain('<marker');
      expect(svg).toContain('marker-end');
    });

    it('does not include arrow marker for undirected connectors', () => {
      state.components.set('comp-1', createComponent({ id: 'comp-1' }));
      state.connectors.set(
        'conn-1',
        createConnector({ id: 'conn-1', directed: false })
      );
      const svg = engine.exportAsSvg();
      expect(svg).not.toContain('marker-end');
    });

    it('escapes special XML characters in labels', () => {
      state.components.set(
        'comp-1',
        createComponent({ id: 'comp-1', label: 'A & B <C>' })
      );
      const svg = engine.exportAsSvg();
      expect(svg).toContain('A &amp; B &lt;C&gt;');
      expect(svg).not.toContain('A & B <C>');
    });

    it('uses stage dimensions for SVG viewBox', () => {
      state.components.set('comp-1', createComponent());
      const svg = engine.exportAsSvg();
      expect(svg).toContain('width="1200"');
      expect(svg).toContain('height="800"');
      expect(svg).toContain('viewBox="0 0 1200 800"');
    });

    it('uses placeholder rect for component without iconPath', () => {
      state.components.set(
        'comp-1',
        createComponent({ id: 'comp-1', iconPath: '' })
      );
      const svg = engine.exportAsSvg();
      expect(svg).toContain('fill="#e0e0e0"');
      expect(svg).not.toContain('<image');
    });
  });

  // ─── triggerDownload ───────────────────────────────────────────────

  describe('triggerDownload', () => {
    it('creates and clicks a download link for Blob data', () => {
      const clickSpy = vi.fn();
      const createElementSpy = vi.spyOn(document, 'createElement');

      // Mock the link element
      const mockLink = {
        href: '',
        download: '',
        style: { display: '' },
        click: clickSpy,
      };
      createElementSpy.mockReturnValue(mockLink as any);

      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockReturnValue(mockLink as any);

      const blob = new Blob(['test'], { type: 'image/png' });
      engine.triggerDownload(blob, 'diagram.png');

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(mockLink.download).toBe('diagram.png');
      expect(clickSpy).toHaveBeenCalled();

      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
    });

    it('creates SVG Blob from string data', () => {
      const clickSpy = vi.fn();
      const createElementSpy = vi.spyOn(document, 'createElement');
      const mockLink = {
        href: '',
        download: '',
        style: { display: '' },
        click: clickSpy,
      };
      createElementSpy.mockReturnValue(mockLink as any);

      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockReturnValue(mockLink as any);

      const svgString = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
      engine.triggerDownload(svgString, 'diagram.svg');

      expect(mockLink.download).toBe('diagram.svg');
      expect(clickSpy).toHaveBeenCalled();

      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
    });
  });

  // ─── setState / setStage ───────────────────────────────────────────

  describe('setState / setStage', () => {
    it('updates internal state reference', () => {
      const newState = createEmptyDiagramState('azure');
      newState.components.set('comp-1', createComponent());
      engine.setState(newState);
      expect(engine.canExport()).toBe(true);
    });

    it('updates stage reference', async () => {
      state.components.set('comp-1', createComponent());
      const newStage = createMockStage(1920, 1080);
      engine.setStage(newStage);

      const svg = engine.exportAsSvg();
      expect(svg).toContain('width="1920"');
      expect(svg).toContain('height="1080"');
    });
  });
});
