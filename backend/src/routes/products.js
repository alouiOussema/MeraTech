const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { z } = require('zod');

// Schema for product validation
const productSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  price: z.number().min(0),
  stock: z.number().int().min(0),
  category: z.string().min(1),
  image: z.string().url()
});

// GET /products - List all products with pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const category = req.query.category;

    const query = {};
    if (category) {
      query.category = category;
    }

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(query);

    res.json({
      products,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalProducts: total
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching products' });
  }
});

// GET /products/:id - Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.status(500).json({ error: 'Server error fetching product' });
  }
});

// POST /products/seed - Seed mock data (Dev only)
router.post('/seed', async (req, res) => {
  try {
    // Check if products already exist
    const count = await Product.countDocuments();
    if (count > 0 && req.query.force !== 'true') {
      return res.status(400).json({ message: 'Database already has products. Use ?force=true to overwrite.' });
    }

    if (req.query.force === 'true') {
      await Product.deleteMany({});
    }

    const mockProducts = [
      {
        name: "زيت زيتونة بكر ممتاز",
        description: "زيت زيتونة تونسي أصيل، عصرة أولى على البارد. مثالي للسلاطة والطبخ.",
        price: 25.500,
        stock: 50,
        category: "مواد غذائية",
        image: "https://images.unsplash.com/photo-1474979266404-7cadd259d366?w=500&q=80"
      },
      {
        name: "دقلة نور رفيعة (1 كغ)",
        description: "تمور دقلة نور من الجنوب التونسي، جودة عالية وطعم حلو طبيعي.",
        price: 12.000,
        stock: 100,
        category: "مواد غذائية",
        image: "https://images.unsplash.com/photo-1550993096-7a8d56b0058e?w=500&q=80"
      },
      {
        name: "كسكسي دياري (1 كغ)",
        description: "كسكسي مفتول باليد بالطريقة التقليدية، حبوب متوسطة.",
        price: 3.500,
        stock: 200,
        category: "مواد غذائية",
        image: "https://images.unsplash.com/photo-1627485937980-221c88ac04f9?w=500&q=80"
      },
      {
        name: "هريسة عربي (500 غ)",
        description: "هريسة تونسية حارة محضرة بالفلفل الأحمر والثوم والتوابل.",
        price: 7.800,
        stock: 80,
        category: "مواد غذائية",
        image: "https://images.unsplash.com/photo-1594488518336-7497d390a42e?w=500&q=80"
      },
      {
        name: "جبة تونسية تقليدية",
        description: "جبة رجالية من القماش الرفيع، تطريز يدوي متقن.",
        price: 150.000,
        stock: 15,
        category: "ملابس تقليدية",
        image: "https://images.unsplash.com/photo-1596483758712-4f7f6311634b?w=500&q=80"
      },
      {
        name: "شاشية تونسية حمراء",
        description: "شاشية شوشة حرة، صناعة يدوية من الصوف الخالص.",
        price: 35.000,
        stock: 40,
        category: "ملابس تقليدية",
        image: "https://images.unsplash.com/photo-1579036986502-3c87f0b54030?w=500&q=80"
      },
      {
        name: "قفة تونسية مزينة",
        description: "قفة من السعف الطبيعي مزينة بألوان زاهية، مثالية للتسوق.",
        price: 20.000,
        stock: 60,
        category: "صناعات تقليدية",
        image: "https://images.unsplash.com/photo-1569388330292-7a0a795b5992?w=500&q=80"
      },
      {
        name: "طقم صحون فخار (6 قطع)",
        description: "صحون فخار مزخرفة باليد، رسومات تقليدية تونسية.",
        price: 85.000,
        stock: 25,
        category: "صناعات تقليدية",
        image: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=500&q=80"
      },
      {
        name: "زربية قيروانية (1.5م x 2م)",
        description: "زربية صوف يدوية عالية الجودة، عقدة صحيحة وألوان ثابتة.",
        price: 450.000,
        stock: 5,
        category: "أثاث وديكور",
        image: "https://images.unsplash.com/photo-1600166898405-da9535204843?w=500&q=80"
      },
      {
        name: "صابون أخضر طبيعي",
        description: "صابون تقليدي بزيت الزيتون، خالي من المواد الكيميائية.",
        price: 2.000,
        stock: 150,
        category: "عناية شخصية",
        image: "https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=500&q=80"
      },
      {
        name: "ماء زهر مقطر (250 مل)",
        description: "ماء زهر طبيعي مقطر بالطريقة التقليدية، نكهة قوية.",
        price: 8.500,
        stock: 70,
        category: "مواد غذائية",
        image: "https://images.unsplash.com/photo-1605218457297-3932a392095f?w=500&q=80"
      },
      {
        name: "طقم شاي (براد و 6 كيسان)",
        description: "طقم شاي معدني منقوش مع كؤوس مزخرفة.",
        price: 55.000,
        stock: 30,
        category: "أواني منزلية",
        image: "https://images.unsplash.com/photo-1578859146522-683ce3960e61?w=500&q=80"
      }
    ];

    await Product.insertMany(mockProducts);
    res.json({ message: 'Database seeded successfully', count: mockProducts.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error seeding products' });
  }
});

module.exports = router;
