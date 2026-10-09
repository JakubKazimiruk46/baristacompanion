import { expect, test } from '@playwright/test';

test('własny przepis: kopia metody → zmiana → parzenie → link', async ({ page }) => {
  await page.goto('/parzenie/aeropress');
  await page.getByRole('link', { name: 'Zrób własną wersję' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Własna wersja' })).toBeVisible();

  await page.getByLabel('Nazwa').fill('AeroPress na szybko');
  // Pierwszy krok na koniec listy: przyciski przesuwania działają też z klawiatury.
  await page.getByRole('button', { name: 'Przesuń krok 1 w dół' }).click();
  await expect(page.getByRole('button', { name: 'Przesuń krok 2 w dół' })).toBeFocused();
  await page.getByRole('button', { name: 'Zapisz przepis' }).click();

  await expect(page.getByRole('heading', { level: 1, name: 'AeroPress na szybko' })).toBeVisible();
  await page.getByRole('link', { name: 'Parz według przepisu' }).first().click();
  await expect(page).toHaveURL(/\/parzenie\/aeropress\/start\?przepis=/);
  const next = page.getByRole('button', { name: 'Dalej' });
  while (await next.isVisible()) await next.click();
  await page.getByRole('button', { name: 'Zakończ' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Gotowe! Smacznej kawy' })).toBeVisible();

  // Link z okna „Wyślij” otwiera ten sam przepis.
  await page.getByRole('link', { name: 'Wróć do przepisu' }).click();
  await page.getByRole('button', { name: 'Wyślij' }).click();
  const link = await page.getByLabel('Link do przepisu').inputValue();
  await page.goto(link);
  await expect(page.getByRole('heading', { level: 1, name: 'AeroPress na szybko' })).toBeVisible();
  await expect(page.getByText('Masz już ten przepis')).toBeVisible();
});
