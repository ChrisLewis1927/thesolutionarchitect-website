import { PlatformService } from "./platform-service.js";
import { TemplateEngine } from "./template-engine.js";
import { CanvasController } from "./canvas-controller.js";
import { ContainerManager } from "./container-manager.js";
import { ExportEngine } from "./export-engine.js";
const CONNECT_MODE_ACTIVE_CLASS = "connect-btn--active";
function initApp() {
  const platformService = new PlatformService();
  const templateEngine = new TemplateEngine();
  const initialState = {
    id: "diagram-" + Date.now(),
    platformId: "aws",
    templateId: null,
    components: /* @__PURE__ */ new Map(),
    containers: /* @__PURE__ */ new Map(),
    connectors: /* @__PURE__ */ new Map()
  };
  const canvasController = new CanvasController(initialState);
  canvasController.initialise("diagram-canvas");
  const canvasEl = document.getElementById("diagram-canvas");
  const exportPngBtn = document.getElementById("export-png-btn");
  const exportSvgBtn = document.getElementById("export-svg-btn");
  const emptyState = document.getElementById("canvas-empty-state");
  const platformCards = document.querySelectorAll(".platform-card");
  const templateGalleryEl = document.getElementById("template-gallery");
  const paletteCategoriesEl = document.getElementById("palette-categories");
  const paletteSearchEl = document.getElementById("palette-search");
  let hasComponents = false;
  let currentPlatformId = null;
  let currentTemplateId = null;
  async function handlePlatformSelect(platformId) {
    if (platformId === currentPlatformId) {
      return;
    }
    if (hasComponents) {
      const confirmed = confirm(
        "Changing platform will reset your current diagram. All unsaved work will be lost.\n\nDo you want to continue?"
      );
      if (!confirmed) {
        return;
      }
      canvasController.clearCanvas();
      hasComponents = false;
      currentTemplateId = null;
    }
    try {
      await platformService.selectPlatform(platformId);
    } catch (error) {
      console.error("Failed to select platform:", error);
      return;
    }
    currentPlatformId = platformId;
    updatePlatformCardsUI(platformId);
    await populateTemplateGallery(platformId);
    await populateComponentPalette(platformId);
    hideEmptyState();
  }
  function updatePlatformCardsUI(activePlatformId) {
    platformCards.forEach((card) => {
      const cardPlatformId = card.dataset.platform;
      const isActive = cardPlatformId === activePlatformId;
      card.classList.toggle("platform-card--active", isActive);
      card.setAttribute("aria-checked", String(isActive));
    });
  }
  function bindPlatformEvents() {
    platformCards.forEach((card) => {
      card.addEventListener("click", () => {
        const platformId = card.dataset.platform;
        if (platformId) {
          handlePlatformSelect(platformId);
        }
      });
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          const platformId = card.dataset.platform;
          if (platformId) {
            handlePlatformSelect(platformId);
          }
        }
      });
    });
  }
  bindPlatformEvents();
  async function populateTemplateGallery(platformId) {
    if (!templateGalleryEl) return;
    templateGalleryEl.innerHTML = "";
    let templates;
    try {
      templates = await templateEngine.getTemplatesForPlatform(platformId);
    } catch (error) {
      console.error("Failed to load templates:", error);
      templateGalleryEl.innerHTML = '<p style="font-size: var(--font-size-sm); color: var(--color-text-body); opacity: 0.7;">Unable to load templates. Please try refreshing.</p>';
      return;
    }
    if (templates.length === 0) {
      templateGalleryEl.innerHTML = '<p style="font-size: var(--font-size-sm); color: var(--color-text-body); opacity: 0.7;">No templates available for this platform.</p>';
      return;
    }
    for (const template of templates) {
      const card = createTemplateCard(template);
      templateGalleryEl.appendChild(card);
    }
  }
  function createTemplateCard(template) {
    const card = document.createElement("div");
    card.className = "template-card";
    card.setAttribute("role", "listitem");
    card.dataset.templateId = template.id;
    card.setAttribute("tabindex", "0");
    card.setAttribute("aria-label", `${template.name}: ${template.description}`);
    const thumb = document.createElement("div");
    thumb.className = "template-card__thumb";
    if (template.thumbnailUrl) {
      const img = document.createElement("img");
      img.src = template.thumbnailUrl;
      img.alt = "";
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "cover";
      img.style.borderRadius = "4px";
      thumb.appendChild(img);
    } else {
      thumb.textContent = "\u{1F4D0}";
    }
    card.appendChild(thumb);
    const info = document.createElement("div");
    info.className = "template-card__info";
    const name = document.createElement("div");
    name.className = "template-card__name";
    name.textContent = template.name;
    info.appendChild(name);
    const desc = document.createElement("div");
    desc.className = "template-card__desc";
    desc.textContent = template.description;
    info.appendChild(desc);
    card.appendChild(info);
    card.addEventListener("click", () => handleTemplateSelect(template.id));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleTemplateSelect(template.id);
      }
    });
    return card;
  }
  async function handleTemplateSelect(templateId) {
    try {
      const state = await templateEngine.instantiateTemplate(templateId);
      canvasController.loadDiagram(state);
      hasComponents = true;
      currentTemplateId = templateId;
      updateTemplateCardsUI(templateId);
      updateExportButtonState();
      hideEmptyState();
    } catch (error) {
      console.error("Failed to instantiate template:", error);
      alert("Template could not be loaded. Please try another.");
    }
  }
  function updateTemplateCardsUI(activeTemplateId) {
    if (!templateGalleryEl) return;
    const allTemplateCards = templateGalleryEl.querySelectorAll(".template-card");
    allTemplateCards.forEach((card) => {
      const cardTemplateId = card.dataset.templateId;
      const isActive = cardTemplateId === activeTemplateId;
      card.classList.toggle("template-card--active", isActive);
    });
  }
  async function populateComponentPalette(platformId) {
    if (!paletteCategoriesEl) return;
    let manifest;
    try {
      manifest = await platformService.getIconManifest(platformId);
    } catch (error) {
      console.error("Failed to load icon manifest:", error);
      paletteCategoriesEl.innerHTML = '<p style="font-size: var(--font-size-sm); color: var(--color-text-body); opacity: 0.7;">Unable to load components. Please refresh the page.</p>';
      return;
    }
    renderPaletteCategories(manifest);
    wirePaletteSearch(manifest);
  }
  function renderPaletteCategories(manifest, searchTerm = "") {
    if (!paletteCategoriesEl) return;
    paletteCategoriesEl.innerHTML = "";
    const lowerSearch = searchTerm.toLowerCase();
    for (const category of manifest.categories) {
      const filteredServices = lowerSearch ? category.services.filter((s) => s.name.toLowerCase().includes(lowerSearch)) : category.services;
      if (filteredServices.length === 0) continue;
      const section = document.createElement("div");
      section.className = "palette-category";
      const title = document.createElement("h4");
      title.className = "palette-category__title";
      title.textContent = category.name;
      section.appendChild(title);
      const items = document.createElement("div");
      items.className = "palette-items";
      for (const service of filteredServices) {
        const item = document.createElement("div");
        item.className = "palette-item";
        item.draggable = true;
        item.dataset.serviceId = service.id;
        item.dataset.serviceName = service.name;
        item.dataset.iconPath = service.iconPath;
        item.dataset.defaultWidth = String(service.defaultWidth);
        item.dataset.defaultHeight = String(service.defaultHeight);
        const icon = document.createElement("img");
        icon.className = "palette-item__icon";
        icon.src = `/${service.iconPath}`;
        icon.alt = "";
        icon.setAttribute("aria-hidden", "true");
        item.appendChild(icon);
        const nameSpan = document.createElement("span");
        nameSpan.className = "palette-item__name";
        nameSpan.textContent = service.name;
        item.appendChild(nameSpan);
        item.addEventListener("dragstart", (e) => {
          if (!e.dataTransfer) return;
          const dragData = {
            serviceId: service.id,
            serviceName: service.name,
            iconPath: service.iconPath,
            defaultWidth: service.defaultWidth,
            defaultHeight: service.defaultHeight
          };
          e.dataTransfer.setData("application/json", JSON.stringify(dragData));
          e.dataTransfer.setData("text/plain", service.name);
          e.dataTransfer.effectAllowed = "copy";
        });
        items.appendChild(item);
      }
      section.appendChild(items);
      paletteCategoriesEl.appendChild(section);
    }
    if (paletteCategoriesEl.children.length === 0) {
      paletteCategoriesEl.innerHTML = '<p style="font-size: var(--font-size-sm); color: var(--color-text-body); opacity: 0.7;">No components match your search.</p>';
    }
  }
  function wirePaletteSearch(manifest) {
    if (!paletteSearchEl) return;
    const newSearchEl = paletteSearchEl.cloneNode(true);
    paletteSearchEl.parentNode?.replaceChild(newSearchEl, paletteSearchEl);
    newSearchEl.addEventListener("input", () => {
      const term = newSearchEl.value.trim();
      renderPaletteCategories(manifest, term);
    });
  }
  if (canvasEl) {
    canvasEl.addEventListener("dragover", (event) => {
      event.preventDefault();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "copy";
      }
      highlightContainerAtPoint(event, canvasEl, canvasController);
    });
    canvasEl.addEventListener("dragleave", () => {
      clearContainerHighlights();
    });
    canvasEl.addEventListener("drop", (event) => {
      event.preventDefault();
      clearContainerHighlights();
      if (!event.dataTransfer) return;
      const jsonData = event.dataTransfer.getData("application/json");
      if (!jsonData) return;
      try {
        const dragData = JSON.parse(jsonData);
        const rect = canvasEl.getBoundingClientRect();
        const position = {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top
        };
        const containerManager = new ContainerManager(canvasController.getState());
        const containerId = containerManager.getContainerAtPoint(position) ?? void 0;
        if (containerId && !containerManager.canNestIn(containerId)) {
          showNestingDepthWarning(event.clientX, event.clientY);
          canvasController.addComponentWithInfo(
            {
              serviceId: dragData.serviceId,
              serviceName: dragData.serviceName,
              iconPath: dragData.iconPath,
              defaultWidth: dragData.defaultWidth,
              defaultHeight: dragData.defaultHeight
            },
            position,
            void 0
          );
        } else {
          canvasController.addComponentWithInfo(
            {
              serviceId: dragData.serviceId,
              serviceName: dragData.serviceName,
              iconPath: dragData.iconPath,
              defaultWidth: dragData.defaultWidth,
              defaultHeight: dragData.defaultHeight
            },
            position,
            containerId
          );
        }
        onComponentAdded();
      } catch {
      }
    });
  }
  let highlightedContainerId = null;
  function highlightContainerAtPoint(event, canvas, controller) {
    const rect = canvas.getBoundingClientRect();
    const point = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
    const containerManager = new ContainerManager(controller.getState());
    const containerId = containerManager.getContainerAtPoint(point);
    if (containerId !== highlightedContainerId) {
      clearContainerHighlights();
      highlightedContainerId = containerId;
      if (containerId) {
        const stage2 = controller.getStage();
        if (stage2) {
          const containerNode = stage2.findOne(`#${containerId}`);
          if (containerNode) {
            const rectShape = containerNode.findOne("Rect");
            if (rectShape) {
              rectShape.strokeWidth(3);
              rectShape.opacity(0.9);
              stage2.batchDraw();
            }
          }
        }
      }
    }
  }
  function clearContainerHighlights() {
    if (highlightedContainerId) {
      const stage2 = canvasController.getStage();
      if (stage2) {
        const containerNode = stage2.findOne(`#${highlightedContainerId}`);
        if (containerNode) {
          const rectShape = containerNode.findOne("Rect");
          if (rectShape) {
            rectShape.strokeWidth(1.5);
            rectShape.opacity(1);
            stage2.batchDraw();
          }
        }
      }
      highlightedContainerId = null;
    }
  }
  let connectModeActive = false;
  const connectBtn = createConnectButton();
  if (connectBtn) {
    connectBtn.addEventListener("click", () => {
      connectModeActive = !connectModeActive;
      connectBtn.classList.toggle(CONNECT_MODE_ACTIVE_CLASS, connectModeActive);
      connectBtn.setAttribute("aria-pressed", String(connectModeActive));
      if (!connectModeActive) {
        canvasController.cancelConnection();
      }
    });
  }
  const stage = canvasController.getStage();
  if (stage) {
    stage.on("click.connectmode", (e) => {
      if (!connectModeActive) return;
      const target = e.target;
      if (!target) return;
      let group = target;
      while (group && !group.id()) {
        group = group.parent;
      }
      const componentId = group?.id();
      if (!componentId) return;
      const state = canvasController.getState();
      if (!state.components.has(componentId)) return;
      if (canvasController.isInConnectionMode()) {
        canvasController.completeConnection(componentId);
        connectModeActive = false;
        connectBtn?.classList.remove(CONNECT_MODE_ACTIVE_CLASS);
        connectBtn?.setAttribute("aria-pressed", "false");
      } else {
        canvasController.startConnection(componentId);
      }
    });
  }
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (canvasController.isInConnectionMode() || connectModeActive) {
        canvasController.cancelConnection();
        connectModeActive = false;
        connectBtn?.classList.remove(CONNECT_MODE_ACTIVE_CLASS);
        connectBtn?.setAttribute("aria-pressed", "false");
      }
    }
  });
  if (exportPngBtn) {
    exportPngBtn.addEventListener("click", async () => {
      try {
        const exportEngine = new ExportEngine(
          canvasController.getStage(),
          canvasController.getState()
        );
        if (!exportEngine.canExport()) {
          alert("Add components to the canvas before exporting.");
          return;
        }
        const blob = await exportEngine.exportAsPng({
          pixelRatio: 2,
          backgroundColor: "#ffffff"
        });
        exportEngine.triggerDownload(blob, "architecture-diagram.png");
      } catch (error) {
        alert(error.message || "Export failed. Try reducing diagram complexity.");
      }
    });
  }
  if (exportSvgBtn) {
    exportSvgBtn.addEventListener("click", () => {
      try {
        const exportEngine = new ExportEngine(
          canvasController.getStage(),
          canvasController.getState()
        );
        if (!exportEngine.canExport()) {
          alert("Add components to the canvas before exporting.");
          return;
        }
        const svg = exportEngine.exportAsSvg();
        exportEngine.triggerDownload(svg, "architecture-diagram.svg");
      } catch (error) {
        alert(error.message || "SVG export failed. Please try again.");
      }
    });
  }
  document.addEventListener("keydown", (event) => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }
    if (event.key === "Delete" || event.key === "Backspace") {
      const selectedId = canvasController.getSelectedComponentId();
      if (selectedId) {
        event.preventDefault();
        canvasController.removeComponent(selectedId);
        updateExportButtonState();
      }
    }
  });
  function onComponentAdded() {
    if (!hasComponents) {
      hasComponents = true;
      updateExportButtonState();
      hideEmptyState();
    }
  }
  function updateExportButtonState() {
    const state = canvasController.getState();
    const canExport = state.components.size > 0 || state.containers.size > 0;
    if (exportPngBtn) {
      exportPngBtn.disabled = !canExport;
      exportPngBtn.title = canExport ? "Export as PNG" : "Add components before exporting";
    }
    if (exportSvgBtn) {
      exportSvgBtn.disabled = !canExport;
      exportSvgBtn.title = canExport ? "Export as SVG" : "Add components before exporting";
    }
  }
  function hideEmptyState() {
    if (emptyState) {
      emptyState.style.display = "none";
    }
  }
  function showNestingDepthWarning(clientX, clientY) {
    const tooltip = document.createElement("div");
    tooltip.textContent = "Maximum nesting depth reached.";
    tooltip.style.position = "fixed";
    tooltip.style.left = `${clientX + 12}px`;
    tooltip.style.top = `${clientY - 30}px`;
    tooltip.style.padding = "6px 12px";
    tooltip.style.backgroundColor = "#333";
    tooltip.style.color = "#fff";
    tooltip.style.borderRadius = "4px";
    tooltip.style.fontSize = "12px";
    tooltip.style.fontFamily = "Inter, Arial, sans-serif";
    tooltip.style.zIndex = "9999";
    tooltip.style.pointerEvents = "none";
    tooltip.style.transition = "opacity 0.3s ease";
    tooltip.style.opacity = "1";
    tooltip.setAttribute("role", "alert");
    tooltip.setAttribute("aria-live", "polite");
    document.body.appendChild(tooltip);
    setTimeout(() => {
      tooltip.style.opacity = "0";
      setTimeout(() => {
        document.body.removeChild(tooltip);
      }, 300);
    }, 2e3);
  }
  function createConnectButton() {
    const exportPanel = document.getElementById("export-controls-panel");
    if (!exportPanel) return null;
    const toolbar = document.createElement("div");
    toolbar.className = "dc-toolbar";
    toolbar.style.display = "flex";
    toolbar.style.gap = "8px";
    toolbar.style.marginBottom = "12px";
    const btn = document.createElement("button");
    btn.id = "connect-mode-btn";
    btn.className = "export-btn";
    btn.type = "button";
    btn.setAttribute("aria-pressed", "false");
    btn.setAttribute("aria-label", "Toggle connector creation mode");
    btn.title = "Draw connections between components";
    btn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="3" cy="3" r="2" stroke="currentColor" stroke-width="1.5"/>
        <circle cx="13" cy="13" r="2" stroke="currentColor" stroke-width="1.5"/>
        <path d="M5 5l6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      Connect
    `;
    toolbar.appendChild(btn);
    const exportControls = exportPanel.querySelector(".export-controls");
    if (exportControls) {
      exportPanel.insertBefore(toolbar, exportControls);
    } else {
      exportPanel.appendChild(toolbar);
    }
    return btn;
  }
}
initApp();
