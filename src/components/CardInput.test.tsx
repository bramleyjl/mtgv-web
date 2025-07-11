import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import CardInput from './CardInput';
import { validateCardList } from '../lib/validation';

describe('CardInput', () => {
  const mockOnAddCard = jest.fn();

  beforeEach(() => {
    mockOnAddCard.mockClear();
  });

  it('renders card name input field', () => {
    render(<CardInput onAddCard={mockOnAddCard} />);
    
    expect(screen.getByLabelText(/card name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter card name/i)).toBeInTheDocument();
  });

  it('renders quantity input field with default value of 1', () => {
    render(<CardInput onAddCard={mockOnAddCard} />);
    
    const quantityInput = screen.getByLabelText(/qty/i);
    expect(quantityInput).toBeInTheDocument();
    expect(quantityInput).toHaveValue(1);
  });

  it('renders add card button', () => {
    render(<CardInput onAddCard={mockOnAddCard} />);
    
    expect(screen.getByRole('button', { name: /add card/i })).toBeInTheDocument();
  });

  it('adds card with default quantity when form is submitted', async () => {
    render(<CardInput onAddCard={mockOnAddCard} />);
    
    const cardNameInput = screen.getByLabelText(/card name/i);
    const submitButton = screen.getByRole('button', { name: /add card/i });
    
    fireEvent.change(cardNameInput, { target: { value: 'Lightning Bolt' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnAddCard).toHaveBeenCalledWith('Lightning Bolt', 1);
    });
  });

  it('adds card with custom quantity when form is submitted', async () => {
    render(<CardInput onAddCard={mockOnAddCard} />);
    
    const cardNameInput = screen.getByLabelText(/card name/i);
    const quantityInput = screen.getByLabelText(/qty/i);
    const submitButton = screen.getByRole('button', { name: /add card/i });
    
    fireEvent.change(cardNameInput, { target: { value: 'Counterspell' } });
    fireEvent.change(quantityInput, { target: { value: '4' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnAddCard).toHaveBeenCalledWith('Counterspell', 4);
    });
  });

  it('prevents submission when card name is empty', () => {
    render(<CardInput onAddCard={mockOnAddCard} />);
    
    const submitButton = screen.getByRole('button', { name: /add card/i });
    
    expect(submitButton).toBeDisabled();
  });

  it('prevents submission when card name is only whitespace', () => {
    render(<CardInput onAddCard={mockOnAddCard} />);
    
    const cardNameInput = screen.getByLabelText(/card name/i);
    const submitButton = screen.getByRole('button', { name: /add card/i });
    
    fireEvent.change(cardNameInput, { target: { value: '   ' } });
    
    expect(submitButton).toBeDisabled();
  });

  it('enables submission when card name is entered', () => {
    render(<CardInput onAddCard={mockOnAddCard} />);
    
    const cardNameInput = screen.getByLabelText(/card name/i);
    const submitButton = screen.getByRole('button', { name: /add card/i });
    
    fireEvent.change(cardNameInput, { target: { value: 'Black Lotus' } });
    
    expect(submitButton).not.toBeDisabled();
  });

  it('enforces minimum quantity of 1', async () => {
    render(<CardInput onAddCard={mockOnAddCard} />);
    
    const cardNameInput = screen.getByLabelText(/card name/i);
    const quantityInput = screen.getByLabelText(/qty/i);
    const submitButton = screen.getByRole('button', { name: /add card/i });
    
    fireEvent.change(cardNameInput, { target: { value: 'Test Card' } });
    fireEvent.change(quantityInput, { target: { value: '0' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnAddCard).toHaveBeenCalledWith('Test Card', 1);
    });
  });

  it('enforces minimum quantity of 1 for negative values', async () => {
    render(<CardInput onAddCard={mockOnAddCard} />);
    
    const cardNameInput = screen.getByLabelText(/card name/i);
    const quantityInput = screen.getByLabelText(/qty/i);
    const submitButton = screen.getByRole('button', { name: /add card/i });
    
    fireEvent.change(cardNameInput, { target: { value: 'Test Card' } });
    fireEvent.change(quantityInput, { target: { value: '-5' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnAddCard).toHaveBeenCalledWith('Test Card', 1);
    });
  });

  it('allows maximum quantity of 100 when no cards exist', async () => {
    render(<CardInput onAddCard={mockOnAddCard} />);
    
    const cardNameInput = screen.getByLabelText(/card name/i);
    const quantityInput = screen.getByLabelText(/qty/i);
    const submitButton = screen.getByRole('button', { name: /add card/i });
    
    fireEvent.change(cardNameInput, { target: { value: 'Test Card' } });
    fireEvent.change(quantityInput, { target: { value: '100' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnAddCard).toHaveBeenCalledWith('Test Card', 100);
    });
  });

  it('prevents adding card that would exceed 100-card limit', () => {
    const currentCards = [
      { name: 'Lightning Bolt', quantity: 50 },
      { name: 'Black Lotus', quantity: 51 }
    ];
    
    render(
      <CardInput 
        onAddCard={mockOnAddCard} 
        currentCards={currentCards}
        validateCardList={validateCardList}
      />
    );
    
    const cardNameInput = screen.getByLabelText(/card name/i);
    const quantityInput = screen.getByLabelText(/qty/i);
    const submitButton = screen.getByRole('button', { name: /add card/i });
    
    fireEvent.change(cardNameInput, { target: { value: 'Test Card' } });
    fireEvent.change(quantityInput, { target: { value: '1' } });
    
    // Should show validation error
    expect(screen.getByText(/would exceed 100-card limit/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('limits quantity to remaining slots when approaching 100-card limit', () => {
    const currentCards = [
      { name: 'Lightning Bolt', quantity: 95 }
    ];
    
    render(
      <CardInput 
        onAddCard={mockOnAddCard} 
        currentCards={currentCards}
        validateCardList={validateCardList}
      />
    );
    
    const cardNameInput = screen.getByLabelText(/card name/i);
    const quantityInput = screen.getByLabelText(/qty/i);
    
    fireEvent.change(cardNameInput, { target: { value: 'Test Card' } });
    fireEvent.change(quantityInput, { target: { value: '10' } });
    fireEvent.blur(quantityInput);
    
    // Should clamp to 5 (remaining slots)
    expect(quantityInput).toHaveValue(5);
  });

  it('clears form after successful submission', async () => {
    render(<CardInput onAddCard={mockOnAddCard} />);
    
    const cardNameInput = screen.getByLabelText(/card name/i);
    const quantityInput = screen.getByLabelText(/qty/i);
    const submitButton = screen.getByRole('button', { name: /add card/i });
    
    fireEvent.change(cardNameInput, { target: { value: 'Test Card' } });
    fireEvent.change(quantityInput, { target: { value: '3' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(cardNameInput).toHaveValue('');
      expect(quantityInput).toHaveValue(1);
    });
  });

  it('trims whitespace from card name', async () => {
    render(<CardInput onAddCard={mockOnAddCard} />);
    
    const cardNameInput = screen.getByLabelText(/card name/i);
    const submitButton = screen.getByRole('button', { name: /add card/i });
    
    fireEvent.change(cardNameInput, { target: { value: '  Lightning Bolt  ' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnAddCard).toHaveBeenCalledWith('Lightning Bolt', 1);
    });
  });

  it('shows loading state when searching for cards', async () => {
    jest.useFakeTimers();
    render(<CardInput onAddCard={mockOnAddCard} />);
    
    const cardNameInput = screen.getByLabelText(/card name/i);
    
    // Mock the fetch to simulate loading
    const mockFetch = jest.fn(() => 
      new Promise<Response>(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ cards: [] }),
          headers: new Headers(),
          redirected: false,
          status: 200,
          statusText: 'OK',
          type: 'default',
          url: '',
          body: null,
          bodyUsed: false,
          clone: () => new Response(),
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
          blob: () => Promise.resolve(new Blob()),
          formData: () => Promise.resolve(new FormData()),
          text: () => Promise.resolve(''),
        } as Response), 100)
      )
    );
    global.fetch = mockFetch;
    
    fireEvent.change(cardNameInput, { target: { value: 'Lightning' } });
    fireEvent.focus(cardNameInput);
    
    // Advance timers to trigger debounced search
    act(() => {
      jest.advanceTimersByTime(300);
    });
    
    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText('Searching...')).toBeInTheDocument();
    });
    
    jest.useRealTimers();
  });

  it('shows error state when search fails', async () => {
    jest.useFakeTimers();
    render(<CardInput onAddCard={mockOnAddCard} />);
    
    const cardNameInput = screen.getByLabelText(/card name/i);
    
    // Mock the fetch to simulate an error
    const mockFetch = jest.fn(() => 
      Promise.resolve({
        ok: false,
        statusText: 'Network Error',
        headers: new Headers(),
        redirected: false,
        status: 500,
        type: 'default',
        url: '',
        body: null,
        bodyUsed: false,
        clone: () => new Response(),
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        blob: () => Promise.resolve(new Blob()),
        formData: () => Promise.resolve(new FormData()),
        text: () => Promise.resolve(''),
        json: () => Promise.resolve({}),
      } as Response)
    );
    global.fetch = mockFetch;
    
    fireEvent.change(cardNameInput, { target: { value: 'Lightning' } });
    fireEvent.focus(cardNameInput);
    
    // Advance timers to trigger debounced search
    act(() => {
      jest.advanceTimersByTime(300);
    });
    
    // Should show error state
    await waitFor(() => {
      expect(screen.getByText('Search failed: Network Error')).toBeInTheDocument();
    });
    
    jest.useRealTimers();
  });

  it('shows suggestions when search succeeds', async () => {
    jest.useFakeTimers();
    render(<CardInput onAddCard={mockOnAddCard} />);
    
    const cardNameInput = screen.getByLabelText(/card name/i);
    
    // Mock the fetch to return suggestions
    const mockFetch = jest.fn(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          cards: [
            { name: 'Lightning Bolt', id: '1' },
            { name: 'Lightning Strike', id: '2' }
          ]
        }),
        headers: new Headers(),
        redirected: false,
        status: 200,
        statusText: 'OK',
        type: 'default',
        url: '',
        body: null,
        bodyUsed: false,
        clone: () => new Response(),
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        blob: () => Promise.resolve(new Blob()),
        formData: () => Promise.resolve(new FormData()),
        text: () => Promise.resolve(''),
      } as Response)
    );
    global.fetch = mockFetch;
    
    fireEvent.change(cardNameInput, { target: { value: 'Lightning' } });
    fireEvent.focus(cardNameInput);
    
    // Advance timers to trigger debounced search
    act(() => {
      jest.advanceTimersByTime(300);
    });
    
    // Should show suggestions
    await waitFor(() => {
      expect(screen.getByText('Lightning Bolt')).toBeInTheDocument();
      expect(screen.getByText('Lightning Strike')).toBeInTheDocument();
    });
    
    jest.useRealTimers();
  });

  it('clears suggestions when input is cleared', async () => {
    jest.useFakeTimers();
    render(<CardInput onAddCard={mockOnAddCard} />);
    
    const cardNameInput = screen.getByLabelText(/card name/i);
    
    // Mock the fetch to return suggestions
    const mockFetch = jest.fn(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          cards: [{ name: 'Lightning Bolt', id: '1' }]
        }),
        headers: new Headers(),
        redirected: false,
        status: 200,
        statusText: 'OK',
        type: 'default',
        url: '',
        body: null,
        bodyUsed: false,
        clone: () => new Response(),
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        blob: () => Promise.resolve(new Blob()),
        formData: () => Promise.resolve(new FormData()),
        text: () => Promise.resolve(''),
      } as Response)
    );
    global.fetch = mockFetch;
    
    fireEvent.change(cardNameInput, { target: { value: 'Lightning' } });
    fireEvent.focus(cardNameInput);
    
    // Advance timers to trigger debounced search
    act(() => {
      jest.advanceTimersByTime(300);
    });
    
    // Wait for suggestions to appear
    await waitFor(() => {
      expect(screen.getByText('Lightning Bolt')).toBeInTheDocument();
    });
    
    // Clear the input
    fireEvent.change(cardNameInput, { target: { value: '' } });
    
    // Suggestions should be cleared
    await waitFor(() => {
      expect(screen.queryByText('Lightning Bolt')).not.toBeInTheDocument();
    });
    
    jest.useRealTimers();
  });
}); 