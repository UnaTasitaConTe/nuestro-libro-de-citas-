/**
 * Acceso seguro a localStorage para las preferencias de tema. En modo privado,
 * con el almacenamiento bloqueado o lleno, las funciones no lanzan: devuelven
 * null / false y la app sigue con el valor en memoria.
 */

export const PREFERENCE_KEY = 'nlc:tema'; // 'auto' | id de tema, elegido por la persona
export const APPLIED_KEY = 'nlc:tema-aplicado'; // último tema aplicado (lo lee index.html al arrancar)

export function readStorage(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}
