import { PlusGreyscale50Icon } from '@/assets/icons';
import { useRef, useState } from 'react';
import { UploadGreyscale800Icon } from '@/assets/icons';
import { useNavigate } from 'react-router-dom';
import { useUploadLessonAudio } from '@/hooks/useLessonNote';

export interface FabButtonProps {
  className?: string;
}

const FabButton: React.FC<FabButtonProps> = ({ className = '' }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const uploadLessonAudioMutation = useUploadLessonAudio();

  const toggle = () => {
    setIsExpanded(!isExpanded);
  };

  const handleLessonNote = () => {
    fileInputRef.current?.click();
  };

  const handleAudioSelected = (file?: File | null) => {
    if (!file) {
      return;
    }

    uploadLessonAudioMutation.mutate(file, {
      onSuccess: uploaded => {
        sessionStorage.setItem(
          'pendingLessonAudio',
          JSON.stringify({ uploadedAudioPath: uploaded.uploadedAudioPath })
        );
        setIsExpanded(false);
        navigate('/lessons/new');
      },
    });
  };

  return (
    <>
      {/* Dimmed Background */}
      {isExpanded && (
        <div className="fixed inset-0 bg-alpha-dimmed z-40" onClick={toggle} />
      )}

      <div className="absolute right-5 bottom-22 flex flex-col items-end z-50">
        {/* Content */}
        <div
          className={`bg-white p-5 mb-3 rounded-2xl transition-all duration-200 ${
            isExpanded
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 translate-y-2 scale-95 pointer-events-none'
          }`}
        >
          <div className="flex flex-col gap-3.5">
            <button
              onClick={handleLessonNote}
              className="flex gap-2 items-center"
            >
              <UploadGreyscale800Icon className="w-5 h-5 text-primary-500" />
              <span className="text-subtitle2 text-greyscale-text-title-900">
                레슨 노트
              </span>
            </button>
          </div>
        </div>

        {/* FAB 버튼 */}
        <button
          onClick={toggle}
          className={`bg-primary-500 overflow-hidden relative rounded-full w-14 h-14 flex items-center justify-center ${className}`}
          disabled={uploadLessonAudioMutation.isPending}
        >
          <PlusGreyscale50Icon
            className={`w-6 h-6 transition-transform duration-200 ${isExpanded ? 'rotate-45' : ''}`}
          />
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={event => {
          handleAudioSelected(event.target.files?.[0] ?? null);
          event.target.value = '';
        }}
      />
    </>
  );
};

export default FabButton;
