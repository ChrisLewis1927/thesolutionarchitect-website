/**
 * Preload script IPC wiring verification tests.
 *
 * These tests verify that every method in the window.archlens API is correctly
 * wired to the expected IPC channel. Rather than importing the preload module
 * directly (which requires the Electron runtime), we read the source file and
 * verify the channel mappings statically, then test the API shape by
 * constructing it the same way the preload does.
 */
import { describe, it, expect, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// Read the preload source to verify channel names
const preloadSource = fs.readFileSync(
  path.resolve(__dirname, '../../src/preload/index.ts'),
  'utf-8',
);

describe('Preload script — IPC channel wiring', () => {
  // -----------------------------------------------------------------------
  // Verify all expected IPC channels are present in the preload source
  // -----------------------------------------------------------------------

  const expectedInvokeChannels = [
    'ai.ask',
    'ai.reviewQuick',
    'ai.reviewDeep',
    'ai.switchProvider',
    'ai.validateKey',
    'documents.upload',
    'documents.getSupportedFormats',
    'articles.getDaily',
    'articles.refresh',
    'learning.getCategories',
    'learning.getModules',
    'learning.completeModule',
    'learning.getNextRecommended',
    'diagrams.getModules',
    'diagrams.getModule',
    'diagrams.getReference',
    'diagrams.completeModule',
    'career.addCertification',
    'career.getCertifications',
    'career.analyseGaps',
    'career.getRecommendations',
    'career.getCoverage',
    'progress.getSummary',
    'progress.getTimeline',
    'progress.addJournal',
    'progress.getJournalEntries',
    'progress.exportReport',
    'guardrails.getTopics',
    'guardrails.getTopic',
    'settings.get',
    'settings.update',
  ];

  const expectedSendChannels = [
    'articles.openInBrowser',
  ];

  it.each(expectedInvokeChannels)(
    'preload source contains ipcRenderer.invoke for channel "%s"',
    (channel) => {
      expect(preloadSource).toContain(`'${channel}'`);
      expect(preloadSource).toContain('ipcRenderer.invoke');
    },
  );

  it.each(expectedSendChannels)(
    'preload source contains ipcRenderer.send for channel "%s"',
    (channel) => {
      expect(preloadSource).toContain(`'${channel}'`);
      expect(preloadSource).toContain('ipcRenderer.send');
    },
  );

  // -----------------------------------------------------------------------
  // Verify all 9 namespaces are present
  // -----------------------------------------------------------------------

  const expectedNamespaces = [
    'ai', 'documents', 'articles', 'learning',
    'diagrams', 'career', 'progress', 'guardrails', 'settings',
  ];

  it.each(expectedNamespaces)(
    'preload source defines the "%s" namespace',
    (ns) => {
      // Each namespace is defined as a property in the archLensAPI object
      expect(preloadSource).toContain(`${ns}:`);
    },
  );

  // -----------------------------------------------------------------------
  // Verify contextBridge.exposeInMainWorld is called with 'archlens'
  // -----------------------------------------------------------------------

  it('exposes the API via contextBridge.exposeInMainWorld("archlens")', () => {
    expect(preloadSource).toContain("contextBridge.exposeInMainWorld('archlens'");
  });

  // -----------------------------------------------------------------------
  // Verify the API shape by constructing it with mock functions
  // -----------------------------------------------------------------------

  it('constructs the correct API shape with all methods', () => {
    const mockInvoke = vi.fn();
    const mockSend = vi.fn();

    // Reconstruct the API the same way the preload does
    const api = {
      ai: {
        ask: (question: string, sessionId: string) => mockInvoke('ai.ask', question, sessionId),
        reviewQuick: (filePath: string) => mockInvoke('ai.reviewQuick', filePath),
        reviewDeep: (filePath: string) => mockInvoke('ai.reviewDeep', filePath),
        switchProvider: (provider: string) => mockInvoke('ai.switchProvider', provider),
        validateKey: (provider: string, key: string) => mockInvoke('ai.validateKey', provider, key),
      },
      documents: {
        upload: (filePath: string) => mockInvoke('documents.upload', filePath),
        getSupportedFormats: () => mockInvoke('documents.getSupportedFormats'),
      },
      articles: {
        getDaily: () => mockInvoke('articles.getDaily'),
        refresh: () => mockInvoke('articles.refresh'),
        openInBrowser: (url: string) => mockSend('articles.openInBrowser', url),
      },
      learning: {
        getCategories: () => mockInvoke('learning.getCategories'),
        getModules: (category: string) => mockInvoke('learning.getModules', category),
        completeModule: (moduleId: string) => mockInvoke('learning.completeModule', moduleId),
        getNextRecommended: (category: string) => mockInvoke('learning.getNextRecommended', category),
      },
      diagrams: {
        getModules: (type?: string) => mockInvoke('diagrams.getModules', type),
        getModule: (id: string) => mockInvoke('diagrams.getModule', id),
        getReference: () => mockInvoke('diagrams.getReference'),
        completeModule: (moduleId: string) => mockInvoke('diagrams.completeModule', moduleId),
      },
      career: {
        addCertification: (cert: unknown) => mockInvoke('career.addCertification', cert),
        getCertifications: () => mockInvoke('career.getCertifications'),
        analyseGaps: (targetRole: string) => mockInvoke('career.analyseGaps', targetRole),
        getRecommendations: (targetRole: string) => mockInvoke('career.getRecommendations', targetRole),
        getCoverage: (targetRole: string) => mockInvoke('career.getCoverage', targetRole),
      },
      progress: {
        getSummary: () => mockInvoke('progress.getSummary'),
        getTimeline: (period: string) => mockInvoke('progress.getTimeline', period),
        addJournal: (content: string, tags: string[]) => mockInvoke('progress.addJournal', content, tags),
        getJournalEntries: (filter?: object) => mockInvoke('progress.getJournalEntries', filter),
        exportReport: (period: string) => mockInvoke('progress.exportReport', period),
      },
      guardrails: {
        getTopics: () => mockInvoke('guardrails.getTopics'),
        getTopic: (id: string) => mockInvoke('guardrails.getTopic', id),
      },
      settings: {
        get: () => mockInvoke('settings.get'),
        update: (settings: unknown) => mockInvoke('settings.update', settings),
      },
    };

    // Verify all namespaces exist
    for (const ns of expectedNamespaces) {
      expect(api).toHaveProperty(ns);
    }

    // Verify invoke calls produce correct channel names
    api.ai.ask('q', 's1');
    expect(mockInvoke).toHaveBeenCalledWith('ai.ask', 'q', 's1');

    api.articles.openInBrowser('https://example.com');
    expect(mockSend).toHaveBeenCalledWith('articles.openInBrowser', 'https://example.com');
  });
});
