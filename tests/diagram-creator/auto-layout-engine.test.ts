/**
 * Unit tests for the AutoLayoutEngine class.
 * Tests even distribution of containers, child positioning preservation,
 * and application of layout results to DiagramState.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { AutoLayoutEngine } from '../../js/diagram-creator/auto-layout-engine';
import { createEmptyDiagramState, createComponent, createContainer } from './helpers';
import type { DiagramState, ContainerNode } from '../../js/diagram-creator/types';

describe('AutoLayoutEngine', () => {
  let state: DiagramState;
  let engine: AutoLayoutEngine;

  beforeEach(() => {
    state = createEmptyDiagramState('aws');
    engine = new AutoLayoutEngine(state);
  });

  describe('redistributeContainers', () => {
    it('should return empty maps for zero containers', () => {
      const result = engine.redistributeContainers([], 'horizontal');

      expect(result.positions.size).toBe(0);
      expect(result.containerBounds.size).toBe(0);
    });

    it('should place a single container at the origin', () => {
      const containers: ContainerNode[] = [
        { id: 'az-1', width: 200, height: 300, children: [] },
      ];

      const result = engine.redistributeContainers(containers, 'horizontal');

      expect(result.containerBounds.has('az-1')).toBe(true);
      const bounds = result.containerBounds.get('az-1')!;
      expect(bounds.x).toBe(60); // LAYOUT_ORIGIN_X
      expect(bounds.y).toBe(60); // LAYOUT_ORIGIN_Y
      expect(bounds.width).toBe(200);
      expect(bounds.height).toBe(300);
    });

    it('should distribute two containers horizontally with equal spacing', () => {
      const containers: ContainerNode[] = [
        { id: 'az-1', width: 200, height: 300, children: [] },
        { id: 'az-2', width: 200, height: 300, children: [] },
      ];

      const result = engine.redistributeContainers(containers, 'horizontal');

      const bounds1 = result.containerBounds.get('az-1')!;
      const bounds2 = result.containerBounds.get('az-2')!;

      // Both should be placed side-by-side
      expect(bounds1.x).toBeLessThan(bounds2.x);
      // Gap between end of first and start of second should be consistent
      const gap = bounds2.x - (bounds1.x + bounds1.width);
      expect(gap).toBe(40); // DEFAULT_GAP
    });

    it('should distribute three containers horizontally with equal spacing', () => {
      const containers: ContainerNode[] = [
        { id: 'az-1', width: 200, height: 300, children: [] },
        { id: 'az-2', width: 250, height: 300, children: [] },
        { id: 'az-3', width: 200, height: 300, children: [] },
      ];

      const result = engine.redistributeContainers(containers, 'horizontal');

      const bounds1 = result.containerBounds.get('az-1')!;
      const bounds2 = result.containerBounds.get('az-2')!;
      const bounds3 = result.containerBounds.get('az-3')!;

      // Gap between containers 1-2 and 2-3 should be equal
      const gap12 = bounds2.x - (bounds1.x + bounds1.width);
      const gap23 = bounds3.x - (bounds2.x + bounds2.width);
      expect(Math.abs(gap12 - gap23)).toBeLessThanOrEqual(1);
    });

    it('should distribute containers vertically with equal spacing', () => {
      const containers: ContainerNode[] = [
        { id: 'az-1', width: 200, height: 150, children: [] },
        { id: 'az-2', width: 200, height: 150, children: [] },
        { id: 'az-3', width: 200, height: 150, children: [] },
      ];

      const result = engine.redistributeContainers(containers, 'vertical');

      const bounds1 = result.containerBounds.get('az-1')!;
      const bounds2 = result.containerBounds.get('az-2')!;
      const bounds3 = result.containerBounds.get('az-3')!;

      // Containers should be stacked vertically
      expect(bounds1.y).toBeLessThan(bounds2.y);
      expect(bounds2.y).toBeLessThan(bounds3.y);

      // Gap between containers should be equal
      const gap12 = bounds2.y - (bounds1.y + bounds1.height);
      const gap23 = bounds3.y - (bounds2.y + bounds2.height);
      expect(Math.abs(gap12 - gap23)).toBeLessThanOrEqual(1);
    });

    it('should vertically centre containers of different heights in horizontal mode', () => {
      const containers: ContainerNode[] = [
        { id: 'az-1', width: 200, height: 200, children: [] },
        { id: 'az-2', width: 200, height: 400, children: [] },
      ];

      const result = engine.redistributeContainers(containers, 'horizontal');

      const bounds1 = result.containerBounds.get('az-1')!;
      const bounds2 = result.containerBounds.get('az-2')!;

      // The shorter container should be centred relative to the taller one
      const centre1 = bounds1.y + bounds1.height / 2;
      const centre2 = bounds2.y + bounds2.height / 2;
      expect(Math.abs(centre1 - centre2)).toBeLessThanOrEqual(1);
    });

    it('should preserve child ordering in positions output', () => {
      // Add components to state that the engine can look up
      const comp1 = createComponent({ id: 'comp-1', size: { width: 48, height: 48 } });
      const comp2 = createComponent({ id: 'comp-2', size: { width: 48, height: 48 } });
      const comp3 = createComponent({ id: 'comp-3', size: { width: 48, height: 48 } });
      state.components.set('comp-1', comp1);
      state.components.set('comp-2', comp2);
      state.components.set('comp-3', comp3);

      const containers: ContainerNode[] = [
        { id: 'az-1', width: 200, height: 200, children: ['comp-1', 'comp-2', 'comp-3'] },
      ];

      const result = engine.redistributeContainers(containers, 'horizontal');

      // All children should have positions
      expect(result.positions.has('comp-1')).toBe(true);
      expect(result.positions.has('comp-2')).toBe(true);
      expect(result.positions.has('comp-3')).toBe(true);

      // Children should be ordered left-to-right (preserving index order)
      const pos1 = result.positions.get('comp-1')!;
      const pos2 = result.positions.get('comp-2')!;
      const pos3 = result.positions.get('comp-3')!;

      // First child comes before second, second before third (by x or y)
      expect(pos1.x <= pos2.x || pos1.y <= pos2.y).toBe(true);
      expect(pos2.x <= pos3.x || pos2.y <= pos3.y).toBe(true);
    });

    it('should place children within container bounds', () => {
      const comp1 = createComponent({ id: 'comp-1', size: { width: 48, height: 48 } });
      const comp2 = createComponent({ id: 'comp-2', size: { width: 48, height: 48 } });
      state.components.set('comp-1', comp1);
      state.components.set('comp-2', comp2);

      const containers: ContainerNode[] = [
        { id: 'az-1', width: 300, height: 200, children: ['comp-1', 'comp-2'] },
      ];

      const result = engine.redistributeContainers(containers, 'horizontal');

      const bounds = result.containerBounds.get('az-1')!;
      const pos1 = result.positions.get('comp-1')!;
      const pos2 = result.positions.get('comp-2')!;

      // Children should be within container bounds
      expect(pos1.x).toBeGreaterThanOrEqual(bounds.x);
      expect(pos1.y).toBeGreaterThanOrEqual(bounds.y);
      expect(pos2.x).toBeGreaterThanOrEqual(bounds.x);
      expect(pos2.y).toBeGreaterThanOrEqual(bounds.y);
    });
  });

  describe('applyLayout', () => {
    it('should update container bounds in diagram state', () => {
      const container = createContainer({ id: 'az-1', bounds: { x: 0, y: 0, width: 100, height: 100 } });
      state.containers.set('az-1', container);

      const result = engine.redistributeContainers(
        [{ id: 'az-1', width: 200, height: 300, children: [] }],
        'horizontal'
      );

      engine.applyLayout(result);

      const updated = state.containers.get('az-1')!;
      expect(updated.bounds.x).toBe(60);
      expect(updated.bounds.y).toBe(60);
      expect(updated.bounds.width).toBe(200);
      expect(updated.bounds.height).toBe(300);
    });

    it('should update component positions in diagram state', () => {
      const comp = createComponent({ id: 'comp-1', position: { x: 0, y: 0 }, size: { width: 48, height: 48 } });
      const container = createContainer({ id: 'az-1' });
      state.components.set('comp-1', comp);
      state.containers.set('az-1', container);

      const result = engine.redistributeContainers(
        [{ id: 'az-1', width: 200, height: 200, children: ['comp-1'] }],
        'horizontal'
      );

      engine.applyLayout(result);

      const updated = state.components.get('comp-1')!;
      // Position should have been updated from (0,0) to computed value
      expect(updated.position.x).toBeGreaterThan(0);
      expect(updated.position.y).toBeGreaterThan(0);
    });

    it('should not modify state entries not in the layout result', () => {
      const comp1 = createComponent({ id: 'comp-1', position: { x: 500, y: 500 } });
      const comp2 = createComponent({ id: 'comp-2', position: { x: 700, y: 700 }, size: { width: 48, height: 48 } });
      state.components.set('comp-1', comp1);
      state.components.set('comp-2', comp2);

      // Only redistribute container with comp-2
      const result = engine.redistributeContainers(
        [{ id: 'az-1', width: 200, height: 200, children: ['comp-2'] }],
        'horizontal'
      );

      engine.applyLayout(result);

      // comp-1 should remain unchanged
      const unchanged = state.components.get('comp-1')!;
      expect(unchanged.position.x).toBe(500);
      expect(unchanged.position.y).toBe(500);
    });
  });

  describe('performance', () => {
    it('should complete layout for 10 containers with 20 children each within 1 second', () => {
      // Populate state with many components
      for (let i = 0; i < 200; i++) {
        state.components.set(
          `comp-${i}`,
          createComponent({ id: `comp-${i}`, size: { width: 48, height: 48 } })
        );
      }

      const containers: ContainerNode[] = [];
      for (let c = 0; c < 10; c++) {
        const children: string[] = [];
        for (let i = 0; i < 20; i++) {
          children.push(`comp-${c * 20 + i}`);
        }
        containers.push({ id: `az-${c}`, width: 400, height: 300, children });
      }

      const start = performance.now();
      engine.redistributeContainers(containers, 'horizontal');
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(1000);
    });
  });
});
