import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Filter, Search } from 'lucide-react';
import { fetchProducts } from '../lib/api';
import { useCart } from '../context/CartContext';
import AccessibleAlert from '../components/AccessibleAlert';
import { useVoice } from '../context/VoiceContext';
import { useProductsVoiceFlow } from '../assistant/productsFlow';
import { normalizeArabic } from '../lib/arabic';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [category, setCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const cart = useCart();
  const voice = useVoice();
  const { addToCart } = cart;
  const { speak } = voice;
  
  const searchInputRef = useRef(null);
  
  useEffect(() => {
      if (searchInputRef.current) {
          console.log("Search Input Ref is active");
      }
  }, [loading]);

  const categories = useRef(["مواد غذائية", "ملابس تقليدية", "صناعات تقليدية", "أثاث وديكور", "عناية شخصية", "أواني منزلية"]).current;

  useProductsVoiceFlow({
    voice,
    cart,
    products,
    setSearchQuery,
    searchQuery,
    searchInputRef,
    setCategory,
    categories
  });

  useEffect(() => {
    loadProducts();
  }, [page, category]);

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProducts(page, 12, category);
      setProducts(data.products);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError('فشل في تحميل المنتجات. الرجاء المحاولة لاحقاً.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    addToCart(product);
    speak(`تمت إضافة ${product.name} إلى السلة.`);
  };

  // Filter displayed products based on search query
  const displayedProducts = products.filter(p => 
    !searchQuery || normalizeArabic(p.name).includes(normalizeArabic(searchQuery))
  );

  return (
    <div className="container mx-auto px-4 py-8 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">المنتجات المتوفرة</h1>
        
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
           {/* Search Input */}
           <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="بحث عن منتوج..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64"
            />
            <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 w-full md:w-auto">
            <Filter size={20} className="text-slate-500" />
            <button 
              onClick={() => { setCategory(''); setPage(1); }}
              className={`px-4 py-2 rounded-full whitespace-nowrap ${category === '' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'}`}
            >
              الكل
            </button>
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => { setCategory(cat); setPage(1); }}
                className={`px-4 py-2 rounded-full whitespace-nowrap ${category === cat ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-4 animate-pulse h-80">
              <div className="bg-slate-300 dark:bg-slate-700 h-40 rounded-lg mb-4"></div>
              <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <AccessibleAlert type="error" message={error} />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {displayedProducts.length > 0 ? (
              displayedProducts.map(product => (
              <div key={product._id} className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow border border-slate-100 dark:border-slate-700 flex flex-col">
                <div className="block h-48 overflow-hidden relative group">
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                    loading="lazy"
                  />
                  {product.stock === 0 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="bg-red-600 text-white px-3 py-1 rounded-full font-bold">نفذت الكمية</span>
                    </div>
                  )}
                </div>
                
                <div className="p-4 flex-grow flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white line-clamp-1">{product.name}</h3>
                    <span className="text-blue-600 font-bold whitespace-nowrap">{product.price.toFixed(3)} د.ت</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-2 flex-grow">{product.description}</p>
                  
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md">
                      {product.category}
                    </span>
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock === 0}
                      className={`
                        flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors text-sm
                        ${product.stock > 0 
                          ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95' 
                          : 'bg-slate-300 text-slate-500 cursor-not-allowed dark:bg-slate-700'}
                      `}
                      aria-label={`أضف ${product.name} إلى السلة`}
                    >
                      <ShoppingCart size={16} />
                      <span>{product.stock > 0 ? 'أضف للسلة' : 'غير متوفر'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
            ) : (
              <div className="col-span-full text-center py-12 text-slate-500">
                <p className="text-xl">لا توجد منتجات مطابقة للبحث.</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8 gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 disabled:opacity-50"
              >
                السابق
              </button>
              <span className="px-4 py-2 font-bold text-slate-800 dark:text-white">
                صفحة {page} من {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 disabled:opacity-50"
              >
                التالي
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
