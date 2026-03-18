import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api, authTokenStorage } from '@/lib/api';

export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async () => {
      await api.post('/api/auth/logout', null, {
        withCredentials: true,
        skipAuthRefresh: true,
      });
    },
    onSuccess: () => {
      authTokenStorage.clear();
      queryClient.clear();
      navigate('/');
    },
  });
}
