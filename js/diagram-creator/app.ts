/**
 * App — Main application controller for the Architecture Diagram Creator.
 *
 * Wires all UI interactions together:
 * - Platform selection with confirmation dialog on platform change
 * - Template gallery rendering and template instantiation
 * - Component palette population from icon manifests
 * - Palette drag-and-drop onto the canvas
 * - Container highlight on drag-over
 * - Connector creation mode (Connect button + click-to-connect)
 * - Export buttons (PNG and SVG)
 * - Delete key handling for selected components/connectors
 * - Empty state visibility management
 *
 * This module is the entry point imported by diagrams-creator.html and
 * orchestrates the coordination between PlatformService, TemplateEngine,
 * CanvasController, ContainerManager, and ExportEngine.
 */

import { PlatformService } from './platform-service.js';
import { TemplateEngine } from './template-engine.js';
import { CanvasController } from './canvas-controller.js';
import { ContainerManager } from './container-manager.js';
import { ExportEngine } from './export-engine.js';
import type { PaletteDragData } from './palette.js';
import type { ArchitectureTemplate, DiagramState, IconManifest, Point } from './types.js';

/** CSS class applied to the connect mode toggle when active. */
const CONNECT_MODE_ACTIVE_CLASS = 'connect-btn--active';

/**
 * Initialises and wires all diagram creator interactions.
 *
 * Called automatically when this module is loaded via script tag.
 */
function initApp(): void {
  // --- Core service instances ---
  const platformService = new PlatformService();
  const templateEngine = new TemplateEngine();

  // Create initial diagram state
  const initialState: DiagramState = {
    id: 'diagram-' + Date.now(),
    platformId: 'aws',
    templateId: null,
    components: new Map(),
    containers: new Map(),
    connectors: new Map(),
  };

  const canvasController = new CanvasController(initialState);

  // --- Initialise canvas ---
  canvasController.initialise('diagram-canvas');

  // --- DOM element references ---
  const canvasEl = document.getElementById('diagram-canvas');
  const exportPngBtn = document.getElementById('export-png-btn') as HTMLButtonElement | null;
  const exportSvgBtn = document.getElementById('export-svg-btn') as HTMLButtonElement | null;
  const emptyState = document.getElementById('canvas-empty-state');
  const platformCards = document.querySelectorAll<HTMLButtonElement>('.platform-card');
  const templateGalleryEl = document.getElementById('template-gallery') as HTMLElement | null;
  const paletteCategoriesEl = document.getElementById('palette-categories') as HTMLElement | null;
  const paletteSearchEl = document.getElementById('palette-search') as HTMLInputElement | null;

  // --- Track whether the canvas has content ---
  let hasComponents = false;

  /** Currently selected platform ID. */
  let currentPlatformId: string | null = null;

  /** Currently selected template ID. */
  let currentTemplateId: string | null = null;

  // ─── PLATFORM SELECTION ───────────────────────────────────────────

  /**
   * Handles a platform card click. If a diagram is already loaded,
   * shows a confirmation dialog warning that the current diagram will be reset.
   */
  async function handlePlatformSelect(platformId: string): Promise<void> {
    // If same platform already selected, do nothing
    if (platformId === currentPlatformId) {
      return;
    }

    // If a diagram is already loaded, warn and confirm
    if (hasComponents) {
      const confirmed = confirm(
        'Changing platform will reset your current diagram. All unsaved work will be lost.\n\nDo you want to continue?'
      );
      if (!confirmed) {
        return;
      }
      // Reset canvas
      canvasController.clearCanvas();
      hasComponents = false;
      currentTemplateId = null;
    }

    // Select the platform
    try {
      await platformService.selectPlatform(platformId);
    } catch (error) {
      console.error('Failed to select platform:', error);
      return;
    }

    currentPlatformId = platformId;

    // Update platform cards' active state
    updatePlatformCardsUI(platformId);

    // Populate template gallery
    await populateTemplateGallery(platformId);

    // Populate the component palette
    await populateComponentPalette(platformId);

    // Hide empty state (platform is selected, user can now interact)
    hideEmptyState();
  }

  /**
   * Updates the platform cards to reflect the active selection.
   * Adds/removes --active class and updates aria-checked attribute.
   */
  function updatePlatformCardsUI(activePlatformId: string): void {
    platformCards.forEach((card) => {
      const cardPlatformId = card.dataset.platform;
      const isActive = cardPlatformId === activePlatformId;

      card.classList.toggle('platform-card--active', isActive);
      card.setAttribute('aria-checked', String(isActive));
    });
  }

  /**
   * Binds click events to platform cards.
   */
  function bindPlatformEvents(): void {
    platformCards.forEach((card) => {
      card.addEventListener('click', () => {
        const platformId = card.dataset.platform;
        if (platformId) {
          handlePlatformSelect(platformId);
        }
      });

      // Keyboard support for platform cards
      card.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const platformId = card.dataset.platform;
          if (platformId) {
            handlePlatformSelect(platformId);
          }
        }
      });
    });
  }

  // Wire platform events immediately
  bindPlatformEvents();

  // ─── TEMPLATE GALLERY ─────────────────────────────────────────────

  /**
   * Populates the template gallery with templates for the selected platform.
   */
  async function populateTemplateGallery(platformId: string): Promise<void> {
    if (!templateGalleryEl) return;
    templateGalleryEl.innerHTML = '';

    let templates: ArchitectureTemplate[];
    try {
      templates = await templateEngine.getTemplatesForPlatform(platformId);
    } catch (error) {
      console.error('Failed to load templates:', error);
      templateGalleryEl.innerHTML =
        '<p style="font-size: var(--font-size-sm); color: var(--color-text-body); opacity: 0.7;">Unable to load templates. Please try refreshing.</p>';
      return;
    }

    if (templates.length === 0) {
      templateGalleryEl.innerHTML =
        '<p style="font-size: var(--font-size-sm); color: var(--color-text-body); opacity: 0.7;">No templates available for this platform.</p>';
      return;
    }

    for (const template of templates) {
      const card = createTemplateCard(template);
      templateGalleryEl.appendChild(card);
    }
  }

  /**
   * Creates a template card DOM element for the gallery.
   */
  function createTemplateCard(template: ArchitectureTemplate): HTMLElement {
    const card = document.createElement('div');
    card.className = 'template-card';
    card.setAttribute('role', 'listitem');
    card.dataset.templateId = template.id;
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `${template.name}: ${template.description}`);

    // Thumbnail
    const thumb = document.createElement('div');
    thumb.className = 'template-card__thumb';
    if (template.thumbnailUrl) {
      const img = document.createElement('img');
      img.src = template.thumbnailUrl;
      img.alt = '';
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      img.style.borderRadius = '4px';
      thumb.appendChild(img);
    } else {
      thumb.textContent = '📐';
    }
    card.appendChild(thumb);

    // Info section
    const info = document.createElement('div');
    info.className = 'template-card__info';

    const name = document.createElement('div');
    name.className = 'template-card__name';
    name.textContent = template.name;
    info.appendChild(name);

    const desc = document.createElement('div');
    desc.className = 'template-card__desc';
    desc.textContent = template.description;
    info.appendChild(desc);

    card.appendChild(info);

    // Click handler
    card.addEventListener('click', () => handleTemplateSelect(template.id));
    card.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleTemplateSelect(template.id);
      }
    });

    return card;
  }

  /**
   * Handles a template card click. Instantiates the template and loads
   * the resulting DiagramState onto the canvas via CanvasController.loadDiagram().
   */
  async function handleTemplateSelect(templateId: string): Promise<void> {
    try {
      const state = await templateEngine.instantiateTemplate(templateId);
      canvasController.loadDiagram(state);
      hasComponents = true;
      currentTemplateId = templateId;

      // Update template cards' active state
      updateTemplateCardsUI(templateId);

      // Enable export buttons
      updateExportButtonState();

      // Hide empty state
      hideEmptyState();
    } catch (error) {
      console.error('Failed to instantiate template:', error);
      alert('Template could not be loaded. Please try another.');
    }
  }

  /**
   * Updates template cards to reflect the active selection.
   */
  function updateTemplateCardsUI(activeTemplateId: string): void {
    if (!templateGalleryEl) return;
    const allTemplateCards = templateGalleryEl.querySelectorAll<HTMLElement>('.template-card');
    allTemplateCards.forEach((card) => {
      const cardTemplateId = card.dataset.templateId;
      const isActive = cardTemplateId === activeTemplateId;
      card.classList.toggle('template-card--active', isActive);
    });
  }

  // ─── COMPONENT PALETTE ────────────────────────────────────────────

  /**
   * Populates the component palette from the loaded icon manifest.
   */
  async function populateComponentPalette(platformId: string): Promise<void> {
    if (!paletteCategoriesEl) return;

    let manifest: IconManifest;
    try {
      manifest = await platformService.getIconManifest(platformId);
    } catch (error) {
      console.error('Failed to load icon manifest:', error);
      paletteCategoriesEl.innerHTML =
        '<p style="font-size: var(--font-size-sm); color: var(--color-text-body); opacity: 0.7;">Unable to load components. Please refresh the page.</p>';
      return;
    }

    // Render categories
    renderPaletteCategories(manifest);

    // Wire search filtering
    wirePaletteSearch(manifest);
  }

  /**
   * Renders the categorised service list into the palette-categories container.
   */
  function renderPaletteCategories(manifest: IconManifest, searchTerm: string = ''): void {
    if (!paletteCategoriesEl) return;
    paletteCategoriesEl.innerHTML = '';

    const lowerSearch = searchTerm.toLowerCase();

    for (const category of manifest.categories) {
      const filteredServices = lowerSearch
        ? category.services.filter((s) => s.name.toLowerCase().includes(lowerSearch))
        : category.services;

      if (filteredServices.length === 0) continue;

      const section = document.createElement('div');
      section.className = 'palette-category';

      const title = document.createElement('h4');
      title.className = 'palette-category__title';
      title.textContent = category.name;
      section.appendChild(title);

      const items = document.createElement('div');
      items.className = 'palette-items';

      for (const service of filteredServices) {
        const item = document.createElement('div');
        item.className = 'palette-item';
        item.draggable = true;
        item.dataset.serviceId = service.id;
        item.dataset.serviceName = service.name;
        item.dataset.iconPath = service.iconPath;
        item.dataset.defaultWidth = String(service.defaultWidth);
        item.dataset.defaultHeight = String(service.defaultHeight);

        const icon = document.createElement('img');
        icon.className = 'palette-item__icon';
        icon.src = `/${service.iconPath}`;
        icon.alt = '';
        icon.setAttribute('aria-hidden', 'true');
        item.appendChild(icon);

        const nameSpan = document.createElement('span');
        nameSpan.className = 'palette-item__name';
        nameSpan.textContent = service.name;
        item.appendChild(nameSpan);

        // Wire dragstart for each palette item
        item.addEventListener('dragstart', (e: DragEvent) => {
          if (!e.dataTransfer) return;

          const dragData: PaletteDragData = {
            serviceId: service.id,
            serviceName: service.name,
            iconPath: service.iconPath,
            defaultWidth: service.defaultWidth,
            defaultHeight: service.defaultHeight,
          };

          e.dataTransfer.setData('application/json', JSON.stringify(dragData));
          e.dataTransfer.setData('text/plain', service.name);
          e.dataTransfer.effectAllowed = 'copy';
        });

        items.appendChild(item);
      }

      section.appendChild(items);
      paletteCategoriesEl.appendChild(section);
    }

    if (paletteCategoriesEl.children.length === 0) {
      paletteCategoriesEl.innerHTML =
        '<p style="font-size: var(--font-size-sm); color: var(--color-text-body); opacity: 0.7;">No components match your search.</p>';
    }
  }

  /**
   * Wires the palette search input to filter the displayed components.
   */
  function wirePaletteSearch(manifest: IconManifest): void {
    if (!paletteSearchEl) return;

    // Remove old listeners by replacing the node
    const newSearchEl = paletteSearchEl.cloneNode(true) as HTMLInputElement;
    paletteSearchEl.parentNode?.replaceChild(newSearchEl, paletteSearchEl);

    newSearchEl.addEventListener('input', () => {
      const term = newSearchEl.value.trim();
      renderPaletteCategories(manifest, term);
    });
  }

  // ─── 1. PALETTE DRAG-AND-DROP ─────────────────────────────────────

  if (canvasEl) {
    // Prevent default to allow drop
    canvasEl.addEventListener('dragover', (event: DragEvent) => {
      event.preventDefault();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'copy';
      }

      // Container highlight on drag-over
      highlightContainerAtPoint(event, canvasEl, canvasController);
    });

    // Clear highlight when dragging leaves the canvas
    canvasEl.addEventListener('dragleave', () => {
      clearContainerHighlights();
    });

    // Handle drop — create component at drop position
    canvasEl.addEventListener('drop', (event: DragEvent) => {
      event.preventDefault();
      clearContainerHighlights();

      if (!event.dataTransfer) return;

      const jsonData = event.dataTransfer.getData('application/json');
      if (!jsonData) return;

      try {
        const dragData: PaletteDragData = JSON.parse(jsonData);
        const rect = canvasEl.getBoundingClientRect();
        const position: Point = {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        };

        // Detect if drop is over a container
        const containerManager = new ContainerManager(canvasController.getState());
        const containerId = containerManager.getContainerAtPoint(position) ?? undefined;

        // Check if nesting depth would be exceeded
        if (containerId && !containerManager.canNestIn(containerId)) {
          showNestingDepthWarning(event.clientX, event.clientY);
          // Still place the component, but without a container
          canvasController.addComponentWithInfo(
            {
              serviceId: dragData.serviceId,
              serviceName: dragData.serviceName,
              iconPath: dragData.iconPath,
              defaultWidth: dragData.defaultWidth,
              defaultHeight: dragData.defaultHeight,
            },
            position,
            undefined
          );
        } else {
          // Add component using resolved service info
          canvasController.addComponentWithInfo(
            {
              serviceId: dragData.serviceId,
              serviceName: dragData.serviceName,
              iconPath: dragData.iconPath,
              defaultWidth: dragData.defaultWidth,
              defaultHeight: dragData.defaultHeight,
            },
            position,
            containerId
          );
        }

        // Update UI state
        onComponentAdded();
      } catch {
        // Invalid JSON — silently ignore
      }
    });
  }

  // ─── 2. CONTAINER HIGHLIGHT ON DRAG-OVER ──────────────────────────

  /** Currently highlighted container element ID. */
  let highlightedContainerId: string | null = null;

  function highlightContainerAtPoint(
    event: DragEvent,
    canvas: HTMLElement,
    controller: CanvasController
  ): void {
    const rect = canvas.getBoundingClientRect();
    const point: Point = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };

    const containerManager = new ContainerManager(controller.getState());
    const containerId = containerManager.getContainerAtPoint(point);

    if (containerId !== highlightedContainerId) {
      clearContainerHighlights();
      highlightedContainerId = containerId;

      if (containerId) {
        // Apply visual highlight via Konva — increase the container node opacity/stroke
        const stage = controller.getStage();
        if (stage) {
          const containerNode = stage.findOne(`#${containerId}`);
          if (containerNode) {
            const rectShape = containerNode.findOne('Rect');
            if (rectShape) {
              rectShape.strokeWidth(3);
              rectShape.opacity(0.9);
              stage.batchDraw();
            }
          }
        }
      }
    }
  }

  function clearContainerHighlights(): void {
    if (highlightedContainerId) {
      const stage = canvasController.getStage();
      if (stage) {
        const containerNode = stage.findOne(`#${highlightedContainerId}`);
        if (containerNode) {
          const rectShape = containerNode.findOne('Rect');
          if (rectShape) {
            rectShape.strokeWidth(1.5);
            rectShape.opacity(1);
            stage.batchDraw();
          }
        }
      }
      highlightedContainerId = null;
    }
  }

  // ─── 3. CONNECTOR CREATION MODE ──────────────────────────────────

  let connectModeActive = false;

  // Create a Connect mode toggle button if it doesn't exist
  const connectBtn = createConnectButton();

  if (connectBtn) {
    connectBtn.addEventListener('click', () => {
      connectModeActive = !connectModeActive;
      connectBtn.classList.toggle(CONNECT_MODE_ACTIVE_CLASS, connectModeActive);
      connectBtn.setAttribute('aria-pressed', String(connectModeActive));

      if (!connectModeActive) {
        canvasController.cancelConnection();
      }
    });
  }

  // Listen for component clicks while in connect mode.
  // The CanvasController already handles this internally via its click handler:
  // - First click in connecting mode: startConnection(sourceId) is called
  //   by the component's click handler when isConnecting is true
  // - Second click: completeConnection(targetId) is called
  //
  // We wire up the connect mode entry. When the user clicks the Connect button,
  // we need to tell the CanvasController about the first click.
  // The CanvasController already checks `this.isConnecting` in its click handler.
  // We need a way to set the CanvasController into "awaiting first click" mode.

  // Use a stage-level click listener to handle connect mode initiation
  const stage = canvasController.getStage();
  if (stage) {
    stage.on('click.connectmode', (e: any) => {
      if (!connectModeActive) return;

      // Find if the click target is a component group
      const target = e.target;
      if (!target) return;

      // Walk up to find the component group
      let group = target;
      while (group && !group.id()) {
        group = group.parent;
      }

      const componentId = group?.id();
      if (!componentId) return;

      // Check if this is a valid component (exists in state)
      const state = canvasController.getState();
      if (!state.components.has(componentId)) return;

      if (canvasController.isInConnectionMode()) {
        // Second click — complete connection
        canvasController.completeConnection(componentId);
        // Exit connect mode after completing a connection
        connectModeActive = false;
        connectBtn?.classList.remove(CONNECT_MODE_ACTIVE_CLASS);
        connectBtn?.setAttribute('aria-pressed', 'false');
      } else {
        // First click — start connection from this component
        canvasController.startConnection(componentId);
      }
    });
  }

  // Escape key to cancel connection mode
  document.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      if (canvasController.isInConnectionMode() || connectModeActive) {
        canvasController.cancelConnection();
        connectModeActive = false;
        connectBtn?.classList.remove(CONNECT_MODE_ACTIVE_CLASS);
        connectBtn?.setAttribute('aria-pressed', 'false');
      }
    }
  });

  // ─── 4. EXPORT CONTROLS ───────────────────────────────────────────

  if (exportPngBtn) {
    exportPngBtn.addEventListener('click', async () => {
      try {
        const exportEngine = new ExportEngine(
          canvasController.getStage(),
          canvasController.getState()
        );

        if (!exportEngine.canExport()) {
          alert('Add components to the canvas before exporting.');
          return;
        }

        const blob = await exportEngine.exportAsPng({
          pixelRatio: 2,
          backgroundColor: '#ffffff',
        });

        exportEngine.triggerDownload(blob, 'architecture-diagram.png');
      } catch (error: any) {
        alert(error.message || 'Export failed. Try reducing diagram complexity.');
      }
    });
  }

  if (exportSvgBtn) {
    exportSvgBtn.addEventListener('click', () => {
      try {
        const exportEngine = new ExportEngine(
          canvasController.getStage(),
          canvasController.getState()
        );

        if (!exportEngine.canExport()) {
          alert('Add components to the canvas before exporting.');
          return;
        }

        const svg = exportEngine.exportAsSvg();
        exportEngine.triggerDownload(svg, 'architecture-diagram.svg');
      } catch (error: any) {
        alert(error.message || 'SVG export failed. Please try again.');
      }
    });
  }

  // ─── 5. DELETE CONTROLS (KEYBOARD) ────────────────────────────────

  document.addEventListener('keydown', (event: KeyboardEvent) => {
    // Only handle Delete/Backspace when not typing in an input field
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }

    if (event.key === 'Delete' || event.key === 'Backspace') {
      const selectedId = canvasController.getSelectedComponentId();
      if (selectedId) {
        event.preventDefault();
        canvasController.removeComponent(selectedId);
        updateExportButtonState();
      }
    }
  });

  // ─── HELPER FUNCTIONS ─────────────────────────────────────────────

  /**
   * Called whenever a component is added to the canvas.
   * Enables export buttons and hides the empty state message.
   */
  function onComponentAdded(): void {
    if (!hasComponents) {
      hasComponents = true;
      updateExportButtonState();
      hideEmptyState();
    }
  }

  /**
   * Updates the enabled/disabled state of export buttons based on canvas content.
   */
  function updateExportButtonState(): void {
    const state = canvasController.getState();
    const canExport = state.components.size > 0 || state.containers.size > 0;

    if (exportPngBtn) {
      exportPngBtn.disabled = !canExport;
      exportPngBtn.title = canExport ? 'Export as PNG' : 'Add components before exporting';
    }
    if (exportSvgBtn) {
      exportSvgBtn.disabled = !canExport;
      exportSvgBtn.title = canExport ? 'Export as SVG' : 'Add components before exporting';
    }
  }

  /**
   * Hides the canvas empty state overlay.
   */
  function hideEmptyState(): void {
    if (emptyState) {
      emptyState.style.display = 'none';
    }
  }

  /**
   * Shows a brief tooltip warning that maximum nesting depth has been reached.
   * The tooltip appears near the cursor and fades out after 2 seconds.
   */
  function showNestingDepthWarning(clientX: number, clientY: number): void {
    const tooltip = document.createElement('div');
    tooltip.textContent = 'Maximum nesting depth reached.';
    tooltip.style.position = 'fixed';
    tooltip.style.left = `${clientX + 12}px`;
    tooltip.style.top = `${clientY - 30}px`;
    tooltip.style.padding = '6px 12px';
    tooltip.style.backgroundColor = '#333';
    tooltip.style.color = '#fff';
    tooltip.style.borderRadius = '4px';
    tooltip.style.fontSize = '12px';
    tooltip.style.fontFamily = 'Inter, Arial, sans-serif';
    tooltip.style.zIndex = '9999';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.transition = 'opacity 0.3s ease';
    tooltip.style.opacity = '1';
    tooltip.setAttribute('role', 'alert');
    tooltip.setAttribute('aria-live', 'polite');

    document.body.appendChild(tooltip);

    setTimeout(() => {
      tooltip.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(tooltip);
      }, 300);
    }, 2000);
  }

  /**
   * Creates and inserts the Connect mode toggle button into the export controls panel
   * (or a dedicated toolbar area).
   */
  function createConnectButton(): HTMLButtonElement | null {
    const exportPanel = document.getElementById('export-controls-panel');
    if (!exportPanel) return null;

    // Insert a toolbar row before the export controls
    const toolbar = document.createElement('div');
    toolbar.className = 'dc-toolbar';
    toolbar.style.display = 'flex';
    toolbar.style.gap = '8px';
    toolbar.style.marginBottom = '12px';

    const btn = document.createElement('button');
    btn.id = 'connect-mode-btn';
    btn.className = 'export-btn';
    btn.type = 'button';
    btn.setAttribute('aria-pressed', 'false');
    btn.setAttribute('aria-label', 'Toggle connector creation mode');
    btn.title = 'Draw connections between components';
    btn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="3" cy="3" r="2" stroke="currentColor" stroke-width="1.5"/>
        <circle cx="13" cy="13" r="2" stroke="currentColor" stroke-width="1.5"/>
        <path d="M5 5l6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      Connect
    `;

    toolbar.appendChild(btn);

    // Insert toolbar before the export controls div
    const exportControls = exportPanel.querySelector('.export-controls');
    if (exportControls) {
      exportPanel.insertBefore(toolbar, exportControls);
    } else {
      exportPanel.appendChild(toolbar);
    }

    return btn;
  }
}


// ─── AUTO-INITIALIZE ON MODULE LOAD ─────────────────────────────────
initApp();
