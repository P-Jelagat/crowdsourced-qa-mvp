const productTypes = [
  {
    category: "Ceramic Mug",
    slug: "mug",
    basePrice: 1200,
  },
  {
    category: "Ceramic Plate",
    slug: "plate",
    basePrice: 1500,
  },
  {
    category: "Ceramic Vase",
    slug: "vase",
    basePrice: 2500,
  },
  {
    category: "Ceramic Grinder",
    slug: "grinder",
    basePrice: 1800,
  },
  {
    category: "Ceramic Bowl",
    slug: "bowl",
    basePrice: 1400,
  },
];

const vendors = [
  {
    id: "V001",
    name: "Clay & Co.",
    style: "Sage green and minimalist",
    description: "Timeless ceramics inspired by nature.",
  },
  {
    id: "V002",
    name: "Terra Studio",
    style: "Blue floral patterns",
    description: "Expressive ceramics with artistic details.",
  },
  {
    id: "V003",
    name: "The Pottery Room",
    style: "Rustic earthy finishes",
    description: "Handcrafted pieces with a rustic character.",
  },
  {
    id: "V004",
    name: "Earth & Form",
    style: "Minimalist neutral designs",
    description: "Simple forms for contemporary homes.",
  },
  {
    id: "V005",
    name: "Kiln House",
    style: "Warm terracotta designs",
    description: "Warm colours and distinctive shapes.",
  },
  {
    id: "V006",
    name: "Mud & Matter",
    style: "Abstract artistic designs",
    description: "Bold ceramics inspired by modern art.",
  },
  {
    id: "V007",
    name: "Kipepeo Ceramics",
    style: "Floral and botanical designs",
    description: "Nature-inspired pieces for everyday living.",
  },
  {
    id: "V008",
    name: "Ochre Studio",
    style: "Earthy colours and textures",
    description: "Organic forms and natural colour palettes.",
  },
  {
    id: "V009",
    name: "The Clay Garden",
    style: "Botanical patterns",
    description: "Ceramics inspired by gardens and nature.",
  },
  {
    id: "V010",
    name: "Form & Fire",
    style: "Contemporary sculptural designs",
    description: "Distinctive shapes and modern craftsmanship.",
  },
];

const vendorImageFolders = {
  V001: "clay-co",
  V002: "terra-studio",
  V003: "pottery-room",
  V004: "earth-form",
  V005: "kiln-house",
  V006: "mud-matter",
  V007: "kipepeo",
  V008: "ochre-studio",
  V009: "clay-garden",
  V010: "form-fire",
};

const products = vendors.flatMap((vendor, vendorIndex) =>
  productTypes.map((type, productIndex) => ({
    id: `${vendor.id}-P${productIndex + 1}`,
    vendorId: vendor.id,
    vendorName: vendor.name,
    name: `${vendor.name} ${type.category}`,
    category: type.category,
    categorySlug: type.slug,
    style: vendor.style,
    price: type.basePrice + vendorIndex * 100,

    description: `${type.category} featuring ${vendor.style.toLowerCase()}.`,

    image: `/images/products/${vendorImageFolders[vendor.id]}/${type.slug}.png`,

    isAvailable: true,
  }))
);

export { vendors, products, productTypes };
