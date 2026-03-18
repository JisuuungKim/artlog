import { useQuery } from '@tanstack/react-query';
import { api, type ApiResponse } from '@/lib/api';

export type MeResponse = {
  id: number;
  provider: string;
  socialId: string;
  email: string | null;
  name: string | null;
  remainingCount: number;
  hideIphoneUploadGuide: boolean;
  hideMobileDataGuide: boolean;
};

export const USER_QUERY_KEY = ['auth', 'me'] as const;

export function useUser() {
  return useQuery({
    queryKey: USER_QUERY_KEY,
    queryFn: async () => {
      const response = await api.get<ApiResponse<MeResponse>>('/api/users/me');
      return response.data.data;
    },
    staleTime: 1000 * 60 * 5,
  });
}
