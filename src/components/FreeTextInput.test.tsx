import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import FreeTextInput from './FreeTextInput';

// Mock the dependencies
jest.mock('@/lib/deckListParser', () => ({
  parseDeckList: jest.fn(),
  generateDeckList: jest.fn(),
  validateDeckList: jest.fn(),
  SUPPORTED_FORMATS: [
    {
      name: 'simple',
      description: 'Simple format: "4x Lightning Bolt"',
      example: '4x Lightning Bolt\n2x Counterspell'
    },
    {
      name: 'arena',
      description: 'Arena format: "4 Lightning Bolt (M10) 133"',
      example: '4 Lightning Bolt (M10) 133\n2 Counterspell (M10) 50'
    },
    {
      name: 'mtgo',
      description: 'MTGO format: "4 [M10] Lightning Bolt"',
      example: '4 [M10] Lightning Bolt\n2 [M10] Counterspell'
    },
    {
      name: 'plain',
      description: 'Plain text: "4 Lightning Bolt"',
      example: '4 Lightning Bolt\n2 Counterspell'
    }
  ]
}));

jest.mock('@/lib/clipboard', () => ({
  copyToClipboard: jest.fn()
}));

import { parseDeckList, generateDeckList, validateDeckList } from '@/lib/deckListParser';
import { copyToClipboard } from '@/lib/clipboard';

const mockParseDeckList = parseDeckList as jest.MockedFunction<typeof parseDeckList>;
const mockGenerateDeckList = generateDeckList as jest.MockedFunction<typeof generateDeckList>;
const mockValidateDeckList = validateDeckList as jest.MockedFunction<typeof validateDeckList>;
const mockCopyToClipboard = copyToClipboard as jest.MockedFunction<typeof copyToClipboard>;

describe('FreeTextInput', () => {
  const mockOnImportCards = jest.fn();
  const mockOnCreatePackage = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnImportCards.mockClear();
    mockOnCreatePackage.mockClear();
  });

  it('renders correctly with initial state', () => {
    render(<FreeTextInput onImportCards={mockOnImportCards} onCreatePackage={mockOnCreatePackage} />);
    
    expect(screen.getByText('Free Text Input')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Paste or type your deck list here/)).toBeInTheDocument();
    expect(screen.getByText(/Copy/)).toBeInTheDocument();
    expect(screen.getByText(/Clear/)).toBeInTheDocument();
    expect(screen.getByText('Create Package')).toBeInTheDocument();
  });

  it('handles input changes and validates deck list', async () => {
    const mockCards = [
      { name: 'Lightning Bolt', quantity: 4 },
      { name: 'Counterspell', quantity: 2 }
    ];
    
    mockParseDeckList.mockReturnValue(mockCards);
    mockValidateDeckList.mockReturnValue({
      isValid: true,
      errors: [],
      warnings: []
    });

    render(<FreeTextInput onImportCards={mockOnImportCards} onCreatePackage={mockOnCreatePackage} />);
    
    const textarea = screen.getByPlaceholderText(/Paste or type your deck list here/);
    fireEvent.change(textarea, { target: { value: '4x Lightning Bolt\n2x Counterspell' } });

    await waitFor(() => {
      expect(mockParseDeckList).toHaveBeenCalledWith('4x Lightning Bolt\n2x Counterspell');
      expect(mockValidateDeckList).toHaveBeenCalledWith(mockCards);
    });

    expect(screen.getByText('✅ Deck list is valid and ready to import!')).toBeInTheDocument();
  });

  it('shows validation errors when deck list is invalid', async () => {
    const mockCards = [
      { name: 'Lightning Bolt', quantity: 4 }
    ];
    
    mockParseDeckList.mockReturnValue(mockCards);
    mockValidateDeckList.mockReturnValue({
      isValid: false,
      errors: ['Deck list has too many cards'],
      warnings: []
    });

    render(<FreeTextInput onImportCards={mockOnImportCards} onCreatePackage={mockOnCreatePackage} />);
    
    const textarea = screen.getByPlaceholderText(/Paste or type your deck list here/);
    fireEvent.change(textarea, { target: { value: '4x Lightning Bolt' } });

    await waitFor(() => {
      expect(screen.getByText('Errors:')).toBeInTheDocument();
      expect(screen.getByText('Deck list has too many cards')).toBeInTheDocument();
    });
  });

  it('shows validation warnings', async () => {
    const mockCards = [
      { name: 'Lightning Bolt', quantity: 4 },
      { name: 'Lightning Bolt', quantity: 2 }
    ];
    
    mockParseDeckList.mockReturnValue(mockCards);
    mockValidateDeckList.mockReturnValue({
      isValid: true,
      errors: [],
      warnings: ['Duplicate card names found']
    });

    render(<FreeTextInput onImportCards={mockOnImportCards} onCreatePackage={mockOnCreatePackage} />);
    
    const textarea = screen.getByPlaceholderText(/Paste or type your deck list here/);
    fireEvent.change(textarea, { target: { value: '4x Lightning Bolt\n2x Lightning Bolt' } });

    await waitFor(() => {
      expect(screen.getByText('Warnings:')).toBeInTheDocument();
      expect(screen.getByText('Duplicate card names found')).toBeInTheDocument();
    });
  });

  it('imports cards and creates package when create package button is clicked', async () => {
    const mockCards = [
      { name: 'Lightning Bolt', quantity: 4 },
      { name: 'Counterspell', quantity: 2 }
    ];
    
    mockParseDeckList.mockReturnValue(mockCards);
    mockValidateDeckList.mockReturnValue({
      isValid: true,
      errors: [],
      warnings: []
    });

    render(<FreeTextInput onImportCards={mockOnImportCards} onCreatePackage={mockOnCreatePackage} />);
    
    const textarea = screen.getByPlaceholderText(/Paste or type your deck list here/);
    fireEvent.change(textarea, { target: { value: '4x Lightning Bolt\n2x Counterspell' } });

    await waitFor(() => {
      expect(screen.getByText('✅ Deck list is valid and ready to import!')).toBeInTheDocument();
    });

    const createPackageButton = screen.getByText('Create Package');
    fireEvent.click(createPackageButton);

    expect(mockOnImportCards).toHaveBeenCalledWith([
      { name: 'Lightning Bolt', quantity: 4 },
      { name: 'Counterspell', quantity: 2 }
    ]);
    expect(mockOnCreatePackage).toHaveBeenCalled();
  });

  it('clears input when clear button is clicked', () => {
    render(<FreeTextInput onImportCards={mockOnImportCards} onCreatePackage={mockOnCreatePackage} />);
    
    const textarea = screen.getByPlaceholderText(/Paste or type your deck list here/);
    const clearButton = screen.getByText(/Clear/);
    
    fireEvent.change(textarea, { target: { value: '4x Lightning Bolt' } });
    expect(textarea).toHaveValue('4x Lightning Bolt');
    
    fireEvent.click(clearButton);
    expect(textarea).toHaveValue('');
  });

  it('shows copy format menu when copy button is clicked', async () => {
    const mockCards = [
      { name: 'Lightning Bolt', quantity: 4 }
    ];
    
    mockParseDeckList.mockReturnValue(mockCards);
    mockValidateDeckList.mockReturnValue({
      isValid: true,
      errors: [],
      warnings: []
    });

    render(<FreeTextInput onImportCards={mockOnImportCards} onCreatePackage={mockOnCreatePackage} />);
    
    const textarea = screen.getByPlaceholderText(/Paste or type your deck list here/);
    fireEvent.change(textarea, { target: { value: '4x Lightning Bolt' } });

    await waitFor(() => {
      expect(screen.getByText('✅ Deck list is valid and ready to import!')).toBeInTheDocument();
    });

    const copyButton = screen.getByText(/Copy/);
    fireEvent.click(copyButton);
    
    expect(screen.getByText('Select Copy Format')).toBeInTheDocument();
    expect(screen.getByText('Simple format: "4x Lightning Bolt"')).toBeInTheDocument();
    expect(screen.getByText('Arena format: "4 Lightning Bolt (M10) 133"')).toBeInTheDocument();
    expect(screen.getByText('MTGO format: "4 [M10] Lightning Bolt"')).toBeInTheDocument();
    expect(screen.getByText('Plain text: "4 Lightning Bolt"')).toBeInTheDocument();
  });

  it('copies deck list to clipboard with selected format', async () => {
    const mockCards = [
      { name: 'Lightning Bolt', quantity: 4 }
    ];
    
    mockParseDeckList.mockReturnValue(mockCards);
    mockValidateDeckList.mockReturnValue({
      isValid: true,
      errors: [],
      warnings: []
    });
    mockGenerateDeckList.mockReturnValue('4x Lightning Bolt');
    mockCopyToClipboard.mockResolvedValue({
      success: true,
      message: 'Deck list copied to clipboard!'
    });

    render(<FreeTextInput onImportCards={mockOnImportCards} onCreatePackage={mockOnCreatePackage} />);
    
    const textarea = screen.getByPlaceholderText(/Paste or type your deck list here/);
    fireEvent.change(textarea, { target: { value: '4x Lightning Bolt' } });

    await waitFor(() => {
      expect(screen.getByText('✅ Deck list is valid and ready to import!')).toBeInTheDocument();
    });

    const copyButton = screen.getByText(/Copy/);
    fireEvent.click(copyButton);
    
    const copyApplyButton = screen.getByText('Copy to Clipboard');
    fireEvent.click(copyApplyButton);

    await waitFor(() => {
      expect(mockCopyToClipboard).toHaveBeenCalledWith('4x Lightning Bolt');
      expect(screen.getByText('Deck list copied to clipboard!')).toBeInTheDocument();
    });
  });

  it('handles copy failure gracefully', async () => {
    const mockCards = [
      { name: 'Lightning Bolt', quantity: 4 }
    ];
    
    mockParseDeckList.mockReturnValue(mockCards);
    mockValidateDeckList.mockReturnValue({
      isValid: true,
      errors: [],
      warnings: []
    });
    mockGenerateDeckList.mockReturnValue('4x Lightning Bolt');
    mockCopyToClipboard.mockResolvedValue({
      success: false,
      message: 'Failed to copy to clipboard. Please copy manually.'
    });

    render(<FreeTextInput onImportCards={mockOnImportCards} onCreatePackage={mockOnCreatePackage} />);
    
    const textarea = screen.getByPlaceholderText(/Paste or type your deck list here/);
    fireEvent.change(textarea, { target: { value: '4x Lightning Bolt' } });

    await waitFor(() => {
      expect(screen.getByText('✅ Deck list is valid and ready to import!')).toBeInTheDocument();
    });

    const copyButton = screen.getByText(/Copy/);
    fireEvent.click(copyButton);
    
    const copyApplyButton = screen.getByText('Copy to Clipboard');
    fireEvent.click(copyApplyButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to copy to clipboard. Please copy manually.')).toBeInTheDocument();
    });
  });

  it('disables import button when deck list is invalid', async () => {
    const mockCards = [
      { name: 'Lightning Bolt', quantity: 4 }
    ];
    
    mockParseDeckList.mockReturnValue(mockCards);
    mockValidateDeckList.mockReturnValue({
      isValid: false,
      errors: ['Invalid deck list'],
      warnings: []
    });

    render(<FreeTextInput onImportCards={mockOnImportCards} onCreatePackage={mockOnCreatePackage} />);
    
    const textarea = screen.getByPlaceholderText(/Paste or type your deck list here/);
    fireEvent.change(textarea, { target: { value: '4x Lightning Bolt' } });

    await waitFor(() => {
          const createPackageButton = screen.getByText('Create Package');
    expect(createPackageButton).toBeDisabled();
    });
  });

  it('disables copy button when deck list is invalid', async () => {
    const mockCards = [
      { name: 'Lightning Bolt', quantity: 4 }
    ];
    
    mockParseDeckList.mockReturnValue(mockCards);
    mockValidateDeckList.mockReturnValue({
      isValid: false,
      errors: ['Invalid deck list'],
      warnings: []
    });

    render(<FreeTextInput onImportCards={mockOnImportCards} onCreatePackage={mockOnCreatePackage} />);
    
    const textarea = screen.getByPlaceholderText(/Paste or type your deck list here/);
    fireEvent.change(textarea, { target: { value: '4x Lightning Bolt' } });

    await waitFor(() => {
      const copyButton = screen.getByText(/Copy/);
      expect(copyButton).toBeDisabled();
    });
  });



  it('resets input after successful import', async () => {
    const mockCards = [
      { name: 'Lightning Bolt', quantity: 4 }
    ];
    
    mockParseDeckList.mockReturnValue(mockCards);
    mockValidateDeckList.mockReturnValue({
      isValid: true,
      errors: [],
      warnings: []
    });

    render(<FreeTextInput onImportCards={mockOnImportCards} onCreatePackage={mockOnCreatePackage} />);
    
    const textarea = screen.getByPlaceholderText(/Paste or type your deck list here/);
    fireEvent.change(textarea, { target: { value: '4x Lightning Bolt' } });

    await waitFor(() => {
      expect(screen.getByText('✅ Deck list is valid and ready to import!')).toBeInTheDocument();
    });

    const createPackageButton = screen.getByText('Create Package');
    fireEvent.click(createPackageButton);

    expect(textarea).toHaveValue('');
    expect(screen.queryByText('✅ Deck list is valid and ready to import!')).not.toBeInTheDocument();
  });
});
