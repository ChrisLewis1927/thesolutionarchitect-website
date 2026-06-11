/**
 * Test utility functions for diagram-creator tests.
 * Provides factory functions and assertion helpers.
 */
import type {
  DiagramState,
  DiagramComponent,
  DiagramContainer,
  DiagramConnector,
  Point,
  Rect,
  ContainerType,
  ContainerStyle,
  RoutePath,
  ServiceIcon,
  ArchitectureTemplate,
  TemplateDef,
} from '../../../js/diagram-creator/types';

// --- Factory Functions ---

/** Create a minimal DiagramState for testing */
export function createEmptyDiagramState(
  platformId: 'aws' | 'azure' | 'gcp' = 'aws'
): DiagramState {
  return {
    id: 'test-diagram-1',
    platformId,
    templateId: null,
    components: new Map(),
    containers: new Map(),
    connectors: new Map(),
  };
}

/** Create a DiagramComponent with sensible defaults */
export function createComponent(overrides?: Partial<DiagramComponent>): DiagramComponent {
  return {
    id: overrides?.id ?? 'comp-1',
    serviceId: 'ec2',
    serviceName: 'EC2',
    iconPath: 'images/diagram-icons/aws/compute/ec2.svg',
    position: { x: 100, y: 100 },
    size: { width: 48, height: 48 },
    containerId: null,
    label: 'EC2 Instance',
    ...overrides,
  };
}

/** Create a DiagramContainer with sensible defaults */
export function createContainer(overrides?: Partial<DiagramContainer>): DiagramContainer {
  return {
    id: overrides?.id ?? 'container-1',
    type: 'vpc',
    label: 'VPC',
    bounds: { x: 50, y: 50, width: 400, height: 300 },
    parentId: null,
    childIds: [],
    nestingLevel: 0,
    style: {
      borderColor: '#2196F3',
      backgroundColor: '#E3F2FD',
      borderRadius: 8,
      padding: 20,
    },
    ...overrides,
  };
}

/** Create a DiagramConnector with sensible defaults */
export function createConnector(overrides?: Partial<DiagramConnector>): DiagramConnector {
  return {
    id: overrides?.id ?? 'conn-1',
    sourceComponentId: 'comp-1',
    targetComponentId: 'comp-2',
    directed: true,
    label: '',
    routePath: {
      points: [
        { x: 148, y: 124 },
        { x: 300, y: 124 },
      ],
      sourceAnchor: { x: 148, y: 124 },
      targetAnchor: { x: 300, y: 124 },
    },
    ...overrides,
  };
}

/** Create a ServiceIcon entry for testing */
export function createServiceIcon(overrides?: Partial<ServiceIcon>): ServiceIcon {
  return {
    id: 'ec2',
    name: 'EC2',
    iconPath: 'images/diagram-icons/aws/compute/ec2.svg',
    defaultWidth: 48,
    defaultHeight: 48,
    ...overrides,
  };
}

/** Create a sample TemplateDef for testing */
export function createTemplateDef(overrides?: Partial<TemplateDef>): TemplateDef {
  return {
    components: overrides?.components ?? [
      { id: 'comp-1', serviceId: 'ec2', position: { x: 100, y: 100 } },
      { id: 'comp-2', serviceId: 's3', position: { x: 300, y: 100 } },
    ],
    containers: overrides?.containers ?? [
      { id: 'vpc-1', type: 'vpc', label: 'VPC', children: ['comp-1', 'comp-2'] },
    ],
    connectors: overrides?.connectors ?? [
      { id: 'conn-1', sourceId: 'comp-1', targetId: 'comp-2', directed: true },
    ],
  };
}

/** Create an ArchitectureTemplate for testing */
export function createTemplate(overrides?: Partial<ArchitectureTemplate>): ArchitectureTemplate {
  return {
    id: 'aws-web-service',
    platformId: 'aws',
    name: 'Public-Facing Web Service',
    description: 'Classic multi-AZ web application',
    thumbnailUrl: 'images/diagram-templates/aws-web-service-thumb.png',
    definition: createTemplateDef(),
    ...overrides,
  };
}

// --- Assertion Helpers ---

/** Check if a point is inside a rect (inclusive) */
export function isPointInRect(point: Point, rect: Rect): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

/** Check if rectA fully contains rectB */
export function rectContains(outer: Rect, inner: Rect): boolean {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.width <= outer.x + outer.width &&
    inner.y + inner.height <= outer.y + outer.height
  );
}

/** Check if two rects overlap */
export function rectsOverlap(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/** Convert a component's position and size to a Rect */
export function componentToRect(component: DiagramComponent): Rect {
  return {
    x: component.position.x,
    y: component.position.y,
    width: component.size.width,
    height: component.size.height,
  };
}
