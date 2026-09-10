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

type InvitationDetails = {
  carWashName: string;
  email: string;
  existingAccount: boolean;
};

type Team = {
  members: Array<{ id: string; email: string; status: 'ACTIVE' }>;
  invitations: Array<{ id: string; email: string; expiresAt: string }>;
};

export function App() {
  const setupToken = new URLSearchParams(window.location.search).get('token');
  const [session, setSession] = useState<Session | null>(null);
  const [selectedCarWashId, setSelectedCarWashId] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (
      window.location.pathname === '/set-password' ||
      window.location.pathname === '/reset-password'
    ) {
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
  if (window.location.pathname === '/reset-password') {
    return <ResetPassword token={setupToken} />;
  }
  if (window.location.pathname === '/accept-invitation') {
    return (
      <AcceptInvitation
        token={setupToken}
        session={session}
        onLogin={setSession}
      />
    );
  }
  if (!session) {
    return <Login onLogin={setSession} />;
  }
  const membership =
    session.user.memberships.find(
      (candidate) => candidate.carWashId === selectedCarWashId,
    ) ?? session.user.memberships[0];
  return membership.role === 'OWNER' ? (
    <OwnerWorkspace
      session={session}
      membership={membership}
      onSelectCarWash={setSelectedCarWashId}
      onLogout={() => setSession(null)}
    />
  ) : (
    <EmployeeHome
      session={session}
      membership={membership}
      onSelectCarWash={setSelectedCarWashId}
      onLogout={() => setSession(null)}
    />
  );
}

function SetPassword({ token }: { token: string | null }) {
  return (
    <PasswordLinkForm
      token={token}
      endpoint="/api/auth/set-password"
      heading="Crie sua senha"
      description="Este link é privado, temporário e funciona uma única vez."
      fieldLabel="Senha"
      buttonLabel="Definir senha"
    />
  );
}

function ResetPassword({ token }: { token: string | null }) {
  return (
    <PasswordLinkForm
      token={token}
      endpoint="/api/auth/reset-password"
      heading="Redefina sua senha"
      description="Este link é privado, temporário e funciona uma única vez. Depois, entre normalmente com a nova senha."
      fieldLabel="Nova senha"
      buttonLabel="Redefinir senha"
    />
  );
}

function PasswordLinkForm({
  token,
  endpoint,
  heading,
  description,
  fieldLabel,
  buttonLabel,
}: {
  token: string | null;
  endpoint: '/api/auth/set-password' | '/api/auth/reset-password';
  heading: string;
  description: string;
  fieldLabel: string;
  buttonLabel: string;
}) {
  const [message, setMessage] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await api(endpoint, {
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
      <h1>{heading}</h1>
      <p>{description}</p>
      {!token ? (
        <div role="alert" className="error">
          Link inválido.
        </div>
      ) : (
        <form onSubmit={submit}>
          <label>
            {fieldLabel}
            <input
              name="password"
              type="password"
              minLength={12}
              required
              autoComplete="new-password"
            />
          </label>
          <button type="submit">{buttonLabel}</button>
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

function AcceptInvitation({
  token,
  session,
  onLogin,
}: {
  token: string | null;
  session: Session | null;
  onLogin: (session: Session) => void;
}) {
  const [details, setDetails] = useState<InvitationDetails | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setMessage('Link inválido.');
      return;
    }
    void api<InvitationDetails>(`/api/team/invitations/${token}`)
      .then(setDetails)
      .catch((error) => setMessage(errorMessage(error)));
  }, [token]);

  async function acceptNew(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await api(`/api/team/invitations/${token}/accept-new`, {
        method: 'POST',
        body: JSON.stringify({ password: form.get('password') }),
      });
      window.history.replaceState({}, '', '/');
      window.location.reload();
    } catch (error) {
      setMessage(errorMessage(error));
    }
  }

  async function acceptExisting() {
    try {
      await api(`/api/team/invitations/${token}/accept-existing`, {
        method: 'POST',
        headers: { 'x-csrf-token': session!.csrfToken },
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
      <h1>Aceite o convite</h1>
      {details ? (
        <>
          <p>
            Você foi convidado para trabalhar em{' '}
            <strong>{details.carWashName}</strong> usando {details.email}.
          </p>
          {details.existingAccount ? (
            session ? (
              <button type="button" onClick={() => void acceptExisting()}>
                Aceitar com esta conta
              </button>
            ) : (
              <>
                <p>Entre na conta convidada para confirmar o novo vínculo.</p>
                <Login onLogin={onLogin} />
              </>
            )
          ) : (
            <form onSubmit={acceptNew}>
              <label>
                Crie sua senha
                <input
                  name="password"
                  type="password"
                  minLength={12}
                  required
                  autoComplete="new-password"
                />
              </label>
              <button type="submit">Aceitar convite</button>
            </form>
          )}
        </>
      ) : null}
      <Status message={message} />
    </main>
  );
}

function EmployeeHome({
  session,
  membership,
  onSelectCarWash,
  onLogout,
}: {
  session: Session;
  membership: Membership;
  onSelectCarWash: (carWashId: string) => void;
  onLogout: () => void;
}) {
  return (
    <main className="app-shell">
      <AppHeader
        membership={membership}
        session={session}
        onSelectCarWash={onSelectCarWash}
        onLogout={onLogout}
      />
      <section className="intro">
        <span className="eyebrow">Equipe</span>
        <h1>Acesso de funcionário</h1>
        <p>
          Seu acesso individual está ativo. A agenda será disponibilizada no
          próximo incremento do piloto.
        </p>
      </section>
    </main>
  );
}

function OwnerWorkspace({
  session,
  membership,
  onSelectCarWash,
  onLogout,
}: {
  session: Session;
  membership: Membership;
  onSelectCarWash: (carWashId: string) => void;
  onLogout: () => void;
}) {
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

  return (
    <main className="app-shell">
      <AppHeader
        membership={membership}
        session={session}
        onSelectCarWash={onSelectCarWash}
        onLogout={onLogout}
      />
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
      <TeamManagement session={session} membership={membership} />
    </main>
  );
}

function AppHeader({
  membership,
  session,
  onSelectCarWash,
  onLogout,
}: {
  membership: Membership;
  session: Session;
  onSelectCarWash: (carWashId: string) => void;
  onLogout: () => void;
}) {
  async function logout() {
    await api('/api/auth/logout', {
      method: 'POST',
      headers: { 'x-csrf-token': session.csrfToken },
    });
    onLogout();
  }
  return (
    <header>
      <Brand />
      <div>
        {session.user.memberships.length > 1 ? (
          <label className="tenant-selector">
            Lavação ativa
            <select
              value={membership.carWashId}
              onChange={(event) => onSelectCarWash(event.target.value)}
            >
              {session.user.memberships.map((candidate) => (
                <option key={candidate.carWashId} value={candidate.carWashId}>
                  {candidate.carWashName}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <strong>{membership.carWashName}</strong>
        )}
        <button
          type="button"
          className="secondary"
          onClick={() => void logout()}
        >
          Sair
        </button>
      </div>
    </header>
  );
}

function TeamManagement({
  session,
  membership,
}: {
  session: Session;
  membership: Membership;
}) {
  const [team, setTeam] = useState<Team>({ members: [], invitations: [] });
  const [invitationUrl, setInvitationUrl] = useState('');
  const [message, setMessage] = useState('');

  async function loadTeam() {
    const currentTeam = await api<Team>(
      `/api/car-washes/${membership.carWashId}/team`,
    );
    setTeam(currentTeam);
  }

  useEffect(() => {
    void loadTeam().catch((error) => setMessage(errorMessage(error)));
  }, [membership.carWashId]);

  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      const invitation = await api<{ invitationUrl: string }>(
        `/api/car-washes/${membership.carWashId}/team/invitations`,
        {
          method: 'POST',
          headers: { 'x-csrf-token': session.csrfToken },
          body: JSON.stringify({ email: form.get('email') }),
        },
      );
      setInvitationUrl(invitation.invitationUrl);
      setMessage('Convite criado. Compartilhe o link por um canal conferido.');
      formElement.reset();
      await loadTeam();
    } catch (error) {
      setMessage(errorMessage(error));
    }
  }

  async function revoke(membershipId: string) {
    try {
      await api(
        `/api/car-washes/${membership.carWashId}/team/members/${membershipId}`,
        {
          method: 'DELETE',
          headers: { 'x-csrf-token': session.csrfToken },
        },
      );
      setMessage('Acesso revogado.');
      await loadTeam();
    } catch (error) {
      setMessage(errorMessage(error));
    }
  }

  return (
    <section className="team-section">
      <div className="intro compact">
        <span className="eyebrow">Acessos</span>
        <h1>Equipe da lavação</h1>
        <p>Convites são privados, temporários e funcionam uma única vez.</p>
      </div>
      <div className="columns">
        <section className="panel">
          <h2>Convidar funcionário</h2>
          <form onSubmit={invite}>
            <label>
              E-mail da pessoa
              <input name="email" type="email" required autoComplete="email" />
            </label>
            <button type="submit">Criar convite</button>
          </form>
          {invitationUrl ? (
            <label className="private-link">
              Link privado
              <input value={invitationUrl} readOnly />
            </label>
          ) : null}
          <Status message={message} />
        </section>
        <section className="panel">
          <h2>Funcionários ativos</h2>
          {team.members.length === 0 ? (
            <p className="empty">Nenhum funcionário ativo.</p>
          ) : (
            <ul className="service-list">
              {team.members.map((member) => (
                <li key={member.id}>
                  <strong>{member.email}</strong>
                  <button
                    type="button"
                    className="danger"
                    onClick={() => void revoke(member.id)}
                  >
                    Revogar acesso
                  </button>
                </li>
              ))}
            </ul>
          )}
          {team.invitations.length > 0 ? (
            <p className="pending">
              {team.invitations.length} convite(s) pendente(s).
            </p>
          ) : null}
        </section>
      </div>
    </section>
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
