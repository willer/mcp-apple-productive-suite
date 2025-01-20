import '@jxa/global-type';
import { run } from '@jxa/run';

/**
 * Base interface for JXA objects that have getters and setters
 */
export interface JXAObject {
  getId(): string;
  getName(): string;
  getBody(): string;
  set name(value: string);
  set body(value: string);
}

/**
 * Base interface for JXA containers (lists, folders, etc.)
 */
export interface JXAContainer<T> {
  name(): string;
  id(): string;
}

/**
 * Base type for domain objects
 */
export interface BaseObject {
  id: string;
  name: string;
  body: string;
}

/**
 * Base filter type for searching/filtering objects
 */
export interface BaseFilter {
  name?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  modifiedAfter?: Date;
  modifiedBefore?: Date;
  body?: string;
}

/**
 * Convert a JXA object to a domain object
 */
export function convertToDomainObject<T extends BaseObject>(jxaObject: JXAObject): T {
  return {
    id: jxaObject.getId(),
    name: jxaObject.getName(),
    body: jxaObject.getBody(),
  } as T;
}

/**
 * Base class for singleton services
 */
export abstract class SingletonService<T> {
  private static _instances = new Map<string, SingletonService<unknown>>();

  constructor() {
    const name = this.constructor.name;
    if (SingletonService._instances.has(name)) {
      throw new Error(`${name} is a singleton. Use getInstance() instead of new.`);
    }
  }

  public static getInstance<S extends SingletonService<unknown>>(this: new () => S): S {
    const name = this.name;
    const instances = SingletonService._instances;
    if (!instances.has(name)) {
      instances.set(name, new this());
    }
    return instances.get(name) as S;
  }

  protected abstract convertFromJXA(jxaObject: JXAObject): T;
}

/**
 * Logger utility for debugging JXA interactions
 */
export class Logger {
  private static instance: Logger;
  private debugMode: boolean;

  private constructor() {
    this.debugMode = true; // Always enable debug mode for server logging
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }

  public async log(message: string, data?: unknown): Promise<void> {
    if (!this.debugMode) return;

    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp}: ${message}${data ? '\nData: ' + JSON.stringify(data, null, 2) : ''}`;
    console.error(logMessage);
  }

  public async logError(error: unknown, context?: string): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const fullMessage = context ? `${context}: ${errorMessage}` : errorMessage;
    console.error(`${new Date().toISOString()}: ERROR: ${fullMessage}`);
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
  }
} 