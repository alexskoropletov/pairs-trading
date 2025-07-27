import fs from 'fs-extra';

// Мокаем canvas
jest.mock('canvas', () => ({
  createCanvas: jest.fn().mockReturnValue({
    getContext: jest.fn().mockReturnValue({
      fillStyle: '',
      font: '',
      textAlign: '',
      fillText: jest.fn(),
      fillRect: jest.fn(),
      strokeRect: jest.fn(),
      strokeStyle: '',
      lineWidth: 0,
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      stroke: jest.fn(),
      clearRect: jest.fn()
    }),
    toBuffer: jest.fn().mockReturnValue(Buffer.from('fake-png-data'))
  })
}));

// Мокаем fs-extra
jest.mock('fs-extra');

describe('Infographic Generator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fs.existsSync as jest.Mock).mockImplementation((path) => {
      if (path === 'stats/pairs_analysis.json') return true;
      return false;
    });
    (fs.mkdirSync as jest.Mock).mockImplementation(() => {});
    (fs.readJson as jest.Mock).mockResolvedValue({
      totalPairs: 8567,
      sp500Pairs: 7138,
      nasdaqPairs: 1429,
      averageCorrelation: 0.221,
      maxCorrelation: 0.954,
      minCorrelation: 0.0001,
      topPairs: [
        {
          asset1: 'V',
          asset2: 'MA',
          correlation: 0.954,
          strategy: 'LONG V / SHORT MA',
          index: 'S&P500'
        },
        {
          asset1: 'HD',
          asset2: 'LOW',
          correlation: 0.951,
          strategy: 'LONG HD / SHORT LOW',
          index: 'S&P500'
        }
      ]
    });
    (fs.writeFile as any).mockResolvedValue(undefined);
  });

  describe('Constructor', () => {
    it('should create infographics directory if it does not exist', () => {
      const { InfographicGenerator } = require('../../src/create_infographic');
      new InfographicGenerator();

      expect(fs.mkdirSync).toHaveBeenCalledWith('infographics', { recursive: true });
    });

    it('should not create directory if it already exists', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      
      const { InfographicGenerator } = require('../../src/create_infographic');
      new InfographicGenerator();

      expect(fs.mkdirSync).not.toHaveBeenCalled();
    });
  });

  describe('generateInfographic', () => {
    it('should generate infographic successfully', async () => {
      const { InfographicGenerator } = require('../../src/create_infographic');
      const generator = new InfographicGenerator();

      await generator.generateInfographic();

      expect(fs.readJson).toHaveBeenCalledWith('stats/pairs_analysis.json');
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringMatching(/infographics\/pairs-\d{4}-\d{2}-\d{2}\.png/),
        expect.any(Buffer)
      );
    });

    it('should handle missing pairs_analysis.json file', async () => {
      (fs.existsSync as jest.Mock).mockImplementation((path) => {
        if (path === 'stats/pairs_analysis.json') return false;
        return false;
      });

      const { InfographicGenerator } = require('../../src/create_infographic');
      const generator = new InfographicGenerator();

      await expect(generator.generateInfographic()).rejects.toThrow('Файл pairs_analysis.json не найден');
    });

    it('should handle file read errors', async () => {
      (fs.readJson as jest.Mock).mockRejectedValue(new Error('Read error'));

      const { InfographicGenerator } = require('../../src/create_infographic');
      const generator = new InfographicGenerator();

      await expect(generator.generateInfographic()).rejects.toThrow('Read error');
    });

    it('should handle file write errors', async () => {
      (fs.writeFile as any).mockRejectedValue(new Error('Write error'));

      const { InfographicGenerator } = require('../../src/create_infographic');
      const generator = new InfographicGenerator();

      await expect(generator.generateInfographic()).rejects.toThrow('Write error');
    });
  });

  describe('File naming', () => {
    it('should generate correct filename with current date', async () => {
      const mockDate = new Date('2024-01-15T10:00:00Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      const { InfographicGenerator } = require('../../src/create_infographic');
      const generator = new InfographicGenerator();

      await generator.generateInfographic();

      expect(fs.writeFile).toHaveBeenCalledWith(
        'infographics/pairs-2024-01-15.png',
        expect.any(Buffer)
      );
    });
  });

  describe('Data processing', () => {
    it('should handle empty topPairs array', async () => {
      (fs.readJson as jest.Mock).mockResolvedValue({
        totalPairs: 0,
        sp500Pairs: 0,
        nasdaqPairs: 0,
        averageCorrelation: 0,
        maxCorrelation: 0,
        minCorrelation: 0,
        topPairs: []
      });

      const { InfographicGenerator } = require('../../src/create_infographic');
      const generator = new InfographicGenerator();

      await expect(generator.generateInfographic()).resolves.not.toThrow();
    });

    it('should handle large numbers in statistics', async () => {
      (fs.readJson as jest.Mock).mockResolvedValue({
        totalPairs: 999999,
        sp500Pairs: 888888,
        nasdaqPairs: 111111,
        averageCorrelation: 0.999999,
        maxCorrelation: 1.0,
        minCorrelation: 0.000001,
        topPairs: []
      });

      const { InfographicGenerator } = require('../../src/create_infographic');
      const generator = new InfographicGenerator();

      await expect(generator.generateInfographic()).resolves.not.toThrow();
    });
  });

  describe('Canvas operations', () => {
    it('should initialize canvas with correct dimensions', () => {
      const { createCanvas } = require('canvas');
      
      const { InfographicGenerator } = require('../../src/create_infographic');
      new InfographicGenerator();

      expect(createCanvas).toHaveBeenCalledWith(1200, 800);
    });

    it('should call canvas methods during generation', async () => {
      const mockContext = {
        fillStyle: '',
        font: '',
        textAlign: '',
        fillText: jest.fn(),
        fillRect: jest.fn(),
        strokeRect: jest.fn(),
        strokeStyle: '',
        lineWidth: 0,
        beginPath: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        stroke: jest.fn(),
        clearRect: jest.fn()
      };

      const { createCanvas } = require('canvas');
      createCanvas.mockReturnValue({
        getContext: jest.fn().mockReturnValue(mockContext),
        toBuffer: jest.fn().mockReturnValue(Buffer.from('fake-png-data'))
      });

      const { InfographicGenerator } = require('../../src/create_infographic');
      const generator = new InfographicGenerator();

      await generator.generateInfographic();

      expect(mockContext.clearRect).toHaveBeenCalled();
      expect(mockContext.fillText).toHaveBeenCalled();
      expect(mockContext.fillRect).toHaveBeenCalled();
    });
  });
}); 