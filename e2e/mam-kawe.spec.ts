import { expect, test } from '@playwright/test';

test('Mam kawę: jasne ziarna → drip → zimny napój → podanie', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Mam kawę. Co z nią zrobić?' }).click();

  // 1. Ziarna z opakowania: jasno palone, owocowe.
  await expect(page.getByRole('heading', { level: 1, name: 'Jakie masz ziarna?' })).toBeVisible();
  await page.getByRole('group', { name: 'Palenie' }).getByText('jasne').click();
  await page.getByRole('group', { name: 'Nuty smakowe' }).getByText('owocowe').click();
  await page.getByRole('link', { name: 'Dalej: polecane metody' }).click();

  // 2. Polecane metody: drip jest wśród najlepszych dla jasnego palenia.
  await expect(page.getByRole('heading', { level: 1, name: 'Polecane metody' })).toBeVisible();
  const ranking = page.getByRole('list', { name: 'Ranking metod' });
  await expect(ranking.getByRole('link').first()).toHaveText(/Drip \(V60\)|Chemex|AeroPress/);
  await ranking.getByRole('link', { name: /Drip \(V60\)/ }).click();

  // 3. Metoda i mielenie.
  await expect(page.getByRole('heading', { level: 1, name: 'Metoda i mielenie' })).toBeVisible();
  await expect(page.getByText('Średnio-drobno', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Dalej: co z tego zrobić' }).click();

  // 4. Zimny napój.
  await page.getByRole('region', { name: 'Na zimno' }).getByRole('link', { name: /Kawa mrożona z dripa/ }).click();

  // 5. Prowadzone parzenie: krok po kroku do końca.
  await expect(page.getByRole('heading', { level: 1, name: 'Parzenie' })).toBeVisible();
  const next = page.getByRole('button', { name: 'Dalej' });
  while (await next.isVisible()) await next.click();
  await page.getByRole('button', { name: 'Zakończ' }).click();

  // 6. Złożenie napoju.
  await expect(page.getByRole('heading', { level: 1, name: 'Złóż napój' })).toBeVisible();
  await expect(page.getByRole('img', { name: /Kawa mrożona z dripa, niska szklanka/ })).toBeVisible();
  await page.getByRole('link', { name: 'Dalej: jak podać' }).click();

  // 7. Podanie.
  await expect(page.getByRole('heading', { level: 1, name: 'Podanie' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Jak podać' })).toContainText('Niska szklanka');
  await expect(page.getByText('Smacznego!')).toBeVisible();

  // Bez ślepego zaułka: wstecz działa, a z końca da się wrócić na start.
  await page.getByRole('link', { name: 'Wstecz' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Złóż napój' })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('heading', { level: 1, name: 'Podanie' })).toBeVisible();
  await page.getByRole('link', { name: 'Wróć na start' }).click();
  await expect(page).toHaveURL('/');
});
