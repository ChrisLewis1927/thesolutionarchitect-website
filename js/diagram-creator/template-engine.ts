/**
 * TemplateEngine — loads and instantiates architecture pattern templates.
 *
 * Fetches template JSON files from static assets, filters them by platform,
 * validates their structure, and converts TemplateDef definitions into full
 * DiagramState objects ready for canvas rendering.
 */

import type {
  ArchitectureTemplate,
  TemplateDef,
  TemplateComponent,
  TemplateContainer,
  TemplateConnector,
  DiagramState,
  DiagramComponent,
  DiagramContainer,
  DiagramConnector,
  ContainerStyle,
  ContainerType,
  IconManifest,
  ServiceIcon,
} from './types.js';

/** Base path for template JSON files. */
const TEMPLATE_BASE = '/js/diagram-creator/templates';

/** Base path for icon manifest JSON files. */
const ICON_MANIFEST_BASE = '/js/diagram-creator/icons';

/**
 * Template index — lists template IDs available for each platform.
 * Since there is no server-side index endpoint, the engine maintains a static
 * registry of known template IDs per platform.
 */
const TEMPLATE_INDEX: Record<string, string[]> = {
  aws: ['aws-web-service', 'aws-serverless-api', 'aws-multi-az'],
  azure: ['azure-web-service', 'azure-serverless-api', 'azure-multi-az'],
  gcp: ['gcp-web-service', 'gcp-serverless-api', 'gcp-multi-az'],
};

/** Container nesting level styles for visual differentiation. */
const CONTAINER_STYLES: ContainerStyle[] = [
  { borderColor: '#1a73e8', backgroundColor: 'rgba(26, 115, 232, 0.05)', borderRadius: 8, padding: 20 },
  { borderColor: '#34a853', backgroundColor: 'rgba(52, 168, 83, 0.05)', borderRadius: 6, padding: 16 },
  { borderColor: '#fbbc04', backgroundColor: 'rgba(251, 188, 4, 0.05)', borderRadius: 4, padding: 12 },
  { borderColor: '#ea4335', backgroundColor: 'rgba(234, 67, 53, 0.05)', borderRadius: 4, padding: 10 },
  { borderColor: '#9334e6', backgroundColor: 'rgba(147, 52, 230, 0.05)', borderRadius: 3, padding: 8 },
];

export class TemplateEngine {
  private templateCache: Map<string, ArchitectureTemplate> = new Map();
  private manifestCache: Map<string, IconManifest> = new Map();

  /**
   * Returns all architecture templates for the given platform.
   * Fetches and validates each template JSON if not already cached.
   */
  async getTemplatesForPlatform(platformId: string): Promise<ArchitectureTemplate[]> {
    const templateIds = TEMPLATE_INDEX[platformId];
    if (!templateIds) {
      return [];
    }

    const templates: ArchitectureTemplate[] = [];

    for (const templateId of templateIds) {
      try {
        const template = await this.loadTemplate(platformId, templateId);
        if (template.platformId === platformId) {
          templates.push(template);
        }
      } catch (error) {
        // Log but don't block — skip templates that fail to load
        console.warn(`Failed to load template "${templateId}" for platform "${platformId}":`, error);
      }
    }

    return templates;
  }

  /**
   * Instantiates a template by ID, converting its TemplateDef into a full
   * DiagramState with resolved service names, icon paths, and container styles.
   *
   * Throws if the template has not been loaded or its platformId is unknown.
   */
  async instantiateTemplate(templateId: string): Promise<DiagramState> {
    const template = this.findCachedTemplate(templateId);
    if (!template) {
      throw new Error(`Template "${templateId}" not found. Load it via getTemplatesForPlatform() first.`);
    }

    const manifest = await this.getIconManifest(template.platformId);
    const definition = template.definition;

    const components = this.buildComponents(definition.components, manifest);
    const containers = this.buildContainers(definition.containers);
    const connectors = this.buildConnectors(definition.connectors);

    const state: DiagramState = {
      id: this.generateId(),
      platformId: template.platformId as 'aws' | 'azure' | 'gcp',
      templateId: template.id,
      components,
      containers,
      connectors,
    };

    return state;
  }

  /**
   * Loads and validates a single template JSON from the static assets.
   */
  private async loadTemplate(platformId: string, templateId: string): Promise<ArchitectureTemplate> {
    if (this.templateCache.has(templateId)) {
      return this.templateCache.get(templateId)!;
    }

    const url = `${TEMPLATE_BASE}/${platformId}/${templateId}.json`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Failed to load template "${templateId}": ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    this.validateTemplateStructure(data, templateId);

    const template: ArchitectureTemplate = data as ArchitectureTemplate;
    this.templateCache.set(templateId, template);
    return template;
  }

  /**
   * Validates that a parsed JSON object conforms to the expected ArchitectureTemplate structure.
   * Throws a descriptive error if validation fails.
   */
  private validateTemplateStructure(data: unknown, templateId: string): void {
    if (!data || typeof data !== 'object') {
      throw new Error(`Template "${templateId}" is not a valid JSON object.`);
    }

    const obj = data as Record<string, unknown>;

    // Top-level required fields
    const requiredFields = ['id', 'platformId', 'name', 'description', 'definition'];
    for (const field of requiredFields) {
      if (!(field in obj)) {
        throw new Error(`Template "${templateId}" is missing required field "${field}".`);
      }
    }

    if (typeof obj.id !== 'string' || typeof obj.platformId !== 'string') {
      throw new Error(`Template "${templateId}" has invalid id or platformId.`);
    }

    if (typeof obj.name !== 'string' || typeof obj.description !== 'string') {
      throw new Error(`Template "${templateId}" has invalid name or description.`);
    }

    // Validate definition structure
    const def = obj.definition as Record<string, unknown>;
    if (!def || typeof def !== 'object') {
      throw new Error(`Template "${templateId}" has an invalid definition.`);
    }

    if (!Array.isArray(def.components)) {
      throw new Error(`Template "${templateId}" definition.components must be an array.`);
    }

    if (!Array.isArray(def.containers)) {
      throw new Error(`Template "${templateId}" definition.containers must be an array.`);
    }

    if (!Array.isArray(def.connectors)) {
      throw new Error(`Template "${templateId}" definition.connectors must be an array.`);
    }

    // Validate each component has required fields
    for (const comp of def.components as Record<string, unknown>[]) {
      if (!comp.id || !comp.serviceId || !comp.position) {
        throw new Error(
          `Template "${templateId}" has a component missing required fields (id, serviceId, position).`
        );
      }
      const pos = comp.position as Record<string, unknown>;
      if (typeof pos.x !== 'number' || typeof pos.y !== 'number') {
        throw new Error(
          `Template "${templateId}" component "${comp.id}" has invalid position.`
        );
      }
    }

    // Validate each container has required fields
    for (const container of def.containers as Record<string, unknown>[]) {
      if (!container.id || !container.type || !container.label) {
        throw new Error(
          `Template "${templateId}" has a container missing required fields (id, type, label).`
        );
      }
      if (!Array.isArray(container.children)) {
        throw new Error(
          `Template "${templateId}" container "${container.id}" must have a children array.`
        );
      }
    }

    // Validate each connector has required fields
    for (const conn of def.connectors as Record<string, unknown>[]) {
      if (!conn.id || !conn.sourceId || !conn.targetId) {
        throw new Error(
          `Template "${templateId}" has a connector missing required fields (id, sourceId, targetId).`
        );
      }
      if (typeof conn.directed !== 'boolean') {
        throw new Error(
          `Template "${templateId}" connector "${conn.id}" must have a boolean "directed" field.`
        );
      }
    }
  }

  /**
   * Resolves a serviceId to its ServiceIcon entry from the icon manifest.
   * Returns null if the service is not found.
   */
  private resolveService(serviceId: string, manifest: IconManifest): ServiceIcon | null {
    for (const category of manifest.categories) {
      const service = category.services.find((s) => s.id === serviceId);
      if (service) {
        return service;
      }
    }
    return null;
  }

  /**
   * Builds the DiagramComponent map from template component definitions.
   */
  private buildComponents(
    templateComponents: TemplateComponent[],
    manifest: IconManifest
  ): Map<string, DiagramComponent> {
    const components = new Map<string, DiagramComponent>();

    for (const tc of templateComponents) {
      const service = this.resolveService(tc.serviceId, manifest);

      const component: DiagramComponent = {
        id: tc.id,
        serviceId: tc.serviceId,
        serviceName: service ? service.name : tc.serviceId,
        iconPath: service ? `/${service.iconPath}` : '',
        position: { x: tc.position.x, y: tc.position.y },
        size: {
          width: service ? service.defaultWidth : 48,
          height: service ? service.defaultHeight : 48,
        },
        containerId: tc.parentContainerId ?? null,
        label: service ? service.name : tc.serviceId,
      };

      components.set(tc.id, component);
    }

    return components;
  }

  /**
   * Builds the DiagramContainer map from template container definitions.
   * Computes nesting levels and assigns appropriate visual styles.
   */
  private buildContainers(
    templateContainers: TemplateContainer[]
  ): Map<string, DiagramContainer> {
    const containers = new Map<string, DiagramContainer>();

    // First pass: create containers without nesting level
    for (const tc of templateContainers) {
      const container: DiagramContainer = {
        id: tc.id,
        type: tc.type as ContainerType,
        label: tc.label,
        bounds: { x: 0, y: 0, width: 200, height: 150 }, // Placeholder bounds; layout engine will compute real ones
        parentId: tc.parentContainerId ?? null,
        childIds: [...tc.children],
        nestingLevel: 0,
        style: CONTAINER_STYLES[0],
      };
      containers.set(tc.id, container);
    }

    // Second pass: compute nesting levels by traversing parent chain
    for (const [id, container] of containers) {
      container.nestingLevel = this.computeNestingLevel(id, containers);
      container.style = this.getContainerStyle(container.nestingLevel);
    }

    return containers;
  }

  /**
   * Computes the nesting level for a container by counting parent hops.
   */
  private computeNestingLevel(containerId: string, containers: Map<string, DiagramContainer>): number {
    let level = 0;
    let current = containers.get(containerId);

    while (current && current.parentId) {
      level++;
      current = containers.get(current.parentId);
      // Guard against circular references
      if (level > 10) break;
    }

    return level;
  }

  /**
   * Returns the container style for a given nesting level.
   * Cycles through available styles if level exceeds defined styles.
   */
  private getContainerStyle(nestingLevel: number): ContainerStyle {
    return CONTAINER_STYLES[nestingLevel % CONTAINER_STYLES.length];
  }

  /**
   * Builds the DiagramConnector map from template connector definitions.
   */
  private buildConnectors(
    templateConnectors: TemplateConnector[]
  ): Map<string, DiagramConnector> {
    const connectors = new Map<string, DiagramConnector>();

    for (const tc of templateConnectors) {
      const connector: DiagramConnector = {
        id: tc.id,
        sourceComponentId: tc.sourceId,
        targetComponentId: tc.targetId,
        directed: tc.directed,
        label: tc.label ?? '',
        routePath: {
          points: [],
          sourceAnchor: { x: 0, y: 0 },
          targetAnchor: { x: 0, y: 0 },
        },
      };

      connectors.set(tc.id, connector);
    }

    return connectors;
  }

  /**
   * Fetches and caches the icon manifest for a platform.
   */
  private async getIconManifest(platformId: string): Promise<IconManifest> {
    if (this.manifestCache.has(platformId)) {
      return this.manifestCache.get(platformId)!;
    }

    const url = `${ICON_MANIFEST_BASE}/${platformId}.json`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Failed to load icon manifest for "${platformId}": ${response.status} ${response.statusText}`
      );
    }

    const manifest: IconManifest = await response.json();
    this.manifestCache.set(platformId, manifest);
    return manifest;
  }

  /**
   * Searches the template cache for a template with the given ID.
   */
  private findCachedTemplate(templateId: string): ArchitectureTemplate | null {
    return this.templateCache.get(templateId) ?? null;
  }

  /**
   * Generates a unique ID for a new diagram state.
   */
  private generateId(): string {
    return `diagram-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }
}
