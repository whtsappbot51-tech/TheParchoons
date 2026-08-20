const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');

dotenv.config();

async function markFeatured() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB.');

    const products = await Product.find({});
    
    // Pick 15 random products to be featured
    const shuffled = products.sort(() => 0.5 - Math.random());
    const featured = shuffled.slice(0, 15);
    
    let count = 0;
    for (const p of featured) {
      p.isFeatured = true;
      p.isBestSeller = true;
      // Mark half of them as on offer
      if (Math.random() > 0.5) {
        p.isOnOffer = true;
        p.offerText = '10% OFF';
      }
      await p.save();
      count++;
    }

    console.log(`Successfully marked ${count} products as featured/bestseller/offer.`);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

markFeatured();
