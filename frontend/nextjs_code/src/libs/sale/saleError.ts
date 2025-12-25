
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function handleApiError(response: Response): Promise<never> {
  let message = response.statusText || 'API Error';
  let details: unknown = null;

  try {
    const data = await response.json();
    message = data.detail || data.message || message;
    details = data;
  } catch {
    // ignore JSON parse errors
  }

  throw new ApiError(message, response.status, details);
}
