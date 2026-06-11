/**
 * Palette — Component palette UI for the Architecture Diagram Creator.
 *
 * Renders a categorised list of cloud service components from an IconManifest,
 * provides real-time search filtering, and enables drag-and-drop of components
 * onto the diagram canvas.
 *
 * The `filterServices` function is exported as a standalone pure function for
 * independent testing (including property-based tests).
 */

import type { IconManifest, IconCategory, ServiceIcon, Point } from './types.js';

/**
 * Represents the data transferred during a drag-and-drop operation
 * from the palette to the canvas.
 */
export interface PaletteDragData {
  serviceId: string;
  serviceName: string;
  iconPath: string;
  defaultWidth: number;
  defaultHeight: number;
}

/**
 * Callback signature for when a palette item is dropped onto the canvas.
 * Receives the service drag data and the drop position on the canvas.
 */
export type PaletteDropCallback = (data: PaletteDragData, position: Point) => void;

/**
 * Pure function: filters a list of ServiceIcon objects by a search term.
 * Returns exactly those services whose `name` contains the search string,
 * using case-insensitive comparison.
 *
 * @param services - The array of ServiceIcon objects to filter.
 * @param searchTerm - The search string to match against service names.
 * @returns A new array containing only the matching services.
 */
export function filterServices(services: ServiceIcon[], searchTerm: string): ServiceIcon[] {
  if (searchTerm === '') {
    return services;
  }
  const lowerSearch = searchTerm.toLowerCase();
  return services.filter((service) => service.name.toLowerCase().includes(lowerSearch));
}

/**
 * Palette class — manages the component palette UI panel.
 *
 * Renders categorised service lists with icons and names from an IconManifest,
 * provides a search input for real-time filtering, and implements HTML5 drag
 * initiation from palette items.
 */
export class Palette {
  private containerEl: HTMLElement;
  private manifest: IconManifest;
  private searchInput: HTMLInputElement | null = null;
  private listContainer: HTMLElement | null = null;
  private dropCallback: PaletteDropCallback | null = null;

  /**
   * Creates a new Palette instance.
   *
   * @param containerId - The DOM element ID where the palette will be rendered.
   * @param manifest - The icon manifest containing categories and services.
   */
  constructor(containerId: string, manifest: IconManifest) {
    const el = document.getElementById(containerId);
    if (!el) {
      throw new Error(`Palette container element not found: #${containerId}`);
    }
    this.containerEl = el;
    this.manifest = manifest;
    this.render();
  }

  /**
   * Registers a callback to be invoked when a palette item is dropped
   * onto the canvas. The CanvasController subscribes to this to handle
   * component creation.
   */
  set onDrop(callback: PaletteDropCallback | null) {
    this.dropCallback = callback;
  }

  get onDrop(): PaletteDropCallback | null {
    return this.dropCallback;
  }

  /**
   * Updates the manifest and re-renders the palette.
   * Used when the user switches cloud platform.
   */
  updateManifest(manifest: IconManifest): void {
    this.manifest = manifest;
    this.render();
  }

  /**
   * Returns the current search term entered in the search input.
   */
  getSearchTerm(): string {
    return this.searchInput?.value ?? '';
  }

  /**
   * Programmatically sets the search term and triggers filtering.
   */
  setSearchTerm(term: string): void {
    if (this.searchInput) {
      this.searchInput.value = term;
      this.applyFilter(term);
    }
  }

  /**
   * Renders the full palette UI into the container element.
   */
  private render(): void {
    this.containerEl.innerHTML = '';
    this.containerEl.classList.add('diagram-palette');

    // Search input
    const searchWrapper = document.createElement('div');
    searchWrapper.className = 'palette-search';

    this.searchInput = document.createElement('input');
    this.searchInput.type = 'text';
    this.searchInput.placeholder = 'Search components...';
    this.searchInput.className = 'palette-search-input';
    this.searchInput.setAttribute('aria-label', 'Search components');
    this.searchInput.addEventListener('input', () => {
      this.applyFilter(this.searchInput!.value);
    });

    searchWrapper.appendChild(this.searchInput);
    this.containerEl.appendChild(searchWrapper);

    // Categorised service list
    this.listContainer = document.createElement('div');
    this.listContainer.className = 'palette-categories';
    this.containerEl.appendChild(this.listContainer);

    this.renderCategories(this.manifest.categories);
  }

  /**
   * Renders the category sections with their service items.
   */
  private renderCategories(categories: IconCategory[]): void {
    if (!this.listContainer) return;
    this.listContainer.innerHTML = '';

    for (const category of categories) {
      const section = this.createCategorySection(category);
      if (section) {
        this.listContainer.appendChild(section);
      }
    }
  }

  /**
   * Creates a DOM section for a single category with its filtered services.
   * Returns null if the category has no services to display.
   */
  private createCategorySection(category: IconCategory): HTMLElement | null {
    const searchTerm = this.getSearchTerm();
    const visibleServices = filterServices(category.services, searchTerm);

    if (visibleServices.length === 0) {
      return null;
    }

    const section = document.createElement('div');
    section.className = 'palette-category';
    section.dataset.categoryId = category.id;

    const heading = document.createElement('h4');
    heading.className = 'palette-category-heading';
    heading.textContent = category.name;
    section.appendChild(heading);

    const list = document.createElement('ul');
    list.className = 'palette-service-list';
    list.setAttribute('role', 'list');

    for (const service of visibleServices) {
      const item = this.createServiceItem(service);
      list.appendChild(item);
    }

    section.appendChild(list);
    return section;
  }

  /**
   * Creates a draggable list item for a single service.
   */
  private createServiceItem(service: ServiceIcon): HTMLElement {
    const item = document.createElement('li');
    item.className = 'palette-service-item';
    item.setAttribute('role', 'listitem');
    item.draggable = true;
    item.dataset.serviceId = service.id;
    item.dataset.serviceName = service.name;
    item.dataset.iconPath = service.iconPath;
    item.dataset.defaultWidth = String(service.defaultWidth);
    item.dataset.defaultHeight = String(service.defaultHeight);

    // Icon image
    const icon = document.createElement('img');
    icon.className = 'palette-service-icon';
    icon.src = `/${service.iconPath}`;
    icon.alt = `${service.name} icon`;
    icon.width = 24;
    icon.height = 24;
    icon.loading = 'lazy';
    item.appendChild(icon);

    // Service name label
    const label = document.createElement('span');
    label.className = 'palette-service-name';
    label.textContent = service.name;
    item.appendChild(label);

    // HTML5 Drag API - dragstart
    item.addEventListener('dragstart', (event: DragEvent) => {
      this.handleDragStart(event, service);
    });

    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
    });

    return item;
  }

  /**
   * Handles the dragstart event for a palette item.
   * Sets the drag data and visual feedback.
   */
  private handleDragStart(event: DragEvent, service: ServiceIcon): void {
    const target = event.currentTarget as HTMLElement;
    target.classList.add('dragging');

    const dragData: PaletteDragData = {
      serviceId: service.id,
      serviceName: service.name,
      iconPath: service.iconPath,
      defaultWidth: service.defaultWidth,
      defaultHeight: service.defaultHeight,
    };

    if (event.dataTransfer) {
      event.dataTransfer.setData('application/json', JSON.stringify(dragData));
      event.dataTransfer.setData('text/plain', service.name);
      event.dataTransfer.effectAllowed = 'copy';
    }
  }

  /**
   * Applies the search filter and re-renders categories.
   */
  private applyFilter(searchTerm: string): void {
    this.renderCategories(this.manifest.categories);
  }

  /**
   * Wires the palette to a canvas element for drop handling.
   * Listens for drop events on the target canvas container and invokes
   * the onDrop callback with the drag data and position.
   *
   * @param canvasContainerId - The DOM element ID of the canvas container to wire drops to.
   */
  wireDropTarget(canvasContainerId: string): void {
    const canvasEl = document.getElementById(canvasContainerId);
    if (!canvasEl) {
      return;
    }

    canvasEl.addEventListener('dragover', (event: DragEvent) => {
      event.preventDefault();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'copy';
      }
    });

    canvasEl.addEventListener('drop', (event: DragEvent) => {
      event.preventDefault();

      if (!event.dataTransfer || !this.dropCallback) {
        return;
      }

      const jsonData = event.dataTransfer.getData('application/json');
      if (!jsonData) {
        return;
      }

      try {
        const dragData: PaletteDragData = JSON.parse(jsonData);
        const rect = canvasEl.getBoundingClientRect();
        const position: Point = {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        };

        this.dropCallback(dragData, position);
      } catch {
        // Invalid JSON or missing data — silently ignore
      }
    });
  }
}
