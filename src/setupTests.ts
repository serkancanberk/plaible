// src/setupTests.ts
import '@testing-library/jest-dom';

// Mock browser APIs for testing
if (typeof window !== 'undefined') {
  // Mock window.alert
  window.alert = () => {};
  
  // Mock URL.createObjectURL
  URL.createObjectURL = () => 'mock-object-url';
  
  // Mock URL.revokeObjectURL
  URL.revokeObjectURL = () => {};
}

// Make jest globals available
declare global {
  const jest: any;
  const describe: any;
  const it: any;
  const expect: any;
  const beforeEach: any;
  const afterEach: any;
  const beforeAll: any;
  const afterAll: any;
}
