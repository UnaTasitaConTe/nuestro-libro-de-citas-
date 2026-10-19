import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/**
 * Campo de contraseña con botón para mostrarla u ocultarla (útil sobre todo
 * en móvil). Recibe las props de <Field> (id, aria-describedby…) y las del input.
 */
export default function PasswordInput({ className = 'field', ...props }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input {...props} type={visible ? 'text' : 'password'} className={`${className} pr-12`} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        aria-pressed={visible}
        aria-controls={props.id}
        className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-[0.9rem] text-ink transition-colors hover:text-ink-dark"
      >
        {visible ? <EyeOff className="h-4 w-4" strokeWidth={1.75} /> : <Eye className="h-4 w-4" strokeWidth={1.75} />}
      </button>
    </div>
  );
}
