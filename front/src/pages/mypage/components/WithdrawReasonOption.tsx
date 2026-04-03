import { CheckBgPrimary600Icon } from '@/assets/icons';

interface WithdrawReasonOptionProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

export default function WithdrawReasonOption({
  label,
  selected,
  onClick,
}: WithdrawReasonOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center rounded-2xl border px-4 py-3 text-left transition-colors ${
        selected
          ? 'border-primary-300 bg-primary-50'
          : 'border-greyscale-border-300 bg-greyscale-bg-50'
      }`}
    >
      <span
        className={`flex-1 text-subtitle3 ${
          selected ? 'text-primary-600' : 'text-greyscale-text-body-700'
        }`}
      >
        {label}
      </span>
      {selected ? (
        <CheckBgPrimary600Icon className="ml-2 h-6 w-6 shrink-0" />
      ) : null}
    </button>
  );
}
