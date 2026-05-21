// ArchLens — Electron main process entry point
// Implemented in Task 1.2, wired in Task 20.1

import { app, BrowserWindow, safeStorage } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import log from 'electron-log';

// IPC handler registrations
import { registerAIHandlers } from './ipc/ai-handlers';
import { registerDocumentHandlers } from './ipc/document-handlers';
import { registerArticleHandlers } from './ipc/article-handlers';
import { registerLearningHandlers } from './ipc/learning-handlers';
import { registerDiagramHandlers } from './ipc/diagram-handlers';
import { registerCareerHandlers } from './ipc/career-handlers';
import { registerProgressHandlers } from './ipc/progress-handlers';
import { registerGuardrailsHandlers } from './ipc/guardrails-handlers';
import { registerSettingsHandlers } from './ipc/settings-handlers';
import { registerAcademyHandlers } from './ipc/academy-handlers';
import { registerArtifactHandlers } from './ipc/artifact-handlers';
import { registerInfographicHandlers } from './ipc/infographic-handlers';

// Services
import { DatabaseManager } from './services/database';
import { AIService } from './services/ai-service';
import { createDocumentParser } from './services/document-parser';
import { ArticleCurator, FeedConfig, ArticleCategory } from './services/article-curator';
import { LearningEngine } from './services/learning-engine';
import { DiagramCoach } from './services/diagram-coach';
import { CareerTracker } from './services/career-tracker';
import { ProgressService } from './services/progress-service';
import { GuardrailsService } from './services/guardrails-service';
import { SettingsService, SafeStorageAdapter } from './services/settings-service';
import { AcademyService } from './services/academy-service';
import { ArtifactService } from './services/artifact-service';
import { InfographicService } from './services/infographic-service';

// Configure electron-log
log.transports.file.level = 'info';
log.transports.console.level = 'debug';
log.errorHandler.startCatching();

let mainWindow: BrowserWindow | null = null;

// ---------------------------------------------------------------------------
// Resource path helper — works in both dev and packaged builds
// ---------------------------------------------------------------------------

function getResourcePath(...segments: string[]): string {
  // In packaged builds, extraResources are placed next to the app.asar
  const basePath = app.isPackaged
    ? path.join(process.resourcesPath, 'resources')
    : path.join(__dirname, '..', '..', 'resources');
  return path.join(basePath, ...segments);
}

// ---------------------------------------------------------------------------
// Seed default certifications on first launch
// ---------------------------------------------------------------------------

function seedCertifications(db: import('better-sqlite3').Database): void {
  const count = db.prepare('SELECT COUNT(*) as cnt FROM certifications').get() as { cnt: number };
  if (count.cnt > 0) return; // Already seeded

  const certs = [
    { name: 'TOGAF Enterprise Architecture Foundation', provider: 'The Open Group', category: 'Architecture & Frameworks' },
    { name: 'ITIL 4 Foundation', provider: 'Axelos', category: 'Architecture & Frameworks' },
    { name: 'BCS Foundation in Business Analysis', provider: 'BCS', category: 'Architecture & Frameworks' },
    { name: 'Microsoft Certified: Azure Administrator Associate', provider: 'Microsoft', category: 'Cloud & Data Platforms' },
    { name: 'Oracle Cloud Infrastructure Architect Associate', provider: 'Oracle', category: 'Cloud & Data Platforms' },
    { name: 'Oracle Cloud Infrastructure Application Integration Professional', provider: 'Oracle', category: 'Cloud & Data Platforms' },
    { name: 'Oracle Cloud Data Management Certified Associate', provider: 'Oracle', category: 'Cloud & Data Platforms' },
    { name: 'Oracle Fusion Analytics Warehouse Professional', provider: 'Oracle', category: 'Cloud & Data Platforms' },
    { name: 'Oracle Sales Cloud Certified Implementation Specialist', provider: 'Oracle', category: 'Cloud & Data Platforms' },
    { name: 'Oracle AI in Fusion CX', provider: 'Oracle', category: 'Cloud & Data Platforms' },
    { name: 'PRINCE2 Practitioner', provider: 'Axelos', category: 'Project & Process Management' },
    { name: 'Six Sigma Green Belt', provider: 'ASQ', category: 'Project & Process Management' },
    { name: 'Oracle Cloud Project Management Practitioner', provider: 'Oracle', category: 'Project & Process Management' },
  ];

  const insert = db.prepare(
    'INSERT INTO certifications (id, name, provider, date_earned) VALUES (?, ?, ?, ?)',
  );

  const seedAll = db.transaction(() => {
    for (const cert of certs) {
      const id = `cert-seed-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      insert.run(id, cert.name, cert.provider, new Date().toISOString().split('T')[0]);
    }
  });

  seedAll();
  log.info(`Seeded ${certs.length} default certifications`);
}

// ---------------------------------------------------------------------------
// Service bootstrap — initialise all services and register IPC handlers
// ---------------------------------------------------------------------------

function bootstrapServices(): void {
  log.info('Bootstrapping services…');

  // 1. Database
  const dbPath = path.join(app.getPath('userData'), 'archlens.db');
  const dbManager = new DatabaseManager(dbPath);
  const integrityResult = dbManager.initialise();
  if (!integrityResult.ok) {
    log.error('Database integrity check failed:', integrityResult.errors);
  }
  const db = dbManager.getDatabase();

  // Seed default certifications on first launch
  seedCertifications(db);

  // 2. Settings (needs safeStorage adapter)
  const safeStorageAdapter: SafeStorageAdapter = {
    isEncryptionAvailable: () => safeStorage.isEncryptionAvailable(),
    encryptString: (text: string) => safeStorage.encryptString(text),
    decryptString: (encrypted: Buffer) => safeStorage.decryptString(encrypted),
  };
  const settingsService = new SettingsService(db, safeStorageAdapter);
  const settings = settingsService.get();

  // 3. AI Service
  const aiService = new AIService(
    settings.openaiApiKey,
    settings.geminiApiKey,
    settings.aiProvider,
  );

  // 4. Document Parser
  const documentParser = createDocumentParser();

  // 5. Article Curator
  const feedsPath = getResourcePath('feeds.json');
  let feeds: FeedConfig[] = [];
  try {
    const feedsJson = JSON.parse(fs.readFileSync(feedsPath, 'utf-8'));
    feeds = (feedsJson.feeds ?? []).map((f: { url: string; source: string; category: string }) => ({
      url: f.url,
      source: f.source,
      category: f.category as ArticleCategory,
    }));
  } catch (err) {
    log.warn('Could not load feeds.json:', err);
  }
  const articleCurator = new ArticleCurator(db, feeds);

  // 6. Learning Engine
  const learningEngine = new LearningEngine(db);
  const modulesDir = getResourcePath('content', 'modules');
  if (fs.existsSync(modulesDir)) {
    learningEngine.loadModules(modulesDir);
  }

  // 7. Diagram Coach
  const diagramCoach = new DiagramCoach(db);
  const diagramsDir = getResourcePath('content', 'diagrams');
  if (fs.existsSync(diagramsDir)) {
    diagramCoach.loadModules(diagramsDir);
  }
  const referenceDir = getResourcePath('content', 'reference');
  if (fs.existsSync(referenceDir)) {
    diagramCoach.loadReference(referenceDir);
  }

  // 8. Career Tracker
  const careerTracker = new CareerTracker(db);
  const ddatPath = getResourcePath('content', 'ddat', 'capabilities.json');
  if (fs.existsSync(ddatPath)) {
    careerTracker.loadDDATData(ddatPath);
  }

  // 9. Progress Service
  const progressService = new ProgressService(db);

  // 10. Guardrails Service
  const guardrailsService = new GuardrailsService();
  const guardrailsDir = getResourcePath('content', 'guardrails');
  if (fs.existsSync(guardrailsDir)) {
    guardrailsService.loadTopics(guardrailsDir);
  }

  // 11. Academy Service
  const academyService = new AcademyService(db);
  const curriculumPath = getResourcePath('content', 'academy', 'curriculum.json');
  if (fs.existsSync(curriculumPath)) {
    academyService.loadCurriculum(curriculumPath);
  }
  const academyLessonsDir = getResourcePath('content', 'academy', 'lessons');
  if (fs.existsSync(academyLessonsDir)) {
    academyService.loadLessons(academyLessonsDir);
  }
  academyService.seedSkills();

  // 12. Artifact Service
  const artifactService = new ArtifactService();
  const artifactsPath = getResourcePath('content', 'artifacts', 'artifacts.json');
  if (fs.existsSync(artifactsPath)) {
    artifactService.loadArtifacts(artifactsPath);
  }

  // ---------------------------------------------------------------------------
  // Register all IPC handlers
  // ---------------------------------------------------------------------------

  registerSettingsHandlers(settingsService);
  registerAIHandlers({ aiService, documentParser, db: dbManager });
  registerDocumentHandlers(documentParser);
  registerArticleHandlers(articleCurator);
  registerLearningHandlers(learningEngine);
  registerDiagramHandlers(diagramCoach);
  registerCareerHandlers(careerTracker);
  registerProgressHandlers(progressService);
  registerGuardrailsHandlers(guardrailsService);
  registerAcademyHandlers(academyService);
  registerArtifactHandlers(artifactService);

  // 12. Infographic Service
  const infographicDir = path.join(app.getPath('userData'), 'infographics');
  const infographicService = new InfographicService(infographicDir);
  registerInfographicHandlers(infographicService, () => settingsService.get().openaiApiKey);

  log.info('All IPC handlers registered');
}

// ---------------------------------------------------------------------------
// Window creation
// ---------------------------------------------------------------------------

function createWindow(): void {
  log.info('Creating main window');

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'ArchLens',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '..', 'preload', 'index.js'),
      sandbox: true,
    },
  });

  // Load the renderer
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  log.info('Main window created');
}

// ---------------------------------------------------------------------------
// App lifecycle
// ---------------------------------------------------------------------------

app.whenReady().then(() => {
  bootstrapServices();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

process.on('uncaughtException', (error) => {
  log.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason) => {
  log.error('Unhandled rejection:', reason);
});
