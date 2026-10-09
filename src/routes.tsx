import { Navigate, type RouteObject } from 'react-router';
import { AppLayout } from './components/AppLayout';
import { AccountPage } from './pages/AccountPage';
import { AssistantPage } from './pages/AssistantPage';
import { BaribarPage } from './pages/BaribarPage';
import { BeanFormPage } from './pages/BeanFormPage';
import { BeanPage } from './pages/BeanPage';
import { BrewingPage } from './pages/BrewingPage';
import { BrewSessionPage } from './pages/BrewSessionPage';
import { CommunityRecipePage } from './pages/CommunityRecipePage';
import { DrinkPage } from './pages/DrinkPage';
import { DrinksPage } from './pages/DrinksPage';
import { FlowMenuPage, WishlistFlowPage } from './pages/FlowMenuPage';
import { FlowPage } from './pages/FlowPage';
import { FrothingPage } from './pages/FrothingPage';
import { GrinderFormPage } from './pages/GrinderFormPage';
import { GrindersPage } from './pages/GrindersPage';
import { JournalEntryPage } from './pages/JournalEntryPage';
import { JournalPage } from './pages/JournalPage';
import { MethodPage } from './pages/MethodPage';
import { MilkPage } from './pages/MilkPage';
import { ModerationPage } from './pages/ModerationPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { RecipeFormPage } from './pages/RecipeFormPage';
import { RecipePage } from './pages/RecipePage';
import { SharedRecipePage } from './pages/SharedRecipePage';
import { ShoppingListPage } from './pages/ShoppingListPage';
import { StartPage } from './pages/StartPage';
import { SurprisePage } from './pages/SurprisePage';
import { SyrupsPage } from './pages/SyrupsPage';

/** Wspólna definicja tras: createBrowserRouter w aplikacji, createMemoryRouter w testach. */
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <StartPage /> },
      { path: 'mam-kawe', element: <FlowMenuPage /> },
      { path: 'mam-kawe/do-sprobowania', element: <WishlistFlowPage /> },
      { path: 'mam-kawe/zaskocz', element: <SurprisePage /> },
      { path: 'mam-kawe/:step', element: <FlowPage /> },
      { path: 'napoje', element: <DrinksPage /> },
      { path: 'napoje/mleko', element: <MilkPage /> },
      { path: 'napoje/spienianie', element: <FrothingPage /> },
      { path: 'napoje/syropy', element: <SyrupsPage /> },
      // Dawne „Co mam w domu”: teraz sekcje Baribaru.
      { path: 'napoje/co-mam', element: <Navigate to="/baribar?sekcja=mleka" replace /> },
      { path: 'napoje/zakupy', element: <ShoppingListPage /> },
      { path: 'napoje/asystent', element: <AssistantPage /> },
      { path: 'napoje/:drinkId', element: <DrinkPage /> },
      { path: 'parzenie', element: <BrewingPage /> },
      { path: 'parzenie/dziennik', element: <JournalPage /> },
      { path: 'parzenie/dziennik/:entryId', element: <JournalEntryPage /> },
      { path: 'parzenie/:methodId', element: <MethodPage /> },
      { path: 'parzenie/:methodId/start', element: <BrewSessionPage /> },
      { path: 'parzenie/:methodId/przepisy/nowy', element: <RecipeFormPage /> },
      { path: 'parzenie/:methodId/przepisy/:recipeId', element: <RecipePage /> },
      { path: 'parzenie/:methodId/przepisy/:recipeId/edycja', element: <RecipeFormPage /> },
      { path: 'parzenie/:methodId/spolecznosc/:recipeId', element: <CommunityRecipePage /> },
      { path: 'przepis', element: <SharedRecipePage /> },
      { path: 'baribar', element: <BaribarPage /> },
      { path: 'ziarna', element: <Navigate to="/baribar" replace /> },
      { path: 'ziarna/nowe', element: <BeanFormPage /> },
      { path: 'ziarna/mlynek', element: <GrindersPage /> },
      { path: 'ziarna/mlynek/nowy', element: <GrinderFormPage /> },
      { path: 'ziarna/:beanId', element: <BeanPage /> },
      { path: 'ziarna/:beanId/edycja', element: <BeanFormPage /> },
      { path: 'konto', element: <AccountPage /> },
      { path: 'prywatnosc', element: <PrivacyPage /> },
      { path: 'moderacja', element: <ModerationPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
