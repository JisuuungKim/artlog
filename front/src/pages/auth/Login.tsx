import { LoginButton } from '@/components/loginButton';
import { Artlog, MainLogo } from '@/assets/logos';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

const LOGIN_PROVIDERS = ['kakao', 'apple', 'google'] as const;

export default function Login() {
  const handleLogin = (provider: (typeof LOGIN_PROVIDERS)[number]) => {
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
