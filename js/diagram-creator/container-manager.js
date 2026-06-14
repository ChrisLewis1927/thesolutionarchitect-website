var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
const CONTAINER_PADDING = 20;
const MIN_CONTAINER_WIDTH = 100;
const MIN_CONTAINER_HEIGHT = 80;
const MAX_NESTING_DEPTH = 5;
const LEVEL_STYLES = [
  { borderColor: "#1a73e8", backgroundColor: "rgba(26, 115, 232, 0.08)", borderRadius: 8, padding: CONTAINER_PADDING },
  { borderColor: "#e8710a", backgroundColor: "rgba(232, 113, 10, 0.08)", borderRadius: 6, padding: CONTAINER_PADDING },
  { borderColor: "#0d904f", backgroundColor: "rgba(13, 144, 79, 0.08)", borderRadius: 6, padding: CONTAINER_PADDING },
  { borderColor: "#9334e6", backgroundColor: "rgba(147, 52, 230, 0.08)", borderRadius: 4, padding: CONTAINER_PADDING },
  { borderColor: "#d93025", backgroundColor: "rgba(217, 48, 37, 0.08)", borderRadius: 4, padding: CONTAINER_PADDING },
  { borderColor: "#1a8a8a", backgroundColor: "rgba(26, 138, 138, 0.08)", borderRadius: 4, padding: CONTAINER_PADDING }
];
class ContainerManager {
  constructor(state) {
    __publicField(this, "state");
    this.state = state;
  }
  /**
   * Adds a child (component or nested container) to a container.
   * Updates the container's childIds and sets the child's containerId/parentId.
   *
   * Rejects the operation if:
   * - Adding a container to itself or its own descendant (circular nesting)
   * - The resulting nesting depth would exceed MAX_NESTING_DEPTH (5 levels)
   *
   * @returns true if the child was added, false if rejected.
   */
  addChildToContainer(containerId, childId) {
    const container = this.state.containers.get(containerId);
    if (!container) {
      return false;
    }
    if (containerId === childId) {
      return false;
    }
    const childContainer = this.state.containers.get(childId);
    if (childContainer) {
      if (this.isDescendantOf(containerId, childId)) {
        return false;
      }
      const parentDepth = this.getNestingLevel(containerId) + 1;
      const childSubtreeDepth = this.getMaxSubtreeDepth(childId);
      if (parentDepth + childSubtreeDepth > MAX_NESTING_DEPTH) {
        return false;
      }
    }
    if (!childContainer) {
      const containerDepth = this.getNestingLevel(containerId);
      if (containerDepth >= MAX_NESTING_DEPTH) {
        return false;
      }
    }
    if (!container.childIds.includes(childId)) {
      container.childIds.push(childId);
    }
    const component = this.state.components.get(childId);
    if (component) {
      component.containerId = containerId;
    }
    if (childContainer) {
      childContainer.parentId = containerId;
    }
    return true;
  }
  /**
   * Removes a child (component or nested container) from a container.
   * Removes from childIds and clears the child's containerId/parentId.
   * Only clears the child's reference if it actually points to this container.
   */
  removeChildFromContainer(containerId, childId) {
    const container = this.state.containers.get(containerId);
    if (!container) {
      return;
    }
    const index = container.childIds.indexOf(childId);
    if (index !== -1) {
      container.childIds.splice(index, 1);
    }
    const component = this.state.components.get(childId);
    if (component && component.containerId === containerId) {
      component.containerId = null;
    }
    const childContainer = this.state.containers.get(childId);
    if (childContainer && childContainer.parentId === containerId) {
      childContainer.parentId = null;
    }
  }
  /**
   * Recalculates the bounds of a container to encompass all its children
   * with consistent padding on all sides.
   *
   * If the container has no children, returns a minimum-size bounds at
   * the container's current position.
   */
  recalculateBounds(containerId) {
    const container = this.state.containers.get(containerId);
    if (!container) {
      return { x: 0, y: 0, width: MIN_CONTAINER_WIDTH, height: MIN_CONTAINER_HEIGHT };
    }
    if (container.childIds.length === 0) {
      const bounds2 = {
        x: container.bounds.x,
        y: container.bounds.y,
        width: Math.max(container.bounds.width, MIN_CONTAINER_WIDTH),
        height: Math.max(container.bounds.height, MIN_CONTAINER_HEIGHT)
      };
      container.bounds = bounds2;
      return bounds2;
    }
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const childId of container.childIds) {
      const childBounds = this.getChildBounds(childId);
      if (childBounds) {
        minX = Math.min(minX, childBounds.x);
        minY = Math.min(minY, childBounds.y);
        maxX = Math.max(maxX, childBounds.x + childBounds.width);
        maxY = Math.max(maxY, childBounds.y + childBounds.height);
      }
    }
    if (minX === Infinity) {
      const bounds2 = {
        x: container.bounds.x,
        y: container.bounds.y,
        width: MIN_CONTAINER_WIDTH,
        height: MIN_CONTAINER_HEIGHT
      };
      container.bounds = bounds2;
      return bounds2;
    }
    const padding = CONTAINER_PADDING;
    const bounds = {
      x: minX - padding,
      y: minY - padding,
      width: maxX - minX + 2 * padding,
      height: maxY - minY + 2 * padding
    };
    container.bounds = bounds;
    return bounds;
  }
  /**
   * Finds the deepest (most nested) container at a given point.
   * Used for drop-target detection during drag-and-drop.
   *
   * Returns the container ID or null if no container contains the point.
   */
  getContainerAtPoint(point) {
    let deepestContainer = null;
    let deepestLevel = -1;
    for (const [id, container] of this.state.containers) {
      if (this.pointInRect(point, container.bounds)) {
        const level = this.getNestingLevel(id);
        if (level > deepestLevel) {
          deepestLevel = level;
          deepestContainer = id;
        }
      }
    }
    return deepestContainer;
  }
  /**
   * Returns the nesting level of a container by traversing its parent chain.
   * A top-level container (no parent) has nesting level 0.
   */
  getNestingLevel(containerId) {
    let level = 0;
    let currentId = containerId;
    while (currentId) {
      const container = this.state.containers.get(currentId);
      if (!container || !container.parentId) {
        break;
      }
      currentId = container.parentId;
      level++;
    }
    return level;
  }
  /**
   * Returns a distinct visual style for a given nesting level.
   * Cycles through available styles if level exceeds the predefined count.
   */
  getContainerStyle(nestingLevel) {
    const index = nestingLevel % LEVEL_STYLES.length;
    return { ...LEVEL_STYLES[index] };
  }
  /**
   * Gets the bounding box of a child element (component or container).
   */
  getChildBounds(childId) {
    const component = this.state.components.get(childId);
    if (component) {
      return {
        x: component.position.x,
        y: component.position.y,
        width: component.size.width,
        height: component.size.height
      };
    }
    const container = this.state.containers.get(childId);
    if (container) {
      return { ...container.bounds };
    }
    return null;
  }
  /**
   * Checks whether a point falls within a rectangle.
   */
  pointInRect(point, rect) {
    return point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height;
  }
  /**
   * Checks whether the given containerId is a descendant of ancestorId.
   * Used to prevent circular container nesting.
   */
  isDescendantOf(containerId, ancestorId) {
    let currentId = containerId;
    while (currentId) {
      const container = this.state.containers.get(currentId);
      if (!container || !container.parentId) {
        return false;
      }
      if (container.parentId === ancestorId) {
        return true;
      }
      currentId = container.parentId;
    }
    return false;
  }
  /**
   * Returns the maximum depth of the subtree rooted at the given container.
   * A container with no child containers has subtree depth 0.
   */
  getMaxSubtreeDepth(containerId) {
    const container = this.state.containers.get(containerId);
    if (!container) return 0;
    let maxChildDepth = 0;
    for (const childId of container.childIds) {
      const childContainer = this.state.containers.get(childId);
      if (childContainer) {
        const childDepth = this.getMaxSubtreeDepth(childId) + 1;
        maxChildDepth = Math.max(maxChildDepth, childDepth);
      }
    }
    return maxChildDepth;
  }
  /**
   * Checks if adding a child to the specified container would exceed the
   * maximum nesting depth. Used by the UI to display tooltip warnings.
   *
   * @returns true if the nesting would be allowed, false if it would exceed the limit.
   */
  canNestIn(containerId, childId) {
    const containerDepth = this.getNestingLevel(containerId);
    if (childId) {
      const childContainer = this.state.containers.get(childId);
      if (childContainer) {
        if (containerId === childId || this.isDescendantOf(containerId, childId)) {
          return false;
        }
        const childSubtreeDepth = this.getMaxSubtreeDepth(childId);
        return containerDepth + 1 + childSubtreeDepth <= MAX_NESTING_DEPTH;
      }
    }
    return containerDepth < MAX_NESTING_DEPTH;
  }
  /**
   * Returns the maximum nesting depth constant.
   */
  getMaxNestingDepth() {
    return MAX_NESTING_DEPTH;
  }
}
export {
  ContainerManager
};
