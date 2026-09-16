import { FormEvent, useEffect, useRef, useState } from 'react';
import { ApiError, api, errorMessage, formatMoney, formatTime } from './api';

type Receipt = {
  id: string;
  carWashName: string;
  operationalContactPhone: string | null;
  timezone: string;
  changeNoticeMinutes: number;
  serviceName: string;
  servicePriceInCents: number;
  serviceDurationInMinutes: number;
  startsAt: string;
  endsAt: string;
  status: string;
};

type BookingInput = {
  attemptId: string;
  serviceId: string;
  startsAt: string;
  name: string;
  phone: string;
  plate: string;
};

type CustomerVehicleInput = Pick<BookingInput, 'name' | 'phone' | 'plate'>;

function normalizeName(value: FormDataEntryValue | null) {
  return String(value).trim();
}

function normalizePhone(value: FormDataEntryValue | null) {
  return String(value).replace(/\D/g, '');
}

function normalizePlate(value: FormDataEntryValue | null) {
  return String(value).toUpperCase().replace(/[-\s]/g, '');
}

export function BookingForm({
  slug,
  serviceId,
  startsAt,
  timezone,
  service,
  onStarted,
  onRejected,
}: {
  slug: string;
  serviceId: string;
  startsAt: string;
  timezone: string;
  service: { name: string; priceInCents: number; durationInMinutes: number };
  onStarted: () => void;
  onRejected: () => void;
}) {
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);
  const attempt = useRef<BookingInput | null>(null);
  const submitting = useRef(false);

  async function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const form = new FormData(event.currentTarget);
    if (!attempt.current) {
      attempt.current = {
        attemptId: crypto.randomUUID(),
        serviceId,
        startsAt,
        name: normalizeName(form.get('name')),
        phone: normalizePhone(form.get('phone')),
        plate: normalizePlate(form.get('plate')),
      };
    }
    submitting.current = true;
    onStarted();
    setPending(true);
    setMessage('');
    try {
      setReceipt(
        await api<Receipt>(
          `/api/public/car-washes/${encodeURIComponent(slug)}/appointments`,
          {
            method: 'POST',
            body: JSON.stringify(attempt.current),
          },
        ),
      );
    } catch (error) {
      if (
        error instanceof ApiError &&
        ([400, 404].includes(error.status) ||
          (error.status === 409 &&
            error.message.startsWith('Horário indisponível')))
      ) {
        attempt.current = null;
        onRejected();
        setMessage(errorMessage(error));
        return;
      }
      setMessage(
        `${errorMessage(error)} Se houve falha de conexão, tente novamente com os mesmos dados em até 15 minutos. Não inicie outra reserva sem conferir com a lavação.`,
      );
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }
  if (receipt) {
    const whatsappHref = receipt.operationalContactPhone
      ? whatsappLink(receipt, receipt.operationalContactPhone)
      : null;
    return (
      <section aria-label="Comprovante" className="booking-receipt">
        <h2>Reserva confirmada</h2>
        <p>Sua reserva está confirmada mesmo sem enviar mensagem.</p>
        <p>
          <strong>{receipt.carWashName}</strong>
        </p>
        <p>
          {receipt.serviceName} · {receipt.serviceDurationInMinutes} min ·{' '}
          {formatMoney(receipt.servicePriceInCents)}
        </p>
        <p>
          {formatDate(receipt.startsAt, receipt.timezone)} ·{' '}
          {formatTime(receipt.startsAt, receipt.timezone)}–
          {formatTime(receipt.endsAt, receipt.timezone)}
        </p>
        <p>
          Referência: <span className="booking-reference">{receipt.id}</span>
        </p>
        <p>
          Guarde este comprovante antes de fechar a página. Ele não permite
          consultar reservas depois.
        </p>
        <p>
          Para cancelar ou reagendar, contate a lavação pelo WhatsApp com pelo
          menos {receipt.changeNoticeMinutes} minutos de antecedência. A equipe
          confere o pedido e registra a alteração no Nitivo. A reserva só muda
          depois desse registro.
        </p>
        {whatsappHref ? (
          <>
            <a href={whatsappHref} target="_blank" rel="noreferrer">
              Abrir conversa no WhatsApp
            </a>
            <p>
              Abrir a conversa não envia a mensagem nem verifica seu telefone.
            </p>
          </>
        ) : (
          <p>O contato da lavação pelo WhatsApp não está disponível.</p>
        )}
      </section>
    );
  }
  return (
    <section aria-label="Confirmar atendimento">
      <h2>Confirmar atendimento</h2>
      <p>
        {service.name} · {service.durationInMinutes} min ·{' '}
        {formatMoney(service.priceInCents)}
      </p>
      <p>
        {formatDate(startsAt, timezone)} às {formatTime(startsAt, timezone)}{' '}
        (horário da lavação)
      </p>
      <form onSubmit={confirm}>
        <fieldset disabled={pending || attempt.current !== null}>
          <label>
            Seu nome
            <input
              name="name"
              autoComplete="name"
              required
              maxLength={100}
              pattern=".*\S.*"
            />
          </label>
          <label>
            Telefone com DDD
            <input
              name="phone"
              type="tel"
              autoComplete="tel"
              required
              pattern="[0-9 ()+\-]{10,22}"
              maxLength={22}
            />
          </label>
          <label>
            Placa do veículo
            <input
              name="plate"
              required
              maxLength={8}
              pattern="[A-Za-z]{3}-?[0-9][A-Za-z0-9][0-9]{2}"
            />
          </label>
        </fieldset>
        <p>
          Nome, telefone e placa serão usados pela lavação para organizar e
          contatar você sobre este atendimento. O telefone informado não é
          verificado automaticamente.
        </p>
        <button type="submit" disabled={pending}>
          {pending
            ? 'Confirmando…'
            : attempt.current
              ? 'Tentar novamente'
              : 'Confirmar reserva'}
        </button>
      </form>
      {message ? <p role="status">{message}</p> : null}
    </section>
  );
}

type Appointment = {
  id: string;
  startsAt: string;
  endsAt: string;
  status: string;
  serviceName: string;
  servicePriceInCents: number;
  serviceDurationInMinutes: number;
  origin: string;
  createdBy: { id: string; user: { email: string } } | null;
  statusChangedBy: { id: string; user: { email: string } } | null;
  statusChangedAt: string | null;
  cancellationRequestedAt: string | null;
  cancellationReason: string | null;
  rescheduleRequestedAt: string | null;
  rescheduledAt: string | null;
  rescheduledBy: { id: string; user: { email: string } } | null;
  customer: { name: string; phone: string } | null;
  vehicle: { plate: string } | null;
  box: { name: string };
};

type NextAppointmentStatus =
  'IN_PROGRESS' | 'COMPLETED' | 'NO_SHOW' | 'CANCELED';
type CancellationInput = { requestedAt?: string; reason?: string };
type RescheduleInput = { startsAt: string; requestedAt: string };
type TeamService = {
  id: string;
  name: string;
  priceInCents: number;
  durationInMinutes: number;
};
type Agenda = {
  date: string;
  timezone: string;
  appointments: Appointment[];
  upcoming: Appointment[];
  services: TeamService[];
};
type WalkInAvailability = {
  date: string;
  timezone: string;
  slots: Array<{ startsAt: string; endsAt: string }>;
};

export function TeamAgenda({
  carWashId,
  csrfToken,
  catalogRevision = 0,
  onAppointmentStatusChanged,
}: {
  carWashId: string;
  csrfToken: string;
  catalogRevision?: number;
  onAppointmentStatusChanged?: () => void;
}) {
  const [date, setDate] = useState('');
  const [agenda, setAgenda] = useState<Agenda | null>(null);
  const [message, setMessage] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [walkInDate, setWalkInDate] = useState('');
  const [walkInServiceId, setWalkInServiceId] = useState('');
  const [walkInAvailability, setWalkInAvailability] =
    useState<WalkInAvailability | null>(null);
  const [selectedWalkInSlot, setSelectedWalkInSlot] = useState<string | null>(
    null,
  );
  const [walkInMessage, setWalkInMessage] = useState('');
  const [walkInPending, setWalkInPending] = useState(false);
  const agendaView = `${carWashId}:${date}:${refresh}`;
  const activeAgendaView = useRef(agendaView);
  activeAgendaView.current = agendaView;
  useEffect(() => {
    let active = true;
    setAgenda(null);
    setMessage('Carregando agenda…');
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    void api<Agenda>(`/api/car-washes/${carWashId}/appointments${query}`)
      .then((result) => {
        if (active) {
          setAgenda(result);
          setWalkInDate((current) => current || result.date);
          setMessage('');
        }
      })
      .catch((error) => {
        if (active) setMessage(errorMessage(error));
      });
    return () => {
      active = false;
    };
  }, [carWashId, catalogRevision, date, refresh]);

  async function consultWalkInAvailability(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const serviceId = String(form.get('serviceId'));
    const targetDate = String(form.get('date'));
    setWalkInMessage('Consultando horários…');
    setWalkInAvailability(null);
    setSelectedWalkInSlot(null);
    try {
      const params = new URLSearchParams({ serviceId, date: targetDate });
      const result = await api<WalkInAvailability>(
        `/api/car-washes/${carWashId}/appointments/walk-in-availability?${params}`,
      );
      setWalkInServiceId(serviceId);
      setWalkInAvailability(result);
      setWalkInMessage(
        result.slots.length ? '' : 'Nenhum horário disponível para encaixe.',
      );
    } catch (error) {
      setWalkInMessage(errorMessage(error));
    }
  }

  async function createWalkIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedWalkInSlot || !walkInAvailability) return;
    const form = new FormData(event.currentTarget);
    setWalkInPending(true);
    setWalkInMessage('');
    try {
      await api(`/api/car-washes/${carWashId}/appointments/walk-ins`, {
        method: 'POST',
        headers: { 'x-csrf-token': csrfToken },
        body: JSON.stringify({
          serviceId: walkInServiceId,
          startsAt: selectedWalkInSlot,
          name: normalizeName(form.get('name')),
          phone: normalizePhone(form.get('phone')),
          plate: normalizePlate(form.get('plate')),
        }),
      });
      setDate(walkInAvailability.date);
      setWalkInAvailability(null);
      setSelectedWalkInSlot(null);
      setWalkInMessage('Encaixe registrado.');
      setRefresh((value) => value + 1);
    } catch (error) {
      setWalkInMessage(errorMessage(error));
    } finally {
      setWalkInPending(false);
    }
  }

  async function updateCustomerVehicle(
    appointmentId: string,
    input: CustomerVehicleInput,
  ) {
    const targetAgendaView = agendaView;
    try {
      await api<Pick<Appointment, 'customer' | 'vehicle'>>(
        `/api/car-washes/${carWashId}/appointments/${appointmentId}/customer-vehicle`,
        {
          method: 'PATCH',
          headers: { 'x-csrf-token': csrfToken },
          body: JSON.stringify(input),
        },
      );
    } catch (error) {
      if (activeAgendaView.current !== targetAgendaView) return false;
      setMessage(errorMessage(error));
      return false;
    }
    if (activeAgendaView.current !== targetAgendaView) return true;
    try {
      const query = date ? `?date=${encodeURIComponent(date)}` : '';
      const refreshed = await api<Agenda>(
        `/api/car-washes/${carWashId}/appointments${query}`,
      );
      if (activeAgendaView.current !== targetAgendaView) return true;
      setAgenda(refreshed);
      setMessage('Dados do atendimento atualizados.');
      return true;
    } catch (error) {
      if (activeAgendaView.current === targetAgendaView) {
        setMessage(
          `Dados do atendimento atualizados, mas a agenda não foi recarregada: ${errorMessage(error)}`,
        );
      }
      return true;
    }
  }

  async function changeStatus(
    appointmentId: string,
    status: NextAppointmentStatus,
    cancellation?: CancellationInput,
  ) {
    const targetAgendaView = agendaView;
    try {
      await api(
        `/api/car-washes/${carWashId}/appointments/${appointmentId}/status`,
        {
          method: 'PATCH',
          headers: { 'x-csrf-token': csrfToken },
          body: JSON.stringify({ status, ...cancellation }),
        },
      );
    } catch (error) {
      if (activeAgendaView.current === targetAgendaView)
        setMessage(errorMessage(error));
      return false;
    }
    onAppointmentStatusChanged?.();
    if (activeAgendaView.current !== targetAgendaView) return true;
    try {
      const query = date ? `?date=${encodeURIComponent(date)}` : '';
      const refreshed = await api<Agenda>(
        `/api/car-washes/${carWashId}/appointments${query}`,
      );
      if (activeAgendaView.current === targetAgendaView) {
        setAgenda(refreshed);
        setMessage(statusMessage(status));
      }
    } catch (error) {
      if (activeAgendaView.current === targetAgendaView) {
        setMessage(
          `${statusMessage(status)} A agenda não foi recarregada: ${errorMessage(error)}`,
        );
      }
    }
    return true;
  }

  async function reschedule(appointmentId: string, input: RescheduleInput) {
    const targetAgendaView = agendaView;
    try {
      await api(
        `/api/car-washes/${carWashId}/appointments/${appointmentId}/reschedule`,
        {
          method: 'PATCH',
          headers: { 'x-csrf-token': csrfToken },
          body: JSON.stringify(input),
        },
      );
    } catch (error) {
      if (activeAgendaView.current === targetAgendaView)
        setMessage(errorMessage(error));
      return false;
    }
    if (activeAgendaView.current !== targetAgendaView) return true;
    try {
      const query = date ? `?date=${encodeURIComponent(date)}` : '';
      const refreshed = await api<Agenda>(
        `/api/car-washes/${carWashId}/appointments${query}`,
      );
      if (activeAgendaView.current === targetAgendaView) {
        setAgenda(refreshed);
        setMessage('Agendamento reagendado.');
      }
    } catch (error) {
      if (activeAgendaView.current === targetAgendaView) {
        setMessage(
          `Agendamento reagendado, mas a agenda não foi recarregada: ${errorMessage(error)}`,
        );
      }
    }
    return true;
  }
  return (
    <section className="panel">
      <h2>Agenda da equipe</h2>
      <label>
        Dia da agenda
        <input
          type="date"
          value={date || agenda?.date || ''}
          onChange={(event) => setDate(event.target.value)}
        />
      </label>
      <button type="button" onClick={() => setRefresh((value) => value + 1)}>
        Atualizar agenda
      </button>
      {message ? <p role="status">{message}</p> : null}
      {agenda ? (
        <>
          <p>Horários da lavação ({agenda.timezone}).</p>
          <section aria-label="Registrar encaixe" className="walk-in-form">
            <h3>Novo encaixe</h3>
            <p>
              A equipe pode usar o primeiro horário disponível sem a
              antecedência exigida no autoagendamento.
            </p>
            <form onSubmit={consultWalkInAvailability}>
              <label>
                Serviço do encaixe
                <select name="serviceId" required defaultValue="">
                  <option value="" disabled>
                    Selecione um serviço
                  </option>
                  {agenda.services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} — {service.durationInMinutes} min
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Data do encaixe
                <input
                  name="date"
                  type="date"
                  required
                  value={walkInDate}
                  onChange={(event) => setWalkInDate(event.target.value)}
                />
              </label>
              <button type="submit">Consultar encaixes</button>
            </form>
            {walkInAvailability?.slots.length ? (
              <div className="slot-list" aria-label="Horários para encaixe">
                {walkInAvailability.slots.map((slot) => (
                  <button
                    key={slot.startsAt}
                    type="button"
                    className="slot"
                    aria-pressed={selectedWalkInSlot === slot.startsAt}
                    onClick={() => setSelectedWalkInSlot(slot.startsAt)}
                  >
                    {formatTime(slot.startsAt, walkInAvailability.timezone)}
                  </button>
                ))}
              </div>
            ) : null}
            {selectedWalkInSlot && walkInAvailability ? (
              <form onSubmit={createWalkIn}>
                <p>
                  Horário escolhido:{' '}
                  {formatTime(selectedWalkInSlot, walkInAvailability.timezone)}
                </p>
                <fieldset disabled={walkInPending}>
                  <label>
                    Nome do cliente do encaixe
                    <input name="name" required maxLength={100} />
                  </label>
                  <label>
                    Telefone do cliente do encaixe
                    <input
                      name="phone"
                      type="tel"
                      required
                      pattern="[0-9 ()+\-]{10,22}"
                      maxLength={22}
                    />
                  </label>
                  <label>
                    Placa do veículo do encaixe
                    <input
                      name="plate"
                      required
                      pattern="[A-Za-z]{3}-?[0-9][A-Za-z0-9][0-9]{2}"
                      maxLength={8}
                    />
                  </label>
                </fieldset>
                <button type="submit" disabled={walkInPending}>
                  {walkInPending ? 'Registrando…' : 'Registrar encaixe'}
                </button>
              </form>
            ) : null}
            {walkInMessage ? <p role="status">{walkInMessage}</p> : null}
          </section>
          <section aria-label="Agenda diária">
            <h3>Atendimentos do dia</h3>
            <AppointmentList
              appointments={agenda.appointments}
              timezone={agenda.timezone}
              onUpdate={updateCustomerVehicle}
              onChangeStatus={changeStatus}
              onReschedule={reschedule}
              carWashId={carWashId}
            />
          </section>
          <section aria-label="Próximos atendimentos">
            <h3>Próximos atendimentos</h3>
            <p>Até 20 reservas confirmadas a partir de agora.</p>
            <AppointmentList
              appointments={agenda.upcoming}
              timezone={agenda.timezone}
              onUpdate={updateCustomerVehicle}
              onChangeStatus={changeStatus}
              onReschedule={reschedule}
              carWashId={carWashId}
            />
          </section>
        </>
      ) : null}
    </section>
  );
}

function AppointmentList({
  appointments,
  timezone,
  onUpdate,
  onChangeStatus,
  onReschedule,
  carWashId,
}: {
  appointments: Appointment[];
  timezone: string;
  onUpdate: (
    appointmentId: string,
    input: CustomerVehicleInput,
  ) => Promise<boolean>;
  onChangeStatus: (
    appointmentId: string,
    status: NextAppointmentStatus,
    cancellation?: CancellationInput,
  ) => Promise<boolean>;
  onReschedule: (
    appointmentId: string,
    input: RescheduleInput,
  ) => Promise<boolean>;
  carWashId: string;
}) {
  const [editingAppointmentId, setEditingAppointmentId] = useState<
    string | null
  >(null);
  if (!appointments.length) return <p>Nenhum atendimento neste período.</p>;
  return (
    <ul className="appointment-list">
      {appointments.map((appointment) => (
        <li key={appointment.id}>
          <strong>{appointment.customer?.name ?? 'Ocupação anterior'}</strong>
          <p>
            {formatDate(appointment.startsAt, timezone)} ·{' '}
            {formatTime(appointment.startsAt, timezone)}–
            {formatTime(appointment.endsAt, timezone)} · {appointment.box.name}
          </p>
          <p>
            {appointment.serviceName} · {appointment.serviceDurationInMinutes}{' '}
            min · {formatMoney(appointment.servicePriceInCents)}
          </p>
          <p>{statusLabel(appointment.status)}</p>
          <AppointmentStatusActions
            appointment={appointment}
            timezone={timezone}
            onChangeStatus={onChangeStatus}
            onReschedule={onReschedule}
            carWashId={carWashId}
          />
          {appointment.statusChangedBy && appointment.statusChangedAt ? (
            <p>
              Última mudança: {appointment.statusChangedBy.user.email} em{' '}
              {formatDate(appointment.statusChangedAt, timezone)} às{' '}
              {formatTime(appointment.statusChangedAt, timezone)}
            </p>
          ) : null}
          {appointment.cancellationRequestedAt ? (
            <p>
              Pedido informado:{' '}
              {formatDate(appointment.cancellationRequestedAt, timezone)} às{' '}
              {formatTime(appointment.cancellationRequestedAt, timezone)}
            </p>
          ) : null}
          {appointment.cancellationReason ? (
            <p>Motivo do cancelamento: {appointment.cancellationReason}</p>
          ) : null}
          {appointment.rescheduleRequestedAt ? (
            <p>
              Pedido de reagendamento:{' '}
              {formatDate(appointment.rescheduleRequestedAt, timezone)} às{' '}
              {formatTime(appointment.rescheduleRequestedAt, timezone)}
            </p>
          ) : null}
          {appointment.rescheduledBy && appointment.rescheduledAt ? (
            <p>
              Reagendado por {appointment.rescheduledBy.user.email} em{' '}
              {formatDate(appointment.rescheduledAt, timezone)} às{' '}
              {formatTime(appointment.rescheduledAt, timezone)}
            </p>
          ) : null}
          {appointment.origin === 'TEAM' ? (
            <p>
              Encaixe da equipe
              {appointment.createdBy
                ? ` · Criado por ${appointment.createdBy.user.email}`
                : ''}
            </p>
          ) : null}
          {appointment.customer ? (
            <p>Telefone informado: {appointment.customer.phone}</p>
          ) : null}
          {appointment.vehicle ? (
            <p>Placa: {appointment.vehicle.plate}</p>
          ) : null}
          {appointment.customer && appointment.vehicle ? (
            editingAppointmentId === appointment.id ? (
              <CustomerVehicleForm
                appointment={appointment}
                onCancel={() => setEditingAppointmentId(null)}
                onSubmit={async (input) => {
                  if (await onUpdate(appointment.id, input))
                    setEditingAppointmentId(null);
                }}
              />
            ) : (
              <button
                type="button"
                className="secondary inline-button"
                onClick={() => setEditingAppointmentId(appointment.id)}
              >
                Corrigir cliente e veículo
              </button>
            )
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function AppointmentStatusActions({
  appointment,
  timezone,
  onChangeStatus,
  onReschedule,
  carWashId,
}: {
  appointment: Appointment;
  timezone: string;
  onChangeStatus: (
    appointmentId: string,
    status: NextAppointmentStatus,
    cancellation?: CancellationInput,
  ) => Promise<boolean>;
  onReschedule: (
    appointmentId: string,
    input: RescheduleInput,
  ) => Promise<boolean>;
  carWashId: string;
}) {
  const [pending, setPending] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const action = (status: NextAppointmentStatus) => async () => {
    setPending(true);
    await onChangeStatus(appointment.id, status);
    setPending(false);
  };
  if (appointment.status === 'CONFIRMED') {
    return (
      <div className="service-actions">
        <button
          type="button"
          disabled={pending}
          onClick={action('IN_PROGRESS')}
        >
          Iniciar atendimento
        </button>
        <button
          type="button"
          className="secondary inline-button"
          disabled={pending}
          onClick={action('NO_SHOW')}
        >
          Marcar falta
        </button>
        <button
          type="button"
          className="secondary inline-button"
          disabled={pending}
          onClick={() => setCancelling(true)}
        >
          Cancelar agendamento
        </button>
        <button
          type="button"
          className="secondary inline-button"
          disabled={pending}
          onClick={() => setRescheduling(true)}
        >
          Reagendar
        </button>
        {cancelling ? (
          <CancellationForm
            pending={pending}
            timezone={timezone}
            onCancel={() => setCancelling(false)}
            onSubmit={async (input) => {
              setPending(true);
              const changed = await onChangeStatus(
                appointment.id,
                'CANCELED',
                input,
              );
              setPending(false);
              if (changed) setCancelling(false);
            }}
          />
        ) : null}
        {rescheduling ? (
          <RescheduleForm
            appointment={appointment}
            carWashId={carWashId}
            timezone={timezone}
            pending={pending}
            onCancel={() => setRescheduling(false)}
            onSubmit={async (input) => {
              setPending(true);
              const changed = await onReschedule(appointment.id, input);
              setPending(false);
              if (changed) setRescheduling(false);
            }}
          />
        ) : null}
      </div>
    );
  }
  if (appointment.status === 'IN_PROGRESS') {
    return (
      <button type="button" disabled={pending} onClick={action('COMPLETED')}>
        Concluir atendimento
      </button>
    );
  }
  return null;
}

function statusLabel(status: string) {
  return (
    {
      CONFIRMED: 'Confirmado',
      IN_PROGRESS: 'Em andamento',
      COMPLETED: 'Concluído',
      CANCELED: 'Cancelado',
      NO_SHOW: 'Falta registrada',
    }[status] ?? status
  );
}

function statusMessage(status: NextAppointmentStatus) {
  return {
    IN_PROGRESS: 'Atendimento iniciado.',
    COMPLETED: 'Atendimento concluído.',
    NO_SHOW: 'Falta registrada.',
    CANCELED: 'Agendamento cancelado.',
  }[status];
}

function RescheduleForm({
  appointment,
  carWashId,
  timezone,
  pending,
  onCancel,
  onSubmit,
}: {
  appointment: Appointment;
  carWashId: string;
  timezone: string;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (input: RescheduleInput) => Promise<void>;
}) {
  const [date, setDate] = useState(
    localDateInput(appointment.startsAt, timezone),
  );
  const [requestedAt, setRequestedAt] = useState('');
  const [availability, setAvailability] = useState<WalkInAvailability | null>(
    null,
  );
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  async function consult() {
    setAvailability(null);
    setSelectedSlot(null);
    setMessage('Consultando horários…');
    try {
      const params = new URLSearchParams({ date });
      const result = await api<WalkInAvailability>(
        `/api/car-washes/${carWashId}/appointments/${appointment.id}/reschedule-availability?${params}`,
      );
      setAvailability(result);
      setMessage(
        result.slots.length ? '' : 'Nenhum horário disponível para reagendar.',
      );
    } catch (error) {
      setMessage(errorMessage(error));
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedSlot || !requestedAt) return;
    await onSubmit({
      startsAt: selectedSlot,
      requestedAt: localDateTimeToInstant(requestedAt, timezone),
    });
  }

  return (
    <form className="appointment-editor" onSubmit={submit}>
      <label>
        Data do reagendamento
        <input
          name="rescheduleDate"
          type="date"
          required
          value={date}
          disabled={pending}
          onChange={(event) => setDate(event.target.value)}
        />
      </label>
      <label>
        Horário informado do pedido de reagendamento
        <input
          name="rescheduleRequestedAt"
          type="datetime-local"
          required
          value={requestedAt}
          disabled={pending}
          onChange={(event) => setRequestedAt(event.target.value)}
        />
      </label>
      <button type="button" disabled={pending} onClick={() => void consult()}>
        Consultar horários para reagendar
      </button>
      {availability?.slots.length ? (
        <div className="slot-list" aria-label="Horários para reagendamento">
          {availability.slots.map((slot) => (
            <button
              key={slot.startsAt}
              type="button"
              className="slot"
              aria-pressed={selectedSlot === slot.startsAt}
              disabled={pending}
              onClick={() => setSelectedSlot(slot.startsAt)}
            >
              {formatTime(slot.startsAt, availability.timezone)}
            </button>
          ))}
        </div>
      ) : null}
      {selectedSlot && availability ? (
        <p>
          Novo horário escolhido:{' '}
          {formatTime(selectedSlot, availability.timezone)}
        </p>
      ) : null}
      <div className="service-actions">
        <button
          type="submit"
          disabled={pending || !selectedSlot || !requestedAt}
        >
          {pending ? 'Reagendando…' : 'Confirmar reagendamento'}
        </button>
        <button
          type="button"
          className="secondary inline-button"
          disabled={pending}
          onClick={onCancel}
        >
          Voltar
        </button>
      </div>
      {message ? <p role="status">{message}</p> : null}
    </form>
  );
}

function localDateInput(instant: string, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(instant));
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}

function CancellationForm({
  pending,
  timezone,
  onCancel,
  onSubmit,
}: {
  pending: boolean;
  timezone: string;
  onCancel: () => void;
  onSubmit: (input: CancellationInput) => Promise<void>;
}) {
  const [requestedAt, setRequestedAt] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await onSubmit({
      requestedAt: requestedAt
        ? localDateTimeToInstant(requestedAt, timezone)
        : undefined,
      reason: requestedAt
        ? undefined
        : String(form.get('reason') || '').trim() || undefined,
    });
  }

  return (
    <form className="appointment-editor" onSubmit={submit}>
      <label>
        Horário informado do pedido (opcional)
        <input
          name="requestedAt"
          type="datetime-local"
          value={requestedAt}
          onChange={(event) => setRequestedAt(event.target.value)}
        />
      </label>
      <p>
        Informe o horário enviado pelo cliente para aplicar o prazo. Deixe em
        branco para registrar uma exceção da equipe.
      </p>
      <label>
        Motivo da exceção (opcional)
        <input name="reason" maxLength={500} disabled={Boolean(requestedAt)} />
      </label>
      <div className="service-actions">
        <button type="submit" disabled={pending}>
          {pending ? 'Cancelando…' : 'Confirmar cancelamento'}
        </button>
        <button
          type="button"
          className="secondary inline-button"
          disabled={pending}
          onClick={onCancel}
        >
          Voltar
        </button>
      </div>
    </form>
  );
}

function localDateTimeToInstant(value: string, timezone: string) {
  const [date, time] = value.split('T');
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const localAsUtc = Date.UTC(year, month - 1, day, hour, minute);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(localAsUtc));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((candidate) => candidate.type === type)?.value);
  const offset =
    Date.UTC(
      part('year'),
      part('month') - 1,
      part('day'),
      part('hour'),
      part('minute'),
    ) - localAsUtc;
  return new Date(localAsUtc - offset).toISOString();
}

function CustomerVehicleForm({
  appointment,
  onCancel,
  onSubmit,
}: {
  appointment: Appointment;
  onCancel: () => void;
  onSubmit: (input: CustomerVehicleInput) => Promise<void>;
}) {
  const [pending, setPending] = useState(false);
  if (!appointment.customer || !appointment.vehicle) return null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    await onSubmit({
      name: normalizeName(form.get('name')),
      phone: normalizePhone(form.get('phone')),
      plate: normalizePlate(form.get('plate')),
    });
    setPending(false);
  }

  return (
    <form className="appointment-editor" onSubmit={submit}>
      <fieldset disabled={pending}>
        <label>
          Nome do cliente
          <input
            name="name"
            defaultValue={appointment.customer.name}
            maxLength={100}
            pattern=".*\S.*"
            required
          />
        </label>
        <label>
          Telefone do cliente
          <input
            name="phone"
            type="tel"
            defaultValue={appointment.customer.phone}
            pattern="[0-9 ()+\-]{10,22}"
            maxLength={22}
            required
          />
        </label>
        <label>
          Placa do veículo
          <input
            name="plate"
            defaultValue={appointment.vehicle.plate}
            maxLength={8}
            pattern="[A-Za-z]{3}-?[0-9][A-Za-z0-9][0-9]{2}"
            required
          />
        </label>
      </fieldset>
      <div className="service-actions">
        <button type="submit" disabled={pending}>
          {pending ? 'Salvando…' : 'Salvar dados do atendimento'}
        </button>
        <button
          type="button"
          className="secondary inline-button"
          disabled={pending}
          onClick={onCancel}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

function formatDate(instant: string, timezone: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: timezone,
    dateStyle: 'short',
  }).format(new Date(instant));
}

function whatsappLink(receipt: Receipt, operationalContactPhone: string) {
  const message = [
    `Olá! Tenho uma reserva confirmada na ${receipt.carWashName}.`,
    `Serviço: ${receipt.serviceName}`,
    `Data e horário: ${formatDate(receipt.startsAt, receipt.timezone)} às ${formatTime(receipt.startsAt, receipt.timezone)}`,
    `Referência: ${receipt.id}`,
    'Gostaria de falar com a equipe sobre essa reserva.',
  ].join('\n');
  return `https://wa.me/${operationalContactPhone}?text=${encodeURIComponent(message)}`;
}
