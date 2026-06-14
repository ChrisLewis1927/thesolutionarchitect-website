var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
let connectorIdCounter = 0;
const OBSTACLE_MARGIN = 16;
const ANCHOR_TOLERANCE = 2;
function generateConnectorId() {
  connectorIdCounter++;
  return `connector-${Date.now()}-${connectorIdCounter}`;
}
function resetConnectorIdCounter() {
  connectorIdCounter = 0;
}
class ConnectorRouter {
  constructor(state) {
    __publicField(this, "state");
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
  addConnector(sourceId, targetId, directed) {
    const source = this.state.components.get(sourceId);
    const target = this.state.components.get(targetId);
    if (!source || !target) {
      return "";
    }
    if (sourceId === targetId) {
      return "";
    }
    const id = generateConnectorId();
    const routePath = this.computeRoute(source, target);
    const connector = {
      id,
      sourceComponentId: sourceId,
      targetComponentId: targetId,
      directed,
      label: "",
      routePath
    };
    this.state.connectors.set(id, connector);
    return id;
  }
  /**
   * Removes a connector from the diagram state.
   *
   * @param connectorId - The ID of the connector to remove
   */
  removeConnector(connectorId) {
    this.state.connectors.delete(connectorId);
  }
  /**
   * Recalculates all connector paths. Called after layout changes
   * to update routes to reflect new component positions.
   */
  updateRoutes() {
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
  routeSingleConnector(connectorId) {
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
  setConnectorLabel(connectorId, label) {
    const connector = this.state.connectors.get(connectorId);
    if (connector) {
      connector.label = label;
    }
  }
  /**
   * Computes the full route path between two components, including
   * anchor points and obstacle avoidance.
   */
  computeRoute(source, target) {
    const sourceBounds = this.getComponentBounds(source);
    const targetBounds = this.getComponentBounds(target);
    const sourceCenter = this.getRectCenter(sourceBounds);
    const targetCenter = this.getRectCenter(targetBounds);
    const sourceAnchor = this.computeAnchorPoint(sourceBounds, targetCenter);
    const targetAnchor = this.computeAnchorPoint(targetBounds, sourceCenter);
    const obstacles = this.getObstacles(source.id, target.id);
    const points = this.routeWithObstacleAvoidance(
      sourceAnchor,
      targetAnchor,
      obstacles
    );
    return {
      points,
      sourceAnchor,
      targetAnchor
    };
  }
  /**
   * Computes the anchor point on a bounding box edge closest to a target point.
   * The anchor is the intersection of the line from the rectangle's centre to
   * the target point with the rectangle's edges.
   */
  computeAnchorPoint(bounds, targetPoint) {
    const cx = bounds.x + bounds.width / 2;
    const cy = bounds.y + bounds.height / 2;
    const dx = targetPoint.x - cx;
    const dy = targetPoint.y - cy;
    if (dx === 0 && dy === 0) {
      return { x: bounds.x + bounds.width, y: cy };
    }
    const halfW = bounds.width / 2;
    const halfH = bounds.height / 2;
    let t;
    if (dx === 0) {
      t = halfH / Math.abs(dy);
    } else if (dy === 0) {
      t = halfW / Math.abs(dx);
    } else {
      const tX = halfW / Math.abs(dx);
      const tY = halfH / Math.abs(dy);
      t = Math.min(tX, tY);
    }
    return {
      x: cx + dx * t,
      y: cy + dy * t
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
  routeWithObstacleAvoidance(source, target, obstacles) {
    const directPath = this.computeLShapedPath(source, target);
    if (!this.pathIntersectsObstacles(directPath, obstacles)) {
      return directPath;
    }
    const altPath = this.computeAlternateLPath(source, target);
    if (!this.pathIntersectsObstacles(altPath, obstacles)) {
      return altPath;
    }
    return this.computeDetourPath(source, target, obstacles);
  }
  /**
   * Computes an L-shaped path (horizontal first, then vertical).
   */
  computeLShapedPath(source, target) {
    const midPoint = { x: target.x, y: source.y };
    return [source, midPoint, target];
  }
  /**
   * Computes an alternate L-shaped path (vertical first, then horizontal).
   */
  computeAlternateLPath(source, target) {
    const midPoint = { x: source.x, y: target.y };
    return [source, midPoint, target];
  }
  /**
   * Computes a detour path that routes around obstacles using a Z-shaped
   * Manhattan path with waypoints placed outside obstacle bounds.
   */
  computeDetourPath(source, target, obstacles) {
    const pathRegion = this.getPathRegion(source, target);
    const blockingObstacles = obstacles.filter(
      (obs) => this.rectsOverlap(pathRegion, obs)
    );
    if (blockingObstacles.length === 0) {
      return this.computeLShapedPath(source, target);
    }
    const combinedBounds = this.getCombinedBounds(blockingObstacles);
    const routeAbove = source.y <= combinedBounds.y;
    const routeLeft = source.x <= combinedBounds.x;
    let waypoint1;
    let waypoint2;
    const horizontalDistance = Math.abs(target.x - source.x);
    const verticalDistance = Math.abs(target.y - source.y);
    if (horizontalDistance >= verticalDistance) {
      const detourY = routeAbove ? combinedBounds.y - OBSTACLE_MARGIN : combinedBounds.y + combinedBounds.height + OBSTACLE_MARGIN;
      waypoint1 = { x: source.x, y: detourY };
      waypoint2 = { x: target.x, y: detourY };
    } else {
      const detourX = routeLeft ? combinedBounds.x - OBSTACLE_MARGIN : combinedBounds.x + combinedBounds.width + OBSTACLE_MARGIN;
      waypoint1 = { x: detourX, y: source.y };
      waypoint2 = { x: detourX, y: target.y };
    }
    return [source, waypoint1, waypoint2, target];
  }
  /**
   * Checks if any segment of a polyline path intersects any obstacle bounding box.
   */
  pathIntersectsObstacles(path, obstacles) {
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
  segmentIntersectsRect(p1, p2, rect) {
    const segMinX = Math.min(p1.x, p2.x);
    const segMaxX = Math.max(p1.x, p2.x);
    const segMinY = Math.min(p1.y, p2.y);
    const segMaxY = Math.max(p1.y, p2.y);
    const rectMaxX = rect.x + rect.width;
    const rectMaxY = rect.y + rect.height;
    if (segMaxX < rect.x || segMinX > rectMaxX) return false;
    if (segMaxY < rect.y || segMinY > rectMaxY) return false;
    if (p1.x === p2.x) {
      if (p1.x > rect.x && p1.x < rectMaxX) {
        const overlapMinY = Math.max(segMinY, rect.y);
        const overlapMaxY = Math.min(segMaxY, rectMaxY);
        return overlapMinY < overlapMaxY;
      }
      return false;
    }
    if (p1.y === p2.y) {
      if (p1.y > rect.y && p1.y < rectMaxY) {
        const overlapMinX = Math.max(segMinX, rect.x);
        const overlapMaxX = Math.min(segMaxX, rectMaxX);
        return overlapMinX < overlapMaxX;
      }
      return false;
    }
    return true;
  }
  /**
   * Gets the rectangular region between source and target points (with margin).
   */
  getPathRegion(source, target) {
    const minX = Math.min(source.x, target.x) - OBSTACLE_MARGIN;
    const minY = Math.min(source.y, target.y) - OBSTACLE_MARGIN;
    const maxX = Math.max(source.x, target.x) + OBSTACLE_MARGIN;
    const maxY = Math.max(source.y, target.y) + OBSTACLE_MARGIN;
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }
  /**
   * Computes the combined bounding box of an array of rectangles.
   */
  getCombinedBounds(rects) {
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
      height: maxY - minY
    };
  }
  /**
   * Checks if two rectangles overlap.
   */
  rectsOverlap(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  }
  /**
   * Gets all component bounding boxes that are obstacles (excludes source and target).
   */
  getObstacles(sourceId, targetId) {
    const obstacles = [];
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
  getComponentBounds(component) {
    return {
      x: component.position.x,
      y: component.position.y,
      width: component.size.width,
      height: component.size.height
    };
  }
  /**
   * Gets the centre point of a rectangle.
   */
  getRectCenter(rect) {
    return {
      x: rect.x + rect.width / 2,
      y: rect.y + rect.height / 2
    };
  }
}
export {
  ConnectorRouter,
  resetConnectorIdCounter
};
