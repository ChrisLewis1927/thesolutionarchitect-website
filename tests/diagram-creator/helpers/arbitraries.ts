/**
 * Test helper utilities for generating arbitrary diagram states
 * using fast-check arbitraries. Used across property and unit tests
 * for the architecture-diagram-creator feature.
 */
import * as fc from 'fast-check';
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
} from '../../../js/diagram-creator/types';

// --- Primitive Arbitraries ---

/** Arbitrary point within typical canvas bounds (0-2000 x 0-1500) */
export const arbPoint = (): fc.Arbitrary<Point> =>
  fc.record({
    x: fc.integer({ min: 0, max: 2000 }),
    y: fc.integer({ min: 0, max: 1500 }),
  });

/** Arbitrary point constrained to specific bounds */
export const arbPointInBounds = (
  maxX: number,
  maxY: number
): fc.Arbitrary<Point> =>
  fc.record({
    x: fc.integer({ min: 0, max: maxX }),
    y: fc.integer({ min: 0, max: maxY }),
  });

/** Arbitrary rectangle with positive dimensions */
export const arbRect = (): fc.Arbitrary<Rect> =>
  fc.record({
    x: fc.integer({ min: 0, max: 1800 }),
    y: fc.integer({ min: 0, max: 1300 }),
    width: fc.integer({ min: 20, max: 400 }),
    height: fc.integer({ min: 20, max: 300 }),
  });

/** Arbitrary container type */
export const arbContainerType = (): fc.Arbitrary<ContainerType> =>
  fc.constantFrom('vpc', 'subnet', 'az', 'resource-group', 'region');

/** Arbitrary platform ID */
export const arbPlatformId = (): fc.Arbitrary<'aws' | 'azure' | 'gcp'> =>
  fc.constantFrom('aws', 'azure', 'gcp');

// --- Service & Icon Arbitraries ---

/** Arbitrary service ID (formatted like real service IDs) */
export const arbServiceId = (): fc.Arbitrary<string> =>
  fc.stringMatching(/^[a-z][a-z0-9-]{2,20}$/);

/** Arbitrary service name (human-readable) */
export const arbServiceName = (): fc.Arbitrary<string> =>
  fc.string({ minLength: 2, maxLength: 30 }).filter((s) => s.trim().length > 0);

// --- Component Arbitraries ---

/** Arbitrary unique ID string */
export const arbId = (): fc.Arbitrary<string> =>
  fc.uuid();

/** Arbitrary DiagramComponent */
export const arbDiagramComponent = (
  id?: string
): fc.Arbitrary<DiagramComponent> =>
  fc.record({
    id: id ? fc.constant(id) : arbId(),
    serviceId: arbServiceId(),
    serviceName: arbServiceName(),
    iconPath: fc.constant('images/diagram-icons/aws/compute/ec2.svg'),
    position: arbPoint(),
    size: fc.record({
      width: fc.integer({ min: 32, max: 64 }),
      height: fc.integer({ min: 32, max: 64 }),
    }),
    containerId: fc.option(arbId(), { nil: null }),
    label: fc.string({ minLength: 0, maxLength: 30 }),
  });

// --- Container Arbitraries ---

/** Arbitrary ContainerStyle */
export const arbContainerStyle = (): fc.Arbitrary<ContainerStyle> =>
  fc.record({
    borderColor: fc.hexaString({ minLength: 6, maxLength: 6 }).map((h) => `#${h}`),
    backgroundColor: fc.hexaString({ minLength: 6, maxLength: 6 }).map((h) => `#${h}`),
    borderRadius: fc.integer({ min: 0, max: 12 }),
    padding: fc.integer({ min: 10, max: 40 }),
  });

/** Arbitrary DiagramContainer */
export const arbDiagramContainer = (
  id?: string
): fc.Arbitrary<DiagramContainer> =>
  fc.record({
    id: id ? fc.constant(id) : arbId(),
    type: arbContainerType(),
    label: fc.string({ minLength: 1, maxLength: 30 }),
    bounds: arbRect(),
    parentId: fc.option(arbId(), { nil: null }),
    childIds: fc.array(arbId(), { minLength: 0, maxLength: 5 }),
    nestingLevel: fc.integer({ min: 0, max: 5 }),
    style: arbContainerStyle(),
  });

// --- Connector Arbitraries ---

/** Arbitrary RoutePath */
export const arbRoutePath = (): fc.Arbitrary<RoutePath> =>
  fc.record({
    points: fc.array(arbPoint(), { minLength: 2, maxLength: 8 }),
    sourceAnchor: arbPoint(),
    targetAnchor: arbPoint(),
  });

/** Arbitrary DiagramConnector */
export const arbDiagramConnector = (
  id?: string
): fc.Arbitrary<DiagramConnector> =>
  fc.record({
    id: id ? fc.constant(id) : arbId(),
    sourceComponentId: arbId(),
    targetComponentId: arbId(),
    directed: fc.boolean(),
    label: fc.string({ minLength: 0, maxLength: 30 }),
    routePath: arbRoutePath(),
  });

// --- Diagram State Arbitraries ---

/** Arbitrary DiagramState with configurable sizes */
export const arbDiagramState = (options?: {
  minComponents?: number;
  maxComponents?: number;
  minContainers?: number;
  maxContainers?: number;
  minConnectors?: number;
  maxConnectors?: number;
}): fc.Arbitrary<DiagramState> => {
  const {
    minComponents = 0,
    maxComponents = 10,
    minContainers = 0,
    maxContainers = 5,
    minConnectors = 0,
    maxConnectors = 8,
  } = options ?? {};

  return fc
    .record({
      id: arbId(),
      platformId: arbPlatformId(),
      templateId: fc.option(arbId(), { nil: null }),
      components: fc.array(arbDiagramComponent(), {
        minLength: minComponents,
        maxLength: maxComponents,
      }),
      containers: fc.array(arbDiagramContainer(), {
        minLength: minContainers,
        maxLength: maxContainers,
      }),
      connectors: fc.array(arbDiagramConnector(), {
        minLength: minConnectors,
        maxLength: maxConnectors,
      }),
    })
    .map(({ id, platformId, templateId, components, containers, connectors }) => ({
      id,
      platformId,
      templateId,
      components: new Map(components.map((c) => [c.id, c])),
      containers: new Map(containers.map((c) => [c.id, c])),
      connectors: new Map(connectors.map((c) => [c.id, c])),
    }));
};
