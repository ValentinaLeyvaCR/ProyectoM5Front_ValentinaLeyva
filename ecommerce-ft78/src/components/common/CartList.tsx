import type { CartAction } from "../../contexts/cart/CartContext.types";
import type { CartItem } from "../../types/cartItem.types";
import { formatPrice } from "../../services/demoStore";

export function CartList({ items, dispatch }: { items: CartItem[]; dispatch: (action: CartAction) => void }) {
  return (
    <div className="cart-items">
      {items.map(({ product, quantity }) => (
        <article className="cart-item" key={product.id}>
          <img src={product.imageUrl} alt={product.name} />
          <div className="cart-item__details">
            <strong>{product.name}</strong>
            <span>{formatPrice(product.price)}</span>
            <div className="quantity-control">
              <button type="button" aria-label={`Disminuir ${product.name}`} onClick={() => dispatch({ type: "setQuantity", productId: product.id, quantity: quantity - 1 })}>−</button>
              <span>{quantity}</span>
              <button type="button" aria-label={`Aumentar ${product.name}`} onClick={() => dispatch({ type: "setQuantity", productId: product.id, quantity: quantity + 1 })}>+</button>
            </div>
          </div>
          <button className="cart-item__remove" type="button" aria-label={`Eliminar ${product.name}`} onClick={() => dispatch({ type: "remove", productId: product.id })}>Eliminar</button>
        </article>
      ))}
    </div>
  );
}
