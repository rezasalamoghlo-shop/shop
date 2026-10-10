"use client";

import { useEffect, useState } from "react";

const faPrice = (value: unknown) => {
  const digits = "۰۱۲۳۴۵۶۷۸۹";
  const normalized = String(value ?? "")
    .replace(/[۰-۹]/g, (d) => String(digits.indexOf(d)))
    .replace(/[^0-9]/g, "");
  return normalized ? Number(normalized).toLocaleString("fa-IR") : "";
};

const priceNumber = (value: unknown) =>
  Number(
    String(value ?? "")
      .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
      .replace(/,/g, "")
      .replace(/[^0-9]/g, "")
  ) || 0;

const socials = [
  ["instagram", "اینستاگرام"],
  ["rubika", "روبیکا"],
  ["telegram", "تلگرام"],
  ["whatsapp", "واتساپ"],
  ["aparat", "آپارات"],
  ["website", "سایت دیگر"],
];

export default function Admin() {
  const [data, setData] = useState<any>(null);
  const [form, setForm] = useState<any>({
    name: "",
    description: "",
    price: "",
    stock: "0",
    discount_percent: "0",
    full_size_ml: "100",
    price_per_ml: "",
    per_ml_discount_percent: "0",
    discount_start: "",
    discount_end: "",
    category_ids: [],
    sizes: [],
  });
  const [image, setImage] = useState<File | null>(null);
  const [imageInputKey, setImageInputKey] = useState(0);
  const [message, setMessage] = useState("");
  const [action, setAction] = useState("");
  const [cropSource, setCropSource] = useState<string | null>(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropX, setCropX] = useState(50);
  const [cropY, setCropY] = useState(50);
  const [cropDimensions, setCropDimensions] = useState({width: 0, height: 0});
  const [deleting, setDeleting] = useState("");
  const [orderBusy, setOrderBusy] = useState("");
  const [specialDrafts, setSpecialDrafts] = useState<Record<string,string>>({});
  const [specialProducts, setSpecialProducts] = useState<Record<string,string>>({});
  const [specialAmounts, setSpecialAmounts] = useState<Record<string,string>>({});
  const [specialPricing, setSpecialPricing] = useState<Record<string,"ml"|"full">>({});

  async function load() {
    const response = await fetch("/api/admin/data");
    if (response.status === 401) {
      window.location.href = "/admin/login";
      return;
    }
    const result = await response.json();
    result.settings.social_links = result.settings.social_links || [];
    setData(result);
  }

  useEffect(() => {
    load();
  }, []);

  // Keep special-order conversations fresh without overwriting other unsaved admin form fields.
  useEffect(() => {
    const timer = window.setInterval(async () => {
      try {
        const response = await fetch("/api/admin/data", { cache: "no-store" });
        if (!response.ok) return;
        const result = await response.json();
        setData((current: any) => {
          if (!current) return current;
          const signature = (orders: any[]) => JSON.stringify((orders || []).map((o: any) => ({
            id: o.id, status: o.status,
            messages: (o.messages || []).map((m: any) => ({ id: m.id, role: m.role, content: m.content, created_at: m.created_at }))
          })));
          if (signature(current.special_orders) === signature(result.special_orders)) return current;
          return { ...current, special_orders: result.special_orders || [] };
        });
      } catch {}
    }, 2500);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    document.querySelectorAll<HTMLElement>(".admin-chat-messages").forEach((el) => {
      el.scrollTop = el.scrollHeight;
    });
  }, [data?.special_orders]);

  function updateForm(key: string, value: any) {
    setForm((current: any) => ({ ...current, [key]: value }));
  }

  function socialValue(key: string) {
    return (
      data.settings.social_links?.find((item: any) => item.name === key)?.url ||
      ""
    );
  }

  function setSocial(key: string, value: string) {
    const links = (data.settings.social_links || []).filter(
      (item: any) => item.name !== key
    );
    if (value) links.push({ name: key, url: value });
    setData({
      ...data,
      settings: { ...data.settings, social_links: links },
    });
  }

  async function saveProduct(method: "POST" | "PUT") {
    if (action) return;

    const required = [
      ["name", "نام عطر"],
      ["description", "توضیحات"],
      ["price", "قیمت"],
      ["stock", "موجودی"],
      ["discount_percent", "درصد تخفیف بطری کامل"],
      ["full_size_ml", "حجم بطری کامل"],
      ["price_per_ml", "قیمت هر میل"],
      ["per_ml_discount_percent", "درصد تخفیف فروش میلی"],
    ];
    const missing = required.find(
      ([key]) => !String(form[key] ?? "").trim()
    );

    if (missing) {
      setMessage("لطفاً فیلد «" + missing[1] + "» را کامل کنید.");
      return;
    }
    if (priceNumber(form.price) <= 0) {
      setMessage("قیمت محصول باید بیشتر از صفر باشد.");
      return;
    }
    if (priceNumber(form.full_size_ml) <= 0 || priceNumber(form.price_per_ml) <= 0) { setMessage("حجم بطری و قیمت هر میل باید بیشتر از صفر باشند."); return; }
    if (Number(form.per_ml_discount_percent) < 0 || Number(form.per_ml_discount_percent) > 100) { setMessage("درصد تخفیف فروش میلی باید بین صفر تا صد باشد."); return; }
    for (const z of form.sizes || []) { if (priceNumber(z.size_ml) <= 0 || priceNumber(z.size_ml) >= priceNumber(form.full_size_ml) || priceNumber(z.price) <= 0 || Number(z.discount_percent) < 0 || Number(z.discount_percent) > 100 || priceNumber(z.stock) < 0) { setMessage("اطلاعات یکی از اندازه‌ها نامعتبر است؛ میل، قیمت، تخفیف و موجودی را بررسی کنید."); return; } }
    if (priceNumber(form.stock) < 0) {
      setMessage("موجودی نمی‌تواند منفی باشد.");
      return;
    }
    if (Number(form.discount_percent) < 0 || Number(form.discount_percent) > 100) {
      setMessage("درصد تخفیف باید بین صفر تا صد باشد.");
      return;
    }
    if (!form.id && !image) {
      setMessage("تصویر محصول اجباری است.");
      return;
    }

    setAction(method === "POST" ? "product-create" : "product-edit");
    setMessage("");

    try {
      const body = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        body.append(
          key,
          ["price","full_size_ml","price_per_ml","stock","discount_percent","per_ml_discount_percent"].includes(key) ? String(priceNumber(value)) : String(value ?? "")
        );
      });
      if (form.id) body.append("id", form.id);
      if (image) { const cropped = await cropImageFile(image, cropZoom, cropX, cropY); body.append("image", cropped, cropped.name); }
      body.append("category_ids", JSON.stringify(form.category_ids || []));
      body.append("sizes_json", JSON.stringify((form.sizes||[]).map((z:any)=>({size_ml:priceNumber(z.size_ml),price:priceNumber(z.price),discount_percent:Number(z.discount_percent)||0,stock:priceNumber(z.stock),is_active:z.is_active!==false}))));

      const response = await fetch("/api/admin/products", {
        method,
        body,
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setMessage(result?.error || "خطا در ذخیره محصول");
        return;
      }

      setMessage(
        method === "POST"
          ? "محصول با موفقیت ایجاد شد."
          : "محصول با موفقیت ویرایش شد."
      );
      setForm({
        name: "",
        description: "",
        price: "",
        stock: "0",
        discount_percent: "0",
        full_size_ml: "100",
        price_per_ml: "",
        per_ml_discount_percent: "0",
        discount_start: "",
        discount_end: "",
            category_ids: [],
        sizes: [],
      });
      setImage(null);
      setImageInputKey((key) => key + 1);
      if (cropSource) URL.revokeObjectURL(cropSource);
      setCropSource(null);
      await load();
    } finally {
      setAction("");
    }
  }

  async function chooseImage(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setMessage("لطفاً یک فایل تصویری انتخاب کنید."); return; }
    if (cropSource) URL.revokeObjectURL(cropSource);
    setImage(file); setCropSource(URL.createObjectURL(file));
    setCropZoom(1.35); setCropX(50); setCropY(50); setCropDimensions({width: 0, height: 0});
    setMessage("کادر برش را تنظیم کنید؛ فقط نسخه برش‌خورده ذخیره خواهد شد.");
  }

  async function cropImageFile(file: File, zoom: number, x: number, y: number): Promise<File> {
    const url = URL.createObjectURL(file);
    try {
      const img = new window.Image(); img.src = url;
      await new Promise<void>((resolve, reject) => { img.onload = () => resolve(); img.onerror = () => reject(new Error("بارگذاری تصویر ناموفق بود")); });
      const side = Math.min(img.naturalWidth, img.naturalHeight) / zoom;
      const left = Math.max(0, Math.min(img.naturalWidth - side, (img.naturalWidth - side) * x / 100));
      const top = Math.max(0, Math.min(img.naturalHeight - side, (img.naturalHeight - side) * y / 100));
      const canvas = document.createElement("canvas"); canvas.width = 720; canvas.height = 720;
      const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("امکان برش تصویر وجود ندارد");
      ctx.drawImage(img, left, top, side, side, 0, 0, 720, 720);
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error("ساخت تصویر برش‌خورده ناموفق بود")), "image/webp", 0.88));
      return new File([blob], file.name.replace(/\.[^.]+$/, "") + "-crop.webp", { type: "image/webp" });
    } finally { URL.revokeObjectURL(url); }
  }

  async function saveCategory() {
    if (action) return;
    const name = String(data.categoryDraft || "").trim();
    if (!name) {
      setMessage("نام دسته‌بندی را وارد کنید.");
      return;
    }

    setAction("category-create");
    try {
      const response = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: data.categoryDescription || "",
          sort_order: Number(data.categorySortOrder || 0),
        }),
      });
      const result = await response.json().catch(() => null);
      setMessage(
        response.ok
          ? "دسته‌بندی با موفقیت ایجاد شد."
          : result?.error || "خطا در ایجاد دسته‌بندی"
      );
      if (response.ok) await load();
    } finally {
      setAction("");
    }
  }

  async function removeCategory(id: string) {
    if (action) return;
    if (!confirm("این دسته‌بندی حذف شود؟")) return;

    setAction("category-delete");
    try {
      const response = await fetch("/api/admin/categories?id=" + id, {
        method: "DELETE",
      });
      const result = await response.json().catch(() => null);
      setMessage(
        response.ok
          ? "دسته‌بندی حذف شد."
          : result?.error || "خطا در حذف دسته‌بندی"
      );
      if (response.ok) await load();
    } finally {
      setAction("");
    }
  }

  async function saveSettings() {
    if (action) return;
    setAction("settings");
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.settings),
      });
      setMessage(
        response.ok
          ? "تنظیمات با موفقیت ذخیره شد."
          : "خطا در ذخیره تنظیمات"
      );
      if (response.ok) await load();
    } finally {
      setAction("");
    }
  }

  async function removeProduct(id: string) {
    if (deleting || action) return;
    if (!confirm("این محصول حذف شود؟")) return;

    setDeleting(id);
    try {
      const response = await fetch("/api/admin/products?id=" + id, {
        method: "DELETE",
      });
      setMessage(response.ok ? "محصول حذف شد." : "خطا در حذف محصول");
      if (response.ok) await load();
    } finally {
      setDeleting("");
    }
  }

    async function deleteSpecialOrder(id: string) {
    if (action || orderBusy) return;
    if (!confirm("این درخواست عطر ویژه حذف شود؟")) return;
    setOrderBusy(id);
    try {
      const response = await fetch("/api/admin/special-orders?id=" + encodeURIComponent(id), { method: "DELETE" });
      const result = await response.json().catch(() => null);
      setMessage(response.ok ? "درخواست عطر ویژه حذف شد." : (result?.error || "خطا در حذف درخواست"));
      if (response.ok) await load();
    } finally {
      setOrderBusy("");
    }
  }

  async function specialAction(id: string, actionName: string, extra: Record<string, any> = {}) {
    if (orderBusy || action) return;
    if (actionName === "add_to_cart" && !confirm("محصول با حجم انتخاب‌شده به سبد خرید مشتری اضافه شود و درخواست پایان یابد؟")) return;
    setOrderBusy(id);
    try {
      const response = await fetch("/api/special-order/conversation", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: actionName, ...extra }),
      });
      const result = await response.json().catch(() => null);
      setMessage(response.ok
        ? actionName === "start" ? "گفتگوی مستقیم با مشتری آغاز شد."
          : actionName === "message" ? "پیام برای مشتری ارسال شد."
          : "محصول به سبد مشتری اضافه شد و درخواست پایان یافت."
        : result?.error || "عملیات درخواست ویژه ناموفق بود.");
      if (response.ok) {
        setSpecialDrafts((current) => ({ ...current, [id]: "" }));
        await load();
      }
    } finally {
      setOrderBusy("");
    }
  }

async function updateOrder(id: string, status: string) {
    if (orderBusy || action) return;
    setOrderBusy(id);
    try {
      const response = await fetch("/api/admin/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      setMessage(
        response.ok
          ? "وضعیت سفارش تغییر کرد."
          : "خطا در تغییر وضعیت سفارش"
      );
      if (response.ok) await load();
    } finally {
      setOrderBusy("");
    }
  }

  function editProduct(product: any) {
    setForm({
      ...product,
      price: faPrice(product.price),
      full_size_ml: String(product.full_size_ml ?? 100),
      price_per_ml: faPrice(product.price_per_ml ?? 0),
      per_ml_discount_percent: String(product.per_ml_discount_percent ?? 0),
      stock: String(product.stock ?? 0),
      discount_percent: String(product.discount_percent ?? 0),
      discount_start: product.discount_start || "",
      discount_end: product.discount_end || "",
        category_ids: (product.category_ids || []).map((item: any) =>
        item.category_id || item
      ),
      sizes: (product.sizes || []).map((z:any)=>({size_ml:String(z.size_ml),price:faPrice(z.price),discount_percent:String(z.discount_percent??0),stock:String(z.stock??0),is_active:z.is_active!==false})),
    });
    setImage(null);
    if (cropSource) URL.revokeObjectURL(cropSource);
    setCropSource(null);
  }

  if (!data) {
    return (
      <main className="admin">
        <div className="empty">در حال بارگذاری...</div>
      </main>
    );
  }

  return (
    <main className="admin">
      <header>
        <div>
          <span>GALAXY CONTROL</span>
          <h1>پنل مدیریت عطر کهکشان</h1>
        </div>
        <div>
          <a className="outline" href="/">فروشگاه</a>
          <button
            className="logout"
            onClick={async () => {
              await fetch("/api/admin/logout", { method: "POST" });
              window.location.href = "/admin/login";
            }}
          >
            خروج
          </button>
        </div>
      </header>

      {message && <p className="admin-msg">{message}</p>}

      <section className="admin-grid">
        <div className="panel">
          <h2>مدیریت دسته‌بندی‌ها</h2>
          <label>
            نام دسته‌بندی
            <input
              value={data.categoryDraft || ""}
              onChange={(event) =>
                setData({ ...data, categoryDraft: event.target.value })
              }
              placeholder="مثلاً عطر مردانه"
            />
          </label>
          <label>
            توضیح کوتاه
            <textarea
              value={data.categoryDescription || ""}
              onChange={(event) =>
                setData({ ...data, categoryDescription: event.target.value })
              }
            />
          </label>
          <label>
            ترتیب نمایش
            <input
              type="number"
              value={data.categorySortOrder ?? 0}
              onChange={(event) =>
                setData({ ...data, categorySortOrder: event.target.value })
              }
            />
          </label>
          <button
            className="gold"
            disabled={Boolean(action)}
            onClick={saveCategory}
          >
            {action === "category-create"
              ? "در حال ایجاد دسته‌بندی..."
              : "افزودن دسته‌بندی"}
          </button>

          <div className="category-admin-list">
            {(data.categories || []).map((category: any) => (
              <div className="admin-row" key={category.id}>
                <div>
                  <b>{category.name}</b>
                  <small>{category.description || "بدون توضیح"}</small>
                </div>
                <button
                  disabled={Boolean(action)}
                  onClick={() => removeCategory(category.id)}
                >
                  {action === "category-delete" ? "در حال حذف..." : "حذف"}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <h2>ویترین و پرداخت</h2>
          <label>
            عنوان ترند
            <input
              value={data.settings.hero_title || ""}
              onChange={(event) =>
                setData({
                  ...data,
                  settings: {
                    ...data.settings,
                    hero_title: event.target.value,
                  },
                })
              }
            />
          </label>
          <label>
            متن معرفی
            <textarea
              value={data.settings.hero_text || ""}
              onChange={(event) =>
                setData({
                  ...data,
                  settings: {
                    ...data.settings,
                    hero_text: event.target.value,
                  },
                })
              }
            />
          </label>
          <label>
            شماره کارت
            <input
              value={data.settings.card_number || ""}
              onChange={(event) =>
                setData({
                  ...data,
                  settings: {
                    ...data.settings,
                    card_number: event.target.value,
                  },
                })
              }
            />
          </label>
          <label>
            شماره پشتیبانی
            <input
              value={data.settings.support_phone || ""}
              onChange={(event) =>
                setData({
                  ...data,
                  settings: {
                    ...data.settings,
                    support_phone: event.target.value,
                  },
                })
              }
            />
          </label>
          <label>
            آدرس فروشگاه
            <input
              value={data.settings.address || ""}
              onChange={(event) =>
                setData({
                  ...data,
                  settings: {
                    ...data.settings,
                    address: event.target.value,
                  },
                })
              }
            />
          </label>
          {socials.map(([key, label]) => (
            <label key={key}>
              لینک {label}
              <input
                dir="ltr"
                placeholder="https://..."
                value={socialValue(key)}
                onChange={(event) => setSocial(key, event.target.value)}
              />
            </label>
          ))}
          <button
            className="gold"
            disabled={Boolean(action)}
            onClick={saveSettings}
          >
            {action === "settings"
              ? "در حال اعمال تغییرات..."
              : "ذخیره تنظیمات"}
          </button>
        </div>

        <div className="panel">
          <h2>{form.id ? "ویرایش" : "افزودن"} محصول</h2>

          <label>
            نام عطر
            <input
              value={form.name}
              onChange={(event) => updateForm("name", event.target.value)}
            />
          </label>
          <label>
            توضیحات
            <textarea
              value={form.description}
              onChange={(event) =>
                updateForm("description", event.target.value)
              }
            />
          </label>
          <label>
            قیمت
            <input
              inputMode="numeric"
              value={faPrice(form.price)}
              onChange={(event) => updateForm("price", event.target.value)}
            />
          </label>
          <label>
            موجودی
            <input
              inputMode="numeric"
              value={form.stock}
              onChange={(event) => updateForm("stock", event.target.value)}
            />
          </label>
          <label>
            درصد تخفیف
            <input
              inputMode="numeric"
              value={form.discount_percent}
              onChange={(event) =>
                updateForm("discount_percent", event.target.value)
              }
            />
          </label>
          <label>
            حجم بطری کامل (میل)
            <input inputMode="numeric" value={form.full_size_ml} onChange={event=>updateForm("full_size_ml",event.target.value)} />
          </label>
          <label>
            قیمت هر میل
            <input inputMode="numeric" value={faPrice(form.price_per_ml)} onChange={event=>updateForm("price_per_ml",event.target.value)} />
          </label>
          <label>
            درصد تخفیف فروش میلی
            <input inputMode="numeric" value={form.per_ml_discount_percent} onChange={event=>updateForm("per_ml_discount_percent",event.target.value)} />
          </label>
          <label>
            شروع تخفیف
            <input
              type="datetime-local"
              value={form.discount_start || ""}
              onChange={(event) =>
                updateForm("discount_start", event.target.value)
              }
            />
          </label>
          <label>
            پایان تخفیف
            <input
              type="datetime-local"
              value={form.discount_end || ""}
              onChange={(event) =>
                updateForm("discount_end", event.target.value)
              }
            />
          </label>

          <div className="size-admin">
            <div className="size-admin-head"><div><b>اندازه‌های قابل فروش</b><small>برای هر میل قیمت، تخفیف و موجودی مستقل تعیین کنید.</small></div><button type="button" className="outline" onClick={()=>updateForm("sizes",[...(form.sizes||[]),{size_ml:"10",price:"",discount_percent:"0",stock:"0",is_active:true}])}>+ افزودن اندازه</button></div>
            {(form.sizes||[]).map((z:any,i:number)=><div className="size-admin-row" key={i}>
              <label>میل<input inputMode="numeric" value={z.size_ml} onChange={e=>{const a=[...(form.sizes||[])];a[i]={...z,size_ml:e.target.value};updateForm("sizes",a)}}/></label>
              <label>قیمت<input inputMode="numeric" value={faPrice(z.price)} onChange={e=>{const a=[...(form.sizes||[])];a[i]={...z,price:e.target.value};updateForm("sizes",a)}}/></label>
              <label>تخفیف ٪<input inputMode="numeric" value={z.discount_percent} onChange={e=>{const a=[...(form.sizes||[])];a[i]={...z,discount_percent:e.target.value};updateForm("sizes",a)}}/></label>
              <label>موجودی<input inputMode="numeric" value={z.stock} onChange={e=>{const a=[...(form.sizes||[])];a[i]={...z,stock:e.target.value};updateForm("sizes",a)}}/></label>
              <button type="button" className="remove-size" onClick={()=>updateForm("sizes",(form.sizes||[]).filter((_:any,j:number)=>j!==i))}>حذف</button>
            </div>)}
            {!(form.sizes||[]).length&&<small className="upload-hint">هنوز اندازه‌ای تعریف نشده است. بطری کامل از اطلاعات اصلی محصول استفاده می‌کند.</small>}
          </div>

          <fieldset className="category-picker">
            <legend>دسته‌بندی محصول</legend>
            {(data.categories || [])
              .filter((category: any) => category.is_active)
              .map((category: any) => (
                <label className="category-check" key={category.id}>
                  <input
                    type="checkbox"
                    checked={(form.category_ids || []).includes(category.id)}
                    onChange={(event) => {
                      const current = form.category_ids || [];
                      updateForm(
                        "category_ids",
                        event.target.checked
                          ? [...current, category.id]
                          : current.filter((id: string) => id !== category.id)
                      );
                    }}
                  />
                  <span>{category.name}</span>
                </label>
              ))}
            {!(data.categories || []).length && (
              <small className="upload-hint">
                ابتدا یک دسته‌بندی ایجاد کنید.
              </small>
            )}
          </fieldset>

          <label>
            تصویر محصول
            <input
              key={imageInputKey}
              type="file"
              accept="image/*"
                            onChange={(event) =>
                chooseImage(event.target.files?.[0] || null)
              }
            />
            <small className="upload-hint">
              تصویر را انتخاب کنید و با تنظیم بزرگ‌نمایی و موقعیت، قسمت دلخواه را در کادر مشخص کنید. فقط نسخه برش‌خورده ذخیره می‌شود.
            </small>
            {cropSource && (
              <div className="crop-tool">
                <div className="crop-preview-frame">
                  <img src={cropSource} alt="پیش‌نمایش برش تصویر" onLoad={e=>setCropDimensions({width:e.currentTarget.naturalWidth,height:e.currentTarget.naturalHeight})} style={{position:"absolute",maxWidth:"none",width:cropDimensions.width&&cropDimensions.height?(cropDimensions.width/Math.min(cropDimensions.width,cropDimensions.height)*cropZoom*100)+"%":"100%",height:cropDimensions.width&&cropDimensions.height?(cropDimensions.height/Math.min(cropDimensions.width,cropDimensions.height)*cropZoom*100)+"%":"100%",left:cropDimensions.width&&cropDimensions.height?(-((cropDimensions.width/Math.min(cropDimensions.width,cropDimensions.height)/cropZoom*100)-100)*cropX/100)+"%":"0%",top:cropDimensions.width&&cropDimensions.height?(-((cropDimensions.height/Math.min(cropDimensions.width,cropDimensions.height)/cropZoom*100)-100)*cropY/100)+"%":"0%"}} />
                  <span className="crop-circle-guide" />
                </div>
                <label>بزرگ‌نمایی<input type="range" min="1" max="3" step="0.05" value={cropZoom} onChange={e=>setCropZoom(Number(e.target.value))}/></label>
                <label>موقعیت افقی<input type="range" min="0" max="100" value={cropX} onChange={e=>setCropX(Number(e.target.value))}/></label>
                <label>موقعیت عمودی<input type="range" min="0" max="100" value={cropY} onChange={e=>setCropY(Number(e.target.value))}/></label>
                <button type="button" className="outline" onClick={()=>{setCropZoom(1.35);setCropX(50);setCropY(50)}}>بازنشانی کادر</button>
              </div>
            )}
          </label>

          <button
            className="gold"
            disabled={Boolean(action)}
            onClick={() => saveProduct(form.id ? "PUT" : "POST")}
          >
            {action === "product-create"
              ? "در حال ایجاد محصول..."
              : action === "product-edit"
              ? "در حال ویرایش محصول..."
              : form.id
              ? "ذخیره تغییرات محصول"
              : "ایجاد محصول"}
          </button>
        </div>
      </section>

      <section className="panel">
        <h2>محصولات</h2>
        {data.products.map((product: any) => (
          <div className="admin-row" key={product.id}>
            <div>
              {product.image_url && <img src={product.image_url} alt="" />}
              <b>{product.name}</b>
              <small>بطری کامل: {faPrice(product.price)} تومان | {product.full_size_ml} میل</small><small>هر میل: {faPrice(product.price_per_ml)} تومان</small><small>تخفیف بطری: {product.discount_percent || 0}٪ | تخفیف پایه میلی: {product.per_ml_discount_percent || 0}٪</small><small>اندازه‌ها: {(product.sizes||[]).map((z:any)=>`${z.size_ml} میل · ${faPrice(Number(z.price)*(1-Number(z.discount_percent||0)/100))} تومان · ${z.discount_percent||0}٪ · موجودی ${z.stock}`).join(" | ") || "تعریف نشده"}</small>
              <small>
                {(product.categories || [])
                  .map((category: any) => category.name)
                  .join("، ") || "بدون دسته‌بندی"}
              </small>
            </div>
            <div>
              <button onClick={() => editProduct(product)}>ویرایش</button>
              <button
                disabled={Boolean(deleting) || Boolean(action)}
                onClick={() => removeProduct(product.id)}
              >
                {deleting === product.id ? "در حال حذف..." : "حذف"}
              </button>
            </div>
          </div>
        ))}
      </section>

      <section className="panel">
        <h2>درخواست‌های عطر ویژه</h2>
        <p>پس از شروع گفتگو، پیام‌ها مستقیماً بین شما و مشتری ردوبدل می‌شوند و مشاور هوشمند دخالتی ندارد.</p>
        {(data.special_orders || []).length ? (
          data.special_orders.map((order: any) => {
            const statusLabels: Record<string,string> = { pending: "در انتظار بررسی", in_progress: "گفتگو با کارشناس", completed: "نهایی‌شده", cancelled: "لغوشده" };
            const labels: Record<string,string> = { product_type:"نوع محصول", gender:"جنسیت", target:"برای چه کسی", occasion:"مناسبت", gift_occasion:"مناسبت هدیه", time:"زمان استفاده", season:"فصل", longevity:"ماندگاری", sillage:"پخش بو", scent:"رایحه", birth_month:"ماه تولد", budget:"بودجه" };
            const prefs = Object.entries(order.preferences || {}).filter(([key]) => !["first_name","last_name","phone"].includes(key)).map(([key,value]) => {
              const shown = value == null ? "بدون محدودیت" : Array.isArray(value) ? value.join("، ") : typeof value === "object" ? JSON.stringify(value) : String(value);
              return (labels[key] || key) + ": " + shown;
            });
            return <div className="order" key={order.id}>
              <div>
                <b>{[order.first_name, order.last_name].filter(Boolean).join(" ") || "مشتری عطر ویژه"}</b>
                <small>{order.phone || "شماره ثبت نشده"} | وضعیت: {statusLabels[order.status] || "در انتظار بررسی"}</small>
                <small>{prefs.join(" · ") || "مشخصات تکمیلی ثبت نشده است."}</small>
                <small>{order.notes || ""}</small>
                <div className="special-conversation admin-messenger" style={{marginTop:12}}>
                  <div className="admin-messenger-head">
                    <div className="admin-messenger-avatar">✦</div>
                    <div><b>گفتگوی سفارش ویژه</b><small>{order.status==="in_progress"?"گفتگوی زنده با مشتری":order.status==="pending"?"برای شروع گفتگو تأیید کنید":"گفتگو پایان یافته"}</small></div>
                    <span className="admin-live-dot">{order.status==="in_progress"?"● آنلاین":"●"}</span>
                  </div>
                  <div className="admin-chat-messages">
                    {(order.messages||[]).map((m:any)=><div key={m.id} className={"admin-chat-row "+(m.role==="user"?"from-customer":"from-admin")}>
                      <div className="admin-chat-bubble">
                        <div className="admin-chat-sender">{m.role==="user"?"مشتری":"شما · کارشناس"}</div>
                        <div className="admin-chat-content">{m.content}</div>
                        <time>{m.created_at?new Date(m.created_at).toLocaleTimeString("fa-IR",{hour:"2-digit",minute:"2-digit"}):""}</time>
                      </div>
                    </div>)}
                    {!(order.messages||[]).length&&<div className="admin-chat-empty">هنوز پیامی ارسال نشده است. گفتگو را شروع کنید.</div>}
                  </div>
                  {order.status==="pending"&&<div className="admin-chat-actions"><button className="gold" disabled={Boolean(orderBusy)||Boolean(action)} onClick={()=>specialAction(order.id,"start")}>{orderBusy===order.id?"در حال شروع...":"تأیید و شروع گفتگو"}</button></div>}
                  {order.status==="in_progress"&&<>
                    <div className="admin-chat-compose">
                      <textarea value={specialDrafts[order.id]||""} onChange={e=>setSpecialDrafts(v=>({...v,[order.id]:e.target.value}))} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();if((specialDrafts[order.id]||"").trim())specialAction(order.id,"message",{content:specialDrafts[order.id]})}}} placeholder="پیام خود را بنویسید... (Enter برای ارسال، Shift+Enter برای خط جدید)"/>
                      <button disabled={Boolean(orderBusy)||Boolean(action)||!(specialDrafts[order.id]||"").trim()} onClick={()=>specialAction(order.id,"message",{content:specialDrafts[order.id]})}>{orderBusy===order.id?"…":"ارسال ➤"}</button>
                    </div>
                    <div className="admin-cart-builder">
                      <b>🛍 افزودن عطر به سبد مشتری</b>
                      <label>انتخاب عطر
                        <select value={specialProducts[order.id]||""} onChange={e=>setSpecialProducts(v=>({...v,[order.id]:e.target.value}))}>
                          <option value="">عطر موردنظر را انتخاب کنید</option>
                          {(data.products||[]).filter((p:any)=>Number(p.stock)>0).map((p:any)=><option key={p.id} value={p.id}>{p.name} · هر میل {faPrice(Number(p.price_per_ml||Number(p.price)/Math.max(1,Number(p.full_size_ml)||100))*(1-Number(p.per_ml_discount_percent||0)/100))} تومان · موجودی {p.stock}</option>)}
                        </select>
                      </label>
                      <div className="admin-cart-size-row">
                        <label>نوع فروش
                          <select value={specialPricing[order.id]||"ml"} onChange={e=>setSpecialPricing(v=>({...v,[order.id]:e.target.value as "ml"|"full"}))}>
                            <option value="ml">حجم دلخواه (میلی‌لیتر)</option><option value="full">بطری کامل</option>
                          </select>
                        </label>
                        {(specialPricing[order.id]||"ml")==="ml"&&<label>حجم برای مشتری (میل)
                          <input type="number" min="1" max={Math.max(1,Number((data.products||[]).find((p:any)=>p.id===specialProducts[order.id])?.full_size_ml)||100)} step="1" value={specialAmounts[order.id]||"10"} onChange={e=>setSpecialAmounts(v=>({...v,[order.id]:e.target.value}))}/>
                        </label>}
                      </div>
                      {specialProducts[order.id]&&(()=>{const p=(data.products||[]).find((x:any)=>x.id===specialProducts[order.id]);if(!p)return null;const full=Number(p.full_size_ml)||100;const ml=Number(specialAmounts[order.id]||10);const per=Number(p.price_per_ml)||Number(p.price)/full;const total=(specialPricing[order.id]||"ml")==="full"?Number(p.price)*(1-Number(p.discount_percent||0)/100):per*(1-Number(p.per_ml_discount_percent||0)/100)*ml;return <div className="admin-cart-preview">حجم بطری: {full} میل · مبلغ تقریبی: <strong>{faPrice(Math.round(total))} تومان</strong></div>})()}
                      <button className="gold" disabled={Boolean(orderBusy)||Boolean(action)||!specialProducts[order.id]||((specialPricing[order.id]||"ml")==="ml"&&(!Number(specialAmounts[order.id])||Number(specialAmounts[order.id])<1||Number(specialAmounts[order.id])>Number((data.products||[]).find((p:any)=>p.id===specialProducts[order.id])?.full_size_ml||100)))} onClick={()=>specialAction(order.id,"add_to_cart",{product_id:specialProducts[order.id],pricing_type:specialPricing[order.id]||"ml",size_ml:Number(specialAmounts[order.id]||10)})}>{orderBusy===order.id?"در حال نهایی‌سازی...":"افزودن به سبد و پایان درخواست"}</button>
                    </div>
                  </>}
                  <button className="special-delete" disabled={Boolean(orderBusy)||Boolean(action)} onClick={()=>deleteSpecialOrder(order.id)}>{orderBusy===order.id?"در حال انجام...":"حذف درخواست و آزادسازی مشاور"}</button>
                </div>
              </div>
            </div>
          })
        ) : <div className="empty">درخواستی ثبت نشده است.</div>}
      </section>

      <section className="panel">
        <h2>سفارش‌ها</h2>
        {data.orders.length ? (
          data.orders.map((order: any) => (
            <div className="order" key={order.id}>
              <div>
                <b>{order.customer_full_name}</b>
                <small>
                  {order.phone} | {order.province}، {order.city} | کدپستی{" "}
                  {order.postal_code}
                </small>
                <small>{order.address}</small>
                <small>
                  شناسه پرداخت: {order.payment_tracking_code} | واریزکننده:{" "}
                  {order.payer_full_name}
                </small>
              </div>
              <strong>
                {Number(order.total_price).toLocaleString("fa-IR")} تومان
              </strong>
              <select
                disabled={Boolean(orderBusy) || Boolean(action)}
                value={order.status}
                onChange={(event) =>
                  updateOrder(order.id, event.target.value)
                }
              >
                <option value="pending">در انتظار تأیید</option>
                <option value="paid">پرداخت تأیید شد</option>
                <option value="processing">در حال آماده‌سازی</option>
                <option value="shipped">ارسال شد</option>
                <option value="cancelled">لغو</option>
              </select>
            </div>
          ))
        ) : (
          <div className="empty">سفارشی ثبت نشده است.</div>
        )}
      </section>
    </main>
  );
}
