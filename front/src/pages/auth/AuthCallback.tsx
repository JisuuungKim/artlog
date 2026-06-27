import { startTransition, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { authTokenStorage } from '@/lib/auth-token';
import { USER_QUERY_KEY, type MeResponse } from '@/hooks/useUser';
import { api, type ApiResponse } from '@/lib/api';
import { identifyUser, trackEvent } from '@/lib/mixpanel';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    void (async () => {
      const error = searchParams.get('error');
      const accessToken = searchParams.get('accessToken');
      const isNewUser = searchParams.get('isNewUser') === 'true';

      if (error) {
        authTokenStorage.clear();
        startTransition(() => {
          navigate(`/auth/login?error=${encodeURIComponent(error)}`, {
            replace: true,
          });
        });
        return;
      }

      if (!accessToken) {
        authTokenStorage.clear();
        startTransition(() => {
          navigate('/auth/login?error=access-token-missing', { replace: true });
        });
        return;
      }

      authTokenStorage.set(accessToken);

      try {
        const user = await queryClient.fetchQuery<MeResponse>({
          queryKey: USER_QUERY_KEY,
          queryFn: async () => {
            const response = await api.get<ApiResponse<MeResponse>>('/api/users/me');
            return response.data.data;
          },
        });
        identifyUser(user.id, { provider: user.provider });
        trackEvent(isNewUser ? 'signup' : 'login', {
          user_id: user.id,
          provider: user.provider,
        });
      } catch {
        // analytics failure must not block the auth flow
      }

      await queryClient.invalidateQueries({ queryKey: USER_QUERY_KEY });
      startTransition(() => {
        navigate(isNewUser ? '/auth/terms' : '/', { replace: true });
      });
    })();
  }, [navigate, queryClient, searchParams]);

  return (
    <div className="flex min-h-full items-center justify-center px-5 py-10">
      <p className="text-body1 text-greyscale-neutral-600">
        로그인 정보를 마무리하는 중
      </p>
    </div>
  );
}
