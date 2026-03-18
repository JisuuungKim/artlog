import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import Button from '@/components/button/Button';
import { useUser } from '@/hooks/useUser';
import { useLogout } from '@/hooks/useLogout';
import { authTokenStorage } from '@/lib/auth-token';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

export default function Login() {
  const [searchParams] = useSearchParams();
  const error = searchParams.get('error');
  const { data: user, isLoading } = useUser();
  const logoutMutation = useLogout();

  const providers = useMemo(
    () => [
      { id: 'google', label: 'Google로 시작하기' },
      { id: 'kakao', label: 'Kakao로 시작하기' },
      { id: 'apple', label: 'Apple로 시작하기' },
    ],
    []
  );

  const handleLogin = (provider: string) => {
    window.location.href = `${API_BASE_URL}/oauth2/authorization/${provider}`;
  };

  const handleLocalTokenClear = () => {
    authTokenStorage.clear();
    window.location.reload();
  };

  return (
    <div className="min-h-full px-5 py-10">
      <div className="mx-auto flex max-w-[360px] flex-col gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-h1 text-greyscale-text-title-900">
            소셜 로그인
          </p>
          <p className="text-body2 text-greyscale-neutral-600">
            Access Token은 프론트에서 관리하고, Refresh Token은 HttpOnly
            쿠키로 유지합니다.
          </p>
        </div>

        {error && (
          <div className="rounded-2xl bg-point-50 px-4 py-3 text-body2 text-point-600">
            로그인 실패: {error}
          </div>
        )}

        <div className="flex flex-col gap-3">
          {providers.map(provider => (
            <Button
              key={provider.id}
              onClick={() => handleLogin(provider.id)}
              className="w-full"
            >
              {provider.label}
            </Button>
          ))}
        </div>

        <div className="rounded-2xl bg-greyscale-bg-50 p-4">
          <p className="mb-2 text-subtitle2 text-greyscale-text-title-900">
            현재 유저
          </p>
          {isLoading ? (
            <p className="text-body2 text-greyscale-neutral-600">
              유저 정보를 확인하는 중
            </p>
          ) : user ? (
            <div className="flex flex-col gap-3">
              <div className="text-body2 text-greyscale-neutral-600">
                <p>ID: {user.id}</p>
                <p>Provider: {user.provider}</p>
                <p>Email: {user.email ?? '없음'}</p>
              </div>
              <Button
                hierarchy="secondary-color"
                onClick={() => logoutMutation.mutate()}
                className="w-full"
              >
                로그아웃
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-body2 text-greyscale-neutral-600">
                로그인된 유저가 없습니다.
              </p>
              <Button
                hierarchy="secondary-grey"
                onClick={handleLocalTokenClear}
                className="w-full"
              >
                로컬 Access Token 비우기
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
