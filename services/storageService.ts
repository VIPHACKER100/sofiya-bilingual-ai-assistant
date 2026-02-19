const STORAGE_PREFIX = 'sofiya_';

class StorageService {
  private prefix: string;

  constructor(prefix = STORAGE_PREFIX) {
    this.prefix = prefix;
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  set<T>(key: string, value: T): void {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(this.getKey(key), serialized);
    } catch (error) {
      console.error(`Storage error: Failed to save ${key}`, error);
    }
  }

  get<T>(key: string, defaultValue?: T): T | null {
    try {
      const item = localStorage.getItem(this.getKey(key));
      if (item === null) return defaultValue !== undefined ? defaultValue : null;
      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`Storage error: Failed to read ${key}`, error);
      return defaultValue !== undefined ? defaultValue : null;
    }
  }

  remove(key: string): boolean {
    try {
      localStorage.removeItem(this.getKey(key));
      return true;
    } catch {
      return false;
    }
  }

  clear(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Storage error: Failed to clear', error);
    }
  }

  has(key: string): boolean {
    return localStorage.getItem(this.getKey(key)) !== null;
  }

  keys(): string[] {
    return Object.keys(localStorage)
      .filter(key => key.startsWith(this.prefix))
      .map(key => key.slice(this.prefix.length));
  }

  getSize(): number {
    let size = 0;
    for (const key of this.keys()) {
      const item = localStorage.getItem(this.getKey(key));
      if (item) size += item.length;
    }
    return size;
  }

  export(): Record<string, any> {
    const data: Record<string, any> = {};
    for (const key of this.keys()) {
      data[key] = this.get(key);
    }
    return data;
  }

  import(data: Record<string, any>): void {
    for (const [key, value] of Object.entries(data)) {
      this.set(key, value);
    }
  }
}

export const storageService = new StorageService();
export const tempStorage = new StorageService('temp_');
