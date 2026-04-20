import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import LoginPage from './index';
import { authService } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';

// Mock các thư viện và hooks
vi.mock('../../services/authService', () => ({
  authService: {
    login: vi.fn(),
  },
}));

vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('LoginPage', () => {
  const mockLogin = vi.fn();
  const mockClearAuthError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({
      user: null,
      login: mockLogin,
      connectionError: false,
      authError: null,
      clearAuthError: mockClearAuthError,
    });
  });

  it('1. Hiển thị lỗi validation khi trống cả 2 trường', async () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const submitBtn = screen.getByRole('button', { name: /sign in/i });
    await userEvent.click(submitBtn);

    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(
      await screen.findByText(/password is required/i)
    ).toBeInTheDocument();
  });

  it('2. Hiển thị lỗi validation khi trống mật khẩu', async () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const emailInput = screen.getByLabelText(/email address/i);
    await userEvent.type(emailInput, 'test@example.com');

    const submitBtn = screen.getByRole('button', { name: /sign in/i });
    await userEvent.click(submitBtn);

    expect(
      await screen.findByText(/password is required/i)
    ).toBeInTheDocument();
    expect(screen.queryByText(/email is required/i)).not.toBeInTheDocument();
  });

  it('3. Hiển thị thông báo lỗi khi sai tên đăng nhập hoặc mật khẩu (API Error)', async () => {
    const errorMessage = 'Invalid credentials';
    (authService.login as any).mockRejectedValue(new Error(errorMessage));

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    await userEvent.type(
      screen.getByLabelText(/email address/i),
      'wrong@example.com'
    );
    await userEvent.type(screen.getByLabelText(/password/i), 'wrongpassword');

    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(errorMessage)).toBeInTheDocument();
  });

  it('4. Chuyển hướng thành công khi thông tin đúng', async () => {
    const mockUserResponse = {
      user: {
        id: '1',
        name: 'Admin User',
        role: 'ADMIN',
      },
    };
    (authService.login as any).mockResolvedValue(mockUserResponse);

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    await userEvent.type(
      screen.getByLabelText(/email address/i),
      'admin@example.com'
    );
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');

    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        id: '1',
        name: 'Admin User',
        role: 'ADMIN',
      });
    });
  });
});
