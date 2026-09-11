export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function api<T = void>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json', ...init.headers },
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      message?: string | string[];
    };
    const message = Array.isArray(body.message)
      ? body.message.join('. ')
      : body.message;
    throw new ApiError(
      message ?? 'Não foi possível concluir a operação.',
      response.status,
    );
  }
  return response.status === 204
    ? (undefined as T)
    : ((await response.json()) as T);
}

export function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'Não foi possível concluir a operação.';
}

export function formatMoney(valueInCents: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valueInCents / 100);
}

export function formatTime(instant: string, timezone: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(instant));
}
