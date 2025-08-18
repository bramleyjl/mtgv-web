import {
  copyToClipboard,
  readFromClipboard,
  isClipboardSupported,
  getClipboardSupportInfo
} from './clipboard';

// Mock navigator.clipboard
const mockClipboard = {
  writeText: jest.fn(),
  readText: jest.fn()
};

// Mock document.execCommand
const mockExecCommand = jest.fn();

// Mock window.isSecureContext
Object.defineProperty(window, 'isSecureContext', {
  writable: true,
  value: true
});

// Mock navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  writable: true,
  value: mockClipboard
});

// Mock document.execCommand
Object.defineProperty(document, 'execCommand', {
  writable: true,
  value: mockExecCommand
});

describe('clipboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset window.isSecureContext to true by default
    Object.defineProperty(window, 'isSecureContext', {
      writable: true,
      value: true
    });
  });

  describe('copyToClipboard', () => {
    it('uses modern clipboard API when available and secure', async () => {
      mockClipboard.writeText.mockResolvedValue(undefined);
      
      const result = await copyToClipboard('test text');
      
      expect(mockClipboard.writeText).toHaveBeenCalledWith('test text');
      expect(result.success).toBe(true);
      expect(result.message).toBe('Deck list copied to clipboard!');
    });

    it('falls back to execCommand when modern API fails', async () => {
      // Set up secure context but mock clipboard API to fail
      Object.defineProperty(window, 'isSecureContext', {
        writable: true,
        value: true
      });
      Object.defineProperty(navigator, 'clipboard', {
        writable: true,
        value: mockClipboard
      });
      
      mockClipboard.writeText.mockRejectedValue(new Error('Clipboard API failed'));
      mockExecCommand.mockReturnValue(true);
      
      const result = await copyToClipboard('test text');
      
      expect(mockClipboard.writeText).toHaveBeenCalledWith('test text');
      expect(mockExecCommand).toHaveBeenCalledWith('copy');
      expect(result.success).toBe(true);
      expect(result.message).toBe('Deck list copied to clipboard!');
    });

    it('handles execCommand failure gracefully', async () => {
      // Set up secure context but mock clipboard API to fail
      Object.defineProperty(window, 'isSecureContext', {
        writable: true,
        value: true
      });
      Object.defineProperty(navigator, 'clipboard', {
        writable: true,
        value: mockClipboard
      });
      
      mockClipboard.writeText.mockRejectedValue(new Error('Clipboard API failed'));
      mockExecCommand.mockReturnValue(false);
      
      const result = await copyToClipboard('test text');
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to copy to clipboard. Please copy manually.');
      expect(result.error?.message).toBe('Failed to copy using execCommand');
    });

    it('handles non-secure context gracefully', async () => {
      Object.defineProperty(window, 'isSecureContext', {
        writable: true,
        value: false
      });
      
      mockExecCommand.mockReturnValue(true);
      
      const result = await copyToClipboard('test text');
      
      expect(mockClipboard.writeText).not.toHaveBeenCalled();
      expect(mockExecCommand).toHaveBeenCalledWith('copy');
      expect(result.success).toBe(true);
      expect(result.message).toBe('Deck list copied to clipboard!');
    });

    it('creates and removes temporary textarea for fallback', async () => {
      // Set up secure context but mock clipboard API to fail
      Object.defineProperty(window, 'isSecureContext', {
        writable: true,
        value: true
      });
      Object.defineProperty(navigator, 'clipboard', {
        writable: true,
        value: mockClipboard
      });
      
      mockClipboard.writeText.mockRejectedValue(new Error('Clipboard API failed'));
      mockExecCommand.mockReturnValue(true);
      
      const appendChildSpy = jest.spyOn(document.body, 'appendChild');
      const removeChildSpy = jest.spyOn(document.body, 'removeChild');
      
      await copyToClipboard('test text');
      
      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
      
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });

    it('handles unexpected errors gracefully', async () => {
      // Set up secure context but mock clipboard API to fail
      Object.defineProperty(window, 'isSecureContext', {
        writable: true,
        value: true
      });
      Object.defineProperty(navigator, 'clipboard', {
        writable: true,
        value: mockClipboard
      });
      
      mockClipboard.writeText.mockRejectedValue(new Error('Unexpected error'));
      mockExecCommand.mockImplementation(() => {
        throw new Error('execCommand error');
      });
      
      const result = await copyToClipboard('test text');
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to copy to clipboard. Please copy manually.');
      expect(result.error?.message).toBe('execCommand error');
    });
  });

  describe('readFromClipboard', () => {
    it('uses modern clipboard API when available and secure', async () => {
      mockClipboard.readText.mockResolvedValue('test text');
      
      const result = await readFromClipboard();
      
      expect(mockClipboard.readText).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.message).toBe('Deck list pasted successfully!');
      expect(result.data).toBe('test text');
    });

    it('falls back gracefully when modern API is not available', async () => {
      Object.defineProperty(navigator, 'clipboard', {
        writable: true,
        value: undefined
      });
      
      const result = await readFromClipboard();
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Clipboard reading not supported. Please paste manually.');
      expect(result.error?.message).toBe('Clipboard reading not supported in this browser');
    });

    it('handles non-secure context gracefully', async () => {
      Object.defineProperty(window, 'isSecureContext', {
        writable: true,
        value: false
      });
      
      const result = await readFromClipboard();
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Clipboard reading not supported. Please paste manually.');
      expect(result.error?.message).toBe('Clipboard reading not supported in this browser');
    });

    it('handles clipboard API errors gracefully', async () => {
      // Set up secure context but mock clipboard API to fail
      Object.defineProperty(window, 'isSecureContext', {
        writable: true,
        value: true
      });
      Object.defineProperty(navigator, 'clipboard', {
        writable: true,
        value: mockClipboard
      });
      
      mockClipboard.readText.mockRejectedValue(new Error('Clipboard read failed'));
      
      const result = await readFromClipboard();
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to read from clipboard. Please paste manually.');
      expect(result.error?.message).toBe('Clipboard read failed');
    });
  });

  describe('isClipboardSupported', () => {
    it('returns true when clipboard API is available and context is secure', () => {
      Object.defineProperty(window, 'isSecureContext', {
        writable: true,
        value: true
      });
      Object.defineProperty(navigator, 'clipboard', {
        writable: true,
        value: mockClipboard
      });
      
      expect(isClipboardSupported()).toBe(true);
    });

    it('returns false when clipboard API is not available', () => {
      Object.defineProperty(navigator, 'clipboard', {
        writable: true,
        value: undefined
      });
      
      expect(isClipboardSupported()).toBe(false);
    });

    it('returns false when context is not secure', () => {
      Object.defineProperty(window, 'isSecureContext', {
        writable: true,
        value: false
      });
      
      expect(isClipboardSupported()).toBe(false);
    });
  });

  describe('getClipboardSupportInfo', () => {
    it('returns correct support information for modern browser', () => {
      Object.defineProperty(window, 'isSecureContext', {
        writable: true,
        value: true
      });
      Object.defineProperty(navigator, 'clipboard', {
        writable: true,
        value: mockClipboard
      });
      
      const info = getClipboardSupportInfo();
      
      expect(info.modern).toBe(true);
      expect(info.fallback).toBe(true);
      expect(info.secure).toBe(true);
    });

    it('returns correct support information for older browser', () => {
      Object.defineProperty(window, 'isSecureContext', {
        writable: true,
        value: false
      });
      Object.defineProperty(navigator, 'clipboard', {
        writable: true,
        value: undefined
      });
      
      const info = getClipboardSupportInfo();
      
      expect(info.modern).toBe(false);
      expect(info.fallback).toBe(true);
      expect(info.secure).toBe(false);
    });

    it('returns correct support information for browser without execCommand', () => {
      Object.defineProperty(window, 'isSecureContext', {
        writable: true,
        value: true
      });
      Object.defineProperty(navigator, 'clipboard', {
        writable: true,
        value: mockClipboard
      });
      Object.defineProperty(document, 'execCommand', {
        writable: true,
        value: undefined
      });
      
      const info = getClipboardSupportInfo();
      
      expect(info.modern).toBe(true);
      expect(info.fallback).toBe(false);
      expect(info.secure).toBe(true);
    });
  });
});
