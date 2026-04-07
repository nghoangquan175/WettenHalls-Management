const BASE_URL = import.meta.env.VITE_API_URL;

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

const USER_FRIENDLY_ERRORS: Record<number, string> = {
  400: 'Check your information and try again.',
  401: 'Invalid email or password.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  500: 'The system is experiencing an issue. Please try again later.',
};

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
    this.name = 'ApiError';
  }
}

export async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options;
  const isFormData = body instanceof FormData;

  const defaultHeaders: Record<string, string> = isFormData 
    ? {} 
    : { 'Content-Type': 'application/json' };

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${endpoint}`, {
      credentials: 'include',
      headers: {
        ...defaultHeaders,
        ...(headers as Record<string, string>),
      },
      body: isFormData ? (body as FormData) : (body ? JSON.stringify(body) : undefined),
      ...rest,
    });
  } catch (networkError) {
    throw new Error('Unable to connect to the server. Please check your network and try again.');
  }

  if (!response.ok) {
    let message = USER_FRIENDLY_ERRORS[response.status] || 'An unexpected error occurred. Please try again.';
    let code: string | undefined;
    
    try {
      const errorData = await response.json();
      if (errorData.message) message = errorData.message;
      if (errorData.code) code = errorData.code;
    } catch {
      // response is not JSON
    }
    
    throw new ApiError(response.status, message, code);
  }

  return response.json();
}
