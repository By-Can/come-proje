# Rakip Analizi ve comerent.net Ayrışma Planı

Oluşturulma: 2026-10-21
Kapsam: Türkiye'deki önde gelen 5 araç kiralama / şehir rehberi sitesinin sayfa yapısı, içerik boşlukları, Canonical/Schema/hreflang kullanımı → comerent.net için ayrışma (farklılaşma) planı.
Durum: **Kanıta dayalı, READ-ONLY.** Tüm değerler 21 Ekim 2026'da canlı sitelerden `curl` ile alınan ham HTML'den çıkarılmıştır. Hiçbir canlı değişiklik yapılmamıştır.

---

## 1. Yöntem ve Kanıt

- Her site için **ana sayfa + bir şehir sayfası (Gaziantep) + bir araç/model sayfası** `curl -sL` ile GET edildi (tarayıcı User-Agent, max-time 25s).
- Çıkarılan sinyaller: `<title>`, meta description, `<link rel="canonical">`, `hreflang` bağlantıları, JSON-LD `@type` kümesi, `<h1>`, kelime sayısı.
- Şehir olarak **Gaziantep** seçildi: comerent.net'in backlog'unda canonical sorunu işaretlenen şehirlerden biri olduğu için birebir karşılaştırılabilirlik sağlar.
- Araç olarak **Renault Clio / Symbol / Fiat Egea** ekseni kullanıldı: comerent.net'in hreflang hatası yaşadığı modeller (Clio, Symbol, Egea).

### Erişilemeyen rakipler (dürüst kapsam notu)
| Site | Durum |
| --- | --- |
| budget.com.tr | HTTP 403 — Cloudflare "Just a moment..." (ham HTML alınamadı) |
| avis.com.tr | HTTP 403 — Cloudflare (ham HTML alınamadı) |
| rentgo.com | HTTP 403 — Cloudflare (ham HTML alınamadı) |
| yurticikiralama.com | HTTP 000 — bağlantı kurulamadı (DNS/erişim) |

Bu siteler için schema/canonical değerleri **UNKNOWN** kabul edilir; aşağıdaki analize dahil edilmemiştir.

---

## 2. Rakip Listesi (Top 5)

Seçim gerekçesi: comerent.net'in konumlanması "araç kiralama + şehir rehberi" hibritidir. Bu nedenle hem **doğrudan filo işleten operatörleri** hem de **güçlü şehir/model rehberi içeriğine sahip toplayıcıları** kapsayan dengeli bir küme seçildi.

| # | Site | Tür | Erişim |
| --- | --- | --- | --- |
| 1 | Garenta (garenta.com) | Yerli pazar lideri operatör (~110 şube) | ✅ 200 |
| 2 | Enterprise (enterprise.com.tr) | Global operatör, güçlü lokasyon sayfaları | ✅ 200 |
| 3 | Europcar (europcar.com.tr) | Global operatör | ✅ 200 |
| 4 | Yolcu360 (yolcu360.com) | Toplayıcı + şehir/model rehberi | ✅ 200 |
| 5 | Enuygun (enuygun.com/arac-kiralama) | Toplayıcı + fiyat karşılaştırma | ✅ 200 |

*(Bonus inceleme: sixt.com.tr — HTTP 200, aşağıda yer yer referans verildi.)*

---

## 3. Ana Sayfa Karşılaştırması

| Site | Canonical | hreflang | Schema (@type) | Not |
| --- | --- | --- | --- | --- |
| **Garenta** | `https://www.garenta.com/tr` | 8 (tr/bg/az/mk/ru/el + x-default) | Organization | Çok dilli; schema yalnızca ana sayfada |
| **Enterprise** | `https://www.enterprise.com.tr/` | 3 (tr/en/x-default) | WebSite, Organization, SearchAction, ContactPoint | Temiz ama temel yığın |
| **Europcar** | `https://www.europcar.com.tr` | 3 (tr/en/x-default) | Organization, WebSite, Country, PostalAddress, ContactPoint, SearchAction, Brand, EntryPoint, ImageObject | En zengin kurumsal yığın |
| **Yolcu360** | `https://yolcu360.com/arac-kiralama` | 3 (tr/en/x-default) | FAQPage, ItemList (22 araç: AutoRental, Car, Brand, Offer, Place, GeoCoordinates, UnitPriceSpecification) | En zengin **araç/teklif** yığını + SSS |
| **Enuygun** | `https://www.enuygun.com/arac-kiralama/` | 0 | **YOK** | Next.js; hiçbir yapısal veri yok |
| **comerent.net** | `https://www.comerent.net/` | 5 (tr/en/de/ar + x-default) | **YOK** | title **bozuk**, description **"kolayCar"** |

### comerent.net ana sayfa — doğrulanmış kritik bulgular
- `<title>` = **"ARAÇ KİRALAMA -"** (kesik/bozuk, marka ve anahtar kelime yok).
- `<meta name="description">` = **"kolayCar"** — Come Rent ile ilgisiz, büyük olasılıkla başka bir şablondan kalan placeholder.
- JSON-LD schema **hiç yok**.
- hreflang 5 dil (tr/en/de/ar) — rakiplerden daha iddialı ama tutarlılığı aşağıda (Bölüm 6) bozuk.

---

## 4. Şehir Sayfası Karşılaştırması (Gaziantep)

| Site | URL deseni | Canonical | hreflang | Schema | ~kelime |
| --- | --- | --- | --- | --- | --- |
| **Garenta** | `/tr/arac-kiralama/{city}` | self | 8 | **YOK** | ~30.879 (çok büyük, filo listesi ağırlıklı) |
| **Enterprise** | `/ofisler/{city}-arac-kiralama` | self | 3 | AutoRental, BreadcrumbList, ListItem | ~7.923 |
| **Europcar** | `/konumlar/{city}` | self | 3 | Organization+WebSite+Country+PostalAddress+ContactPoint | — |
| **Yolcu360** | `/arac-kiralama/turkiye/{city}` + `{ilçe/havalimanı}` | self | 3 | FAQPage, ItemList, AutoRental, Car, Brand, Offer, Place, GeoCoordinates, UnitPriceSpecification | ~4.343 |
| **Enuygun** | `/arac-kiralama/sehir/{city}/` | self | 0 | FAQPage, BreadcrumbList, Question, Answer | ~10.888 |
| **comerent.net** | `/{city}-arac-kiralama` | self | 5 | **YOK** | — |

### Gözlemler
- **comerent.net'in şehir URL deseni** (`/{city}-arac-kiralama`, kategori klasörü olmadan düz) en temiz/rakip Enterprise'ın `/ofisler/{city}-arac-kiralama` modeline yakın; ancak **hiç schema yok**.
- **Yolcu360** tek sayfada hem `FAQPage` hem de 22 araçlık `AutoRental`/`Offer`/`Place`/`GeoCoordinates` yığını taşıyor — bu, "şehir rehberi + araç kiralama" hibritinin teknik olarak en olgun örneği.
- **comerent.net'in Gaziantep içeriği aslında farklılaşmış:** title "Gaziantep Araç Kiralama ve Gezilecek Yerler | Come Rent", description Zeugma/Gaziantep Kalesi gibi gezi içeriği, H1 "…Tarih ve Lezzet Dolu Bir Yolculu". Bu "gezilecek yerler" açısı rakiplerde yok — yapısal veriyle desteklenmemiş ama içerik olarak güçlü.

---

## 5. Araç / Model Sayfası Karşılaştırması

| Site | URL deseni | Schema | Not |
| --- | --- | --- | --- |
| **Garenta** | `/tr/kiralik-arabalar/detay/{model-slug}` | **YOK** | title modeli açıklayıcı (motor/şanzıman/yıl) |
| **Enterprise** | `/arac-filomuz/{kategori}/{model-slug}` | BreadcrumbList, ListItem | Temiz model slug'ları |
| **Yolcu360** | `/arac-kiralama/kiralik-arac-markalari/{marka}/{model}` | **YOK** (model sayfasında) | Marka+model rehberi; schema şehir sayfasında |
| **Enuygun** | `/arac-kiralama/marka/{marka}/` | FAQPage, BreadcrumbList, Question, Answer | Marka düzeyinde, model derinliği yok |
| **comerent.net** | `/araclarimiz/{model-slug}` | FAQPage, Brand, EngineSpecification, QuantitativeValue | Schema var ama **içerik/hreflang bozuk** (Bölüm 6) |

---

## 6. comerent.net — Doğrulanmış Mevcut Durum ve Backlog Eşleşmesi

Bu bölüm, daha önce `master-audit` içinde **UNKNOWN** olan backlog iddialarını, 21 Ekim 2026 canlı fetch'iyle **doğrulanmış kanıta** bağlar.

### 6.1 Ana sayfa (P0'e eklenmeli)
- title kesik ("ARAÇ KİRALAMA -"), description "kolayCar" placeholder. **Backlog'da yok; yeni, doğrulanmış P0 bulgusu.**

### 6.2 Araç sayfası içerik karışması + hreflang (Symbol) — P0 doğrulandı
URL: `/araclarimiz/renault-symbol` sayfasında:
- `<title>` = **"Renault Clio Benzin Otomatik"**
- meta description = **"Renault Clio Benzin Otomatik"**
- `<h1>` = **"Renault Symbol Kiralama…"**
- canonical = `https://www.comerent.net/araclarimiz/renault-symbol` (URL Symbol, title Clio → **içerik karışması doğrulandı**)

Aynı sayfanın hreflang blokları (doğrulanmış bozuk hedefler):
| hreflang | href | Değerlendirme |
| --- | --- | --- |
| x-default | `/en/our-cars/renault-clio-automatic` | Symbol→Clio tutarsız |
| tr-tr | `/araclarimiz/renault-clio-automatic` | **Yanlış slug** (mevcut sayfa `renault-symbol`) |
| en-us | `/en/our-cars/renault-clio-automatic` | tutarsız |
| de-de | `/de/mietwagen/audi-a3` | **Tamamen yanlış araç** (Audi A3!) |
| ar-sa | `/ar/araclarimiz/renault-symbol` | Türkçe slug taşınıyor (`araclarimiz`) |

Bu, backlog'daki **"hreflang hataları (Clio, Symbol, Egea)"** ve **"içerik karışması (Ordu, Siirt)"** kalıplarının araç sayfalarında birebir örneğidir.

### 6.3 Şehir sayfası (Gaziantep) — iyi ama schema'sız
- canonical **self, doğru** (bu sayfada trailing slash sorunu yok).
- İçerik güçlü ve farklılaşmış (gezilecek yerler).
- **Eksik:** Organization / AutoRental / BreadcrumbList / FAQPage schema yok.

---

## 7. İçerik Boşlukları (Content Gaps) ve Fırsatlar

Rakip taramasından çıkan, comerent.net'in henüz karşılamadığı boşluklar:

1. **Schema uçtan uca yok.** Rakiplerin tamamında (Enuygun hariç) en az Organization + BreadcrumbList; Enterprise/AutoRental, Europcar kurumsal yığın, Yolcu360 tam araç/teklif yığını mevcut. comerent.net ana sayfa ve şehir sayfalarında **sıfır** schema.
2. **SSS (FAQ) blokları.** Yolcu360 ve Enuygun şehir sayfalarında 10+ soruluk SSS + FAQPage schema taşıyor. comerent.net'te şehir sayfasında SSS yok.
3. **İlçe/alt-lokasyon derinliği.** Yolcu360 `/arac-kiralama/turkiye/{city}/{ilçe}` (Beylikdüzü, Esenyurt, Manavgat, Tatvan…) seviyesine iniyor. comerent.net şehir + havalimanı seviyesinde kalıyor → uzun kuyruk fırsatı.
4. **Dinamik fiyat title'ı.** Yolcu360 title içinde "1701 TL'den Başlayan Fiyatlar" gibi güncel fiyat taşıyor (tıklama/CTR sinyali). comerent.net'te yok.
5. **Temiz, kategorize model sayfaları.** Enterprise `/arac-filomuz/{kategori}/{model}`; comerent.net `/araclarimiz/{slug}` düz ve slug/içerik tutarsız.
6. **Ana sayfa title/description hijyeni.** Tüm rakipler tam, markalı, anahtar kelimeli title/description kullanıyor; comerent.net'inki bozuk/placeholder.

---

## 8. Ayrışma (Farklılaşma) Planı

comerent.net'in rekabet edebileceği savunulabilir pozisyon: **"Şehir rehberi (gezilecek yerler) ile entegre araç kiralama"** — bu, mevcut Gaziantep içeriğinde zaten başlamış durumda. Aşağıdaki plan bu farkı teknik SEO ile destekler ve rakiplerin boşluklarını kapatır.

### A. Önce teknik hijyen (hızlı kazanım, P0)
1. **Ana sayfa title/description düzelt:** title'ı "Araç Kiralama | Come Rent" gibi tam+markalı yap; "kolayCar" placeholder'ını kaldır. *(KPanel içerik modülünden; kaynak alan doğrulanmalı.)*
2. **Araç sayfası slug↔içerik↔hreflang eşleşmesini düzelt:** Symbol sayfasındaki Clio title'ı, `renault-clio-automatic` hreflang hedefi ve `de-de → audi-a3` hedefi tutarlı hale getirilir. Her model için tek bir kanonik slug + doğru dil hedefi belirlenir.
3. **Canonical/trailing slash bütünlüğü:** ana sayfa `/` ile, iç sayfalar `/-` (slash'siz) ile self-canonical; tek norma çek.

### B. Schema katmanı (orta vade, P1–P2)
4. **Kurumsal yığın (tüm sayfalar):** `Organization` + `WebSite` (SearchAction) ana sayfaya; Europcar/Enterprise modeli.
5. **Şehir sayfaları:** `AutoRental` (veya `RentalCarReservation`) + `Place`/`PostalAddress` + `BreadcrumbList` + `FAQPage`. Enterprise'ın AutoRental + BreadcrumbList'i ile Yolcu360'ın FAQ'ını birleştir.
6. **Araç sayfaları:** mevcut `Brand`/`EngineSpecification`/`QuantitativeValue`'yu `Car`/`Vehicle` içine düzgün yuvala (şu an dağınık); `Offer`/`UnitPriceSpecification` fiyat şeffaflığı için ekle.

### C. İçerik farklılaşması (uzun kuyruk, P2–P3)
7. **"Gezilecek yerler + araç kiralama" şablonunu her şehre yay:** Gaziantep'teki güçlü, özgün gezi içeriğini tüm şehir sayfalarına sistematikleştir. Bu, Garenta/Enterprise/Europcar'ın "fiyat + filo" odaklı sayfalarından net ayrışma sağlar.
8. **İlçe/alt-lokasyon sayfaları:** Yolcu360'ın ilçe derinliğini "gezilecek yerler" içeriğiyle birleştirerek uzun kuyruk yakala (ör. `/istanbul-arac-kiralama/beylikduzu`).
9. **SSS blokları:** her şehir sayfasına 5–10 soruluk, soru-cevap formatlı SSS (AEO/GEO sinyali) ekle; Yolcu360/Enuygun kalıbı.

### D. Ölçüm ve güvenlik
10. Her adım **KPanel üzerinden, açık onayla** uygulanır; bu doküman yalnızca öneri setidir, uygulama talimatı değildir.
11. Schema/hreflang değişiklikleri sonrası Google Search Console + Rich Results Test ile doğrula; fiili indekslenme **UNKNOWN** kabul edilir (bu tarama indekslemeyi ölçmez).

---

## 9. UNKNOWN'lar ve Sınırlar

- Cloudflare engelli rakipler (Budget, Avis, RentGo) için schema/canonical değerleri **UNKNOWN**.
- comerent.net'in diğer şehir (Van, Ordu, Siirt, Erzincan) ve araç (Clio, Egea, C-Elysee, Passat) sayfaları bu oturumda tek tek çekilmedi; Gaziantep + Symbol örnekleri temsilidir. **Tüm sayfaların dökümü ayrı bir sitemap denetimiyle doğrulanmalıdır.**
- `master-audit` içindeki canonical sorunları (Van, çerez sayfası) ve `/iletisim` bağlantı bulguları bu analizde yeniden doğrulanmadı.
- KPanel'de schema/title/hreflang'ın hangi modülden ve nasıl düzenlendiği **UNKNOWN**; uygulama yolu varsayılmadı.
- Gerçek Google/Bing indekslenme, sıralama ve dönüşüm etkisi bu taramayla ölçülmedi.

---

## 10. Sonraki Adım Önerisi

1. Bu dokümanın P0 maddelerini (ana sayfa title/description, Symbol hreflang/içerik) **KPanel'e uygulanacak somut görev kartlarına** dönüştür (BACKLOG.md'yi güncelle).
2. Van/Ordu/Siirt/Erzincan + Clio/Egea sayfalarının aynı yöntemle doğrulanması → backlog canonical/içerik iddialarının tam kanıtlanması.
3. Schema şablonu (Organization + AutoRental + FAQPage + BreadcrumbList) için KPanel uygulanabilirlik incelemesi.
