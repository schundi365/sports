import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

test('renders badminton club title', async () => {
  render(<App />);
  
  // Wait for loading to complete
  await waitFor(() => {
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  });
  
  const titleElement = screen.getByRole('heading', { name: /badminton club/i });
  expect(titleElement).toBeInTheDocument();
});

test('renders player performance and expenses tracker subtitle', async () => {
  render(<App />);
  
  // Wait for loading to complete
  await waitFor(() => {
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  });
  
  const subtitleElement = screen.getByText(/player performance & expenses tracker/i);
  expect(subtitleElement).toBeInTheDocument();
});
