import { Buffer as NodeBuffer } from 'buffer';

// Make Buffer available globally
(global as any).Buffer = NodeBuffer;

export const Buffer = NodeBuffer;
