import FileUpload from '@/pages/lessons/new/FileUpload';
import ConditionMemo from '@/pages/lessons/new/ConditionMemo';
import LessonDetail from '@/pages/lessons/note/LessonDetail';
import LessonLyrics from '@/pages/lessons/note/LessonLyrics';

const BASE_PATH = '/lessons';

export const lessonRoutes = [
  { path: `${BASE_PATH}/new`, element: <FileUpload /> },
  { path: `${BASE_PATH}/new/condition`, element: <ConditionMemo /> },
  { path: `${BASE_PATH}/:id`, element: <LessonDetail /> },
  { path: `${BASE_PATH}/:id/lyrics`, element: <LessonLyrics /> },
];
