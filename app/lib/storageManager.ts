/**
 * Clase StorageManager para gestionar el almacenamiento de datos en el navegador (localStorage o sessionStorage).
 */
export class StorageManager {
  private storage: Storage;

  /**
   * Constructor de la clase StorageManager.
   * @param type El tipo de almacenamiento a utilizar: 'local' para localStorage, 'session' para sessionStorage.
   * @throws Error Si el tipo de almacenamiento no es válido.
   */
  constructor(type: 'local' | 'session' = 'local') {
    if (type === 'local') {
      this.storage = localStorage;
    } else if (type === 'session') {
      this.storage = sessionStorage;
    } else {
      throw new Error('Tipo de almacenamiento no válido. Debe ser "local" o "session".');
    }
  }

  /**
   * Guarda un valor en el almacenamiento.
   * @param key La clave con la que se guardará el valor.
   * @param value El valor a guardar.  Debe ser un tipo de dato que JSON.stringify pueda manejar.
   * @throws Error Si hay un error al guardar en el almacenamiento.
   */
  public save<T>(key: string, value: T): void {
    try {
      const serializedValue = JSON.stringify(value);
      this.storage.setItem(key, serializedValue);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error al guardar "${key}": ${error.message}`);
      } else {
        throw new Error(`Error al guardar "${key}": Error desconocido`);
      }
    }
  }

  /**
   * Carga un valor desde el almacenamiento.
   * @param key La clave del valor a cargar.
   * @returns El valor cargado, o null si la clave no existe o hay un error.
   */
  public load<T>(key: string): T | null {
    try {
      const serializedValue = this.storage.getItem(key);
      if (serializedValue === null) {
        return null;
      }
      const value: T = JSON.parse(serializedValue);
      return value;
    } catch (error) {
      console.error(`Error al cargar "${key}":`, error);
      return null; // Importante: retornar null en caso de error para que el código que llama sepa que algo salió mal.
    }
  }

  /**
   * Elimina un valor del almacenamiento.
   * @param key La clave del valor a eliminar.
   */
  public remove(key: string): void {
    this.storage.removeItem(key);
  }

  /**
   * Limpia todo el almacenamiento.
   */
  public clear(): void {
    this.storage.clear();
  }

  /**
   * Devuelve todas las claves almacenadas.
   * @returns Un array de strings con todas las claves.
   */
  public keys(): string[] {
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
        return this.storage.length;
    }

    /**
     * Comprueba si una clave existe en el almacenamiento.
     * @param key La clave a comprobar.
     * @returns True si la clave existe, false en caso contrario.
     */
    public contains(key: string): boolean {
        return this.storage.getItem(key) !== null;
    }
}
/*
// Ejemplo de uso:
const localStorageManager = new StorageManager('local'); // Usa localStorage
const sessionStorageManager = new StorageManager('session'); // Usa sessionStorage

// Definimos una interfaz para el tipo de datos que vamos a guardar.
interface UserProfile {
    name: string;
    age: number;
    email: string;
}

// Guardar datos en localStorage
const userProfile: UserProfile = { name: 'Juan Pérez', age: 30, email: 'juan.perez@example.com' };
localStorageManager.save<UserProfile>('userProfile', userProfile);

// Guardar un string simple en localStorage
localStorageManager.save<string>("nombre", "Pedro");

// Guardar un número en localStorage
localStorageManager.save<number>("edad", 25);

// Guardar un booleano
localStorageManager.save<boolean>("esAdmin", true);

// Guardar un array de números
localStorageManager.save<number[]>("numeros", [1, 2, 3, 4, 5]);

// Guardar un array de strings
localStorageManager.save<string[]>("nombres", ["Ana", "Luis", "María"]);

// Guardar un array de objetos
const productos = [
    { id: 1, nombre: "Producto 1", precio: 10.99 },
    { id: 2, nombre: "Producto 2", precio: 19.99 },
];
localStorageManager.save<{ id: number; nombre: string; precio: number }[]>("productos", productos);


// Cargar datos desde localStorage
const loadedUserProfile = localStorageManager.load<UserProfile>('userProfile');
const nombre = localStorageManager.load<string>("nombre");
const edad = localStorageManager.load<number>("edad");
const esAdmin = localStorageManager.load<boolean>("esAdmin");
const numeros = localStorageManager.load<number[]>("numeros");
const nombres = localStorageManager.load<string[]>("nombres");
const productosCargados = localStorageManager.load<{ id: number; nombre: string; precio: number }[]>("productos");


if (loadedUserProfile) {
  console.log('Perfil de usuario cargado desde localStorage:', loadedUserProfile);
} else {
  console.log('No se encontró el perfil de usuario en localStorage.');
}

console.log("Nombre cargado:", nombre);
console.log("Edad cargada:", edad);
console.log("Es admin:", esAdmin);
console.log("Números cargados:", numeros);
console.log("Nombres cargados:", nombres);
console.log("Productos cargados", productosCargados);


// Ejemplo de uso de las otras funciones
console.log("Claves en localStorage:", localStorageManager.keys());
console.log("Tamaño de localStorage:", localStorageManager.size());
console.log("¿Existe la clave 'userProfile'?:", localStorageManager.contains('userProfile'));

// Eliminar datos de localStorage
// localStorageManager.remove('userProfile');
// localStorageManager.clear();

// Guardar datos en sessionStorage
const sessionData = { message: '¡Hola desde sessionStorage!' };
sessionStorageManager.save('sessionData', sessionData);

// Cargar datos desde sessionStorage
const loadedSessionData = sessionStorageManager.load<{ message: string }>('sessionData');
if (loadedSessionData) {
  console.log('Datos de sesión cargados:', loadedSessionData);
}

*/