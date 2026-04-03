import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type ApiResponse } from '@/lib/api';

export type NoteSummary = {
  id: number;
  title: string;
  noteType: 'LESSON' | 'PRACTICE';
  status: 'PROCESSING' | 'DRAFT' | 'COMPLETED' | 'FAILED' | 'ARCHIVED';
  folderId: number | null;
  folderName: string | null;
  songTitles: string[];
  createdAt: string;
};

export type FolderSummary = {
  id: number;
  name: string;
  isSystem: boolean;
  categoryId: number | null;
  noteCount: number;
};

export type SongSummary = {
  id: number;
  title: string;
  categoryId: number | null;
  createdAt: string;
};

export type SongWithNotes = {
  id: number;
  title: string;
  notes: NoteSummary[];
};

export type CategorySummary = {
  id: number;
  name: string;
  isCustom: boolean;
};

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<CategorySummary[]>>(
        '/api/v1/categories'
      );
      return response.data.data;
    },
  });
}

export function useRegisterUserInterestCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name }: { name: string }) => {
      const response = await api.post<ApiResponse<CategorySummary>>(
        '/api/v1/categories/interests',
        { name }
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useFolders(categoryId?: string) {
  return useQuery({
    queryKey: ['folders', categoryId],
    queryFn: async () => {
      const response = await api.get<ApiResponse<FolderSummary[]>>(
        '/api/v1/folders',
        {
          params: categoryId ? { categoryId } : undefined,
        }
      );
      return response.data.data;
    },
  });
}

export function useCreateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      categoryId,
    }: {
      name: string;
      categoryId: number;
    }) => {
      const response = await api.post<ApiResponse<FolderSummary>>(
        '/api/v1/folders',
        { name, categoryId }
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    },
  });
}

export function useRenameFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ folderId, name }: { folderId: number; name: string }) => {
      const response = await api.patch<ApiResponse<FolderSummary>>(
        `/api/v1/folders/${folderId}`,
        { name }
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      queryClient.invalidateQueries({ queryKey: ['folder-notes'] });
    },
  });
}

export function useDeleteFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (folderId: number) => {
      await api.delete<ApiResponse<void>>(`/api/v1/folders/${folderId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      queryClient.invalidateQueries({ queryKey: ['folder-notes'] });
    },
  });
}

export function useFolderNotes(folderId?: string) {
  return useQuery({
    queryKey: ['folder-notes', folderId],
    enabled: Boolean(folderId),
    queryFn: async () => {
      const response = await api.get<ApiResponse<NoteSummary[]>>(
        `/api/v1/folders/${folderId}/notes`
      );
      return response.data.data;
    },
  });
}

export function useSongs(categoryId?: string) {
  return useQuery({
    queryKey: ['songs', categoryId],
    queryFn: async () => {
      const response = await api.get<ApiResponse<SongSummary[]>>('/api/v1/songs', {
        params: categoryId ? { categoryId } : undefined,
      });
      return response.data.data;
    },
  });
}

export function useSongNotes(songId?: string) {
  return useQuery({
    queryKey: ['song-notes', songId],
    enabled: Boolean(songId),
    queryFn: async () => {
      const response = await api.get<ApiResponse<SongWithNotes>>(
        `/api/v1/songs/${songId}/notes`
      );
      return response.data.data;
    },
  });
}

export function useRenameSong() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ songId, title }: { songId: number; title: string }) => {
      const response = await api.patch<ApiResponse<SongSummary>>(
        `/api/v1/songs/${songId}`,
        { title }
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['songs'] });
      queryClient.invalidateQueries({ queryKey: ['song-notes'] });
    },
  });
}

export function useDeleteSong() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (songId: number) => {
      await api.delete<ApiResponse<void>>(`/api/v1/songs/${songId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['songs'] });
      queryClient.invalidateQueries({ queryKey: ['song-notes'] });
    },
  });
}
