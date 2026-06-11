/**
 * ExportEngine — Converts the diagram canvas to downloadable PNG or SVG files.
 *
 * PNG export uses Konva's built-in `stage.toDataURL()` with a pixelRatio
 * multiplier to achieve 150+ DPI at A4 size. SVG export constructs a custom
 * SVG document by iterating the DiagramState and serialising each element
 * (containers, components, connectors, labels) into SVG markup.
 *
 * The triggerDownload method initiates a browser file download using a hidden
 * anchor element with a Blob URL.
 *
 * Konva.js is loaded from CDN — referenced as a global.
 */

import type {
  DiagramState,
  DiagramComponent,
  DiagramContainer,
  DiagramConnector,
  PngExportOptions,
  Point,
} from './types.js';

/** Declare Konva as a global (loaded via CDN script tag). */
declare const Konva: any;

/** Default canvas dimensions for A4 at 150 DPI. */
const A4_WIDTH_PX = 1240;
const A4_HEIGHT_PX = 1754;

/** Default background colour for PNG export. */
const DEFAULT_BACKGROUND_COLOR = '#ffffff';

/** SVG namespace. */
const SVG_NS = 'http://www.w3.org/2000/svg';
const XLINK_NS = 'http://www.w3.org/1999/xlink';

/** Label styling defaults (matching canvas-controller rendering). */
const LABEL_FONT_SIZE = 12;
const LABEL_FONT_FAMILY = 'Inter, Arial, sans-serif';
const LABEL_OFFSET_Y = 6;

/** Connector styling defaults. */
const CONNECTOR_STROKE_COLOR = '#555555';
const CONNECTOR_STROKE_WIDTH = 2;
const CONNECTOR_ARROW_SIZE = 8;

/** Container label styling. */
const CONTAINER_LABEL_FONT_SIZE = 13;
const CONTAINER_LABEL_PADDING = 8;

/**
 * Error thrown when export is attempted on an empty canvas.
 */
export class EmptyCanvasError extends Error {
  constructor() {
    super('Cannot export an empty canvas. Add components before exporting.');
    this.name = 'EmptyCanvasError';
  }
}

/**
 * Error thrown when PNG export fails (e.g. tainted canvas or memory limit).
 */
export class PngExportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PngExportError';
  }
}

/**
 * Error thrown when SVG serialisation fails.
 */
export class SvgExportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SvgExportError';
  }
}

export class ExportEngine {
  private stage: any;
  private state: DiagramState;

  /**
   * Creates an ExportEngine instance.
   *
   * @param stage - The Konva.Stage instance (from CanvasController.getStage()).
   * @param state - The current DiagramState containing all diagram elements.
   */
  constructor(stage: any, state: DiagramState) {
    this.stage = stage;
    this.state = state;
  }

  /**
   * Updates the state reference (call when state changes).
   */
  setState(state: DiagramState): void {
    this.state = state;
  }

  /**
   * Updates the stage reference (call if stage is re-initialised).
   */
  setStage(stage: any): void {
    this.stage = stage;
  }

  /**
   * Returns whether the canvas has any exportable content.
   */
  canExport(): boolean {
    return this.state.components.size > 0 || this.state.containers.size > 0;
  }

  /**
   * Exports the current diagram as a PNG Blob.
   *
   * Uses Konva's `stage.toDataURL()` with a pixel ratio multiplier to achieve
   * 150+ DPI resolution at A4 size. A pixelRatio of 2 on a 620x877 stage
   * produces a 1240x1754 image, meeting the minimum resolution requirement.
   *
   * @param options - PNG export options (pixelRatio, backgroundColor).
   * @returns A Promise resolving to the PNG Blob.
   * @throws EmptyCanvasError if the canvas has no components.
   * @throws PngExportError if PNG generation fails.
   */
  async exportAsPng(options: PngExportOptions): Promise<Blob> {
    if (!this.canExport()) {
      throw new EmptyCanvasError();
    }

    if (!this.stage) {
      throw new PngExportError('Export failed. Canvas stage is not available.');
    }

    const pixelRatio = options.pixelRatio || 2;
    const backgroundColor = options.backgroundColor || DEFAULT_BACKGROUND_COLOR;

    try {
      const dataUrl: string = this.stage.toDataURL({
        pixelRatio,
        mimeType: 'image/png',
        quality: 1,
        ...(backgroundColor !== 'transparent' ? {} : {}),
      });

      // Draw background by temporarily adding a background rect if needed
      // Konva's toDataURL doesn't support backgroundColor directly,
      // so we use a workaround with a temporary layer/rect
      const dataUrlWithBg = await this.generatePngWithBackground(
        pixelRatio,
        backgroundColor
      );

      return this.dataUrlToBlob(dataUrlWithBg);
    } catch (error: any) {
      throw new PngExportError(
        `Export failed. Try reducing diagram complexity. (${error.message || 'Unknown error'})`
      );
    }
  }

  /**
   * Exports the current diagram as an SVG string.
   *
   * Builds a custom SVG document by iterating the DiagramState and creating
   * corresponding SVG elements for each container, component, connector,
   * and label.
   *
   * @returns The SVG document as a string.
   * @throws EmptyCanvasError if the canvas has no components.
   * @throws SvgExportError if SVG serialisation fails.
   */
  exportAsSvg(): string {
    if (!this.canExport()) {
      throw new EmptyCanvasError();
    }

    try {
      const stageWidth = this.stage?.width() || A4_WIDTH_PX;
      const stageHeight = this.stage?.height() || A4_HEIGHT_PX;

      let svg = this.createSvgHeader(stageWidth, stageHeight);

      // Add a white background rect
      svg += `  <rect width="${stageWidth}" height="${stageHeight}" fill="#ffffff" />\n`;

      // Render containers (bottom layer)
      for (const [, container] of this.state.containers) {
        svg += this.containerToSvg(container);
      }

      // Render connectors (middle layer)
      for (const [, connector] of this.state.connectors) {
        svg += this.connectorToSvg(connector);
      }

      // Render components (top layer)
      for (const [, component] of this.state.components) {
        svg += this.componentToSvg(component);
      }

      svg += '</svg>';

      // Validate basic SVG structure
      if (!svg.includes('<svg') || !svg.includes('</svg>')) {
        throw new Error('Generated SVG markup is malformed.');
      }

      return svg;
    } catch (error: any) {
      if (error instanceof EmptyCanvasError) {
        throw error;
      }
      throw new SvgExportError(
        `SVG export failed. (${error.message || 'Unknown error'})`
      );
    }
  }

  /**
   * Triggers a browser file download for the given data.
   *
   * Creates a hidden anchor element with a Blob URL and clicks it
   * programmatically to initiate the download.
   *
   * @param data - A Blob or SVG string to download.
   * @param filename - The filename for the downloaded file.
   */
  triggerDownload(data: Blob | string, filename: string): void {
    let blob: Blob;

    if (typeof data === 'string') {
      // SVG string — wrap in a Blob with SVG MIME type
      blob = new Blob([data], { type: 'image/svg+xml;charset=utf-8' });
    } else {
      blob = data;
    }

    const url = URL.createObjectURL(blob);

    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';

      document.body.appendChild(link);
      link.click();

      // Clean up after a short delay to allow the download to start
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (error: any) {
      URL.revokeObjectURL(url);
      throw new Error(
        'Download was blocked. Please allow downloads for this site.'
      );
    }
  }

  // ─── Private Helper Methods ─────────────────────────────────────────

  /**
   * Generates a PNG data URL with a background colour by temporarily adding
   * a background rect to the stage.
   */
  private async generatePngWithBackground(
    pixelRatio: number,
    backgroundColor: string
  ): Promise<string> {
    // Find the first layer to add background behind everything
    const layers = this.stage.getLayers();
    const firstLayer = layers[0];

    // Create a temporary background rect
    const bgRect = new Konva.Rect({
      x: 0,
      y: 0,
      width: this.stage.width(),
      height: this.stage.height(),
      fill: backgroundColor,
      listening: false,
      name: '_export_bg_temp',
    });

    // Insert at the bottom of the first layer
    firstLayer.add(bgRect);
    bgRect.moveToBottom();
    firstLayer.batchDraw();

    try {
      const dataUrl: string = this.stage.toDataURL({
        pixelRatio,
        mimeType: 'image/png',
        quality: 1,
      });
      return dataUrl;
    } finally {
      // Remove the temporary background rect
      bgRect.destroy();
      firstLayer.batchDraw();
    }
  }

  /**
   * Converts a data URL string to a Blob.
   */
  private dataUrlToBlob(dataUrl: string): Blob {
    const parts = dataUrl.split(',');
    if (parts.length !== 2) {
      throw new PngExportError('Invalid data URL generated during export.');
    }

    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/png';

    const byteString = atob(parts[1]);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const uintArray = new Uint8Array(arrayBuffer);

    for (let i = 0; i < byteString.length; i++) {
      uintArray[i] = byteString.charCodeAt(i);
    }

    return new Blob([arrayBuffer], { type: mime });
  }

  /**
   * Creates the SVG document header with viewBox and namespace declarations.
   */
  private createSvgHeader(width: number, height: number): string {
    return (
      `<svg xmlns="${SVG_NS}" xmlns:xlink="${XLINK_NS}" ` +
      `width="${width}" height="${height}" ` +
      `viewBox="0 0 ${width} ${height}">\n`
    );
  }

  /**
   * Serialises a DiagramContainer to SVG markup (rect + label text).
   */
  private containerToSvg(container: DiagramContainer): string {
    const { bounds, style, label } = container;
    let svg = '';

    // Container rect with border and background
    svg += `  <rect x="${bounds.x}" y="${bounds.y}" `;
    svg += `width="${bounds.width}" height="${bounds.height}" `;
    svg += `fill="${style.backgroundColor}" `;
    svg += `stroke="${style.borderColor}" `;
    svg += `stroke-width="1.5" `;
    svg += `stroke-dasharray="4 2" `;
    svg += `rx="${style.borderRadius}" ry="${style.borderRadius}" />\n`;

    // Container label text
    svg += `  <text x="${bounds.x + CONTAINER_LABEL_PADDING}" `;
    svg += `y="${bounds.y + CONTAINER_LABEL_PADDING + CONTAINER_LABEL_FONT_SIZE}" `;
    svg += `font-family="${LABEL_FONT_FAMILY}" `;
    svg += `font-size="${CONTAINER_LABEL_FONT_SIZE}" `;
    svg += `font-weight="bold" `;
    svg += `fill="${style.borderColor}">${this.escapeXml(label)}</text>\n`;

    return svg;
  }

  /**
   * Serialises a DiagramComponent to SVG markup (image + label text).
   */
  private componentToSvg(component: DiagramComponent): string {
    const { position, size, iconPath, label } = component;
    let svg = '';

    // Component icon as an SVG <image> element
    if (iconPath) {
      const href = iconPath.startsWith('/') ? iconPath : `/${iconPath}`;
      svg += `  <image x="${position.x}" y="${position.y}" `;
      svg += `width="${size.width}" height="${size.height}" `;
      svg += `href="${this.escapeXml(href)}" />\n`;
    } else {
      // Fallback placeholder rect for components without icons
      svg += `  <rect x="${position.x}" y="${position.y}" `;
      svg += `width="${size.width}" height="${size.height}" `;
      svg += `fill="#e0e0e0" stroke="#999999" stroke-width="1" rx="4" ry="4" />\n`;
    }

    // Component label text below the icon
    const labelX = position.x + size.width / 2;
    const labelY = position.y + size.height + LABEL_OFFSET_Y + LABEL_FONT_SIZE;
    svg += `  <text x="${labelX}" y="${labelY}" `;
    svg += `font-family="${LABEL_FONT_FAMILY}" `;
    svg += `font-size="${LABEL_FONT_SIZE}" `;
    svg += `fill="#333333" text-anchor="middle">${this.escapeXml(label)}</text>\n`;

    return svg;
  }

  /**
   * Serialises a DiagramConnector to SVG markup (polyline/path + optional label).
   */
  private connectorToSvg(connector: DiagramConnector): string {
    const { routePath, directed, label } = connector;
    let svg = '';

    if (!routePath || routePath.points.length < 2) {
      return svg;
    }

    // Build polyline points string
    const pointsStr = routePath.points
      .map((pt: Point) => `${pt.x},${pt.y}`)
      .join(' ');

    if (directed) {
      // Use a path with an arrowhead marker
      svg += this.createArrowMarkerDef(connector.id);
      svg += `  <polyline points="${pointsStr}" `;
      svg += `fill="none" `;
      svg += `stroke="${CONNECTOR_STROKE_COLOR}" `;
      svg += `stroke-width="${CONNECTOR_STROKE_WIDTH}" `;
      svg += `stroke-linecap="round" stroke-linejoin="round" `;
      svg += `marker-end="url(#arrow-${connector.id})" />\n`;
    } else {
      svg += `  <polyline points="${pointsStr}" `;
      svg += `fill="none" `;
      svg += `stroke="${CONNECTOR_STROKE_COLOR}" `;
      svg += `stroke-width="${CONNECTOR_STROKE_WIDTH}" `;
      svg += `stroke-linecap="round" stroke-linejoin="round" />\n`;
    }

    // Connector label at the midpoint
    if (label) {
      const midIdx = Math.floor(routePath.points.length / 2);
      const midPoint = routePath.points[midIdx];
      svg += `  <text x="${midPoint.x}" y="${midPoint.y - 6}" `;
      svg += `font-family="${LABEL_FONT_FAMILY}" `;
      svg += `font-size="11" `;
      svg += `fill="#555555" text-anchor="middle">${this.escapeXml(label)}</text>\n`;
    }

    return svg;
  }

  /**
   * Creates an SVG marker definition for an arrowhead.
   */
  private createArrowMarkerDef(connectorId: string): string {
    let svg = `  <defs>\n`;
    svg += `    <marker id="arrow-${connectorId}" markerWidth="${CONNECTOR_ARROW_SIZE}" `;
    svg += `markerHeight="${CONNECTOR_ARROW_SIZE}" refX="${CONNECTOR_ARROW_SIZE}" refY="${CONNECTOR_ARROW_SIZE / 2}" `;
    svg += `orient="auto" markerUnits="userSpaceOnUse">\n`;
    svg += `      <path d="M 0 0 L ${CONNECTOR_ARROW_SIZE} ${CONNECTOR_ARROW_SIZE / 2} L 0 ${CONNECTOR_ARROW_SIZE} Z" `;
    svg += `fill="${CONNECTOR_STROKE_COLOR}" />\n`;
    svg += `    </marker>\n`;
    svg += `  </defs>\n`;
    return svg;
  }

  /**
   * Escapes special XML characters in text content.
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
