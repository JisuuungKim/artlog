import { useMutation, useQuery } from '@tanstack/react-query';
import { api, type ApiResponse } from '@/lib/api';

export type LessonNoteStatus =
  | 'PROCESSING'
  | 'DRAFT'
  | 'COMPLETED'
  | 'FAILED'
  | 'ARCHIVED';

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
  });
}

export function useLessonNote(noteId?: string) {
  return useQuery({
    queryKey: ['lesson-note', noteId],
    enabled: Boolean(noteId),
    queryFn: async () => {
      const response = await api.get<ApiResponse<LessonNoteDetail>>(
        `/api/v1/notes/${noteId}`
      );
      return response.data.data;
    },
    refetchInterval: query =>
      query.state.data?.status === 'PROCESSING' ? 2000 : false,
  });
}
