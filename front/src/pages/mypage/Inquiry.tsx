import { BackGreyscale800Icon } from '@/assets/icons';
import AppBar from '@/components/appBar';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import InquiryActionBar from './components/InquiryActionBar';
import InquiryMessageField from './components/InquiryMessageField';
import { useInquiry } from '@/hooks/useInquiry';

export default function Inquiry() {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const { mutate: submitInquiry, isPending } = useInquiry();

  const hasMessage = message.trim().length > 0;

  const handleSubmit = () => {
    submitInquiry(message.trim(), {
      onSuccess: () => navigate(-1),
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-greyscale-bg-50 pt-[10px]">
      <AppBar
        variant="title-left-back"
        title="1:1 문의"
        leftIcon={<BackGreyscale800Icon className="h-6 w-6" />}
        leftIconClick={() => navigate(-1)}
      />

      <div className="flex-1 px-5 pb-[132px] pt-8">
        <InquiryMessageField value={message} onChange={setMessage} />
      </div>

      <p className="fixed bottom-[118px] left-0 right-0 text-center text-caption1 text-greyscale-neutral-600">
        문의하신 내용은 7일 이내에 메일로 답변드립니다.
      </p>

      <InquiryActionBar enabled={hasMessage} onClick={handleSubmit} isPending={isPending} />
    </div>
  );
}
