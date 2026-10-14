import type { Product } from "../../types/product.types";
import { formatPrice } from "../../services/demoStore";

interface ProductListProps {
  products: Product[];
  onAdd: (product: Product) => void;
  onSelect: (product: Product) => void;
}

export function ProductList({ products, onAdd, onSelect }: ProductListProps) {
  return (
    <div className="products__grid">
      {products.map((product) => (
        <article className="product-card" key={product.id}>
          <button className="product-card__image-button" type="button" onClick={() => onSelect(product)} aria-label={`Ver ${product.name}`}>
            <img src={product.imageUrl} alt={product.name} className="product-card__image" loading="lazy" />
          </button>
          <div className="product-card__details">
            <p className="product-card__category">{product.category}</p>
            <h2>{product.name}</h2>
            <p className="product-card__price">{formatPrice(product.price)}</p>
            <p className="product-card__stock">Stock: {product.stock}</p>
            <button className="product-card__add" type="button" disabled={product.stock < 1} onClick={() => onAdd(product)}>
              Agregar al carrito
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
