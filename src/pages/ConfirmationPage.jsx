import { Link, useLocation, useParams } from 'react-router-dom';
import StateView from '../components/ui/StateView';
import { useServices } from '../context/ServicesContext';
import { useAsync } from '../hooks/useAsync';
import { formatMoney } from '../utils/format';

export default function ConfirmationPage() {
  const { orderId } = useParams();
  const { orders } = useServices();
  const fromState = useLocation().state?.order;
  const { data, loading, error } = useAsync(
    async () => fromState ?? (await orders.list()).find((o) => String(o.id) === orderId),
    [orderId],
  );

  return (
    <StateView loading={loading} error={error} empty={!data} emptyText="No encontramos el pedido.">
      {data && (
        <div className="confirm">
          <div className="confirm__art" aria-hidden="true">🛵💨</div>
          <h1>¡Pedido realizado con éxito!</h1>
          <p className="muted">Pedido #{data.id} · {data.restaurantName}</p>
          <p>Total: <strong>{formatMoney(data.total)}</strong></p>
          <p className="donation">💚 Gracias, donaste {formatMoney(data.donation)} al World Food Programme.</p>
          <Link to="/orders" className="btn btn--primary">Ver mis pedidos</Link>{' '}
          <Link to="/home" className="btn btn--secondary">Seguir explorando</Link>
        </div>
      )}
    </StateView>
  );
}
