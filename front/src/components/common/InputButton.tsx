interface TitleInputFieldProps {
  placeholder: string;
  onClick?: () => void;
}

export default function InputButton({
  placeholder,
  onClick,
}: TitleInputFieldProps) {
  return (
    <button
      onClick={onClick}
      className="border border-greyscale-border-300 border-solid flex flex-col px-4 py-2 rounded-full"
    >
      <span className="text-caption1 text-greyscale-title-800 text-left">
        {placeholder}
      </span>
    </button>
  );
}
