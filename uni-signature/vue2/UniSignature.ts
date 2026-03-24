import { VueConstructor } from 'vue';

/**
 * UniSignature Component Props (Vue2)
 */
export interface UniSignatureProps {
  /** Canvas identifier ID */
  canvasId?: string;
  /** Canvas width in pixels */
  width?: number;
  /** Canvas height in pixels */
  height?: number;
  /** Stroke color */
  lineColor?: string;
  /** Stroke width */
  lineWidth?: number;
  /** Background color */
  backgroundColor?: string;
  /** Disable signing */
  disabled?: boolean;
}

/**
 * UniSignature Emits
 */
export interface UniSignatureEmits {
  (e: 'begin'): void;
  (e: 'end'): void;
  (e: 'change', payload: { hasSignature: boolean }): void;
}

/**
 * Point interface for drawing
 */
export interface Point {
  x: number;
  y: number;
  pressure?: number;
}

/**
 * Signature data result
 */
export interface SignatureData {
  /** Base64 encoded image data */
  dataURL?: string;
  /** Raw image data */
  data?: any;
  /** Timestamp of capture */
  timestamp?: number;
}

/**
 * UniSignature Component Instance (Vue2)
 */
export interface UniSignatureInstance {
  /**
   * Get signature as data URL
   * @param type Image type (png/jpeg/webp)
   * @param quality Image quality (0-1)
   */
  getDataURL(type?: string, quality?: number): Promise<string>;

  /**
   * Get signature raw data
   */
  getData(): Promise<any>;

  /**
   * Clear the signature canvas
   */
  clear(): void;

  /**
   * Undo last stroke
   * @returns true if undo was successful
   */
  undo(): boolean;

  /**
   * Redo previously undone stroke
   * @returns true if redo was successful
   */
  redo(): boolean;

  /**
   * Check if undo is available
   */
  isUndoAvailable(): boolean;

  /**
   * Check if redo is available
   */
  isRedoAvailable(): boolean;

  /**
   * Check if signature is empty
   */
  isEmpty(): boolean;

  /**
   * Cleanup resources
   */
  destroy(): void;
}

/**
 * Vue2 Component Options for UniSignature
 */
export interface UniSignatureOptions {
  canvasId?: string;
  width?: number;
  height?: number;
  lineColor?: string;
  lineWidth?: number;
  backgroundColor?: string;
  disabled?: boolean;
  onBegin?: () => void;
  onEnd?: () => void;
  onChange?: (payload: { hasSignature: boolean }) => void;
}

/**
 * Create UniSignature component with options (Vue2)
 */
export function createSignature(options: UniSignatureOptions): VueConstructor {
  return {
    name: 'UniSignature',
    props: {
      canvasId: { type: String, default: options.canvasId || 'signature' },
      width: { type: Number, default: options.width || 300 },
      height: { type: Number, default: options.height || 200 },
      lineColor: { type: String, default: options.lineColor || '#000000' },
      lineWidth: { type: Number, default: options.lineWidth || 3 },
      backgroundColor: { type: String, default: options.backgroundColor || '#FFFFFF' },
      disabled: { type: Boolean, default: options.disabled || false },
    },
    // ... implementation would be similar to .vue file
  };
}
