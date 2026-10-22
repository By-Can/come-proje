# İçerik Taslağı — Audi A4 (Araç ID 45) — v2

Durum: **TASLAK — KPanel'e henüz girilmedi.** Uygulama yalnızca kullanıcının açık onayı ile yapılacak.
Kaynaklar: KPanel araç kaydı 45 (salt okuma, 22 Ekim 2026), KPanel içerik kaydı 129 (kalıp), `docs/rakip-analizi-2026-10.md` (bölüm 7-8).

## 1. Doğrulanmış araç verisi (KPanel kaydı 45, salt okuma)

| Alan | Değer |
|---|---|
| VehicleClassName (TR/EN/DE/AR) | Audi A4 |
| SippCode | LDBD |
| brandId / modelId | 21 (Audi) / 2 (A4) |
| bodyTypeId | 4 (Sedan) |
| seatCount / luggageCount | 5 / 4 |
| gearTypeId | 2 (Otomatik) |
| fuelTypeId | 7 (Benzin/Dizel/Hibrit) |
| AirCondition | Açık |
| Aktif | Evet |

Doğrulanmayan (UNKNOWN, taslakta yer almaz): motor hacmi ve gücü, tüketim, bagaj litresi, güvenlik donanımı, fiyat.

## 2. Alanlar

### TR
| Alan | Değer |
|---|---|
| Aktif / Sitemap'te göster | Açık / Açık |
| Araç | Audi A4 |
| Grup | Popüler Araçlar (KPanel'de grup seçeneği doğrulanacak) |
| Header | Audi A4 Kiralama: Konforlu Premium Sedan |
| URL | `audi-a4` |
| Canonical | `https://www.comerent.net/araclarimiz/audi-a4` |
| Meta Title | `Audi A4 Kirala \| Premium Sedan Konforu \| Come Rent` (50 karakter) |
| Meta Description | `Audi A4'ü Come Rent'ten kiralayın. Otomatik vites, 5 kişilik konfor ve 4 bagajla iş ve tatil yolculuklarınız için. Hemen rezerve edin.` |
| Özet | Audi A4, otomatik vites ve 5 kişilik konforuyla iş ve tatil yolculukları için premium bir sedan. |
| Görsel alt etiketi | Audi A4, Come Rent teslim noktasında |

### EN
| Alan | Değer |
|---|---|
| Aktif / Sitemap'te göster | Açık / Açık |
| Araç | Audi A4 |
| Grup | Popular Vehicles |
| Header | Audi A4 Rental: Comfortable Premium Sedan |
| URL | `audi-a4` |
| Canonical | `https://www.comerent.net/en/our-cars/audi-a4` |
| Meta Title | `Rent an Audi A4 \| Premium Sedan Comfort \| Come Rent` |
| Meta Description | `Rent an Audi A4 from Come Rent. Automatic transmission, 5-seat comfort and 4 bags for business and holiday trips. Book now.` |
| Özet | The Audi A4 is a premium sedan with automatic transmission and 5-seat comfort for business and leisure trips. |
| Görsel alt etiketi | Audi A4 at a Come Rent pickup point |

### DE
| Alan | Değer |
|---|---|
| Aktif / Sitemap'te göster | Açık / Açık |
| Araç | Audi A4 |
| Grup | Beliebte Fahrzeuge |
| Header | Audi A4 Mietwagen: Komfortable Premium-Limousine |
| URL | `audi-a4` |
| Canonical | `https://www.comerent.net/de/mietwagen/audi-a4` |
| Meta Title | `Audi A4 mieten \| Premium-Limousine-Komfort \| Come Rent` |
| Meta Description | `Mieten Sie den Audi A4 bei Come Rent. Automatik, Komfort für 5 Personen und 4 Gepäckstücke für Geschäfts- und Urlaubsreisen. Jetzt buchen.` |
| Özet | Der Audi A4 ist eine Premium-Limousine mit Automatikgetriebe und Komfort für 5 Personen. |
| Görsel alt etiketi | Audi A4 an einer Come Rent Abholstelle |

### AR
| Alan | Değer |
|---|---|
| Aktif / Sitemap'te göster | Açık / Açık |
| Araç | Audi A4 |
| Grup | مركبات مميزة |
| Header | تأجير Audi A4: سيدان فاخرة ومريحة |
| URL | `audi-a4` |
| Canonical | `https://www.comerent.net/ar/araclarimiz/audi-a4` |
| Meta Title | `استئجار Audi A4 \| راحة سيدان فاخرة \| Come Rent` |
| Meta Description | `استأجر Audi A4 من Come Rent. ناقل حركة أوتوماتيكي وراحة لخمسة ركاب وأربعة أمتعة لرحلات العمل والعطلات. احجز الآن.` |
| Özet | Audi A4 سيدان فاخرة بناقل حركة أوتوماتيكي وراحة لخمسة ركاب لرحلات العمل والترفيه. |
| Görsel alt etiketi | Audi A4 في نقطة تسليم Come Rent |

> Not: Canonical değerleri her dil için mevcut hreflang kalıbına göre yazıldı. Ancak sitede AR/DE/EN kategori yolları gerçekte farklı olabilir (ör. `/ar/our-cars-as`, `/de/mietwagen`). KPanel'de Symbol/Clio için görülen yollar doğrulanmadan bu canonical'lar KPanel'e girilmemeli.

## 3. Gövde (TR) — bölüm iskeleti

1. **Giriş:** Segmentindeki yeri (genel ifade, sayı yok).
2. **Sürüş ve konfor:** Otomatik vites ve sürüş konforu (doğrulanmış donanım dışında teknik iddia yok).
3. **İç mekan ve bagaj:** "5 kişi, 4 bagaj" (KPanel kaydından).
4. **Yakıt:** "Benzin, dizel ve hibrit seçenekleriyle" — kayıttaki fuelTypeId 7 ile uyumlu; hangi varyantın teslim edileceği rezervasyon sırasında belirtilir (bu bilgi doğrulanmadı, metinde kesin ifade yok).
5. **Güvenlik:** Doğrulanmış donanım yoksa bu bölüm eklenmez.
6. **Come Rent ayrıcalıkları:** Teslim noktaları ve hizmet.
7. **SSS:** Aşağıda, sadece doğrulanabilen konular.
8. **CTA:** "Hemen rezerve edin" — gerçek bağlantı olarak eklenir.

## 4. SSS (FAQPage için, SEO)

Rakip analizine göre SSS, Yolcu360/Enuygun kalıbıyla FAQPage yapısı için eklenir. Cevaplar yalnızca doğrulanmış bilgiyle yazılır.

| Soru | Cevap durumu |
|---|---|
| Audi A4 kaç kişilik? | **Yazılır:** 5 kişi |
| Audi A4'te kaç bagaj alınır? | **Yazılır:** 4 bagaj (kayıt değeri; ayrıntı litre değeri değil) |
| Audi A4 vites tipi nedir? | **Yazılır:** Otomatik |
| Kiralama için hangi belgeler gerekir? | **Karar bekliyor** (aşağıya bakın) |
| Kiralama için kredi kartı gerekir mi? | **Yazılır:** "Kredi kartı koşulu teslim noktasına ve partner firmaya göre değişir. Rezervasyon sırasında seçtiğiniz noktanın koşulları gösterilir." |
| Yaş ve ehliyet koşulları nelerdir? | **Karar bekliyor** (aşağıya bakın) |

**Çelişki:** Sitede kredi kartı koşulu tutarsız:
- Ordu ve Diyarbakır sayfaları "kredi kartı" koşulu yazıyor (bkz. `comerent.net/ordu-arac-kiralama`, `comerent.net/diyarbakir-arac-kiralama`).
- Şanlıurfa Havalimanı sayfası "Kredi kartı zorunluluğu yok" diyor.

Bu üç soru, Come Rent'in resmi politikası netleşmeden yazılmamalı. Politikayı siz belirleyebilirsiniz; ben o zamana kadar bu üç soruyu SSS'ten çıkarırım.

## 5. SEO notları (rakip analizinden)

- Title ~60 karakter, marka + kelime + segment: uygulandı.
- Yapısal veri (Car/Vehicle, BreadcrumbList, FAQPage, Offer) rakip analizinde öneriliyor. **KPanel'de schema alanı doğrulanmadı (UNKNOWN)**, bu nedenle bu öneri içerik kaydına JSON-LD olarak girilip girilemeyeceği KPanel'de kontrol edilmeden uygulanmaz.
- Fiyat (Offer / UnitPriceSpecification): fiyat araçta değil, Tarifeler modülünde tutuluyor (kayıt envanteri). Bu alan henüz doğrulanmadı.

## 6. Yapılmayacaklar (Passat kaydından ders)

- Gövdede `[Image: ...]` veya `[Hemen Kirala — ...]` gibi yer tutucular bırakılmaz.
- Başka aracın iddiaları kopyalanmaz (bagaj litresi, tüketim, güvenlik, lokasyon kodları).
- TR metin EN/DE/AR sekmelerine kopyalanmaz; yukarıdaki çevirilerle girilir.

## 7. Onay için bekleyen kararlar

1. Kredi kartı, belge ve yaş/ehliyet koşulları için Come Rent'in resmi politikası nedir? (Çelişki yukarıda.)
2. Bu taslak KPanel'e **Audi A4 kaydı 45** için girilsin mi? Onaylarsanız yalnızca bu tek kayıt yazılır, diğer araçlar için aynı kalıp ayrı onay ile ilerler.
