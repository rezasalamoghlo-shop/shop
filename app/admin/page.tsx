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
    process_image: false,
    category_ids: [],
    sizes: [],
  });
  const [image, setImage] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [action, setAction] = useState("");
  const [processingImage, setProcessingImage] = useState(false);
  const [deleting, setDeleting] = useState("");
  const [orderBusy, setOrderBusy] = useState("");

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
    if (action || processingImage) return;

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
      if (image) body.append("image", image);
      body.append("process_image", String(Boolean(form.process_image)));
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
        process_image: false,
        category_ids: [],
        sizes: [],
      });
      setImage(null);
      await load();
    } finally {
      setAction("");
    }
  }

  async function chooseImage(file: File | null) {
    if (!file) return;

    if (!form.process_image) {
      setImage(file);
      setMessage("تصویر بدون پردازش هوش مصنوعی آماده ذخیره است.");
      return;
    }

    setProcessingImage(true);
    setMessage("در حال حذف هوشمند پس‌زمینه تصویر...");

    try {
      const { removeBackground } = await import("@imgly/background-removal");
      const blob = await removeBackground(file, {
        output: { format: "image/png", quality: 0.92 },
      });
      setImage(
        new File(
          [blob],
          file.name.replace(/\.[^.]+$/, "") + ".png",
          { type: "image/png" }
        )
      );
      setMessage("پس‌زمینه حذف شد و تصویر آماده ذخیره است.");
    } catch (error) {
      console.error(error);
      setImage(file);
      setMessage("حذف پس‌زمینه انجام نشد، تصویر اصلی آماده آپلود شد.");
    } finally {
      setProcessingImage(false);
    }
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
      process_image: false,
      category_ids: (product.category_ids || []).map((item: any) =>
        item.category_id || item
      ),
      sizes: (product.sizes || []).map((z:any)=>({size_ml:String(z.size_ml),price:faPrice(z.price),discount_percent:String(z.discount_percent??0),stock:String(z.stock??0),is_active:z.is_active!==false})),
    });
    setImage(null);
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
            disabled={Boolean(action) || processingImage}
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
            disabled={Boolean(action) || processingImage}
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
              type="file"
              accept="image/*"
              disabled={processingImage}
              onChange={(event) =>
                chooseImage(event.target.files?.[0] || null)
              }
            />
            <span className="ai-image-toggle">
              <input
                type="checkbox"
                checked={Boolean(form.process_image)}
                disabled={processingImage}
                onChange={(event) =>
                  updateForm("process_image", event.target.checked)
                }
              />
              پردازش تصویر با هوش مصنوعی و حذف پس‌زمینه
            </span>
            <small className="upload-hint">
              {processingImage
                ? "در حال پردازش تصویر با هوش مصنوعی..."
                : form.process_image
                ? "پس‌زمینه تصویر هنگام انتخاب حذف می‌شود."
                : "تصویر بدون پردازش هوش مصنوعی ذخیره می‌شود."}
            </small>
          </label>

          <button
            className="gold"
            disabled={Boolean(action) || processingImage}
            onClick={() => saveProduct(form.id ? "PUT" : "POST")}
          >
            {processingImage
              ? "در حال پردازش تصویر..."
              : action === "product-create"
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
        {(data.special_orders || []).length ? (
          data.special_orders.map((order: any) => (
            <div className="order" key={order.id}>
              <div>
                <b>
                  {[order.first_name, order.last_name]
                    .filter(Boolean)
                    .join(" ") || "مشتری عطر ویژه"}
                </b>
                <small>
                  {order.phone || "شماره ثبت نشده"} | وضعیت: {order.status}
                </small>
                <small>
                  {Object.entries(order.preferences || {})
                    .map(([key, value]) => key + ": " + String(value))
                    .join(" · ")}
                </small>
                <small>{order.notes || ""}</small>
                <button className="special-delete" disabled={Boolean(orderBusy) || Boolean(action)} onClick={() => deleteSpecialOrder(order.id)}>
                  {orderBusy === order.id ? "در حال حذف..." : "حذف درخواست"}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty">درخواستی ثبت نشده است.</div>
        )}
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
