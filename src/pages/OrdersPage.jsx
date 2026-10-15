import { useState } from 'react';
import Button from '../components/ui/Button';
import StateView from '../components/ui/StateView';
import { useServices } from '../context/ServicesContext';
import { useAsync } from '../hooks/useAsync';
import { formatDate, formatMoney } from '../utils/format';

export default function OrdersPage() {
  const { orders, donations } = useServices();
  const [open, setOpen] = useState(null);
  const list = useAsync(() => orders.list(), []);
  const summary = useAsync(() => donations.getSummary(), []);

  return (
    <>
      <h2>Historial de pedidos</h2>
      {summary.data && <div className="donation">💚 Tu contribución total al World Food Programme: <strong>{formatMoney(summary.data.total)}</strong></div>}
      <StateView loading={list.loading} error={list.error} empty={list.data?.length === 0} emptyText="Todavía no tienes pedidos.">
        <ul className="list">
          {list.data?.map((o) => (
            <li key={o.id} className="list__item list__item--col">
              <div className="row row--between full">
                <div><strong>{o.restaurantName}</strong><div className="muted">{formatDate(o.createdAt)}</div></div>
                <div className="right"><strong>{formatMoney(o.total)}</strong><div><Button variant="secondary" onClick={() => setOpen(open === o.id ? null : o.id)}>{open === o.id ? 'Ocultar' : 'Ver detalle'}</Button></div></div>
              </div>
              {open === o.id && (
                <ul className="detail">
                  {o.items.map((i, idx) => <li key={idx}>{i.quantity} × {i.name} — {formatMoney(i.unitPrice * i.quantity)}</li>)}
                  <li className="muted">Donación WFP: {formatMoney(o.donation)}</li>
                </ul>
              )}
            </li>
          ))}
        </ul>
      </StateView>
    </>
  );
}
