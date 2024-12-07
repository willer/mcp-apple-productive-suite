import '@jxa/global-type';
import { run } from '@jxa/run';

export type Note = { id: string; name: string; body: string };

export const createNote = async (name: string, body: string): Promise<Note> => {
  // This callback function is run as JXA
  return run(
    (name, body) => {
      const notesApp = Application('Notes');
      notesApp.activate();

      const newNote = notesApp.make({
        new: 'note',
        withProperties: {
          name,
          body,
        },
      });

      return newNote;
    },
    name,
    body,
  );
};
