import { LoginButton } from '@/components/loginButton';
import { Artlog, MainLogo } from '@/assets/logos';
import { trackEvent } from '@/lib/mixpanel';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

// 카카오·애플 로그인은 백엔드 틀만 구현된 상태라 노출하지 않습니다. (구글만 노출)
// const LOGIN_PROVIDERS = ['kakao', 'apple', 'google'] as const;
const LOGIN_PROVIDERS = ['google'] as const;

export default function Login() {
  const handleLogin = (provider: (typeof LOGIN_PROVIDERS)[number]) => {
    trackEvent('login_button_clicked', { provider, source: 'login_page' });
    window.location.href = `${API_BASE_URL}/oauth2/authorization/${provider}`;
  };

  return (
    <div className="min-h-full bg-greyscale-bg-50">
      <div className="mx-auto flex min-h-full max-w-[375px] flex-col px-5 pb-[26px] pt-[min(22vh,275px)]">
        <div className="flex flex-col items-center gap-[29px]">
          <MainLogo />
          <Artlog />
        </div>

        <div className="mt-auto pt-28">
          <div className="space-y-2.5">
            {LOGIN_PROVIDERS.map(provider => (
              <LoginButton
                key={provider}
                provider={provider}
                onClick={() => handleLogin(provider)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
