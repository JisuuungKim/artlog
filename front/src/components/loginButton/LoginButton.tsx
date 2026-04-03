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
  {
    label: string;
    icon: React.ReactNode;
    className: string;
    textClassName: string;
    iconClassName?: string;
  }
> = {
  kakao: {
    label: '카카오로 시작하기',
    icon: <KakaoColorIcon />,
    className: 'bg-[#FFE400]',
    textClassName: 'text-greyscale-text-title-800',
  },
  google: {
    label: '구글로 시작하기',
    icon: <GoogleColorIcon />,
    className: 'bg-greyscale-bg-50 border border-greyscale-border-300',
    textClassName: 'text-greyscale-text-title-800',
  },
  apple: {
    label: '애플로 시작하기',
    icon: <AppleGreyscale800Icon />,
    className: 'bg-greyscale-text-title-900',
    textClassName: 'text-greyscale-bg-50',
    iconClassName: 'invert',
  },
};

export default function LoginButton({ provider, onClick }: LoginButtonProps) {
  const { label, icon, className, textClassName, iconClassName } =
    config[provider];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-full pl-5 pr-6 py-3 active:opacity-80 transition-opacity ${className}`}
    >
      <span className={`size-6 shrink-0 ${iconClassName ?? ''}`}>{icon}</span>
      <span className={`text-subtitle3 ${textClassName}`}>{label}</span>
    </button>
  );
}
