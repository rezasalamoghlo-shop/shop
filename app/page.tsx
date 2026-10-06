import { supabase } from "@/lib/supabase";

export default async function Home() {
  let products: Array<{ id: string; name: string; description: string | null; price: number }> = [];

  if (supabase) {
    const { data } = await supabase
      .from("products")
      .select("id,name,description,price")
      .order("created_at", { ascending: false });

    products = (data ?? []) as typeof products;
  }

  return (
    <>
      <header className="header">
        <div className="header-inner">
          <strong>فروشگاه من</strong>
          <span>محصولات</span>
        </div>
      </header>

      <main className="container">
        <section className="hero">
          <h1>فروشگاه آنلاین</h1>
          <p className="muted">فرانت‌اند Next.js روی Vercel، بک‌اند Supabase</p>
        </section>

        <section>
          <h2>محصولات</h2>
          {products.length === 0 ? (
            <p className="muted">هنوز محصولی برای نمایش ثبت نشده است.</p>
          ) : (
            <div className="products">
              {products.map((product) => (
                <article className="card" key={product.id}>
                  <h3>{product.name}</h3>
                  {product.description && <p className="muted">{product.description}</p>}
                  <div className="price">{Number(product.price).toLocaleString("fa-IR")} تومان</div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}