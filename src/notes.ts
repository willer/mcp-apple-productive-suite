import '@jxa/global-type';
import { run } from '@jxa/run';
import { BaseFilter, BaseObject, JXAContainer, JXAObject, SingletonService } from './shared.js';

export interface Note extends BaseObject {
  creationDate: Date;
  modificationDate: Date;
  plainText: string;
  container: {
    id: string;
    name: string;
  };
}

export interface NoteFilter extends BaseFilter {
  containerId?: string;
  containerName?: string;
}

interface JXANote extends JXAObject {
  // Additional getters
  getCreationDate(): Date;
  getModificationDate(): Date;
  getPlainText(): string;
  container(): JXANoteContainer;
}

interface JXANoteContainer extends JXAContainer<JXANote> {
  notes(): JXANote[];
}

export class NotesService extends SingletonService<Note> {
  protected convertFromJXA(jxaObject: JXANote): Note {
    const container = jxaObject.container();
    return {
      id: jxaObject.getId(),
      name: jxaObject.getName(),
      body: jxaObject.getBody(),
      creationDate: jxaObject.getCreationDate(),
      modificationDate: jxaObject.getModificationDate(),
      plainText: jxaObject.getPlainText(),
      container: {
        id: container.id(),
        name: container.name(),
      },
    };
  }

  async createNote(name: string, body: string, containerName?: string): Promise<Note> {
    return run(
      (name, body, containerName) => {
        const app = Application('Notes');
        app.activate();

        let container: JXANoteContainer;
        if (containerName) {
          container = app.folders().find((f: JXANoteContainer) => f.name() === containerName);
          if (!container) {
            throw new Error(`Folder "${containerName}" not found`);
          }
        } else {
          container = app.defaultAccount().defaultFolder();
        }

        const newNote = app.make({
          new: 'note',
          withProperties: {
            name,
            body,
          },
          at: container,
        }) as JXANote;

        return {
          id: newNote.getId(),
          name: newNote.getName(),
          body: newNote.getBody(),
          creationDate: newNote.getCreationDate(),
          modificationDate: newNote.getModificationDate(),
          plainText: newNote.getPlainText(),
          container: {
            id: container.id(),
            name: container.name(),
          },
        };
      },
      name,
      body,
      containerName,
    );
  }

  async listNotes(filter?: NoteFilter): Promise<Note[]> {
    return run((filterStr) => {
      const filter = filterStr ? JSON.parse(filterStr) : {};
      const app = Application('Notes');
      app.activate();

      let containers: JXANoteContainer[];
      if (filter.containerId || filter.containerName) {
        containers = app.folders().filter((f: JXANoteContainer) => {
          if (filter.containerId && f.id() !== filter.containerId) {
            return false;
          }
          if (filter.containerName && f.name() !== filter.containerName) {
            return false;
          }
          return true;
        });
      } else {
        containers = app.folders();
      }

      const allNotes = containers.map((container) => container.notes()).flat();
      
      return allNotes
        .filter((note: JXANote) => {
          if (filter.name && !note.getName().toLowerCase().includes(filter.name.toLowerCase())) {
            return false;
          }
          if (filter.body && !note.getBody().toLowerCase().includes(filter.body.toLowerCase())) {
            return false;
          }
          if (filter.createdAfter && note.getCreationDate() < new Date(filter.createdAfter)) {
            return false;
          }
          if (filter.createdBefore && note.getCreationDate() > new Date(filter.createdBefore)) {
            return false;
          }
          if (filter.modifiedAfter && note.getModificationDate() < new Date(filter.modifiedAfter)) {
            return false;
          }
          if (filter.modifiedBefore && note.getModificationDate() > new Date(filter.modifiedBefore)) {
            return false;
          }
          return true;
        })
        .map((note: JXANote) => ({
          id: note.getId(),
          name: note.getName(),
          body: note.getBody(),
          creationDate: note.getCreationDate(),
          modificationDate: note.getModificationDate(),
          plainText: note.getPlainText(),
          container: {
            id: note.container().id(),
            name: note.container().name(),
          },
        }));
    }, filter ? JSON.stringify(filter) : undefined);
  }

  async updateNote(id: string, updates: Partial<Omit<Note, 'id' | 'creationDate' | 'modificationDate' | 'container'>>): Promise<Note> {
    return run(
      (id, updatesStr) => {
        const updates = JSON.parse(updatesStr);
        const app = Application('Notes');
        app.activate();

        const note = app
          .folders()
          .map((f: JXANoteContainer) => f.notes())
          .flat()
          .find((n: JXANote) => n.getId() === id);

        if (!note) {
          throw new Error(`Note with id ${id} not found`);
        }

        // Apply updates
        if (updates.name !== undefined) note.name = updates.name;
        if (updates.body !== undefined) note.body = updates.body;

        return {
          id: note.getId(),
          name: note.getName(),
          body: note.getBody(),
          creationDate: note.getCreationDate(),
          modificationDate: note.getModificationDate(),
          plainText: note.getPlainText(),
          container: {
            id: note.container().id(),
            name: note.container().name(),
          },
        };
      },
      id,
      JSON.stringify(updates),
    );
  }

  async listFolders(): Promise<Array<{ id: string; name: string }>> {
    return run(() => {
      const app = Application('Notes');
      app.activate();

      return app.folders().map((f: JXANoteContainer) => ({
        id: f.id(),
        name: f.name(),
      }));
    });
  }
}
