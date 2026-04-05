import { getDb } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function seed() {
  const db = await getDb();

  // Seed admin
  const adminCheck = await db.execute('SELECT id FROM admins LIMIT 1');
  if (adminCheck.rows.length === 0) {
    await db.execute({
      sql: 'INSERT INTO admins (id, username, password) VALUES (?, ?, ?)',
      args: [uuidv4(), 'admin', hashPassword('admin123')],
    });
    console.log('Admin created: admin / admin123');
  }

  // Seed default settings
  const settingsData = [
    ['site_name', 'FAM.MA'],
    ['site_name_ar', 'فام - أزياء مغربية أصيلة'],
    ['site_description', 'متجر الأزياء والمجوهرات المغربية الراقية'],
    ['site_phone', '+212 600 000 000'],
    ['site_email', 'contact@fam.ma'],
    ['site_address', 'الدار البيضاء، المغرب'],
    ['site_instagram', 'https://instagram.com/fam.ma'],
    ['site_facebook', 'https://facebook.com/fam.ma'],
    ['site_whatsapp', '+212600000000'],
    ['shipping_cost', '0'],
    ['free_shipping_above', '300'],
    ['delivery_time', '24-48 ساعة'],
    ['cod_message', 'الدفع عند الاستلام - بدون أي تكاليف إضافية'],
    ['announcement_bar', '🎉 توصيل مجاني للطلبات فوق 300 درهم | الدفع عند الاستلام'],
    ['footer_text', '© 2024 FAM.MA - جميع الحقوق محفوظة'],
    ['primary_color', '#8B5E3C'],
    ['secondary_color', '#D4A574'],
    ['accent_color', '#C41E3A'],
  ];

  for (const [key, value] of settingsData) {
    await db.execute({
      sql: 'INSERT OR IGNORE INTO site_settings (key, value) VALUES (?, ?)',
      args: [key, value],
    });
  }

  // Seed categories
  const catCheck = await db.execute('SELECT id FROM categories LIMIT 1');
  if (catCheck.rows.length === 0) {
    const categories = [
      { name: 'Clothing', name_ar: 'الملابس', slug: 'clothing', description_ar: 'ملابس مغربية أصيلة - قفاطين، جلابات، تكشيطات وأزياء عصرية', sort_order: 1 },
      { name: 'Jewelry', name_ar: 'المجوهرات', slug: 'jewelry', description_ar: 'مجوهرات مغربية تقليدية وعصرية - فضة، ذهب وإكسسوارات', sort_order: 2 },
    ];

    for (const cat of categories) {
      await db.execute({
        sql: 'INSERT INTO categories (id, name, name_ar, slug, description_ar, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
        args: [uuidv4(), cat.name, cat.name_ar, cat.slug, cat.description_ar, cat.sort_order],
      });
    }
    console.log('Categories seeded');
  }

  // Seed sample products
  const prodCheck = await db.execute('SELECT id FROM products LIMIT 1');
  if (prodCheck.rows.length === 0) {
    const clothingCat = await db.execute("SELECT id FROM categories WHERE slug = 'clothing'");
    const jewelryCat = await db.execute("SELECT id FROM categories WHERE slug = 'jewelry'");
    const clothingId = clothingCat.rows[0]?.id as string | undefined;
    const jewelryId = jewelryCat.rows[0]?.id as string | undefined;

    const products = [
      {
        name: 'Royal Caftan Elegance', name_ar: 'قفطان ملكي أنيق', slug: 'royal-caftan-elegance',
        description_ar: 'قفطان مغربي فاخر مطرز يدوياً بخيوط ذهبية، تصميم ملكي أنيق يجمع بين الأصالة والعصرية.',
        price: 1200, compare_price: 1800, category_id: clothingId, is_featured: 1, is_new: 1, stock: 25,
        sizes: JSON.stringify(['S', 'M', 'L', 'XL']), colors: JSON.stringify(['ذهبي', 'أزرق ملكي', 'أحمر']),
        landing_title_ar: 'قفطان ملكي أنيق - تحفة فنية مغربية',
        landing_subtitle_ar: 'اكتشفي الأناقة المغربية الأصيلة مع قفطاننا الملكي المطرز يدوياً',
        landing_features_ar: JSON.stringify(['تطريز يدوي بخيوط ذهبية حقيقية', 'قماش حرير مغربي فاخر', 'تصميم حصري محدود الإصدار', 'توصيل مجاني - الدفع عند الاستلام']),
        landing_cta_ar: 'اطلبي الآن - الكمية محدودة!', sort_order: 1,
      },
      {
        name: 'Amazigh Silver Necklace', name_ar: 'قلادة أمازيغية فضية', slug: 'amazigh-silver-necklace',
        description_ar: 'قلادة فضية أمازيغية مصنوعة يدوياً من الفضة الخالصة، مستوحاة من الرموز الأمازيغية العريقة.',
        price: 450, compare_price: 650, category_id: jewelryId, is_featured: 1, is_new: 0, stock: 40,
        sizes: JSON.stringify([]), colors: JSON.stringify(['فضي', 'فضي مع ذهبي']),
        landing_title_ar: 'قلادة أمازيغية فضية - تراث بين يديك',
        landing_subtitle_ar: 'قطعة فنية مصنوعة يدوياً من الفضة الخالصة بنقوش أمازيغية أصيلة',
        landing_features_ar: JSON.stringify(['فضة خالصة 925', 'نقوش أمازيغية يدوية', 'شهادة أصالة مرفقة', 'علبة هدايا فاخرة مجاناً']),
        landing_cta_ar: 'احصلي عليها الآن!', sort_order: 2,
      },
      {
        name: 'Modern Djellaba Premium', name_ar: 'جلابة عصرية فاخرة', slug: 'modern-djellaba-premium',
        description_ar: 'جلابة مغربية عصرية بتصميم أنيق يجمع بين الراحة والأناقة.',
        price: 650, compare_price: 900, category_id: clothingId, is_featured: 1, is_new: 1, stock: 30,
        sizes: JSON.stringify(['S', 'M', 'L', 'XL', 'XXL']), colors: JSON.stringify(['أبيض', 'بيج', 'رمادي']),
        landing_title_ar: 'جلابة عصرية فاخرة - أناقة بلا حدود',
        landing_subtitle_ar: 'تصميم عصري يجمع بين التراث المغربي والموضة الحديثة',
        landing_features_ar: JSON.stringify(['قماش كريب فاخر مريح', 'تطريز يدوي دقيق', 'مقاسات متعددة متوفرة', 'ضمان جودة المنتج']),
        landing_cta_ar: 'اطلبي جلابتك الآن!', sort_order: 3,
      },
    ];

    for (const p of products) {
      await db.execute({
        sql: `INSERT INTO products (id, name, name_ar, slug, description_ar, price, compare_price, category_id, 
              is_featured, is_new, stock, sizes, colors, landing_title_ar, landing_subtitle_ar, 
              landing_features_ar, landing_cta_ar, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          uuidv4(), p.name, p.name_ar, p.slug, p.description_ar, p.price, p.compare_price,
          p.category_id ?? null, p.is_featured, p.is_new, p.stock, p.sizes, p.colors,
          p.landing_title_ar, p.landing_subtitle_ar, p.landing_features_ar, p.landing_cta_ar, p.sort_order,
        ],
      });
    }
    console.log('Products seeded');
  }

  console.log('Database seeded successfully!');
}
