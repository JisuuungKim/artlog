import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useInquiry() {
  return useMutation({
    mutationFn: async (content: string) => {
      await api.post('/api/v1/inquiries', { content });
    },
  });
}
