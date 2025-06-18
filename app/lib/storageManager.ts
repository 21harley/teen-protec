/**
 * Clase StorageManager para gestionar el almacenamiento de datos en el navegador (localStorage o sessionStorage).
 * En entornos sin window (como SSR), las operaciones no harán nada y devolverán valores por defecto.
 */
export class StorageManager {
  private storage: Storage | null;

  /**
   * Constructor de la clase StorageManager.
   * @param type El tipo de almacenamiento a utilizar: 'local' para localStorage, 'session' para sessionStorage.
   */
  constructor(type: 'local' | 'session' = 'local') {
    if (typeof window === 'undefined') {
      // Entorno sin window (SSR, Node.js, etc.)
      this.storage = null;
      return;
    }

    try {
      if (type === 'local') {
        this.storage = window.localStorage;
      } else if (type === 'session') {
        this.storage = window.sessionStorage;
      } else {
        throw new Error('Tipo de almacenamiento no válido. Debe ser "local" o "session".');
      }
    } catch (error) {
      // En caso de que el acceso al storage falle (como en modo incógnito)
      this.storage = null;
    }
  }

  /**
   * Guarda un valor en el almacenamiento.
   * @param key La clave con la que se guardará el valor.
   * @param value El valor a guardar. Debe ser un tipo de dato que JSON.stringify pueda manejar.
   */
  public save<T>(key: string, value: T): void {
    if (!this.storage) return;

    try {
      const serializedValue = JSON.stringify(value);
      this.storage.setItem(key, serializedValue);
    } catch (error) {
      console.error(`Error al guardar "${key}":`, error);
    }
  }

  /**
   * Carga un valor desde el almacenamiento.
   * @param key La clave del valor a cargar.
   * @returns El valor cargado, o null si la clave no existe o hay un error.
   */
  public load<T>(key: string): T | null {
    if (!this.storage) return null;

    try {
      const serializedValue = this.storage.getItem(key);
      if (serializedValue === null) {
        return null;
      }
      return JSON.parse(serializedValue) as T;
    } catch (error) {
      console.error(`Error al cargar "${key}":`, error);
      return null;
    }
  }

  /**
   * Elimina un valor del almacenamiento.
   * @param key La clave del valor a eliminar.
   */
  public remove(key: string): void {
    if (!this.storage) return;
    this.storage.removeItem(key);
  }

  /**
   * Limpia todo el almacenamiento.
   */
  public clear(): void {
    if (!this.storage) return;
    this.storage.clear();
  }

  /**
   * Devuelve todas las claves almacenadas.
   * @returns Un array de strings con todas las claves.
   */
  public keys(): string[] {
    if (!this.storage) return [];

    const keys: string[] = [];
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key !== null) {
        keys.push(key);
      }
    }
    return keys;
  }

  /**
   * Devuelve el número de elementos almacenados.
   * @returns El número de elementos almacenados.
   */
  public size(): number {
    return this.storage?.length ?? 0;
  }

  /**
   * Comprueba si una clave existe en el almacenamiento.
   * @param key La clave a comprobar.
   * @returns True si la clave existe, false en caso contrario.
   */
  public contains(key: string): boolean {
    return this.storage?.getItem(key) !== null;
  }

  /**
   * Verifica si el almacenamiento está disponible.
   * @returns True si el almacenamiento está disponible, false en caso contrario.
   */
  public isAvailable(): boolean {
    return this.storage !== null;
  }
}