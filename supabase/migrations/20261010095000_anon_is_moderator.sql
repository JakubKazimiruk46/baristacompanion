-- Poprawka: reguła odczytu przepisów (i napojów) społeczności dla roli anon woła is_moderator().
-- Bez prawa wykonania tej funkcji niezalogowany dostawał „permission denied for function
-- is_moderator” zamiast listy, więc przeglądanie społeczności bez konta nie działało. Funkcja niczego
-- nie zdradza: dla niezalogowanego (auth.uid() = null) zawsze zwraca false.
grant execute on function public.is_moderator() to anon;
