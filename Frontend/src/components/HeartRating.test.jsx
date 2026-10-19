import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HeartRating from './HeartRating';

function Controlled({ initial = 0 }) {
  const [value, setValue] = useState(initial);
  return <HeartRating value={value} onChange={setValue} label="Valoración" />;
}

describe('HeartRating interactiva (grupo de radio)', () => {
  it('Tab entra en el primer corazón cuando no hay valor', async () => {
    const user = userEvent.setup();
    render(<Controlled />);
    await user.tab();
    expect(screen.getByRole('radio', { name: '1 corazón' })).toHaveFocus();
    // Solo un corazón es tabulable a la vez (foco itinerante).
    expect(screen.getAllByRole('radio').filter((r) => r.tabIndex === 0)).toHaveLength(1);
  });

  it('las flechas, Inicio y Fin cambian el valor y mueven el foco', async () => {
    const user = userEvent.setup();
    render(<Controlled initial={2} />);
    await user.tab();
    expect(screen.getByRole('radio', { name: '2 corazones' })).toHaveFocus();

    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('radio', { name: '3 corazones' })).toBeChecked();
    expect(screen.getByRole('radio', { name: '3 corazones' })).toHaveFocus();

    await user.keyboard('{End}');
    expect(screen.getByRole('radio', { name: '5 corazones' })).toBeChecked();

    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('radio', { name: '5 corazones' })).toBeChecked();

    await user.keyboard('{Home}');
    expect(screen.getByRole('radio', { name: '1 corazón' })).toBeChecked();
    expect(screen.getByRole('radio', { name: '1 corazón' })).toHaveFocus();
  });
});
