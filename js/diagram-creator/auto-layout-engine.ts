/**
 * AutoLayoutEngine - Repositions containers and their children when structural
 * changes occur (e.g. adding/removing Availability Zones).
 *
 * Uses a custom even-distribution algorithm to compute balanced layouts.
 * Containers are spaced evenly along the specified direction while preserving
 * the relative ordering of children within each container.
 */

import type {
  DiagramState,
  ContainerNode,
  LayoutResult,
  Point,
  Rect,
} from './types';

/** Default gap between containers when redistributing (px). */
const DEFAULT_GAP = 40;

/** Starting offset from the canvas origin (px). */
const LAYOUT_ORIGIN_X = 60;
const LAYOUT_ORIGIN_Y = 60;

/** Internal padding within a container for positioning children. */
const CHILD_PADDING = 20;

/** Default child component size when not otherwise specified. */
const DEFAULT_CHILD_WIDTH = 48;
const DEFAULT_CHILD_HEIGHT = 48;

/** Vertical gap between rows of children within a container. */
const CHILD_ROW_GAP = 20;

/** Horizontal gap between children in the same row. */
const CHILD_COL_GAP = 16;

export class AutoLayoutEngine {
  private state: DiagramState;

  constructor(state: DiagramState) {
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
  redistributeContainers(
    containers: ContainerNode[],
    direction: 'horizontal' | 'vertical'
  ): LayoutResult {
    const positions = new Map<string, Point>();
    const containerBounds = new Map<string, Rect>();

    if (containers.length === 0) {
      return { positions, containerBounds };
    }

    if (containers.length === 1) {
      const container = containers[0];
      const origin: Point = { x: LAYOUT_ORIGIN_X, y: LAYOUT_ORIGIN_Y };
      const bounds: Rect = {
        x: origin.x,
        y: origin.y,
        width: container.width,
        height: container.height,
      };

      containerBounds.set(container.id, bounds);
      this.computeChildPositions(container, bounds, positions);

      return { positions, containerBounds };
    }

    // Calculate total space needed and even spacing
    if (direction === 'horizontal') {
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
  applyLayout(result: LayoutResult): void {
    // Update container bounds
    for (const [containerId, bounds] of result.containerBounds) {
      const container = this.state.containers.get(containerId);
      if (container) {
        container.bounds = { ...bounds };
      }
    }

    // Update component positions
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
  private distributeHorizontal(
    containers: ContainerNode[],
    positions: Map<string, Point>,
    containerBounds: Map<string, Rect>
  ): void {
    const gap = DEFAULT_GAP;
    let currentX = LAYOUT_ORIGIN_X;

    // Find maximum height across all containers for vertical alignment
    const maxHeight = Math.max(...containers.map((c) => c.height));

    for (let i = 0; i < containers.length; i++) {
      const container = containers[i];

      // Vertically centre each container relative to the tallest
      const yOffset = LAYOUT_ORIGIN_Y + (maxHeight - container.height) / 2;

      const bounds: Rect = {
        x: currentX,
        y: yOffset,
        width: container.width,
        height: container.height,
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
  private distributeVertical(
    containers: ContainerNode[],
    positions: Map<string, Point>,
    containerBounds: Map<string, Rect>
  ): void {
    const gap = DEFAULT_GAP;
    let currentY = LAYOUT_ORIGIN_Y;

    // Find maximum width across all containers for horizontal alignment
    const maxWidth = Math.max(...containers.map((c) => c.width));

    for (let i = 0; i < containers.length; i++) {
      const container = containers[i];

      // Horizontally centre each container relative to the widest
      const xOffset = LAYOUT_ORIGIN_X + (maxWidth - container.width) / 2;

      const bounds: Rect = {
        x: xOffset,
        y: currentY,
        width: container.width,
        height: container.height,
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
  private computeChildPositions(
    container: ContainerNode,
    bounds: Rect,
    positions: Map<string, Point>
  ): void {
    if (container.children.length === 0) {
      return;
    }

    const availableWidth = bounds.width - 2 * CHILD_PADDING;

    // Determine child sizes from diagram state or use defaults
    const childSizes = container.children.map((childId) => {
      const component = this.state.components.get(childId);
      if (component) {
        return { width: component.size.width, height: component.size.height };
      }
      return { width: DEFAULT_CHILD_WIDTH, height: DEFAULT_CHILD_HEIGHT };
    });

    // Layout children in rows, preserving order
    let rowX = 0;
    let rowY = 0;
    let rowHeight = 0;

    for (let i = 0; i < container.children.length; i++) {
      const childId = container.children[i];
      const childSize = childSizes[i];

      // Wrap to next row if child exceeds available width
      if (rowX > 0 && rowX + childSize.width > availableWidth) {
        rowX = 0;
        rowY += rowHeight + CHILD_ROW_GAP;
        rowHeight = 0;
      }

      const position: Point = {
        x: bounds.x + CHILD_PADDING + rowX,
        y: bounds.y + CHILD_PADDING + rowY,
      };

      positions.set(childId, position);

      rowX += childSize.width + CHILD_COL_GAP;
      rowHeight = Math.max(rowHeight, childSize.height);
    }
  }
}
