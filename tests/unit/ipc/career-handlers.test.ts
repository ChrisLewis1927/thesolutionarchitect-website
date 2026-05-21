import { describe, it, expect, beforeEach, vi } from 'vitest';
import type {
  CareerTracker,
  Certification,
  SkillGap,
  Recommendation,
  CapabilityCoverage,
} from '../../../src/main/services/career-tracker';

// ---------------------------------------------------------------------------
// Mock Electron's ipcMain
// ---------------------------------------------------------------------------

const handlers = new Map<string, (...args: unknown[]) => unknown>();

vi.mock('electron', () => ({
  ipcMain: {
    handle: (channel: string, handler: (...args: unknown[]) => unknown) => {
      handlers.set(channel, handler);
    },
  },
}));

// Import after mock is set up
import { registerCareerHandlers } from '../../../src/main/ipc/career-handlers';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const sampleCert: Certification = {
  id: 'cert-1',
  name: 'AWS Solutions Architect Associate',
  provider: 'Amazon Web Services',
  dateEarned: new Date('2024-01-15'),
  expiryDate: new Date('2027-01-15'),
};

const sampleGap: SkillGap = {
  capability: 'Security Architecture',
  currentLevel: 'working',
  targetLevel: 'practitioner',
  recommendations: [
    {
      type: 'certification',
      title: 'CISSP',
      provider: 'ISC2',
      relevantCapability: 'Security Architecture',
    },
  ],
};

const sampleRecommendation: Recommendation = {
  type: 'certification',
  title: 'CISSP',
  provider: 'ISC2',
  relevantCapability: 'Security Architecture',
};

const sampleCoverage: CapabilityCoverage = {
  capabilities: [
    {
      name: 'Security Architecture',
      currentLevel: 'working',
      targetLevel: 'practitioner',
      coveragePercent: 50,
    },
  ],
  overallCoveragePercent: 50,
};

function createMockTracker(overrides: Partial<CareerTracker> = {}): CareerTracker {
  return {
    addCertification: vi.fn<(cert: Certification) => void>(),
    removeCertification: vi.fn<(id: string) => void>(),
    getCertifications: vi.fn<() => Certification[]>().mockReturnValue([sampleCert]),
    analyseGaps: vi.fn<(targetRole: string) => SkillGap[]>().mockReturnValue([sampleGap]),
    getRecommendations: vi
      .fn<(targetRole: string) => Recommendation[]>()
      .mockReturnValue([sampleRecommendation]),
    getCapabilityCoverage: vi
      .fn<(targetRole: string) => CapabilityCoverage>()
      .mockReturnValue(sampleCoverage),
    loadDDATData: vi.fn(),
    loadDDATDataFromObject: vi.fn(),
    ...overrides,
  } as unknown as CareerTracker;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Career IPC Handlers', () => {
  let tracker: CareerTracker;

  beforeEach(() => {
    handlers.clear();
    tracker = createMockTracker();
    registerCareerHandlers(tracker);
  });

  it('registers all five career channels', () => {
    expect(handlers.has('career.addCertification')).toBe(true);
    expect(handlers.has('career.getCertifications')).toBe(true);
    expect(handlers.has('career.analyseGaps')).toBe(true);
    expect(handlers.has('career.getRecommendations')).toBe(true);
    expect(handlers.has('career.getCoverage')).toBe(true);
  });

  // -------------------------------------------------------------------------
  // career.addCertification
  // -------------------------------------------------------------------------

  describe('career.addCertification', () => {
    it('returns ipcSuccess on successful add', async () => {
      const handler = handlers.get('career.addCertification')!;
      const result = (await handler({}, sampleCert)) as { success: boolean; data: undefined };

      expect(result.success).toBe(true);
      expect(result.data).toBeUndefined();
      expect(tracker.addCertification).toHaveBeenCalledWith(sampleCert);
    });

    it('returns ipcError when addCertification throws', async () => {
      tracker = createMockTracker({
        addCertification: vi.fn().mockImplementation(() => {
          throw new Error('DB write failed');
        }),
      });
      handlers.clear();
      registerCareerHandlers(tracker);

      const handler = handlers.get('career.addCertification')!;
      const result = (await handler({}, sampleCert)) as {
        success: boolean;
        error: { code: string };
      };

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('UNKNOWN_ERROR');
    });
  });

  // -------------------------------------------------------------------------
  // career.getCertifications
  // -------------------------------------------------------------------------

  describe('career.getCertifications', () => {
    it('returns ipcSuccess with certifications', async () => {
      const handler = handlers.get('career.getCertifications')!;
      const result = (await handler()) as { success: boolean; data: Certification[] };

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('AWS Solutions Architect Associate');
      expect(tracker.getCertifications).toHaveBeenCalled();
    });

    it('returns ipcError when getCertifications throws', async () => {
      tracker = createMockTracker({
        getCertifications: vi.fn().mockImplementation(() => {
          throw new Error('DB read failed');
        }),
      });
      handlers.clear();
      registerCareerHandlers(tracker);

      const handler = handlers.get('career.getCertifications')!;
      const result = (await handler()) as { success: boolean; error: { code: string } };

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('UNKNOWN_ERROR');
    });
  });

  // -------------------------------------------------------------------------
  // career.analyseGaps
  // -------------------------------------------------------------------------

  describe('career.analyseGaps', () => {
    it('returns ipcSuccess with gaps for a target role', async () => {
      const handler = handlers.get('career.analyseGaps')!;
      const result = (await handler({}, 'lead-solution-architect')) as {
        success: boolean;
        data: SkillGap[];
      };

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].capability).toBe('Security Architecture');
      expect(tracker.analyseGaps).toHaveBeenCalledWith('lead-solution-architect');
    });

    it('returns ipcError when analyseGaps throws', async () => {
      tracker = createMockTracker({
        analyseGaps: vi.fn().mockImplementation(() => {
          throw new Error('Analysis failed');
        }),
      });
      handlers.clear();
      registerCareerHandlers(tracker);

      const handler = handlers.get('career.analyseGaps')!;
      const result = (await handler({}, 'lead-solution-architect')) as {
        success: boolean;
        error: { code: string };
      };

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('UNKNOWN_ERROR');
    });
  });

  // -------------------------------------------------------------------------
  // career.getRecommendations
  // -------------------------------------------------------------------------

  describe('career.getRecommendations', () => {
    it('returns ipcSuccess with recommendations', async () => {
      const handler = handlers.get('career.getRecommendations')!;
      const result = (await handler({}, 'lead-solution-architect')) as {
        success: boolean;
        data: Recommendation[];
      };

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].title).toBe('CISSP');
      expect(tracker.getRecommendations).toHaveBeenCalledWith('lead-solution-architect');
    });

    it('returns ipcError when getRecommendations throws', async () => {
      tracker = createMockTracker({
        getRecommendations: vi.fn().mockImplementation(() => {
          throw new Error('Unexpected');
        }),
      });
      handlers.clear();
      registerCareerHandlers(tracker);

      const handler = handlers.get('career.getRecommendations')!;
      const result = (await handler({}, 'lead-solution-architect')) as {
        success: boolean;
        error: { code: string };
      };

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('UNKNOWN_ERROR');
    });
  });

  // -------------------------------------------------------------------------
  // career.getCoverage
  // -------------------------------------------------------------------------

  describe('career.getCoverage', () => {
    it('returns ipcSuccess with coverage data', async () => {
      const handler = handlers.get('career.getCoverage')!;
      const result = (await handler({}, 'lead-solution-architect')) as {
        success: boolean;
        data: CapabilityCoverage;
      };

      expect(result.success).toBe(true);
      expect(result.data.overallCoveragePercent).toBe(50);
      expect(result.data.capabilities).toHaveLength(1);
      expect(tracker.getCapabilityCoverage).toHaveBeenCalledWith('lead-solution-architect');
    });

    it('returns ipcError when getCapabilityCoverage throws', async () => {
      tracker = createMockTracker({
        getCapabilityCoverage: vi.fn().mockImplementation(() => {
          throw new Error('Unexpected');
        }),
      });
      handlers.clear();
      registerCareerHandlers(tracker);

      const handler = handlers.get('career.getCoverage')!;
      const result = (await handler({}, 'lead-solution-architect')) as {
        success: boolean;
        error: { code: string };
      };

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('UNKNOWN_ERROR');
    });
  });
});
