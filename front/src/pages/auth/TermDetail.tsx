import { BackGreyscale800Icon } from '@/assets/icons';
import AppBar from '@/components/appBar';
import { useNavigate, useParams } from 'react-router-dom';
import termDetails from './data/termDetails.json';
import TermDetailSection from './components/TermDetailSection';
import type { TermDetailContentMap } from './termDetail.types';

const TERM_DETAILS = termDetails as TermDetailContentMap;

export default function TermDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const detail = id ? TERM_DETAILS[id] : undefined;

  return (
    <div className="min-h-full bg-greyscale-bg-50 pt-[10px]">
      <AppBar
        variant="icons-left-only"
        leftIcon={
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-6 w-6 items-center justify-center"
            aria-label="뒤로가기"
          >
            <BackGreyscale800Icon className="h-6 w-6" />
          </button>
        }
      />

      {detail ? (
        <div>
          <section className="px-5 py-8">
            <h1 className="text-h1 text-greyscale-text-title-900">
              {detail.title}
            </h1>
          </section>

          {detail.intro?.length ? (
            <section className="space-y-5 px-5 text-body2 text-greyscale-text-body-700">
              {detail.intro.map(paragraph => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </section>
          ) : null}

          <section
            className={`space-y-[44px] px-5 pb-10 ${
              detail.intro?.length ? 'pt-[60px]' : 'pt-0'
            }`}
          >
            {detail.sections.map(section => (
              <TermDetailSection key={section.title} {...section} />
            ))}
          </section>
        </div>
      ) : (
        <section className="px-5 py-8">
          <h1 className="text-h1 text-greyscale-text-title-900">
            약관 정보를 찾을 수 없어요.
          </h1>
          <p className="mt-3 text-body2 text-greyscale-text-body-700">
            다시 이전 화면으로 돌아가 약관을 선택해 주세요.
          </p>
        </section>
      )}
    </div>
  );
}
