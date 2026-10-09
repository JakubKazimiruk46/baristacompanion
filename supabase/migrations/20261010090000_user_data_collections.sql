-- Nowe kolekcje synchronizacji: lista „Do spróbowania” (wishlist) i ulubione metody (method-favorites).
alter table public.user_data drop constraint user_data_collection;
alter table public.user_data add constraint user_data_collection check (
  collection in (
    'beans', 'journal', 'favorites', 'shelf', 'shopping', 'doses', 'grinders', 'recipes', 'drinks',
    'wishlist', 'method-favorites'
  )
);
