/**
 * CanvasController — Central orchestrator for all canvas interactions.
 *
 * Creates a Konva.Stage with separate layers for containers, components,
 * connectors, and selection UI. Handles drag-and-drop using Konva's built-in
 * draggable property and dragend events. Integrates with ContainerManager
 * (for container resize on add/remove) and ConnectorRouter (for route updates
 * on move). Manages selection state and connector creation mode.
 *
 * Konva.js is loaded from CDN — referenced as a global.
 */

import type {
  DiagramState,
  DiagramComponent,
  DiagramContainer,
  DiagramConnector,
  Point,
  ContainerType,
  ContainerStyle,
  ServiceIcon,
} from './types.js';
import { ContainerManager } from './container-manager.js';
import { ConnectorRouter } from './connector-router.js';

/** Declare Konva as a global (loaded via CDN script tag). */
declare const Konva: any;

/** Counter for generating unique component IDs. */
let componentIdCounter = 0;

/** Counter for generating unique container IDs. */
let containerIdCounter = 0;

/** Default component size when icon info is not available. */
const DEFAULT_COMPONENT_WIDTH = 48;
const DEFAULT_COMPONENT_HEIGHT = 48;

/** Label styling constants. */
const LABEL_FONT_SIZE = 12;
const LABEL_FONT_FAMILY = 'Inter, Arial, sans-serif';
const LABEL_OFFSET_Y = 6;

/** Container label styling. */
const CONTAINER_LABEL_FONT_SIZE = 13;
const CONTAINER_LABEL_PADDING = 8;

/** Canvas boundary margin — components snapped to stay this far inside bounds. */
const CANVAS_BOUNDARY_MARGIN = 4;

/** Selection handle size. */
const SELECTION_HANDLE_SIZE = 8;
const SELECTION_STROKE_COLOR = '#1a73e8';
const SELECTION_STROKE_WIDTH = 2;

/** Connector creation visual feedback colour. */
const CONNECTOR_PREVIEW_COLOR = '#666666';
const CONNECTOR_PREVIEW_DASH = [6, 4];

/** Connector line styling. */
const CONNECTOR_STROKE_COLOR = '#555555';
const CONNECTOR_STROKE_WIDTH = 2;
const CONNECTOR_ARROW_SIZE = 8;

/**
 * Generates a unique component ID.
 */
function generateComponentId(): string {
  componentIdCounter++;
  return `comp-${Date.now()}-${componentIdCounter}`;
}

/**
 * Generates a unique container ID.
 */
function generateContainerId(): string {
  containerIdCounter++;
  return `container-${Date.now()}-${containerIdCounter}`;
}

/**
 * Resets ID counters (used in tests).
 */
export function resetCanvasIdCounters(): void {
  componentIdCounter = 0;
  containerIdCounter = 0;
}

/**
 * Information about a service to be added as a component.
 * Passed from PlatformService or the palette drag data.
 */
export interface ServiceInfo {
  serviceId: string;
  serviceName: string;
  iconPath: string;
  defaultWidth: number;
  defaultHeight: number;
}

export class CanvasController {
  private stage: any = null;
  private containerLayer: any = null;
  private componentLayer: any = null;
  private connectorLayer: any = null;
  private selectionLayer: any = null;

  private state: DiagramState;
  private containerManager: ContainerManager;
  private connectorRouter: ConnectorRouter;

  /** Map of component IDs to their Konva groups. */
  private componentNodes: Map<string, any> = new Map();

  /** Map of container IDs to their Konva groups. */
  private containerNodes: Map<string, any> = new Map();

  /** Map of connector IDs to their Konva lines. */
  private connectorNodes: Map<string, any> = new Map();

  /** Currently selected component ID (null if nothing selected). */
  private selectedComponentId: string | null = null;

  /** Selection UI nodes. */
  private selectionRect: any = null;
  private deleteControl: any = null;

  /** Connector creation mode state. */
  private isConnecting: boolean = false;
  private connectionSourceId: string | null = null;
  private connectionPreviewLine: any = null;

  /** Service info resolver — set externally to lookup service details by serviceId. */
  private serviceInfoResolver: ((serviceId: string) => ServiceInfo | null) | null = null;

  constructor(state: DiagramState) {
    this.state = state;
    this.containerManager = new ContainerManager(state);
    this.connectorRouter = new ConnectorRouter(state);
  }

  /**
   * Registers a function to resolve serviceId to ServiceInfo.
   * This is used by addComponent when only a serviceId is provided.
   */
  setServiceInfoResolver(resolver: (serviceId: string) => ServiceInfo | null): void {
    this.serviceInfoResolver = resolver;
  }

  /**
   * Initialises the Konva.Stage and creates the four rendering layers.
   *
   * @param containerId - The DOM element ID for the Konva stage container.
   */
  initialise(containerId: string): void {
    const containerEl = document.getElementById(containerId);
    if (!containerEl) {
      throw new Error(`Canvas container element not found: #${containerId}`);
    }

    const width = containerEl.clientWidth || 1200;
    const height = containerEl.clientHeight || 800;

    this.stage = new Konva.Stage({
      container: containerId,
      width,
      height,
    });

    // Create layers in rendering order (bottom to top)
    this.containerLayer = new Konva.Layer({ name: 'containers' });
    this.connectorLayer = new Konva.Layer({ name: 'connectors' });
    this.componentLayer = new Konva.Layer({ name: 'components' });
    this.selectionLayer = new Konva.Layer({ name: 'selection' });

    this.stage.add(this.containerLayer);
    this.stage.add(this.connectorLayer);
    this.stage.add(this.componentLayer);
    this.stage.add(this.selectionLayer);

    // Wire up stage click to deselect when clicking empty space
    this.stage.on('click tap', (e: any) => {
      if (e.target === this.stage) {
        this.clearSelection();
      }
    });
  }

  /**
   * Renders a full DiagramState to the canvas, replacing any existing content.
   *
   * @param state - The DiagramState to render.
   */
  loadDiagram(state: DiagramState): void {
    this.clearCanvas();
    this.state = state;
    this.containerManager = new ContainerManager(state);
    this.connectorRouter = new ConnectorRouter(state);

    // Render containers first (bottom layer)
    for (const [id, container] of state.containers) {
      this.renderContainer(container);
    }

    // Render components
    for (const [id, component] of state.components) {
      this.renderComponent(component);
    }

    // Render connectors
    for (const [id, connector] of state.connectors) {
      this.renderConnector(connector);
    }

    this.stage.batchDraw();
  }

  /**
   * Adds a new component to the diagram at the specified position.
   *
   * @param serviceId - The service identifier to resolve name/icon.
   * @param position - The canvas position to place the component.
   * @param containerId - Optional container ID to place the component inside.
   * @returns The ID of the newly created component.
   */
  addComponent(serviceId: string, position: Point, containerId?: string): string {
    // Resolve service info
    let serviceInfo: ServiceInfo | null = null;
    if (this.serviceInfoResolver) {
      serviceInfo = this.serviceInfoResolver(serviceId);
    }

    const compWidth = serviceInfo?.defaultWidth ?? DEFAULT_COMPONENT_WIDTH;
    const compHeight = serviceInfo?.defaultHeight ?? DEFAULT_COMPONENT_HEIGHT;

    // Snap position to canvas bounds if out-of-bounds
    const clampedPosition = this.clampToCanvasBounds(position, compWidth, compHeight);

    const id = generateComponentId();
    const component: DiagramComponent = {
      id,
      serviceId,
      serviceName: serviceInfo?.serviceName ?? serviceId,
      iconPath: serviceInfo?.iconPath ?? '',
      position: { x: clampedPosition.x, y: clampedPosition.y },
      size: {
        width: compWidth,
        height: compHeight,
      },
      containerId: containerId ?? null,
      label: serviceInfo?.serviceName ?? serviceId,
    };

    this.state.components.set(id, component);

    // If placed inside a container, register with ContainerManager
    if (containerId) {
      const accepted = this.containerManager.addChildToContainer(containerId, id);
      if (accepted) {
        this.containerManager.recalculateBounds(containerId);
        this.updateContainerNode(containerId);
      } else {
        // Rejected (e.g. max nesting depth exceeded) — place without container
        component.containerId = null;
      }
    }

    // Render the component on canvas
    this.renderComponent(component);

    // Update any existing connectors in case layout shifted
    this.connectorRouter.updateRoutes();
    this.refreshAllConnectors();

    this.stage?.batchDraw();
    return id;
  }

  /**
   * Adds a component using pre-resolved service info (used by palette drop).
   *
   * @param info - The resolved ServiceInfo (serviceId, name, icon, dimensions).
   * @param position - The canvas position to place the component.
   * @param containerId - Optional container ID to place the component inside.
   * @returns The ID of the newly created component.
   */
  addComponentWithInfo(info: ServiceInfo, position: Point, containerId?: string): string {
    const compWidth = info.defaultWidth || DEFAULT_COMPONENT_WIDTH;
    const compHeight = info.defaultHeight || DEFAULT_COMPONENT_HEIGHT;

    // Snap position to canvas bounds if out-of-bounds
    const clampedPosition = this.clampToCanvasBounds(position, compWidth, compHeight);

    const id = generateComponentId();
    const component: DiagramComponent = {
      id,
      serviceId: info.serviceId,
      serviceName: info.serviceName,
      iconPath: info.iconPath,
      position: { x: clampedPosition.x, y: clampedPosition.y },
      size: {
        width: compWidth,
        height: compHeight,
      },
      containerId: containerId ?? null,
      label: info.serviceName,
    };

    this.state.components.set(id, component);

    // If placed inside a container, register with ContainerManager
    if (containerId) {
      const accepted = this.containerManager.addChildToContainer(containerId, id);
      if (accepted) {
        this.containerManager.recalculateBounds(containerId);
        this.updateContainerNode(containerId);
      } else {
        // Rejected (e.g. max nesting depth exceeded) — place without container
        component.containerId = null;
      }
    }

    // Render the component on canvas
    this.renderComponent(component);

    // Update connectors
    this.connectorRouter.updateRoutes();
    this.refreshAllConnectors();

    this.stage?.batchDraw();
    return id;
  }

  /**
   * Removes a component from the diagram and canvas.
   * Cleans up container membership and attached connectors.
   *
   * @param componentId - The ID of the component to remove.
   */
  removeComponent(componentId: string): void {
    const component = this.state.components.get(componentId);
    if (!component) return;

    // Remove from container if it belongs to one
    if (component.containerId) {
      this.containerManager.removeChildFromContainer(component.containerId, componentId);
      this.containerManager.recalculateBounds(component.containerId);
      this.updateContainerNode(component.containerId);
    }

    // Remove all connectors attached to this component
    const connectorsToRemove: string[] = [];
    for (const [connId, connector] of this.state.connectors) {
      if (connector.sourceComponentId === componentId || connector.targetComponentId === componentId) {
        connectorsToRemove.push(connId);
      }
    }
    for (const connId of connectorsToRemove) {
      this.removeConnection(connId);
    }

    // Remove from state
    this.state.components.delete(componentId);

    // Remove Konva node
    const node = this.componentNodes.get(componentId);
    if (node) {
      node.destroy();
      this.componentNodes.delete(componentId);
    }

    // Clear selection if this was selected
    if (this.selectedComponentId === componentId) {
      this.clearSelection();
    }

    this.stage?.batchDraw();
  }

  /**
   * Moves a component to a new position and updates connectors.
   * This is also called internally from drag-end events.
   *
   * @param componentId - The ID of the component to move.
   * @param newPosition - The new position on the canvas.
   */
  moveComponent(componentId: string, newPosition: Point): void {
    const component = this.state.components.get(componentId);
    if (!component) return;

    // Snap to canvas bounds if dragged out-of-bounds
    const clampedPosition = this.clampToCanvasBounds(
      newPosition,
      component.size.width,
      component.size.height
    );

    component.position = { x: clampedPosition.x, y: clampedPosition.y };

    // Update Konva node position
    const node = this.componentNodes.get(componentId);
    if (node) {
      node.position({ x: clampedPosition.x, y: clampedPosition.y });
    }

    // Detect if the component moved into/out of a container
    const newContainerId = this.containerManager.getContainerAtPoint(clampedPosition);
    const oldContainerId = component.containerId;

    if (oldContainerId !== newContainerId) {
      // Remove from old container
      if (oldContainerId) {
        this.containerManager.removeChildFromContainer(oldContainerId, componentId);
        this.containerManager.recalculateBounds(oldContainerId);
        this.updateContainerNode(oldContainerId);
      }

      // Add to new container (may be rejected if nesting depth is exceeded)
      if (newContainerId) {
        const accepted = this.containerManager.addChildToContainer(newContainerId, componentId);
        if (accepted) {
          this.containerManager.recalculateBounds(newContainerId);
          this.updateContainerNode(newContainerId);
          component.containerId = newContainerId;
        } else {
          // Rejected (max nesting depth) — component stays uncontained
          component.containerId = null;
        }
      } else {
        component.containerId = newContainerId;
      }
    } else if (oldContainerId) {
      // Same container, but position changed — recalculate bounds
      this.containerManager.recalculateBounds(oldContainerId);
      this.updateContainerNode(oldContainerId);
    }

    // Update connector routes
    this.connectorRouter.updateRoutes();
    this.refreshAllConnectors();

    // Update selection overlay if selected
    if (this.selectedComponentId === componentId) {
      this.updateSelectionOverlay(component);
    }

    this.stage?.batchDraw();
  }

  /**
   * Adds a container to the diagram at the specified position.
   *
   * @param type - The container type (vpc, subnet, az, resource-group, region).
   * @param position - The top-left canvas position for the container.
   * @param parentId - Optional parent container ID for nesting.
   * @param label - Optional custom label for the container.
   * @returns The ID of the newly created container.
   */
  addContainer(type: ContainerType, position: Point, parentId?: string, label?: string): string {
    const id = generateContainerId();

    // Determine nesting level
    let nestingLevel = 0;
    if (parentId) {
      // Check if nesting would exceed maximum depth
      if (!this.containerManager.canNestIn(parentId)) {
        console.warn('Maximum nesting depth reached. Cannot nest further.');
        // Return empty string to indicate rejection — caller can show tooltip
        return '';
      }
      nestingLevel = this.containerManager.getNestingLevel(parentId) + 1;
    }

    // Use type-specific styling
    const containerLabel = label || this.getContainerLabel(type);
    const style = this.containerManager.getContainerStyleByType(type, containerLabel);

    // Type-specific default sizes
    const defaultSizes: Record<ContainerType, { width: number; height: number }> = {
      'region': { width: 800, height: 600 },
      'vpc': { width: 600, height: 450 },
      'az': { width: 350, height: 400 },
      'subnet': { width: 280, height: 200 },
      'resource-group': { width: 500, height: 350 },
    };
    const size = defaultSizes[type] || { width: 200, height: 150 };

    const container: DiagramContainer = {
      id,
      type,
      label: containerLabel,
      bounds: {
        x: position.x,
        y: position.y,
        width: size.width,
        height: size.height,
      },
      parentId: parentId ?? null,
      childIds: [],
      nestingLevel,
      style,
    };

    this.state.containers.set(id, container);

    // If nested inside a parent, register the relationship
    if (parentId) {
      const accepted = this.containerManager.addChildToContainer(parentId, id);
      if (!accepted) {
        // This shouldn't happen as we checked canNestIn above, but handle gracefully
        container.parentId = null;
        container.nestingLevel = 0;
        container.style = this.containerManager.getContainerStyleByType(type, containerLabel);
      } else {
        this.containerManager.recalculateBounds(parentId);
        this.updateContainerNode(parentId);
      }
    }

    // Render the container
    this.renderContainer(container);

    this.stage?.batchDraw();
    return id;
  }

  /**
   * Removes a container from the diagram.
   * Child components are released (their containerId is cleared).
   * Child containers are also removed recursively.
   *
   * @param containerId - The ID of the container to remove.
   */
  removeContainer(containerId: string): void {
    const container = this.state.containers.get(containerId);
    if (!container) return;

    // Remove all child containers recursively
    const childContainerIds = container.childIds.filter((id) => this.state.containers.has(id));
    for (const childContainerId of childContainerIds) {
      this.removeContainer(childContainerId);
    }

    // Release child components (clear their containerId)
    const childComponentIds = container.childIds.filter((id) => this.state.components.has(id));
    for (const childId of childComponentIds) {
      const comp = this.state.components.get(childId);
      if (comp) {
        comp.containerId = null;
      }
    }

    // Remove from parent container if nested
    if (container.parentId) {
      this.containerManager.removeChildFromContainer(container.parentId, containerId);
      this.containerManager.recalculateBounds(container.parentId);
      this.updateContainerNode(container.parentId);
    }

    // Remove from state
    this.state.containers.delete(containerId);

    // Remove Konva node
    const node = this.containerNodes.get(containerId);
    if (node) {
      node.destroy();
      this.containerNodes.delete(containerId);
    }

    this.stage?.batchDraw();
  }

  /**
   * Starts connector creation mode from a source component.
   * Displays visual feedback (a dashed preview line) following the cursor.
   *
   * @param sourceId - The ID of the source component.
   */
  startConnection(sourceId: string): void {
    const source = this.state.components.get(sourceId);
    if (!source) return;

    this.isConnecting = true;
    this.connectionSourceId = sourceId;

    // Create a preview line on the selection layer
    const centerX = source.position.x + source.size.width / 2;
    const centerY = source.position.y + source.size.height / 2;

    this.connectionPreviewLine = new Konva.Line({
      points: [centerX, centerY, centerX, centerY],
      stroke: CONNECTOR_PREVIEW_COLOR,
      strokeWidth: 1.5,
      dash: CONNECTOR_PREVIEW_DASH,
      listening: false,
    });

    this.selectionLayer.add(this.connectionPreviewLine);

    // Track mouse movement for preview
    this.stage.on('mousemove.connecting', (e: any) => {
      const pos = this.stage.getPointerPosition();
      if (pos && this.connectionPreviewLine) {
        this.connectionPreviewLine.points([centerX, centerY, pos.x, pos.y]);
        this.selectionLayer.batchDraw();
      }
    });

    this.stage.batchDraw();
  }

  /**
   * Completes the connector creation from the source to the target component.
   * Creates the connector in state, computes the route, and renders it.
   *
   * @param targetId - The ID of the target component.
   */
  completeConnection(targetId: string): void {
    if (!this.isConnecting || !this.connectionSourceId) return;

    // Reject self-connection
    if (this.connectionSourceId === targetId) {
      this.cancelConnection();
      return;
    }

    // Create connector via ConnectorRouter
    const connectorId = this.connectorRouter.addConnector(
      this.connectionSourceId,
      targetId,
      true // directed by default
    );

    if (connectorId) {
      const connector = this.state.connectors.get(connectorId);
      if (connector) {
        this.renderConnector(connector);
      }
    }

    // Clean up connection mode
    this.cancelConnection();
    this.stage?.batchDraw();
  }

  /**
   * Cancels the in-progress connector creation and cleans up preview visuals.
   */
  cancelConnection(): void {
    this.isConnecting = false;
    this.connectionSourceId = null;

    if (this.connectionPreviewLine) {
      this.connectionPreviewLine.destroy();
      this.connectionPreviewLine = null;
    }

    this.stage?.off('mousemove.connecting');
    this.selectionLayer?.batchDraw();
  }

  /**
   * Removes a connector from the diagram.
   *
   * @param connectorId - The ID of the connector to remove.
   */
  removeConnection(connectorId: string): void {
    this.connectorRouter.removeConnector(connectorId);

    // Remove Konva node
    const node = this.connectorNodes.get(connectorId);
    if (node) {
      node.destroy();
      this.connectorNodes.delete(connectorId);
    }

    this.stage?.batchDraw();
  }

  /**
   * Returns the current diagram state.
   */
  getState(): DiagramState {
    return this.state;
  }

  /**
   * Clears the entire canvas and resets state.
   */
  clearCanvas(): void {
    // Destroy all Konva nodes
    this.componentNodes.forEach((node) => node.destroy());
    this.containerNodes.forEach((node) => node.destroy());
    this.connectorNodes.forEach((node) => node.destroy());

    this.componentNodes.clear();
    this.containerNodes.clear();
    this.connectorNodes.clear();

    this.clearSelection();
    this.cancelConnection();

    // Clear state collections
    this.state.components.clear();
    this.state.containers.clear();
    this.state.connectors.clear();

    // Redraw layers
    this.containerLayer?.batchDraw();
    this.componentLayer?.batchDraw();
    this.connectorLayer?.batchDraw();
    this.selectionLayer?.batchDraw();
  }

  /**
   * Returns the Konva stage instance (used by ExportEngine).
   */
  getStage(): any {
    return this.stage;
  }

  /**
   * Returns whether the controller is in connector creation mode.
   */
  isInConnectionMode(): boolean {
    return this.isConnecting;
  }

  /**
   * Returns the currently selected component ID, or null.
   */
  getSelectedComponentId(): string | null {
    return this.selectedComponentId;
  }

  // ─── Private Rendering Methods ─────────────────────────────────────

  /**
   * Renders a DiagramComponent as a Konva group (icon image + label text).
   * Makes the group draggable and wires up drag-end for position syncing.
   */
  private renderComponent(component: DiagramComponent): void {
    const group = new Konva.Group({
      x: component.position.x,
      y: component.position.y,
      draggable: true,
      id: component.id,
    });

    // Icon image (or placeholder rect if icon fails to load)
    if (component.iconPath) {
      const imageObj = new Image();
      imageObj.onload = () => {
        const konvaImage = new Konva.Image({
          image: imageObj,
          width: component.size.width,
          height: component.size.height,
        });
        group.add(konvaImage);
        // Move label below the image
        this.componentLayer?.batchDraw();
      };
      imageObj.onerror = () => {
        // Fallback placeholder rectangle
        this.addPlaceholderToGroup(group, component);
        this.componentLayer?.batchDraw();
      };
      imageObj.src = component.iconPath.startsWith('/')
        ? component.iconPath
        : `/${component.iconPath}`;
    } else {
      // No icon path — use placeholder
      this.addPlaceholderToGroup(group, component);
    }

    // Label text below the icon
    const label = new Konva.Text({
      x: 0,
      y: component.size.height + LABEL_OFFSET_Y,
      text: component.label,
      fontSize: LABEL_FONT_SIZE,
      fontFamily: LABEL_FONT_FAMILY,
      fill: '#333333',
      width: component.size.width + 20,
      align: 'center',
      offsetX: 10,
    });
    group.add(label);

    // Hit area for click/drag covering icon and label
    const hitRect = new Konva.Rect({
      width: component.size.width,
      height: component.size.height + LABEL_OFFSET_Y + LABEL_FONT_SIZE + 4,
      fill: 'transparent',
      listening: true,
    });
    group.add(hitRect);
    hitRect.moveToBottom();

    // Drag-end event — sync position to state and update connectors
    group.on('dragend', () => {
      const newPos: Point = { x: group.x(), y: group.y() };
      this.moveComponent(component.id, newPos);
    });

    // Click event — select or complete connection
    group.on('click tap', () => {
      if (this.isConnecting) {
        this.completeConnection(component.id);
      } else {
        this.selectComponent(component.id);
      }
    });

    this.componentLayer.add(group);
    this.componentNodes.set(component.id, group);
  }

  /**
   * Adds a placeholder rectangle to a component group (fallback when icon fails to load).
   */
  private addPlaceholderToGroup(group: any, component: DiagramComponent): void {
    const placeholder = new Konva.Rect({
      width: component.size.width,
      height: component.size.height,
      fill: '#e0e0e0',
      stroke: '#999999',
      strokeWidth: 1,
      cornerRadius: 4,
    });
    group.add(placeholder);

    // Short name text inside the placeholder
    const nameText = new Konva.Text({
      x: 2,
      y: component.size.height / 2 - 6,
      text: component.serviceName.substring(0, 6),
      fontSize: 10,
      fontFamily: LABEL_FONT_FAMILY,
      fill: '#666666',
      width: component.size.width - 4,
      align: 'center',
    });
    group.add(nameText);
  }

  /**
   * Renders a DiagramContainer as a Konva group (styled rect + type icon + editable label).
   * Uses type-specific styling (dash patterns, colours) and supports inline label editing.
   */
  private renderContainer(container: DiagramContainer): void {
    const group = new Konva.Group({
      x: container.bounds.x,
      y: container.bounds.y,
      id: container.id,
    });

    // Determine dash pattern from style (default to solid for region)
    const dashPattern = container.style.dash && container.style.dash.length > 0
      ? container.style.dash
      : [];

    const rectConfig: any = {
      width: container.bounds.width,
      height: container.bounds.height,
      fill: container.style.backgroundColor,
      stroke: container.style.borderColor,
      strokeWidth: 1.5,
      cornerRadius: container.style.borderRadius,
    };

    // Only apply dash if there's a pattern
    if (dashPattern.length > 0) {
      rectConfig.dash = dashPattern;
    }

    const rect = new Konva.Rect(rectConfig);
    group.add(rect);

    // Type-indicator icon (small coloured square) in the top-left corner
    const iconSize = 10;
    const typeIcon = new Konva.Rect({
      x: CONTAINER_LABEL_PADDING,
      y: CONTAINER_LABEL_PADDING + 2,
      width: iconSize,
      height: iconSize,
      fill: container.style.borderColor,
      cornerRadius: 2,
      listening: false,
    });
    group.add(typeIcon);

    // Container label at the top-left, offset to the right of the icon
    const label = new Konva.Text({
      x: CONTAINER_LABEL_PADDING + iconSize + 6,
      y: CONTAINER_LABEL_PADDING,
      text: container.label,
      fontSize: CONTAINER_LABEL_FONT_SIZE,
      fontFamily: LABEL_FONT_FAMILY,
      fill: container.style.borderColor,
      fontStyle: 'bold',
    });
    group.add(label);

    // Double-click to edit label inline
    label.on('dblclick', () => {
      // Get the absolute position of the text on the canvas
      const textPos = label.getAbsolutePosition();
      const stageBox = this.stage.container().getBoundingClientRect();

      // Create an editable input
      const input = document.createElement('input');
      input.type = 'text';
      input.value = container.label;
      input.style.position = 'absolute';
      input.style.left = (stageBox.left + textPos.x) + 'px';
      input.style.top = (stageBox.top + textPos.y) + 'px';
      input.style.fontSize = '13px';
      input.style.fontFamily = 'Inter, Arial, sans-serif';
      input.style.fontWeight = 'bold';
      input.style.border = '1px solid #1a73e8';
      input.style.borderRadius = '3px';
      input.style.padding = '2px 4px';
      input.style.outline = 'none';
      input.style.minWidth = '100px';
      input.style.zIndex = '9999';
      input.style.color = container.style.borderColor;

      document.body.appendChild(input);
      input.focus();
      input.select();

      // Hide the Konva text while editing
      label.hide();
      this.containerLayer.batchDraw();

      const finishEditing = () => {
        container.label = input.value || container.label;
        label.text(container.label);
        label.show();

        // Update style if subnet label changed (public/private differentiation)
        if (container.type === 'subnet') {
          const newStyle = this.containerManager.getContainerStyleByType(container.type, container.label);
          container.style = newStyle;
          rect.fill(newStyle.backgroundColor);
          rect.stroke(newStyle.borderColor);
          typeIcon.fill(newStyle.borderColor);
          label.fill(newStyle.borderColor);
        }

        this.containerLayer.batchDraw();
        document.body.removeChild(input);
      };

      input.addEventListener('blur', finishEditing);
      input.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          input.blur();
        }
        if (e.key === 'Escape') {
          input.value = container.label; // revert
          input.blur();
        }
      });
    });

    this.containerLayer.add(group);
    this.containerNodes.set(container.id, group);
  }

  /**
   * Updates the visual representation of a container after its bounds changed.
   */
  private updateContainerNode(containerId: string): void {
    const container = this.state.containers.get(containerId);
    const node = this.containerNodes.get(containerId);
    if (!container || !node) return;

    node.position({ x: container.bounds.x, y: container.bounds.y });

    // Update the rect child
    const rect = node.findOne('Rect');
    if (rect) {
      rect.width(container.bounds.width);
      rect.height(container.bounds.height);
    }
  }

  /**
   * Renders a DiagramConnector as a Konva line (or arrow for directed connectors).
   */
  private renderConnector(connector: DiagramConnector): void {
    const points = this.flattenRoutePoints(connector.routePath.points);

    const lineConfig: any = {
      points,
      stroke: CONNECTOR_STROKE_COLOR,
      strokeWidth: CONNECTOR_STROKE_WIDTH,
      lineCap: 'round',
      lineJoin: 'round',
      id: connector.id,
    };

    let line: any;
    if (connector.directed) {
      line = new Konva.Arrow({
        ...lineConfig,
        pointerLength: CONNECTOR_ARROW_SIZE,
        pointerWidth: CONNECTOR_ARROW_SIZE,
        fill: CONNECTOR_STROKE_COLOR,
      });
    } else {
      line = new Konva.Line(lineConfig);
    }

    // Click to select connector (for deletion)
    line.on('click tap', () => {
      this.clearSelection();
      this.showConnectorDeleteControl(connector.id, line);
    });

    this.connectorLayer.add(line);
    this.connectorNodes.set(connector.id, line);

    // Render label if present
    if (connector.label) {
      this.renderConnectorLabel(connector);
    }
  }

  /**
   * Refreshes all connector Konva nodes from their current route paths in state.
   */
  private refreshAllConnectors(): void {
    for (const [id, connector] of this.state.connectors) {
      const node = this.connectorNodes.get(id);
      if (node) {
        const points = this.flattenRoutePoints(connector.routePath.points);
        node.points(points);
      }
    }
    this.connectorLayer?.batchDraw();
  }

  /**
   * Renders a connector label at the midpoint of its route.
   */
  private renderConnectorLabel(connector: DiagramConnector): void {
    if (!connector.label || connector.routePath.points.length < 2) return;

    const midIdx = Math.floor(connector.routePath.points.length / 2);
    const midPoint = connector.routePath.points[midIdx];

    const labelText = new Konva.Text({
      x: midPoint.x - 20,
      y: midPoint.y - 16,
      text: connector.label,
      fontSize: 11,
      fontFamily: LABEL_FONT_FAMILY,
      fill: '#555555',
      padding: 2,
    });

    this.connectorLayer.add(labelText);
  }

  /**
   * Flattens an array of Point objects into a flat number array [x1, y1, x2, y2, ...].
   */
  private flattenRoutePoints(points: Point[]): number[] {
    const flat: number[] = [];
    for (const pt of points) {
      flat.push(pt.x, pt.y);
    }
    return flat;
  }

  // ─── Selection Management ─────────────────────────────────────────

  /**
   * Selects a component, showing selection handles and delete control.
   */
  private selectComponent(componentId: string): void {
    this.clearSelection();

    const component = this.state.components.get(componentId);
    if (!component) return;

    this.selectedComponentId = componentId;
    this.updateSelectionOverlay(component);
  }

  /**
   * Updates the selection overlay position/size for the given component.
   */
  private updateSelectionOverlay(component: DiagramComponent): void {
    // Remove old overlay
    this.selectionLayer?.destroyChildren();

    // Selection rectangle
    this.selectionRect = new Konva.Rect({
      x: component.position.x - 4,
      y: component.position.y - 4,
      width: component.size.width + 8,
      height: component.size.height + 8,
      stroke: SELECTION_STROKE_COLOR,
      strokeWidth: SELECTION_STROKE_WIDTH,
      dash: [4, 3],
      fill: 'transparent',
      listening: false,
    });
    this.selectionLayer.add(this.selectionRect);

    // Delete control (X button) at top-right
    const deleteGroup = new Konva.Group({
      x: component.position.x + component.size.width + 4,
      y: component.position.y - 12,
    });

    const deleteBg = new Konva.Circle({
      radius: 9,
      fill: '#d93025',
    });
    deleteGroup.add(deleteBg);

    const deleteText = new Konva.Text({
      text: '×',
      fontSize: 14,
      fontFamily: LABEL_FONT_FAMILY,
      fill: '#ffffff',
      offsetX: 4,
      offsetY: 7,
    });
    deleteGroup.add(deleteText);

    deleteGroup.on('click tap', () => {
      if (this.selectedComponentId) {
        this.removeComponent(this.selectedComponentId);
      }
    });

    this.selectionLayer.add(deleteGroup);
    this.deleteControl = deleteGroup;

    this.selectionLayer.batchDraw();
  }

  /**
   * Shows a delete control for a connector when it is clicked.
   */
  private showConnectorDeleteControl(connectorId: string, lineNode: any): void {
    this.selectionLayer?.destroyChildren();

    // Place delete control at midpoint of the connector line
    const points = lineNode.points();
    const midIdx = Math.floor(points.length / 2);
    // Ensure midIdx is even (x coordinate)
    const mx = points[midIdx - (midIdx % 2)] || points[0];
    const my = points[midIdx - (midIdx % 2) + 1] || points[1];

    const deleteGroup = new Konva.Group({ x: mx, y: my - 14 });

    const deleteBg = new Konva.Circle({
      radius: 9,
      fill: '#d93025',
    });
    deleteGroup.add(deleteBg);

    const deleteText = new Konva.Text({
      text: '×',
      fontSize: 14,
      fontFamily: LABEL_FONT_FAMILY,
      fill: '#ffffff',
      offsetX: 4,
      offsetY: 7,
    });
    deleteGroup.add(deleteText);

    deleteGroup.on('click tap', () => {
      this.removeConnection(connectorId);
      this.selectionLayer?.destroyChildren();
      this.selectionLayer?.batchDraw();
    });

    this.selectionLayer.add(deleteGroup);
    this.selectionLayer.batchDraw();
  }

  /**
   * Clears the current selection state and removes selection UI.
   */
  private clearSelection(): void {
    this.selectedComponentId = null;
    this.selectionRect = null;
    this.deleteControl = null;
    this.selectionLayer?.destroyChildren();
    this.selectionLayer?.batchDraw();
  }

  // ─── Utility Methods ──────────────────────────────────────────────

  /**
   * Clamps a position to ensure it stays within the canvas bounds.
   * If the position (considering the component size) would exceed the stage
   * dimensions, it is snapped to the nearest valid edge.
   *
   * @param position - The proposed position.
   * @param width - The width of the element being placed.
   * @param height - The height of the element being placed.
   * @returns The clamped position within canvas bounds.
   */
  private clampToCanvasBounds(position: Point, width: number, height: number): Point {
    if (!this.stage) return position;

    const stageWidth = this.stage.width();
    const stageHeight = this.stage.height();

    const clampedX = Math.max(
      CANVAS_BOUNDARY_MARGIN,
      Math.min(position.x, stageWidth - width - CANVAS_BOUNDARY_MARGIN)
    );
    const clampedY = Math.max(
      CANVAS_BOUNDARY_MARGIN,
      Math.min(position.y, stageHeight - height - CANVAS_BOUNDARY_MARGIN)
    );

    return { x: clampedX, y: clampedY };
  }

  /**
   * Returns a human-readable label for a container type.
   */
  private getContainerLabel(type: ContainerType): string {
    const labels: Record<ContainerType, string> = {
      vpc: 'VPC',
      subnet: 'Subnet',
      az: 'Availability Zone',
      'resource-group': 'Resource Group',
      region: 'Region',
    };
    return labels[type] || type;
  }
}
