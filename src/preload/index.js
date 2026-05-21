"use strict";
// ArchLens — Preload script (contextBridge)
// Implemented in Task 1.2
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
/**
 * Typed API stub exposed on window.archlens via contextBridge.
 * Each namespace corresponds to a feature area and will be wired
 * to real IPC handlers in later tasks.
 */
const archLensAPI = {
    ai: {
        ask: (question, sessionId) => electron_1.ipcRenderer.invoke('ai.ask', question, sessionId),
        reviewQuick: (filePath) => electron_1.ipcRenderer.invoke('ai.reviewQuick', filePath),
        reviewDeep: (filePath) => electron_1.ipcRenderer.invoke('ai.reviewDeep', filePath),
        switchProvider: (provider) => electron_1.ipcRenderer.invoke('ai.switchProvider', provider),
        validateKey: (provider, key) => electron_1.ipcRenderer.invoke('ai.validateKey', provider, key),
    },
    documents: {
        upload: (filePath) => electron_1.ipcRenderer.invoke('documents.upload', filePath),
        getSupportedFormats: () => electron_1.ipcRenderer.invoke('documents.getSupportedFormats'),
    },
    articles: {
        getDaily: () => electron_1.ipcRenderer.invoke('articles.getDaily'),
        refresh: () => electron_1.ipcRenderer.invoke('articles.refresh'),
        openInBrowser: (url) => electron_1.ipcRenderer.send('articles.openInBrowser', url),
    },
    learning: {
        getCategories: () => electron_1.ipcRenderer.invoke('learning.getCategories'),
        getModules: (category) => electron_1.ipcRenderer.invoke('learning.getModules', category),
        completeModule: (moduleId) => electron_1.ipcRenderer.invoke('learning.completeModule', moduleId),
        getNextRecommended: (category) => electron_1.ipcRenderer.invoke('learning.getNextRecommended', category),
    },
    diagrams: {
        getModules: (type) => electron_1.ipcRenderer.invoke('diagrams.getModules', type),
        getModule: (id) => electron_1.ipcRenderer.invoke('diagrams.getModule', id),
        getReference: () => electron_1.ipcRenderer.invoke('diagrams.getReference'),
        completeModule: (moduleId) => electron_1.ipcRenderer.invoke('diagrams.completeModule', moduleId),
    },
    career: {
        addCertification: (cert) => electron_1.ipcRenderer.invoke('career.addCertification', cert),
        getCertifications: () => electron_1.ipcRenderer.invoke('career.getCertifications'),
        analyseGaps: (targetRole) => electron_1.ipcRenderer.invoke('career.analyseGaps', targetRole),
        getRecommendations: (targetRole) => electron_1.ipcRenderer.invoke('career.getRecommendations', targetRole),
        getCoverage: (targetRole) => electron_1.ipcRenderer.invoke('career.getCoverage', targetRole),
    },
    progress: {
        getSummary: () => electron_1.ipcRenderer.invoke('progress.getSummary'),
        getTimeline: (period) => electron_1.ipcRenderer.invoke('progress.getTimeline', period),
        addJournal: (content, tags) => electron_1.ipcRenderer.invoke('progress.addJournal', content, tags),
        getJournalEntries: (filter) => electron_1.ipcRenderer.invoke('progress.getJournalEntries', filter),
        exportReport: (period) => electron_1.ipcRenderer.invoke('progress.exportReport', period),
    },
    guardrails: {
        getTopics: () => electron_1.ipcRenderer.invoke('guardrails.getTopics'),
        getTopic: (id) => electron_1.ipcRenderer.invoke('guardrails.getTopic', id),
    },
    settings: {
        get: () => electron_1.ipcRenderer.invoke('settings.get'),
        update: (settings) => electron_1.ipcRenderer.invoke('settings.update', settings),
    },
};
electron_1.contextBridge.exposeInMainWorld('archlens', archLensAPI);
//# sourceMappingURL=index.js.map