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
  customer: { name: string; phone: string } | null;
  vehicle: { plate: string } | null;
  box: { name: string };
};
type Agenda = {
  date: string;
  timezone: string;
  appointments: Appointment[];
  upcoming: Appointment[];
};

export function TeamAgenda({
  carWashId,
  csrfToken,
}: {
  carWashId: string;
  csrfToken: string;
}) {
  const [date, setDate] = useState('');
  const [agenda, setAgenda] = useState<Agenda | null>(null);
  const [message, setMessage] = useState('');
  const [refresh, setRefresh] = useState(0);
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
          setMessage('');
        }
      })
      .catch((error) => {
        if (active) setMessage(errorMessage(error));
      });
    return () => {
      active = false;
    };
  }, [carWashId, date, refresh]);

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
          <section aria-label="Agenda diária">
            <h3>Atendimentos do dia</h3>
            <AppointmentList
              appointments={agenda.appointments}
              timezone={agenda.timezone}
              onUpdate={updateCustomerVehicle}
            />
          </section>
          <section aria-label="Próximos atendimentos">
            <h3>Próximos atendimentos</h3>
            <p>Até 20 reservas confirmadas a partir de agora.</p>
            <AppointmentList
              appointments={agenda.upcoming}
              timezone={agenda.timezone}
              onUpdate={updateCustomerVehicle}
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
}: {
  appointments: Appointment[];
  timezone: string;
  onUpdate: (
    appointmentId: string,
    input: CustomerVehicleInput,
  ) => Promise<boolean>;
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
          <p>
            {appointment.status === 'CONFIRMED'
              ? 'Confirmado'
              : appointment.status}
          </p>
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
