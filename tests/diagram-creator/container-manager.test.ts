/**
 * Unit tests for the ContainerManager class.
 * Tests parent-child linking, bounds recalculation, point detection,
 * nesting level computation, and container style assignment.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { ContainerManager } from '../../js/diagram-creator/container-manager';
import { createEmptyDiagramState, createComponent, createContainer } from './helpers';
import type { DiagramState } from '../../js/diagram-creator/types';

describe('ContainerManager', () => {
  let state: DiagramState;
  let manager: ContainerManager;

  beforeEach(() => {
    state = createEmptyDiagramState('aws');
    manager = new ContainerManager(state);
  });

  describe('addChildToContainer', () => {
    it('should add a component to a container childIds', () => {
      const container = createContainer({ id: 'vpc-1', childIds: [] });
      const component = createComponent({ id: 'comp-1', containerId: null });
      state.containers.set('vpc-1', container);
      state.components.set('comp-1', component);

      manager.addChildToContainer('vpc-1', 'comp-1');

      expect(container.childIds).toContain('comp-1');
      expect(component.containerId).toBe('vpc-1');
    });

    it('should not duplicate childId if already present', () => {
      const container = createContainer({ id: 'vpc-1', childIds: ['comp-1'] });
      const component = createComponent({ id: 'comp-1', containerId: 'vpc-1' });
      state.containers.set('vpc-1', container);
      state.components.set('comp-1', component);

      manager.addChildToContainer('vpc-1', 'comp-1');

      expect(container.childIds.filter((id) => id === 'comp-1')).toHaveLength(1);
    });

    it('should set parentId on nested containers', () => {
      const parent = createContainer({ id: 'vpc-1', childIds: [] });
      const child = createContainer({ id: 'subnet-1', parentId: null, childIds: [] });
      state.containers.set('vpc-1', parent);
      state.containers.set('subnet-1', child);

      manager.addChildToContainer('vpc-1', 'subnet-1');

      expect(parent.childIds).toContain('subnet-1');
      expect(child.parentId).toBe('vpc-1');
    });

    it('should do nothing if container does not exist', () => {
      const component = createComponent({ id: 'comp-1' });
      state.components.set('comp-1', component);

      // Should not throw
      manager.addChildToContainer('nonexistent', 'comp-1');
      expect(component.containerId).toBeNull();
    });
  });

  describe('removeChildFromContainer', () => {
    it('should remove a component from container childIds', () => {
      const container = createContainer({ id: 'vpc-1', childIds: ['comp-1'] });
      const component = createComponent({ id: 'comp-1', containerId: 'vpc-1' });
      state.containers.set('vpc-1', container);
      state.components.set('comp-1', component);

      manager.removeChildFromContainer('vpc-1', 'comp-1');

      expect(container.childIds).not.toContain('comp-1');
      expect(component.containerId).toBeNull();
    });

    it('should set parentId to null for nested containers', () => {
      const parent = createContainer({ id: 'vpc-1', childIds: ['subnet-1'] });
      const child = createContainer({ id: 'subnet-1', parentId: 'vpc-1', childIds: [] });
      state.containers.set('vpc-1', parent);
      state.containers.set('subnet-1', child);

      manager.removeChildFromContainer('vpc-1', 'subnet-1');

      expect(parent.childIds).not.toContain('subnet-1');
      expect(child.parentId).toBeNull();
    });

    it('should do nothing if container does not exist', () => {
      const component = createComponent({ id: 'comp-1', containerId: 'vpc-1' });
      state.components.set('comp-1', component);

      manager.removeChildFromContainer('nonexistent', 'comp-1');
      // containerId is unchanged because the container wasn't found
      expect(component.containerId).toBe('vpc-1');
    });
  });

  describe('recalculateBounds', () => {
    it('should encompass all child components with padding', () => {
      const comp1 = createComponent({ id: 'comp-1', position: { x: 100, y: 100 }, size: { width: 48, height: 48 } });
      const comp2 = createComponent({ id: 'comp-2', position: { x: 200, y: 200 }, size: { width: 48, height: 48 } });
      const container = createContainer({ id: 'vpc-1', childIds: ['comp-1', 'comp-2'] });

      state.components.set('comp-1', comp1);
      state.components.set('comp-2', comp2);
      state.containers.set('vpc-1', container);

      const bounds = manager.recalculateBounds('vpc-1');

      // With 20px padding: x should be 100-20=80, y should be 100-20=80
      // Width should encompass from 80 to 248+20=268, so width=188
      // Height should encompass from 80 to 248+20=268, so height=188
      expect(bounds.x).toBe(80);
      expect(bounds.y).toBe(80);
      expect(bounds.width).toBe(188);
      expect(bounds.height).toBe(188);
    });

    it('should return minimum dimensions for empty container', () => {
      const container = createContainer({
        id: 'vpc-1',
        childIds: [],
        bounds: { x: 50, y: 50, width: 400, height: 300 },
      });
      state.containers.set('vpc-1', container);

      const bounds = manager.recalculateBounds('vpc-1');

      expect(bounds.x).toBe(50);
      expect(bounds.y).toBe(50);
      expect(bounds.width).toBeGreaterThanOrEqual(100);
      expect(bounds.height).toBeGreaterThanOrEqual(80);
    });

    it('should handle nested containers as children', () => {
      const childContainer = createContainer({
        id: 'subnet-1',
        bounds: { x: 150, y: 150, width: 200, height: 100 },
        childIds: [],
      });
      const parent = createContainer({
        id: 'vpc-1',
        childIds: ['subnet-1'],
      });

      state.containers.set('subnet-1', childContainer);
      state.containers.set('vpc-1', parent);

      const bounds = manager.recalculateBounds('vpc-1');

      // Should encompass subnet-1's bounds (150,150,200,100) with 20px padding
      expect(bounds.x).toBe(130); // 150 - 20
      expect(bounds.y).toBe(130); // 150 - 20
      expect(bounds.width).toBe(240); // 200 + 40
      expect(bounds.height).toBe(140); // 100 + 40
    });

    it('should return default rect for nonexistent container', () => {
      const bounds = manager.recalculateBounds('nonexistent');
      expect(bounds).toEqual({ x: 0, y: 0, width: 100, height: 80 });
    });
  });

  describe('getContainerAtPoint', () => {
    it('should return the container that contains the point', () => {
      const container = createContainer({
        id: 'vpc-1',
        bounds: { x: 0, y: 0, width: 500, height: 500 },
        parentId: null,
      });
      state.containers.set('vpc-1', container);

      const result = manager.getContainerAtPoint({ x: 250, y: 250 });
      expect(result).toBe('vpc-1');
    });

    it('should return null if no container contains the point', () => {
      const container = createContainer({
        id: 'vpc-1',
        bounds: { x: 0, y: 0, width: 100, height: 100 },
      });
      state.containers.set('vpc-1', container);

      const result = manager.getContainerAtPoint({ x: 500, y: 500 });
      expect(result).toBeNull();
    });

    it('should return the deepest nested container at the point', () => {
      // Parent container (level 0)
      const parent = createContainer({
        id: 'vpc-1',
        bounds: { x: 0, y: 0, width: 500, height: 500 },
        parentId: null,
        childIds: ['subnet-1'],
      });
      // Child container (level 1)
      const child = createContainer({
        id: 'subnet-1',
        bounds: { x: 50, y: 50, width: 200, height: 200 },
        parentId: 'vpc-1',
        childIds: [],
      });

      state.containers.set('vpc-1', parent);
      state.containers.set('subnet-1', child);

      const result = manager.getContainerAtPoint({ x: 100, y: 100 });
      expect(result).toBe('subnet-1');
    });
  });

  describe('getNestingLevel', () => {
    it('should return 0 for a top-level container', () => {
      const container = createContainer({ id: 'vpc-1', parentId: null });
      state.containers.set('vpc-1', container);

      expect(manager.getNestingLevel('vpc-1')).toBe(0);
    });

    it('should return 1 for a container nested one level deep', () => {
      const parent = createContainer({ id: 'region-1', parentId: null, childIds: ['vpc-1'] });
      const child = createContainer({ id: 'vpc-1', parentId: 'region-1', childIds: [] });
      state.containers.set('region-1', parent);
      state.containers.set('vpc-1', child);

      expect(manager.getNestingLevel('vpc-1')).toBe(1);
    });

    it('should return correct level for deeply nested containers', () => {
      // 3 levels: region -> vpc -> subnet
      const region = createContainer({ id: 'region-1', parentId: null, childIds: ['vpc-1'] });
      const vpc = createContainer({ id: 'vpc-1', parentId: 'region-1', childIds: ['subnet-1'] });
      const subnet = createContainer({ id: 'subnet-1', parentId: 'vpc-1', childIds: [] });

      state.containers.set('region-1', region);
      state.containers.set('vpc-1', vpc);
      state.containers.set('subnet-1', subnet);

      expect(manager.getNestingLevel('region-1')).toBe(0);
      expect(manager.getNestingLevel('vpc-1')).toBe(1);
      expect(manager.getNestingLevel('subnet-1')).toBe(2);
    });
  });

  describe('getContainerStyle', () => {
    it('should return a ContainerStyle with all required properties', () => {
      const style = manager.getContainerStyle(0);
      expect(style).toHaveProperty('borderColor');
      expect(style).toHaveProperty('backgroundColor');
      expect(style).toHaveProperty('borderRadius');
      expect(style).toHaveProperty('padding');
    });

    it('should return distinct styles for different levels', () => {
      const style0 = manager.getContainerStyle(0);
      const style1 = manager.getContainerStyle(1);
      const style2 = manager.getContainerStyle(2);

      expect(style0.backgroundColor).not.toBe(style1.backgroundColor);
      expect(style1.backgroundColor).not.toBe(style2.backgroundColor);
      expect(style0.backgroundColor).not.toBe(style2.backgroundColor);
    });

    it('should support at least 6 distinct levels', () => {
      const styles = new Set<string>();
      for (let i = 0; i < 6; i++) {
        styles.add(manager.getContainerStyle(i).backgroundColor);
      }
      expect(styles.size).toBe(6);
    });

    it('should cycle styles for levels beyond the defined count', () => {
      const style0 = manager.getContainerStyle(0);
      const style6 = manager.getContainerStyle(6);
      // Level 6 should cycle back to level 0
      expect(style6.backgroundColor).toBe(style0.backgroundColor);
    });
  });
});
