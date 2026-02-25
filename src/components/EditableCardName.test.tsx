import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EditableCardName from './EditableCardName';

// Mock the useCardAutocomplete hook (it's a named export, not default)
jest.mock('@/hooks/useCardAutocomplete', () => ({
  useCardAutocomplete: jest.fn(() => ({
    suggestions: [],
    isLoading: false,
    error: null,
    searchCards: jest.fn(),
  })),
}));

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

describe('EditableCardName', () => {
  const mockOnUpdate = jest.fn();

  beforeEach(() => {
    mockOnUpdate.mockClear();
  });

  it('renders card name as button when not editing', () => {
    render(
      <EditableCardName
        cardName="Lightning Bolt"
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.getByText('Lightning Bolt')).toBeInTheDocument();
  });

  it('enters edit mode when clicked', () => {
    render(
      <EditableCardName
        cardName="Lightning Bolt"
        onUpdate={mockOnUpdate}
      />
    );

    const span = screen.getByText('Lightning Bolt');
    fireEvent.doubleClick(span);

    expect(screen.getByDisplayValue('Lightning Bolt')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Lightning Bolt' })).not.toBeInTheDocument();
  });

  it('updates card name on blur', async () => {
    render(
      <EditableCardName
        cardName="Lightning Bolt"
        onUpdate={mockOnUpdate}
      />
    );

    // Enter edit mode
    fireEvent.doubleClick(screen.getByText('Lightning Bolt'));

    const input = screen.getByDisplayValue('Lightning Bolt');
    fireEvent.change(input, { target: { value: 'Lightning Strike' } });
    fireEvent.blur(input);

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith('Lightning Strike');
    });
  });

  it('trims whitespace from card name on blur', async () => {
    render(
      <EditableCardName
        cardName="Lightning Bolt"
        onUpdate={mockOnUpdate}
      />
    );

    // Enter edit mode
    fireEvent.doubleClick(screen.getByText('Lightning Bolt'));

    const input = screen.getByDisplayValue('Lightning Bolt');
    fireEvent.change(input, { target: { value: '  Lightning Strike  ' } });
    fireEvent.blur(input);

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith('Lightning Strike');
    });
  });

  it('handles very long card names', async () => {
    const longName = 'A'.repeat(1000);
    render(
      <EditableCardName
        cardName="Lightning Bolt"
        onUpdate={mockOnUpdate}
      />
    );

    // Enter edit mode
    fireEvent.doubleClick(screen.getByText('Lightning Bolt'));

    const input = screen.getByDisplayValue('Lightning Bolt');
    fireEvent.change(input, { target: { value: longName } });
    fireEvent.blur(input);

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith(longName);
    });
  });

  it('handles special characters in card names', async () => {
    const specialName = 'Lightning Bolt (Foil) - "Special Edition"';
    render(
      <EditableCardName
        cardName="Lightning Bolt"
        onUpdate={mockOnUpdate}
      />
    );

    // Enter edit mode
    fireEvent.doubleClick(screen.getByText('Lightning Bolt'));

    const input = screen.getByDisplayValue('Lightning Bolt');
    fireEvent.change(input, { target: { value: specialName } });
    fireEvent.blur(input);

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith(specialName);
    });
  });

  it('handles unicode characters in card names', async () => {
    const unicodeName = 'Lightning Bolt 🚀 - 雷击';
    render(
      <EditableCardName
        cardName="Lightning Bolt"
        onUpdate={mockOnUpdate}
      />
    );

    // Enter edit mode
    fireEvent.doubleClick(screen.getByText('Lightning Bolt'));

    const input = screen.getByDisplayValue('Lightning Bolt');
    fireEvent.change(input, { target: { value: unicodeName } });
    fireEvent.blur(input);

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith(unicodeName);
    });
  });

  it('maintains focus during editing', () => {
    render(
      <EditableCardName
        cardName="Lightning Bolt"
        onUpdate={mockOnUpdate}
      />
    );

    // Enter edit mode
    fireEvent.doubleClick(screen.getByText('Lightning Bolt'));

    const input = screen.getByDisplayValue('Lightning Bolt');
    expect(document.activeElement).toBe(input);
  });

  it('handles rapid double-clicks gracefully', () => {
    render(
      <EditableCardName
        cardName="Lightning Bolt"
        onUpdate={mockOnUpdate}
      />
    );

    const span = screen.getByText('Lightning Bolt');

    // Rapid double-clicks
    fireEvent.doubleClick(span);
    fireEvent.doubleClick(span);
    fireEvent.doubleClick(span);

    // Should still be in edit mode
    expect(screen.getByDisplayValue('Lightning Bolt')).toBeInTheDocument();
  });

  it('handles keyboard navigation', () => {
    render(
      <EditableCardName
        cardName="Lightning Bolt"
        onUpdate={mockOnUpdate}
      />
    );

    // Enter edit mode
    fireEvent.doubleClick(screen.getByText('Lightning Bolt'));

    const input = screen.getByDisplayValue('Lightning Bolt');

    // Test various keyboard events
    fireEvent.keyDown(input, { key: 'Tab' });
    fireEvent.keyDown(input, { key: 'Shift' });
    fireEvent.keyDown(input, { key: 'Control' });

    // Should still be in edit mode
    expect(screen.getByDisplayValue('Lightning Bolt')).toBeInTheDocument();
  });

  it('handles mouse events during editing', () => {
    render(
      <EditableCardName
        cardName="Lightning Bolt"
        onUpdate={mockOnUpdate}
      />
    );

    // Enter edit mode
    fireEvent.doubleClick(screen.getByText('Lightning Bolt'));

    const input = screen.getByDisplayValue('Lightning Bolt');

    // Test various mouse events
    fireEvent.mouseDown(input);
    fireEvent.mouseUp(input);
    fireEvent.click(input);

    // Should still be in edit mode
    expect(screen.getByDisplayValue('Lightning Bolt')).toBeInTheDocument();
  });

  it('handles window focus/blur events', () => {
    render(
      <EditableCardName
        cardName="Lightning Bolt"
        onUpdate={mockOnUpdate}
      />
    );

    // Enter edit mode
    fireEvent.doubleClick(screen.getByText('Lightning Bolt'));

    // Verify input is in edit mode
    expect(screen.getByDisplayValue('Lightning Bolt')).toBeInTheDocument();

    // Test window events
    fireEvent.focus(window);
    fireEvent.blur(window);

    // Should still be in edit mode
    expect(screen.getByDisplayValue('Lightning Bolt')).toBeInTheDocument();
  });
});
