import React, { useState, useEffect } from 'react';
import api from '../api';
import ProductCard from '../components/ProductCard';

export default function CatalogPage({ currentLocation, onSelectProduct }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [radiusFilter, setRadiusFilter] = useState(''); // Empty = all distance

  const categories = [
    'Semua',
    'Beras & Biji-bijian',
    'Sayuran',
    'Buah-buahan',
    'Daging & Telur',
    'Bumbu & Rempah',
  ];

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (keyword.trim()) params.keyword = keyword.trim();
      if (selectedCategory !== 'Semua') params.category = selectedCategory;
      if (currentLocation.lat && currentLocation.lng) {
        params.lat = currentLocation.lat;
        params.lng = currentLocation.lng;
      }
      if (radiusFilter) {
        params.radius = radiusFilter;
      }

      const res = await api.get('/products', { params });
      setProducts(res.data.data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, radiusFilter, currentLocation]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  return (
    <div>
      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #064e3b 0%, #047857 100%)',
        color: 'white',
        borderRadius: '16px',
        padding: '32px 28px',
        marginBottom: '28px',
        boxShadow: '0 10px 25px -5px rgba(6, 78, 59, 0.3)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ maxWidth: '640px', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', marginBottom: '12px', letterSpacing: '0.5px' }}>
            🌱 KAMPUS UPI DI CIBIRU — PANGAN LOKAL BERKELANJUTAN
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', lineHeight: '1.25', marginBottom: '10px' }}>
            Bahan Pangan Segar Langsung dari Petani Lokal Terdekat
          </h1>
          <p style={{ fontSize: '14px', opacity: 0.9, lineHeight: '1.5' }}>
            Mendukung petani lokal, menjamin ketersediaan pangan bergizi eceran & grosir, serta sistem pembayaran aman dengan penahanan dana (escrow).
          </p>
        </div>
      </div>

      {/* Filter & Search Bar Controls (UC-03, UC-04) */}
      <div className="card" style={{ marginBottom: '24px', padding: '18px 20px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <div style={{ flex: '1 1 280px', position: 'relative' }}>
            <input
              type="text"
              className="form-control"
              placeholder="🔍 Cari nama bahan pangan (contoh: beras, cabai, telur)..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>

          <div style={{ width: '180px' }}>
            <select
              className="form-control"
              value={radiusFilter}
              onChange={(e) => setRadiusFilter(e.target.value)}
              title="Filter Jarak Terdekat (UC-03)"
            >
              <option value="">Semua Jarak</option>
              <option value="5">Radius &le; 5 km (Terdekat)</option>
              <option value="10">Radius &le; 10 km</option>
              <option value="25">Radius &le; 25 km</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary">
            Cari Produk
          </button>
        </form>

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`chip-btn ${selectedCategory === cat ? 'active-role' : ''}`}
              style={{ fontSize: '12.5px', padding: '6px 14px', borderRadius: '20px' }}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Hasil Produk */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>⏳</div>
          <p>Memuat katalog produk pangan terdekat...</p>
        </div>
      ) : products.length === 0 ? (
        /* Exception Flow UC-04: Produk Tidak Ditemukan */
        <div className="card" style={{ textAlign: 'center', padding: '48px 20px' }}>
          <div style={{ fontSize: '42px', marginBottom: '12px' }}>🌾❌</div>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
            Produk tidak ditemukan
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '420px', margin: '0 auto 16px' }}>
            Tidak ada produk yang cocok dengan pencarian "<strong>{keyword || selectedCategory}</strong>" pada radius yang dipilih. Cobalah memperluas radius jarak atau gunakan kata kunci lain.
          </p>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => { setKeyword(''); setSelectedCategory('Semua'); setRadiusFilter(''); }}
          >
            Reset Pencarian
          </button>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '13.5px', color: '#475569', fontWeight: '600' }}>
              Menampilkan {products.length} produk pangan lokal (diurutkan berdasarkan jarak terdekat)
            </span>
          </div>

          <div className="grid-products">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={onSelectProduct}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
