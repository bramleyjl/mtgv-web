# MTGV CSS Organization Guide

## Overview
This document outlines the CSS organization system for the MTGV frontend. All styling is centralized using named classes for easier maintenance and consistency.

## Class Naming Convention
- **Simple and Clean**: Classes use descriptive names without prefixes
- **Category-based**: Layout, Button, Form, Card, Text, Display, etc.
- **Specificity**: Primary, Secondary, Active, Inactive, etc.

## Class Categories

### Layout Classes
- `.page-container` - Main page container
- `.content-wrapper` - Content wrapper with max width
- `.main-content` - Main content area with spacing
- `.section-spacing` - Standard section spacing

### Header Classes
- `.page-header` - Page header container
- `.page-title` - Main page title
- `.section-header` - Section headers

### Card Section Classes
- `.card-section` - Generic card section
- `.card-input-section` - Card input section
- `.card-list-section` - Card list section
- `.card-display-section` - Card display section

### Button Classes
- `.btn-primary` - Primary action buttons
- `.btn-secondary` - Secondary action buttons
- `.btn-game` - Game type selection buttons
- `.btn-default` - Default selection buttons
- `.btn-quantity` - Quantity control buttons
- `.btn-remove` - Remove action buttons
- `.btn-export-*` - Export buttons

### Form Classes
- `.input-container` - Input field containers
- `.input-field` - Standard input fields
- `.input-field-large` - Large input fields
- `.label` - Form labels

### Card List Classes
- `.card-list-item` - Individual card list items
- `.card-list-content` - Card list content area
- `.card-list-controls` - Card list control buttons
- `.quantity-controls` - Quantity control container

### Card Version Classes
- `.card-version` - Card version container
- `.card-version-selected` - Selected card version
- `.card-version-unselected` - Unselected card version
- `.card-image-container` - Card image container
- `.card-image` - Card image styling
- `.card-info` - Card information area
- `.card-set-name` - Card set name
- `.card-number` - Card collector number
- `.card-price` - Card price display
- `.selection-indicator` - Selection indicator

### Text Classes
- `.text-heading-*` - Heading text styles
- `.text-body-*` - Body text styles
- `.text-success` - Success text
- `.text-warning` - Warning text
- `.text-error` - Error text
- `.text-info` - Info text

### Display Classes
- `.display-header` - Display section header
- `.display-title` - Display section title
- `.display-controls` - Display controls
- `.display-info` - Display information
- `.display-entry` - Display entry container
- `.display-version-*` - Version display elements
- `.display-selected-info` - Selected version info
- `.display-empty` - Empty state display

### Autocomplete Classes
- `.autocomplete-dropdown` - Autocomplete dropdown
- `.autocomplete-item` - Autocomplete items
- `.autocomplete-item-error` - Error autocomplete items

### Error Classes
- `.error-container` - Error container
- `.error-content` - Error content
- `.error-icon` - Error icon
- `.error-text` - Error text
- `.error-dismiss` - Error dismiss button

### Export Classes
- `.export-container` - Export button container
- `.export-success` - Export success message
- `.export-error` - Export error message
- `.export-message` - Export message text
- `.export-dismiss` - Export dismiss button

### Utility Classes
- `.flex-*` - Flexbox utilities
- `.gap-*` - Gap utilities
- `.mb-*` - Margin bottom utilities
- `.mt-*` - Margin top utilities
- `.responsive-*` - Responsive utilities
- `.transition-*` - Transition utilities
- `.hover-*` - Hover utilities
- `.loading-spinner` - Loading spinner

## Usage Guidelines

### When to Use Named Classes
1. **Consistent styling patterns** - Use named classes for repeated styling patterns
2. **Component-specific styling** - Use named classes for component-specific styles
3. **Theme consistency** - Use named classes to maintain consistent theming
4. **Maintainability** - Use named classes for easier maintenance and updates

### When to Use Tailwind Classes Directly
1. **One-off styling** - For unique styling that won't be reused
2. **Quick prototypes** - During rapid prototyping
3. **Dynamic styling** - When styling needs to be computed dynamically

### Migration Strategy
1. Start with the most commonly used patterns
2. Update components one at a time
3. Test thoroughly after each update
4. Document any custom classes added

### Maintenance
1. Keep class names descriptive and consistent
2. Group related classes together in the CSS file
3. Update documentation when adding new classes
4. Review and refactor classes periodically

## Color Scheme
The current color scheme uses:
- **Primary**: Blue (#0ea5e9) for main actions
- **Success**: Green for positive states
- **Warning**: Yellow for warnings
- **Error**: Red for errors
- **Neutral**: Gray scale for backgrounds and text
- **Dark mode**: Automatic dark mode support

## Responsive Design
All classes are designed to work across:
- Mobile (320px+)
- Tablet (768px+)
- Desktop (1024px+)
- Large screens (1280px+)

## Accessibility
Classes include:
- Focus states for keyboard navigation
- High contrast ratios
- Proper semantic structure
- Screen reader friendly elements 