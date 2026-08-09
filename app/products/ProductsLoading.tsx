// app/products/ProductsLoading.tsx
export default function ProductsLoading() {
  return (
    <div className="min-h-screen page-with-padding">
      <div className="container mx-auto px-4 pb-16">
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="rounded-[8px] mb-6">
              <div className="flex justify-between items-start sm:items-center gap-4">
                <div className="flex items-end gap-1">
                  <span className="text-[#726C6C] text-xl">الرئيسية</span>
                  <span>/</span>
                  <h1 className="text-base md:text-xl font-bold text-[#180100]">
                    جميع المنتجات
                  </h1>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 rounded-lg h-64 mb-3"></div>
                  <div className="bg-gray-200 h-4 rounded w-3/4 mb-2"></div>
                  <div className="bg-gray-200 h-4 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden md:block w-64">
            <div className="bg-gray-200 rounded-lg h-96 animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}