# Implementation Plan: Architecture Diagram Creator

## Overview

This plan implements the Architecture Diagram Creator as a client-side interactive web tool using Konva.js for canvas rendering, dagre for auto-layout, vanilla ES modules (no build toolchain), and static JSON for templates and icon manifests. The implementation is structured as 7 core modules (PlatformService, TemplateEngine, CanvasController, ContainerManager, AutoLayoutEngine, ConnectorRouter, ExportEngine) integrated into a single static HTML page (`diagrams-creator.html`) deployed on Netlify.

## Tasks

- [x] 1. Set up project structure, core types, and static assets
  - [x] 1.1 Create directory structure and core TypeScript interfaces
    - Create `/js/diagram-creator/` module directory
    - Create `/js/diagram-creator/types.ts` with all shared interfaces (DiagramState, Point, Rect, ContainerType, DiagramComponent, DiagramContainer, DiagramConnector, ContainerStyle, RoutePath)
    - Create `/images/diagram-icons/aws/`, `/images/diagram-icons/azure/`, `/images/diagram-icons/gcp/` directories
    - Create `/js/diagram-creator/templates/` directory
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 1.2 Create icon manifest JSON files for each platform
    - Create `/js/diagram-creator/icons/aws.json` with categories (compute, storage, networking, database, security, application-integration) and at least 3 services per category
    - Create `/js/diagram-creator/icons/azure.json` with equivalent categories and services
    - Create `/js/diagram-creator/icons/gcp.json` with equivalent categories and services
    - Include `id`, `name`, `iconPath`, `defaultWidth`, `defaultHeight` for each service
    - _Requirements: 1.2, 3.1, 9.3_

  - [x] 1.3 Create template JSON files for each platform
    - Create `/js/diagram-creator/templates/aws/aws-web-service.json` (public-facing web service)
    - Create `/js/diagram-creator/templates/aws/aws-serverless-api.json` (serverless API)
    - Create `/js/diagram-creator/templates/aws/aws-multi-az.json` (multi-AZ production deployment)
    - Create equivalent template JSON files for Azure and GCP (3 each)
    - Each template must include `components`, `containers`, and `connectors` arrays
    - _Requirements: 2.1, 2.2, 2.4, 2.5_

  - [x] 1.4 Set up Vitest and fast-check test configuration
    - Create `/tests/diagram-creator/` test directory
    - Configure Vitest for the diagram-creator test files with happy-dom environment
    - Verify fast-check (v3.23.1) is available in devDependencies
    - Create test helper utilities for generating arbitrary diagram states
    - _Requirements: N/A (test infrastructure)_

- [x] 2. Implement PlatformService module
  - [x] 2.1 Implement PlatformService class
    - Create `/js/diagram-creator/platform-service.ts`
    - Implement `getAvailablePlatforms()` returning AWS, Azure, GCP with logos
    - Implement `selectPlatform(platformId)` loading the correct icon manifest
    - Implement `getIconManifest(platformId)` fetching and parsing JSON
    - Implement `getIconUrl(platformId, serviceId)` resolving relative paths
    - Implement `getCurrentPlatform()` returning current selection
    - _Requirements: 1.1, 1.2, 1.4_

  - [x]* 2.2 Write unit tests for PlatformService
    - Test platform list contains all 3 platforms with correct IDs
    - Test icon manifest loading and parsing
    - Test icon URL resolution for each platform
    - Test `getCurrentPlatform()` returns null before selection and correct platform after
    - _Requirements: 1.1, 1.2, 1.4_

- [x] 3. Implement TemplateEngine module
  - [x] 3.1 Implement TemplateEngine class
    - Create `/js/diagram-creator/template-engine.ts`
    - Implement `getTemplatesForPlatform(platformId)` fetching and filtering templates
    - Implement `instantiateTemplate(templateId)` converting TemplateDef into full DiagramState
    - Validate template JSON structure on load
    - _Requirements: 1.3, 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x]* 3.2 Write property test for template filtering (Property 1)
    - **Property 1: Template filtering by platform**
    - Generate arbitrary collections of templates with mixed platformIds
    - Verify `getTemplatesForPlatform` returns only templates matching selected platformId
    - Minimum 100 iterations
    - **Validates: Requirements 1.3**

  - [x]* 3.3 Write property test for template instantiation (Property 2)
    - **Property 2: Template instantiation completeness**
    - Generate arbitrary valid TemplateDef objects with N components, M containers, P connectors
    - Verify instantiation produces DiagramState with exactly N, M, P items preserving IDs
    - Minimum 100 iterations
    - **Validates: Requirements 2.3, 2.5**

- [x] 4. Implement ContainerManager module
  - [x] 4.1 Implement ContainerManager class
    - Create `/js/diagram-creator/container-manager.ts`
    - Implement `addChildToContainer(containerId, childId)` with parent-child linking
    - Implement `removeChildFromContainer(containerId, childId)` with unlinking
    - Implement `recalculateBounds(containerId)` with consistent padding
    - Implement `getContainerAtPoint(point)` for drop-target detection
    - Implement `getNestingLevel(containerId)` traversing parent chain
    - Implement `getContainerStyle(nestingLevel)` with distinct colours per level
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x]* 4.2 Write property test for container bounds (Property 5)
    - **Property 5: Container bounds encompass all children**
    - Generate arbitrary containers with random child positions and sizes
    - Verify computed bounds fully encompass every child bounding box plus padding
    - Test at multiple nesting depths
    - Minimum 100 iterations
    - **Validates: Requirements 4.1, 4.2, 4.3**

  - [x]* 4.3 Write property test for parent-child consistency (Property 6)
    - **Property 6: Container parent-child relationship consistency**
    - Generate arbitrary add/remove sequences
    - Verify containerId and childIds stay in sync after each operation
    - Minimum 100 iterations
    - **Validates: Requirements 4.4, 4.5**

  - [x]* 4.4 Write property test for distinct container styles (Property 7)
    - **Property 7: Distinct container styles by nesting level**
    - Generate pairs of different nesting levels
    - Verify `getContainerStyle` returns different backgroundColor values
    - Minimum 100 iterations
    - **Validates: Requirements 4.6**

- [x] 5. Checkpoint - Core data modules complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement AutoLayoutEngine module
  - [x] 6.1 Implement AutoLayoutEngine class
    - Create `/js/diagram-creator/auto-layout-engine.ts`
    - Integrate dagre for directed graph positioning
    - Implement `redistributeContainers(containers, direction)` computing new positions
    - Implement `applyLayout(result)` updating DiagramState positions
    - Preserve relative child ordering within containers during redistribution
    - _Requirements: 5.1, 5.2, 5.3, 5.5_

  - [x]* 6.2 Write property test for AZ distribution (Property 8)
    - **Property 8: Even horizontal distribution of AZ containers**
    - Generate sets of N >= 2 AZ containers with varying widths
    - Verify horizontal spacing between consecutive AZs is equal (±1px tolerance)
    - Verify relative ordering of children within each AZ is preserved
    - Minimum 100 iterations
    - **Validates: Requirements 5.1, 5.2, 5.3**

  - [x]* 6.3 Write property test for no overlapping components (Property 13)
    - **Property 13: No overlapping component bounding boxes after auto-layout**
    - Generate arbitrary diagram states with multiple components
    - Run through AutoLayoutEngine
    - Verify no two component bounding boxes intersect
    - Minimum 100 iterations
    - **Validates: Requirements 8.6**

- [x] 7. Implement ConnectorRouter module
  - [x] 7.1 Implement ConnectorRouter class
    - Create `/js/diagram-creator/connector-router.ts`
    - Implement `addConnector(sourceId, targetId, directed)` creating connector with route
    - Implement `removeConnector(connectorId)` cleaning up state
    - Implement `updateRoutes()` recalculating all connector paths after layout changes
    - Implement `routeSingleConnector(connectorId)` with obstacle avoidance
    - Implement `setConnectorLabel(connectorId, label)` for annotation
    - Compute anchor points on source/target bounding box edges
    - Route paths around obstacle components
    - _Requirements: 5.4, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [x]* 7.2 Write property test for connector endpoints (Property 9)
    - **Property 9: Connector endpoint validity**
    - Generate arbitrary component positions and connector pairs
    - Verify route path starts on/adjacent to source bbox and ends on/adjacent to target bbox
    - Verify path has at least 2 points
    - Minimum 100 iterations
    - **Validates: Requirements 5.4, 6.1, 6.3**

  - [x]* 7.3 Write property test for obstacle avoidance (Property 10)
    - **Property 10: Connector routing avoids obstacles**
    - Generate connector routes with obstacle components in between
    - Verify no line segment of the route intersects any obstacle's bounding box
    - Minimum 100 iterations
    - **Validates: Requirements 6.2**

- [x] 8. Implement CanvasController module
  - [x] 8.1 Implement CanvasController with Konva.js integration
    - Create `/js/diagram-creator/canvas-controller.ts`
    - Implement `initialise(containerId)` creating Konva.Stage and layers
    - Implement `loadDiagram(state)` rendering full DiagramState to canvas
    - Implement `addComponent(serviceId, position, containerId)` with icon rendering
    - Implement `removeComponent(componentId)` with cleanup
    - Implement `moveComponent(componentId, newPosition)` with drag-and-drop
    - Implement `addContainer(type, position, parentId)` rendering styled containers
    - Implement `removeContainer(containerId)` with child handling
    - Implement `startConnection(sourceId)` and `completeConnection(targetId)` for connector creation
    - Implement `removeConnection(connectorId)`
    - Implement `getState()` and `clearCanvas()`
    - Wire up Konva drag events to ContainerManager and ConnectorRouter updates
    - _Requirements: 2.3, 2.6, 3.2, 3.3, 3.5, 3.6, 4.4, 4.5, 6.1, 6.5_

  - [x]* 8.2 Write property test for component placement (Property 3)
    - **Property 3: Component placement at specified position**
    - Generate arbitrary valid serviceIds and positions within canvas bounds
    - Verify addComponent produces a DiagramComponent at exactly the specified position with correct iconPath
    - Minimum 100 iterations
    - **Validates: Requirements 3.2**

- [x] 9. Implement Component Palette with search filtering
  - [x] 9.1 Implement palette UI and search filter logic
    - Create `/js/diagram-creator/palette.ts`
    - Render categorised component list from icon manifest
    - Implement search filter function (case-insensitive name matching)
    - Implement drag initiation from palette items
    - Wire palette to CanvasController for drop handling
    - _Requirements: 3.1, 3.4, 3.5_

  - [x]* 9.2 Write property test for palette search (Property 4)
    - **Property 4: Palette search filtering**
    - Generate arbitrary search strings and ServiceIcon lists
    - Verify filter returns exactly those services whose name contains search string (case-insensitive)
    - Minimum 100 iterations
    - **Validates: Requirements 3.4**

- [x] 10. Checkpoint - All core modules complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Implement ExportEngine module
  - [x] 11.1 Implement ExportEngine class
    - Create `/js/diagram-creator/export-engine.ts`
    - Implement `exportAsPng(options)` using Konva `stage.toDataURL()` with pixelRatio for 150+ DPI
    - Implement `exportAsSvg()` with custom SVG DOM serialisation preserving all elements
    - Implement `triggerDownload(blob, filename)` initiating browser file download
    - Handle empty canvas state (disable export)
    - Handle export errors gracefully with user messaging
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [x]* 11.2 Write property test for SVG export completeness (Property 11)
    - **Property 11: SVG export completeness**
    - Generate arbitrary DiagramState with N components, M containers, P connectors, L labels
    - Verify SVG output contains at least N image/use elements, M rect elements, P path/line elements, L text elements
    - Minimum 100 iterations
    - **Validates: Requirements 7.3, 7.5**

  - [x]* 11.3 Write property test for PNG resolution (Property 12)
    - **Property 12: PNG export minimum resolution**
    - Generate arbitrary diagram states
    - Export with pixelRatio 2
    - Verify output dimensions are at least 1240×1754 pixels (150 DPI at A4)
    - Minimum 100 iterations
    - **Validates: Requirements 7.2**

- [x] 12. Implement main page integration and UI wiring
  - [x] 12.1 Create diagrams-creator.html page with full UI layout
    - Create `diagrams-creator.html` with site header/footer matching existing site styling
    - Add Platform Selector panel UI
    - Add Template Gallery panel UI
    - Add Component Palette panel with search input
    - Add Konva canvas container element
    - Add Export Controls panel (PNG/SVG buttons)
    - Add `<script type="module">` entry point importing all modules
    - Include page metadata (title, description) for SEO
    - _Requirements: 9.1, 9.2, 10.1, 10.2, 10.3, 10.4_

  - [x] 12.2 Wire platform selection and template gallery interactions
    - Connect Platform Selector buttons to PlatformService
    - Render template gallery thumbnails from TemplateEngine
    - Handle platform change confirmation dialog (warn and reset)
    - Handle template selection triggering CanvasController.loadDiagram()
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.3, 2.4, 2.6_

  - [x] 12.3 Wire drag-and-drop, connector creation, and export controls
    - Connect palette drag events to CanvasController.addComponent()
    - Implement container highlight on drag-over
    - Connect connector creation UI (click source → click target)
    - Connect export buttons to ExportEngine methods
    - Implement delete controls for selected components and connectors
    - _Requirements: 3.2, 3.3, 3.6, 6.1, 6.5, 7.1, 7.4_

- [x] 13. Implement error handling and browser compatibility
  - [x] 13.1 Add error handling across all modules
    - Implement icon loading failure fallback (placeholder rectangle with service name)
    - Implement template loading failure toast messaging
    - Implement canvas boundary snapping for out-of-bounds drops
    - Reject self-referencing connectors and circular container nesting
    - Enforce maximum nesting depth (5 levels) with tooltip warning
    - Disable export when canvas is empty
    - Handle PNG/SVG export failures with user-facing error messages
    - _Requirements: 9.5, 8.6_

  - [x] 13.2 Add browser compatibility detection
    - Add `<script nomodule>` fallback for browsers without ES module support
    - Add Canvas API detection with static fallback message
    - _Requirements: 9.1_

- [x] 14. Add site navigation integration
  - [x] 14.1 Update main navigation to include Diagram Creator link
    - Add "Diagram Creator" link to the site's main navigation menu
    - Ensure consistent styling with existing nav items
    - _Requirements: 10.1, 10.2_

- [x] 15. Final checkpoint - Full integration complete
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document using fast-check
- Unit tests validate specific examples and edge cases
- All modules use ES module imports — no build toolchain required
- Konva.js and dagre are loaded via CDN script tags or vendored into `/js/vendor/`
- Test files follow pattern: `tests/diagram-creator/*.property.test.ts` for properties and `tests/diagram-creator/*.test.ts` for unit tests

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.4"] },
    { "id": 1, "tasks": ["1.2", "1.3"] },
    { "id": 2, "tasks": ["2.1", "3.1", "4.1"] },
    { "id": 3, "tasks": ["2.2", "3.2", "3.3", "4.2", "4.3", "4.4"] },
    { "id": 4, "tasks": ["6.1", "9.1"] },
    { "id": 5, "tasks": ["6.2", "6.3", "7.1", "9.2"] },
    { "id": 6, "tasks": ["7.2", "7.3", "8.1"] },
    { "id": 7, "tasks": ["8.2", "11.1"] },
    { "id": 8, "tasks": ["11.2", "11.3", "12.1"] },
    { "id": 9, "tasks": ["12.2", "12.3"] },
    { "id": 10, "tasks": ["13.1", "13.2", "14.1"] }
  ]
}
```
