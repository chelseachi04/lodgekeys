-- ==============================================================================
-- Lodgekeys Database Foundation — Development Seed Data
-- ==============================================================================
-- Note: Contains development sample records matching existing frontend demo data.
-- No real guest accounts, passwords, or fabricated verified payments are included.
-- ==============================================================================

-- 1. Default Platform Settings
INSERT INTO public.platform_settings (key, value, description)
VALUES (
    'platform_commission',
    '{"platformCommission": 10, "tourismLevyVat": 5, "escrowHoldDays": 1, "autoPublishApproved": true, "supportEmail": "support@lodgekeys.com", "supportPhone": "+234 800 563 4353"}'::jsonb,
    'Global platform commission, VAT, escrow rules, and operational contact info.'
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 2. Add-On Services (Global Catalogue)
INSERT INTO public.add_on_services (id, hotel_id, title, price, price_formatted, description, icon, is_active)
VALUES
    ('pool-pass', NULL, 'Swimming Pool & Cabana Pass', 5000.00, '₦5,000', 'Day pass for resort lagoon pool, towel service & reserved private shaded cabana.', 'waves', true),
    ('gym-access', NULL, 'Gym & Fitness Center Access', 3500.00, '₦3,500', 'Full pass to air-conditioned fitness studio, weights, cardio gear & infused hydration bar.', 'dumbbell', true),
    ('river-kayak', NULL, 'Ethiope River Boat Ride / Kayak Tour', 12000.00, '₦12,000', '1-hour guided boat excursion or crystalline river kayak tour with life vests included.', 'ship', true)
ON CONFLICT (id) DO UPDATE SET 
    title = EXCLUDED.title,
    price = EXCLUDED.price,
    price_formatted = EXCLUDED.price_formatted,
    description = EXCLUDED.description;

-- 3. Core Development Sample Hotels
INSERT INTO public.hotels (
    id, slug, name, sub_tag, badge, location, area, address, category,
    latitude, longitude, rating, reviews_count, tagline, description,
    about_headline, about_overview, image_url, hero_image_url,
    amenities, extras, contact_email, contact_phone, check_in_time, check_out_time,
    starting_rate, is_published, is_delisted, is_deleted
) VALUES
(
    '00000000-0000-0000-0000-000000000001',
    'the-river-house-retreat',
    'The River House Retreat',
    'RESORT · RIVERFRONT',
    'Curated Stay',
    'Riverfront · Abraka',
    'Riverfront',
    'River Road, Off Ethiope Waterway, Abraka, Delta State',
    'Resort',
    5.7891, 6.1032, 4.9, 48,
    'Slow mornings, tropical gardens, and room to unwind by the River Ethiope.',
    'Slow mornings, tropical gardens, and a little room to unwind by the tranquil waters of Ethiope River.',
    'A little space to feel at home.',
    'Slow mornings, tropical gardens, and a little room to unwind by the tranquil waters of Ethiope River. Designed as a sanctuary for both peaceful weekend holidays and restorative extended stays.',
    '/images/hotel-1.jpg',
    '/images/hero-resort.jpg',
    ARRAY['wifi', 'pool', 'restaurant', 'parking', 'garden'],
    '[
        {"title": "Swimming Pool (Lounge)", "icon": "pool"},
        {"title": "Free Wi-Fi (Fiber-optic)", "icon": "wifi"},
        {"title": "Restaurant & Grill", "icon": "restaurant"},
        {"title": "24/7 Electricity & Inverter", "icon": "zap"},
        {"title": "Riverfront Dock & Boat Excursions", "icon": "waves"},
        {"title": "Complimentary Local Breakfast", "icon": "utensils"}
    ]'::jsonb,
    'info@riverhouseretreat.ng',
    '+234 803 000 0001',
    '2:00 PM',
    '11:00 AM',
    45000.00,
    true, false, false
),
(
    '00000000-0000-0000-0000-000000000002',
    'palm-court-suites',
    'Palm Court Suites',
    'LUXURY · TOWN CENTRE',
    'Popular Choice',
    'Town Centre · Abraka',
    'Town Centre',
    '14 University Road, Town Centre, Abraka, Delta State',
    'Luxury',
    5.7915, 6.1089, 4.8, 62,
    'An intimate escape with thoughtful spaces and understated elegance.',
    'An intimate escape with thoughtful spaces, bespoke furnishings, and understated elegance.',
    'Urban elegance with peaceful retreat sensibilities.',
    'Palm Court Suites combines the vibrant energy of Abraka town centre with secluded interior courtyards and soundproofed luxury suites.',
    '/images/hotel-2.jpg',
    '/images/hotel-2.jpg',
    ARRAY['wifi', 'spa', 'restaurant', 'bar', 'parking'],
    '[
        {"title": "Full-Service Wellness Spa", "icon": "spa"},
        {"title": "Free High-Speed Wi-Fi", "icon": "wifi"},
        {"title": "Fine Dining & Cocktail Bar", "icon": "restaurant"},
        {"title": "24/7 Security & Power Backup", "icon": "zap"},
        {"title": "Secure On-Site Parking", "icon": "car"}
    ]'::jsonb,
    'reservations@palmcourt.ng',
    '+234 802 000 0002',
    '1:00 PM',
    '12:00 PM',
    38000.00,
    true, false, false
),
(
    '00000000-0000-0000-0000-000000000003',
    'the-garden-residence',
    'The Garden Residence',
    'BOUTIQUE · CAMPUS GATE',
    'Top Rated',
    'Campus Gate · Abraka',
    'Campus Gate',
    'Plot 6 College Crescent, Adjacent DELSU Main Gate, Abraka',
    'Boutique',
    5.7960, 6.0980, 4.7, 39,
    'Tranquil courtyards, workspace comforts, and thoughtful hospitality.',
    'Tranquil courtyards, dedicated workspace comforts, and thoughtful hospitality near DELSU main gate.',
    'Designed for scholars, travelers, and discerning visitors.',
    'Surrounded by indigenous botanical trees, The Garden Residence offers executive peace steps away from university facilities.',
    '/images/hotel-3.jpg',
    '/images/hotel-3.jpg',
    ARRAY['wifi', 'parking', 'restaurant', 'workspace'],
    '[
        {"title": "Dedicated Workspace & Fiber Wi-Fi", "icon": "workspace"},
        {"title": "Quiet Courtyard Garden", "icon": "garden"},
        {"title": "24/7 Power Assurance", "icon": "zap"},
        {"title": "Executive Breakfast Lounge", "icon": "utensils"}
    ]'::jsonb,
    'contact@gardenresidence.ng',
    '+234 805 000 0003',
    '2:00 PM',
    '12:00 PM',
    25000.00,
    true, false, false
)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    starting_rate = EXCLUDED.starting_rate,
    is_published = EXCLUDED.is_published,
    is_delisted = EXCLUDED.is_delisted;

-- 4. Room Categories for The River House Retreat
INSERT INTO public.room_categories (
    id, hotel_id, slug, name, bed_configuration, capacity, max_guests,
    room_size, view_description, features, base_rate_nightly, image_url, description, is_active
) VALUES
(
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'deluxe-garden',
    'Deluxe Garden Room',
    'King bed',
    'Up to 2 guests',
    2,
    '38 m²',
    'Tropical Garden & Courtyard',
    'King bed · Garden terrace · Rain shower · 2 guests',
    45000.00,
    '/images/room-deluxe.jpg',
    'Overlooking the lush courtyard palms, with handwoven textiles, rain shower, and a private wooden patio for morning coffee.',
    true
),
(
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'executive-suite',
    'Executive Suite',
    'King bed + Lounge',
    'Up to 2 guests',
    2,
    '56 m²',
    'Direct Riverfront View',
    'King bed + Lounge · River view balcony · 2 guests',
    72000.00,
    '/images/hotel-1.jpg',
    'Separate living salon, bespoke teak furnishings, direct river breezes, an espresso machine, and dedicated concierge desk.',
    true
),
(
    '10000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'family-suite',
    'Family Suite',
    'Two queen beds',
    'Up to 4 guests',
    4,
    '78 m²',
    'Resort Pool & River Outlook',
    'Two queen beds · Up to 4 guests · Double vanity',
    110000.00,
    '/images/stay-weekend.jpg',
    'Generous interconnected bedrooms with double vanity bathrooms and expansive balcony overlooking the central swimming pool.',
    true
)
ON CONFLICT (hotel_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    base_rate_nightly = EXCLUDED.base_rate_nightly,
    bed_configuration = EXCLUDED.bed_configuration,
    capacity = EXCLUDED.capacity;

-- 5. Individual Physical Rooms for The River House Retreat
INSERT INTO public.rooms (hotel_id, category_id, room_number, floor, operational_status, is_active, last_cleaned_at)
VALUES
    ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '101', 1, 'available', true, CURRENT_DATE),
    ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '102', 1, 'available', true, CURRENT_DATE),
    ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '103', 1, 'available', true, CURRENT_DATE),
    ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', '201', 2, 'available', true, CURRENT_DATE),
    ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', '204', 2, 'available', true, CURRENT_DATE),
    ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', '205', 2, 'maintenance', false, CURRENT_DATE - INTERVAL '5 days'),
    ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', '301', 3, 'available', true, CURRENT_DATE),
    ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', '308', 3, 'available', true, CURRENT_DATE)
ON CONFLICT (hotel_id, room_number) DO UPDATE SET
    operational_status = EXCLUDED.operational_status,
    is_active = EXCLUDED.is_active;

-- 6. Sample Hotel Applications
INSERT INTO public.hotel_applications (
    reference_code, name, slug, owner_name, contact_email, contact_phone,
    area, address, category, starting_rate, total_rooms, documents, description, status, submitted_at
) VALUES
(
    'APP-2026-081',
    'Royal Palms Hotel & Suites',
    'royal-palms-hotel-suites',
    'Chief Donald Eke',
    'donald.eke@royalpalmsabraka.ng',
    '+234 802 334 1122',
    'Town Centre',
    '22 Commercial Boulevard, Abraka Town Centre, Delta State',
    'Luxury',
    55000.00,
    24,
    'CAC RC-149201 · Delta State Tourism Board Approval · Fire Safety Certificate',
    'Premier 4-star hospitality offering modern executive suites, swimming pool terrace, and conference facilities.',
    'pending',
    now() - INTERVAL '2 hours'
),
(
    'APP-2026-079',
    'Campus View Executive Inn',
    'campus-view-executive-inn',
    'Dr. Angela Okonjo',
    'contact@campusviewinn.com',
    '+234 813 550 9988',
    'Campus Area',
    '8 University Crescent, Adjacent DELSU Gate 2, Abraka',
    'Boutique',
    28000.00,
    16,
    'Business Registration BN-9923 · DELSU Commercial Zoning Permit',
    'Quiet boutique inn specially designed for visiting academics, researchers, and dignitaries.',
    'pending',
    now() - INTERVAL '5 hours'
)
ON CONFLICT (reference_code) DO NOTHING;
