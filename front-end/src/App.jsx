import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "./lib/api";

const money = new Intl.NumberFormat("es-DO", {
  style: "currency",
  currency: "DOP",
});

function mapServiceFromApi(s) {
  return {
    id: s.id,
    nombre: s.name,
    descripcion: s.description ?? "",
    precio: s.base_price,
    duracion_minutos: s.base_duration_minutes,
    activo: s.is_active,
  };
}

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

    try {
      const [servicesData, paymentsData] = await Promise.all([
        apiRequest("/api/services"),
        apiRequest("/api/payments"),
      ]);
      setServices((servicesData ?? []).map(mapServiceFromApi));
      setPayments(paymentsData ?? []);
    } catch (error) {
      setMessage(error.message || "No se pudieron cargar los datos del servidor.");
    } finally {
      setLoading(false);
    }
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

    const nombre = serviceForm.nombre.trim();
    const precio = Number(serviceForm.precio);
    const duracion = Number(serviceForm.duracion_minutos);

    if (!nombre || precio <= 0 || duracion <= 0) {
      return;
    }

    const payload = {
      name: nombre,
      description: serviceForm.descripcion.trim(),
      base_price: precio,
      base_duration_minutes: duracion,
      is_active: serviceForm.activo,
    };

    try {
      if (serviceForm.id) {
        await apiRequest("/api/services/" + serviceForm.id, { method: "PATCH", body: payload });
      } else {
        await apiRequest("/api/services", { method: "POST", body: payload });
      }
      setServiceForm(emptyService);
      await loadDashboardData();
    } catch (error) {
      setMessage(error.message || "No se pudo guardar el servicio.");
    }
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
    try {
      await apiRequest("/api/services/" + serviceId, { method: "DELETE" });
      await loadDashboardData();
    } catch (error) {
      setMessage(error.message || "No se pudo eliminar el servicio.");
    }
  }

  async function handlePaymentSubmit(event) {
    event.preventDefault();
    setMessage("El registro de pagos estará disponible cuando exista el módulo de citas.");
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
        <div className="brand">
          <span className="brand-badge">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.12 15.88"/><path d="M14.47 14.48 20 20"/><path d="M8.12 8.12 12 12"/></svg>
          </span>
          <span className="brand-name">Trimio</span>
        </div>
        <nav aria-label="Secciones administrativas">
          <a className="nav-link active" href="#dashboard">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
            <span>Dashboard</span>
          </a>
          <a className="nav-link" href="#servicios">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.12 15.88"/><path d="M14.47 14.48 20 20"/><path d="M8.12 8.12 12 12"/></svg>
            <span>Servicios</span>
          </a>
          <a className="nav-link" href="#pagos">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
            <span>Pagos en efectivo</span>
          </a>
        </nav>
      </aside>

      <main>
        <header className="topbar">
          <div>
            <p className="eyebrow">Panel</p>
            <h1>Servicios y pagos</h1>
          </div>
          <span className="topbar-tag">Administrador</span>
        </header>
        <div className="content">
          {message && <p className="notice">{message}</p>}
          {loading && <p className="notice">Cargando datos...</p>}

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
            <p className="eyebrow" style={{ color: "#a3a3a3" }}>Próximamente — requiere el módulo de citas</p>
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
              <button type="submit" disabled>Registrar pago</button>
            </div>
          </form>

          <PaymentsTable payments={payments} />
        </section>
        </div>
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
        <Metric
          label="Servicios activos"
          value={metrics.activeServices}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.12 15.88"/><path d="M14.47 14.48 20 20"/><path d="M8.12 8.12 12 12"/></svg>}
        />
        <Metric
          label="Pagos registrados"
          value={metrics.payments}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5v-11"/></svg>}
        />
        <Metric
          label="Ingresos en efectivo"
          value={money.format(metrics.income)}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
        />
        <Metric
          label="Ticket promedio"
          value={money.format(metrics.average)}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="m19 9-5 5-4-4-3 3"/></svg>}
        />
      </div>
    </section>
  );
}

function Metric({ label, value, icon }) {
  return (
    <article>
      <div className="metric-icon">{icon}</div>
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
