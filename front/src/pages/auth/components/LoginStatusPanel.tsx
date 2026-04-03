import type { MeResponse } from '@/hooks/useUser';

interface LoginStatusPanelProps {
  error: string | null;
  isLoading: boolean;
  user?: MeResponse;
  hasLocalToken: boolean;
  onLogout: () => void;
  onClearToken: () => void;
}

export default function LoginStatusPanel({
  error,
  isLoading,
  user,
  hasLocalToken,
  onLogout,
  onClearToken,
}: LoginStatusPanelProps) {
  if (!error && !isLoading && !user && !hasLocalToken) {
    return null;
  }

  return (
    <div className="mb-4 space-y-3">
      {error ? (
        <p className="text-center text-caption1 text-point-600">
          로그인 실패: {error}
        </p>
      ) : null}

      {isLoading ? (
        <p className="text-center text-caption1 text-greyscale-neutral-600">
          로그인 상태를 확인하는 중입니다.
        </p>
      ) : null}

      {user ? (
        <div className="rounded-2xl border border-greyscale-border-300 bg-greyscale-bg-50 px-4 py-3">
          <p className="text-body2 text-greyscale-text-title-800">
            {user.name ?? user.email ?? '로그인된 사용자'}
          </p>
          <p className="mt-1 text-caption1 text-greyscale-neutral-600">
            {user.provider} 계정으로 로그인됨
          </p>
          <div className="mt-3 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={onLogout}
              className="text-caption1 text-primary-500"
            >
              로그아웃
            </button>
            <button
              type="button"
              onClick={onClearToken}
              className="text-caption1 text-greyscale-neutral-600"
            >
              토큰 초기화
            </button>
          </div>
        </div>
      ) : null}

      {!user && hasLocalToken ? (
        <div className="text-center">
          <button
            type="button"
            onClick={onClearToken}
            className="text-caption1 text-greyscale-neutral-600"
          >
            로컬 Access Token 비우기
          </button>
        </div>
      ) : null}
    </div>
  );
}
