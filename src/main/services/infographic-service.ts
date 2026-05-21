// ArchLens — Infographic Generation Service
// Uses DALL-E 3 API to generate consistent infographics for Academy lessons

import * as fs from 'fs';
import * as path from 'path';
import log from 'electron-log';

// ---------------------------------------------------------------------------
// Design System Prompt — This is the key to consistency
// ---------------------------------------------------------------------------

const DESIGN_SYSTEM_PROMPT = `Create a professional infographic poster for a UK government Solution Architect training programme.

STRICT DESIGN RULES — FOLLOW EXACTLY FOR EVERY IMAGE:
- Orientation: Portrait, 2:3 aspect ratio
- Background: Solid dark navy (#1a1a2e)
- Header bar: Full-width band at top, solid blue (#4a6cf7), containing lesson number and title in white bold sans-serif text
- Sub-header: Thin amber (#f59e0b) accent line below the header bar
- Body layout: 4-5 content blocks arranged vertically with equal spacing
- Each content block: A flat geometric icon (single colour, amber #f59e0b or white) on the left, with a short heading in white bold and 1-2 lines of explanation in light grey (#cccccc) on the right
- Footer bar: Dark grey (#2a2a3e) band at bottom with "ArchLens SA Academy" in small white text on the left and the lesson number badge on the right
- Typography: Clean sans-serif only (like Inter or Helvetica). Title: 48pt bold. Block headings: 24pt bold. Body text: 16pt regular.
- Icons: Flat, geometric, minimal, single-colour. No gradients, no 3D, no shadows, no photorealism.
- Overall style: Flat design, minimal, corporate-professional, modern. Like a premium consulting firm's internal training material.
- NO decorative borders, NO rounded corners on the overall poster, NO background patterns, NO stock photos.
- Colour palette ONLY: #1a1a2e (navy bg), #4a6cf7 (blue header), #f59e0b (amber accents/icons), #ffffff (white text), #cccccc (grey body text), #2a2a3e (footer bg)
- The infographic must look like part of a numbered series — consistent enough that lessons 1 through 40 would look like they belong together.`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface InfographicRecord {
  lessonNumber: number;
  lessonTitle: string;
  imageUrl: string;
  localPath: string | null;
  generatedAt: string;
  prompt: string;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class InfographicService {
  private storageDir: string;
  private records: Map<number, InfographicRecord> = new Map();
  private manifestPath: string;

  constructor(storageDir: string) {
    this.storageDir = storageDir;
    this.manifestPath = path.join(storageDir, 'manifest.json');

    // Ensure storage directory exists
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }

    // Load existing manifest
    this.loadManifest();
  }

  private loadManifest(): void {
    try {
      if (fs.existsSync(this.manifestPath)) {
        const data = JSON.parse(fs.readFileSync(this.manifestPath, 'utf-8'));
        for (const record of data.records ?? []) {
          this.records.set(record.lessonNumber, record);
        }
        log.info(`Loaded ${this.records.size} infographic records`);
      }
    } catch (err) {
      log.warn('Failed to load infographic manifest:', err);
    }
  }

  private saveManifest(): void {
    const data = { records: Array.from(this.records.values()) };
    fs.writeFileSync(this.manifestPath, JSON.stringify(data, null, 2), 'utf-8');
  }

  /**
   * Generates an infographic for a lesson using DALL-E 3.
   */
  async generate(
    lessonNumber: number,
    lessonTitle: string,
    keyPoints: string[],
    apiKey: string,
  ): Promise<InfographicRecord> {
    const contentPrompt = this.buildContentPrompt(lessonNumber, lessonTitle, keyPoints);
    const fullPrompt = `${DESIGN_SYSTEM_PROMPT}\n\nCONTENT FOR THIS INFOGRAPHIC:\nLesson ${lessonNumber}: "${lessonTitle}"\n\nKey points to visualise:\n${keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}`;

    log.info(`Generating infographic for Lesson ${lessonNumber}: ${lessonTitle}`);

    // Call OpenAI image generation API
    // Try gpt-image-1 first (newest), fall back to dall-e-2
    let response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: fullPrompt,
        n: 1,
        size: '1024x1536',
        quality: 'high',
      }),
    });

    // If gpt-image-1 not available, try dall-e-2
    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      if (errText.includes('does not exist') || errText.includes('invalid_value')) {
        log.info('gpt-image-1 not available, falling back to dall-e-2');
        response = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'dall-e-2',
            prompt: fullPrompt.substring(0, 1000), // dall-e-2 has shorter prompt limit
            n: 1,
            size: '1024x1024',
          }),
        });
      }
    }

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      throw new Error(`DALL-E API error (${response.status}): ${errorBody}`);
    }

    const data: any = await response.json();
    
    // gpt-image-1 returns b64_json, older models return url
    const imageUrl = data.data?.[0]?.url;
    const b64Data = data.data?.[0]?.b64_json;

    let localPath: string;

    if (b64Data) {
      // Save base64 data directly
      const buffer = Buffer.from(b64Data, 'base64');
      const fileName = `lesson-${String(lessonNumber).padStart(3, '0')}-infographic.png`;
      localPath = path.join(this.storageDir, fileName);
      fs.writeFileSync(localPath, buffer);
    } else if (imageUrl) {
      // Download from URL
      localPath = await this.downloadImage(imageUrl, lessonNumber);
    } else {
      // Log the full response for debugging
      log.error('Unexpected API response:', JSON.stringify(data));
      throw new Error('No image data returned from API. Check the logs for details.');
    }

    const record: InfographicRecord = {
      lessonNumber,
      lessonTitle,
      imageUrl: imageUrl || 'local',
      localPath,
      generatedAt: new Date().toISOString(),
      prompt: fullPrompt,
    };

    this.records.set(lessonNumber, record);
    this.saveManifest();

    log.info(`Infographic generated and saved: ${localPath}`);
    return record;
  }

  /**
   * Downloads an image from a URL and saves it locally.
   */
  private async downloadImage(url: string, lessonNumber: number): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const fileName = `lesson-${String(lessonNumber).padStart(3, '0')}-infographic.png`;
    const filePath = path.join(this.storageDir, fileName);

    fs.writeFileSync(filePath, buffer);
    return filePath;
  }

  /**
   * Returns the infographic record for a lesson, or null if not generated.
   */
  getForLesson(lessonNumber: number): InfographicRecord | null {
    return this.records.get(lessonNumber) ?? null;
  }

  /**
   * Returns all generated infographic records.
   */
  getAll(): InfographicRecord[] {
    return Array.from(this.records.values()).sort((a, b) => a.lessonNumber - b.lessonNumber);
  }

  /**
   * Returns the local file path for a lesson's infographic image.
   */
  getImagePath(lessonNumber: number): string | null {
    const record = this.records.get(lessonNumber);
    if (!record?.localPath) return null;
    if (!fs.existsSync(record.localPath)) return null;
    return record.localPath;
  }

  /**
   * Deletes a generated infographic.
   */
  delete(lessonNumber: number): void {
    const record = this.records.get(lessonNumber);
    if (record?.localPath && fs.existsSync(record.localPath)) {
      fs.unlinkSync(record.localPath);
    }
    this.records.delete(lessonNumber);
    this.saveManifest();
  }

  private buildContentPrompt(lessonNumber: number, title: string, keyPoints: string[]): string {
    return `Lesson ${lessonNumber}: "${title}"\n\nKey concepts:\n${keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}`;
  }
}
