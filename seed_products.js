require('dotenv').config();
const mongoose = require('mongoose');

const newArtworks = [
  {
    title: "Celestial Whispers",
    description: "A deep dive into interstellar currents, blending deep obsidian space with luminous cyan aurora threads.",
    price: 420,
    category: "Digital",
    subcategory: "Generative Art",
    image: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1200&q=80",
    isPublished: true,
    isSold: false,
    featured: true,
    tags: ["celestial", "space", "nebula", "digital art"],
    style: "Abstract",
    mood: "Dreamy",
    colorPalette: ["#0B0C10", "#1F2833", "#C5C6C7", "#66FCF1"],
    altText: "Luminous cyan aurora and swirling nebula across deep obsidian space",
    views: 145,
    visualEmbedding: [0.1, 0.4, 0.9, 0.2, 0.8, 0.1, 0.3, 0.7],
    aiGenerated: {
      isAiAssisted: true,
      suggestedKeywords: ["nebula", "aurora", "cosmic", "deep space"],
      seoTitle: "Celestial Whispers — Premium Digital Art",
      seoDescription: "Immerse in cosmic serenity with Celestial Whispers digital artwork."
    }
  },
  {
    title: "Whispering Dunes",
    description: "High-contrast architectural shadows cast by sunrise across rolling desert crests in fine art ochre and terracotta.",
    price: 310,
    category: "Photography",
    subcategory: "Landscape",
    image: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80",
    isPublished: true,
    isSold: false,
    featured: false,
    tags: ["desert", "sand", "dunes", "minimalist", "nature"],
    style: "Minimalism",
    mood: "Serene",
    colorPalette: ["#E29578", "#FFDDD2", "#83C5BE", "#006D77"],
    altText: "Curved desert sand dunes during golden hour with sharp ridges",
    views: 112,
    visualEmbedding: [0.8, 0.6, 0.2, 0.1, 0.3, 0.4, 0.9, 0.2],
    aiGenerated: {
      isAiAssisted: false,
      suggestedKeywords: ["desert", "sand dunes", "golden hour", "minimalist landscape"],
      seoTitle: "Whispering Dunes — Fine Art Landscape Photography",
      seoDescription: "Exquisite fine art photography capturing the silent serenity of sand dunes."
    }
  },
  {
    title: "The Golden Alchemist",
    description: "Tactile genuine 24k gold leaf layered over oxidized patinas, exploring human transformation and timeless resilience.",
    price: 750,
    category: "Mixed Media",
    subcategory: "Gilded Canvas",
    image: "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?auto=format&fit=crop&w=1200&q=80",
    isPublished: true,
    isSold: false,
    featured: true,
    tags: ["gold leaf", "alchemy", "mixed media", "texture"],
    style: "Contemporary",
    mood: "Inspiring",
    colorPalette: ["#D4AF37", "#1A1A1A", "#8B0000", "#FFF8DC"],
    altText: "Textured canvas with genuine gold leaf and deep crimson hues",
    views: 340,
    visualEmbedding: [0.9, 0.8, 0.1, 0.5, 0.2, 0.7, 0.4, 0.8],
    aiGenerated: {
      isAiAssisted: false,
      suggestedKeywords: ["gold leaf", "contemporary canvas", "alchemist", "luxury art"],
      seoTitle: "The Golden Alchemist — Handcrafted Mixed Media Artwork",
      seoDescription: "Original gilded mixed media artwork featuring authentic 24k gold leaf."
    }
  },
  {
    title: "Prism Resonance",
    description: "Calculated dispersion of white light into radiant volumetric caustics and kaleidoscopic spectral bands.",
    price: 390,
    category: "Digital",
    subcategory: "Generative",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
    isPublished: true,
    isSold: false,
    featured: false,
    tags: ["prism", "light", "refraction", "spectrum"],
    style: "Abstract",
    mood: "Energetic",
    colorPalette: ["#FF007F", "#7928CA", "#0070F3", "#00DFD8"],
    altText: "Prismatic light refraction with glowing neon chromatic spectrum",
    views: 215,
    visualEmbedding: [0.3, 0.9, 0.7, 0.8, 0.4, 0.2, 0.6, 0.9],
    aiGenerated: {
      isAiAssisted: true,
      suggestedKeywords: ["prismatic", "refraction", "neon spectral", "generative art"],
      seoTitle: "Prism Resonance — Neon Geometric Digital Art",
      seoDescription: "Mesmerizing prismatic color spectrum created with advanced computational graphics."
    }
  },
  {
    title: "Monolith of Silence",
    description: "Hand-carved Carrara marble column featuring brutalist bevels that cast shifting natural shadows throughout the day.",
    price: 1200,
    category: "Sculpture",
    subcategory: "Stone Sculpture",
    image: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=80",
    isPublished: true,
    isSold: false,
    featured: true,
    tags: ["marble", "sculpture", "monolith", "geometry"],
    style: "Minimalism",
    mood: "Mysterious",
    colorPalette: ["#F8F9FA", "#E9ECEF", "#6C757D", "#212529"],
    altText: "Monolithic white marble sculpture with sharp angular facets",
    views: 480,
    visualEmbedding: [0.2, 0.1, 0.1, 0.3, 0.9, 0.5, 0.2, 0.4],
    aiGenerated: {
      isAiAssisted: false,
      suggestedKeywords: ["marble sculpture", "brutalist monolith", "fine stone art"],
      seoTitle: "Monolith of Silence — Hand-Carved Marble Sculpture",
      seoDescription: "Exquisite hand-carved stone sculpture capturing architectural minimalism."
    }
  },
  {
    title: "Midnight in Kyoto",
    description: "Atmospheric cinematic long-exposure through historic stone-paved lantern-lit alleyways of Gion during monsoon drizzle.",
    price: 290,
    category: "Photography",
    subcategory: "Urban",
    image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80",
    isPublished: true,
    isSold: false,
    featured: false,
    tags: ["kyoto", "japan", "lantern", "night", "street"],
    style: "Contemporary",
    mood: "Melancholic",
    colorPalette: ["#050505", "#8A1C14", "#E09F3E", "#2B2D42"],
    altText: "Traditional Kyoto alleyway illuminated by glowing red paper lanterns at night",
    views: 195,
    visualEmbedding: [0.1, 0.2, 0.3, 0.7, 0.4, 0.6, 0.2, 0.8],
    aiGenerated: {
      isAiAssisted: false,
      suggestedKeywords: ["kyoto night", "japan street photography", "lantern reflection"],
      seoTitle: "Midnight in Kyoto — Atmospheric Street Photography",
      seoDescription: "Cinematic night photography in Kyoto's historical Gion district."
    }
  },
  {
    title: "Botanical Reverie",
    description: "Delicate ink and gouache study of rare midnight-blooming orchids and interlocking organic tendrils.",
    price: 240,
    category: "Illustration",
    subcategory: "Botanical Art",
    image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=80",
    isPublished: true,
    isSold: false,
    featured: false,
    tags: ["botanical", "flora", "illustration", "nature"],
    style: "Contemporary",
    mood: "Serene",
    colorPalette: ["#2D6A4F", "#52B788", "#D8F3DC", "#1B4332"],
    altText: "Intricate botanical illustration of flowering orchids in forest green hues",
    views: 160,
    visualEmbedding: [0.4, 0.8, 0.3, 0.1, 0.2, 0.9, 0.5, 0.3],
    aiGenerated: {
      isAiAssisted: false,
      suggestedKeywords: ["botanical illustration", "floral art", "gouache painting", "orchids"],
      seoTitle: "Botanical Reverie — Fine Botanical Illustration",
      seoDescription: "Masterful botanical illustration celebrating organic floral patterns."
    }
  },
  {
    title: "Urban Kinetic",
    description: "High-speed palette knife strokes embodying the relentless pulse and vertical architecture of modern megalopolises.",
    price: 580,
    category: "Painting",
    subcategory: "Oil Painting",
    image: "https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?auto=format&fit=crop&w=1200&q=80",
    isPublished: true,
    isSold: false,
    featured: true,
    tags: ["urban", "city", "speed", "acrylic", "motion"],
    style: "Expressionism",
    mood: "Energetic",
    colorPalette: ["#EF4444", "#3B82F6", "#F59E0B", "#111827"],
    altText: "Vibrant abstract skyline painted with dynamic palette knife strokes",
    views: 310,
    visualEmbedding: [0.7, 0.5, 0.8, 0.6, 0.3, 0.1, 0.7, 0.5],
    aiGenerated: {
      isAiAssisted: false,
      suggestedKeywords: ["urban cityscape", "palette knife painting", "kinetic art"],
      seoTitle: "Urban Kinetic — Expressionist City Skyline Painting",
      seoDescription: "Bold expressionist original painting depicting city movement and rhythm."
    }
  },
  {
    title: "Luminescence IV",
    description: "Deep abyssal bioluminescent currents glowing beneath the surface of an alien ocean, rendered in crisp ultra-definition.",
    price: 360,
    category: "Digital",
    subcategory: "Surreal Digital",
    image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80",
    isPublished: true,
    isSold: false,
    featured: false,
    tags: ["glow", "bioluminescence", "digital", "ocean"],
    style: "Surrealism",
    mood: "Dreamy",
    colorPalette: ["#03071E", "#370617", "#6A040F", "#9D0208"],
    altText: "Bioluminescent red and gold ripples in deep dark waters",
    views: 230,
    visualEmbedding: [0.2, 0.3, 0.6, 0.8, 0.5, 0.7, 0.1, 0.9],
    aiGenerated: {
      isAiAssisted: true,
      suggestedKeywords: ["bioluminescence", "deep ocean", "digital fantasy", "surreal water"],
      seoTitle: "Luminescence IV — Bioluminescent Digital Artwork",
      seoDescription: "Immerse in the glowing wonder of underwater bioluminescence."
    }
  },
  {
    title: "Genesis in Clay",
    description: "Fired terracotta vessel twisted into organic Möbius loops, uniting ancient ancestral ceramics with mathematical infinity.",
    price: 890,
    category: "Sculpture",
    subcategory: "Ceramic Sculpture",
    image: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=1200&q=80",
    isPublished: true,
    isSold: false,
    featured: true,
    tags: ["ceramic", "terracotta", "sculpture", "earth"],
    style: "Contemporary",
    mood: "Inspiring",
    colorPalette: ["#B05B3B", "#D79771", "#FFEBC9", "#4E2718"],
    altText: "Twisted terracotta ceramic sculpture with warm earthy matte glaze",
    views: 410,
    visualEmbedding: [0.6, 0.4, 0.2, 0.5, 0.8, 0.3, 0.7, 0.6],
    aiGenerated: {
      isAiAssisted: false,
      suggestedKeywords: ["terracotta sculpture", "contemporary ceramic", "mobius loop"],
      seoTitle: "Genesis in Clay — Handcrafted Terracotta Sculpture",
      seoDescription: "Stunning contemporary ceramic sculpture merging heritage with modern geometry."
    }
  }
];

async function seedTenProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected successfully');

    const usersCollection = mongoose.connection.db.collection('users');
    let artist = await usersCollection.findOne({ role: 'artist' });

    if (!artist) {
      console.log('No artist found, using default artist ID');
      artist = {
        _id: new mongoose.Types.ObjectId(),
        name: 'Elena Rostova'
      };
    }

    const artworksCollection = mongoose.connection.db.collection('artworks');

    const artworksToInsert = newArtworks.map(art => ({
      ...art,
      artist: artist._id,
      artistName: artist.name || 'Elena Rostova',
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const result = await artworksCollection.insertMany(artworksToInsert);
    console.log(`Successfully inserted ${result.insertedCount} new luxury products/artworks!`);

    const totalCount = await artworksCollection.countDocuments();
    console.log(`Total artworks in marketplace now: ${totalCount}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding products:', error);
    process.exit(1);
  }
}

seedTenProducts();
