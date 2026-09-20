require('dotenv').config();
const mongoose = require('mongoose');

const categoryArtworks = [
  // 1. Painting (Oil / Impasto)
  {
    title: "Symphony in Ochre",
    description: "Deep impasto palette knife strokes blending earthen sienna, raw ochre, and burnished gold leaf on linen canvas.",
    price: 640,
    category: "Painting",
    subcategory: "Oil & Impasto",
    image: "https://images.unsplash.com/photo-1579783901586-d88db74b4fe4?auto=format&fit=crop&w=1200&q=80",
    isPublished: true,
    isSold: false,
    featured: true,
    tags: ["ochre", "impasto", "linen", "abstract painting", "earth"],
    style: "Abstract Expressionism",
    mood: "Warm",
    colorPalette: ["#B8860B", "#8B4513", "#D2691E", "#F5DEB3"],
    altText: "Textured impasto oil painting in warm ochre and sienna tones",
    views: 184,
    visualEmbedding: [0.8, 0.7, 0.2, 0.4, 0.6, 0.3, 0.9, 0.5],
    aiGenerated: {
      isAiAssisted: false,
      suggestedKeywords: ["ochre oil painting", "impasto linen", "warm expressionism"],
      seoTitle: "Symphony in Ochre — Original Impasto Oil Painting",
      seoDescription: "Exquisite impasto oil painting on Belgian linen exploring warm earth tones."
    }
  },
  // 2. Painting (Atmospheric Landscape)
  {
    title: "Midnight Tempest",
    description: "Vigorous cobalt and indigo oil swirls capturing ocean surge beneath an electrifying moonlit squall.",
    price: 590,
    category: "Painting",
    subcategory: "Seascape",
    image: "https://images.unsplash.com/photo-1515405295579-ba7b45403062?auto=format&fit=crop&w=1200&q=80",
    isPublished: true,
    isSold: false,
    featured: false,
    tags: ["ocean", "tempest", "storm", "cobalt", "seascape"],
    style: "Romanticism",
    mood: "Dramatic",
    colorPalette: ["#0B132B", "#1C2541", "#3A506B", "#5BC0BE"],
    altText: "Dramatic storm over crashing midnight ocean waves in deep cobalt",
    views: 220,
    visualEmbedding: [0.2, 0.3, 0.9, 0.8, 0.4, 0.1, 0.5, 0.7],
    aiGenerated: {
      isAiAssisted: false,
      suggestedKeywords: ["ocean storm", "tempest seascape", "dramatic oil painting"],
      seoTitle: "Midnight Tempest — Dramatic Seascape Oil Painting",
      seoDescription: "Original oil painting depicting the raw elemental power of an ocean storm."
    }
  },
  // 3. Digital (Quantum / Generative)
  {
    title: "Quantum Reverie",
    description: "Multi-layered quantum probability waveforms synthesized with mathematical precision and iridescent violet luminescence.",
    price: 460,
    category: "Digital",
    subcategory: "Generative Art",
    image: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1200&q=80",
    isPublished: true,
    isSold: false,
    featured: true,
    tags: ["quantum", "generative", "iridescent", "violet", "digital"],
    style: "Futurism",
    mood: "Mysterious",
    colorPalette: ["#3A0CA3", "#4361EE", "#4CC9F0", "#7209B7"],
    altText: "Glowing iridescent violet and cyan mathematical waveforms in 3D space",
    views: 310,
    visualEmbedding: [0.3, 0.8, 0.9, 0.7, 0.5, 0.2, 0.4, 0.9],
    aiGenerated: {
      isAiAssisted: true,
      suggestedKeywords: ["quantum art", "generative waveforms", "futuristic digital"],
      seoTitle: "Quantum Reverie — Generative Digital Artwork",
      seoDescription: "Limited edition generative digital art exploring quantum aesthetic harmonies."
    }
  },
  // 4. Digital (Cybernetic Floral)
  {
    title: "Cybernetic Blossom",
    description: "Bionic botanical blossom unfolding with fiber-optic petals, neon circuitry, and bioluminescent pollen.",
    price: 380,
    category: "Digital",
    subcategory: "3D Concept Art",
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
    isPublished: true,
    isSold: false,
    featured: false,
    tags: ["cybernetic", "floral", "bionic", "neon", "botanical"],
    style: "Cyberpunk",
    mood: "Energetic",
    colorPalette: ["#F72585", "#7209B7", "#3F37C9", "#4895EF"],
    altText: "Bionic flower glowing with neon pink and purple fiber optic filaments",
    views: 275,
    visualEmbedding: [0.4, 0.9, 0.6, 0.8, 0.3, 0.2, 0.7, 0.8],
    aiGenerated: {
      isAiAssisted: true,
      suggestedKeywords: ["cyberpunk floral", "bionic blossom", "3d concept art"],
      seoTitle: "Cybernetic Blossom — Futuristic Digital 3D Art",
      seoDescription: "Mesmerizing fusion of organic floral beauty and cybernetic circuitry."
    }
  },
  // 5. Sculpture (Brutalist Marble & Obsidian)
  {
    title: "Obsidian Helix",
    description: "Monolithic volcanic obsidian spiral carved with razor-sharp bevels and diamond-polished light-absorbing facets.",
    price: 1450,
    category: "Sculpture",
    subcategory: "Stone Carving",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=80",
    isPublished: true,
    isSold: false,
    featured: true,
    tags: ["obsidian", "sculpture", "helix", "brutalist", "black stone"],
    style: "Brutalism",
    mood: "Intense",
    colorPalette: ["#000000", "#141414", "#2B2B2B", "#5C5C5C"],
    altText: "Towering black obsidian sculpture twisting in a double helix",
    views: 520,
    visualEmbedding: [0.1, 0.1, 0.1, 0.2, 0.9, 0.8, 0.3, 0.2],
    aiGenerated: {
      isAiAssisted: false,
      suggestedKeywords: ["obsidian sculpture", "black stone helix", "brutalist art"],
      seoTitle: "Obsidian Helix — Hand-Carved Obsidian Sculpture",
      seoDescription: "Monumental hand-carved natural volcanic obsidian sculpture."
    }
  },
  // 6. Sculpture (Bronze & Patina)
  {
    title: "Bronze Aegis",
    description: "Lost-wax cast bronze shield form featuring verdigris patina corrosion and polished metallic crests.",
    price: 980,
    category: "Sculpture",
    subcategory: "Cast Bronze",
    image: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80",
    isPublished: true,
    isSold: false,
    featured: false,
    tags: ["bronze", "lost wax", "patina", "verdigris", "sculpture"],
    style: "Classical Contemporary",
    mood: "Inspiring",
    colorPalette: ["#8C6239", "#2E5339", "#D4AF37", "#1E1E1E"],
    altText: "Cast bronze sculptural relief with emerald verdigris patina accents",
    views: 330,
    visualEmbedding: [0.7, 0.5, 0.3, 0.6, 0.8, 0.4, 0.6, 0.5],
    aiGenerated: {
      isAiAssisted: false,
      suggestedKeywords: ["cast bronze", "patina sculpture", "lost wax casting"],
      seoTitle: "Bronze Aegis — Hand-Cast Bronze Fine Art Sculpture",
      seoDescription: "Original cast bronze sculpture celebrating timeless metallurgical craftsmanship."
    }
  },
  // 7. Photography (Nordic Minimalist)
  {
    title: "Nordic Solitude",
    description: "Ethereal minimalist exposure of solitary volcanic basalt stacks surrounded by arctic fog along Iceland's black sand coast.",
    price: 340,
    category: "Photography",
    subcategory: "Landscape",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
    isPublished: true,
    isSold: false,
    featured: true,
    tags: ["nordic", "iceland", "minimalist", "black sand", "fog"],
    style: "Minimalism",
    mood: "Serene",
    colorPalette: ["#1F2421", "#333A33", "#9EA99F", "#DCE1DE"],
    altText: "Moody arctic coast with black sand and misty sea stacks",
    views: 290,
    visualEmbedding: [0.2, 0.2, 0.3, 0.4, 0.8, 0.7, 0.3, 0.4],
    aiGenerated: {
      isAiAssisted: false,
      suggestedKeywords: ["nordic landscape", "iceland photography", "minimalist fog"],
      seoTitle: "Nordic Solitude — Fine Art Landscape Photography",
      seoDescription: "Museum-grade archival print capturing the contemplative beauty of Nordic coasts."
    }
  },
  // 8. Photography (Cinematic Urban)
  {
    title: "Neon Monsoon",
    description: "Reflections of glowing retro-futuristic signs shimmering across asphalt puddles during a tropical midnight cloudburst.",
    price: 320,
    category: "Photography",
    subcategory: "Street & Urban",
    image: "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1200&q=80",
    isPublished: true,
    isSold: false,
    featured: false,
    tags: ["neon", "monsoon", "reflections", "urban", "night street"],
    style: "Cinematic Realism",
    mood: "Dreamy",
    colorPalette: ["#FF0055", "#00F0FF", "#120E2E", "#FFE600"],
    altText: "Vibrant neon reflections bouncing off wet city street asphalt",
    views: 340,
    visualEmbedding: [0.3, 0.8, 0.7, 0.9, 0.4, 0.2, 0.5, 0.8],
    aiGenerated: {
      isAiAssisted: false,
      suggestedKeywords: ["neon street", "rain reflections", "cinematic photography"],
      seoTitle: "Neon Monsoon — Cinematic Urban Night Photography",
      seoDescription: "Archival pigment print capturing the electric poetry of night cityscapes."
    }
  },
  // 9. Illustration (Mythic Narrative)
  {
    title: "Mythos of the Deep",
    description: "Intricate ink and watercolor chronicle depicting legendary sea leviathans navigating luminescent submarine grottos.",
    price: 270,
    category: "Illustration",
    subcategory: "Narrative Art",
    image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=80",
    isPublished: true,
    isSold: false,
    featured: false,
    tags: ["mythology", "leviathan", "deep sea", "watercolor", "ink"],
    style: "Art Nouveau",
    mood: "Mysterious",
    colorPalette: ["#003049", "#D62828", "#FDF0D5", "#669BBC"],
    altText: "Detailed ink and watercolor illustration of mythical oceanic leviathans",
    views: 180,
    visualEmbedding: [0.2, 0.5, 0.8, 0.6, 0.4, 0.8, 0.5, 0.6],
    aiGenerated: {
      isAiAssisted: false,
      suggestedKeywords: ["mythic illustration", "deep sea narrative", "watercolor ink art"],
      seoTitle: "Mythos of the Deep — Original Fine Art Illustration",
      seoDescription: "Exquisite hand-drawn narrative illustration celebrating oceanic folklore."
    }
  },
  // 10. Mixed Media (Textured Tapestry)
  {
    title: "Tapestry of Echoes",
    description: "Raw raw silk fibers woven together with hammered brass filaments, handmade abaca paper, and natural indigo dye.",
    price: 820,
    category: "Mixed Media",
    subcategory: "Fiber Art",
    image: "https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&w=1200&q=80",
    isPublished: true,
    isSold: false,
    featured: true,
    tags: ["fiber art", "silk", "brass", "indigo", "mixed media", "texture"],
    style: "Contemporary Textile",
    mood: "Serene",
    colorPalette: ["#264653", "#2A9D8F", "#E9C46A", "#F4A261"],
    altText: "Textured woven fiber art featuring silk threads, brass accents, and indigo wash",
    views: 410,
    visualEmbedding: [0.6, 0.7, 0.4, 0.3, 0.8, 0.5, 0.7, 0.4],
    aiGenerated: {
      isAiAssisted: false,
      suggestedKeywords: ["fiber art", "contemporary tapestry", "brass textile", "indigo dye"],
      seoTitle: "Tapestry of Echoes — Handwoven Mixed Media Textile",
      seoDescription: "One-of-a-kind sculptural textile art woven from natural silk and brass."
    }
  }
];

async function seedCategoryArtworks() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected for category seeding');

    const usersCollection = mongoose.connection.db.collection('users');
    let artist = await usersCollection.findOne({ role: 'artist' });

    if (!artist) {
      artist = {
        _id: new mongoose.Types.ObjectId(),
        name: 'Elena Rostova'
      };
    }

    const artworksCollection = mongoose.connection.db.collection('artworks');

    const records = categoryArtworks.map(item => ({
      ...item,
      artist: artist._id,
      artistName: artist.name || 'Elena Rostova',
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    const result = await artworksCollection.insertMany(records);
    console.log(`Successfully seeded ${result.insertedCount} category-wise artworks!`);

    const total = await artworksCollection.countDocuments();
    console.log(`Marketplace total artworks now: ${total}`);

    // Print count per category
    const pipeline = [
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ];
    const categoryCounts = await artworksCollection.aggregate(pipeline).toArray();
    console.log('Category distribution:');
    categoryCounts.forEach(c => console.log(` - ${c._id}: ${c.count}`));

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error seeding category artworks:', err);
    process.exit(1);
  }
}

seedCategoryArtworks();
