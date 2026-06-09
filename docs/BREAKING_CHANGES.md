# Breaking Changes

This file tracks **breaking API changes** in the `reru` web/API repo that require
downstream clients (`reru-android`, future `reru-ios`, `reru-ussd`) to update.

Newest first. Each entry lists what changed, why, and a concrete per-client action
checklist. `docs/api.md` is always the authoritative current contract; this file is the
**migration guide** for getting from the previous contract to the current one.

---

## 2026-06-09 — Phone/OTP auth, profile onboarding, and locations replace zones

**PR:** #4 · **Web commit:** `BREAKING: phone/OTP auth, profile onboarding, and locations replace zones`

Authentication moved from email/password to **phone + SMS OTP** (primary), with
email/password kept as an optional secondary login. The coarse `Zone A/B/C` enum was
replaced by an **admin-managed service-locations** list, and clients gained profiling
fields collected during a new onboarding step.

### TL;DR for client developers

- ✅ **Login still works unchanged** — `POST /api/auth/login` with `{ email, password }`
  is intact (it additionally now accepts `{ phone, password }`). Bearer
  `refresh`/`logout` are unchanged. **Existing clients can still authenticate.**
- ❌ **The `Client` object changed shape** — `zone` is **gone**, replaced by `location`
  (+ `location_id`), and `address` / `plan` / `collection_day` are now **nullable**.
  **This will crash strict JSON parsers** (e.g. the current Dart model) until updated.
- ❌ **`POST /api/auth/register` was removed.** New-user registration is now phone-OTP via
  the Supabase SDK, not a single REST call.

### 1. Endpoints removed

| Endpoint | Replacement |
|---|---|
| `POST /api/auth/register` (email/password JSON signup) | Phone-OTP registration via Supabase SDK (`signInWithOtp` → `verifyOtp`) followed by `POST /api/user/onboarding`. |

### 2. Endpoints added

| Endpoint | Purpose |
|---|---|
| `POST /api/user/onboarding` | Completes a client profile after OTP signup; creates the `reru_clients` row. Body: `location_id`, `plan`, `collection_day`, `address`, `landmark?`, `property_type`, `bin_count`, `alt_phone?`, `alt_phone_is_whatsapp?`, `email?`, `password?`. |
| `GET/POST /api/admin/locations`, `PATCH /api/admin/locations/:id` | Admin-managed service locations (`{ id, name, active, created_at }`). |
| `POST /api/auth/sms-hook` | **Server-to-server only** (Supabase → endpoint). Not called by clients. Delivers OTP via Africa's Talking. |

### 3. Endpoints changed

- **`POST /api/auth/login`** — now accepts **`{ phone, password }`** in addition to
  `{ email, password }`. Response gains a `phone` field on the user object. Non-breaking
  (additive), but mobile can now offer phone+password login.
- **Admin list/filter endpoints** — the `zone` query param is renamed to **`location_id`**
  (a UUID) on `GET /api/admin/collections`, `GET /api/admin/schedule`,
  `GET /api/admin/invoices`. Embedded client objects expose `location` (string) instead of
  `zone`. `GET /api/admin/overview` → `recent_overdue[].client_zone` is now
  `client_location`. CSV export column `Zone` → `Location`.
- **`POST /api/admin/clients`** and **`PATCH /api/admin/clients/:id`** — send
  `location_id` (UUID) instead of `zone`.

### 4. Data model change — `Client`

```diff
  id              string
  user_id         string
  name            string
  phone           string            // E.164, e.g. "+256700000001"
- address         string
+ address         string | null     // now nullable (filled at onboarding)
- zone            "Zone A"|"Zone B"|"Zone C"
+ location_id     string | null     // FK to service_locations
+ location        string | null     // joined service_locations.name (display value)
- collection_day  "Monday".."Friday"
+ collection_day  "Monday".."Friday" | null
- plan            "monthly"|"annual"
+ plan            "monthly"|"annual" | null
  status          "active"|"suspended"|"cancelled"
  paid_through    string | null
  created_at      string
+ landmark              string | null
+ property_type         "household"|"business" | null
+ bin_count             number | null
+ alt_phone             string | null
+ alt_phone_is_whatsapp boolean
```

New model — `ServiceLocation`: `{ id: string, name: string, active: boolean, created_at: string }`.

---

## Action checklist: `reru-android`

The Android app authenticates with email/password (`POST /api/auth/login`) and consumes
the user-facing endpoints (`/api/user/me`, `/dashboard`, `/collections`, `/invoices`),
which return the `Client` object. **The current `Client.fromJson` will throw** because:
`json['zone']` is now absent (`null as String` throws), and `address`/`plan`/`collection_day`
can be `null`.

### Required (prevents runtime crashes)

**`lib/models/client.dart`** — make the model match the new shape:

```dart
class Client {
  final String id;
  final String userId;
  final String name;
  final String phone;
  final String? address;          // now nullable
  final String? locationId;       // was: zone
  final String? location;         // joined location name (display)
  final String? collectionDay;    // now nullable
  final String? plan;             // now nullable
  final String status;
  final String? paidThrough;
  final String createdAt;
  // new profiling fields
  final String? landmark;
  final String? propertyType;     // 'household' | 'business'
  final int? binCount;
  final String? altPhone;
  final bool altPhoneIsWhatsapp;

  const Client({
    required this.id,
    required this.userId,
    required this.name,
    required this.phone,
    this.address,
    this.locationId,
    this.location,
    this.collectionDay,
    this.plan,
    required this.status,
    this.paidThrough,
    required this.createdAt,
    this.landmark,
    this.propertyType,
    this.binCount,
    this.altPhone,
    this.altPhoneIsWhatsapp = false,
  });

  factory Client.fromJson(Map<String, dynamic> json) => Client(
        id: json['id'] as String,
        userId: json['user_id'] as String,
        name: json['name'] as String,
        phone: json['phone'] as String,
        address: json['address'] as String?,
        locationId: json['location_id'] as String?,
        location: json['location'] as String?,
        collectionDay: json['collection_day'] as String?,
        plan: json['plan'] as String?,
        status: json['status'] as String,
        paidThrough: json['paid_through'] as String?,
        createdAt: json['created_at'] as String,
        landmark: json['landmark'] as String?,
        propertyType: json['property_type'] as String?,
        binCount: json['bin_count'] as int?,
        altPhone: json['alt_phone'] as String?,
        altPhoneIsWhatsapp: json['alt_phone_is_whatsapp'] as bool? ?? false,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'user_id': userId,
        'name': name,
        'phone': phone,
        'address': address,
        'location_id': locationId,
        'location': location,
        'collection_day': collectionDay,
        'plan': plan,
        'status': status,
        'paid_through': paidThrough,
        'created_at': createdAt,
        'landmark': landmark,
        'property_type': propertyType,
        'bin_count': binCount,
        'alt_phone': altPhone,
        'alt_phone_is_whatsapp': altPhoneIsWhatsapp,
      };

  bool get isActive => status == 'active';
  bool get isSuspended => status == 'suspended';
}
```

**`lib/screens/profile_screen.dart`** (lines ~104–105) — replace the Zone row:
```dart
// was: label: 'Zone', value: client.zone,
label: 'Location', value: client.location ?? '—',
```

**`lib/screens/dashboard_screen.dart`** (line ~90) — replace `data.client.zone`:
```dart
data.client.location ?? '—',
```

Then `flutter analyze` to catch any other `.zone` / non-null assumptions, and
`flutter pub get && flutter run` to smoke-test login → dashboard → profile.

### Product decisions (not required to avoid crashes, but to reach feature parity)

- **Registration in the app.** The app currently logs in existing users only. New
  phone-OTP registration uses Supabase phone auth (`signInWithOtp`/`verifyOtp`) + the new
  `/api/user/onboarding` step. If/when Android should support sign-up, add the
  `supabase_flutter` SDK (or call GoTrue's OTP endpoints) and build the OTP + onboarding
  screens. **Decision needed:** does v1 Android keep login-only, or add registration?
- **Phone+password login.** Optional: offer `{ phone, password }` to `/api/auth/login` so
  users who set a password during onboarding can log in by phone.
- **Display `location`** wherever the app previously showed `zone`.

---

## Action checklist: `reru-ios` / `reru-ussd` (future)

Same `Client` shape change applies (`zone` → `location`/`location_id`, new nullable +
profiling fields). USSD will additionally need to model the phone-OTP + onboarding flow
when those clients are built.
