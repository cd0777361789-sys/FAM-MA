import { createClient } from '@libsql/client';

const db = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:data/local.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

let initialized = false;

export async function getDb() {
  if (!initialized) {
    await initDb();
    initialized = true;
  }
  return db;
}

async function initDb() {
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS admins (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      name_ar TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      image TEXT,
      description TEXT,
      description_ar TEXT,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      name_ar TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      description_ar TEXT,
      price REAL NOT NULL,
      compare_price REAL,
      category_id TEXT,
      is_featured INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      is_new INTEGER DEFAULT 0,
      stock INTEGER DEFAULT 0,
      sku TEXT,
      sizes TEXT,
      colors TEXT,
      main_image TEXT,
      images TEXT,
      landing_title TEXT,
      landing_title_ar TEXT,
      landing_subtitle TEXT,
      landing_subtitle_ar TEXT,
      landing_features TEXT,
      landing_features_ar TEXT,
      landing_testimonials TEXT,
      landing_cta TEXT,
      landing_cta_ar TEXT,
      landing_gallery TEXT,
      landing_video_url TEXT,
      landing_offer_badge TEXT,
      landing_offer_badge_ar TEXT,
      landing_faq TEXT,
      landing_faq_ar TEXT,
      landing_extra_sections TEXT,
      landing_offers TEXT,
      landing_detail_images TEXT,
      seo_title TEXT,
      seo_description TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_number TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_city TEXT NOT NULL,
      customer_address TEXT NOT NULL,
      product_id TEXT,
      product_name TEXT NOT NULL,
      product_variant TEXT,
      quantity INTEGER DEFAULT 1,
      unit_price REAL NOT NULL,
      total_price REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      notes TEXT,
      source TEXT DEFAULT 'landing',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS offers (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      title_ar TEXT NOT NULL,
      description TEXT,
      description_ar TEXT,
      discount_type TEXT DEFAULT 'percentage',
      discount_value REAL NOT NULL,
      banner_image TEXT,
      product_ids TEXT,
      is_active INTEGER DEFAULT 1,
      start_date DATETIME,
      end_date DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS hero_slides (
      id TEXT PRIMARY KEY,
      title TEXT,
      title_ar TEXT,
      subtitle TEXT,
      subtitle_ar TEXT,
      image TEXT NOT NULL,
      link TEXT,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Add new columns if they don't exist (migration)
  try { await db.execute('ALTER TABLE products ADD COLUMN landing_offers TEXT'); } catch { /* exists */ }
  try { await db.execute('ALTER TABLE products ADD COLUMN landing_detail_images TEXT'); } catch { /* exists */ }
}

export default db;
