/**
 * Core TypeScript interfaces for the Architecture Diagram Creator module.
 * These types define the shared data structures used across all diagram-creator services.
 */

// --- Geometry Primitives ---

/** A 2D point on the canvas. */
export interface Point {
  x: number;
  y: number;
}

/** A rectangular bounding box. */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// --- Container Types ---

/** Supported container types representing infrastructure boundaries. */
export type ContainerType = 'vpc' | 'subnet' | 'az' | 'resource-group' | 'region';

/** Visual style applied to containers based on nesting level. */
export interface ContainerStyle {
  borderColor: string;
  backgroundColor: string;
  borderRadius: number;
  padding: number;
}

// --- Diagram Components ---

/** A single cloud service component placed on the diagram canvas. */
export interface DiagramComponent {
  id: string;
  serviceId: string;
  serviceName: string;
  iconPath: string;
  position: Point;
  size: { width: number; height: number };
  containerId: string | null;
  label: string;
}

/** A container element (VPC, subnet, AZ, etc.) that groups child components. */
export interface DiagramContainer {
  id: string;
  type: ContainerType;
  label: string;
  bounds: Rect;
  parentId: string | null;
  childIds: string[];
  nestingLevel: number;
  style: ContainerStyle;
}

// --- Connectors ---

/** The calculated route path for a connector between two components. */
export interface RoutePath {
  points: Point[];
  sourceAnchor: Point;
  targetAnchor: Point;
}

/** A connection line/arrow between two diagram components. */
export interface DiagramConnector {
  id: string;
  sourceComponentId: string;
  targetComponentId: string;
  directed: boolean;
  label: string;
  routePath: RoutePath;
}

// --- Diagram State ---

/** The central data structure holding the entire diagram. */
export interface DiagramState {
  id: string;
  platformId: 'aws' | 'azure' | 'gcp';
  templateId: string | null;
  components: Map<string, DiagramComponent>;
  containers: Map<string, DiagramContainer>;
  connectors: Map<string, DiagramConnector>;
}

// --- Platform & Icons ---

/** A supported cloud platform. */
export interface Platform {
  id: 'aws' | 'azure' | 'gcp';
  name: string;
  logoUrl: string;
}

/** The full icon manifest for a platform. */
export interface IconManifest {
  platformId: string;
  categories: IconCategory[];
}

/** A category of cloud services (e.g. Compute, Storage). */
export interface IconCategory {
  id: string;
  name: string;
  services: ServiceIcon[];
}

/** A single cloud service icon entry. */
export interface ServiceIcon {
  id: string;
  name: string;
  iconPath: string;
  defaultWidth: number;
  defaultHeight: number;
}

// --- Templates ---

/** An architecture pattern template available for selection. */
export interface ArchitectureTemplate {
  id: string;
  platformId: string;
  name: string;
  description: string;
  thumbnailUrl: string;
  definition: TemplateDef;
}

/** The structural definition of a template diagram. */
export interface TemplateDef {
  components: TemplateComponent[];
  containers: TemplateContainer[];
  connectors: TemplateConnector[];
}

/** A component placement within a template. */
export interface TemplateComponent {
  id: string;
  serviceId: string;
  position: { x: number; y: number };
  parentContainerId?: string;
}

/** A container definition within a template. */
export interface TemplateContainer {
  id: string;
  type: ContainerType;
  label: string;
  parentContainerId?: string;
  children: string[];
}

/** A connector definition within a template. */
export interface TemplateConnector {
  id: string;
  sourceId: string;
  targetId: string;
  label?: string;
  directed: boolean;
}

// --- Layout Engine ---

/** Input node for the auto-layout engine. */
export interface ContainerNode {
  id: string;
  width: number;
  height: number;
  children: string[];
}

/** Result produced by the auto-layout engine. */
export interface LayoutResult {
  positions: Map<string, Point>;
  containerBounds: Map<string, Rect>;
}

// --- Export ---

/** Options for PNG export. */
export interface PngExportOptions {
  pixelRatio: number;
  backgroundColor: string;
}
