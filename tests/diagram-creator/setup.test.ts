/**
 * Smoke test to verify diagram-creator test infrastructure is working.
 * Ensures Vitest + fast-check + happy-dom + test helpers are configured correctly.
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  arbPoint,
  arbDiagramState,
  arbDiagramComponent,
  arbPlatformId,
} from './helpers';
import {
  createEmptyDiagramState,
  createComponent,
  createContainer,
  isPointInRect,
  rectsOverlap,
} from './helpers';

describe('diagram-creator test infrastructure', () => {
  it('should have fast-check available', () => {
    expect(fc).toBeDefined();
    expect(fc.assert).toBeInstanceOf(Function);
  });

  it('should have happy-dom environment', () => {
    expect(document).toBeDefined();
    expect(document.createElement).toBeInstanceOf(Function);
  });

  it('should generate valid points with arbPoint', () => {
    fc.assert(
      fc.property(arbPoint(), (point) => {
        expect(point.x).toBeGreaterThanOrEqual(0);
        expect(point.x).toBeLessThanOrEqual(2000);
        expect(point.y).toBeGreaterThanOrEqual(0);
        expect(point.y).toBeLessThanOrEqual(1500);
      }),
      { numRuns: 50 }
    );
  });

  it('should generate valid diagram states with arbDiagramState', () => {
    fc.assert(
      fc.property(
        arbDiagramState({ minComponents: 1, maxComponents: 3 }),
        (state) => {
          expect(state.id).toBeDefined();
          expect(['aws', 'azure', 'gcp']).toContain(state.platformId);
          expect(state.components).toBeInstanceOf(Map);
          expect(state.containers).toBeInstanceOf(Map);
          expect(state.connectors).toBeInstanceOf(Map);
          expect(state.components.size).toBeGreaterThanOrEqual(1);
          expect(state.components.size).toBeLessThanOrEqual(3);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should create factory components with correct defaults', () => {
    const component = createComponent();
    expect(component.id).toBe('comp-1');
    expect(component.serviceId).toBe('ec2');
    expect(component.position.x).toBe(100);
    expect(component.position.y).toBe(100);
  });

  it('should create factory components with overrides', () => {
    const component = createComponent({
      id: 'custom-id',
      serviceId: 'lambda',
      position: { x: 500, y: 250 },
    });
    expect(component.id).toBe('custom-id');
    expect(component.serviceId).toBe('lambda');
    expect(component.position.x).toBe(500);
  });

  it('should create empty diagram state with specified platform', () => {
    const state = createEmptyDiagramState('azure');
    expect(state.platformId).toBe('azure');
    expect(state.components.size).toBe(0);
    expect(state.containers.size).toBe(0);
    expect(state.connectors.size).toBe(0);
  });

  it('should correctly detect point in rect', () => {
    const rect = { x: 0, y: 0, width: 100, height: 100 };
    expect(isPointInRect({ x: 50, y: 50 }, rect)).toBe(true);
    expect(isPointInRect({ x: 150, y: 50 }, rect)).toBe(false);
  });

  it('should correctly detect overlapping rects', () => {
    const a = { x: 0, y: 0, width: 100, height: 100 };
    const b = { x: 50, y: 50, width: 100, height: 100 };
    const c = { x: 200, y: 200, width: 50, height: 50 };
    expect(rectsOverlap(a, b)).toBe(true);
    expect(rectsOverlap(a, c)).toBe(false);
  });
});
