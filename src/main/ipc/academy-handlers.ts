// ArchLens — Academy IPC handlers

import { ipcMain } from 'electron';
import { AcademyService } from '../services/academy-service';
import { ipcSuccess, ipcError } from '../errors';

/**
 * Registers IPC handlers for the `academy` namespace.
 */
export function registerAcademyHandlers(academyService: AcademyService): void {
  ipcMain.handle('academy.getCurriculum', () => {
    try {
      return ipcSuccess(academyService.getCurriculum());
    } catch (err) {
      return ipcError(err);
    }
  });

  ipcMain.handle('academy.getLesson', (_event, lessonNumber: number) => {
    try {
      const lesson = academyService.getLesson(lessonNumber);
      if (!lesson) {
        return ipcError(new Error(`Lesson ${lessonNumber} not found or content not yet available`));
      }
      return ipcSuccess(lesson);
    } catch (err) {
      return ipcError(err);
    }
  });

  ipcMain.handle('academy.startLesson', (_event, lessonId: string) => {
    try {
      academyService.startLesson(lessonId);
      return ipcSuccess(undefined);
    } catch (err) {
      return ipcError(err);
    }
  });

  ipcMain.handle(
    'academy.completeLesson',
    (_event, lessonId: string, quizScore: number, confidenceLevel: number) => {
      try {
        academyService.completeLesson(lessonId, quizScore, confidenceLevel);
        return ipcSuccess(undefined);
      } catch (err) {
        return ipcError(err);
      }
    },
  );

  ipcMain.handle('academy.saveNotes', (_event, lessonId: string, notes: string) => {
    try {
      academyService.saveNotes(lessonId, notes);
      return ipcSuccess(undefined);
    } catch (err) {
      return ipcError(err);
    }
  });

  ipcMain.handle(
    'academy.submitExercise',
    (
      _event,
      lessonId: string,
      exerciseType: string,
      question: string,
      userAnswer: string,
      modelAnswer: string,
    ) => {
      try {
        academyService.submitExercise(
          lessonId,
          exerciseType as 'quiz' | 'scenario' | 'reflection',
          question,
          userAnswer,
          modelAnswer,
        );
        return ipcSuccess(undefined);
      } catch (err) {
        return ipcError(err);
      }
    },
  );

  ipcMain.handle('academy.getSkillAssessment', () => {
    try {
      return ipcSuccess(academyService.getSkillAssessment());
    } catch (err) {
      return ipcError(err);
    }
  });

  ipcMain.handle('academy.getRecommendedNext', () => {
    try {
      return ipcSuccess(academyService.getRecommendedNext());
    } catch (err) {
      return ipcError(err);
    }
  });

  ipcMain.handle('academy.getProgress', () => {
    try {
      return ipcSuccess(academyService.getProgress());
    } catch (err) {
      return ipcError(err);
    }
  });
}