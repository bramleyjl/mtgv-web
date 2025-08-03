import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import EditableCardName from './EditableCardName';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

describe('EditableCardName', () => {
  const mockOnUpdate = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    mockOnUpdate.mockClear();
    mockOnCancel.mockClear();
    mockFetch.mockClear();
    // Clear cache to ensure fresh state for each test
    import('@/lib/cache').then(({ clearAllCaches }) => clearAllCaches());
  });

  it('renders card name as button when not editing', () => {
    render(
      <EditableCardName 
        cardName="Lightning Bolt" 
        onUpdate={mockOnUpdate} 
        onCancel={mockOnCancel} 
      />
    );
    
    expect(screen.getByRole('button', { name: 'Lightning Bolt' })).toBeInTheDocument();
  });

  it('enters edit mode when clicked', () => {
    render(
      <EditableCardName 
        cardName="Lightning Bolt" 
        onUpdate={mockOnUpdate} 
        onCancel={mockOnCancel} 
      />
    );
    
    const button = screen.getByRole('button', { name: 'Lightning Bolt' });
    fireEvent.click(button);
    
    expect(screen.getByDisplayValue('Lightning Bolt')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Lightning Bolt' })).not.toBeInTheDocument();
  });

  it('updates card name on Enter key press', async () => {
    render(
      <EditableCardName 
        cardName="Lightning Bolt" 
        onUpdate={mockOnUpdate} 
        onCancel={mockOnCancel} 
      />
    );
    
    // Enter edit mode
    fireEvent.click(screen.getByRole('button', { name: 'Lightning Bolt' }));
    
    const input = screen.getByDisplayValue('Lightning Bolt');
    fireEvent.change(input, { target: { value: 'Lightning Strike' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    
    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith('Lightning Strike');
    });
  });

  it('cancels editing on Escape key press', () => {
    render(
      <EditableCardName 
        cardName="Lightning Bolt" 
        onUpdate={mockOnUpdate} 
        onCancel={mockOnCancel} 
      />
    );
    
    // Enter edit mode
    fireEvent.click(screen.getByRole('button', { name: 'Lightning Bolt' }));
    
    const input = screen.getByDisplayValue('Lightning Bolt');
    fireEvent.keyDown(input, { key: 'Escape' });
    
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('updates card name on blur with valid input', async () => {
    render(
      <EditableCardName 
        cardName="Lightning Bolt" 
        onUpdate={mockOnUpdate} 
        onCancel={mockOnCancel} 
      />
    );
    
    // Enter edit mode
    fireEvent.click(screen.getByRole('button', { name: 'Lightning Bolt' }));
    
    const input = screen.getByDisplayValue('Lightning Bolt');
    fireEvent.change(input, { target: { value: 'Lightning Strike' } });
    fireEvent.blur(input);
    
    // Wait for the blur timeout
    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith('Lightning Strike');
    }, { timeout: 150 });
  });

  it('shows validation error for invalid card name', async () => {
    render(
      <EditableCardName 
        cardName="Lightning Bolt" 
        onUpdate={mockOnUpdate} 
        onCancel={mockOnCancel} 
      />
    );
    
    // Enter edit mode
    fireEvent.click(screen.getByRole('button', { name: 'Lightning Bolt' }));
    
    const input = screen.getByDisplayValue('Lightning Bolt');
    fireEvent.change(input, { target: { value: '123' } });
    
    // Trigger validation by pressing Enter
    fireEvent.keyDown(input, { key: 'Enter' });
    
    await waitFor(() => {
      expect(screen.getByText('Card name must contain at least one letter')).toBeInTheDocument();
    });
  });

  it('prevents update with invalid card name', async () => {
    render(
      <EditableCardName 
        cardName="Lightning Bolt" 
        onUpdate={mockOnUpdate} 
        onCancel={mockOnCancel} 
      />
    );
    
    // Enter edit mode
    fireEvent.click(screen.getByRole('button', { name: 'Lightning Bolt' }));
    
    const input = screen.getByDisplayValue('Lightning Bolt');
    fireEvent.change(input, { target: { value: '123' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    
    expect(mockOnUpdate).not.toHaveBeenCalled();
  });

  it('shows autocomplete suggestions when typing', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        cards: [
          { name: 'Lightning Bolt', id: '1' },
          { name: 'Lightning Strike', id: '2' }
        ]
      })
    });

    render(
      <EditableCardName 
        cardName="Lightning Bolt" 
        onUpdate={mockOnUpdate} 
        onCancel={mockOnCancel} 
      />
    );
    
    // Enter edit mode
    fireEvent.click(screen.getByRole('button', { name: 'Lightning Bolt' }));
    
    const input = screen.getByDisplayValue('Lightning Bolt');
    fireEvent.change(input, { target: { value: 'Lightning' } });
    fireEvent.focus(input);
    
    await waitFor(() => {
      expect(screen.getByText('Lightning Bolt')).toBeInTheDocument();
      expect(screen.getByText('Lightning Strike')).toBeInTheDocument();
    });
  });

  it('selects suggestion on click', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        cards: [
          { name: 'Lightning Strike', id: '2' }
        ]
      })
    });

    render(
      <EditableCardName 
        cardName="Lightning Bolt" 
        onUpdate={mockOnUpdate} 
        onCancel={mockOnCancel} 
      />
    );
    
    // Enter edit mode
    fireEvent.click(screen.getByRole('button', { name: 'Lightning Bolt' }));
    
    const input = screen.getByDisplayValue('Lightning Bolt');
    fireEvent.change(input, { target: { value: 'Lightning' } });
    fireEvent.focus(input);
    
    await waitFor(() => {
      expect(screen.getByText('Lightning Strike')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Lightning Strike'));
    
    expect(mockOnUpdate).toHaveBeenCalledWith('Lightning Strike');
  });

  it('handles keyboard navigation in suggestions', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        cards: [
          { name: 'Lightning Bolt', id: '1' },
          { name: 'Lightning Strike', id: '2' }
        ]
      })
    });

    render(
      <EditableCardName 
        cardName="Lightning Bolt" 
        onUpdate={mockOnUpdate} 
        onCancel={mockOnCancel} 
      />
    );
    
    // Enter edit mode
    fireEvent.click(screen.getByRole('button', { name: 'Lightning Bolt' }));
    
    const input = screen.getByDisplayValue('Lightning Bolt');
    fireEvent.change(input, { target: { value: 'Lightning' } });
    fireEvent.focus(input);
    
    await waitFor(() => {
      expect(screen.getByText('Lightning Bolt')).toBeInTheDocument();
    });
    
    // Navigate down
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    
    // Select first suggestion
    fireEvent.keyDown(input, { key: 'Enter' });
    
    expect(mockOnUpdate).toHaveBeenCalledWith('Lightning Bolt');
  });

  it('shows loading state during autocomplete', async () => {
    jest.useFakeTimers();
    mockFetch.mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ cards: [] })
        }), 100)
      )
    );

    render(
      <EditableCardName 
        cardName="Lightning Bolt" 
        onUpdate={mockOnUpdate} 
        onCancel={mockOnCancel} 
      />
    );
    // Enter edit mode
    fireEvent.click(screen.getByRole('button', { name: 'Lightning Bolt' }));
    const input = screen.getByDisplayValue('Lightning Bolt');
    fireEvent.change(input, { target: { value: 'UniqueQuery123' } });
    fireEvent.focus(input);
    // Advance timers to trigger debounced search
    act(() => {
      jest.advanceTimersByTime(300);
    });
    // Wait for loading state to appear
    await waitFor(() => {
      expect(screen.getByText('Searching...')).toBeInTheDocument();
    });
    jest.useRealTimers();
  });

  it('shows error state when autocomplete fails', async () => {
    // Mock fetch to return an error
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Network Error',
    });

    render(
      <EditableCardName 
        cardName="Lightning Bolt" 
        onUpdate={mockOnUpdate} 
        onCancel={mockOnCancel} 
      />
    );
    
    // Enter edit mode
    fireEvent.click(screen.getByRole('button', { name: 'Lightning Bolt' }));
    
    const input = screen.getByDisplayValue('Lightning Bolt');
    fireEvent.change(input, { target: { value: 'UniqueQuery456' } });
    
    // Wait for error state to appear
    await waitFor(() => {
      expect(screen.getByText('Request failed with status 500: Network Error')).toBeInTheDocument();
    });
  });

  it('trims whitespace from card name on update', async () => {
    render(
      <EditableCardName 
        cardName="Lightning Bolt" 
        onUpdate={mockOnUpdate} 
        onCancel={mockOnCancel} 
      />
    );
    
    // Enter edit mode
    fireEvent.click(screen.getByRole('button', { name: 'Lightning Bolt' }));
    
    const input = screen.getByDisplayValue('Lightning Bolt');
    fireEvent.change(input, { target: { value: '  Lightning Strike  ' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    
    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith('Lightning Strike');
    });
  });

  it('handles empty input validation', async () => {
    render(
      <EditableCardName 
        cardName="Lightning Bolt" 
        onUpdate={mockOnUpdate} 
        onCancel={mockOnCancel} 
      />
    );
    
    // Enter edit mode
    fireEvent.click(screen.getByRole('button', { name: 'Lightning Bolt' }));
    
    const input = screen.getByDisplayValue('Lightning Bolt');
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    
    await waitFor(() => {
      expect(screen.getByText('Card name is required')).toBeInTheDocument();
    });
  });

  it('handles short input validation', async () => {
    render(
      <EditableCardName 
        cardName="Lightning Bolt" 
        onUpdate={mockOnUpdate} 
        onCancel={mockOnCancel} 
      />
    );
    
    // Enter edit mode
    fireEvent.click(screen.getByRole('button', { name: 'Lightning Bolt' }));
    
    const input = screen.getByDisplayValue('Lightning Bolt');
    fireEvent.change(input, { target: { value: 'A' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    
    await waitFor(() => {
      expect(screen.getByText('Card name must be at least 2 characters long')).toBeInTheDocument();
    });
  });
}); 