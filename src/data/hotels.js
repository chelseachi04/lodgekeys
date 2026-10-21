import { useState, useEffect } from 'react';
import { hotelService } from '../services/hotelService';

export const sampleHotels = [
  {
    id: 1,
    slug: 'the-river-house-retreat',
    name: 'The River House Retreat',
    subTag: 'RESORT · RIVERFRONT',
    badge: 'Curated Stay',
    location: 'Riverfront · Abraka',
    area: 'Riverfront',
    address: 'River Road, Off Ethiope Waterway, Abraka, Delta State',
    category: 'Resort',
    rating: 4.9,
    reviewsCount: 48,
    tagline: 'Slow mornings, tropical gardens, and room to unwind by the River Ethiope.',
    description: 'Slow mornings, tropical gardens, and a little room to unwind by the tranquil waters of Ethiope River.',
    image: '/images/hotel-1.jpg',
    heroImage: '/images/hero-resort.jpg',
    secondaryGallery: {
      main: '/images/hero-resort.jpg',
      top: '/images/room-deluxe.jpg',
      bottom: '/images/resort-lounge.jpg',
    },
    aboutHeadline: 'A little space to feel at home.',
    aboutOverview: 'Slow mornings, tropical gardens, and a little room to unwind by the tranquil waters of Ethiope River. Designed as a sanctuary for both peaceful weekend holidays and restorative extended stays, where every detail is cared for with warm, genuine hospitality.',
    amenities: ['wifi', 'pool', 'restaurant', 'parking', 'garden'],
    price: '₦45,000',
    priceNumeric: 45000,
    priceLabel: 'Rate from',
    roomsAvailable: 4,
    checkIn: '2:00 PM',
    checkOut: '11:00 AM',
    extras: [
      { title: 'Swimming Pool (Lounge)', icon: 'pool' },
      { title: 'Free Wi-Fi (Fiber-optic)', icon: 'wifi' },
      { title: 'Restaurant & Grill', icon: 'restaurant' },
      { title: '24/7 Electricity & Inverter', icon: 'zap' },
      { title: 'Riverfront Dock & Boat Excursions', icon: 'waves' },
      { title: 'Complimentary Local Breakfast', icon: 'utensils' },
    ],
    policies: {
      checkIn: '2:00 PM',
      checkOut: '11:00 AM',
      arrivalPolicy: 'Check-in from 2:00 PM. Government-issued photo identification and security deposit or transfer confirmation required upon check-in.',
      cancellationPolicy: 'Free cancellation up to 48 hours before arrival. Cancellations made within 48 hours are subject to a one-night fee.',
    },
    rooms: [
      {
        id: 'deluxe-garden',
        name: 'Deluxe Garden Room',
        bed: 'King bed',
        capacity: 'Up to 2 guests',
        size: '38 m²',
        view: 'Tropical Garden & Courtyard',
        features: 'King bed · Garden terrace · Rain shower · 2 guests',
        price: '₦45,000',
        priceNumeric: 45000,
        image: '/images/room-deluxe.jpg',
        description: 'Overlooking the lush courtyard palms, with handwoven textiles, rain shower, and a private wooden patio for morning coffee.',
      },
      {
        id: 'executive-suite',
        name: 'Executive Suite',
        bed: 'King bed + Lounge',
        capacity: 'Up to 2 guests',
        size: '56 m²',
        view: 'Direct Riverfront View',
        features: 'King bed + Lounge · River view balcony · 2 guests',
        price: '₦72,000',
        priceNumeric: 72000,
        image: '/images/hotel-1.jpg',
        description: 'Separate living salon, bespoke teak furnishings, direct river breezes, an espresso machine, and dedicated concierge desk.',
      },
      {
        id: 'family-suite',
        name: 'Family Suite',
        bed: 'Two queen beds',
        capacity: 'Up to 4 guests',
        size: '78 m²',
        view: 'Resort Pool & River Outlook',
        features: 'Two queen beds · Up to 4 guests · Double vanity',
        price: '₦110,000',
        priceNumeric: 110000,
        image: '/images/stay-weekend.jpg',
        description: 'Generous interconnected bedrooms with double vanity bathrooms and expansive balcony overlooking the central swimming pool.',
      },
    ],
    galleryImages: [
      { id: 1, url: '/images/hero-resort.jpg', caption: 'Sunset over central lagoon pool', category: 'Grounds & Pool' },
      { id: 2, url: '/images/room-deluxe.jpg', caption: 'Deluxe suite interior with private river verandah', category: 'Rooms' },
      { id: 3, url: '/images/resort-lounge.jpg', caption: 'Evening lantern terrace overlooking River Ethiope', category: 'Dining & Lounge' },
      { id: 4, url: '/images/hotel-1.jpg', caption: 'Exterior facade and private riverfront suites', category: 'Grounds & Pool' },
      { id: 5, url: '/images/stay-weekend.jpg', caption: 'Verandah lounge and garden walkway', category: 'Grounds & Pool' },
      { id: 6, url: '/images/hotel-2.jpg', caption: 'Executive bedroom with king linens', category: 'Rooms' },
      { id: 7, url: '/images/stay-business.jpg', caption: 'River pavilion dining and breakfast lounge', category: 'Dining & Lounge' },
      { id: 8, url: '/images/hotel-3.jpg', caption: 'Private courtyard seating and palm gardens', category: 'Grounds & Pool' },
    ],
  },
  {
    id: 2,
    slug: 'palm-court-suites',
    name: 'Palm Court Suites',
    subTag: 'LUXURY · TOWN CENTRE',
    badge: 'Popular Choice',
    location: 'Town Centre · Abraka',
    area: 'Town Centre',
    address: '14 University Road, Town Centre, Abraka, Delta State',
    category: 'Luxury',
    rating: 4.8,
    reviewsCount: 62,
    tagline: 'An intimate escape with thoughtful spaces and understated elegance.',
    description: 'An intimate escape with thoughtful spaces, bespoke furnishings, and understated elegance.',
    image: '/images/hotel-2.jpg',
    heroImage: '/images/hotel-2.jpg',
    secondaryGallery: {
      main: '/images/hotel-2.jpg',
      top: '/images/room-deluxe.jpg',
      bottom: '/images/resort-lounge.jpg',
    },
    aboutHeadline: 'Urban elegance with peaceful retreat sensibilities.',
    aboutOverview: 'Palm Court Suites combines the vibrant energy of Abraka town centre with secluded interior courtyards and soundproofed luxury suites. Ideal for academic dignitaries, leisure travelers, and discerning guests seeking refined comfort.',
    amenities: ['wifi', 'spa', 'restaurant', 'bar', 'parking'],
    price: '₦38,000',
    priceNumeric: 38000,
    priceLabel: 'Rate from',
    roomsAvailable: 2,
    checkIn: '1:00 PM',
    checkOut: '12:00 PM',
    extras: [
      { title: 'Full-Service Wellness Spa', icon: 'spa' },
      { title: 'Free High-Speed Wi-Fi', icon: 'wifi' },
      { title: 'Fine Dining & Cocktail Bar', icon: 'restaurant' },
      { title: '24/7 Security & Power Backup', icon: 'zap' },
      { title: 'Secure On-Site Parking', icon: 'car' },
    ],
    policies: {
      checkIn: '1:00 PM',
      checkOut: '12:00 PM',
      arrivalPolicy: 'Photo ID and booking voucher required at check-in. Late check-in available on request.',
      cancellationPolicy: 'Free cancellation up to 24 hours prior to scheduled arrival.',
    },
    rooms: [
      {
        id: 'palm-classic',
        name: 'Classic Luxury Suite',
        bed: 'Queen bed',
        capacity: 'Up to 2 guests',
        size: '34 m²',
        view: 'Courtyard View',
        features: 'Queen bed · Marble bath · Work desk · 2 guests',
        price: '₦38,000',
        priceNumeric: 38000,
        image: '/images/room-deluxe.jpg',
        description: 'Tastefully furnished room with premium sound isolation, luxury bath amenities, and smart television.',
      },
      {
        id: 'palm-penthouse',
        name: 'Palm Penthouse Residence',
        bed: 'California King bed',
        capacity: 'Up to 3 guests',
        size: '64 m²',
        view: 'City & Palm Canopy View',
        features: 'California King · Private terrace · Jacuzzi tub',
        price: '₦68,000',
        priceNumeric: 68000,
        image: '/images/hotel-2.jpg',
        description: 'Top floor penthouse suite with deep soaking bathtub, panoramic terrace, and private lounge bar.',
      },
    ],
    galleryImages: [
      { id: 1, url: '/images/hotel-2.jpg', caption: 'Courtyard lounge and shaded pergolas', category: 'Grounds & Pool' },
      { id: 2, url: '/images/room-deluxe.jpg', caption: 'Master suite with private bath', category: 'Rooms' },
      { id: 3, url: '/images/resort-lounge.jpg', caption: 'Palm Court evening restaurant', category: 'Dining & Lounge' },
      { id: 4, url: '/images/stay-business.jpg', caption: 'Cocktail lounge and wine cellar', category: 'Dining & Lounge' },
    ],
  },
  {
    id: 3,
    slug: 'the-garden-residence',
    name: 'The Garden Residence',
    subTag: 'BUSINESS · CAMPUS AREA',
    badge: 'Value Pick',
    location: 'Campus Area · Abraka',
    area: 'Campus Area',
    address: '5 College View Drive, Delta State University Environs, Abraka',
    category: 'Business',
    rating: 4.7,
    reviewsCount: 35,
    tagline: 'A comfortable home base for work, research visits, and weekends.',
    description: 'A comfortable home base for work, research visits, weekends, and everything between.',
    image: '/images/hotel-3.jpg',
    heroImage: '/images/hotel-3.jpg',
    secondaryGallery: {
      main: '/images/hotel-3.jpg',
      top: '/images/room-deluxe.jpg',
      bottom: '/images/stay-business.jpg',
    },
    aboutHeadline: 'Thoughtful spaces crafted for productivity and rest.',
    aboutOverview: 'Situated in the quiet foliage of the university district, The Garden Residence offers executive desks, reliable high-speed connectivity, and serene landscaped lawns.',
    amenities: ['wifi', 'workspace', 'parking', 'garden'],
    price: '₦25,000',
    priceNumeric: 25000,
    priceLabel: 'Rate from',
    roomsAvailable: 6,
    checkIn: '12:00 PM',
    checkOut: '11:00 AM',
    extras: [
      { title: 'Ergonomic Workstations', icon: 'workspace' },
      { title: 'Dual High-Speed Fiber Lines', icon: 'wifi' },
      { title: 'Garden Conference Gazebo', icon: 'garden' },
      { title: '24/7 Steady Power', icon: 'zap' },
    ],
    policies: {
      checkIn: '12:00 PM',
      checkOut: '11:00 AM',
      arrivalPolicy: 'Check-in from 12 noon. Early check-in subject to room availability.',
      cancellationPolicy: 'Free cancellation up to 24 hours prior to check-in.',
    },
    rooms: [
      {
        id: 'garden-study',
        name: 'Executive Study Room',
        bed: 'Queen bed',
        capacity: 'Up to 2 guests',
        size: '30 m²',
        view: 'Garden View',
        features: 'Queen bed · Study desk · Fast Wi-Fi · 2 guests',
        price: '₦25,000',
        priceNumeric: 25000,
        image: '/images/hotel-3.jpg',
        description: 'Air-conditioned quiet room equipped with an executive desk, high-speed fiber internet, and complimentary tea bar.',
      },
      {
        id: 'garden-suite',
        name: 'Deluxe Business Suite',
        bed: 'King bed',
        capacity: 'Up to 2 guests',
        size: '48 m²',
        view: 'Lawn Outlook',
        features: 'King bed · Meeting sofa · Kitchenette',
        price: '₦42,000',
        priceNumeric: 42000,
        image: '/images/room-deluxe.jpg',
        description: 'Spacious open-plan suite with lounge, mini-fridge, microwave, and quiet garden patio.',
      },
    ],
    galleryImages: [
      { id: 1, url: '/images/hotel-3.jpg', caption: 'Verandah overlooking ancient garden trees', category: 'Grounds & Pool' },
      { id: 2, url: '/images/room-deluxe.jpg', caption: 'Clean, serene interior room layout', category: 'Rooms' },
      { id: 3, url: '/images/stay-business.jpg', caption: 'Dedicated co-working study space', category: 'Dining & Lounge' },
    ],
  },
  {
    id: 4,
    slug: 'ethiope-waterside-sanctuary',
    name: 'Ethiope Waterside Sanctuary',
    subTag: 'SIGNATURE LUXURY · RIVERFRONT',
    badge: 'Signature Luxury',
    location: 'Riverfront · Abraka',
    area: 'Riverfront',
    address: 'Old Waterside Way, Ethiope Shore, Abraka, Delta State',
    category: 'Resort',
    rating: 5.0,
    reviewsCount: 84,
    tagline: 'Panoramic river outlooks, private balconies, private boat hire, and luxury spa treatments.',
    description: 'Panoramic river outlooks, private balconies, private boat hire, and luxury spa treatments.',
    image: '/images/hero-resort.jpg',
    heroImage: '/images/hero-resort.jpg',
    secondaryGallery: {
      main: '/images/hero-resort.jpg',
      top: '/images/room-deluxe.jpg',
      bottom: '/images/resort-lounge.jpg',
    },
    aboutHeadline: 'Where the River Ethiope meets world-class boutique hospitality.',
    aboutOverview: 'Perched directly on the tranquil banks of the world-famous Ethiope River, this sanctuary offers private wooden piers, river cabanas, and infinity swimming pools blending seamlessly with the waters.',
    amenities: ['wifi', 'pool', 'spa', 'restaurant', 'bar', 'garden'],
    price: '₦62,000',
    priceNumeric: 62000,
    priceLabel: 'Rate from',
    roomsAvailable: 3,
    checkIn: '3:00 PM',
    checkOut: '12:00 PM',
    extras: [
      { title: 'Riverfront Infinity Pool', icon: 'pool' },
      { title: 'Private River Boat Hire', icon: 'waves' },
      { title: 'Aromatherapy Waterside Spa', icon: 'spa' },
      { title: 'Ethiope Sunset Grill & Lounge', icon: 'restaurant' },
      { title: '24/7 Security & Uninterrupted Power', icon: 'zap' },
    ],
    policies: {
      checkIn: '3:00 PM',
      checkOut: '12:00 PM',
      arrivalPolicy: 'Check-in from 3:00 PM. Complimentary welcome drink served on the waterside deck.',
      cancellationPolicy: 'Free cancellation up to 72 hours prior to arrival.',
    },
    rooms: [
      {
        id: 'waterside-villa',
        name: 'Waterside Panorama Villa',
        bed: 'King bed',
        capacity: 'Up to 2 guests',
        size: '60 m²',
        view: 'Riverfront & Forest',
        features: 'King bed · Direct river deck · Outdoor rain shower',
        price: '₦62,000',
        priceNumeric: 62000,
        image: '/images/room-deluxe.jpg',
        description: 'Stunning villa with floor-to-ceiling glass framing the crystalline river, private outdoor deck, and bespoke timber bath.',
      },
      {
        id: 'presidential-sanctuary',
        name: 'Presidential River Sanctuary',
        bed: 'King bed + Double Daybed',
        capacity: 'Up to 4 guests',
        size: '110 m²',
        view: '360° River & Canopy View',
        features: 'Private plunge pool · Butler service · 4 guests',
        price: '₦145,000',
        priceNumeric: 145000,
        image: '/images/hero-resort.jpg',
        description: 'Our premier residence with a private riverfront plunge pool, dedicated chef option, and expansive sun deck.',
      },
    ],
    galleryImages: [
      { id: 1, url: '/images/hero-resort.jpg', caption: 'Sunset infinity pool with river views', category: 'Grounds & Pool' },
      { id: 2, url: '/images/resort-lounge.jpg', caption: 'Evening lantern dinner overlooking the water', category: 'Dining & Lounge' },
      { id: 3, url: '/images/room-deluxe.jpg', caption: 'Villa bedroom opening to river breezes', category: 'Rooms' },
      { id: 4, url: '/images/hotel-1.jpg', caption: 'Waterside cabanas and palm forest', category: 'Grounds & Pool' },
    ],
  },
  {
    id: 5,
    slug: 'savannah-executive-loft',
    name: 'Savannah Executive Loft',
    subTag: 'BUSINESS · TOWN CENTRE',
    badge: 'Executive',
    location: 'Town Centre · Abraka',
    area: 'Town Centre',
    address: '8 Commercial Avenue, Central Abraka',
    category: 'Business',
    rating: 4.6,
    reviewsCount: 29,
    tagline: 'High-speed dedicated fiber internet, ergonomic workspaces, and central commercial access.',
    description: 'High-speed dedicated fiber optic internet, ergonomic workspaces, and central commercial access.',
    image: '/images/stay-business.jpg',
    heroImage: '/images/stay-business.jpg',
    secondaryGallery: {
      main: '/images/stay-business.jpg',
      top: '/images/room-deluxe.jpg',
      bottom: '/images/hotel-2.jpg',
    },
    aboutHeadline: 'Modern urban loft living in the heart of Abraka.',
    aboutOverview: 'Designed for business travelers and digital nomads requiring reliable amenities, ergonomic furniture, and instant access to banks, dining, and city transport.',
    amenities: ['wifi', 'workspace', 'restaurant', 'parking'],
    price: '₦32,000',
    priceNumeric: 32000,
    priceLabel: 'Rate from',
    roomsAvailable: 5,
    checkIn: '2:00 PM',
    checkOut: '12:00 PM',
    extras: [
      { title: 'Dedicated Fiber Internet', icon: 'wifi' },
      { title: 'Executive Boardroom Access', icon: 'workspace' },
      { title: '24/7 Restaurant & Room Service', icon: 'restaurant' },
    ],
    policies: {
      checkIn: '2:00 PM',
      checkOut: '12:00 PM',
      arrivalPolicy: 'Standard check-in with corporate billing options available.',
      cancellationPolicy: 'Free cancellation up to 24 hours before arrival.',
    },
    rooms: [
      {
        id: 'savannah-loft',
        name: 'Executive Studio Loft',
        bed: 'Queen bed',
        capacity: 'Up to 2 guests',
        size: '35 m²',
        view: 'City Skyline',
        features: 'Queen bed · High speed Wi-Fi · Smart TV · 2 guests',
        price: '₦32,000',
        priceNumeric: 32000,
        image: '/images/stay-business.jpg',
        description: 'Contemporary loft with high ceilings, polished concrete floors, workspace, and en-suite shower.',
      },
    ],
    galleryImages: [
      { id: 1, url: '/images/stay-business.jpg', caption: 'Loft work and dining lounge', category: 'Dining & Lounge' },
      { id: 2, url: '/images/room-deluxe.jpg', caption: 'Quiet bedroom interior', category: 'Rooms' },
    ],
  },
  {
    id: 6,
    slug: 'the-cedar-villa-lodge',
    name: 'The Cedar Villa Lodge',
    subTag: 'BOUTIQUE · RIVERFRONT',
    badge: 'Weekend Favorite',
    location: 'Riverfront · Abraka',
    area: 'Riverfront',
    address: 'Cedar Grove, Old Marina Road, Abraka',
    category: 'Boutique',
    rating: 4.9,
    reviewsCount: 51,
    tagline: 'A secluded architectural oasis hidden among ancient whispering palms.',
    description: 'A secluded architectural oasis hidden among ancient whispering palms and peaceful native shrubs.',
    image: '/images/stay-weekend.jpg',
    heroImage: '/images/stay-weekend.jpg',
    secondaryGallery: {
      main: '/images/stay-weekend.jpg',
      top: '/images/room-deluxe.jpg',
      bottom: '/images/resort-lounge.jpg',
    },
    aboutHeadline: 'Rustic luxury meets peaceful riverside gardens.',
    aboutOverview: 'The Cedar Villa Lodge offers handcrafted timber cabins, private garden verandas, and peaceful river walkways where native birds sing at sunrise.',
    amenities: ['wifi', 'pool', 'bar', 'parking', 'garden'],
    price: '₦42,000',
    priceNumeric: 42000,
    priceLabel: 'Rate from',
    roomsAvailable: 3,
    checkIn: '2:00 PM',
    checkOut: '11:00 AM',
    extras: [
      { title: 'Garden Swimming Pool', icon: 'pool' },
      { title: 'Tiki Cocktail Bar', icon: 'bar' },
      { title: 'Campfire & BBQ Nights', icon: 'restaurant' },
    ],
    policies: {
      checkIn: '2:00 PM',
      checkOut: '11:00 AM',
      arrivalPolicy: 'Government photo ID required upon check-in.',
      cancellationPolicy: 'Free cancellation up to 48 hours prior to check-in.',
    },
    rooms: [
      {
        id: 'cedar-chalet',
        name: 'Cedar Garden Chalet',
        bed: 'King bed',
        capacity: 'Up to 2 guests',
        size: '42 m²',
        view: 'Garden & River Grove',
        features: 'King bed · Timber deck · Coffee bar · 2 guests',
        price: '₦42,000',
        priceNumeric: 42000,
        image: '/images/stay-weekend.jpg',
        description: 'Romantic wooden chalet surrounded by flowering shrubs, featuring a cedar bath tub and hammock deck.',
      },
    ],
    galleryImages: [
      { id: 1, url: '/images/stay-weekend.jpg', caption: 'Cedar lodge garden pathway', category: 'Grounds & Pool' },
      { id: 2, url: '/images/resort-lounge.jpg', caption: 'Night terrace with river ambiance', category: 'Dining & Lounge' },
    ],
  },
  {
    id: 7,
    slug: 'whispering-pines-guesthouse',
    name: 'Whispering Pines Guesthouse',
    subTag: 'BOUTIQUE · DELTA GREEN',
    badge: 'Quiet Escape',
    location: 'Delta Green · Abraka',
    area: 'Delta Green',
    address: 'Pine Valley Road, Delta Green, Abraka',
    category: 'Boutique',
    rating: 4.7,
    reviewsCount: 22,
    tagline: 'Country charm meets modern amenities with farm-to-table breakfast on the garden verandah.',
    description: 'Country charm meets modern amenities with farm-to-table breakfast served on the garden verandah.',
    image: '/images/hotel-1.jpg',
    heroImage: '/images/hotel-1.jpg',
    secondaryGallery: {
      main: '/images/hotel-1.jpg',
      top: '/images/room-deluxe.jpg',
      bottom: '/images/hotel-3.jpg',
    },
    aboutHeadline: 'Country quietude in Delta State green hills.',
    aboutOverview: 'A family-run retreat renowned for its farm-fresh morning meals, fragrant fruit orchards, and tranquil atmosphere away from all city noise.',
    amenities: ['wifi', 'restaurant', 'parking', 'garden'],
    price: '₦28,000',
    priceNumeric: 28000,
    priceLabel: 'Rate from',
    roomsAvailable: 4,
    checkIn: '1:00 PM',
    checkOut: '11:00 AM',
    extras: [
      { title: 'Organic Farm-to-Table Dining', icon: 'restaurant' },
      { title: 'High-Speed Wi-Fi', icon: 'wifi' },
      { title: 'Fruit Orchard Walking Trails', icon: 'garden' },
    ],
    policies: {
      checkIn: '1:00 PM',
      checkOut: '11:00 AM',
      arrivalPolicy: 'Check-in from 1:00 PM.',
      cancellationPolicy: 'Free cancellation up to 24 hours before check-in.',
    },
    rooms: [
      {
        id: 'pine-room',
        name: 'Country Deluxe Room',
        bed: 'Queen bed',
        capacity: 'Up to 2 guests',
        size: '32 m²',
        view: 'Pine Valley & Orchard',
        features: 'Queen bed · Verandah seating · 2 guests',
        price: '₦28,000',
        priceNumeric: 28000,
        image: '/images/hotel-1.jpg',
        description: 'Charming country room with pine furnishings, warm natural light, and homemade breakfast included.',
      },
    ],
    galleryImages: [
      { id: 1, url: '/images/hotel-1.jpg', caption: 'Pines guesthouse morning light', category: 'Grounds & Pool' },
      { id: 2, url: '/images/room-deluxe.jpg', caption: 'Comfortable bedroom with rustic accents', category: 'Rooms' },
    ],
  },
  {
    id: 8,
    slug: 'the-chancellor-residences',
    name: 'The Chancellor Residences',
    subTag: 'LUXURY · CAMPUS AREA',
    badge: 'Scenic View',
    location: 'Campus Area · Abraka',
    area: 'Campus Area',
    address: '22 Chancellor Boulevard, University Heights, Abraka',
    category: 'Luxury',
    rating: 4.8,
    reviewsCount: 39,
    tagline: 'Upscale suites featuring plush king beds, rain showers, and 24-hour dedicated room service.',
    description: 'Upscale suites featuring plush king beds, rain showers, and 24-hour dedicated room service.',
    image: '/images/hotel-2.jpg',
    heroImage: '/images/hotel-2.jpg',
    secondaryGallery: {
      main: '/images/hotel-2.jpg',
      top: '/images/room-deluxe.jpg',
      bottom: '/images/resort-lounge.jpg',
    },
    aboutHeadline: 'Premier accommodations for visiting faculty and distinguished travelers.',
    aboutOverview: 'An architect-designed boutique residence offering generous floor plans, high-end Italian tiles, rain showers, and 24-hour dedicated room service.',
    amenities: ['wifi', 'spa', 'workspace', 'restaurant', 'parking'],
    price: '₦48,000',
    priceNumeric: 48000,
    priceLabel: 'Rate from',
    roomsAvailable: 2,
    checkIn: '2:00 PM',
    checkOut: '12:00 PM',
    extras: [
      { title: '24-Hour Room Service', icon: 'restaurant' },
      { title: 'Dedicated Workspace & Library', icon: 'workspace' },
      { title: 'Private Spa & Steam Room', icon: 'spa' },
      { title: 'Guaranteed 24/7 Power', icon: 'zap' },
    ],
    policies: {
      checkIn: '2:00 PM',
      checkOut: '12:00 PM',
      arrivalPolicy: 'Check-in from 2:00 PM with photo ID.',
      cancellationPolicy: 'Free cancellation up to 48 hours prior to arrival.',
    },
    rooms: [
      {
        id: 'chancellor-regal',
        name: 'Regal King Suite',
        bed: 'King bed',
        capacity: 'Up to 2 guests',
        size: '52 m²',
        view: 'Panoramic Campus Green',
        features: 'King bed · Marble bath · Espresso machine',
        price: '₦48,000',
        priceNumeric: 48000,
        image: '/images/hotel-2.jpg',
        description: 'Sophisticated suite with plush king-sized mattress, custom wardrobe, deep rain shower, and evening turn-down service.',
      },
    ],
    galleryImages: [
      { id: 1, url: '/images/hotel-2.jpg', caption: 'Courtyard colonnade and gardens', category: 'Grounds & Pool' },
      { id: 2, url: '/images/room-deluxe.jpg', caption: 'Master bedroom suite', category: 'Rooms' },
      { id: 3, url: '/images/resort-lounge.jpg', caption: 'Chancellor library and dining room', category: 'Dining & Lounge' },
    ],
  },
];

export const OVERRIDES_STORAGE_KEY = 'lodgekeys_hotel_overrides_v1';
export const MGR_SETTINGS_KEY = 'lodgekeys_manager_settings_v1';

export function getHotelOverrides(slug) {
  try {
    const raw = localStorage.getItem(OVERRIDES_STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data && data[slug]) return data[slug];
    }
    // Fallback: check manager settings if slug matches manager's hotel
    if (slug === 'the-river-house-retreat') {
      const mgrRaw = localStorage.getItem(MGR_SETTINGS_KEY);
      if (mgrRaw) {
        const mgr = JSON.parse(mgrRaw);
        return mgr;
      }
    }
  } catch (e) {
    console.error('Failed reading hotel overrides', e);
  }
  return null;
}

export function applyHotelOverrides(base, overrides) {
  if (!overrides) return base;

  // Extract policies
  const checkIn = overrides.checkInTime || overrides.policies?.checkIn || overrides.checkIn || base.checkIn || '2:00 PM';
  const checkOut = overrides.checkOutTime || overrides.policies?.checkOut || overrides.checkOut || base.checkOut || '11:00 AM';
  const arrivalPolicy = overrides.arrivalPolicy || overrides.policies?.arrivalPolicy || base.policies?.arrivalPolicy || 'Government-issued photo ID required on arrival.';
  const cancellationPolicy = overrides.cancellationPolicy || overrides.policies?.cancellationPolicy || base.policies?.cancellationPolicy || 'Free cancellation up to 48 hours before arrival.';

  const policies = {
    ...base.policies,
    checkIn,
    checkOut,
    arrivalPolicy,
    cancellationPolicy,
  };

  // Extract amenities & extras
  let extras = base.extras;
  let amenities = base.amenities;

  if (Array.isArray(overrides.amenitiesList)) {
    const enabledItems = overrides.amenitiesList.filter(a => a.enabled !== false);
    extras = enabledItems.map(a => ({
      title: a.name,
      icon: a.icon || 'star',
      id: a.id,
      isCustom: Boolean(a.isCustom),
    }));
    amenities = enabledItems.map(a => a.id.toLowerCase());
  } else if (overrides.amenities && typeof overrides.amenities === 'object' && !Array.isArray(overrides.amenities)) {
    // Legacy object format { wifi: true, pool: false, ... }
    const AMENITY_NAMES = {
      wifi: 'Free Wi-Fi (Fiber-optic)',
      pool: 'Swimming Pool (Lounge)',
      restaurant: 'Restaurant & Grill',
      parking: 'Secure On-site Parking',
      garden: 'Private Riverfront Garden',
      spa: 'Wellness Spa & Massage',
      workspace: 'Executive Business Workspace',
      bar: 'Cocktail Bar & Lounge',
    };
    const activeKeys = Object.entries(overrides.amenities)
      .filter(([_, v]) => Boolean(v))
      .map(([k]) => k);

    amenities = activeKeys;
    extras = activeKeys.map(k => ({
      title: AMENITY_NAMES[k] || k.charAt(0).toUpperCase() + k.slice(1),
      icon: k,
      id: k,
    }));
  }

  // Dynamic rooms sync from manager inventory or overrides
  let rooms = base.rooms;
  let roomsAvailable = base.roomsAvailable;
  let minPrice = base.priceNumeric;

  if (Array.isArray(overrides.managerRooms) && overrides.managerRooms.length > 0) {
    const activeRooms = overrides.managerRooms.filter(r => r.isActive !== false);
    const availableUnits = activeRooms.filter(r => r.status === 'available');
    roomsAvailable = availableUnits.length;

    // Group inventory rooms by category/tier to build public room offerings
    const grouped = overrides.managerRooms.reduce((acc, r) => {
      const tier = r.tier || 'Standard Room';
      if (!acc[tier]) acc[tier] = [];
      acc[tier].push(r);
      return acc;
    }, {});

    rooms = Object.entries(grouped).map(([tierName, units]) => {
      const baseRoom = (base.rooms || []).find(br => br.name?.toLowerCase() === tierName.toLowerCase()) || {};
      const sampleUnit = units[0] || {};
      const unitPrices = units.map(u => Number(u.pricePerNight) || 0).filter(p => p > 0);
      const tierPrice = unitPrices.length > 0 ? Math.min(...unitPrices) : (baseRoom.priceNumeric || 45000);
      const availableCount = units.filter(u => u.status === 'available' && u.isActive !== false).length;

      const slugId = baseRoom.id || ('room_' + tierName.toLowerCase().replace(/[^a-z0-9]+/g, '_'));

      return {
        id: slugId,
        name: tierName,
        bed: sampleUnit.bed || baseRoom.bed || 'King bed',
        capacity: sampleUnit.capacity || baseRoom.capacity || 'Up to 2 guests',
        size: baseRoom.size || '40 m²',
        view: baseRoom.view || 'Resort Garden & Courtyard View',
        features: `${sampleUnit.bed || baseRoom.bed || 'King bed'} · ${sampleUnit.capacity || baseRoom.capacity || '2 guests'} · Floor ${sampleUnit.floor || 1}`,
        price: '₦' + Number(tierPrice).toLocaleString('en-NG'),
        priceNumeric: tierPrice,
        image: sampleUnit.image || baseRoom.image || '/images/room-deluxe.jpg',
        description: baseRoom.description || `Spacious and beautifully maintained ${tierName} with climate control, en-suite bathroom, and premium amenities.`,
        availableCount,
        totalUnits: units.length,
      };
    });

    if (rooms.length > 0) {
      const prices = rooms.map(r => r.priceNumeric).filter(p => p > 0);
      if (prices.length > 0) {
        minPrice = Math.min(...prices);
      }
    }
  } else if (Array.isArray(overrides.rooms)) {
    rooms = overrides.rooms;
    roomsAvailable = overrides.roomsAvailable !== undefined ? overrides.roomsAvailable : base.roomsAvailable;
  }

  const isDelisted = Boolean(overrides.isDelisted);
  const isDeleted = Boolean(overrides.isDeleted);

  return {
    ...base,
    priceNumeric: minPrice,
    price: '₦' + Number(minPrice).toLocaleString('en-NG'),
    checkIn,
    checkOut,
    contactPhone: overrides.contactPhone || base.contactPhone || '+234 803 000 0001',
    contactEmail: overrides.contactEmail || base.contactEmail || 'info@riverhouseretreat.ng',
    website: overrides.website || base.website || 'www.riverhouseretreat.ng',
    policies,
    extras,
    amenities,
    rooms,
    roomsAvailable,
    isDelisted,
    isDeleted,
  };
}

const CUSTOM_HOTELS_STORAGE_KEY = 'lodgekeys_custom_hotels_v1';

export function getCustomHotels() {
  try {
    const raw = localStorage.getItem(CUSTOM_HOTELS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomHotel(hotelData) {
  try {
    const current = getCustomHotels();
    const existingIdx = current.findIndex(h => h.slug === hotelData.slug);
    let updated;
    if (existingIdx !== -1) {
      updated = [...current];
      updated[existingIdx] = { ...updated[existingIdx], ...hotelData, updatedAt: new Date().toISOString() };
    } else {
      updated = [hotelData, ...current];
    }
    localStorage.setItem(CUSTOM_HOTELS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('lodgekeys_hotel_updated', {
      detail: { slug: hotelData.slug }
    }));
    window.dispatchEvent(new Event('storage'));
    return updated;
  } catch (e) {
    console.error('Failed saving custom hotel', e);
    return [];
  }
}

export function publishNewHotel(appData) {
  const slug = appData.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || `hotel-${Date.now()}`;

  const priceNum = Number(appData.priceNumeric || appData.startingRate || 40000);

  const newHotel = {
    id: `custom-${Date.now()}`,
    slug,
    name: appData.name,
    subTag: `${(appData.category || 'BOUTIQUE').toUpperCase()} · ${(appData.area || 'ABRAKA').toUpperCase()}`,
    badge: 'Newly Approved',
    location: `${appData.area || 'Abraka'} · Abraka`,
    area: appData.area || 'Town Centre',
    address: appData.address || `${appData.name}, ${appData.area || 'Abraka'}, Delta State`,
    category: appData.category || 'Boutique',
    rating: 4.8,
    reviewsCount: 1,
    tagline: appData.description || 'A thoughtfully designed stay in Abraka.',
    description: appData.description || 'A thoughtfully designed stay in Abraka offering genuine local hospitality and comfort.',
    image: appData.image || '/images/hotel-1.jpg',
    heroImage: appData.heroImage || '/images/hero-resort.jpg',
    secondaryGallery: {
      main: appData.image || '/images/hotel-1.jpg',
      top: '/images/room-deluxe.jpg',
      bottom: '/images/resort-lounge.jpg',
    },
    aboutHeadline: `Welcome to ${appData.name}.`,
    aboutOverview: appData.description || 'Offering refined comfort and thoughtful spaces for guests traveling to Abraka.',
    amenities: ['wifi', 'parking', 'restaurant', 'zap'],
    price: '₦' + priceNum.toLocaleString('en-NG'),
    priceNumeric: priceNum,
    priceLabel: 'Rate from',
    roomsAvailable: Number(appData.roomsAvailable || appData.totalRooms || 6),
    checkIn: '2:00 PM',
    checkOut: '11:00 AM',
    contactPhone: appData.contactPhone || '+234 803 000 0000',
    contactEmail: appData.contactEmail || 'stay@lodgekeys.com',
    website: appData.website || '',
    policies: {
      checkIn: '2:00 PM',
      checkOut: '11:00 AM',
      arrivalPolicy: 'Check-in from 2:00 PM. Photo ID and confirmation voucher required.',
      cancellationPolicy: 'Free cancellation up to 48 hours before scheduled arrival.',
    },
    extras: [
      { title: 'Free High-speed Wi-Fi', icon: 'wifi' },
      { title: '24/7 Power & Inverter', icon: 'zap' },
      { title: 'Secure On-site Parking', icon: 'car' },
    ],
    rooms: [
      {
        id: `${slug}-deluxe`,
        name: 'Deluxe Room',
        bed: 'King bed',
        capacity: 'Up to 2 guests',
        size: '36 m²',
        view: 'Courtyard View',
        features: 'King bed · En-suite bath · Air conditioning',
        price: '₦' + priceNum.toLocaleString('en-NG'),
        priceNumeric: priceNum,
        image: '/images/room-deluxe.jpg',
        description: 'Spacious en-suite room with luxury linens, quiet climate control, and modern shower.',
      },
    ],
    galleryImages: [
      { id: 1, url: '/images/hotel-1.jpg', caption: 'Property entrance and exterior', category: 'Grounds & Pool' },
      { id: 2, url: '/images/room-deluxe.jpg', caption: 'Deluxe guest room', category: 'Rooms' },
    ],
    isDelisted: false,
    isDeleted: false,
  };

  saveCustomHotel(newHotel);
  return newHotel;
}

export function getStoredHotelBySlug(slug, { includeDeleted = false } = {}) {
  if (!slug) return null;
  const custom = getCustomHotels();
  const allBases = [...sampleHotels, ...custom];
  const base = allBases.find((h) => h.slug.toLowerCase() === slug.toLowerCase());
  if (!base) return null;
  const overrides = getHotelOverrides(base.slug);
  const hotel = overrides ? applyHotelOverrides(base, overrides) : base;
  if (!includeDeleted && hotel.isDeleted) return null;
  return hotel;
}

export function getStoredHotels({ includeDelisted = false, includeDeleted = false } = {}) {
  const custom = getCustomHotels();
  const allBases = [...sampleHotels, ...custom];
  return allBases
    .map(h => {
      const overrides = getHotelOverrides(h.slug);
      return overrides ? applyHotelOverrides(h, overrides) : h;
    })
    .filter(h => {
      if (!includeDeleted && h.isDeleted) return false;
      if (!includeDelisted && h.isDelisted) return false;
      return true;
    });
}

export function saveHotelOverrides(slug, overrides) {
  try {
    const raw = localStorage.getItem(OVERRIDES_STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : {};
    data[slug] = {
      ...(data[slug] || {}),
      ...overrides,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(OVERRIDES_STORAGE_KEY, JSON.stringify(data));

    // Also sync to MGR_SETTINGS_KEY if slug matches manager hotel
    if (slug === 'the-river-house-retreat') {
      localStorage.setItem(MGR_SETTINGS_KEY, JSON.stringify(data[slug]));
    }

    // Broadcast across windows and components
    window.dispatchEvent(new CustomEvent('lodgekeys_hotel_updated', {
      detail: { slug, overrides: data[slug] }
    }));
  } catch (e) {
    console.error('Failed saving hotel overrides', e);
  }
}

export function syncHotelRooms(slug, managerRooms) {
  saveHotelOverrides(slug, { managerRooms });
}

export function setHotelDelisted(slug, isDelisted) {
  saveHotelOverrides(slug, { isDelisted: Boolean(isDelisted) });
}

export function deleteHotel(slug) {
  saveHotelOverrides(slug, { isDeleted: true });
}

export function restoreHotel(slug) {
  saveHotelOverrides(slug, { isDeleted: false, isDelisted: false });
}

export function getHotelBySlug(slug, options) {
  return getStoredHotelBySlug(slug, options);
}

// React Hook to get live reactive hotel
export function useHotel(slug, options) {
  const optionsKey = options ? JSON.stringify(options) : '';
  const [hotel, setHotel] = useState(() => getStoredHotelBySlug(slug, options));

  useEffect(() => {
    let isMounted = true;
    setHotel(getStoredHotelBySlug(slug, options));

    if (slug) {
      hotelService.getHotelBySlugAsync(slug, options).then((live) => {
        if (isMounted && live) {
          setHotel(live);
        }
      }).catch((err) => {
        console.warn('Error fetching live hotel:', err);
      });
    }

    const handleUpdate = (e) => {
      if (!slug) return;
      if (!e.detail?.slug || e.detail.slug.toLowerCase() === slug.toLowerCase()) {
        hotelService.getHotelBySlugAsync(slug, options).then((live) => {
          if (isMounted && live) {
            setHotel(live);
          } else if (isMounted) {
            setHotel(getStoredHotelBySlug(slug, options));
          }
        }).catch(() => {
          if (isMounted) setHotel(getStoredHotelBySlug(slug, options));
        });
      }
    };

    const handleStorage = (e) => {
      if (e.key === OVERRIDES_STORAGE_KEY || e.key === MGR_SETTINGS_KEY) {
        setHotel(getStoredHotelBySlug(slug, options));
      }
    };

    window.addEventListener('lodgekeys_hotel_updated', handleUpdate);
    window.addEventListener('storage', handleStorage);

    return () => {
      isMounted = false;
      window.removeEventListener('lodgekeys_hotel_updated', handleUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, [slug, optionsKey]);

  return hotel;
}

// React Hook to get live reactive list of all hotels
export function useHotels() {
  const [hotels, setHotels] = useState(() => getStoredHotels());

  useEffect(() => {
    let isMounted = true;

    hotelService.getHotelsAsync().then((liveHotels) => {
      if (isMounted && liveHotels && liveHotels.length > 0) {
        setHotels(liveHotels);
      }
    }).catch((err) => {
      console.warn('Error fetching live hotels:', err);
    });

    const handleUpdate = () => {
      hotelService.getHotelsAsync().then((liveHotels) => {
        if (isMounted && liveHotels && liveHotels.length > 0) {
          setHotels(liveHotels);
        } else if (isMounted) {
          setHotels(getStoredHotels());
        }
      }).catch(() => {
        if (isMounted) setHotels(getStoredHotels());
      });
    };

    const handleStorage = (e) => {
      if (e.key === OVERRIDES_STORAGE_KEY || e.key === MGR_SETTINGS_KEY) {
        setHotels(getStoredHotels());
      }
    };

    window.addEventListener('lodgekeys_hotel_updated', handleUpdate);
    window.addEventListener('storage', handleStorage);

    return () => {
      isMounted = false;
      window.removeEventListener('lodgekeys_hotel_updated', handleUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  return hotels;
}


export const stayCategories = [
  {
    id: 1,
    image: '/images/stay-weekend.jpg',
    title: 'A weekend',
    subtitle: 'away',
    href: '/explore?category=resort&features=pool',
  },
  {
    id: 2,
    image: '/images/stay-business.jpg',
    title: 'Business,',
    subtitle: 'beautifully',
    href: '/explore?category=business&features=workspace',
  },
  {
    id: 3,
    image: '/images/hotel-3.jpg',
    title: 'Comfort within',
    subtitle: 'reach',
    href: '/explore?tier=budget-friendly',
  },
  {
    id: 4,
    image: '/images/hotel-2.jpg',
    title: 'A little more',
    subtitle: 'luxury',
    href: '/explore?tier=luxury&minRating=4.5',
  },
];

export const faqData = [
  {
    id: 1,
    question: 'Can I book a real stay through this preview?',
    answer:
      'Not yet. This is an early visual preview of Lodgekeys. The sample properties and prices are illustrative and are not available for booking through this page.',
  },
  {
    id: 2,
    question: 'Which hotels will be on Lodgekeys?',
    answer:
      'We plan to feature carefully presented accommodation options in Abraka, with clear information to help guests decide where to stay.',
  },
  {
    id: 3,
    question: 'How can my hotel join?',
    answer:
      'Hotel owners and property managers will be able to express interest in listing their properties as the platform develops.',
  },
];

export const benefitsData = [
  {
    icon: 'camera',
    title: 'See the stay',
    description: 'Room photography to help you choose with confidence.',
  },
  {
    icon: 'clipboard',
    title: 'Know what to expect',
    description: 'Clear information, considered choices, no guesswork.',
  },
  {
    icon: 'compass',
    title: 'Find your own corner',
    description: 'Explore the neighbourhoods that feel right for you.',
  },
  {
    icon: 'heart',
    title: 'A local connection',
    description: 'A warmer welcome, with people who know the place.',
  },
];
