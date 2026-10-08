import type { RouteObject } from 'react-router';
import { AppLayout } from './components/AppLayout';
import { BeanFormPage } from './pages/BeanFormPage';
import { BeanPage } from './pages/BeanPage';
import { BeansPage } from './pages/BeansPage';
import { BrewingPage } from './pages/BrewingPage';
import { BrewSessionPage } from './pages/BrewSessionPage';
import { DrinkPage } from './pages/DrinkPage';
import { DrinksPage } from './pages/DrinksPage';
import { FlowPage } from './pages/FlowPage';
import { FrothingPage } from './pages/FrothingPage';
import { MethodPage } from './pages/MethodPage';
import { MilkPage } from './pages/MilkPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { StartPage } from './pages/StartPage';
import { SyrupsPage } from './pages/SyrupsPage';

/** Wspólna definicja tras: createBrowserRouter w aplikacji, createMemoryRouter w testach. */
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <StartPage /> },
      { path: 'mam-kawe', element: <FlowPage /> },
      { path: 'mam-kawe/:step', element: <FlowPage /> },
      { path: 'napoje', element: <DrinksPage /> },
      { path: 'napoje/mleko', element: <MilkPage /> },
      { path: 'napoje/spienianie', element: <FrothingPage /> },
      { path: 'napoje/syropy', element: <SyrupsPage /> },
      { path: 'napoje/:drinkId', element: <DrinkPage /> },
      { path: 'parzenie', element: <BrewingPage /> },
      { path: 'parzenie/:methodId', element: <MethodPage /> },
      { path: 'parzenie/:methodId/start', element: <BrewSessionPage /> },
      { path: 'ziarna', element: <BeansPage /> },
      { path: 'ziarna/nowe', element: <BeanFormPage /> },
      { path: 'ziarna/:beanId', element: <BeanPage /> },
      { path: 'ziarna/:beanId/edycja', element: <BeanFormPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
