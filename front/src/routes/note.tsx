import NoteList from '@/pages/notes/NoteList';

const BASE_PATH = '/notes';

export const noteRoutes = [
  { path: `${BASE_PATH}/:type/:id`, element: <NoteList /> },
];
