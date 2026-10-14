
export function ProductList() {
  const products = [
    {
      id: 1,
      image:
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80",
      description: "Camiseta SpiderShop clásica",
      price: 59900,
      stock: 18,
    },
    {
      id: 2,
      image:
        "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80",
      description: "Mochila urbana azul",
      price: 129900,
      stock: 7,
    },
    {
      id: 3,
      image:
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80",
      description: "Tenis deportivos rojos",
      price: 189900,
      stock: 12,
    },
    {
      id: 4,
      image:
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
      description: "Audífonos inalámbricos",
      price: 149900,
      stock: 5,
    },
    {
      id: 5,
      image:
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80",
      description: "Reloj casual de pulsera",
      price: 99900,
      stock: 9,
    },
    {
      id: 6,
      image:
        "https://images.unsplash.com/photo-1588850561407-ed78c8bfc6df?auto=format&fit=crop&w=600&q=80",
      description: "Gorra urbana azul marino",
      price: 45900,
      stock: 21,
    },
  ];
  return (
    <main className="products">
      <div className="products__grid">
        {products.map((product) => (
          <article className="product-card" key={product.id}>
            <button
              className="product-card__favorite"
              type="button"
              aria-label={`Agregar ${product.description} a favoritos`}
              onClick={() => window.confirm("¿Agregar a favoritos?")}
            >
              ♥
            </button>

            <img
              src={product.image}
              alt={product.description}
              className="product-card__image"
            />

            <div className="product-card__details">
              <h2>{product.description}</h2>

              <p className="product-card__price">
                {product.price.toLocaleString("es-CO", {
                  style: "currency",
                  currency: "COP",
                  maximumFractionDigits: 0,
                })}
              </p>

              <p className="product-card__stock">
                Stock: {product.stock}
              </p>

              <button
                className="product-card__add"
                type="button"
                onClick={() => window.confirm("¿Agregar al carrito?")}
              >
                Agregar al carrito
              </button>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}