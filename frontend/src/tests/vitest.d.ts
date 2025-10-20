/**
 * Definiciones de tipos para Vitest - Resuelve errores de testing globals
 */
import type { 
  TestAPI, 
  MockedFunction,
  ExpectStatic
} from 'vitest'
import '@testing-library/jest-dom'

declare global {
  const describe: TestAPI['describe']
  const it: TestAPI['it']
  const test: TestAPI['test']
  const expect: ExpectStatic
  const beforeAll: TestAPI['beforeAll']
  const afterAll: TestAPI['afterAll']
  const beforeEach: TestAPI['beforeEach']
  const afterEach: TestAPI['afterEach']
  const vi: typeof import('vitest')['vi']
}

// Definiciones para mocks de Vitest
export type MockedFn<T extends (...args: any[]) => any> = MockedFunction<T>

export {}
