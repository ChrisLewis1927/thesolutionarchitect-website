import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseManager } from '../../../src/main/services/database';
import {
  CareerTracker,
  Certification,
  DDATData,
  DDAT_LEVEL_ORDER,
} from '../../../src/main/services/career-tracker';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SAMPLE_DDAT: DDATData = {
  roles: {
    'solution-architect': {
      title: 'Solution Architect',
      capabilities: [
        { name: 'Strategic thinking', description: 'Strategic tech thinking', requiredLevel: 'practitioner' },
        { name: 'Cloud and infrastructure', description: 'Cloud platforms', requiredLevel: 'practitioner' },
        { name: 'Security', description: 'Security principles', requiredLevel: 'working' },
        { name: 'Communication', description: 'Communication skills', requiredLevel: 'working' },
      ],
      certificationMappings: [
        { certificationPattern: 'AWS Solutions Architect', capabilities: ['Cloud and infrastructure', 'Security'], levelGranted: 'practitioner' },
        { certificationPattern: 'TOGAF', capabilities: ['Strategic thinking'], levelGranted: 'practitioner' },
        { certificationPattern: 'Security+', capabilities: ['Security'], levelGranted: 'working' },
      ],
    },
    'lead-solution-architect': {
      title: 'Lead Solution Architect',
      capabilities: [
        { name: 'Strategic thinking', description: 'Strategic tech thinking', requiredLevel: 'expert' },
        { name: 'Cloud and infrastructure', description: 'Cloud platforms', requiredLevel: 'expert' },
        { name: 'Security', description: 'Security principles', requiredLevel: 'practitioner' },
      ],
      certificationMappings: [
        { certificationPattern: 'AWS Solutions Architect', capabilities: ['Cloud and infrastructure', 'Security'], levelGranted: 'practitioner' },
        { certificationPattern: 'TOGAF', capabilities: ['Strategic thinking'], levelGranted: 'practitioner' },
        { certificationPattern: 'CISSP', capabilities: ['Security'], levelGranted: 'expert' },
      ],
    },
  },
};

function makeCert(overrides: Partial<Certification> = {}): Certification {
  return {
    id: overrides.id ?? 'cert-1',
    name: overrides.name ?? 'AWS Solutions Architect Associate',
    provider: overrides.provider ?? 'Amazon Web Services',
    dateEarned: overrides.dateEarned ?? new Date('2024-01-15'),
    expiryDate: overrides.expiryDate,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CareerTracker', () => {
  let dbManager: DatabaseManager;
  let tracker: CareerTracker;

  beforeEach(() => {
    dbManager = new DatabaseManager(':memory:');
    dbManager.initialise();
    tracker = new CareerTracker(dbManager.getDatabase());
    tracker.loadDDATDataFromObject(SAMPLE_DDAT);
  });

  afterEach(() => {
    dbManager.close();
  });

  // -----------------------------------------------------------------------
  // addCertification / getCertifications
  // -----------------------------------------------------------------------

  describe('addCertification', () => {
    it('stores a certification and retrieves it', () => {
      const cert = makeCert();
      tracker.addCertification(cert);

      const certs = tracker.getCertifications();
      expect(certs).toHaveLength(1);
      expect(certs[0].name).toBe(cert.name);
      expect(certs[0].provider).toBe(cert.provider);
      expect(certs[0].dateEarned.toISOString()).toBe(cert.dateEarned.toISOString());
    });

    it('stores certification with expiry date', () => {
      const cert = makeCert({ expiryDate: new Date('2027-01-15') });
      tracker.addCertification(cert);

      const certs = tracker.getCertifications();
      expect(certs[0].expiryDate).toBeDefined();
      expect(certs[0].expiryDate!.toISOString()).toBe(cert.expiryDate!.toISOString());
    });

    it('stores certification without expiry date', () => {
      const cert = makeCert();
      tracker.addCertification(cert);

      const certs = tracker.getCertifications();
      expect(certs[0].expiryDate).toBeUndefined();
    });

    it('updates existing certification on conflict', () => {
      const cert = makeCert();
      tracker.addCertification(cert);
      tracker.addCertification({ ...cert, name: 'Updated Name' });

      const certs = tracker.getCertifications();
      expect(certs).toHaveLength(1);
      expect(certs[0].name).toBe('Updated Name');
    });
  });

  // -----------------------------------------------------------------------
  // removeCertification
  // -----------------------------------------------------------------------

  describe('removeCertification', () => {
    it('removes a certification by ID', () => {
      tracker.addCertification(makeCert({ id: 'cert-1' }));
      tracker.addCertification(makeCert({ id: 'cert-2', name: 'TOGAF Certified' }));

      tracker.removeCertification('cert-1');

      const certs = tracker.getCertifications();
      expect(certs).toHaveLength(1);
      expect(certs[0].id).toBe('cert-2');
    });

    it('does nothing when removing non-existent ID', () => {
      tracker.addCertification(makeCert());
      tracker.removeCertification('nonexistent');
      expect(tracker.getCertifications()).toHaveLength(1);
    });
  });

  // -----------------------------------------------------------------------
  // analyseGaps
  // -----------------------------------------------------------------------

  describe('analyseGaps', () => {
    it('returns gaps for all capabilities when no certifications exist', () => {
      const gaps = tracker.analyseGaps('solution-architect');
      // All capabilities should be gaps since user has no certs (defaults to awareness)
      expect(gaps.length).toBeGreaterThan(0);
      for (const gap of gaps) {
        expect(DDAT_LEVEL_ORDER[gap.currentLevel]).toBeLessThan(DDAT_LEVEL_ORDER[gap.targetLevel]);
      }
    });

    it('reduces gaps when matching certifications are added', () => {
      const gapsBefore = tracker.analyseGaps('solution-architect');

      tracker.addCertification(makeCert({ name: 'AWS Solutions Architect Associate' }));
      const gapsAfter = tracker.analyseGaps('solution-architect');

      expect(gapsAfter.length).toBeLessThan(gapsBefore.length);
    });

    it('returns empty array for unknown role', () => {
      expect(tracker.analyseGaps('nonexistent-role')).toEqual([]);
    });

    it('only returns genuine gaps where currentLevel < targetLevel', () => {
      tracker.addCertification(makeCert({ name: 'AWS Solutions Architect Associate' }));
      const gaps = tracker.analyseGaps('solution-architect');

      for (const gap of gaps) {
        expect(DDAT_LEVEL_ORDER[gap.currentLevel]).toBeLessThan(DDAT_LEVEL_ORDER[gap.targetLevel]);
      }
    });

    it('includes recommendations for each gap', () => {
      const gaps = tracker.analyseGaps('solution-architect');
      for (const gap of gaps) {
        expect(gap.recommendations.length).toBeGreaterThan(0);
        for (const rec of gap.recommendations) {
          expect(rec.relevantCapability).toBe(gap.capability);
        }
      }
    });
  });

  // -----------------------------------------------------------------------
  // getRecommendations
  // -----------------------------------------------------------------------

  describe('getRecommendations', () => {
    it('returns all recommendations across all gaps', () => {
      const recs = tracker.getRecommendations('solution-architect');
      expect(recs.length).toBeGreaterThan(0);
    });

    it('returns empty array for unknown role', () => {
      expect(tracker.getRecommendations('nonexistent')).toEqual([]);
    });

    it('all recommendations reference valid DDAT capabilities', () => {
      const role = SAMPLE_DDAT.roles['solution-architect'];
      const capNames = role.capabilities.map((c) => c.name);
      const recs = tracker.getRecommendations('solution-architect');

      for (const rec of recs) {
        expect(capNames).toContain(rec.relevantCapability);
      }
    });
  });

  // -----------------------------------------------------------------------
  // getCapabilityCoverage
  // -----------------------------------------------------------------------

  describe('getCapabilityCoverage', () => {
    it('returns 0% coverage when no certifications exist (awareness vs higher)', () => {
      const coverage = tracker.getCapabilityCoverage('solution-architect');
      expect(coverage.capabilities.length).toBe(4);
      // awareness = 0, so coverage against practitioner (2) or working (1) = 0%
      for (const cap of coverage.capabilities) {
        expect(cap.coveragePercent).toBe(0);
      }
      expect(coverage.overallCoveragePercent).toBe(0);
    });

    it('returns increased coverage when certifications are added', () => {
      tracker.addCertification(makeCert({ name: 'AWS Solutions Architect Associate' }));
      const coverage = tracker.getCapabilityCoverage('solution-architect');

      // Cloud and infrastructure: practitioner(2) / practitioner(2) = 100%
      const cloudCap = coverage.capabilities.find((c) => c.name === 'Cloud and infrastructure');
      expect(cloudCap).toBeDefined();
      expect(cloudCap!.coveragePercent).toBe(100);

      expect(coverage.overallCoveragePercent).toBeGreaterThan(0);
    });

    it('all coverage percentages are between 0 and 100', () => {
      tracker.addCertification(makeCert({ name: 'AWS Solutions Architect Associate' }));
      tracker.addCertification(makeCert({ id: 'cert-2', name: 'TOGAF Certified' }));

      const coverage = tracker.getCapabilityCoverage('solution-architect');
      for (const cap of coverage.capabilities) {
        expect(cap.coveragePercent).toBeGreaterThanOrEqual(0);
        expect(cap.coveragePercent).toBeLessThanOrEqual(100);
      }
      expect(coverage.overallCoveragePercent).toBeGreaterThanOrEqual(0);
      expect(coverage.overallCoveragePercent).toBeLessThanOrEqual(100);
    });

    it('overall coverage is the arithmetic mean of individual coverages', () => {
      tracker.addCertification(makeCert({ name: 'AWS Solutions Architect Associate' }));
      const coverage = tracker.getCapabilityCoverage('solution-architect');

      const expectedMean =
        coverage.capabilities.reduce((sum, c) => sum + c.coveragePercent, 0) /
        coverage.capabilities.length;

      expect(Math.abs(coverage.overallCoveragePercent - Math.round(expectedMean * 100) / 100)).toBeLessThan(0.01);
    });

    it('returns empty coverage for unknown role', () => {
      const coverage = tracker.getCapabilityCoverage('nonexistent');
      expect(coverage.capabilities).toEqual([]);
      expect(coverage.overallCoveragePercent).toBe(0);
    });
  });

  // -----------------------------------------------------------------------
  // loadDDATData
  // -----------------------------------------------------------------------

  describe('loadDDATData', () => {
    it('handles non-existent file gracefully', () => {
      const freshTracker = new CareerTracker(dbManager.getDatabase());
      freshTracker.loadDDATData('/nonexistent/path.json');
      expect(freshTracker.analyseGaps('solution-architect')).toEqual([]);
    });
  });

  // -----------------------------------------------------------------------
  // Certification pattern matching
  // -----------------------------------------------------------------------

  describe('certification pattern matching', () => {
    it('matches case-insensitively', () => {
      tracker.addCertification(makeCert({ name: 'aws solutions architect professional' }));
      const gaps = tracker.analyseGaps('solution-architect');

      // Should match "AWS Solutions Architect" pattern
      const cloudGap = gaps.find((g) => g.capability === 'Cloud and infrastructure');
      // Cloud should be covered at practitioner level, so no gap for solution-architect role
      expect(cloudGap).toBeUndefined();
    });

    it('matches substring patterns', () => {
      tracker.addCertification(makeCert({ name: 'My TOGAF 9.2 Foundation Certificate' }));
      const gaps = tracker.analyseGaps('solution-architect');

      const strategicGap = gaps.find((g) => g.capability === 'Strategic thinking');
      // TOGAF grants practitioner for Strategic thinking, which matches the target
      expect(strategicGap).toBeUndefined();
    });
  });
});
