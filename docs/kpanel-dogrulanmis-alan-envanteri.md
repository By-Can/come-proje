# KPanel Doğrulanmış Alan Envanteri (Kimlikli Ekranlar)

Oluşturulma: 2026-10-22
Yöntem: KPanel'e kullanıcının onayıyla giriş yapıldı (browser profili), kimlikli ekranlar READ-ONLY okundu. Hiçbir kayıt kaydedilmedi/silinmedi. Bu doküman `docs/kpanel-schema-uygulanabilirlik.md` içindeki "UNKNOWN" maddelerini **kanıta bağlayarak kapatır**.

---

## 1. Tam Modül Menüsü (doğrulandı)

- **Anasayfa** `/anasayfa`
- **Acenteler** `/acente-listesi` · **Rezervasyonlar** `/rezervasyon-listesi`
- **Finans:** Acente Hesapları, Tedarikçi Hesapları, Toplu Fatura
- **Satış/Pazarlama:** Bayilik, E-Bülten, Kuponlar, Promosyonlar, **Tarifeler** `/tarife-listesi`, Tedarikçi Tarife
- **Sistem:** **Akıllı Sıralama** `/akilli-siralama`, **Ayarlar** `/ayarlar`, Döviz, Döviz Kurları, Kayıtlar, Kullanıcılar, Ödeme Kayıtları, Tedarikçi Kayıt Kuralları/Kayıtları/Ölçütleri, UI Logları
- **Tanım → Araçlar:** **Araç Listesi** `/arac-listesi`, Grup `/arac-kategorisi`, Marka `/arac-markasi`, Model `/arac-modelleri`, CUG Kodu, Ek Ürünler
- **Tanım → Lokasyonlar:** Eyalet, Lokasyonlar, Şehir `/sehirler`, Özel Ek Ürün Kuralları, Rez İptal Kuralları, Rez Kaynakları, Tedarikçi Grup, Ülke Grupları
- **Tedarikçi:** Eşleştirmeler (araç/ek ürün/lokasyon/import), Kar Marjları, Müsaitlik Sorgusu, Tedarikçiler
- **Web:** 301 Yönlendirmeleri `/yonlendirme`, Anket(ler), **Etiketler** `/etiket-listesi`, **İçerik Grupları** `/icerik-grup-listesi`, **İçerikler** `/icerik-listesi/{typeId}`, Tedarikçi Puan, Üyeler

---

## 2. İçerik (Contents) — İçerik Tipleri (doğrulandı)

`/icerik-listesi/{typeId}` yolları:

| typeId | Tip |
|---|---|
| 1 | Sayfa (Page) |
| 3 | Link |
| 4 | Manşet (Banner) |
| 5 | Form |
| 6 | Lokasyon (Location) |
| 7 | Blog |
| 8 | Tedarikçi (Supplier) |
| 9 | Araç Sınıfı (Vehicle Class) |
| 10 | Tedarikçi Sözleşmesi |
| 11 | Sıkça Sorulan Sorular (FAQ) |
| 12 | Kampanyalar |
| 13 | **Şehir (City)** |
| 14 | Popup |

---

## 3. İçerik Edit Ekranı Alanları (doğrulandı — ana sayfa kaydı ID `-1`, tip "Sayfa" üzerinden)

| Alan (label) | name/id | Tip |
|---|---|---|
| İçerik Aktiflik | (guid) | checkbox |
| Aktif (Dile Göre) | (guid) | checkbox |
| **Sitemap'te Göster** | (guid) | checkbox |
| Sıra (Order) | (guid) | text |
| **Başlık (Header)** | (guid) | text |
| Menüde Göster (IsShowing) | (guid) | checkbox |
| Link Modülü (ModuleId) | (guid) | select |
| Grup | (guid) | select2 |
| **URL (Link)** | (guid) | text |
| **Canonical** | (guid) | text |
| **Meta Title (Title)** | (guid) | text |
| **Meta Description (Description)** | (guid) | textarea |
| Yayın Başlangıç | (guid) | date |
| Yayın Bitiş | (guid) | date |
| Content-Editor | (guid) | TinyMCE (WYSIWYG + "source"/ham HTML) |

- **Dil sekmeleri:** Türkçe / İngilizce / Almanca / Arapça (4 dil). Her dil için yukarıdaki alan seti tekrar eder.
- **Sonuç:** İçerik sayfalarında **ayrı `Meta Title`, `Meta Description`, `Canonical`, `URL(slug)` alanları VAR**. Bu, daha önceki "title/description kaynağı UNKNOWN" sorusunu **çözer** (aşağıda Bölüm 5).
- Editor gövdesi JSON-LD gömme kapasitesine sahip (önceki statik JS incelemesi: `replaceJsonLdCommentToScript`).

---

## 4. Araç (Vehicle) Edit Ekranı Alanları (doğrulandı — araç ID 45 "Audi A4", 57 araç)

| Alan (label) | name/id | Tip |
|---|---|---|
| Aktif | `Active` | checkbox |
| **Araç adı (TR/EN/DE/AR)** | `VehicleClassName` | text |
| Araç Açıklama (TR/EN/DE/AR) | `Description` | textarea |
| SIPP Kod | `SippCode` | text |
| Araç Resmi | `image` | file |
| Grup / Araç Sınıfı | `classId` | select |
| **Marka** | `brandId` | select |
| **Model** | `modelId` | select |
| Kasa / Gövde Tipi | `bodyTypeId` | select |
| Koltuk | `seatCount` | select |
| Bagaj | `luggageCount` | select |
| Vites | `gearTypeId` | select |
| Yakıt | `fuelTypeId` | select |
| Klima | `AirCondition` | checkbox |

**Önemli tespitler:**
- **Fiyat alanı YOK** → fiyat araçta değil, **Tarifeler** (`/tarife-listesi`) veya tedarikçi tarifede tutuluyor (B3 için).
- **Slug/URL alanı YOK** → slug, araç adından (`VehicleClassName`) oto-üretiliyor.
- **SEO/meta alanı YOK** → araç title/meta şablondan üretiliyor (ad + marka + model + yakıt + vites).
- Motor/HP/kapı alanı yok.

---

## 5. Kapanan UNKNOWN'lar

| Önceki UNKNOWN | Sonuç |
|---|---|
| Title/meta-description kaynağı | **ÇÖZÜLDÜ.** İçerik editinde ayrı `Meta Title`, `Meta Description`, `Canonical` alanları var (dil bazlı). |
| Ana sayfa içerik kaydı | **ÇÖZÜLDÜ.** Ana sayfa = İçerik ID `-1`, tip "Sayfa" (typeId 1), `Header` = **"ARAÇ KİRALAMA"** (canlı sitedeki bozuk title'ın kaynağı doğrulandı). |
| Tekil araç alanları (CarsJS) | **ÇÖZÜLDÜ.** Bölüm 4. |
| Araç fiyatı nerede (B3) | **KISMEN.** Araçta fiyat yok → Tarifeler modülü (doğrulanacak alanlar orada). |
| BreadcrumbList şablondan oto-üretimi | Hâlâ UNKNOWN (şablon/template düzeyi, KPanel alanı değil). |

---

## 6. P0/P1 Bulguları → KPanel Alan Eşlemesi (düzeltme hedefi)

| # | Bulgu (kanıt) | KPanel yeri (düzeltme) |
|---|---|---|
| A1 | Ana sayfa title "ARAÇ KİRALAMA -", description "kolayCar" | **İçerikler → Sayfa → ID `-1`** → `Meta Title` + `Meta Description` (ve `Header`) alanları. `Header`="ARAÇ KİRALAMA" doğrulandı; "kolayCar" placeholder'ı `Meta Description` alanından geliyor (alan varlığı doğrulandı, tam değeri okunacak). |
| A2 | Symbol sayfası title/hreflang Clio'ya işaret ediyor | **Araçlar → Araç Listesi → Symbol kaydı** → `VehicleClassName`(TR) / `brandId` / `modelId` tutarlılığı. Slug `VehicleClassName`'den üretildiği için ad düzeltmesi slug/hreflang'ı da düzeltir. |
| B1 | Ana sayfada Organization+WebSite schema yok | **İçerikler → Sayfa → ID `-1`** → Content-Editor gövdesine JSON-LD ekle (editor JSON-LD destekli). |
| B2 | Şehir sayfalarında schema yok | **İçerikler → Şehir (typeId 13) → ilgili şehir kaydı** → Content-Editor gövdesine AutoRental/FAQPage/BreadcrumbList JSON-LD ekle. |
| B3 | Araç Offer/UnitPriceSpecification (fiyat) | Fiyat araçta değil → **Tarifeler** `/tarife-listesi` (alanlar doğrulanacak). |
| P1 | Sitemap sorunları | İçerik editinde **"Sitemap'te Göster"** checkbox'ı mevcut (sitemap'e dahil etme/dışlama). |

---

## 7. Sınırlar

- Fiili `Meta Title`/`Meta Description` alan değerleri (ana sayfa için) son okumada güvenilir yakalanamadı; **alan varlığı kesin doğrulandı**, değer "kolayCar" canlı siteden (public fetch) doğrulandı. Kesin string için operatör ID `-1` kaydını açıp alanı kopyalar.
- Tarifeler modülünün alan envanteri henüz doğrulanmadı (B3 için sıradaki adım).
- Uygulama (yazma) yapılmadı; tüm değişiklikler kullanıcının açık onayıyla ve ilgili KPanel ekranından yapılır.
