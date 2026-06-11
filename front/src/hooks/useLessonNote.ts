import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import {
  API_BASE_URL,
  api,
  authTokenStorage,
  type ApiResponse,
} from '@/lib/api';
import { USER_QUERY_KEY } from './useUser';

export type LessonNoteStatus =
  | 'PROCESSING'
  | 'DRAFT'
  | 'COMPLETED'
  | 'FAILED'
  | 'ARCHIVED';

export type LessonProcessingStage =
  | 'queued'
  | 'stt'
  | 'correction'
  | 'feedback_analysis'
  | 'lesson_note'
  | 'review_lesson_note'
  | 'extract_improvement'
  | 'embed_note'
  | 'growth_report'
  | 'completed'
  | 'failed';

export type LessonCardItem = {
  title: string | null;
  content: string;
};

export type LessonFeedbackCard = {
  id: number;
  title: string;
  content: string;
};

export type LessonFeedbackGroup = {
  id: number;
  keyword: string;
  cards: LessonFeedbackCard[];
};

export type LessonLyricsFeedback = {
  id: number;
  lineText: string | null;
  feedbackTitle: string | null;
  problemText: string | null;
  solutionText: string | null;
};

export type LessonNoteDetail = {
  id: number;
  title: string;
  status: LessonNoteStatus;
  categoryName: string | null;
  folderName: string | null;
  conditionText: string | null;
  recordingUrl: string | null;
  createdAt: string;
  songTitles: string[];
  keyFeedback: LessonCardItem[];
  practiceGuide: LessonCardItem[];
  nextAssignment: LessonCardItem[];
  feedbackGroups: LessonFeedbackGroup[];
  lyricsFeedbacks: LessonLyricsFeedback[];
  growthReport: string | null;
  processingStage?: LessonProcessingStage;
  processingProgress?: number;
  processingMessage?: string;
};

export type RecentLessonNote = {
  id: number;
  title: string;
  status: LessonNoteStatus;
  folderName: string | null;
  songTitles: string[];
  createdAt: string;
  processingStage?: LessonProcessingStage;
  processingProgress?: number;
  processingMessage?: string;
};

type LessonNoteProgressEvent = {
  noteId: number;
  status: LessonNoteStatus;
  stage: LessonProcessingStage;
  progress: number;
  message: string;
};

type CreatedLessonNote = {
  id: number;
  status: LessonNoteStatus;
};

type UploadedLessonAudio = {
  uploadedAudioPath: string;
};

type CreateLessonPayload = {
  audio?: File;
  title?: string;
  folderId?: number;
  categoryId?: number;
  conditionText?: string;
  songTitles: string[];
  uploadedAudioPath?: string;
};

export function useUploadLessonAudio() {
  return useMutation({
    mutationFn: async (audio: File) => {
      const formData = new FormData();
      formData.append('audio', audio);

      const response = await api.post<ApiResponse<UploadedLessonAudio>>(
        '/api/v1/notes/audio-upload',
        formData
      );

      return response.data.data;
    },
  });
}

export function useCreateLessonNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateLessonPayload) => {
      const formData = new FormData();
      if (payload.audio) {
        formData.append('audio', payload.audio);
      }
      formData.append(
        'payload',
        new Blob(
          [
            JSON.stringify({
              title: payload.title,
              folderId: payload.folderId,
              categoryId: payload.categoryId,
              conditionText: payload.conditionText,
              songTitles: payload.songTitles,
              uploadedAudioPath: payload.uploadedAudioPath,
            }),
          ],
          { type: 'application/json' }
        )
      );

      const response = await api.post<ApiResponse<CreatedLessonNote>>(
        '/api/v1/notes/lesson-upload',
        formData
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recent-lesson-notes'] });
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEY });
    },
  });
}

export function useRecentLessonNotes(categoryId?: string) {
  const query = useQuery({
    queryKey: ['recent-lesson-notes', categoryId],
    queryFn: async () => {
      const response = await api.get<ApiResponse<RecentLessonNote[]>>(
        '/api/v1/notes/recent-lessons',
        {
          params: categoryId ? { categoryId } : undefined,
        }
      );
      return response.data.data;
    },
  });

  useLessonNoteStatusEvents(
    query.data
      ?.filter(note => note.status === 'PROCESSING')
      .map(note => note.id) ?? []
  );

  return query;
}

export function useRetryLessonNoteProcessing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (noteId: number) => {
      await api.post<ApiResponse<void>>(
        `/api/v1/notes/${noteId}/retry-processing`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recent-lesson-notes'] });
    },
  });
}

export function useRenameLessonNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      noteId,
      title,
    }: {
      noteId: number;
      title: string;
    }) => {
      await api.patch<ApiResponse<void>>(`/api/v1/notes/${noteId}/title`, {
        title,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folder-notes'] });
      queryClient.invalidateQueries({ queryKey: ['song-notes'] });
      queryClient.invalidateQueries({ queryKey: ['recent-lesson-notes'] });
    },
  });
}

export function useDeleteLessonNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (noteId: number) => {
      await api.delete<ApiResponse<void>>(`/api/v1/notes/${noteId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folder-notes'] });
      queryClient.invalidateQueries({ queryKey: ['song-notes'] });
      queryClient.invalidateQueries({ queryKey: ['recent-lesson-notes'] });
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEY });
    },
  });
}

export function useMoveLessonNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      noteId,
      folderId,
    }: {
      noteId: number;
      folderId: number;
    }) => {
      await api.patch<ApiResponse<void>>(`/api/v1/notes/${noteId}/move`, {
        folderId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folder-notes'] });
      queryClient.invalidateQueries({ queryKey: ['song-notes'] });
      queryClient.invalidateQueries({ queryKey: ['recent-lesson-notes'] });
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    },
  });
}

export function useLessonNote(noteId?: string) {
  const query = useQuery({
    queryKey: ['lesson-note', noteId],
    enabled: Boolean(noteId),
    queryFn: async () => {
      const response = await api.get<ApiResponse<LessonNoteDetail>>(
        `/api/v1/notes/${noteId}`
      );
      return response.data.data;
    },
  });

  useLessonNoteStatusEvents(
    noteId && query.data?.status === 'PROCESSING' ? [noteId] : []
  );

  return query;
}

function useLessonNoteStatusEvents(noteIds: Array<number | string>) {
  const queryClient = useQueryClient();
  const noteIdKey = noteIds.join(',');

  useEffect(() => {
    const accessToken = authTokenStorage.get();
    const activeNoteIds = noteIdKey ? noteIdKey.split(',') : [];
    if (!accessToken || activeNoteIds.length === 0) {
      return;
    }

    const eventSources = activeNoteIds.map(noteId => {
      const url = new URL(`/api/v1/notes/${noteId}/events`, API_BASE_URL);
      url.searchParams.set('accessToken', accessToken);

      const eventSource = new EventSource(url.toString());
      eventSource.addEventListener('progress', event => {
        if (!(event instanceof MessageEvent)) {
          return;
        }

        const progressEvent = JSON.parse(event.data) as LessonNoteProgressEvent;
        updateLessonNoteProgressCache(queryClient, progressEvent);

        if (['COMPLETED', 'FAILED', 'ARCHIVED'].includes(progressEvent.status)) {
          queryClient.invalidateQueries({
            queryKey: ['lesson-note', String(progressEvent.noteId)],
          });
          queryClient.invalidateQueries({ queryKey: ['recent-lesson-notes'] });
          eventSource.close();
        }
      });

      return eventSource;
    });

    return () => {
      eventSources.forEach(eventSource => eventSource.close());
    };
  }, [noteIdKey, queryClient]);
}

function updateLessonNoteProgressCache(
  queryClient: ReturnType<typeof useQueryClient>,
  progressEvent: LessonNoteProgressEvent
) {
  queryClient.setQueriesData<RecentLessonNote[]>(
    { queryKey: ['recent-lesson-notes'] },
    notes =>
      notes?.map(note =>
        note.id === progressEvent.noteId
          ? {
              ...note,
              status: progressEvent.status,
              processingStage: progressEvent.stage,
              processingProgress: progressEvent.progress,
              processingMessage: progressEvent.message,
            }
          : note
      )
  );

  queryClient.setQueryData<LessonNoteDetail>(
    ['lesson-note', String(progressEvent.noteId)],
    note =>
      note
        ? {
            ...note,
            status: progressEvent.status,
            processingStage: progressEvent.stage,
            processingProgress: progressEvent.progress,
            processingMessage: progressEvent.message,
          }
        : note
  );
}
