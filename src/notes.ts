import '@jxa/global-type';
import { run } from '@jxa/run';
import { BaseFilter, BaseObject, JXAContainer, JXAObject, SingletonService, Logger } from './shared.js';

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
  private logger: Logger;

  constructor() {
    super();
    this.logger = Logger.getInstance();
  }

  protected convertFromJXA(jxaObject: JXAObject): Note {
    const note = jxaObject as unknown as JXANote;
    const container = note.container();
    return {
      id: note.getId(),
      name: note.getName(),
      body: note.getBody(),
      creationDate: note.getCreationDate(),
      modificationDate: note.getModificationDate(),
      plainText: note.getPlainText(),
      container: {
        id: container.id(),
        name: container.name(),
      },
    };
  }

  async createNote(name: string, body: string, containerName?: string): Promise<Note> {
    try {
      this.logger.log('Creating note', { name, body, containerName });
      const result = await run(
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
      ) as Note;
      this.logger.log('Created note', result);
      return result;
    } catch (error) {
      await this.logger.logError(error, 'Failed to create note');
      throw error;
    }
  }

  async listNotes(filter?: NoteFilter): Promise<Note[]> {
    try {
      this.logger.log('Listing notes', { filter });
      const result = await run((filterStr) => {
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
      }, filter ? JSON.stringify(filter) : undefined) as Note[];
      this.logger.log('Listed notes', { count: result.length });
      return result;
    } catch (error) {
      await this.logger.logError(error, 'Failed to list notes');
      throw error;
    }
  }

  async updateNote(id: string, updates: Partial<Omit<Note, 'id' | 'creationDate' | 'modificationDate' | 'container'>>): Promise<Note> {
    try {
      this.logger.log('Updating note', { id, updates });
      const result = await run(
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
      ) as Note;
      this.logger.log('Updated note', result);
      return result;
    } catch (error) {
      await this.logger.logError(error, 'Failed to update note');
      throw error;
    }
  }

  async listFolders(): Promise<Array<{ id: string; name: string }>> {
    try {
      this.logger.log('Listing folders');
      const result = await run(() => {
        const app = Application('Notes');
        app.activate();

        return app.folders().map((f: JXANoteContainer) => ({
          id: f.id(),
          name: f.name(),
        }));
      }) as Array<{ id: string; name: string }>;
      this.logger.log('Listed folders', { count: result.length });
      return result;
    } catch (error) {
      await this.logger.logError(error, 'Failed to list folders');
      throw error;
    }
  }
}
