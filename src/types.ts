export type ReflectionCategory = 'daily' | 'brainstorm' | 'gratitude' | 'challenge' | 'general';

export type ReflectionMode = 'reflect' | 'summarize' | 'brainstorm' | 'critique' | 'action_items';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string; // ISO string
  modelUsed?: string;
}

export interface Reflection {
  id: string;
  userId: string;
  title: string;
  category: ReflectionCategory;
  mode: ReflectionMode;
  initialPrompt: string;
  messages: ChatMessage[];
  tags: string[];
  summary?: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  createdAt?: string;
  lastLoginAt?: string;
}

export interface GeminiReflectRequest {
  category: ReflectionCategory;
  mode: ReflectionMode;
  userPrompt: string;
  history?: Array<{
    role: 'user' | 'model';
    content: string;
  }>;
  title?: string;
}

export interface GeminiReflectResponse {
  success: boolean;
  reply?: string;
  suggestedTitle?: string;
  suggestedTags?: string[];
  summary?: string;
  modelUsed?: string;
  error?: string;
}
