# KPanel'de Schema (Yapısal Veri) Uygulanabilirlik İncelemesi

Oluşturulma: 2026-10-21
Amaç: `docs/rakip-analizi-2026-10.md` içindeki schema şablonu önerilerinin (Organization + AutoRental + FAQPage + BreadcrumbList) KPanel üzerinden nasıl/uygulanıp uygulanamayacağını, doğrulanmış bilgilerle belirlemek.
Durum: **READ-ONLY, Evidence-First.** Hiçbir canlı değişiklik yapılmadı. Doğrulanmamış her şey `UNKNOWN` işaretlendi.

---

## 1. Kısa Sonuç (TL;DR)

- **KPanel'de ayrı/dedicated bir "schema" modülü YOKTUR** (doğrulanmış modüller: içerik, yönlendirme, etiket, şehir, lokasyon, araç kategorisi).
- **AMA** 21 Eki 2026 statik JS incelemesiyle doğrulandı: **Contents (içerik) editörü "source" (ham HTML) modu ve `replaceJsonLdCommentToScript(html)` yardımcısı taşıyor → JSON-LD schema içerik gövdesine gömülebilir.** Yani şehir/ana sayfa schema'sı, ilgili içerik kaydının HTML gövdesine yazılarak eklenebilir (INFERRED — gerçek KPanel arayüzündeki alan doğrulaması gerekir, Bölüm 5).
- **Kritik ayrım:** araç sayfalarında schema ZATEN oto-üretiliyor (FAQPage + Brand + EngineSpecification + QuantitativeValue). Buradaki sorun "schema eklemek" değil, schema'nın dayandığı **veriyi** (Symbol↔Clio ad/slug tutarsızlığı) düzeltmektir.

---

## 2. Doğrulanmış KPanel Modül Envanteri

Kaynak: `docs/kpanel-known-facts.md` (doğrulanmış GET rotaları) + `tools/kpanel-static-js-*.mjs` içindeki statik JS asset listeleri (doğrulanmış modül dosyaları).

| Modül (JS dizini) | İlgili doğrulanmış rota / endpoint adayı | Görev alanı |
| --- | --- | --- |
| ContentsJS (`contents.common.js`) | `/icerik-listesi/*`, `/Contents/GetContents`, `/Contents/BulkUpdateContentOrder` | İçerik sayfaları/sıralama |
| ContentGroupsJS (`content-groups.common.js`) | `/icerik-grup-listesi` | İçerik grupları |
| RedirectionsJS (`redirections.create.js`) | `/yonlendirme`, `/Redirections/SaveNewRedirection` | Yönlendirme |
| LabelsJS (`labels.common.js`) | `/etiket-listesi`, `/Labels/GetLabels` | Etiketler |
| CitiesJS (`cities.common.js`) | `/sehirler`, `/Cities/GetCities` | Şehir verisi |
| LocationJS (`locations.common.js`, `locations-vendor.modal.js`) | `/lokasyon-listesi`, `/Locations/BulkUpdateLocationStatus`, `/Locations/GetExcelReport` | Lokasyon/ofis verisi |
| VehicleGroupsJS (`vehicle-groups.common.js`) | `/arac-kategorisi`, `/VehicleGroups/GetVehicleGroups` | Araç grubu/kategori verisi |

**Doğrulanmış sonuç:** Bu listede **ayrı bir schema, JSON-LD, SEO-meta veya header/footer enjeksiyon modülü YOKTUR.** Ancak aşağıda (Bölüm 2b) doğrulandığı gibi, **Contents editörü JSON-LD gömme kapasitesine sahiptir** — schema ayrı bir modülde değil, içerik gövdesinde yönetilir.

---

## 2b. Doğrulanmış Alan Envanteri (21 Eki 2026, public statik JS)

`kpanel.comerent.net/assets/js/kpaneljs/*` altındaki **public** statik JS dosyalarından çıkarılan alanlar. Kimlikli rotalara (`/icerik-listesi/*` vb.) erişilmedi; bu envanter yalnızca public JS kodundan gelir.

### Contents (içerik) — en kritik modül
Kaynak: `ContentsJS/contents.create.js` + `contents.common.js`.
- **İçerik seviyesi alanlar:** `LocationId`, `VehicleClassId`, `VendorId`, `CouponId`, `CityId`, `CountryId`, `CreateDate`, `StartDate`, `EndDate`, `newcontenttypeId` (içerik tipi).
- **Dil bazlı alanlar (ContentLanguages):** `Header` (başlık), **`{lang}-editor`** (HTML gövde), `{lang}Link` (bağlantı/slug), `StartingDate`, `EndingDate`, `MinDayCount`, `MaxDayCount`, `LanguageId`, `Order`, `SyncContentId`.
- **Editör:** tinymce (WYSIWYG) + `EditorMode` "source" (ham HTML) modu.
- **JSON-LD desteği (doğrulanmış):** kaydetme sırasında `replaceJsonLdCommentToScript(html)` çağrılır — editör gövdesindeki JSON-LD yorumunu `<script type="application/ld+json">` etiketine çevirir. **→ Schema, içerik gövdesine gömülebilir.**
- **Endpoint'ler (yazma):** `/Contents/SaveAllContent`, `/Contents/DeleteContent/{id}`, `/Contents/UpdateContentLanguageIsActive/{id}/{bool}`, `/Contents/BulkUpdateContentOrder`, görsel yükleme uçları. *(Bunlar READ-ONLY denetim kapsamında çağrılmaz; yalnızca statik koddan okunur.)*
- **Diller:** `LanguageId` 1–7 (tr=1, en=2, …, ar=6, ru=7) → KPanel 7 dili destekliyor; canlı sitede hreflang yalnızca tr/en/de/ar.

### Cities (şehir) — yalnızca taksonomi
`id`, `name`, `countryName`, `stateName`, `CountryId`, `StateId`. **Açıklama/gövde/SEO alanı YOK.** → Şehir sayfasının içeriği ve şeması Cities'te değil, `CityId` ile bağlı **Contents** kaydındadır.

### Locations (lokasyon)
`Id`, `locationId`, `Active`, `Airport`, `LocationOrder`, `CountryId` + dil bazlı `LocationLanguages`. Endpoint: `/Locations/AddLocation`, `/Locations/UploadLocationImage/{id}`, `/Locations/BulkUpdateLocationStatus`.

### VehicleGroups (araç kategorisi) — yalnızca kategori adı
`categoryName` + dil bazlı `VehicleCategoryLanguage`. Tekil araç (model) DEĞİL. Endpoint: `/VehicleGroups/SaveNewGroup`.

### Labels (etiket)
`id`, `name`, `description`.

### Cars/Vehicles (tekil araç modülü) — ERİŞİLEMEDİ
`CarsJS/*` ve tüm `*.edit.js` yolları **login sayfası döndürüyor** (HTTP 200 ama içerik login HTML'i) → tekil araç (Clio/Symbol/Egea) düzenleme alanları **UNKNOWN**. Contents içindeki `VehicleClassId` bağı, araçların ayrı bir varlık (VehicleClass) olarak yönetildiğini gösterir.

---

## 3. Mevcut Durumun Kanıta Dayalı Tespiti (21 Eki 2026 public fetch)

| Sayfa | JSON-LD schema (`@type`) | Çıkarım |
| --- | --- | --- |
| Ana sayfa (`/`) | **YOK** | Organization/WebSite schema üretilmiyor |
| Şehir (Gaziantep) | **YOK** | AutoRental/Place/FAQ/Breadcrumb üretilmiyor |
| Araç (Symbol) | FAQPage, Brand, EngineSpecification, QuantitativeValue, Question, Answer | **Şablondan oto-üretiliyor** (Car/Vehicle + SSS) |

Bu asimetri, schema üretiminin KPanel'de **tek bir global alanla değil, şablona gömülü (template-driven) ve sayfa tipine özel** olduğunu gösterir. Araç şablonu schema üretiyor; ana sayfa ve şehir şablonu üretmiyor. Şablonlara erişim yoktur (PROJECT.md: hosting/source/deploy erişimi yok).

---

## 4. Schema Planı → KPanel Uygulanabilirlik Haritası

Etiketler: **VERIFIED** (doğrulanmış), **INFERRED** (doğrulanmış modülden makul çıkarım, kanıt gerektirir), **UNKNOWN** (doğrulanmamış).

| # | Öneri (rakip analizinden) | KPanel karşılığı | Etiket | Açıklama |
| --- | --- | --- | --- | --- |
| A1 | Ana sayfa title/description düzelt | İçerik kaydı (Header/editor) | INFERRED | Sayfa title/desc **render ediliyor** (kaynak bir KPanel alanı). `Header` alanı doğrulandı; title/meta-description'ın Header'dan mı yoksa ayrı bir alandan mı türediği UNKNOWN. "kolayCar" placeholder'ı bir alandan geliyor. |
| A2 | Araç title/hreflang/slug tutarlılığı (Symbol↔Clio) | Cars/VehicleClass + Contents (`VehicleClassId`) | INFERRED | `VehicleClassId` bağı doğrulandı; ancak tekil araç modülü (CarsJS) login-gated → alan adları UNKNOWN. |
| B1 | Ana sayfaya Organization + WebSite schema | Contents (ana sayfa içerik kaydı, HTML gövde) | **INFERRED** | Editör JSON-LD desteği doğrulandı (Bölüm 2b). Ana sayfanın bir içerik kaydına bağlı olup olmadığı UNKNOWN. |
| B2 | Şehir sayfasına AutoRental + Place + BreadcrumbList + FAQPage | Contents (`CityId` bağlı içerik kaydı, HTML gövde) | **INFERRED (güçlü)** | Şehir içeriği Cities'te değil Contents'ta tutuluyor (doğrulandı); editör JSON-LD gömme kapasitesi doğrulandı → FAQPage/AutoRental JSON-LD gövdeye yazılabilir. BreadcrumbList'in şablondan oto-üretimi hâlâ UNKNOWN. |
| B3 | Araç sayfasında Offer/UnitPriceSpecification | Cars/VehicleClass (fiyat alanı) | **UNKNOWN** | Araç modülü login-gated; fiyat/Offer alanı doğrulanmadı. |

**Özet:** Planın **veri düzeltme** ayağı (A1, A2) doğrulanmış modüllere makul biçimde bağlanabilir (INFERRED). **Schema ekleme** ayağı artık kısmen mümkün görünüyor: **B1 ve B2, içerik gövdesinin JSON-LD destekli editörü üzerinden eklenebilir (INFERRED)**. B3 (araç Offer) tekil araç modülü login-gated olduğundan UNKNOWN kalır.

---

## 5. Kalan UNKNOWN'lar ve Gereken Kanıt (READ-ONLY)

Public statik JS ile **çözülen** sorular: içerik editörünün HTML gövde + source modu + JSON-LD desteği var; şehir içeriği Contents'ta (CityId bağlı) tutuluyor; Cities/Locations/VehicleGroups yalnızca taksonomi/operasyonel alan tutuyor.

**Hâlâ UNKNOWN** olanlar ve bunları çözecek kanıt (hiçbiri yazma değildir):

1. **Title/meta-description kaynağı:** `Header` alanı doğrulandı ama "meta description" için ayrı bir alan (`MetaDescription`/SEO başlık) public JS'de görünmedi. → A1 için belirleyici. İnsan operatör KPanel'de bir içerik kaydının düzenleme ekranını açıp alan adlarını not eder.
2. **Tekil araç (Cars/VehicleClass) modülü:** `CarsJS/*` login-gated (login HTML döndürüyor). Araç ad/slug/fiyat alanları UNKNOWN. → A2/B3 için belirleyici. Kimlikli KPanel ekranı gerektirir.
3. **Ana sayfanın içerik kaydına bağlı olup olmadığı** ve **BreadcrumbList'in şablondan oto-üretimi.** → B1/B2 için belirleyici.
4. **Global "site ayarı"/header-footer bölümü var mı?** → B1 (global schema enjeksiyonu) için. Doğrulanmış rotalarda görünmüyor; varlığı UNKNOWN.

Bu inceleme `tools/kpanel-endpoint-discovery.mjs` (READ-ONLY, allowlist'li) ile yapılabilir ancak **KPANEL_SESSION_COOKIE** gerektirir. Kimlik bilgisi talep edilmez; insan operatör KPanel'de ilgili ekranları açıp alan adlarını not ederek aynı kanıtı sağlayabilir.

---

## 6. Önerilen Aksiyon Sırası

1. **Önce veri düzeltmeleri (A1, A2):** Bu adımlar schema üretiminden bağımsız olarak da gerekli ve doğrulanmış modüllere bağlanabilir. KPanel'de ilgili içerik/araç kaydının alanları görüldükten sonra uygulanır.
2. **Sonra schema ekleme fizibilitesi (B1–B3):** Bölüm 5'teki READ-ONLY inceleme tamamlanmadan hiçbir schema ekleme önerisi **uygulanamaz**; yalnızca "şu alan varsa şu yapılabilir" koşullu plan olarak kalır.
3. **Şablon değişikliği gereken her şey (araç şemasına Offer ekleme, şehir şeması üretimi) KPanel kapsamı DIŞINDADIR** (hosting/source/deploy erişimi yok). Bu durumda alternatif, KPanel içerik gövdesine şema enjekte edilebilir bir alan varsa onu kullanmaktır — bu alanın varlığı UNKNOWN.

---

## 7. Sınırlar

- KPanel'in fiili alan adları, editör tipleri ve kaydetme davranışı doğrulanmadı (UNKNOWN). Bu doküman modül adlarını doğrulanmış statik JS dosya adlarından, sayfa tipi schema durumunu ise public fetch'ten alır; arayüz detayı uydurulmamıştır.
- Fiili Google indekslenmesi, Rich Results uygunluğu ve dönüşüm etkisi ölçülmedi.
- Uygulama yalnızca açık insan onayıyla ve KPanel üzerinden yapılır; bu doküman uygulama talimatı değildir.
