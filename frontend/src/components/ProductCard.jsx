import React from 'react';

export default function ProductCard({ product, onSelect }) {
  const isNearby = product.jarak_km !== null && product.jarak_km <= 5.0;

  return (
    <div className="card product-card">
      <div className="product-img-wrapper">
        <img
          src={product.foto || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80'}
          alt={product.nama_produk}
          className="product-img"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80';
          }}
        />

        {product.jarak_km !== null && (
          <div className={`distance-badge ${isNearby ? 'nearby' : ''}`}>
            <span>📍 {product.jarak_km} km</span>
            {isNearby && <span style={{ fontSize: '10px' }}>(Terdekat)</span>}
          </div>
        )}

        <div className="category-badge">
          {product.kategori}
        </div>
      </div>

      <div className="product-body">
        <h3 className="product-title">{product.nama_produk}</h3>

        <div className="product-shop">
          <span>🏪</span>
          <strong>{product.seller?.nama_toko || product.seller?.name || 'Lapak Pangan'}</strong>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <span className="product-min-badge">
            {product.minimum_pembelian > 1 ? `Min. Beli ${product.minimum_pembelian} (Grosir)` : 'Eceran (Min 1)'}
          </span>
          <span className="product-min-badge" style={{ background: '#f0fdf4', color: '#166534' }}>
            Stok: {product.stok}
          </span>
        </div>

        <div className="product-price-row">
          <div>
            <div className="product-unit">Harga per satuan</div>
            <div className="product-price">
              Rp {Number(product.harga).toLocaleString('id-ID')}
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => onSelect(product)}
          >
            Pesan
          </button>
        </div>
      </div>
    </div>
  );
}
