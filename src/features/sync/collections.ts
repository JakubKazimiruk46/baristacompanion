import { myDrinksStore, parseMyDrink, type MyDrink } from '../assistant/myDrinks';
import { beansStore, parseBeans, type SavedBean } from '../beans/store';
import { dosesStore, parseDoses } from '../brewing/doseStore';
import { methodFavoritesStore, parseMethodFavorites } from '../favorites/methods';
import { favoritesStore, parseFavorites } from '../favorites/store';
import { grindersStore, parseGrinders, type GrindersState, type SavedGrinder } from '../grinder/store';
import { journalStore, MAX_ENTRIES, parseJournal, type JournalEntry } from '../journal/store';
import { parseRecipes, recipesStore } from '../recipes/store';
import type { UserRecipe } from '../recipes/recipe';
import { parseShopping, shoppingStore, type ShoppingItem } from '../shelf/shopping';
import { parseShelf, shelfStore, type Shelf } from '../shelf/store';
import { parseWishlist, wishlistStore } from '../wishlist/store';
import { stableStringify, type CollectionName, type SyncRecord } from './records';

/** Pierwsze logowanie: id lokalnego duplikatu → id rekordu z konta, dla każdej kolekcji. */
export type Remaps = Partial<Record<CollectionName, Map<string, string>>>;

/** Jak magazyn z przeglądarki zamienia się w rekordy do synchronizacji i z powrotem. */
export interface Collection<T = unknown> {
  name: CollectionName;
  subscribe: (listener: () => void) => () => void;
  read: () => T;
  write: (value: T) => void;
  /** Rekordy z wartości magazynu: id → dane. */
  toRecords: (value: T) => Map<string, unknown>;
  /** Wartość magazynu z żywych rekordów (bez usuniętych). current: obecna wartość (kolejność). */
  fromRecords: (records: SyncRecord[], current: T) => T;
  /** Dane rekordu z serwera albo z pliku, sprawdzone jak w parserze magazynu. null: odrzuć. */
  parse: (id: string, data: unknown) => unknown;
  /** Klucz treści: te same ziarna dodane na dwóch urządzeniach łączą się przy pierwszym logowaniu. */
  dedupeKey?: (data: unknown) => string | null;
  /** Podmienia odwołania do połączonych duplikatów (np. ziarna we wpisie dziennika). */
  remap?: (id: string, data: unknown, remaps: Remaps) => unknown;
  /** Pierwsze logowanie: ten sam rekord tu i na koncie łączy się zamiast wybierać nowszy (półka). */
  combine?: (local: unknown, remote: unknown) => unknown;
}

const byId = <T extends { id: string }>(items: T[]) => new Map<string, unknown>(items.map((item) => [item.id, item]));
const lower = (text: string | undefined) => (text ?? '').trim().toLowerCase();
const remapId = (id: string | undefined, map: Map<string, string> | undefined) => (id && map?.get(id)) ?? id;

/** Rekord z listy, jeśli przeszedł parser magazynu i ma to samo id. */
function one<T extends { id: string }>(parse: (value: unknown) => T[], id: string, data: unknown): T | null {
  const item = parse([data])[0];
  return item?.id === id ? item : null;
}

const beans: Collection<SavedBean[]> = {
  name: 'beans',
  subscribe: beansStore.subscribe,
  read: beansStore.getSnapshot,
  write: beansStore.replaceAll,
  toRecords: byId,
  fromRecords: (records) => records.map((r) => r.data as SavedBean).sort((a, b) => b.createdAt - a.createdAt),
  parse: (id, data) => one(parseBeans, id, data),
  dedupeKey: (data) => {
    const bean = data as SavedBean;
    return `${lower(bean.name)}|${lower(bean.roaster)}`;
  },
};

const journal: Collection<JournalEntry[]> = {
  name: 'journal',
  subscribe: journalStore.subscribe,
  read: journalStore.getSnapshot,
  write: journalStore.replaceAll,
  toRecords: byId,
  fromRecords: (records) =>
    records
      .map((r) => r.data as JournalEntry)
      .sort((a, b) => b.brewedAt - a.brewedAt)
      .slice(0, MAX_ENTRIES),
  parse: (id, data) => one(parseJournal, id, data),
  remap: (_id, data, remaps) => {
    const entry = data as JournalEntry;
    return {
      ...entry,
      ...(entry.beanId && { beanId: remapId(entry.beanId, remaps.beans) }),
      ...(entry.recipeId && { recipeId: remapId(entry.recipeId, remaps.recipes) }),
      ...(entry.grind && { grind: { ...entry.grind, grinderId: remapId(entry.grind.grinderId, remaps.grinders)! } }),
    };
  },
};

/** Ulubione: rekord na napój, kolejność: ostatnio dodane pierwsze. */
const favorites: Collection<string[]> = {
  name: 'favorites',
  subscribe: favoritesStore.subscribe,
  read: favoritesStore.getSnapshot,
  write: favoritesStore.replaceAll,
  toRecords: (ids) => new Map(ids.map((id) => [id, true])),
  // Sortowanie jest stabilne: rekordy bez czasu (stary zapis) zostają w dotychczasowej kolejności.
  fromRecords: (records) => [...records].sort((a, b) => b.updatedAt - a.updatedAt).map((r) => r.id),
  parse: (id, data) => (data === true && parseFavorites([id]).length === 1 ? true : null),
};

/** Ulubione metody: rekord na metodę, ostatnio dodane pierwsze. */
const methodFavorites: Collection<string[]> = {
  name: 'method-favorites',
  subscribe: methodFavoritesStore.subscribe,
  read: methodFavoritesStore.getSnapshot,
  write: methodFavoritesStore.replaceAll,
  toRecords: (ids) => new Map(ids.map((id) => [id, true])),
  fromRecords: (records) => [...records].sort((a, b) => b.updatedAt - a.updatedAt).map((r) => r.id),
  parse: (id, data) => (data === true && parseMethodFavorites([id]).length === 1 ? true : null),
};

/** „Do spróbowania”: rekord na napój, ostatnio dodane pierwsze (jak ulubione). */
const wishlist: Collection<string[]> = {
  name: 'wishlist',
  subscribe: wishlistStore.subscribe,
  read: wishlistStore.getSnapshot,
  write: wishlistStore.replaceAll,
  toRecords: (ids) => new Map(ids.map((id) => [id, true])),
  fromRecords: (records) => [...records].sort((a, b) => b.updatedAt - a.updatedAt).map((r) => r.id),
  parse: (id, data) => (data === true && parseWishlist([id]).length === 1 ? true : null),
};

/** Półka: jeden rekord. Przy pierwszym logowaniu łączy to, co jest w domu według obu urządzeń. */
const shelf: Collection<Shelf | null> = {
  name: 'shelf',
  subscribe: shelfStore.subscribe,
  read: shelfStore.getSnapshot,
  write: shelfStore.set,
  toRecords: (value) => new Map(value ? [['shelf', value]] : []),
  fromRecords: (records) => (records.find((r) => r.id === 'shelf')?.data as Shelf | undefined) ?? null,
  parse: (id, data) => (id === 'shelf' ? parseShelf(data) : null),
  combine: (local, remote) => {
    const [a, b] = [local as Shelf, remote as Shelf];
    return {
      ingredients: [...new Set([...a.ingredients, ...b.ingredients])],
      methods: [...new Set([...a.methods, ...b.methods])],
    };
  },
};

/** Lista zakupów: pozycje zostają w swojej kolejności, nowe dochodzą na końcu. */
const shopping: Collection<ShoppingItem[]> = {
  name: 'shopping',
  subscribe: shoppingStore.subscribe,
  read: shoppingStore.getSnapshot,
  write: shoppingStore.replaceAll,
  toRecords: byId,
  fromRecords: (records, current) => {
    const data = new Map(records.map((r) => [r.id, r.data as ShoppingItem]));
    const kept = current.flatMap((item) => (data.has(item.id) ? [data.get(item.id)!] : []));
    const added = records.filter((r) => !current.some((item) => item.id === r.id)).map((r) => r.data as ShoppingItem);
    return [...kept, ...added];
  },
  parse: (id, data) => one(parseShopping, id, data),
};

/** Ilości z kalkulatora: rekord na metodę albo własny przepis. */
const doses: Collection<Record<string, number>> = {
  name: 'doses',
  subscribe: dosesStore.subscribe,
  read: dosesStore.getSnapshot,
  write: dosesStore.replaceAll,
  toRecords: (value) => new Map(Object.entries(value)),
  fromRecords: (records) => Object.fromEntries(records.map((r) => [r.id, r.data as number])),
  parse: (id, data) => parseDoses({ [id]: data })[id] ?? null,
};

const ACTIVE = '_active';

/** Młynki: rekord na młynek (z ustawieniami dla metod) i jeden na wybór używanego. */
const grinders: Collection<GrindersState> = {
  name: 'grinders',
  subscribe: grindersStore.subscribe,
  read: grindersStore.getSnapshot,
  write: grindersStore.replaceAll,
  toRecords: (state) => {
    const records = byId(state.grinders);
    if (state.activeId) records.set(ACTIVE, state.activeId);
    return records;
  },
  fromRecords: (records) =>
    parseGrinders({
      grinders: records
        .filter((r) => r.id !== ACTIVE)
        .map((r) => r.data as SavedGrinder)
        .sort((a, b) => a.createdAt - b.createdAt),
      activeId: records.find((r) => r.id === ACTIVE)?.data ?? null,
    }),
  parse: (id, data) => {
    if (id === ACTIVE) return typeof data === 'string' ? data : null;
    const grinder = parseGrinders({ grinders: [data] }).grinders[0];
    return grinder?.id === id ? grinder : null;
  },
  dedupeKey: (data) => {
    if (typeof data === 'string') return null;
    const grinder = data as SavedGrinder;
    return `${lower(grinder.name)}|${grinder.unit}`;
  },
  remap: (id, data, remaps) => (id === ACTIVE ? remapId(data as string, remaps.grinders) : data),
};

const recipes: Collection<UserRecipe[]> = {
  name: 'recipes',
  subscribe: recipesStore.subscribe,
  read: recipesStore.getSnapshot,
  write: recipesStore.replaceAll,
  toRecords: byId,
  fromRecords: (records) => records.map((r) => r.data as UserRecipe).sort((a, b) => b.createdAt - a.createdAt),
  parse: (id, data) => one(parseRecipes, id, data),
  dedupeKey: (data) => {
    const { methodId, name, dose, waterTempC, grind, steps, note } = data as UserRecipe;
    return stableStringify({ methodId, name, dose, waterTempC, grind, steps, note });
  },
  remap: (_id, data, remaps) => {
    const recipe = data as UserRecipe;
    return recipe.grinder
      ? { ...recipe, grinder: { ...recipe.grinder, grinderId: remapId(recipe.grinder.grinderId, remaps.grinders)! } }
      : recipe;
  },
};

/** „Moje napoje” od asystenta: rekord na napój, najnowsze pierwsze. */
const myDrinks: Collection<MyDrink[]> = {
  name: 'drinks',
  subscribe: myDrinksStore.subscribe,
  read: myDrinksStore.getSnapshot,
  write: myDrinksStore.replaceAll,
  toRecords: (items) => new Map(items.map((item) => [item.drink.id, item])),
  fromRecords: (records) => records.map((r) => r.data as MyDrink).sort((a, b) => b.savedAt - a.savedAt),
  parse: (id, data) => {
    const item = parseMyDrink(data);
    return item?.drink.id === id ? item : null;
  },
};

/** Wszystkie synchronizowane kolekcje (bez stanu na jedno urządzenie: trwające cold brew, ścieżka „Mam kawę”). */
export const collections: Collection[] = [
  beans,
  journal,
  favorites,
  shelf,
  shopping,
  doses,
  grinders,
  recipes,
  myDrinks,
  wishlist,
  methodFavorites,
] as Collection[];

export const getCollection = (name: CollectionName) => collections.find((c) => c.name === name)!;
