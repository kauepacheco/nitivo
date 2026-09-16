import { api, errorMessage, formatMoney, formatTime } from './api';
import { BookingForm, TeamAgenda } from './Booking';
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

type PublicServiceOffering = Omit<ServiceOffering, 'active'>;

type PublicCarWashPage = {
  name: string;
  operationalContactPhone: string | null;
  services: PublicServiceOffering[];
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

type SchedulingSettings = {
  timezone: string;
  minimumBookingNoticeMinutes: number;
  bookingHorizonDays: number;
  changeNoticeMinutes: number;
  slotIntervalMinutes: number;
  weeklyHours: Array<{
    weekday: number;
    opensAt: string;
    closesAt: string;
  }>;
  boxes: Array<{ id: string; name: string; active: boolean }>;
  exceptions: Array<{
    date: string;
    kind: 'CLOSED' | 'SPECIAL_HOURS';
    opensAt: string | null;
    closesAt: string | null;
  }>;
  blocks: Array<{
    id: string;
    boxId: string | null;
    startsAt: string;
    endsAt: string;
  }>;
};

type Availability = {
  date: string;
  timezone: string;
  slots: Array<{ startsAt: string; endsAt: string }>;
};

function serviceFormPayload(form: FormData) {
  return {
    name: form.get('name'),
    priceInCents: Math.round(Number(form.get('price')) * 100),
    durationInMinutes: Number(form.get('duration')),
    active: form.get('active') === 'on',
  };
}

function ServiceFields({ service }: { service?: ServiceOffering }) {
  const editing = service !== undefined;
  return (
    <>
      <label>
        {editing ? 'Nome do serviço' : 'Nome'}
        <input
          name="name"
          defaultValue={service?.name}
          maxLength={120}
          required
        />
      </label>
      <div className="field-row">
        <label>
          {editing ? 'Preço do serviço (R$)' : 'Preço (R$)'}
          <input
            name="price"
            type="number"
            min="0"
            max="1000000"
            step="0.01"
            defaultValue={
              service ? (service.priceInCents / 100).toFixed(2) : undefined
            }
            required
          />
        </label>
        <label>
          {editing ? 'Duração do serviço (min)' : 'Duração (min)'}
          <input
            name="duration"
            type="number"
            min="1"
            max="1440"
            step="1"
            defaultValue={service?.durationInMinutes}
            required
          />
        </label>
      </div>
      <label className="checkbox">
        <input
          name="active"
          type="checkbox"
          defaultChecked={service?.active ?? true}
        />
        {editing ? 'Serviço disponível' : 'Serviço ativo'}
      </label>
    </>
  );
}

const weekdayLabels = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

export function App() {
  const setupToken = new URLSearchParams(window.location.search).get('token');
  const publicMatch = window.location.pathname.match(/^\/lavacoes\/([^/]+)$/);
  const [session, setSession] = useState<Session | null>(null);
  const [selectedCarWashId, setSelectedCarWashId] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (
      window.location.pathname === '/set-password' ||
      window.location.pathname === '/reset-password' ||
      publicMatch
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
  if (publicMatch)
    return <PublicCarWash slug={decodeURIComponent(publicMatch[1])} />;
  if (!session) {
    return <Login onLogin={setSession} />;
  }
  const membership =
    session.user.memberships.find(
      (candidate) => candidate.carWashId === selectedCarWashId,
    ) ?? session.user.memberships[0];
  return membership.role === 'OWNER' ? (
    <OwnerWorkspace
      key={membership.carWashId}
      session={session}
      membership={membership}
      onSelectCarWash={setSelectedCarWashId}
      onLogout={() => setSession(null)}
    />
  ) : (
    <EmployeeHome
      key={membership.carWashId}
      session={session}
      membership={membership}
      onSelectCarWash={setSelectedCarWashId}
      onLogout={() => setSession(null)}
    />
  );
}

function PublicCarWash({ slug }: { slug: string }) {
  const [page, setPage] = useState<PublicCarWashPage | null>(null);
  const [message, setMessage] = useState('Carregando…');
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [availabilityMessage, setAvailabilityMessage] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [queriedService, setQueriedService] = useState('');
  const [consulting, setConsulting] = useState(false);
  const [bookingStarted, setBookingStarted] = useState(false);
  useEffect(() => {
    void api<PublicCarWashPage>(
      `/api/public/car-washes/${encodeURIComponent(slug)}`,
    )
      .then((result) => {
        setPage(result);
        setMessage('');
      })
      .catch((error) => setMessage(errorMessage(error)));
  }, [slug]);

  async function consultAvailability(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSelectedSlot(null);
    setAvailability(null);
    setConsulting(true);
    const params = new URLSearchParams({
      serviceId: String(form.get('serviceId')),
      date: String(form.get('date')),
    });
    try {
      const result = await api<Availability>(
        `/api/public/car-washes/${encodeURIComponent(slug)}/availability?${params}`,
      );
      setAvailability(result);
      setQueriedService(String(form.get('serviceId')));
      setAvailabilityMessage(
        result.slots.length === 0
          ? 'Nenhum horário disponível nesta data.'
          : '',
      );
    } catch (error) {
      setAvailability(null);
      setAvailabilityMessage(errorMessage(error));
    } finally {
      setConsulting(false);
    }
  }
  if (!page)
    return (
      <main className="center-card">
        <Brand />
        <p role="status">{message}</p>
      </main>
    );
  return (
    <main className="public-page">
      <Brand />
      <section className="intro">
        <span className="eyebrow">Serviços</span>
        <h1>{page.name}</h1>
        <p>Escolha o atendimento ideal para o seu veículo.</p>
        {page.operationalContactPhone ? (
          <a
            className="contact-link"
            href={`tel:+${page.operationalContactPhone}`}
          >
            Contato: +{page.operationalContactPhone}
          </a>
        ) : null}
      </section>
      <section className="panel">
        <h2>Serviços disponíveis</h2>
        {page.services.length === 0 ? (
          <p className="empty">Nenhum serviço disponível no momento.</p>
        ) : (
          <ul className="service-list">
            {page.services.map((service) => (
              <li key={service.id}>
                <div>
                  <strong>{service.name}</strong>
                  <span>{service.durationInMinutes} min</span>
                </div>
                <b>{formatMoney(service.priceInCents)}</b>
              </li>
            ))}
          </ul>
        )}
      </section>
      {page.services.length > 0 ? (
        <section className="panel availability-panel">
          <h2>Consultar horários</h2>
          <form onSubmit={consultAvailability}>
            <fieldset
              disabled={consulting || bookingStarted}
              onChange={() => {
                setAvailability(null);
                setSelectedSlot(null);
              }}
            >
              <label>
                Serviço para agendar
                <select name="serviceId" required defaultValue="">
                  <option value="" disabled>
                    Selecione um serviço
                  </option>
                  {page.services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} — {service.durationInMinutes} min
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Data do atendimento
                <input name="date" type="date" required />
              </label>
              <button type="submit">Consultar horários</button>
            </fieldset>
          </form>
          {availability?.slots.length ? (
            <div className="slot-list" aria-label="Horários disponíveis">
              {availability.slots.map((slot) => (
                <button
                  key={slot.startsAt}
                  type="button"
                  className="slot"
                  disabled={bookingStarted}
                  aria-pressed={selectedSlot === slot.startsAt}
                  onClick={() => setSelectedSlot(slot.startsAt)}
                >
                  {formatTime(slot.startsAt, availability.timezone)}
                </button>
              ))}
            </div>
          ) : null}
          {selectedSlot && availability ? (
            <BookingForm
              key={`${queriedService}:${selectedSlot}`}
              slug={slug}
              serviceId={queriedService}
              startsAt={selectedSlot}
              timezone={availability.timezone}
              service={page.services.find(
                (service) => service.id === queriedService,
              )!}
              onStarted={() => setBookingStarted(true)}
              onRejected={() => setBookingStarted(false)}
            />
          ) : null}
          <Status message={availabilityMessage} />
        </section>
      ) : null}
    </main>
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
        <p>Consulte os atendimentos da sua lavação.</p>
      </section>
      <TeamAgenda
        carWashId={membership.carWashId}
        csrfToken={session.csrfToken}
      />
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
  const [operationalContactPhone, setOperationalContactPhone] = useState('');
  const [publicProfileLoaded, setPublicProfileLoaded] = useState(false);
  const [publicProfileMessage, setPublicProfileMessage] = useState(
    'Carregando informações públicas…',
  );
  const [message, setMessage] = useState('');
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [agendaCatalogRevision, setAgendaCatalogRevision] = useState(0);

  useEffect(() => {
    void api<ServiceOffering[]>(
      `/api/car-washes/${membership.carWashId}/services`,
    )
      .then(setServices)
      .catch((error) => setMessage(errorMessage(error)));
    void api<{ operationalContactPhone: string | null }>(
      `/api/car-washes/${membership.carWashId}/public-profile`,
    )
      .then((profile) => {
        setOperationalContactPhone(profile.operationalContactPhone ?? '');
        setPublicProfileLoaded(true);
        setPublicProfileMessage('');
      })
      .catch((error) => setPublicProfileMessage(errorMessage(error)));
  }, [membership.carWashId]);

  async function updatePublicProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!publicProfileLoaded) return;
    const form = new FormData(event.currentTarget);
    try {
      const profile = await api<{ operationalContactPhone: string }>(
        `/api/car-washes/${membership.carWashId}/public-profile`,
        {
          method: 'PATCH',
          headers: { 'x-csrf-token': session.csrfToken },
          body: JSON.stringify({
            operationalContactPhone: form.get('operationalContactPhone'),
          }),
        },
      );
      setOperationalContactPhone(profile.operationalContactPhone);
      setPublicProfileMessage('Informações públicas atualizadas.');
    } catch (error) {
      setPublicProfileMessage(errorMessage(error));
    }
  }

  async function createService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      const service = await api<ServiceOffering>(
        `/api/car-washes/${membership.carWashId}/services`,
        {
          method: 'POST',
          headers: { 'x-csrf-token': session.csrfToken },
          body: JSON.stringify(serviceFormPayload(form)),
        },
      );
      setServices((current) => [...current, service]);
      setAgendaCatalogRevision((current) => current + 1);
      setMessage('Serviço cadastrado.');
      formElement.reset();
    } catch (error) {
      setMessage(errorMessage(error));
    }
  }

  async function updateService(
    event: FormEvent<HTMLFormElement>,
    serviceId: string,
  ) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const service = await api<ServiceOffering>(
        `/api/car-washes/${membership.carWashId}/services/${serviceId}`,
        {
          method: 'PATCH',
          headers: { 'x-csrf-token': session.csrfToken },
          body: JSON.stringify(serviceFormPayload(form)),
        },
      );
      setServices((current) =>
        current.map((candidate) =>
          candidate.id === service.id ? service : candidate,
        ),
      );
      setAgendaCatalogRevision((current) => current + 1);
      setEditingServiceId(null);
      setMessage('Serviço atualizado.');
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
      <section className="panel public-profile-panel">
        <h2>Informações públicas</h2>
        <p>Este contato será exibido para clientes na página da lavação.</p>
        <form onSubmit={updatePublicProfile}>
          <label>
            Telefone operacional com DDD
            <input
              name="operationalContactPhone"
              type="tel"
              disabled={!publicProfileLoaded}
              value={operationalContactPhone}
              onChange={(event) =>
                setOperationalContactPhone(event.target.value)
              }
              placeholder="(11) 99999-0001"
              required
            />
          </label>
          <button type="submit" disabled={!publicProfileLoaded}>
            Salvar informações públicas
          </button>
        </form>
        <Status message={publicProfileMessage} />
      </section>
      <div className="columns">
        <section className="panel">
          <h2>Novo serviço</h2>
          <form onSubmit={createService}>
            <ServiceFields />
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
                  {editingServiceId === service.id ? (
                    <form
                      className="service-editor"
                      onSubmit={(event) =>
                        void updateService(event, service.id)
                      }
                    >
                      <ServiceFields service={service} />
                      <div className="service-actions">
                        <button type="submit">Salvar alterações</button>
                        <button
                          type="button"
                          className="secondary inline-button"
                          onClick={() => setEditingServiceId(null)}
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div>
                        <strong>{service.name}</strong>
                        <span>
                          {service.durationInMinutes} min ·{' '}
                          {service.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                      <div className="service-summary-actions">
                        <b>{formatMoney(service.priceInCents)}</b>
                        <button
                          type="button"
                          className="secondary inline-button"
                          onClick={() => setEditingServiceId(service.id)}
                        >
                          Editar
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      <TeamAgenda
        carWashId={membership.carWashId}
        csrfToken={session.csrfToken}
        catalogRevision={agendaCatalogRevision}
      />
      <SchedulingManagement session={session} membership={membership} />
      <TeamManagement session={session} membership={membership} />
    </main>
  );
}

function SchedulingManagement({
  session,
  membership,
}: {
  session: Session;
  membership: Membership;
}) {
  const [settings, setSettings] = useState<SchedulingSettings | null>(null);
  const [message, setMessage] = useState('Carregando agenda…');

  async function loadSettings() {
    const result = await api<SchedulingSettings>(
      `/api/car-washes/${membership.carWashId}/scheduling-settings`,
    );
    setSettings(result);
    setMessage('');
  }

  useEffect(() => {
    void loadSettings().catch((error) => setMessage(errorMessage(error)));
  }, [membership.carWashId]);

  async function createBox(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      await api(`/api/car-washes/${membership.carWashId}/boxes`, {
        method: 'POST',
        headers: { 'x-csrf-token': session.csrfToken },
        body: JSON.stringify({ name: form.get('name') }),
      });
      formElement.reset();
      await loadSettings();
      setMessage('Box cadastrado.');
    } catch (error) {
      setMessage(errorMessage(error, settings?.timezone));
    }
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const weeklyHours = weekdayLabels.flatMap((_, weekday) =>
      form.get(`open-${weekday}`) === 'on'
        ? [
            {
              weekday,
              opensAt: String(form.get(`opens-${weekday}`)),
              closesAt: String(form.get(`closes-${weekday}`)),
            },
          ]
        : [],
    );
    try {
      const result = await api<SchedulingSettings>(
        `/api/car-washes/${membership.carWashId}/scheduling-settings`,
        {
          method: 'PUT',
          headers: { 'x-csrf-token': session.csrfToken },
          body: JSON.stringify({
            minimumBookingNoticeMinutes: Number(
              form.get('minimumBookingNoticeMinutes'),
            ),
            bookingHorizonDays: Number(form.get('bookingHorizonDays')),
            changeNoticeMinutes: Number(form.get('changeNoticeMinutes')),
            slotIntervalMinutes: Number(form.get('slotIntervalMinutes')),
            weeklyHours,
          }),
        },
      );
      setSettings(result);
      setMessage('Agenda atualizada.');
    } catch (error) {
      setMessage(errorMessage(error, settings?.timezone));
    }
  }

  async function toggleBox(box: SchedulingSettings['boxes'][number]) {
    try {
      await api(`/api/car-washes/${membership.carWashId}/boxes/${box.id}`, {
        method: 'PATCH',
        headers: { 'x-csrf-token': session.csrfToken },
        body: JSON.stringify({ active: !box.active }),
      });
      await loadSettings();
      setMessage(`Box ${box.active ? 'desativado' : 'ativado'}.`);
    } catch (error) {
      setMessage(errorMessage(error, settings?.timezone));
    }
  }

  async function saveException(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const kind = String(form.get('kind')) as 'CLOSED' | 'SPECIAL_HOURS';
    const date = String(form.get('date'));
    try {
      await api(
        `/api/car-washes/${membership.carWashId}/scheduling-settings/exceptions/${date}`,
        {
          method: 'PUT',
          headers: { 'x-csrf-token': session.csrfToken },
          body: JSON.stringify(
            kind === 'CLOSED'
              ? { kind }
              : {
                  kind,
                  opensAt: form.get('opensAt'),
                  closesAt: form.get('closesAt'),
                },
          ),
        },
      );
      await loadSettings();
      setMessage('Exceção salva.');
    } catch (error) {
      setMessage(errorMessage(error, settings?.timezone));
    }
  }

  async function removeException(date: string) {
    try {
      await api(
        `/api/car-washes/${membership.carWashId}/scheduling-settings/exceptions/${date}`,
        {
          method: 'DELETE',
          headers: { 'x-csrf-token': session.csrfToken },
        },
      );
      await loadSettings();
      setMessage('Exceção removida.');
    } catch (error) {
      setMessage(errorMessage(error, settings?.timezone));
    }
  }

  async function createBlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const boxId = String(form.get('boxId'));
    try {
      await api(
        `/api/car-washes/${membership.carWashId}/scheduling-settings/blocks`,
        {
          method: 'POST',
          headers: { 'x-csrf-token': session.csrfToken },
          body: JSON.stringify({
            ...(boxId ? { boxId } : {}),
            startsAt: localInputToInstant(
              String(form.get('startsAt')),
              settings!.timezone,
            ),
            endsAt: localInputToInstant(
              String(form.get('endsAt')),
              settings!.timezone,
            ),
          }),
        },
      );
      formElement.reset();
      await loadSettings();
      setMessage('Bloqueio criado.');
    } catch (error) {
      setMessage(errorMessage(error, settings?.timezone));
    }
  }

  async function removeBlock(blockId: string) {
    try {
      await api(
        `/api/car-washes/${membership.carWashId}/scheduling-settings/blocks/${blockId}`,
        {
          method: 'DELETE',
          headers: { 'x-csrf-token': session.csrfToken },
        },
      );
      await loadSettings();
      setMessage('Bloqueio removido.');
    } catch (error) {
      setMessage(errorMessage(error, settings?.timezone));
    }
  }

  return (
    <section className="management-section">
      <div className="intro compact">
        <span className="eyebrow">Disponibilidade</span>
        <h1>Capacidade e agenda</h1>
        <p>Configure os boxes, o expediente semanal e as regras de reserva.</p>
      </div>
      {settings ? (
        <>
          <div className="columns scheduling-columns">
            <section className="panel">
              <h2>Boxes</h2>
              <form onSubmit={createBox}>
                <label>
                  Nome do box
                  <input name="name" maxLength={80} required />
                </label>
                <button type="submit">Cadastrar box</button>
              </form>
              <ul className="service-list">
                {settings.boxes.map((box) => (
                  <li key={box.id}>
                    <div>
                      <strong>{box.name}</strong>
                      <span>{box.active ? 'Ativo' : 'Inativo'}</span>
                    </div>
                    <button
                      type="button"
                      className="secondary inline-button"
                      onClick={() => void toggleBox(box)}
                    >
                      {box.active ? 'Desativar' : 'Ativar'}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
            <section className="panel">
              <h2>Expediente e políticas</h2>
              <form onSubmit={saveSettings}>
                <div className="policy-grid">
                  <NumberField
                    name="minimumBookingNoticeMinutes"
                    label="Antecedência mínima (min)"
                    value={settings.minimumBookingNoticeMinutes}
                    min={0}
                  />
                  <NumberField
                    name="bookingHorizonDays"
                    label="Horizonte de reservas (dias)"
                    value={settings.bookingHorizonDays}
                    min={1}
                  />
                  <NumberField
                    name="changeNoticeMinutes"
                    label="Prazo para alterações (min)"
                    value={settings.changeNoticeMinutes}
                    min={0}
                  />
                  <NumberField
                    name="slotIntervalMinutes"
                    label="Intervalo entre inícios (min)"
                    value={settings.slotIntervalMinutes}
                    min={5}
                  />
                </div>
                <div className="week-grid">
                  {weekdayLabels.map((label, weekday) => {
                    const hours = settings.weeklyHours.find(
                      (candidate) => candidate.weekday === weekday,
                    );
                    return (
                      <div className="weekday" key={label}>
                        <label className="checkbox">
                          <input
                            name={`open-${weekday}`}
                            type="checkbox"
                            defaultChecked={Boolean(hours)}
                          />
                          {label} aberto
                        </label>
                        <input
                          aria-label={`${label} abre`}
                          name={`opens-${weekday}`}
                          type="time"
                          defaultValue={hours?.opensAt ?? '08:00'}
                        />
                        <input
                          aria-label={`${label} fecha`}
                          name={`closes-${weekday}`}
                          type="time"
                          defaultValue={hours?.closesAt ?? '18:00'}
                        />
                      </div>
                    );
                  })}
                </div>
                <button type="submit">Salvar agenda</button>
              </form>
            </section>
          </div>
          <div className="columns scheduling-columns">
            <section className="panel">
              <h2>Feriados e horários especiais</h2>
              <form onSubmit={saveException}>
                <label>
                  Data da exceção
                  <input name="date" type="date" required />
                </label>
                <label>
                  Tipo da exceção
                  <select name="kind" defaultValue="CLOSED">
                    <option value="CLOSED">Fechado</option>
                    <option value="SPECIAL_HOURS">Horário especial</option>
                  </select>
                </label>
                <div className="field-row">
                  <label>
                    Abertura especial
                    <input name="opensAt" type="time" defaultValue="08:00" />
                  </label>
                  <label>
                    Fechamento especial
                    <input name="closesAt" type="time" defaultValue="18:00" />
                  </label>
                </div>
                <button type="submit">Salvar exceção</button>
              </form>
              <ul className="service-list" aria-label="Exceções cadastradas">
                {settings.exceptions.map((exception) => (
                  <li key={exception.date}>
                    <div>
                      <strong>{formatDate(exception.date)}</strong>
                      <span>
                        {exception.kind === 'CLOSED'
                          ? 'Fechado'
                          : `${exception.opensAt}–${exception.closesAt}`}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="secondary inline-button"
                      onClick={() => void removeException(exception.date)}
                    >
                      Remover
                    </button>
                  </li>
                ))}
              </ul>
            </section>
            <section className="panel">
              <h2>Bloqueios</h2>
              <form onSubmit={createBlock}>
                <label>
                  Recurso bloqueado
                  <select name="boxId" defaultValue="">
                    <option value="">Toda a operação</option>
                    {settings.boxes.map((box) => (
                      <option key={box.id} value={box.id}>
                        {box.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Início do bloqueio
                  <input name="startsAt" type="datetime-local" required />
                </label>
                <label>
                  Fim do bloqueio
                  <input name="endsAt" type="datetime-local" required />
                </label>
                <button type="submit">Criar bloqueio</button>
              </form>
              <ul className="service-list" aria-label="Bloqueios cadastrados">
                {settings.blocks.map((block) => (
                  <li key={block.id}>
                    <div>
                      <strong>
                        {block.boxId
                          ? (settings.boxes.find(
                              (box) => box.id === block.boxId,
                            )?.name ?? 'Box removido')
                          : 'Toda a operação'}
                      </strong>
                      <span>
                        {formatInstant(block.startsAt, settings.timezone)}–
                        {formatInstant(block.endsAt, settings.timezone)}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="secondary inline-button"
                      onClick={() => void removeBlock(block.id)}
                    >
                      Remover
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </>
      ) : null}
      <Status message={message} />
    </section>
  );
}

function localInputToInstant(value: string, timezone: string) {
  const [date, time] = value.split('T');
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const desired = Date.UTC(year, month - 1, day, hour, minute);
  let instant = desired;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(new Date(instant));
    const part = (type: Intl.DateTimeFormatPartTypes) =>
      Number(parts.find((candidate) => candidate.type === type)?.value);
    const actual = Date.UTC(
      part('year'),
      part('month') - 1,
      part('day'),
      part('hour'),
      part('minute'),
    );
    instant += desired - actual;
  }
  return new Date(instant).toISOString();
}

function formatDate(date: string) {
  return `${date.slice(8, 10)}/${date.slice(5, 7)}/${date.slice(0, 4)}`;
}

function formatInstant(instant: string, timezone: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: timezone,
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(instant));
}

function NumberField({
  name,
  label,
  value,
  min,
}: {
  name: string;
  label: string;
  value: number;
  min: number;
}) {
  return (
    <label>
      {label}
      <input
        name={name}
        type="number"
        min={min}
        step="1"
        defaultValue={value}
      />
    </label>
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
