var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { ContainerManager } from "./container-manager.js";
import { ConnectorRouter } from "./connector-router.js";
let componentIdCounter = 0;
let containerIdCounter = 0;
const DEFAULT_COMPONENT_WIDTH = 48;
const DEFAULT_COMPONENT_HEIGHT = 48;
const LABEL_FONT_SIZE = 12;
const LABEL_FONT_FAMILY = "Inter, Arial, sans-serif";
const LABEL_OFFSET_Y = 6;
const CONTAINER_LABEL_FONT_SIZE = 13;
const CONTAINER_LABEL_PADDING = 8;
const CANVAS_BOUNDARY_MARGIN = 4;
const SELECTION_HANDLE_SIZE = 8;
const SELECTION_STROKE_COLOR = "#1a73e8";
const SELECTION_STROKE_WIDTH = 2;
const CONNECTOR_PREVIEW_COLOR = "#666666";
const CONNECTOR_PREVIEW_DASH = [6, 4];
const CONNECTOR_STROKE_COLOR = "#555555";
const CONNECTOR_STROKE_WIDTH = 2;
const CONNECTOR_ARROW_SIZE = 8;
function generateComponentId() {
  componentIdCounter++;
  return `comp-${Date.now()}-${componentIdCounter}`;
}
function generateContainerId() {
  containerIdCounter++;
  return `container-${Date.now()}-${containerIdCounter}`;
}
function resetCanvasIdCounters() {
  componentIdCounter = 0;
  containerIdCounter = 0;
}
class CanvasController {
  constructor(state) {
    __publicField(this, "stage", null);
    __publicField(this, "containerLayer", null);
    __publicField(this, "componentLayer", null);
    __publicField(this, "connectorLayer", null);
    __publicField(this, "selectionLayer", null);
    __publicField(this, "state");
    __publicField(this, "containerManager");
    __publicField(this, "connectorRouter");
    /** Map of component IDs to their Konva groups. */
    __publicField(this, "componentNodes", /* @__PURE__ */ new Map());
    /** Map of container IDs to their Konva groups. */
    __publicField(this, "containerNodes", /* @__PURE__ */ new Map());
    /** Map of connector IDs to their Konva lines. */
    __publicField(this, "connectorNodes", /* @__PURE__ */ new Map());
    /** Currently selected component ID (null if nothing selected). */
    __publicField(this, "selectedComponentId", null);
    /** Selection UI nodes. */
    __publicField(this, "selectionRect", null);
    __publicField(this, "deleteControl", null);
    /** Connector creation mode state. */
    __publicField(this, "isConnecting", false);
    __publicField(this, "connectionSourceId", null);
    __publicField(this, "connectionPreviewLine", null);
    /** Service info resolver — set externally to lookup service details by serviceId. */
    __publicField(this, "serviceInfoResolver", null);
    this.state = state;
    this.containerManager = new ContainerManager(state);
    this.connectorRouter = new ConnectorRouter(state);
  }
  /**
   * Registers a function to resolve serviceId to ServiceInfo.
   * This is used by addComponent when only a serviceId is provided.
   */
  setServiceInfoResolver(resolver) {
    this.serviceInfoResolver = resolver;
  }
  /**
   * Initialises the Konva.Stage and creates the four rendering layers.
   *
   * @param containerId - The DOM element ID for the Konva stage container.
   */
  initialise(containerId) {
    const containerEl = document.getElementById(containerId);
    if (!containerEl) {
      throw new Error(`Canvas container element not found: #${containerId}`);
    }
    const width = containerEl.clientWidth || 1200;
    const height = containerEl.clientHeight || 800;
    this.stage = new Konva.Stage({
      container: containerId,
      width,
      height
    });
    this.containerLayer = new Konva.Layer({ name: "containers" });
    this.connectorLayer = new Konva.Layer({ name: "connectors" });
    this.componentLayer = new Konva.Layer({ name: "components" });
    this.selectionLayer = new Konva.Layer({ name: "selection" });
    this.stage.add(this.containerLayer);
    this.stage.add(this.connectorLayer);
    this.stage.add(this.componentLayer);
    this.stage.add(this.selectionLayer);
    this.stage.on("click tap", (e) => {
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
  loadDiagram(state) {
    this.clearCanvas();
    this.state = state;
    this.containerManager = new ContainerManager(state);
    this.connectorRouter = new ConnectorRouter(state);
    for (const [id, container] of state.containers) {
      this.renderContainer(container);
    }
    for (const [id, component] of state.components) {
      this.renderComponent(component);
    }
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
  addComponent(serviceId, position, containerId) {
    let serviceInfo = null;
    if (this.serviceInfoResolver) {
      serviceInfo = this.serviceInfoResolver(serviceId);
    }
    const compWidth = serviceInfo?.defaultWidth ?? DEFAULT_COMPONENT_WIDTH;
    const compHeight = serviceInfo?.defaultHeight ?? DEFAULT_COMPONENT_HEIGHT;
    const clampedPosition = this.clampToCanvasBounds(position, compWidth, compHeight);
    const id = generateComponentId();
    const component = {
      id,
      serviceId,
      serviceName: serviceInfo?.serviceName ?? serviceId,
      iconPath: serviceInfo?.iconPath ?? "",
      position: { x: clampedPosition.x, y: clampedPosition.y },
      size: {
        width: compWidth,
        height: compHeight
      },
      containerId: containerId ?? null,
      label: serviceInfo?.serviceName ?? serviceId
    };
    this.state.components.set(id, component);
    if (containerId) {
      const accepted = this.containerManager.addChildToContainer(containerId, id);
      if (accepted) {
        this.containerManager.recalculateBounds(containerId);
        this.updateContainerNode(containerId);
      } else {
        component.containerId = null;
      }
    }
    this.renderComponent(component);
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
  addComponentWithInfo(info, position, containerId) {
    const compWidth = info.defaultWidth || DEFAULT_COMPONENT_WIDTH;
    const compHeight = info.defaultHeight || DEFAULT_COMPONENT_HEIGHT;
    const clampedPosition = this.clampToCanvasBounds(position, compWidth, compHeight);
    const id = generateComponentId();
    const component = {
      id,
      serviceId: info.serviceId,
      serviceName: info.serviceName,
      iconPath: info.iconPath,
      position: { x: clampedPosition.x, y: clampedPosition.y },
      size: {
        width: compWidth,
        height: compHeight
      },
      containerId: containerId ?? null,
      label: info.serviceName
    };
    this.state.components.set(id, component);
    if (containerId) {
      const accepted = this.containerManager.addChildToContainer(containerId, id);
      if (accepted) {
        this.containerManager.recalculateBounds(containerId);
        this.updateContainerNode(containerId);
      } else {
        component.containerId = null;
      }
    }
    this.renderComponent(component);
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
  removeComponent(componentId) {
    const component = this.state.components.get(componentId);
    if (!component) return;
    if (component.containerId) {
      this.containerManager.removeChildFromContainer(component.containerId, componentId);
      this.containerManager.recalculateBounds(component.containerId);
      this.updateContainerNode(component.containerId);
    }
    const connectorsToRemove = [];
    for (const [connId, connector] of this.state.connectors) {
      if (connector.sourceComponentId === componentId || connector.targetComponentId === componentId) {
        connectorsToRemove.push(connId);
      }
    }
    for (const connId of connectorsToRemove) {
      this.removeConnection(connId);
    }
    this.state.components.delete(componentId);
    const node = this.componentNodes.get(componentId);
    if (node) {
      node.destroy();
      this.componentNodes.delete(componentId);
    }
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
  moveComponent(componentId, newPosition) {
    const component = this.state.components.get(componentId);
    if (!component) return;
    const clampedPosition = this.clampToCanvasBounds(
      newPosition,
      component.size.width,
      component.size.height
    );
    component.position = { x: clampedPosition.x, y: clampedPosition.y };
    const node = this.componentNodes.get(componentId);
    if (node) {
      node.position({ x: clampedPosition.x, y: clampedPosition.y });
    }
    const newContainerId = this.containerManager.getContainerAtPoint(clampedPosition);
    const oldContainerId = component.containerId;
    if (oldContainerId !== newContainerId) {
      if (oldContainerId) {
        this.containerManager.removeChildFromContainer(oldContainerId, componentId);
        this.containerManager.recalculateBounds(oldContainerId);
        this.updateContainerNode(oldContainerId);
      }
      if (newContainerId) {
        const accepted = this.containerManager.addChildToContainer(newContainerId, componentId);
        if (accepted) {
          this.containerManager.recalculateBounds(newContainerId);
          this.updateContainerNode(newContainerId);
          component.containerId = newContainerId;
        } else {
          component.containerId = null;
        }
      } else {
        component.containerId = newContainerId;
      }
    } else if (oldContainerId) {
      this.containerManager.recalculateBounds(oldContainerId);
      this.updateContainerNode(oldContainerId);
    }
    this.connectorRouter.updateRoutes();
    this.refreshAllConnectors();
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
   * @returns The ID of the newly created container.
   */
  addContainer(type, position, parentId) {
    const id = generateContainerId();
    let nestingLevel = 0;
    if (parentId) {
      if (!this.containerManager.canNestIn(parentId)) {
        console.warn("Maximum nesting depth reached. Cannot nest further.");
        return "";
      }
      nestingLevel = this.containerManager.getNestingLevel(parentId) + 1;
    }
    const style = this.containerManager.getContainerStyle(nestingLevel);
    const container = {
      id,
      type,
      label: this.getContainerLabel(type),
      bounds: {
        x: position.x,
        y: position.y,
        width: 200,
        height: 150
      },
      parentId: parentId ?? null,
      childIds: [],
      nestingLevel,
      style
    };
    this.state.containers.set(id, container);
    if (parentId) {
      const accepted = this.containerManager.addChildToContainer(parentId, id);
      if (!accepted) {
        container.parentId = null;
        container.nestingLevel = 0;
        container.style = this.containerManager.getContainerStyle(0);
      } else {
        this.containerManager.recalculateBounds(parentId);
        this.updateContainerNode(parentId);
      }
    }
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
  removeContainer(containerId) {
    const container = this.state.containers.get(containerId);
    if (!container) return;
    const childContainerIds = container.childIds.filter((id) => this.state.containers.has(id));
    for (const childContainerId of childContainerIds) {
      this.removeContainer(childContainerId);
    }
    const childComponentIds = container.childIds.filter((id) => this.state.components.has(id));
    for (const childId of childComponentIds) {
      const comp = this.state.components.get(childId);
      if (comp) {
        comp.containerId = null;
      }
    }
    if (container.parentId) {
      this.containerManager.removeChildFromContainer(container.parentId, containerId);
      this.containerManager.recalculateBounds(container.parentId);
      this.updateContainerNode(container.parentId);
    }
    this.state.containers.delete(containerId);
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
  startConnection(sourceId) {
    const source = this.state.components.get(sourceId);
    if (!source) return;
    this.isConnecting = true;
    this.connectionSourceId = sourceId;
    const centerX = source.position.x + source.size.width / 2;
    const centerY = source.position.y + source.size.height / 2;
    this.connectionPreviewLine = new Konva.Line({
      points: [centerX, centerY, centerX, centerY],
      stroke: CONNECTOR_PREVIEW_COLOR,
      strokeWidth: 1.5,
      dash: CONNECTOR_PREVIEW_DASH,
      listening: false
    });
    this.selectionLayer.add(this.connectionPreviewLine);
    this.stage.on("mousemove.connecting", (e) => {
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
  completeConnection(targetId) {
    if (!this.isConnecting || !this.connectionSourceId) return;
    if (this.connectionSourceId === targetId) {
      this.cancelConnection();
      return;
    }
    const connectorId = this.connectorRouter.addConnector(
      this.connectionSourceId,
      targetId,
      true
      // directed by default
    );
    if (connectorId) {
      const connector = this.state.connectors.get(connectorId);
      if (connector) {
        this.renderConnector(connector);
      }
    }
    this.cancelConnection();
    this.stage?.batchDraw();
  }
  /**
   * Cancels the in-progress connector creation and cleans up preview visuals.
   */
  cancelConnection() {
    this.isConnecting = false;
    this.connectionSourceId = null;
    if (this.connectionPreviewLine) {
      this.connectionPreviewLine.destroy();
      this.connectionPreviewLine = null;
    }
    this.stage?.off("mousemove.connecting");
    this.selectionLayer?.batchDraw();
  }
  /**
   * Removes a connector from the diagram.
   *
   * @param connectorId - The ID of the connector to remove.
   */
  removeConnection(connectorId) {
    this.connectorRouter.removeConnector(connectorId);
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
  getState() {
    return this.state;
  }
  /**
   * Clears the entire canvas and resets state.
   */
  clearCanvas() {
    this.componentNodes.forEach((node) => node.destroy());
    this.containerNodes.forEach((node) => node.destroy());
    this.connectorNodes.forEach((node) => node.destroy());
    this.componentNodes.clear();
    this.containerNodes.clear();
    this.connectorNodes.clear();
    this.clearSelection();
    this.cancelConnection();
    this.state.components.clear();
    this.state.containers.clear();
    this.state.connectors.clear();
    this.containerLayer?.batchDraw();
    this.componentLayer?.batchDraw();
    this.connectorLayer?.batchDraw();
    this.selectionLayer?.batchDraw();
  }
  /**
   * Returns the Konva stage instance (used by ExportEngine).
   */
  getStage() {
    return this.stage;
  }
  /**
   * Returns whether the controller is in connector creation mode.
   */
  isInConnectionMode() {
    return this.isConnecting;
  }
  /**
   * Returns the currently selected component ID, or null.
   */
  getSelectedComponentId() {
    return this.selectedComponentId;
  }
  // ─── Private Rendering Methods ─────────────────────────────────────
  /**
   * Renders a DiagramComponent as a Konva group (icon image + label text).
   * Makes the group draggable and wires up drag-end for position syncing.
   */
  renderComponent(component) {
    const group = new Konva.Group({
      x: component.position.x,
      y: component.position.y,
      draggable: true,
      id: component.id
    });
    if (component.iconPath) {
      const imageObj = new Image();
      imageObj.onload = () => {
        const konvaImage = new Konva.Image({
          image: imageObj,
          width: component.size.width,
          height: component.size.height
        });
        group.add(konvaImage);
        this.componentLayer?.batchDraw();
      };
      imageObj.onerror = () => {
        this.addPlaceholderToGroup(group, component);
        this.componentLayer?.batchDraw();
      };
      imageObj.src = component.iconPath.startsWith("/") ? component.iconPath : `/${component.iconPath}`;
    } else {
      this.addPlaceholderToGroup(group, component);
    }
    const label = new Konva.Text({
      x: 0,
      y: component.size.height + LABEL_OFFSET_Y,
      text: component.label,
      fontSize: LABEL_FONT_SIZE,
      fontFamily: LABEL_FONT_FAMILY,
      fill: "#333333",
      width: component.size.width + 20,
      align: "center",
      offsetX: 10
    });
    group.add(label);
    const hitRect = new Konva.Rect({
      width: component.size.width,
      height: component.size.height + LABEL_OFFSET_Y + LABEL_FONT_SIZE + 4,
      fill: "transparent",
      listening: true
    });
    group.add(hitRect);
    hitRect.moveToBottom();
    group.on("dragend", () => {
      const newPos = { x: group.x(), y: group.y() };
      this.moveComponent(component.id, newPos);
    });
    group.on("click tap", () => {
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
  addPlaceholderToGroup(group, component) {
    const placeholder = new Konva.Rect({
      width: component.size.width,
      height: component.size.height,
      fill: "#e0e0e0",
      stroke: "#999999",
      strokeWidth: 1,
      cornerRadius: 4
    });
    group.add(placeholder);
    const nameText = new Konva.Text({
      x: 2,
      y: component.size.height / 2 - 6,
      text: component.serviceName.substring(0, 6),
      fontSize: 10,
      fontFamily: LABEL_FONT_FAMILY,
      fill: "#666666",
      width: component.size.width - 4,
      align: "center"
    });
    group.add(nameText);
  }
  /**
   * Renders a DiagramContainer as a Konva group (styled rect + label).
   */
  renderContainer(container) {
    const group = new Konva.Group({
      x: container.bounds.x,
      y: container.bounds.y,
      id: container.id
    });
    const rect = new Konva.Rect({
      width: container.bounds.width,
      height: container.bounds.height,
      fill: container.style.backgroundColor,
      stroke: container.style.borderColor,
      strokeWidth: 1.5,
      cornerRadius: container.style.borderRadius,
      dash: [4, 2]
    });
    group.add(rect);
    const label = new Konva.Text({
      x: CONTAINER_LABEL_PADDING,
      y: CONTAINER_LABEL_PADDING,
      text: container.label,
      fontSize: CONTAINER_LABEL_FONT_SIZE,
      fontFamily: LABEL_FONT_FAMILY,
      fill: container.style.borderColor,
      fontStyle: "bold"
    });
    group.add(label);
    this.containerLayer.add(group);
    this.containerNodes.set(container.id, group);
  }
  /**
   * Updates the visual representation of a container after its bounds changed.
   */
  updateContainerNode(containerId) {
    const container = this.state.containers.get(containerId);
    const node = this.containerNodes.get(containerId);
    if (!container || !node) return;
    node.position({ x: container.bounds.x, y: container.bounds.y });
    const rect = node.findOne("Rect");
    if (rect) {
      rect.width(container.bounds.width);
      rect.height(container.bounds.height);
    }
  }
  /**
   * Renders a DiagramConnector as a Konva line (or arrow for directed connectors).
   */
  renderConnector(connector) {
    const points = this.flattenRoutePoints(connector.routePath.points);
    const lineConfig = {
      points,
      stroke: CONNECTOR_STROKE_COLOR,
      strokeWidth: CONNECTOR_STROKE_WIDTH,
      lineCap: "round",
      lineJoin: "round",
      id: connector.id
    };
    let line;
    if (connector.directed) {
      line = new Konva.Arrow({
        ...lineConfig,
        pointerLength: CONNECTOR_ARROW_SIZE,
        pointerWidth: CONNECTOR_ARROW_SIZE,
        fill: CONNECTOR_STROKE_COLOR
      });
    } else {
      line = new Konva.Line(lineConfig);
    }
    line.on("click tap", () => {
      this.clearSelection();
      this.showConnectorDeleteControl(connector.id, line);
    });
    this.connectorLayer.add(line);
    this.connectorNodes.set(connector.id, line);
    if (connector.label) {
      this.renderConnectorLabel(connector);
    }
  }
  /**
   * Refreshes all connector Konva nodes from their current route paths in state.
   */
  refreshAllConnectors() {
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
  renderConnectorLabel(connector) {
    if (!connector.label || connector.routePath.points.length < 2) return;
    const midIdx = Math.floor(connector.routePath.points.length / 2);
    const midPoint = connector.routePath.points[midIdx];
    const labelText = new Konva.Text({
      x: midPoint.x - 20,
      y: midPoint.y - 16,
      text: connector.label,
      fontSize: 11,
      fontFamily: LABEL_FONT_FAMILY,
      fill: "#555555",
      padding: 2
    });
    this.connectorLayer.add(labelText);
  }
  /**
   * Flattens an array of Point objects into a flat number array [x1, y1, x2, y2, ...].
   */
  flattenRoutePoints(points) {
    const flat = [];
    for (const pt of points) {
      flat.push(pt.x, pt.y);
    }
    return flat;
  }
  // ─── Selection Management ─────────────────────────────────────────
  /**
   * Selects a component, showing selection handles and delete control.
   */
  selectComponent(componentId) {
    this.clearSelection();
    const component = this.state.components.get(componentId);
    if (!component) return;
    this.selectedComponentId = componentId;
    this.updateSelectionOverlay(component);
  }
  /**
   * Updates the selection overlay position/size for the given component.
   */
  updateSelectionOverlay(component) {
    this.selectionLayer?.destroyChildren();
    this.selectionRect = new Konva.Rect({
      x: component.position.x - 4,
      y: component.position.y - 4,
      width: component.size.width + 8,
      height: component.size.height + 8,
      stroke: SELECTION_STROKE_COLOR,
      strokeWidth: SELECTION_STROKE_WIDTH,
      dash: [4, 3],
      fill: "transparent",
      listening: false
    });
    this.selectionLayer.add(this.selectionRect);
    const deleteGroup = new Konva.Group({
      x: component.position.x + component.size.width + 4,
      y: component.position.y - 12
    });
    const deleteBg = new Konva.Circle({
      radius: 9,
      fill: "#d93025"
    });
    deleteGroup.add(deleteBg);
    const deleteText = new Konva.Text({
      text: "\xD7",
      fontSize: 14,
      fontFamily: LABEL_FONT_FAMILY,
      fill: "#ffffff",
      offsetX: 4,
      offsetY: 7
    });
    deleteGroup.add(deleteText);
    deleteGroup.on("click tap", () => {
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
  showConnectorDeleteControl(connectorId, lineNode) {
    this.selectionLayer?.destroyChildren();
    const points = lineNode.points();
    const midIdx = Math.floor(points.length / 2);
    const mx = points[midIdx - midIdx % 2] || points[0];
    const my = points[midIdx - midIdx % 2 + 1] || points[1];
    const deleteGroup = new Konva.Group({ x: mx, y: my - 14 });
    const deleteBg = new Konva.Circle({
      radius: 9,
      fill: "#d93025"
    });
    deleteGroup.add(deleteBg);
    const deleteText = new Konva.Text({
      text: "\xD7",
      fontSize: 14,
      fontFamily: LABEL_FONT_FAMILY,
      fill: "#ffffff",
      offsetX: 4,
      offsetY: 7
    });
    deleteGroup.add(deleteText);
    deleteGroup.on("click tap", () => {
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
  clearSelection() {
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
  clampToCanvasBounds(position, width, height) {
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
  getContainerLabel(type) {
    const labels = {
      vpc: "VPC",
      subnet: "Subnet",
      az: "Availability Zone",
      "resource-group": "Resource Group",
      region: "Region"
    };
    return labels[type] || type;
  }
}
export {
  CanvasController,
  resetCanvasIdCounters
};
