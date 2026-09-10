import { FormEvent, useEffect, useState } from 'react';

type Membership = {
  carWashId: string;
  carWashName: string;
  role: 'OWNER' | 'EMPLOYEE';
};

type Session = {
  csrfToken: string;
  user: { email: string; memberships: Membership[] };
};

type ServiceOffering = {
  id: string;
  name: string;
  priceInCents: number;
  durationInMinutes: number;
  active: boolean;
};

export function App() {
  const setupToken = new URLSearchParams(window.location.search).get('token');
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (window.location.pathname === '/set-password') {
      setLoading(false);
      return;
    }
    void api<Session>('/api/auth/session')
      .then(setSession)
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <main className="center-card">Carregando…</main>;
  }
  if (window.location.pathname === '/set-password') {
    return <SetPassword token={setupToken} />;
  }
  if (!session) {
    return <Login onLogin={setSession} />;
  }
  return <Catalog session={session} onLogout={() => setSession(null)} />;
}

function SetPassword({ token }: { token: string | null }) {
  const [message, setMessage] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await api('/api/auth/set-password', {
        method: 'POST',
        body: JSON.stringify({ token, password: form.get('password') }),
      });
      window.history.replaceState({}, '', '/');
      window.location.reload();
    } catch (error) {
      setMessage(errorMessage(error));
    }
  }

  return (
    <main className="center-card">
      <Brand />
      <h1>Crie sua senha</h1>
      <p>Este link é privado, temporário e funciona uma única vez.</p>
      {!token ? (
        <div role="alert" className="error">
          Link inválido.
        </div>
      ) : (
        <form onSubmit={submit}>
          <label>
            Senha
            <input
              name="password"
              type="password"
              minLength={12}
              required
              autoComplete="new-password"
            />
          </label>
          <button type="submit">Definir senha</button>
        </form>
      )}
      <Status message={message} />
    </main>
  );
}

function Login({ onLogin }: { onLogin: (session: Session) => void }) {
  const [message, setMessage] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const session = await api<Session>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: form.get('email'),
          password: form.get('password'),
        }),
      });
      onLogin(session);
    } catch (error) {
      setMessage(errorMessage(error));
    }
  }

  return (
    <main className="center-card">
      <Brand />
      <h1>Acesse sua lavação</h1>
      <p>Entre com o acesso individual criado para você.</p>
      <form onSubmit={submit}>
        <label>
          E-mail
          <input name="email" type="email" required autoComplete="email" />
        </label>
        <label>
          Senha
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
          />
        </label>
        <button type="submit">Entrar</button>
      </form>
      <Status message={message} />
    </main>
  );
}

function Catalog({
  session,
  onLogout,
}: {
  session: Session;
  onLogout: () => void;
}) {
  const membership = session.user.memberships[0];
  const [services, setServices] = useState<ServiceOffering[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    void api<ServiceOffering[]>(
      `/api/car-washes/${membership.carWashId}/services`,
    )
      .then(setServices)
      .catch((error) => setMessage(errorMessage(error)));
  }, [membership.carWashId]);

  async function createService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const price = Number(form.get('price'));
    try {
      const service = await api<ServiceOffering>(
        `/api/car-washes/${membership.carWashId}/services`,
        {
          method: 'POST',
          headers: { 'x-csrf-token': session.csrfToken },
          body: JSON.stringify({
            name: form.get('name'),
            priceInCents: Math.round(price * 100),
            durationInMinutes: Number(form.get('duration')),
            active: form.get('active') === 'on',
          }),
        },
      );
      setServices((current) => [...current, service]);
      setMessage('Serviço cadastrado.');
      formElement.reset();
    } catch (error) {
      setMessage(errorMessage(error));
    }
  }

  async function logout() {
    await api('/api/auth/logout', {
      method: 'POST',
      headers: { 'x-csrf-token': session.csrfToken },
    });
    onLogout();
  }

  return (
    <main className="app-shell">
      <header>
        <Brand />
        <div>
          <strong>{membership.carWashName}</strong>
          <button
            type="button"
            className="secondary"
            onClick={() => void logout()}
          >
            Sair
          </button>
        </div>
      </header>
      <section className="intro">
        <span className="eyebrow">Catálogo</span>
        <h1>Serviços da sua lavação</h1>
        <p>Cadastre valores em reais e a duração prevista do atendimento.</p>
      </section>
      <div className="columns">
        <section className="panel">
          <h2>Novo serviço</h2>
          <form onSubmit={createService}>
            <label>
              Nome
              <input name="name" maxLength={120} required />
            </label>
            <div className="field-row">
              <label>
                Preço (R$)
                <input
                  name="price"
                  type="number"
                  min="0"
                  max="1000000"
                  step="0.01"
                  required
                />
              </label>
              <label>
                Duração (min)
                <input
                  name="duration"
                  type="number"
                  min="1"
                  max="1440"
                  step="1"
                  required
                />
              </label>
            </div>
            <label className="checkbox">
              <input name="active" type="checkbox" defaultChecked /> Serviço
              ativo
            </label>
            <button type="submit">Cadastrar serviço</button>
          </form>
          <Status message={message} />
        </section>
        <section className="panel">
          <h2>Serviços cadastrados</h2>
          {services.length === 0 ? (
            <p className="empty">Nenhum serviço cadastrado ainda.</p>
          ) : (
            <ul className="service-list">
              {services.map((service) => (
                <li key={service.id}>
                  <div>
                    <strong>{service.name}</strong>
                    <span>
                      {service.durationInMinutes} min ·{' '}
                      {service.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <b>{formatMoney(service.priceInCents)}</b>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

function Brand() {
  return (
    <div className="brand">
      <span>N</span>Nitivo
    </div>
  );
}

function Status({ message }: { message: string }) {
  return message ? (
    <p role="status" className="status">
      {message}
    </p>
  ) : null;
}

async function api<T = void>(path: string, init: RequestInit = {}): Promise<T> {
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
    throw new Error(message ?? 'Não foi possível concluir a operação.');
  }
  return response.status === 204
    ? (undefined as T)
    : ((await response.json()) as T);
}

function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'Não foi possível concluir a operação.';
}

function formatMoney(valueInCents: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valueInCents / 100);
}
