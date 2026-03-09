import {
  GoogleColorIcon,
  KakaoColorIcon,
  AppleGreyscale800Icon,
} from '@/assets/icons';

type LoginProvider = 'google' | 'kakao' | 'apple';

type LoginButtonProps = {
  provider: LoginProvider;
  onClick?: () => void;
};

const config: Record<
  LoginProvider,
  { label: string; icon: React.ReactNode; className: string }
> = {
  kakao: {
    label: '카카오로 시작하기',
    icon: <KakaoColorIcon />,
    className: 'bg-[#FFE400]',
  },
  google: {
    label: '구글로 시작하기',
    icon: <GoogleColorIcon />,
    className: 'bg-greyscale-bg-50 border border-greyscale-border-300',
  },
  apple: {
    label: '애플로 시작하기',
    icon: <AppleGreyscale800Icon />,
    className: 'bg-greyscale-bg-50 border border-greyscale-border-300',
  },
};

export default function LoginButton({ provider, onClick }: LoginButtonProps) {
  const { label, icon, className } = config[provider];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-2.5 w-full pl-5 pr-6 py-3 rounded-full overflow-hidden active:opacity-80 transition-opacity ${className}`}
    >
      <span className="shrink-0 size-6">{icon}</span>
      <span className="text-subtitle3 text-greyscale-text-title-800">
        {label}
      </span>
    </button>
  );
}
