import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { routes } from '../routes';

type UserOptions = Parameters<typeof userEvent.setup>[0];

/** Renderuje całą aplikację pod podanym adresem. */
export function renderApp(path: string, userOptions?: UserOptions) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const user = userEvent.setup(userOptions);
  render(<RouterProvider router={router} />);
  return { router, user };
}

export function mainNav() {
  return screen.getByRole('navigation', { name: 'Główna nawigacja' });
}

export function currentUrl(router: ReturnType<typeof createMemoryRouter>) {
  return router.state.location.pathname + router.state.location.search;
}
