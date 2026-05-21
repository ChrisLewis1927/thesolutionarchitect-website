// ArchLens — Preload script (contextBridge)
// Implemented in Task 1.2

import { contextBridge, ipcRenderer } from 'electron';

/**
 * Typed API stub exposed on window.archlens via contextBridge.
 * Each namespace corresponds to a feature area and will be wired
 * to real IPC handlers in later tasks.
 */
const archLensAPI = {
  ai: {
    ask: (question: string, sessionId: string) =>
      ipcRenderer.invoke('ai.ask', question, sessionId),
    reviewQuick: (filePath: string) =>
      ipcRenderer.invoke('ai.reviewQuick', filePath),
    reviewDeep: (filePath: string) =>
      ipcRenderer.invoke('ai.reviewDeep', filePath),
    switchProvider: (provider: 'openai' | 'gemini') =>
      ipcRenderer.invoke('ai.switchProvider', provider),
    validateKey: (provider: 'openai' | 'gemini', key: string) =>
      ipcRenderer.invoke('ai.validateKey', provider, key),
  },
  documents: {
    upload: (filePath: string) =>
      ipcRenderer.invoke('documents.upload', filePath),
    getSupportedFormats: () =>
      ipcRenderer.invoke('documents.getSupportedFormats'),
  },
  articles: {
    getDaily: () => ipcRenderer.invoke('articles.getDaily'),
    refresh: () => ipcRenderer.invoke('articles.refresh'),
    openInBrowser: (url: string) =>
      ipcRenderer.send('articles.openInBrowser', url),
  },
  learning: {
    getCategories: () => ipcRenderer.invoke('learning.getCategories'),
    getModules: (category: string) =>
      ipcRenderer.invoke('learning.getModules', category),
    completeModule: (moduleId: string) =>
      ipcRenderer.invoke('learning.completeModule', moduleId),
    getNextRecommended: (category: string) =>
      ipcRenderer.invoke('learning.getNextRecommended', category),
  },
  diagrams: {
    getModules: (type?: string) =>
      ipcRenderer.invoke('diagrams.getModules', type),
    getModule: (id: string) =>
      ipcRenderer.invoke('diagrams.getModule', id),
    getReference: () => ipcRenderer.invoke('diagrams.getReference'),
    completeModule: (moduleId: string) =>
      ipcRenderer.invoke('diagrams.completeModule', moduleId),
  },
  career: {
    addCertification: (cert: unknown) =>
      ipcRenderer.invoke('career.addCertification', cert),
    getCertifications: () =>
      ipcRenderer.invoke('career.getCertifications'),
    analyseGaps: (targetRole: string) =>
      ipcRenderer.invoke('career.analyseGaps', targetRole),
    getRecommendations: (targetRole: string) =>
      ipcRenderer.invoke('career.getRecommendations', targetRole),
    getCoverage: (targetRole: string) =>
      ipcRenderer.invoke('career.getCoverage', targetRole),
  },
  progress: {
    getSummary: () => ipcRenderer.invoke('progress.getSummary'),
    getTimeline: (period: 'weekly' | 'monthly' | 'quarterly') =>
      ipcRenderer.invoke('progress.getTimeline', period),
    addJournal: (content: string, tags: string[]) =>
      ipcRenderer.invoke('progress.addJournal', content, tags),
    getJournalEntries: (filter?: object) =>
      ipcRenderer.invoke('progress.getJournalEntries', filter),
    exportReport: (period: string) =>
      ipcRenderer.invoke('progress.exportReport', period),
  },
  guardrails: {
    getTopics: () => ipcRenderer.invoke('guardrails.getTopics'),
    getTopic: (id: string) =>
      ipcRenderer.invoke('guardrails.getTopic', id),
  },
  settings: {
    get: () => ipcRenderer.invoke('settings.get'),
    update: (settings: unknown) =>
      ipcRenderer.invoke('settings.update', settings),
  },
  artifacts: {
    getAll: () => ipcRenderer.invoke('artifacts.getAll'),
    getByCategory: (category: string) => ipcRenderer.invoke('artifacts.getByCategory', category),
    getByPhase: (phase: string) => ipcRenderer.invoke('artifacts.getByPhase', phase),
    getByFramework: (framework: string) => ipcRenderer.invoke('artifacts.getByFramework', framework),
    search: (query: string) => ipcRenderer.invoke('artifacts.search', query),
    getById: (id: string) => ipcRenderer.invoke('artifacts.getById', id),
    generateTemplate: (artifactId: string) => ipcRenderer.invoke('artifacts.generateTemplate', artifactId),
    downloadTemplate: (artifactId: string) => ipcRenderer.invoke('artifacts.downloadTemplate', artifactId),
  },
  infographics: {
    generate: (lessonNumber: number, lessonTitle: string, keyPoints: string[]) =>
      ipcRenderer.invoke('infographics.generate', lessonNumber, lessonTitle, keyPoints),
    getForLesson: (lessonNumber: number) =>
      ipcRenderer.invoke('infographics.getForLesson', lessonNumber),
    getAll: () => ipcRenderer.invoke('infographics.getAll'),
    getImageData: (lessonNumber: number) =>
      ipcRenderer.invoke('infographics.getImageData', lessonNumber),
    download: (lessonNumber: number) =>
      ipcRenderer.invoke('infographics.download', lessonNumber),
    delete: (lessonNumber: number) =>
      ipcRenderer.invoke('infographics.delete', lessonNumber),
  },
  academy: {
    getCurriculum: () => ipcRenderer.invoke('academy.getCurriculum'),
    getLesson: (lessonNumber: number) =>
      ipcRenderer.invoke('academy.getLesson', lessonNumber),
    startLesson: (lessonId: string) =>
      ipcRenderer.invoke('academy.startLesson', lessonId),
    completeLesson: (lessonId: string, quizScore: number, confidenceLevel: number) =>
      ipcRenderer.invoke('academy.completeLesson', lessonId, quizScore, confidenceLevel),
    saveNotes: (lessonId: string, notes: string) =>
      ipcRenderer.invoke('academy.saveNotes', lessonId, notes),
    submitExercise: (
      lessonId: string,
      exerciseType: string,
      question: string,
      userAnswer: string,
      modelAnswer: string,
    ) =>
      ipcRenderer.invoke(
        'academy.submitExercise',
        lessonId,
        exerciseType,
        question,
        userAnswer,
        modelAnswer,
      ),
    getSkillAssessment: () => ipcRenderer.invoke('academy.getSkillAssessment'),
    getRecommendedNext: () => ipcRenderer.invoke('academy.getRecommendedNext'),
    getProgress: () => ipcRenderer.invoke('academy.getProgress'),
  },
};

contextBridge.exposeInMainWorld('archlens', archLensAPI);

export type ArchLensAPI = typeof archLensAPI;
