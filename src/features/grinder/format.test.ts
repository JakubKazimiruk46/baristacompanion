import { describe, expect, it } from 'vitest';
import { formatSetting, formatSettingRange, parseSetting, roundToStep, settingInputValue } from './format';

describe('ustawienie młynka', () => {
  it('odmienia jednostkę po liczbie', () => {
    expect(formatSetting(1, 'click')).toBe('1 kliknięcie');
    expect(formatSetting(24, 'click')).toBe('24 kliknięcia');
    expect(formatSetting(25, 'click')).toBe('25 kliknięć');
    expect(formatSetting(0, 'click')).toBe('0 kliknięć');
    expect(formatSetting(15, 'mark')).toBe('15 działek');
    expect(formatSetting(3, 'turn')).toBe('3 obroty');
  });

  it('ułamki z przecinkiem i w dopełniaczu', () => {
    expect(formatSetting(2.5, 'turn')).toBe('2,5 obrotu');
    expect(formatSetting(4.2, 'mark')).toBe('4,2 działki');
  });

  it('zakres odmienia się po drugiej liczbie', () => {
    expect(formatSettingRange({ min: 18, max: 24 }, 'click')).toBe('18–24 kliknięcia');
    expect(formatSettingRange({ min: 1.3, max: 1.9 }, 'turn')).toBe('1,3–1,9 obrotu');
    expect(formatSettingRange({ min: 1, max: 1 }, 'click')).toBe('1 kliknięcie');
  });

  it('czyta liczby z przecinkiem i kropką, odrzuca resztę', () => {
    expect(parseSetting('24')).toBe(24);
    expect(parseSetting(' 2,5 ')).toBe(2.5);
    expect(parseSetting('2.5')).toBe(2.5);
    expect(parseSetting('')).toBeNull();
    expect(parseSetting('-3')).toBeNull();
    expect(parseSetting('24 kliknięcia')).toBeNull();
    expect(parseSetting('1e3')).toBeNull();
  });

  it('zaokrągla do kroku i pokazuje w polu z przecinkiem', () => {
    expect(roundToStep(0.1 + 0.2, 0.1)).toBe(0.3);
    expect(roundToStep(23.6, 1)).toBe(24);
    expect(settingInputValue(2.5)).toBe('2,5');
    expect(settingInputValue(1200)).toBe('1200');
  });
});
