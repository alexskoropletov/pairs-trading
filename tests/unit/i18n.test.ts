import { I18n, getLanguageFromArgs, createI18n } from '../../src/i18n';

describe('I18n', () => {
  let i18n: I18n;

  beforeEach(() => {
    i18n = new I18n('ru');
  });

  describe('constructor', () => {
    it('should create instance with default language', () => {
      const defaultI18n = new I18n();
      expect(defaultI18n.getCurrentLanguage()).toBe('ru');
    });

    it('should create instance with specified language', () => {
      const enI18n = new I18n('en');
      expect(enI18n.getCurrentLanguage()).toBe('en');
    });

    it('should fallback to default language for invalid language', () => {
      const invalidI18n = new I18n('invalid' as any);
      expect(invalidI18n.getCurrentLanguage()).toBe('ru');
    });
  });

  describe('t() method', () => {
    it('should return Russian translation for Russian language', () => {
      expect(i18n.t('pairs_trading_analysis')).toBe('Анализ парного трейдинга');
      expect(i18n.t('correlation')).toBe('Корреляция');
      expect(i18n.t('total_pairs')).toBe('Всего пар');
    });

    it('should return English translation for English language', () => {
      const enI18n = new I18n('en');
      expect(enI18n.t('pairs_trading_analysis')).toBe('Pairs Trading Analysis');
      expect(enI18n.t('correlation')).toBe('Correlation');
      expect(enI18n.t('total_pairs')).toBe('Total Pairs');
    });

    it('should return key if translation not found', () => {
      expect(i18n.t('nonexistent_key')).toBe('nonexistent_key');
    });

    it('should interpolate parameters', () => {
      expect(i18n.t('percentage_format', { value: 25.5 })).toBe('25.50%');
    });
  });

  describe('setLanguage() method', () => {
    it('should change language', () => {
      i18n.setLanguage('en');
      expect(i18n.getCurrentLanguage()).toBe('en');
      expect(i18n.t('pairs_trading_analysis')).toBe('Pairs Trading Analysis');
    });

    it('should not change language for invalid input', () => {
      i18n.setLanguage('invalid' as any);
      expect(i18n.getCurrentLanguage()).toBe('ru');
    });
  });

  describe('getIndexEmoji() method', () => {
    it('should return correct emoji for known index', () => {
      expect(i18n.getIndexEmoji('sp500')).toBe('🇺🇸');
      expect(i18n.getIndexEmoji('imoex')).toBe('🇷🇺');
      expect(i18n.getIndexEmoji('rucbitr')).toBe('🏢');
    });

    it('should return default emoji for unknown index', () => {
      expect(i18n.getIndexEmoji('unknown')).toBe('📊');
    });
  });

  describe('formatPercentage() method', () => {
    it('should format percentage correctly', () => {
      expect(i18n.formatPercentage(25.5)).toBe('25.50%');
      expect(i18n.formatPercentage(0)).toBe('0.00%');
      expect(i18n.formatPercentage(100)).toBe('100.00%');
    });
  });

  describe('formatDate() method', () => {
    it('should format date in Russian format', () => {
      const date = new Date('2024-01-15');
      expect(i18n.formatDate(date)).toBe('15.01.2024');
    });

    it('should format date in English format', () => {
      const enI18n = new I18n('en');
      const date = new Date('2024-01-15');
      expect(enI18n.formatDate(date)).toBe('01/15/2024');
    });
  });

  describe('static methods', () => {
    it('should return supported languages', () => {
      expect(I18n.getSupportedLanguages()).toEqual(['ru', 'en']);
    });

    it('should check if language is supported', () => {
      expect(I18n.isLanguageSupported('ru')).toBe(true);
      expect(I18n.isLanguageSupported('en')).toBe(true);
      expect(I18n.isLanguageSupported('fr')).toBe(false);
      expect(I18n.isLanguageSupported('invalid')).toBe(false);
    });
  });
});

describe('getLanguageFromArgs()', () => {
  const originalArgv = process.argv;

  afterEach(() => {
    process.argv = originalArgv;
  });

  it('should return Russian by default', () => {
    process.argv = ['node', 'script.js'];
    expect(getLanguageFromArgs()).toBe('ru');
  });

  it('should return language from --lang argument', () => {
    process.argv = ['node', 'script.js', '--lang=en'];
    expect(getLanguageFromArgs()).toBe('en');
  });

  it('should return language from --language argument', () => {
    process.argv = ['node', 'script.js', '--language=ru'];
    expect(getLanguageFromArgs()).toBe('ru');
  });

  it('should fallback to Russian for invalid language', () => {
    process.argv = ['node', 'script.js', '--lang=invalid'];
    expect(getLanguageFromArgs()).toBe('ru');
  });
});

describe('createI18n()', () => {
  const originalArgv = process.argv;

  afterEach(() => {
    process.argv = originalArgv;
  });

  it('should create I18n instance with language from args', () => {
    process.argv = ['node', 'script.js', '--lang=en'];
    const i18n = createI18n();
    expect(i18n.getCurrentLanguage()).toBe('en');
  });

  it('should create I18n instance with default language', () => {
    process.argv = ['node', 'script.js'];
    const i18n = createI18n();
    expect(i18n.getCurrentLanguage()).toBe('ru');
  });
}); 