# Requirements Document

## Introduction

Architecture Diagram Creator is an interactive, client-side web tool hosted as a page on thesolutionarchitect.uk. It enables UK government solution architects to create professional cloud architecture diagrams using official platform icons and terminology. The tool uses a template-driven approach where users select a cloud platform (AWS, Azure, or GCP) and a starting architecture pattern, then customise the pre-built diagram using drag-and-drop interactions. Diagrams can be exported as PNG or SVG for inclusion in architecture documents and governance board presentations. The tool runs entirely in the browser with no backend dependencies and deploys as static files on Netlify.

## Glossary

- **Diagram_Creator**: The client-side web application responsible for rendering the diagram canvas, managing component interactions, and orchestrating all user-facing features.
- **Platform_Selector**: The subsystem responsible for presenting cloud platform choices and loading the corresponding icon set and terminology.
- **Template_Engine**: The subsystem responsible for storing, presenting, and instantiating architecture pattern templates onto the diagram canvas.
- **Component_Palette**: The UI panel displaying available cloud components (services, resources) that the user can drag onto the canvas.
- **Diagram_Canvas**: The interactive drawing surface where architecture diagrams are composed, edited, and rendered.
- **Container_Component**: A resizable grouping element representing infrastructure boundaries such as Availability Zones, VPCs, subnets, or resource groups that automatically adjusts its dimensions when child components are added or removed.
- **Auto_Layout_Engine**: The subsystem responsible for recalculating component positions and container sizes when structural changes occur (such as adding or removing Availability Zones).
- **Connector_Router**: The subsystem responsible for rendering lines and arrows between components with intelligent path routing to avoid overlaps.
- **Export_Engine**: The subsystem responsible for converting the current diagram state into PNG or SVG image formats.
- **Architecture_Pattern**: A pre-defined diagram template representing a common cloud architecture (e.g., public-facing web service, serverless API, multi-AZ production deployment).
- **Cloud_Platform**: One of the three supported cloud providers: Amazon Web Services (AWS), Microsoft Azure, or Google Cloud Platform (GCP).
- **Icon_Set**: The collection of official cloud service icons for a specific Cloud_Platform, used to represent services on the Diagram_Canvas.

## Requirements

### Requirement 1: Cloud Platform Selection

**User Story:** As a solution architect, I want to select my target cloud platform before creating a diagram, so that the tool provides the correct official icons and terminology for that platform.

#### Acceptance Criteria

1. WHEN the user opens the Diagram_Creator page, THE Platform_Selector SHALL display the available Cloud_Platform options (AWS, Azure, GCP) for selection.
2. WHEN the user selects a Cloud_Platform, THE Platform_Selector SHALL load the corresponding Icon_Set and platform-specific terminology into the Component_Palette within 3 seconds.
3. WHEN the user selects a Cloud_Platform, THE Template_Engine SHALL filter available Architecture_Patterns to show only templates relevant to the selected platform.
4. THE Platform_Selector SHALL display each Cloud_Platform option with its official logo and name for clear identification.
5. WHEN the user changes the Cloud_Platform after starting a diagram, THE Diagram_Creator SHALL warn the user that changing platform will reset the current diagram and require confirmation before proceeding.

### Requirement 2: Template-Driven Diagram Creation

**User Story:** As a solution architect, I want to start from a pre-built architecture pattern rather than a blank canvas, so that I can quickly produce a professional diagram by customising an established pattern.

#### Acceptance Criteria

1. WHEN the user has selected a Cloud_Platform, THE Template_Engine SHALL display a gallery of available Architecture_Patterns for the selected platform.
2. THE Template_Engine SHALL provide at minimum the following Architecture_Patterns for each Cloud_Platform: public-facing web service, serverless API, and multi-AZ production deployment.
3. WHEN the user selects an Architecture_Pattern, THE Template_Engine SHALL render the complete template diagram onto the Diagram_Canvas within 2 seconds.
4. WHEN the user selects an Architecture_Pattern, THE Template_Engine SHALL display a brief description of the pattern explaining its purpose and typical use case.
5. THE Template_Engine SHALL render template diagrams with components already connected via appropriate Connector_Router paths.
6. WHEN the template diagram is rendered, THE Diagram_Creator SHALL allow the user to immediately begin customising the diagram by adding, removing, or repositioning components.

### Requirement 3: Component Palette and Drag-and-Drop

**User Story:** As a solution architect, I want to drag cloud service components from a categorised palette onto my diagram, so that I can add services beyond what the template provides.

#### Acceptance Criteria

1. THE Component_Palette SHALL display available components categorised by service type (e.g., compute, storage, networking, database, security, application integration).
2. WHEN the user drags a component from the Component_Palette onto the Diagram_Canvas, THE Diagram_Canvas SHALL place the component at the drop position and render it using the official Icon_Set image for the selected Cloud_Platform.
3. WHEN the user drags a component over a Container_Component, THE Diagram_Canvas SHALL provide a visual highlight indicating the component will be placed inside that container.
4. THE Component_Palette SHALL include a search field that filters visible components by name as the user types.
5. WHEN a component is placed on the Diagram_Canvas, THE Diagram_Canvas SHALL display the component with its official icon and service name label.
6. WHEN the user selects a component on the Diagram_Canvas, THE Diagram_Canvas SHALL display handles for repositioning and a delete control for removal.

### Requirement 4: Smart Containers

**User Story:** As a solution architect, I want VPCs, subnets, and Availability Zones to behave as smart containers that auto-resize, so that my diagram stays tidy without manual resizing.

#### Acceptance Criteria

1. WHEN the user adds a component inside a Container_Component, THE Container_Component SHALL automatically expand its boundaries to accommodate the new component with consistent padding.
2. WHEN the user removes a component from a Container_Component, THE Container_Component SHALL automatically contract its boundaries to fit the remaining components with consistent padding.
3. THE Diagram_Canvas SHALL support nested Container_Components (e.g., a subnet inside a VPC inside an Availability Zone) with each level resizing independently.
4. WHEN the user drags a component into a Container_Component from outside, THE Container_Component SHALL adopt the component as a child and adjust its boundaries accordingly.
5. WHEN the user drags a component out of a Container_Component, THE Container_Component SHALL release the component and contract its boundaries accordingly.
6. THE Diagram_Canvas SHALL render Container_Components with distinct visual borders and background colours to differentiate nesting levels.

### Requirement 5: Auto-Layout on Structural Changes

**User Story:** As a solution architect, I want the diagram to automatically rescale and reposition components when I add or remove Availability Zones, so that the layout remains balanced without manual adjustment.

#### Acceptance Criteria

1. WHEN the user adds an Availability Zone Container_Component to the diagram, THE Auto_Layout_Engine SHALL redistribute existing Availability Zones and their contents to maintain a balanced horizontal layout.
2. WHEN the user removes an Availability Zone Container_Component from the diagram, THE Auto_Layout_Engine SHALL redistribute the remaining Availability Zones to fill the available space evenly.
3. WHEN the Auto_Layout_Engine repositions components, THE Auto_Layout_Engine SHALL preserve the relative arrangement of components within each Container_Component.
4. WHEN the Auto_Layout_Engine completes a layout recalculation, THE Connector_Router SHALL update all connection paths to reflect the new component positions.
5. THE Auto_Layout_Engine SHALL complete layout recalculation and re-render within 1 second of a structural change.

### Requirement 6: Connectors and Routing

**User Story:** As a solution architect, I want to draw connection lines between components with intelligent routing, so that my diagram clearly shows data flow and service relationships.

#### Acceptance Criteria

1. WHEN the user initiates a connection from one component to another, THE Connector_Router SHALL render a line or arrow between the two components.
2. THE Connector_Router SHALL route connection paths to avoid crossing through other components where possible.
3. WHEN a component is repositioned on the Diagram_Canvas, THE Connector_Router SHALL automatically update all connections attached to that component to maintain valid routes.
4. THE Connector_Router SHALL support directional arrows indicating the direction of data flow or dependency.
5. WHEN the user selects a connector, THE Diagram_Canvas SHALL display a delete control for removing the connection.
6. THE Connector_Router SHALL render connectors with clear visual distinction from container borders and component outlines.

### Requirement 7: Diagram Export

**User Story:** As a solution architect, I want to export my diagram as a PNG or SVG file, so that I can include it in architecture documents, slide decks, and governance papers.

#### Acceptance Criteria

1. WHEN the user selects the export function, THE Export_Engine SHALL present options to export as PNG or SVG format.
2. WHEN the user exports as PNG, THE Export_Engine SHALL generate a raster image of the current diagram at a resolution suitable for inclusion in printed A4 documents (minimum 150 DPI at A4 size).
3. WHEN the user exports as SVG, THE Export_Engine SHALL generate a scalable vector image that preserves all component icons, labels, connectors, and container boundaries.
4. WHEN the export completes, THE Export_Engine SHALL trigger the browser file download dialog for the user to save the file.
5. THE Export_Engine SHALL include all visible diagram elements in the exported image including components, containers, connectors, and labels.
6. THE Export_Engine SHALL produce export files within 5 seconds of the user confirming the export action.

### Requirement 8: Visual Quality and Professional Appearance

**User Story:** As a solution architect, I want diagrams to look professional and polished, so that I can confidently include them in formal architecture documents and governance submissions.

#### Acceptance Criteria

1. THE Diagram_Canvas SHALL render all components using official cloud provider icon images at consistent sizes.
2. THE Diagram_Canvas SHALL use a colour scheme consistent with official cloud platform branding for Container_Components and visual groupings.
3. THE Diagram_Canvas SHALL render component labels using a legible sans-serif font at a size readable at standard document zoom levels.
4. THE Diagram_Canvas SHALL apply consistent spacing and alignment to template-generated layouts.
5. THE Diagram_Canvas SHALL render container borders with rounded corners and subtle colour-coded backgrounds to distinguish infrastructure boundaries.
6. THE Diagram_Canvas SHALL maintain visual clarity with no overlapping labels or icons during normal usage.

### Requirement 9: Client-Side Operation and Static Deployment

**User Story:** As the site owner, I want the diagram tool to run entirely in the browser with no backend, so that it can be deployed as a static page on Netlify alongside the existing site.

#### Acceptance Criteria

1. THE Diagram_Creator SHALL execute entirely within the user's web browser with no server-side processing required.
2. THE Diagram_Creator SHALL be deployable as static files (HTML, CSS, JavaScript, and image assets) served from Netlify.
3. THE Diagram_Creator SHALL load all Icon_Set images from static assets bundled with the application rather than from external API calls.
4. THE Diagram_Creator SHALL function without requiring user authentication or account creation.
5. IF the user's browser loses internet connectivity after the page has loaded, THEN THE Diagram_Creator SHALL continue to function for all diagram creation and editing operations.
6. THE Diagram_Creator SHALL load the initial page and be interactive within 5 seconds on a standard broadband connection.

### Requirement 10: Site Navigation Integration

**User Story:** As a visitor to thesolutionarchitect.uk, I want to find the diagram tool from the main navigation, so that I can discover and access it alongside the existing site content.

#### Acceptance Criteria

1. THE Diagram_Creator page SHALL be accessible via a link in the site's main navigation menu.
2. THE Diagram_Creator page SHALL use the same header, footer, and visual styling as the rest of thesolutionarchitect.uk.
3. THE Diagram_Creator page SHALL include appropriate page metadata (title, description) for search engine indexing.
4. WHEN the user navigates to the Diagram_Creator page, THE Diagram_Creator SHALL display the Platform_Selector as the initial interaction point.
