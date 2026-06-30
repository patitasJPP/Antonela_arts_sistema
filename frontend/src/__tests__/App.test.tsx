import { describe, test, expect } from '@jest/globals';
import * as matchers from '@testing-library/jest-dom/matchers';
expect.extend(matchers);

import { render, screen } from '@testing-library/react';

jest.mock('../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn().mockResolvedValue({ data: [] }),
    post: jest.fn().mockResolvedValue({ data: {} }),
    put: jest.fn().mockResolvedValue({ data: {} }),
    delete: jest.fn().mockResolvedValue({ data: {} }),
    interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
  },
}));

import App from '../App';

describe('App component', () => {
  test('renders navigation logo', () => {
    render(<App />);
    const navLogo = screen.getByRole('link', { name: /antonela art/i });
    expect(navLogo).toBeInTheDocument();
  });

  test('renders footer brand', () => {
    render(<App />);
    const footerBrand = screen.getAllByText(/Antonela Art/);
    expect(footerBrand.length).toBeGreaterThanOrEqual(1);
  });
});
