import { FormEvent, useEffect, useRef, useState } from 'react';
import { ApiError, api, errorMessage, formatMoney, formatTime } from './api';

type Receipt = {
  id: string;
  carWashName: string;
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
        name: String(form.get('name')).trim(),
        phone: String(form.get('phone')).replace(/\D/g, ''),
        plate: String(form.get('plate')).toUpperCase().replace(/[-\s]/g, ''),
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
  if (receipt)
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
          confere o pedido e registra a alteração.
        </p>
      </section>
    );
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

export function TeamAgenda({ carWashId }: { carWashId: string }) {
  const [date, setDate] = useState('');
  const [agenda, setAgenda] = useState<Agenda | null>(null);
  const [message, setMessage] = useState('');
  const [refresh, setRefresh] = useState(0);
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
            />
          </section>
          <section aria-label="Próximos atendimentos">
            <h3>Próximos atendimentos</h3>
            <p>Até 20 reservas confirmadas a partir de agora.</p>
            <AppointmentList
              appointments={agenda.upcoming}
              timezone={agenda.timezone}
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
}: {
  appointments: Appointment[];
  timezone: string;
}) {
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
        </li>
      ))}
    </ul>
  );
}
function formatDate(instant: string, timezone: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: timezone,
    dateStyle: 'short',
  }).format(new Date(instant));
}
