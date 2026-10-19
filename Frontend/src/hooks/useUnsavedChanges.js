import { useCallback, useEffect, useRef } from 'react';
import { useBlocker } from 'react-router-dom';

/**
 * Aviso al salir de un formulario con cambios sin guardar.
 * - Dentro de la app (enlaces, menú, «Volver», «Cancelar»): useBlocker detiene la
 *   navegación y la página muestra un ConfirmDialog con `dialogProps`.
 * - Recarga o cierre de la pestaña: el aviso nativo del navegador (beforeunload).
 * No se bloquea ir a /login (cerrar sesión es una decisión explícita) ni la
 * navegación que sigue a guardar: antes de navegar, llama a allowNavigation().
 */
export default function useUnsavedChanges(isDirty) {
  const dirtyRef = useRef(isDirty);
  const allowRef = useRef(false);

  useEffect(() => {
    dirtyRef.current = isDirty;
  }, [isDirty]);

  const shouldBlock = useCallback(
    ({ currentLocation, nextLocation }) =>
      dirtyRef.current &&
      !allowRef.current &&
      currentLocation.pathname !== nextLocation.pathname &&
      nextLocation.pathname !== '/login',
    []
  );
  const blocker = useBlocker(shouldBlock);

  useEffect(() => {
    if (!isDirty) return undefined;
    function onBeforeUnload(event) {
      event.preventDefault();
      event.returnValue = ''; // necesario en algunos navegadores para mostrar el aviso
    }
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty]);

  const allowNavigation = useCallback(() => {
    allowRef.current = true;
  }, []);

  return {
    allowNavigation,
    dialogProps: {
      open: blocker.state === 'blocked',
      title: '¿Salir sin guardar?',
      description: 'Tienes cambios sin guardar en este formulario. Si sales ahora, se perderán.',
      confirmLabel: 'Salir sin guardar',
      cancelLabel: 'Seguir editando',
      onConfirm: () => blocker.proceed?.(),
      onCancel: () => blocker.reset?.(),
    },
  };
}
