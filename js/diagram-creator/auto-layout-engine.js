var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
const DEFAULT_GAP = 40;
const LAYOUT_ORIGIN_X = 60;
const LAYOUT_ORIGIN_Y = 60;
const CHILD_PADDING = 20;
const DEFAULT_CHILD_WIDTH = 48;
const DEFAULT_CHILD_HEIGHT = 48;
const CHILD_ROW_GAP = 20;
const CHILD_COL_GAP = 16;
class AutoLayoutEngine {
  constructor(state) {
    __publicField(this, "state");
    this.state = state;
  }
  /**
   * Redistributes an array of ContainerNode objects along the specified direction.
   *
   * For 'horizontal' direction: containers are placed side-by-side with equal spacing.
   * For 'vertical' direction: containers are stacked top-to-bottom with equal spacing.
   *
   * The spacing between consecutive containers is equal (±1px tolerance).
   * Relative child ordering within each container is preserved.
   *
   * @param containers - Array of ContainerNode objects to redistribute
   * @param direction - Layout direction: 'horizontal' or 'vertical'
   * @returns LayoutResult with computed positions and container bounds
   */
  redistributeContainers(containers, direction) {
    const positions = /* @__PURE__ */ new Map();
    const containerBounds = /* @__PURE__ */ new Map();
    if (containers.length === 0) {
      return { positions, containerBounds };
    }
    if (containers.length === 1) {
      const container = containers[0];
      const origin = { x: LAYOUT_ORIGIN_X, y: LAYOUT_ORIGIN_Y };
      const bounds = {
        x: origin.x,
        y: origin.y,
        width: container.width,
        height: container.height
      };
      containerBounds.set(container.id, bounds);
      this.computeChildPositions(container, bounds, positions);
      return { positions, containerBounds };
    }
    if (direction === "horizontal") {
      this.distributeHorizontal(containers, positions, containerBounds);
    } else {
      this.distributeVertical(containers, positions, containerBounds);
    }
    return { positions, containerBounds };
  }
  /**
   * Applies a LayoutResult to the current DiagramState, updating container
   * bounds and component positions.
   *
   * @param result - The LayoutResult to apply
   */
  applyLayout(result) {
    for (const [containerId, bounds] of result.containerBounds) {
      const container = this.state.containers.get(containerId);
      if (container) {
        container.bounds = { ...bounds };
      }
    }
    for (const [componentId, position] of result.positions) {
      const component = this.state.components.get(componentId);
      if (component) {
        component.position = { ...position };
      }
    }
  }
  /**
   * Distributes containers horizontally with equal spacing between them.
   * All containers share the same Y origin. The gap between consecutive
   * containers is computed to be identical.
   */
  distributeHorizontal(containers, positions, containerBounds) {
    const gap = DEFAULT_GAP;
    let currentX = LAYOUT_ORIGIN_X;
    const maxHeight = Math.max(...containers.map((c) => c.height));
    for (let i = 0; i < containers.length; i++) {
      const container = containers[i];
      const yOffset = LAYOUT_ORIGIN_Y + (maxHeight - container.height) / 2;
      const bounds = {
        x: currentX,
        y: yOffset,
        width: container.width,
        height: container.height
      };
      containerBounds.set(container.id, bounds);
      this.computeChildPositions(container, bounds, positions);
      currentX += container.width + gap;
    }
  }
  /**
   * Distributes containers vertically with equal spacing between them.
   * All containers share the same X origin. The gap between consecutive
   * containers is computed to be identical.
   */
  distributeVertical(containers, positions, containerBounds) {
    const gap = DEFAULT_GAP;
    let currentY = LAYOUT_ORIGIN_Y;
    const maxWidth = Math.max(...containers.map((c) => c.width));
    for (let i = 0; i < containers.length; i++) {
      const container = containers[i];
      const xOffset = LAYOUT_ORIGIN_X + (maxWidth - container.width) / 2;
      const bounds = {
        x: xOffset,
        y: currentY,
        width: container.width,
        height: container.height
      };
      containerBounds.set(container.id, bounds);
      this.computeChildPositions(container, bounds, positions);
      currentY += container.height + gap;
    }
  }
  /**
   * Computes positions for children within a container.
   * Children are placed in a grid layout within the container bounds,
   * preserving their relative ordering (index order from the children array).
   *
   * Children are laid out left-to-right, top-to-bottom, wrapping when
   * the row exceeds the container width minus padding.
   */
  computeChildPositions(container, bounds, positions) {
    if (container.children.length === 0) {
      return;
    }
    const availableWidth = bounds.width - 2 * CHILD_PADDING;
    const childSizes = container.children.map((childId) => {
      const component = this.state.components.get(childId);
      if (component) {
        return { width: component.size.width, height: component.size.height };
      }
      return { width: DEFAULT_CHILD_WIDTH, height: DEFAULT_CHILD_HEIGHT };
    });
    let rowX = 0;
    let rowY = 0;
    let rowHeight = 0;
    for (let i = 0; i < container.children.length; i++) {
      const childId = container.children[i];
      const childSize = childSizes[i];
      if (rowX > 0 && rowX + childSize.width > availableWidth) {
        rowX = 0;
        rowY += rowHeight + CHILD_ROW_GAP;
        rowHeight = 0;
      }
      const position = {
        x: bounds.x + CHILD_PADDING + rowX,
        y: bounds.y + CHILD_PADDING + rowY
      };
      positions.set(childId, position);
      rowX += childSize.width + CHILD_COL_GAP;
      rowHeight = Math.max(rowHeight, childSize.height);
    }
  }
}
export {
  AutoLayoutEngine
};
