/**
 * ConnectorRouter - Renders and routes connection lines between components
 * with intelligent path routing to avoid overlaps.
 *
 * Uses Manhattan (orthogonal) routing with waypoints around obstacle components.
 * Computes anchor points on source/target bounding box edges nearest to the
 * other component's centre.
 */

import type {
  DiagramState,
  DiagramConnector,
  DiagramComponent,
  RoutePath,
  Point,
  Rect,
} from './types';

/** Counter for generating unique connector IDs. */
let connectorIdCounter = 0;

/** Margin around obstacles when routing paths (px). */
const OBSTACLE_MARGIN = 16;

/** Tolerance for determining if an anchor point is on/adjacent to a bounding box edge (px). */
const ANCHOR_TOLERANCE = 2;

/**
 * Generates a unique connector ID.
 */
function generateConnectorId(): string {
  connectorIdCounter++;
  return `connector-${Date.now()}-${connectorIdCounter}`;
}

/**
 * Resets the connector ID counter (used in tests).
 */
export function resetConnectorIdCounter(): void {
  connectorIdCounter = 0;
}

export class ConnectorRouter {
  private state: DiagramState;

  constructor(state: DiagramState) {
    this.state = state;
  }

  /**
   * Creates a new connector between two components and computes its route path.
   *
   * @param sourceId - The ID of the source component
   * @param targetId - The ID of the target component
   * @param directed - Whether the connector has an arrowhead (directional)
   * @returns The generated connector ID, or empty string if invalid
   */
  addConnector(sourceId: string, targetId: string, directed: boolean): string {
    const source = this.state.components.get(sourceId);
    const target = this.state.components.get(targetId);

    if (!source || !target) {
      return '';
    }

    // Reject self-referencing connectors
    if (sourceId === targetId) {
      return '';
    }

    const id = generateConnectorId();
    const routePath = this.computeRoute(source, target);

    const connector: DiagramConnector = {
      id,
      sourceComponentId: sourceId,
      targetComponentId: targetId,
      directed,
      label: '',
      routePath,
    };

    this.state.connectors.set(id, connector);
    return id;
  }

  /**
   * Removes a connector from the diagram state.
   *
   * @param connectorId - The ID of the connector to remove
   */
  removeConnector(connectorId: string): void {
    this.state.connectors.delete(connectorId);
  }

  /**
   * Recalculates all connector paths. Called after layout changes
   * to update routes to reflect new component positions.
   */
  updateRoutes(): void {
    for (const [id, connector] of this.state.connectors) {
      const source = this.state.components.get(connector.sourceComponentId);
      const target = this.state.components.get(connector.targetComponentId);

      if (source && target) {
        connector.routePath = this.computeRoute(source, target);
      }
    }
  }

  /**
   * Recomputes a single connector's route path.
   * Called when a specific component moves to update only its attached connectors.
   *
   * @param connectorId - The ID of the connector to reroute
   * @returns The updated RoutePath, or a default path if the connector is invalid
   */
  routeSingleConnector(connectorId: string): RoutePath {
    const connector = this.state.connectors.get(connectorId);
    if (!connector) {
      return { points: [], sourceAnchor: { x: 0, y: 0 }, targetAnchor: { x: 0, y: 0 } };
    }

    const source = this.state.components.get(connector.sourceComponentId);
    const target = this.state.components.get(connector.targetComponentId);

    if (!source || !target) {
      return connector.routePath;
    }

    const routePath = this.computeRoute(source, target);
    connector.routePath = routePath;
    return routePath;
  }

  /**
   * Sets or updates the label text for a connector.
   *
   * @param connectorId - The ID of the connector
   * @param label - The label text to set
   */
  setConnectorLabel(connectorId: string, label: string): void {
    const connector = this.state.connectors.get(connectorId);
    if (connector) {
      connector.label = label;
    }
  }

  /**
   * Computes the full route path between two components, including
   * anchor points and obstacle avoidance.
   */
  private computeRoute(source: DiagramComponent, target: DiagramComponent): RoutePath {
    const sourceBounds = this.getComponentBounds(source);
    const targetBounds = this.getComponentBounds(target);

    const sourceCenter = this.getRectCenter(sourceBounds);
    const targetCenter = this.getRectCenter(targetBounds);

    // Compute anchor points on bounding box edges nearest to the other component's centre
    const sourceAnchor = this.computeAnchorPoint(sourceBounds, targetCenter);
    const targetAnchor = this.computeAnchorPoint(targetBounds, sourceCenter);

    // Get obstacles (all components except source and target)
    const obstacles = this.getObstacles(source.id, target.id);

    // Route the path using Manhattan routing with obstacle avoidance
    const points = this.routeWithObstacleAvoidance(
      sourceAnchor,
      targetAnchor,
      obstacles
    );

    return {
      points,
      sourceAnchor,
      targetAnchor,
    };
  }

  /**
   * Computes the anchor point on a bounding box edge closest to a target point.
   * The anchor is the intersection of the line from the rectangle's centre to
   * the target point with the rectangle's edges.
   */
  private computeAnchorPoint(bounds: Rect, targetPoint: Point): Point {
    const cx = bounds.x + bounds.width / 2;
    const cy = bounds.y + bounds.height / 2;

    const dx = targetPoint.x - cx;
    const dy = targetPoint.y - cy;

    // Handle degenerate case where points are at the same position
    if (dx === 0 && dy === 0) {
      return { x: bounds.x + bounds.width, y: cy };
    }

    const halfW = bounds.width / 2;
    const halfH = bounds.height / 2;

    // Find intersection with rectangle edge using parametric line
    let t: number;

    if (dx === 0) {
      // Vertical line — intersects top or bottom edge
      t = halfH / Math.abs(dy);
    } else if (dy === 0) {
      // Horizontal line — intersects left or right edge
      t = halfW / Math.abs(dx);
    } else {
      // General case — find the smaller t that hits an edge
      const tX = halfW / Math.abs(dx);
      const tY = halfH / Math.abs(dy);
      t = Math.min(tX, tY);
    }

    return {
      x: cx + dx * t,
      y: cy + dy * t,
    };
  }

  /**
   * Routes a path from source anchor to target anchor while avoiding obstacles.
   * Uses simplified Manhattan (orthogonal) routing with waypoints around obstacles.
   *
   * The algorithm:
   * 1. Attempt a direct L-shaped (two-segment) path
   * 2. If the L-path intersects obstacles, route around them with a Z-shaped detour
   * 3. Returns the complete list of points forming the polyline
   */
  private routeWithObstacleAvoidance(
    source: Point,
    target: Point,
    obstacles: Rect[]
  ): Point[] {
    // Start with source and target always included
    const directPath = this.computeLShapedPath(source, target);

    // Check if the direct L-path is clear of obstacles
    if (!this.pathIntersectsObstacles(directPath, obstacles)) {
      return directPath;
    }

    // Try the alternate L-shape (vertical first, then horizontal)
    const altPath = this.computeAlternateLPath(source, target);
    if (!this.pathIntersectsObstacles(altPath, obstacles)) {
      return altPath;
    }

    // Neither L-path works — compute a detour path around obstacles
    return this.computeDetourPath(source, target, obstacles);
  }

  /**
   * Computes an L-shaped path (horizontal first, then vertical).
   */
  private computeLShapedPath(source: Point, target: Point): Point[] {
    const midPoint: Point = { x: target.x, y: source.y };
    return [source, midPoint, target];
  }

  /**
   * Computes an alternate L-shaped path (vertical first, then horizontal).
   */
  private computeAlternateLPath(source: Point, target: Point): Point[] {
    const midPoint: Point = { x: source.x, y: target.y };
    return [source, midPoint, target];
  }

  /**
   * Computes a detour path that routes around obstacles using a Z-shaped
   * Manhattan path with waypoints placed outside obstacle bounds.
   */
  private computeDetourPath(
    source: Point,
    target: Point,
    obstacles: Rect[]
  ): Point[] {
    // Find the combined bounding box of obstacles in the path region
    const pathRegion = this.getPathRegion(source, target);
    const blockingObstacles = obstacles.filter((obs) =>
      this.rectsOverlap(pathRegion, obs)
    );

    if (blockingObstacles.length === 0) {
      // No actual blocking — fall back to simple L-path
      return this.computeLShapedPath(source, target);
    }

    // Compute a combined bounding box of all blocking obstacles
    const combinedBounds = this.getCombinedBounds(blockingObstacles);

    // Determine which side to route around (top/bottom or left/right)
    // based on available space
    const routeAbove = source.y <= combinedBounds.y;
    const routeLeft = source.x <= combinedBounds.x;

    let waypoint1: Point;
    let waypoint2: Point;

    // Decide routing direction based on relative positions
    const horizontalDistance = Math.abs(target.x - source.x);
    const verticalDistance = Math.abs(target.y - source.y);

    if (horizontalDistance >= verticalDistance) {
      // Route vertically around the obstacle
      const detourY = routeAbove
        ? combinedBounds.y - OBSTACLE_MARGIN
        : combinedBounds.y + combinedBounds.height + OBSTACLE_MARGIN;

      waypoint1 = { x: source.x, y: detourY };
      waypoint2 = { x: target.x, y: detourY };
    } else {
      // Route horizontally around the obstacle
      const detourX = routeLeft
        ? combinedBounds.x - OBSTACLE_MARGIN
        : combinedBounds.x + combinedBounds.width + OBSTACLE_MARGIN;

      waypoint1 = { x: detourX, y: source.y };
      waypoint2 = { x: detourX, y: target.y };
    }

    return [source, waypoint1, waypoint2, target];
  }

  /**
   * Checks if any segment of a polyline path intersects any obstacle bounding box.
   */
  private pathIntersectsObstacles(path: Point[], obstacles: Rect[]): boolean {
    for (let i = 0; i < path.length - 1; i++) {
      const segStart = path[i];
      const segEnd = path[i + 1];

      for (const obstacle of obstacles) {
        if (this.segmentIntersectsRect(segStart, segEnd, obstacle)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Checks if a line segment intersects a rectangle.
   * Uses a simplified axis-aligned check suitable for Manhattan routing.
   */
  private segmentIntersectsRect(p1: Point, p2: Point, rect: Rect): boolean {
    // Get the bounding box of the segment
    const segMinX = Math.min(p1.x, p2.x);
    const segMaxX = Math.max(p1.x, p2.x);
    const segMinY = Math.min(p1.y, p2.y);
    const segMaxY = Math.max(p1.y, p2.y);

    const rectMaxX = rect.x + rect.width;
    const rectMaxY = rect.y + rect.height;

    // Check if segment bbox overlaps with rectangle
    if (segMaxX < rect.x || segMinX > rectMaxX) return false;
    if (segMaxY < rect.y || segMinY > rectMaxY) return false;

    // For axis-aligned segments (Manhattan routing), bbox overlap means intersection
    // if the segment passes through the rect interior
    if (p1.x === p2.x) {
      // Vertical segment
      if (p1.x > rect.x && p1.x < rectMaxX) {
        // Segment x is inside the rect's x range
        const overlapMinY = Math.max(segMinY, rect.y);
        const overlapMaxY = Math.min(segMaxY, rectMaxY);
        return overlapMinY < overlapMaxY;
      }
      return false;
    }

    if (p1.y === p2.y) {
      // Horizontal segment
      if (p1.y > rect.y && p1.y < rectMaxY) {
        // Segment y is inside the rect's y range
        const overlapMinX = Math.max(segMinX, rect.x);
        const overlapMaxX = Math.min(segMaxX, rectMaxX);
        return overlapMinX < overlapMaxX;
      }
      return false;
    }

    // Non-axis-aligned segment (shouldn't happen in Manhattan routing, but handle anyway)
    // Use simple bounding box overlap as an approximation
    return true;
  }

  /**
   * Gets the rectangular region between source and target points (with margin).
   */
  private getPathRegion(source: Point, target: Point): Rect {
    const minX = Math.min(source.x, target.x) - OBSTACLE_MARGIN;
    const minY = Math.min(source.y, target.y) - OBSTACLE_MARGIN;
    const maxX = Math.max(source.x, target.x) + OBSTACLE_MARGIN;
    const maxY = Math.max(source.y, target.y) + OBSTACLE_MARGIN;

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  /**
   * Computes the combined bounding box of an array of rectangles.
   */
  private getCombinedBounds(rects: Rect[]): Rect {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const rect of rects) {
      minX = Math.min(minX, rect.x);
      minY = Math.min(minY, rect.y);
      maxX = Math.max(maxX, rect.x + rect.width);
      maxY = Math.max(maxY, rect.y + rect.height);
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  /**
   * Checks if two rectangles overlap.
   */
  private rectsOverlap(a: Rect, b: Rect): boolean {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  /**
   * Gets all component bounding boxes that are obstacles (excludes source and target).
   */
  private getObstacles(sourceId: string, targetId: string): Rect[] {
    const obstacles: Rect[] = [];

    for (const [id, component] of this.state.components) {
      if (id === sourceId || id === targetId) {
        continue;
      }
      obstacles.push(this.getComponentBounds(component));
    }

    return obstacles;
  }

  /**
   * Gets the bounding box of a component.
   */
  private getComponentBounds(component: DiagramComponent): Rect {
    return {
      x: component.position.x,
      y: component.position.y,
      width: component.size.width,
      height: component.size.height,
    };
  }

  /**
   * Gets the centre point of a rectangle.
   */
  private getRectCenter(rect: Rect): Point {
    return {
      x: rect.x + rect.width / 2,
      y: rect.y + rect.height / 2,
    };
  }
}
