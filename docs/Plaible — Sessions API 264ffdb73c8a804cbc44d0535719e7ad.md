# Plaible — Sessions API

## **Overview**

Sessionlar, bir kullanıcının belirli bir hikâyedeki (story) oynanışını, ilerlemesini ve günlük (log) kayıtlarını tutar. Krediler **bölüm başında** düşülür. Tüm endpoint’ler **JWT cookie** ile kimlik doğrulaması gerektirir.

## **Error Format**

Her hata gövdesi:

{ "error": "ERROR_CODE", "field": "optional_field" }

Başlıca kodlar: UNAUTHENTICATED, BAD_REQUEST, NOT_FOUND, INSUFFICIENT_CREDITS, SERVER_ERROR.

---

## **POST**

## **/api/sessions/start**

Hikâyeye yeni oturum başlatır. Eğer aynı kullanıcı + aynı hikâye için **tamamlanmamış** bir oturum varsa, **yenisini yaratmaz**, onu döner. İlk bölüm için kredi düşümü idempotent: aynı bölüm için daha önce düşüm varsa tekrar ücret kesilmez.

**Body**

{
"storySlug": "the-picture-of-dorian-gray",
"characterId": "chr_dorian",
"roleIds": ["role_hero"] // optional
}

**Responses**

- 200

{
"sessionId": "ObjectId",
"story": { "title": "The Picture of Dorian Gray", "slug": "the-picture-of-dorian-gray" },
"progress": { "chapter": 1, "chapterCountApprox": 10, "completed": false },
"wallet": { "balance": 190 }
}

- 400 → { "error": "BAD_REQUEST", "field": "storySlug|characterId|roleIds" }
- 402 → { "error": "INSUFFICIENT_CREDITS", "needed": 10, "balance": 0 }
- 404 → { "error": "NOT_FOUND" } (story veya user yoksa)
- 401 → { "error": "UNAUTHENTICATED" }

---

## **GET**

## **/api/sessions/active**

Kullanıcının **tamamlanmamış** en güncel oturumunu getirir.

**Query**

- storySlug (opsiyonel): Belirli bir hikâye için aktif oturumu getirir.

**Response**

- 200

{
"sessionId": "ObjectId",
"story": { "title": "…", "slug": "…" },
"progress": { "chapter": 3, "chapterCountApprox": 10, "completed": false },
"wallet": { "balance": 170 }
}

- 404 → { "error": "NOT_FOUND" }
- 401 → { "error": "UNAUTHENTICATED" }

## **GET**

## **/api/sessions**

Kullanıcının oturumlarını listeler (sayfalı).

**Query**

- status: active|completed|all (default: active)
- limit: 1..50 (default: 20)
- cursor: Sonraki sayfa için _id tabanlı cursor.

**Response**

- 200

{
"items": [
{
"_id": "ObjectId",
"story": { "title": "…", "slug": "…" },
"progress": { "chapter": 5, "chapterCountApprox": 10, "completed": false },
"updatedAt": "ISO"
}
],
"nextCursor": "ObjectId(optional)"
}

- 401 → { "error": "UNAUTHENTICATED" }

---

## **POST**

## **/api/sessions/:id/choice**

Seçim yapar, serbest metin ekler; advanceChapter: true gelirse bir sonraki bölüme geçmeden **kredi düşer** (idempotent). Yeterli bakiye yoksa 402 döner.

**Body**

{
"chosen": "explore",            // optional
"freeText": "Look behind...",   // optional, max 1000 char
"advanceChapter": true          // optional
}

**Responses**

- 200

{
"sessionId": "ObjectId",
"progress": { "chapter": 4, "chapterCountApprox": 10, "completed": false },
"log": [ /* last few entries */ ],
"wallet": { "balance": 160 }    // sadece düşüm olduysa döner
}

- 400 → { "error": "BAD_REQUEST", "field": "freeText" }
- 402 → { "error": "INSUFFICIENT_CREDITS", "needed": 10, "balance": 0 }
- 404 → { "error": "NOT_FOUND" }
- 401 → { "error": "UNAUTHENTICATED" }

## **POST**

## **/api/sessions/:id/complete**

Oturumu tamamlar (idempotent). İsteğe bağlı yıldız ve kısa yorum kaydeder (max 250 char). Tamamlandıktan sonra tekrar çağrı aynı durumu döner.

**Body (optional)**

{ "stars": 5, "text": "Loved the arc." }

**Responses**

- 200

{
"sessionId": "ObjectId",
"progress": { "chapter": 10, "chapterCountApprox": 10, "completed": true },
"finale": { "requested": true, "requestedAt": "ISO" },
"rating": { "stars": 5, "text": "Loved the arc." }
}

- 400 → { "error": "BAD_REQUEST", "field": "stars|text" }
- 404 → { "error": "NOT_FOUND" }
- 401 → { "error": "UNAUTHENTICATED" }

---

## **GET**

## **/api/sessions/:id**

Tek bir oturumu döner (sahiplik doğrulaması).

**Response**

- 200 → Tam Session döner.
- 404 / 401

---

## **Indexes (Session)**

- userId + storyId unique (partial: "progress.completed": false) → tek aktif oturum garantisi
- userId, updatedAt → listeleme/aktif sorguları
- storyId, progress.completed → raporlama

---

## **Notes**

- Tüm kredi işlemleri WalletTransaction ile kayıt altına alınır (partial unique: userId+storyId+chapter+type=deduct).
- Bakiye okuma/yazma user.wallet.balance üzerinden yapılır.
- Tüm endpoint’ler tutarlı hata gövdeleri döner.