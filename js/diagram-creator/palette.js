var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
function filterServices(services, searchTerm) {
  if (searchTerm === "") {
    return services;
  }
  const lowerSearch = searchTerm.toLowerCase();
  return services.filter((service) => service.name.toLowerCase().includes(lowerSearch));
}
class Palette {
  /**
   * Creates a new Palette instance.
   *
   * @param containerId - The DOM element ID where the palette will be rendered.
   * @param manifest - The icon manifest containing categories and services.
   */
  constructor(containerId, manifest) {
    __publicField(this, "containerEl");
    __publicField(this, "manifest");
    __publicField(this, "searchInput", null);
    __publicField(this, "listContainer", null);
    __publicField(this, "dropCallback", null);
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
  set onDrop(callback) {
    this.dropCallback = callback;
  }
  get onDrop() {
    return this.dropCallback;
  }
  /**
   * Updates the manifest and re-renders the palette.
   * Used when the user switches cloud platform.
   */
  updateManifest(manifest) {
    this.manifest = manifest;
    this.render();
  }
  /**
   * Returns the current search term entered in the search input.
   */
  getSearchTerm() {
    return this.searchInput?.value ?? "";
  }
  /**
   * Programmatically sets the search term and triggers filtering.
   */
  setSearchTerm(term) {
    if (this.searchInput) {
      this.searchInput.value = term;
      this.applyFilter(term);
    }
  }
  /**
   * Renders the full palette UI into the container element.
   */
  render() {
    this.containerEl.innerHTML = "";
    this.containerEl.classList.add("diagram-palette");
    const searchWrapper = document.createElement("div");
    searchWrapper.className = "palette-search";
    this.searchInput = document.createElement("input");
    this.searchInput.type = "text";
    this.searchInput.placeholder = "Search components...";
    this.searchInput.className = "palette-search-input";
    this.searchInput.setAttribute("aria-label", "Search components");
    this.searchInput.addEventListener("input", () => {
      this.applyFilter(this.searchInput.value);
    });
    searchWrapper.appendChild(this.searchInput);
    this.containerEl.appendChild(searchWrapper);
    this.listContainer = document.createElement("div");
    this.listContainer.className = "palette-categories";
    this.containerEl.appendChild(this.listContainer);
    this.renderCategories(this.manifest.categories);
  }
  /**
   * Renders the category sections with their service items.
   */
  renderCategories(categories) {
    if (!this.listContainer) return;
    this.listContainer.innerHTML = "";
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
  createCategorySection(category) {
    const searchTerm = this.getSearchTerm();
    const visibleServices = filterServices(category.services, searchTerm);
    if (visibleServices.length === 0) {
      return null;
    }
    const section = document.createElement("div");
    section.className = "palette-category";
    section.dataset.categoryId = category.id;
    const heading = document.createElement("h4");
    heading.className = "palette-category-heading";
    heading.textContent = category.name;
    section.appendChild(heading);
    const list = document.createElement("ul");
    list.className = "palette-service-list";
    list.setAttribute("role", "list");
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
  createServiceItem(service) {
    const item = document.createElement("li");
    item.className = "palette-service-item";
    item.setAttribute("role", "listitem");
    item.draggable = true;
    item.dataset.serviceId = service.id;
    item.dataset.serviceName = service.name;
    item.dataset.iconPath = service.iconPath;
    item.dataset.defaultWidth = String(service.defaultWidth);
    item.dataset.defaultHeight = String(service.defaultHeight);
    const icon = document.createElement("img");
    icon.className = "palette-service-icon";
    icon.src = `/${service.iconPath}`;
    icon.alt = `${service.name} icon`;
    icon.width = 24;
    icon.height = 24;
    icon.loading = "lazy";
    item.appendChild(icon);
    const label = document.createElement("span");
    label.className = "palette-service-name";
    label.textContent = service.name;
    item.appendChild(label);
    item.addEventListener("dragstart", (event) => {
      this.handleDragStart(event, service);
    });
    item.addEventListener("dragend", () => {
      item.classList.remove("dragging");
    });
    return item;
  }
  /**
   * Handles the dragstart event for a palette item.
   * Sets the drag data and visual feedback.
   */
  handleDragStart(event, service) {
    const target = event.currentTarget;
    target.classList.add("dragging");
    const dragData = {
      serviceId: service.id,
      serviceName: service.name,
      iconPath: service.iconPath,
      defaultWidth: service.defaultWidth,
      defaultHeight: service.defaultHeight
    };
    if (event.dataTransfer) {
      event.dataTransfer.setData("application/json", JSON.stringify(dragData));
      event.dataTransfer.setData("text/plain", service.name);
      event.dataTransfer.effectAllowed = "copy";
    }
  }
  /**
   * Applies the search filter and re-renders categories.
   */
  applyFilter(searchTerm) {
    this.renderCategories(this.manifest.categories);
  }
  /**
   * Wires the palette to a canvas element for drop handling.
   * Listens for drop events on the target canvas container and invokes
   * the onDrop callback with the drag data and position.
   *
   * @param canvasContainerId - The DOM element ID of the canvas container to wire drops to.
   */
  wireDropTarget(canvasContainerId) {
    const canvasEl = document.getElementById(canvasContainerId);
    if (!canvasEl) {
      return;
    }
    canvasEl.addEventListener("dragover", (event) => {
      event.preventDefault();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "copy";
      }
    });
    canvasEl.addEventListener("drop", (event) => {
      event.preventDefault();
      if (!event.dataTransfer || !this.dropCallback) {
        return;
      }
      const jsonData = event.dataTransfer.getData("application/json");
      if (!jsonData) {
        return;
      }
      try {
        const dragData = JSON.parse(jsonData);
        const rect = canvasEl.getBoundingClientRect();
        const position = {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top
        };
        this.dropCallback(dragData, position);
      } catch {
      }
    });
  }
}
export {
  Palette,
  filterServices
};
