/**
 * Unit tests for the ConnectorRouter class.
 * Tests connector creation/removal, route computation, anchor points,
 * obstacle avoidance, and label management.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { ConnectorRouter, resetConnectorIdCounter } from '../../js/diagram-creator/connector-router';
import { createEmptyDiagramState, createComponent } from './helpers';
import type { DiagramState } from '../../js/diagram-creator/types';

describe('ConnectorRouter', () => {
  let state: DiagramState;
  let router: ConnectorRouter;

  beforeEach(() => {
    state = createEmptyDiagramState('aws');
    resetConnectorIdCounter();

    // Set up two components with known positions
    const comp1 = createComponent({
      id: 'comp-1',
      position: { x: 100, y: 100 },
      size: { width: 48, height: 48 },
    });
    const comp2 = createComponent({
      id: 'comp-2',
      position: { x: 300, y: 100 },
      size: { width: 48, height: 48 },
    });
    state.components.set('comp-1', comp1);
    state.components.set('comp-2', comp2);

    router = new ConnectorRouter(state);
  });

  describe('addConnector', () => {
    it('should create a connector between two valid components', () => {
      const id = router.addConnector('comp-1', 'comp-2', true);

      expect(id).toBeTruthy();
      expect(state.connectors.has(id)).toBe(true);
    });

    it('should set directed flag on the connector', () => {
      const id = router.addConnector('comp-1', 'comp-2', true);
      const connector = state.connectors.get(id)!;

      expect(connector.directed).toBe(true);
    });

    it('should create an undirected connector', () => {
      const id = router.addConnector('comp-1', 'comp-2', false);
      const connector = state.connectors.get(id)!;

      expect(connector.directed).toBe(false);
    });

    it('should return empty string for invalid source component', () => {
      const id = router.addConnector('invalid-id', 'comp-2', true);

      expect(id).toBe('');
      expect(state.connectors.size).toBe(0);
    });

    it('should return empty string for invalid target component', () => {
      const id = router.addConnector('comp-1', 'invalid-id', true);

      expect(id).toBe('');
      expect(state.connectors.size).toBe(0);
    });

    it('should reject self-referencing connectors', () => {
      const id = router.addConnector('comp-1', 'comp-1', true);

      expect(id).toBe('');
      expect(state.connectors.size).toBe(0);
    });

    it('should compute a route path with at least 2 points', () => {
      const id = router.addConnector('comp-1', 'comp-2', true);
      const connector = state.connectors.get(id)!;

      expect(connector.routePath.points.length).toBeGreaterThanOrEqual(2);
    });

    it('should compute sourceAnchor on source bounding box edge', () => {
      const id = router.addConnector('comp-1', 'comp-2', true);
      const connector = state.connectors.get(id)!;
      const source = state.components.get('comp-1')!;

      const anchor = connector.routePath.sourceAnchor;
      // Anchor should be on or very near the source component's edge
      const onEdge =
        Math.abs(anchor.x - source.position.x) <= 2 ||
        Math.abs(anchor.x - (source.position.x + source.size.width)) <= 2 ||
        Math.abs(anchor.y - source.position.y) <= 2 ||
        Math.abs(anchor.y - (source.position.y + source.size.height)) <= 2;

      expect(onEdge).toBe(true);
    });

    it('should compute targetAnchor on target bounding box edge', () => {
      const id = router.addConnector('comp-1', 'comp-2', true);
      const connector = state.connectors.get(id)!;
      const target = state.components.get('comp-2')!;

      const anchor = connector.routePath.targetAnchor;
      // Anchor should be on or very near the target component's edge
      const onEdge =
        Math.abs(anchor.x - target.position.x) <= 2 ||
        Math.abs(anchor.x - (target.position.x + target.size.width)) <= 2 ||
        Math.abs(anchor.y - target.position.y) <= 2 ||
        Math.abs(anchor.y - (target.position.y + target.size.height)) <= 2;

      expect(onEdge).toBe(true);
    });

    it('should start with empty label', () => {
      const id = router.addConnector('comp-1', 'comp-2', true);
      const connector = state.connectors.get(id)!;

      expect(connector.label).toBe('');
    });

    it('should generate unique IDs for multiple connectors', () => {
      const id1 = router.addConnector('comp-1', 'comp-2', true);
      const id2 = router.addConnector('comp-2', 'comp-1', false);

      expect(id1).not.toBe(id2);
    });
  });

  describe('removeConnector', () => {
    it('should remove an existing connector from state', () => {
      const id = router.addConnector('comp-1', 'comp-2', true);
      expect(state.connectors.has(id)).toBe(true);

      router.removeConnector(id);
      expect(state.connectors.has(id)).toBe(false);
    });

    it('should not throw for a non-existent connector', () => {
      expect(() => router.removeConnector('non-existent')).not.toThrow();
    });
  });

  describe('updateRoutes', () => {
    it('should recalculate all connector routes', () => {
      const id = router.addConnector('comp-1', 'comp-2', true);
      const originalPath = { ...state.connectors.get(id)!.routePath };

      // Move target component to a new position
      state.components.get('comp-2')!.position = { x: 500, y: 300 };

      router.updateRoutes();

      const updatedPath = state.connectors.get(id)!.routePath;
      // The target anchor should have changed since the target moved
      expect(updatedPath.targetAnchor.x).not.toBe(originalPath.targetAnchor.x);
    });

    it('should handle connectors with missing source/target gracefully', () => {
      const id = router.addConnector('comp-1', 'comp-2', true);

      // Remove the target component from state
      state.components.delete('comp-2');

      // Should not throw
      expect(() => router.updateRoutes()).not.toThrow();
    });
  });

  describe('routeSingleConnector', () => {
    it('should return updated route for a valid connector', () => {
      const id = router.addConnector('comp-1', 'comp-2', true);

      // Move the target
      state.components.get('comp-2')!.position = { x: 500, y: 300 };

      const route = router.routeSingleConnector(id);

      expect(route.points.length).toBeGreaterThanOrEqual(2);
      expect(route.sourceAnchor).toBeDefined();
      expect(route.targetAnchor).toBeDefined();
    });

    it('should return empty path for non-existent connector', () => {
      const route = router.routeSingleConnector('non-existent');

      expect(route.points).toEqual([]);
    });

    it('should update the connector in state', () => {
      const id = router.addConnector('comp-1', 'comp-2', true);
      state.components.get('comp-2')!.position = { x: 500, y: 300 };

      router.routeSingleConnector(id);

      const connector = state.connectors.get(id)!;
      // Route should reflect the updated target position
      expect(connector.routePath.targetAnchor.x).toBeGreaterThan(200);
    });
  });

  describe('setConnectorLabel', () => {
    it('should set label on an existing connector', () => {
      const id = router.addConnector('comp-1', 'comp-2', true);
      router.setConnectorLabel(id, 'HTTP/REST');

      const connector = state.connectors.get(id)!;
      expect(connector.label).toBe('HTTP/REST');
    });

    it('should update an existing label', () => {
      const id = router.addConnector('comp-1', 'comp-2', true);
      router.setConnectorLabel(id, 'First Label');
      router.setConnectorLabel(id, 'Updated Label');

      const connector = state.connectors.get(id)!;
      expect(connector.label).toBe('Updated Label');
    });

    it('should not throw for non-existent connector', () => {
      expect(() => router.setConnectorLabel('non-existent', 'label')).not.toThrow();
    });
  });

  describe('obstacle avoidance', () => {
    it('should route around an obstacle between source and target', () => {
      // Place an obstacle directly between comp-1 and comp-2
      const obstacle = createComponent({
        id: 'obstacle',
        position: { x: 190, y: 90 },
        size: { width: 60, height: 60 },
      });
      state.components.set('obstacle', obstacle);

      const id = router.addConnector('comp-1', 'comp-2', true);
      const connector = state.connectors.get(id)!;
      const route = connector.routePath;

      // Route should have more than 2 points (detoured around obstacle)
      expect(route.points.length).toBeGreaterThanOrEqual(3);
    });

    it('should use direct path when no obstacles are present', () => {
      const id = router.addConnector('comp-1', 'comp-2', true);
      const connector = state.connectors.get(id)!;

      // With horizontally aligned components, an L-path should have 3 points
      // (source, midpoint, target) or could be optimised to fewer
      expect(connector.routePath.points.length).toBeGreaterThanOrEqual(2);
      expect(connector.routePath.points.length).toBeLessThanOrEqual(4);
    });
  });

  describe('anchor point computation', () => {
    it('should compute anchor on right edge when target is to the right', () => {
      const id = router.addConnector('comp-1', 'comp-2', true);
      const connector = state.connectors.get(id)!;
      const source = state.components.get('comp-1')!;

      // Source anchor should be on the right edge (x = position.x + width)
      const rightEdge = source.position.x + source.size.width;
      expect(Math.abs(connector.routePath.sourceAnchor.x - rightEdge)).toBeLessThanOrEqual(2);
    });

    it('should compute anchor on left edge when target is to the left', () => {
      // Add comp-2 to the left of comp-1
      state.components.get('comp-2')!.position = { x: 0, y: 100 };

      const id = router.addConnector('comp-1', 'comp-2', true);
      const connector = state.connectors.get(id)!;
      const source = state.components.get('comp-1')!;

      // Source anchor should be on the left edge (x = position.x)
      expect(Math.abs(connector.routePath.sourceAnchor.x - source.position.x)).toBeLessThanOrEqual(2);
    });

    it('should compute anchor on bottom edge when target is below', () => {
      state.components.get('comp-2')!.position = { x: 100, y: 300 };

      const id = router.addConnector('comp-1', 'comp-2', true);
      const connector = state.connectors.get(id)!;
      const source = state.components.get('comp-1')!;

      // Source anchor should be on the bottom edge (y = position.y + height)
      const bottomEdge = source.position.y + source.size.height;
      expect(Math.abs(connector.routePath.sourceAnchor.y - bottomEdge)).toBeLessThanOrEqual(2);
    });
  });
});
