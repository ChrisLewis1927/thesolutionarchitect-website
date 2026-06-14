var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
const A4_WIDTH_PX = 1240;
const A4_HEIGHT_PX = 1754;
const DEFAULT_BACKGROUND_COLOR = "#ffffff";
const SVG_NS = "http://www.w3.org/2000/svg";
const XLINK_NS = "http://www.w3.org/1999/xlink";
const LABEL_FONT_SIZE = 12;
const LABEL_FONT_FAMILY = "Inter, Arial, sans-serif";
const LABEL_OFFSET_Y = 6;
const CONNECTOR_STROKE_COLOR = "#555555";
const CONNECTOR_STROKE_WIDTH = 2;
const CONNECTOR_ARROW_SIZE = 8;
const CONTAINER_LABEL_FONT_SIZE = 13;
const CONTAINER_LABEL_PADDING = 8;
class EmptyCanvasError extends Error {
  constructor() {
    super("Cannot export an empty canvas. Add components before exporting.");
    this.name = "EmptyCanvasError";
  }
}
class PngExportError extends Error {
  constructor(message) {
    super(message);
    this.name = "PngExportError";
  }
}
class SvgExportError extends Error {
  constructor(message) {
    super(message);
    this.name = "SvgExportError";
  }
}
class ExportEngine {
  /**
   * Creates an ExportEngine instance.
   *
   * @param stage - The Konva.Stage instance (from CanvasController.getStage()).
   * @param state - The current DiagramState containing all diagram elements.
   */
  constructor(stage, state) {
    __publicField(this, "stage");
    __publicField(this, "state");
    this.stage = stage;
    this.state = state;
  }
  /**
   * Updates the state reference (call when state changes).
   */
  setState(state) {
    this.state = state;
  }
  /**
   * Updates the stage reference (call if stage is re-initialised).
   */
  setStage(stage) {
    this.stage = stage;
  }
  /**
   * Returns whether the canvas has any exportable content.
   */
  canExport() {
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
  async exportAsPng(options) {
    if (!this.canExport()) {
      throw new EmptyCanvasError();
    }
    if (!this.stage) {
      throw new PngExportError("Export failed. Canvas stage is not available.");
    }
    const pixelRatio = options.pixelRatio || 2;
    const backgroundColor = options.backgroundColor || DEFAULT_BACKGROUND_COLOR;
    try {
      const dataUrl = this.stage.toDataURL({
        pixelRatio,
        mimeType: "image/png",
        quality: 1,
        ...backgroundColor !== "transparent" ? {} : {}
      });
      const dataUrlWithBg = await this.generatePngWithBackground(
        pixelRatio,
        backgroundColor
      );
      return this.dataUrlToBlob(dataUrlWithBg);
    } catch (error) {
      throw new PngExportError(
        `Export failed. Try reducing diagram complexity. (${error.message || "Unknown error"})`
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
  exportAsSvg() {
    if (!this.canExport()) {
      throw new EmptyCanvasError();
    }
    try {
      const stageWidth = this.stage?.width() || A4_WIDTH_PX;
      const stageHeight = this.stage?.height() || A4_HEIGHT_PX;
      let svg = this.createSvgHeader(stageWidth, stageHeight);
      svg += `  <rect width="${stageWidth}" height="${stageHeight}" fill="#ffffff" />
`;
      for (const [, container] of this.state.containers) {
        svg += this.containerToSvg(container);
      }
      for (const [, connector] of this.state.connectors) {
        svg += this.connectorToSvg(connector);
      }
      for (const [, component] of this.state.components) {
        svg += this.componentToSvg(component);
      }
      svg += "</svg>";
      if (!svg.includes("<svg") || !svg.includes("</svg>")) {
        throw new Error("Generated SVG markup is malformed.");
      }
      return svg;
    } catch (error) {
      if (error instanceof EmptyCanvasError) {
        throw error;
      }
      throw new SvgExportError(
        `SVG export failed. (${error.message || "Unknown error"})`
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
  triggerDownload(data, filename) {
    let blob;
    if (typeof data === "string") {
      blob = new Blob([data], { type: "image/svg+xml;charset=utf-8" });
    } else {
      blob = data;
    }
    const url = URL.createObjectURL(blob);
    try {
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      URL.revokeObjectURL(url);
      throw new Error(
        "Download was blocked. Please allow downloads for this site."
      );
    }
  }
  // ─── Private Helper Methods ─────────────────────────────────────────
  /**
   * Generates a PNG data URL with a background colour by temporarily adding
   * a background rect to the stage.
   */
  async generatePngWithBackground(pixelRatio, backgroundColor) {
    const layers = this.stage.getLayers();
    const firstLayer = layers[0];
    const bgRect = new Konva.Rect({
      x: 0,
      y: 0,
      width: this.stage.width(),
      height: this.stage.height(),
      fill: backgroundColor,
      listening: false,
      name: "_export_bg_temp"
    });
    firstLayer.add(bgRect);
    bgRect.moveToBottom();
    firstLayer.batchDraw();
    try {
      const dataUrl = this.stage.toDataURL({
        pixelRatio,
        mimeType: "image/png",
        quality: 1
      });
      return dataUrl;
    } finally {
      bgRect.destroy();
      firstLayer.batchDraw();
    }
  }
  /**
   * Converts a data URL string to a Blob.
   */
  dataUrlToBlob(dataUrl) {
    const parts = dataUrl.split(",");
    if (parts.length !== 2) {
      throw new PngExportError("Invalid data URL generated during export.");
    }
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : "image/png";
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
  createSvgHeader(width, height) {
    return `<svg xmlns="${SVG_NS}" xmlns:xlink="${XLINK_NS}" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
`;
  }
  /**
   * Serialises a DiagramContainer to SVG markup (rect + label text).
   */
  containerToSvg(container) {
    const { bounds, style, label } = container;
    let svg = "";
    svg += `  <rect x="${bounds.x}" y="${bounds.y}" `;
    svg += `width="${bounds.width}" height="${bounds.height}" `;
    svg += `fill="${style.backgroundColor}" `;
    svg += `stroke="${style.borderColor}" `;
    svg += `stroke-width="1.5" `;
    svg += `stroke-dasharray="4 2" `;
    svg += `rx="${style.borderRadius}" ry="${style.borderRadius}" />
`;
    svg += `  <text x="${bounds.x + CONTAINER_LABEL_PADDING}" `;
    svg += `y="${bounds.y + CONTAINER_LABEL_PADDING + CONTAINER_LABEL_FONT_SIZE}" `;
    svg += `font-family="${LABEL_FONT_FAMILY}" `;
    svg += `font-size="${CONTAINER_LABEL_FONT_SIZE}" `;
    svg += `font-weight="bold" `;
    svg += `fill="${style.borderColor}">${this.escapeXml(label)}</text>
`;
    return svg;
  }
  /**
   * Serialises a DiagramComponent to SVG markup (image + label text).
   */
  componentToSvg(component) {
    const { position, size, iconPath, label } = component;
    let svg = "";
    if (iconPath) {
      const href = iconPath.startsWith("/") ? iconPath : `/${iconPath}`;
      svg += `  <image x="${position.x}" y="${position.y}" `;
      svg += `width="${size.width}" height="${size.height}" `;
      svg += `href="${this.escapeXml(href)}" />
`;
    } else {
      svg += `  <rect x="${position.x}" y="${position.y}" `;
      svg += `width="${size.width}" height="${size.height}" `;
      svg += `fill="#e0e0e0" stroke="#999999" stroke-width="1" rx="4" ry="4" />
`;
    }
    const labelX = position.x + size.width / 2;
    const labelY = position.y + size.height + LABEL_OFFSET_Y + LABEL_FONT_SIZE;
    svg += `  <text x="${labelX}" y="${labelY}" `;
    svg += `font-family="${LABEL_FONT_FAMILY}" `;
    svg += `font-size="${LABEL_FONT_SIZE}" `;
    svg += `fill="#333333" text-anchor="middle">${this.escapeXml(label)}</text>
`;
    return svg;
  }
  /**
   * Serialises a DiagramConnector to SVG markup (polyline/path + optional label).
   */
  connectorToSvg(connector) {
    const { routePath, directed, label } = connector;
    let svg = "";
    if (!routePath || routePath.points.length < 2) {
      return svg;
    }
    const pointsStr = routePath.points.map((pt) => `${pt.x},${pt.y}`).join(" ");
    if (directed) {
      svg += this.createArrowMarkerDef(connector.id);
      svg += `  <polyline points="${pointsStr}" `;
      svg += `fill="none" `;
      svg += `stroke="${CONNECTOR_STROKE_COLOR}" `;
      svg += `stroke-width="${CONNECTOR_STROKE_WIDTH}" `;
      svg += `stroke-linecap="round" stroke-linejoin="round" `;
      svg += `marker-end="url(#arrow-${connector.id})" />
`;
    } else {
      svg += `  <polyline points="${pointsStr}" `;
      svg += `fill="none" `;
      svg += `stroke="${CONNECTOR_STROKE_COLOR}" `;
      svg += `stroke-width="${CONNECTOR_STROKE_WIDTH}" `;
      svg += `stroke-linecap="round" stroke-linejoin="round" />
`;
    }
    if (label) {
      const midIdx = Math.floor(routePath.points.length / 2);
      const midPoint = routePath.points[midIdx];
      svg += `  <text x="${midPoint.x}" y="${midPoint.y - 6}" `;
      svg += `font-family="${LABEL_FONT_FAMILY}" `;
      svg += `font-size="11" `;
      svg += `fill="#555555" text-anchor="middle">${this.escapeXml(label)}</text>
`;
    }
    return svg;
  }
  /**
   * Creates an SVG marker definition for an arrowhead.
   */
  createArrowMarkerDef(connectorId) {
    let svg = `  <defs>
`;
    svg += `    <marker id="arrow-${connectorId}" markerWidth="${CONNECTOR_ARROW_SIZE}" `;
    svg += `markerHeight="${CONNECTOR_ARROW_SIZE}" refX="${CONNECTOR_ARROW_SIZE}" refY="${CONNECTOR_ARROW_SIZE / 2}" `;
    svg += `orient="auto" markerUnits="userSpaceOnUse">
`;
    svg += `      <path d="M 0 0 L ${CONNECTOR_ARROW_SIZE} ${CONNECTOR_ARROW_SIZE / 2} L 0 ${CONNECTOR_ARROW_SIZE} Z" `;
    svg += `fill="${CONNECTOR_STROKE_COLOR}" />
`;
    svg += `    </marker>
`;
    svg += `  </defs>
`;
    return svg;
  }
  /**
   * Escapes special XML characters in text content.
   */
  escapeXml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
  }
}
export {
  EmptyCanvasError,
  ExportEngine,
  PngExportError,
  SvgExportError
};
