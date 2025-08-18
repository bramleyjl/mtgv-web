/**
 * Clipboard utilities for copy and paste operations
 * Handles browser compatibility and provides consistent error handling
 */

export interface ClipboardResult {
  success: boolean;
  message: string;
  error?: Error;
  data?: string;
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<ClipboardResult> {
  // Try modern clipboard API first if available and secure
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return {
        success: true,
        message: 'Deck list copied to clipboard!'
      };
    } catch (error) {
      // Modern API failed, fall back to execCommand if available
      if (document.execCommand) {
        try {
          const textArea = document.createElement('textarea');
          textArea.value = text;
          textArea.style.position = 'fixed';
          textArea.style.left = '-999999px';
          textArea.style.top = '-999999px';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          
          const successful = document.execCommand('copy');
          document.body.removeChild(textArea);
          
          if (successful) {
            return {
              success: true,
              message: 'Deck list copied to clipboard!'
            };
          } else {
            throw new Error('Failed to copy using execCommand');
          }
        } catch (execCommandError) {
          return {
            success: false,
            message: 'Failed to copy to clipboard. Please copy manually.',
            error: execCommandError instanceof Error ? execCommandError : new Error('Unknown execCommand error')
          };
        }
      } else {
        // No fallback available
        return {
          success: false,
          message: 'Failed to copy to clipboard. Please copy manually.',
          error: error instanceof Error ? error : new Error('Unknown clipboard error')
        };
      }
    }
  } else {
    // Fallback for older browsers or HTTP
    if (document.execCommand) {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
          return {
            success: true,
            message: 'Deck list copied to clipboard!'
          };
        } else {
          throw new Error('Failed to copy using execCommand');
        }
      } catch (execCommandError) {
        return {
          success: false,
          message: 'Failed to copy to clipboard. Please copy manually.',
          error: execCommandError instanceof Error ? execCommandError : new Error('Unknown execCommand error')
        };
      }
    } else {
      return {
        success: false,
        message: 'Failed to copy to clipboard. Please copy manually.',
        error: new Error('No clipboard method available')
      };
    }
  }
}

/**
 * Read text from clipboard
 */
export async function readFromClipboard(): Promise<ClipboardResult> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      // Modern clipboard API (HTTPS required)
      const text = await navigator.clipboard.readText();
      return {
        success: true,
        message: 'Deck list pasted successfully!',
        data: text
      };
    } else {
      // Fallback: prompt user to paste manually
      return {
        success: false,
        message: 'Clipboard reading not supported. Please paste manually.',
        error: new Error('Clipboard reading not supported in this browser')
      };
    }
  } catch (error) {
    return {
      success: false,
      message: 'Failed to read from clipboard. Please paste manually.',
      error: error instanceof Error ? error : new Error('Unknown clipboard error')
    };
  }
}

/**
 * Check if clipboard operations are supported
 */
export function isClipboardSupported(): boolean {
  return !!(navigator.clipboard && window.isSecureContext);
}

/**
 * Get clipboard support information
 */
export function getClipboardSupportInfo(): {
  modern: boolean;
  fallback: boolean;
  secure: boolean;
} {
  return {
    modern: !!(navigator.clipboard && window.isSecureContext),
    fallback: !!document.execCommand,
    secure: window.isSecureContext
  };
}
