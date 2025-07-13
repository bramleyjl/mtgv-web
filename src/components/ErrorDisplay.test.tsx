import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorDisplay from './ErrorDisplay';

describe('ErrorDisplay', () => {
  it('renders nothing when no error is provided', () => {
    const { container } = render(<ErrorDisplay error={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders error message with default error styling', () => {
    const errorMessage = 'This is an error message';
    const { container } = render(<ErrorDisplay error={errorMessage} />);
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByText('❌')).toBeInTheDocument();
    
    // Find the outer container with the error styling classes
    const errorContainer = container.querySelector('div');
    expect(errorContainer).toHaveClass('bg-red-900', 'border-red-700', 'text-red-200');
  });

  it('renders warning message with warning styling', () => {
    const warningMessage = 'This is a warning message';
    const { container } = render(<ErrorDisplay error={warningMessage} type="warning" />);
    
    expect(screen.getByText(warningMessage)).toBeInTheDocument();
    expect(screen.getByText('⚠️')).toBeInTheDocument();
    
    // Find the outer container with the warning styling classes
    const warningContainer = container.querySelector('div');
    expect(warningContainer).toHaveClass('bg-yellow-900', 'border-yellow-700', 'text-yellow-200');
  });

  it('renders info message with info styling', () => {
    const infoMessage = 'This is an info message';
    const { container } = render(<ErrorDisplay error={infoMessage} type="info" />);
    
    expect(screen.getByText(infoMessage)).toBeInTheDocument();
    expect(screen.getByText('ℹ️')).toBeInTheDocument();
    
    // Find the outer container with the info styling classes
    const infoContainer = container.querySelector('div');
    expect(infoContainer).toHaveClass('bg-blue-900', 'border-blue-700', 'text-blue-200');
  });

  it('calls onDismiss when dismiss button is clicked', () => {
    const mockOnDismiss = jest.fn();
    const errorMessage = 'Dismissible error';
    
    render(<ErrorDisplay error={errorMessage} onDismiss={mockOnDismiss} />);
    
    const dismissButton = screen.getByRole('button', { name: 'Dismiss error' });
    fireEvent.click(dismissButton);
    
    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });

  it('does not show dismiss button when onDismiss is not provided', () => {
    const errorMessage = 'Non-dismissible error';
    render(<ErrorDisplay error={errorMessage} />);
    
    expect(screen.queryByRole('button', { name: 'Dismiss error' })).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const errorMessage = 'Custom styled error';
    const { container } = render(<ErrorDisplay error={errorMessage} className="custom-class" />);
    
    // Find the outer container with the custom class
    const errorContainer = container.querySelector('div');
    expect(errorContainer).toHaveClass('custom-class');
  });
}); 