import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthProvider';
import { useAuth } from '../hooks/useAuth';
import { LoginPrompt } from '../components/LoginPrompt';
import { AuthGuard } from '../components/AuthGuard';

// Mock fetch for auth endpoints
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Test component that uses auth
const TestComponent = () => {
  const { user, isLoading, login, logout } = useAuth();
  
  return (
    <div>
      <div data-testid="user-status">
        {isLoading ? 'Loading...' : user ? `Logged in as ${user.identity?.displayName || user.email}` : 'Not logged in'}
      </div>
      <button onClick={() => login('/test-redirect')} data-testid="login-btn">
        Login
      </button>
      <button onClick={logout} data-testid="logout-btn">
        Logout
      </button>
    </div>
  );
};

// Test component for AuthGuard
const ProtectedComponent = () => <div data-testid="protected-content">Protected Content</div>;

describe('Authentication Flow', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('should show loading state initially', () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByTestId('user-status')).toHaveTextContent('Loading...');
  });

  it('should show not logged in when auth fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user-status')).toHaveTextContent('Not logged in');
    });
  });

  it('should show user info when authenticated', async () => {
    const mockUser = {
      _id: '123',
      email: 'test@example.com',
      identity: {
        displayName: 'Test User',
        firstName: 'Test',
        lastName: 'User'
      },
      wallet: { balance: 100 }
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockUser)
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user-status')).toHaveTextContent('Logged in as Test User');
    });
  });

  it('should redirect to login when login button clicked', () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401
    });

    // Mock window.location.href
    delete (window as any).location;
    window.location = { href: '' } as any;

    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>
    );

    fireEvent.click(screen.getByTestId('login-btn'));

    expect(window.location.href).toBe('/api/auth/google?redirect=%2Ftest-redirect');
  });

  it('should call logout endpoint when logout button clicked', async () => {
    const mockUser = {
      _id: '123',
      email: 'test@example.com',
      identity: { displayName: 'Test User' },
      wallet: { balance: 100 }
    };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUser)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true })
      });

    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user-status')).toHaveTextContent('Logged in as Test User');
    });

    fireEvent.click(screen.getByTestId('logout-btn'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    });
  });

  it('should show LoginPrompt when user is not authenticated in AuthGuard', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <AuthGuard>
            <ProtectedComponent />
          </AuthGuard>
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Sign in to start your story')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  it('should show protected content when user is authenticated in AuthGuard', async () => {
    const mockUser = {
      _id: '123',
      email: 'test@example.com',
      identity: { displayName: 'Test User' },
      wallet: { balance: 100 }
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockUser)
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <AuthGuard>
            <ProtectedComponent />
          </AuthGuard>
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(screen.queryByText('Sign in to start your story')).not.toBeInTheDocument();
    });
  });

  it('should show loading spinner in AuthGuard while loading', () => {
    mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(
      <BrowserRouter>
        <AuthProvider>
          <AuthGuard>
            <ProtectedComponent />
          </AuthGuard>
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
