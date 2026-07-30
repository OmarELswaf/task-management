import { vi } from "vitest";
import "@testing-library/jest-dom";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

vi.stubEnv("VITE_SUPABASE_URL", "https://test.supabase.co");
vi.stubEnv("VITE_SUPABASE_ANON_KEY", "test-anon-key");

const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockRange = vi.fn();
const mockSingle = vi.fn();
const mockIlike = vi.fn();
const mockGte = vi.fn();
const mockLte = vi.fn();
const mockThen = vi.fn();

mockSelect.mockReturnThis();
mockInsert.mockReturnThis();
mockUpdate.mockReturnThis();
mockDelete.mockReturnThis();
mockEq.mockReturnThis();
mockOrder.mockReturnThis();
mockRange.mockReturnThis();
mockSingle.mockReturnThis();
mockIlike.mockReturnThis();
mockGte.mockReturnThis();
mockLte.mockReturnThis();
mockThen.mockReturnThis();

export function createMockSupabase() {
  return {
    from: vi.fn(() => ({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
      eq: mockEq,
      order: mockOrder,
      range: mockRange,
      single: mockSingle,
      ilike: mockIlike,
      gte: mockGte,
      lte: mockLte,
      then: mockThen,
    })),
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
  };
}

vi.mock("@/lib/supabase", () => ({
  supabase: createMockSupabase(),
}));
