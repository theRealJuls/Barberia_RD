import { useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabase";

const money = new Intl.NumberFormat("es-DO", {
  style: "currency",
  currency: "DOP",
});

const emptyService = {
  id: "",
  nombre: "",
  descripcion: "",
  precio: "",
  duracion_minutos: "",
  activo: true,
};

const emptyPayment = {
  cliente_nombre: "",
  servicio_id: "",
  monto: "",
  recibido_por: "",
  notas: "",
};

export default function App() {
  const [services, setServices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [serviceForm, setServiceForm] = useState(emptyService);
  const [paymentForm, setPaymentForm] = useState(emptyPayment);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadDashboardData();
  }, []);

  const activeServices = useMemo(
    () => services.filter((service) => service.activo),
    [services],
  );

  const selectedPaymentService = activeServices.find(
    (service) => service.id === paymentForm.servicio_id,
  );

  const metrics = useMemo(() => {
    const income = payments.reduce((total, payment) => total + Number(payment.monto), 0);
    return {
      activeServices: activeServices.length,
      payments: payments.length,
      income,
      average: payments.length ? income / payments.length : 0,
    };
  }, [activeServices.length, payments]);

  async function loadDashboardData() {
    setLoading(true);
    setMessage("");

    const [servicesResult, paymentsResult] = await Promise.all([
      supabase.from("servicios").select("*").order("nombre", { ascending: true }),
      supabase
        .from("pagos_efectivo")
        .select("*, servicios(nombre)")
        .order("fecha_pago", { ascending: false }),
    ]);

    if (servicesResult.error || paymentsResult.error) {
      setMessage("No se pudieron cargar los datos desde Supabase.");
    } else {
      setServices(servicesResult.data ?? []);
      setPayments(paymentsResult.data ?? []);
    }

    setLoading(false);
  }

  function updateServiceField(field, value) {
    setServiceForm((current) => ({ ...current, [field]: value }));
  }

  function updatePaymentField(field, value) {
    setPaymentForm((current) => ({ ...current, [field]: value }));
  }

  async function handleServiceSubmit(event) {
    event.preventDefault();
    setMessage("");

    const servicePayload = {
      nombre: serviceForm.nombre.trim(),
      descripcion: serviceForm.descripcion.trim(),
      precio: Number(serviceForm.precio),
      duracion_minutos: Number(serviceForm.duracion_minutos),
      activo: serviceForm.activo,
    };

    if (!servicePayload.nombre || servicePayload.precio <= 0 || servicePayload.duracion_minutos <= 0) {
      return;
    }

    const request = serviceForm.id
      ? supabase.from("servicios").update(servicePayload).eq("id", serviceForm.id)
      : supabase.from("servicios").insert(servicePayload);

    const { error } = await request;

    if (error) {
      setMessage("No se pudo guardar el servicio.");
      return;
    }

    setServiceForm(emptyService);
    await loadDashboardData();
  }

  function handleEditService(service) {
    setServiceForm({
      id: service.id,
      nombre: service.nombre,
      descripcion: service.descripcion || "",
      precio: service.precio,
      duracion_minutos: service.duracion_minutos,
      activo: service.activo,
    });
    document.querySelector("#service-name")?.focus();
  }

  async function handleDeleteService(serviceId) {
    setMessage("");

    const hasPayments = payments.some((payment) => payment.servicio_id === serviceId);
    if (hasPayments) {
      setMessage("No se puede eliminar un servicio con pagos registrados. Marcalo como inactivo.");
      return;
    }

    const { error } = await supabase.from("servicios").delete().eq("id", serviceId);

    if (error) {
      setMessage("No se pudo eliminar el servicio.");
      return;
    }

    await loadDashboardData();
  }

  async function handlePaymentSubmit(event) {
    event.preventDefault();
    setMessage("");

    if (!selectedPaymentService) return;

    const paymentPayload = {
      servicio_id: selectedPaymentService.id,
      cliente_nombre: paymentForm.cliente_nombre.trim(),
      monto: Number(paymentForm.monto),
      recibido_por: paymentForm.recibido_por.trim(),
      referencia: `EFE-${Date.now().toString().slice(-8)}`,
      comprobante: `COMP-${Date.now().toString().slice(-8)}`,
      metodo_pago: "efectivo",
      estado_pago: "pagado",
      notas: paymentForm.notas.trim(),
    };

    if (!paymentPayload.cliente_nombre || !paymentPayload.recibido_por || paymentPayload.monto <= 0) {
      return;
    }

    const { error } = await supabase.from("pagos_efectivo").insert(paymentPayload);

    if (error) {
      setMessage("No se pudo registrar el pago en efectivo.");
      return;
    }

    setPaymentForm(emptyPayment);
    await loadDashboardData();
  }

  function handlePaymentServiceChange(serviceId) {
    const service = activeServices.find((item) => item.id === serviceId);
    setPaymentForm((current) => ({
      ...current,
      servicio_id: serviceId,
      monto: service ? String(service.precio) : "",
    }));
  }

  return (
    <>
      <aside className="sidebar">
        <div>
          <p className="eyebrow">Barberia RD</p>
          <h1>Servicios y pagos</h1>
        </div>
        <nav aria-label="Secciones administrativas">
          <a href="#dashboard">Dashboard</a>
          <a href="#servicios">Servicios</a>
          <a href="#pagos">Pagos en efectivo</a>
        </nav>
      </aside>

      <main>
        {message && <p className="notice">{message}</p>}
        {loading && <p className="notice">Cargando datos desde Supabase...</p>}

        <Dashboard metrics={metrics} />

        <section id="servicios" className="section-band">
          <div className="section-heading">
            <p className="eyebrow">CRUD</p>
            <h2>Servicios y precios</h2>
          </div>

          <form className="admin-form" onSubmit={handleServiceSubmit}>
            <label>
              Servicio
              <input
                id="service-name"
                type="text"
                placeholder="Corte clasico"
                required
                maxLength="80"
                value={serviceForm.nombre}
                onChange={(event) => updateServiceField("nombre", event.target.value)}
              />
            </label>
            <label>
              Precio RD$
              <input
                type="number"
                min="1"
                step="0.01"
                placeholder="500"
                required
                value={serviceForm.precio}
                onChange={(event) => updateServiceField("precio", event.target.value)}
              />
            </label>
            <label>
              Duracion
              <input
                type="number"
                min="5"
                step="5"
                placeholder="30"
                required
                value={serviceForm.duracion_minutos}
                onChange={(event) => updateServiceField("duracion_minutos", event.target.value)}
              />
            </label>
            <label className="wide">
              Descripcion
              <input
                type="text"
                placeholder="Detalle del servicio"
                maxLength="160"
                value={serviceForm.descripcion}
                onChange={(event) => updateServiceField("descripcion", event.target.value)}
              />
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={serviceForm.activo}
                onChange={(event) => updateServiceField("activo", event.target.checked)}
              />
              Activo
            </label>
            <div className="actions">
              <button type="submit">Guardar servicio</button>
              <button type="button" className="secondary" onClick={() => setServiceForm(emptyService)}>
                Limpiar
              </button>
            </div>
          </form>

          <ServicesTable
            services={services}
            onEdit={handleEditService}
            onDelete={handleDeleteService}
          />
        </section>

        <section id="pagos" className="section-band">
          <div className="section-heading">
            <p className="eyebrow">Caja</p>
            <h2>Registro de pagos en efectivo</h2>
          </div>

          <form className="admin-form" onSubmit={handlePaymentSubmit}>
            <label>
              Cliente
              <input
                type="text"
                placeholder="Nombre del cliente"
                required
                maxLength="100"
                value={paymentForm.cliente_nombre}
                onChange={(event) => updatePaymentField("cliente_nombre", event.target.value)}
              />
            </label>
            <label>
              Servicio
              <select
                required
                value={paymentForm.servicio_id}
                onChange={(event) => handlePaymentServiceChange(event.target.value)}
              >
                <option value="">Seleccionar</option>
                {activeServices.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Monto recibido
              <input
                type="number"
                min="1"
                step="0.01"
                required
                value={paymentForm.monto}
                onChange={(event) => updatePaymentField("monto", event.target.value)}
              />
            </label>
            <label>
              Recibido por
              <input
                type="text"
                placeholder="Nombre del cajero"
                required
                maxLength="100"
                value={paymentForm.recibido_por}
                onChange={(event) => updatePaymentField("recibido_por", event.target.value)}
              />
            </label>
            <label className="wide">
              Notas
              <input
                type="text"
                placeholder="Opcional"
                maxLength="160"
                value={paymentForm.notas}
                onChange={(event) => updatePaymentField("notas", event.target.value)}
              />
            </label>
            <div className="actions">
              <button type="submit">Registrar pago</button>
            </div>
          </form>

          <PaymentsTable payments={payments} />
        </section>
      </main>
    </>
  );
}

function Dashboard({ metrics }) {
  return (
    <section id="dashboard" className="section-band">
      <div className="section-heading">
        <p className="eyebrow">Panel administrativo</p>
        <h2>Resumen operativo</h2>
      </div>
      <div className="metrics" aria-label="Metricas administrativas">
        <Metric label="Servicios activos" value={metrics.activeServices} />
        <Metric label="Pagos registrados" value={metrics.payments} />
        <Metric label="Ingresos en efectivo" value={money.format(metrics.income)} />
        <Metric label="Ticket promedio" value={money.format(metrics.average)} />
      </div>
    </section>
  );
}

function Metric({ label, value }) {
  return (
    <article>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function ServicesTable({ services, onEdit, onDelete }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Servicio</th>
            <th>Precio</th>
            <th>Duracion</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {services.length === 0 ? (
            <tr>
              <td className="empty" colSpan="5">
                No hay servicios registrados.
              </td>
            </tr>
          ) : (
            services.map((service) => (
              <tr key={service.id}>
                <td>
                  <strong>{service.nombre}</strong>
                  <br />
                  <span>{service.descripcion || "Sin descripcion"}</span>
                </td>
                <td>{money.format(service.precio)}</td>
                <td>{service.duracion_minutos} min</td>
                <td>
                  <span className={`pill ${service.activo ? "" : "off"}`}>
                    {service.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td>
                  <div className="row-actions">
                    <button type="button" className="secondary" onClick={() => onEdit(service)}>
                      Editar
                    </button>
                    <button type="button" className="danger" onClick={() => onDelete(service.id)}>
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function PaymentsTable({ payments }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Referencia</th>
            <th>Comprobante</th>
            <th>Cliente</th>
            <th>Servicio</th>
            <th>Monto</th>
            <th>Estado</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          {payments.length === 0 ? (
            <tr>
              <td className="empty" colSpan="7">
                No hay pagos en efectivo registrados.
              </td>
            </tr>
          ) : (
            payments.map((payment) => (
              <tr key={payment.id}>
                <td>{payment.referencia}</td>
                <td>{payment.comprobante}</td>
                <td>{payment.cliente_nombre}</td>
                <td>{payment.servicios?.nombre || "Servicio no disponible"}</td>
                <td>{money.format(payment.monto)}</td>
                <td>
                  <span className="pill">{payment.estado_pago}</span>
                </td>
                <td>{new Date(payment.fecha_pago).toLocaleString("es-DO")}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
