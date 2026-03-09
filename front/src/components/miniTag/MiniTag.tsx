type MiniTagVariant = 'primary' | 'outline' | 'error';

type MiniTagProps = {
  children?: React.ReactNode;
  variant?: MiniTagVariant;
  /** @deprecated use variant instead */
  fill?: boolean;
};

export default function MiniTag({
  children = '미니 태그',
  variant,
  fill = true,
}: MiniTagProps) {
  const baseClasses =
    'inline-flex items-center justify-center px-1.5 py-0.5 rounded-lg text-caption2';

  const resolvedVariant: MiniTagVariant =
    variant ?? (fill ? 'primary' : 'outline');

  const variantClasses: Record<MiniTagVariant, string> = {
    primary: 'bg-primary-50 text-primary-500',
    outline: 'border border-primary-100 text-primary-500',
    error: 'border border-point-200 text-point-600',
  };

  return (
    <div className={`${baseClasses} ${variantClasses[resolvedVariant]}`}>
      {children}
    </div>
  );
}
