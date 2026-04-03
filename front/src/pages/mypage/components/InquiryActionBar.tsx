import { Button } from '@/components/button';

interface InquiryActionBarProps {
  enabled: boolean;
}

export default function InquiryActionBar({
  enabled,
}: InquiryActionBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 mx-auto w-full max-w-[480px] bg-greyscale-bg-50 px-5 pb-[26px] pt-5">
      <Button
        hierarchy="primary"
        size="large"
        disabled={!enabled}
        className="w-full [&>span]:text-subtitle3"
      >
        문의하기
      </Button>
    </div>
  );
}
