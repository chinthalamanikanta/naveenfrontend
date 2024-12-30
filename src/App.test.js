import { render, screen } from '@testing-library/react';
import App from './App';  // Adjust the import path if needed
 
test('renders leave request header', () => {
  render(<App />);
  const headerElement = screen.getByText(/Leave Request/i);
  expect(headerElement).toBeInTheDocument();
});