interface InquiryMessageFieldProps {
  value: string;
  onChange: (value: string) => void;
}

export default function InquiryMessageField({
  value,
  onChange,
}: InquiryMessageFieldProps) {
  return (
    <section className="space-y-2">
      <label
        htmlFor="inquiry-message"
        className="block text-label text-greyscale-neutral-600"
      >
        문의 내용
      </label>
      <textarea
        id="inquiry-message"
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder="문의 내용을 입력해 주세요."
        className="h-[120px] w-full resize-none rounded-xl border border-greyscale-border-300 bg-greyscale-bg-50 px-4 py-4 text-body1 text-greyscale-text-title-900 outline-none placeholder:text-greyscale-text-disabled-500"
      />
    </section>
  );
}
