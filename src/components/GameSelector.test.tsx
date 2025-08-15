import { render, screen, fireEvent } from '@testing-library/react';
import GameSelector from './GameSelector';

describe('GameSelector', () => {
  const mockOnGameChange = jest.fn();

  beforeEach(() => {
    mockOnGameChange.mockClear();
  });

  it('renders all game options', () => {
    render(
      <GameSelector
        selectedGame="paper"
        onGameChange={mockOnGameChange}
      />
    );

    expect(screen.getByText('Paper')).toBeInTheDocument();
    expect(screen.getByText('MTGO')).toBeInTheDocument();
    expect(screen.getByText('Arena')).toBeInTheDocument();
  });

  it('displays the correct title and description', () => {
    render(
      <GameSelector
        selectedGame="paper"
        onGameChange={mockOnGameChange}
      />
    );

    expect(screen.getByText('Game Type')).toBeInTheDocument();
    expect(screen.getByText('Select the platform for card pricing')).toBeInTheDocument();
  });

  it('shows the currently selected game', () => {
    render(
      <GameSelector
        selectedGame="mtgo"
        onGameChange={mockOnGameChange}
      />
    );

    expect(screen.getByText('Currently selected:')).toBeInTheDocument();
    expect(screen.getByText('mtgo')).toBeInTheDocument();
  });

  it('calls onGameChange when a game option is clicked', () => {
    render(
      <GameSelector
        selectedGame="paper"
        onGameChange={mockOnGameChange}
      />
    );

    const mtgoButton = screen.getByText('MTGO');
    fireEvent.click(mtgoButton);

    expect(mockOnGameChange).toHaveBeenCalledWith('mtgo');
  });

  it('applies correct styling to selected game', () => {
    render(
      <GameSelector
        selectedGame="arena"
        onGameChange={mockOnGameChange}
      />
    );

    const arenaButton = screen.getByText('Arena');
    expect(arenaButton).toHaveClass('btn-game-active');
  });

  it('applies correct styling to unselected games', () => {
    render(
      <GameSelector
        selectedGame="paper"
        onGameChange={mockOnGameChange}
      />
    );

    const mtgoButton = screen.getByText('MTGO');
    expect(mtgoButton).toHaveClass('btn-game-inactive');
  });



  it('handles all game type changes correctly', () => {
    const { rerender } = render(
      <GameSelector
        selectedGame="paper"
        onGameChange={mockOnGameChange}
      />
    );

    // Test paper to mtgo
    fireEvent.click(screen.getByText('MTGO'));
    expect(mockOnGameChange).toHaveBeenCalledWith('mtgo');

    // Test mtgo to arena
    rerender(
      <GameSelector
        selectedGame="mtgo"
        onGameChange={mockOnGameChange}
      />
    );
    fireEvent.click(screen.getByText('Arena'));
    expect(mockOnGameChange).toHaveBeenCalledWith('arena');

    // Test arena to paper
    rerender(
      <GameSelector
        selectedGame="arena"
        onGameChange={mockOnGameChange}
      />
    );
    fireEvent.click(screen.getByText('Paper'));
    expect(mockOnGameChange).toHaveBeenCalledWith('paper');
  });
}); 