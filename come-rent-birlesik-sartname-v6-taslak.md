# Come Rent İçerik Programı: Birleşik Şartname v6.0 (TASLAK)

Durum: Taslak. Açık kararlar (bölüm 12) cevaplanmadan yayına alınmaz.
Kaynaklar: Teknik Şartname v3.8 (24 Şubat), Master Şartname v5.0 (Mart), bu çalışmadaki kararlar ve rakip ön analizi.
Ana hafıza dosyası ve GitHub deposu yalnızca referans olarak kullanıldı; bağlayıcı değildir.

---

## 1. Kapsam

Bu şartname yalnızca şehir rehberlerini değil, comerent.net üzerindeki tüm içerik türlerini kapsar:

- Şehir kiralama sayfaları
- Şehir rehberleri (81 il)
- Bloglar
- Lokasyonlar
- Haberler
- Kampanyalar
- Diğer içerik türleri (envanterle netleşecek)

Program iki iş yapar:

1. **Mevcut içerikleri optimize et:** iyi performans gösterenlere dokunma veya yalnızca teknik düzeltme yap; zayıf olanları yeniden yaz; yinelenenleri birleştir (301).
2. **Eksik içerikleri oluştur:** rakiplerde olup bizde olmayan konular ve sayfalar, niyet haritasındaki boşluklara göre.

## 2. Amaç ve ilkeler

**Amaç:** arama niyetlerinde (ticari ve bilgi) doğru sayfanın görünmesi, AI arama cevaplarında kaynak olunması ve ilgili kiralama sayfasına güçlü iç bağlantı.

**İlkeler**

1. **Niyet haritası önce.** Her arama niyeti tek bir kanonik sayfaya atanır. Aynı niyet için iki sayfa yarışamaz.
2. **Veri önce, metin sonra.** Mesafe, süre, yol durumu, otopark ve mekan adı gibi olgusal bilgi doğrulanmış veriden gelir. Veri yoksa metin o konuya girmez.
3. **Vaat yok.** Fiyat, depozito, sigorta, araç modeli ve yılı, "en iyi", "en ucuz" gibi ifadeler yalnızca kanıtlanmış ve sayfada gösterilen bilgiyle yazılır.
4. **Yapay zeka görseli yok.** Yalnızca lisansı doğrulanmış gerçek fotoğraf.
5. **Otomatik yayın yok.** Her çıktı taslak paketidir, insan onayı ve KPanel'e elle yükleme gerekir.
6. **Sayfalar birbirinden ayırt edilebilir olmalı.** Şablon metin kabul edilmez.

## 3. Kararlar

| # | Konu | Karar | Durum |
|---|---|---|---|
| K1 | Domain ve marka | comerent.net, Come Rent | Kesin |
| K2 | Kelime hedefi | v5.0 aralıkları başlangıç değeri; ilk 5 şehirde test edilip ayarlanır | Kesin |
| K3 | Görsel kaynağı | Wikimedia Commons birincil, Unsplash/Pexels yedek (koşul D3'e bağlı) | Kesin |
| K4 | Master liste | city_iconic_spots.csv JSON'a çevrilir ve birlikte doğrulanır | Kesin |
| K5 | AI görsel | Kaldırıldı (araçlı görsel, renk/model ataması, "2024 model year") | Varsayılan |
| K6 | Sayfa yapısı | Sabit H2 başlıkları, mekanlar H3 | Varsayılan |
| K7 | Görsel sayısı | Hero + mekan başına 1 | Varsayılan |
| K8 | Dış link | Yalnızca resmi kurumlar | Varsayılan |
| K9 | Anchor | v3.8 dağılımı; yasaklı sözcükler şablonlardan çıkarılır | Varsayılan |
| K10 | Yayın | Taslak paketi, insan onayı, elle KPanel yükleme | Varsayılan |
| K11 | Slug | v3.8 slugify kuralı | Varsayılan |
| K12 | Retry | resume / only-failed / start-from | Varsayılan |

"Varsayılan" satırları itiraz edilmediği sürece geçerli sayılır.

## 4. İçerik modülleri

Her içerik türü ortak kurallara ek olarak kendi modülünü kullanır.

| Modül | Kanonik niyet | Ayırt edici kural |
|---|---|---|
| Şehir kiralama sayfası | Ticari: "{il} araç kiralama" | Hizmet doğrulanmamış illerde CTA genel rezervasyona gider (D1) |
| Şehir rehberi | Bilgi: gezilecek yerler, ulaşım, sürüş | Veri önce kuralı; Master liste zorunlu |
| Blog | Bilgi ve otorite | Yıl ve tarih kuralı yok ama tarih damgası ve güncelleme tarihi zorunlu |
| Lokasyon | Ticari-yerel: havalimanı, ofis, teslim noktası | Adres ve çalışma saati yalnızca doğrulanmış veriden |
| Haber | Zamana bağlı | Yayın tarihi zorunlu; süresi bitince arşiv ya da noindex |
| Kampanya | Zamana bağlı, ticari | Başlangıç ve bitiş tarihi zorunlu; fiyat ve indirim yalnızca resmi kampanya metninden |

Tek bir sayfa için karar türleri: **koru, optimize et, birleştir (301), yeniden yaz, noindex veya sil, yeni oluştur.** Karar verilmeden değişiklik yapılmaz.

## 5. Veri katmanı

### 5.1 Master Validation (mekan kaydı)

| Alan | Açıklama |
|---|---|
| id | {il-slug}-{mekan-slug} |
| il, ilçe, ad | Resmi yazım |
| takma_adlar | Metinde geçebilecek yazımlar |
| tür | tarihi, doğal, müze, yeme-içme vb. |
| koordinat | enlem, boylam |
| şehir merkezine | km ve ortalama süre (rota servisiyle, örneklem elle kontrol edilir) |
| en yakın havalimanı | ad, km, süre |
| yol | tip ve mevsimsel risk |
| otopark | var, sınırlı, yok veya bilinmiyor + not |
| resmi_kaynak | Dış link adayı |
| kaynaklar, doğrulayan, doğrulama_tarihi | Kanıt zinciri |

Boş veya "bilinmiyor" alan metne girmez. Araç segmenti veri alanı değildir; yol ve mevsim verisinden genel segment diliyle üretilir (SUV segmenti, ekonomik sedan, yüksek şasili araçlar).

### 5.2 Diğer veri

- **city_tiers.csv:** il, tier, komşu iller. Mekan sayısı tier aralığında olmak zorunda (T1: 10–12, T2: 6–8, T3: 3–5); ihlalde hat durur.
- **city_adjacency.csv:** tek şema: sehir, same_region, nearby_towns, popular_destinations, service_pages.
- **services.json:** il başına hizmet_doğrulandı (evet/hayır) ve ofis/teslim noktası bilgisi. CTA davranışı ve AutoRental şeması buna bağlıdır.
- **Envanter (yeni):** site içerik listesi; URL, tür, durum, şablon, performans ve niyet ataması.

## 6. Yazım kuralları

### 6.1 Persona
Yerel sürüş ve gezi rehberi: şehrin yollarını, virajlarını, otopark ve mevsim koşullarını bilen deneyimli sürücü. Ansiklopedik tarihçe anlatmaz.

### 6.2 Yapı (şehir rehberi)
- **H1 (tek):** {İl} Gezi ve Sürüş Rehberi
- **H2-1:** {İl} şehir içi ulaşım ve sürüş rehberi
- **H2-2:** {İl} gezilecek ikonik noktalar ve sürüş rotaları (her mekan bir H3, görsel H3 altında)
- **H2-3:** {İl} havalimanından şehir merkezine nasıl gidilir
- **H2-4:** {İl} araç kiralama ve rota hakkında sık sorulan sorular (4–6 soru)

Her mekan için veri varsa: şehir merkezi ve havalimanına mesafe/süre, yol ve topografya, genel segment önerisi, otopark durumu. Veri yoksa o parça yazılmaz.

### 6.3 Başlık ve meta
- Title en fazla 60 karakter: "{İl} Gezi ve Sürüş Rehberi | Come Rent"
- Meta description en fazla 155 karakter; il ve en az bir mekan adı içerir; üstünlük sıfatı ve yıl içermez.
- og:image her sayfada o sayfanın hero görseli; logo değil.

### 6.4 Yasaklı ifadeler (blacklist)
- Sabit yıl: 2024, 2025 vb.
- Üstünlük ve fiyat: en iyi, en ucuz, ucuz, rakipsiz, garantili en düşük fiyat, ücretsiz kiralama, indirim
- Belirli araç vaatleri: kırmızı araç, dizel otomatik sıfır km (genel segment ifadesi kullanılır)
- Kiralama şartları (yaş, ehliyet, depozito): yalnızca Come Rent'in resmi şartlar sayfasından birebir veriyle; yoksa o sayfaya link

### 6.5 Şablon önleme
Her mekan için veriden gelen en az bir mekana özgü bilgi bulunur. Giriş ve kapanış cümleleri şehirler arası kopyalanamaz; benzerlik kontrolü bunu ölçer.

## 7. Doğrulama (üretimden sonra, yayından önce)

| Kontrol | Kural | İhlalde |
|---|---|---|
| Blacklist | Bölüm 6.4 | İlgili bölüm yeniden üretilir |
| Mekan | Metindeki her özel mekan adı Master listede (id veya takma ad). Türkçe ek normalize edilerek eşleşir | Yeniden üret; 2 denemeden sonra insana |
| Başka ilin mekanı | Komşu ilin mekanı bu ilde gibi anlatılamaz | Yeniden üret |
| Veri uyumu | Metindeki km, süre, yol ve otopark bilgisi Master veriyle birebir aynı; veride olmayan sayı yazılamaz | Yeniden üret |
| Kelime | Tier aralığının ±%10'u | Uyarı (kota değil) |
| HTML | Tek H1, doğru H2/H3, kapanmamış etiket yok, 3 CTA | Yeniden üret |
| Benzerlik | Şehirler arası ortak ifade oranı eşiğin altında (eşik pilotta belirlenir) | Yeniden üret |
| Link | Bölüm 9 | Link temizlenir, uyarı |
| Görsel | Bölüm 8 | Bölüm 8 |

Mekan doğrulaması iki katmanlıdır: model yalnızca verilen listeyi işler (girdi kısıtı), çıktı ayrıca taranır.

## 8. Görsel hattı

Akış: arama → aday indirme → Vision filtresi → WebP ve SEO işleme → lisans ve atıf kaydı.

- **Kaynak:** Wikimedia Commons birincil; Unsplash/Pexels yedek (D3 çözülene kadar kapalı).
- **Lisans:** yalnızca lisansı açık görsel. Lisans, yazar, kaynak URL ve atıf metni `output/credits/{il}.json` dosyasına yazılır. Atıf gerektiren görsellerde sayfa sonunda kredi satırı bulunur. EXIF temizliği atıfı silmez; atıf ayrı tutulur.
- **Vision red kriterleri:** insan yüzü, yakın plan portre veya selfie; okunabilir plaka; rakip marka, logo veya tabela; görsel üzerine basılmış yazı, filigran veya stok damgası.
- **Teknik:** hero 1280×720, en fazla 80 KB (hedef 60); mekan görselleri 640×360, en fazla 35 KB; WebP; EXIF temiz; görsele yazı veya buton basılmaz.
- **Dosya adı:** {il-slug}-{mekan-slug}.webp
- **Alt metin:** hero için "{İl} {mekan}"; mekan için "{Mekan}, {İl}". Her görselde dolu alt metin, width ve height; hero dışında lazy loading.
- **Hata:** hero bulunamazsa taslak bloklanır ve bildirim gider. Mekan görseli bulunamazsa görselsiz devam edilir, taslakta uyarı kalır (D4).

## 9. Linkler ve schema

**Dahili linkler**
- Zorunlu dört link: ilin ana kiralama sayfası, havalimanı/teslim sayfası, iki komşu il rehberi.
- Anchor dağılımı: tam eşleşme %20, kısmi %40, markalı %30, genel %10.
- "En iyi" ve "en güzel" anchor'larda kullanılmaz.
- Dahili linkler de 200 kontrolünden geçer.
- Türkçe sayfa URL kalıbı doğrulanacak (D5).

**Harici linkler**
- Yalnızca resmi ve yüksek otoriteli kaynaklar: Kültür Portalı, resmi müze sayfaları, KGM.
- Wikipedia ve gezilecekyerler.com listeden çıkarıldı.
- Link denetleyici: benzersiz linkler, 5'li batch, 1 sn bekleme, 5 sn zaman aşımı. 200 dönmeyen link yayından önce kaldırılır.

**JSON-LD**
- ItemList + TouristAttraction: ad, açıklama, koordinat ve görsel, yalnızca Master veriden.
- FAQPage: yalnızca sayfada görünen SSS için. Zengin sonuç garantisi yoktur.
- AutoRental: yalnızca services.json'da hizmet doğrulanmışsa.
- Review ve AggregateRating: kullanılmaz.

## 10. CTA

Üç yerde: giriş özeti sonrası, havalimanı/ulaşım bölümü sonrası, rota bölümü sonu. Temiz HTML kutusu (come-cta-container, come-cta-text, come-cta-button). Görsel üstüne bindirme yok. Hedef sayfa D5'e bağlı. Hizmeti doğrulanmamış illerde davranış D1'e bağlı. CTA metni üstünlük veya fiyat vaadi içermez.

## 11. Üretim hattı

1. **Veri hazırlığı:** il, tier, komşular, Master mekanlar, services.
2. **İçerik üretimi:** yapılandırılmış çıktı.
3. **Doğrulama:** Bölüm 7.
4. **Görsel hattı:** Bölüm 8.
5. **Link ve schema:** Bölüm 9.
6. **Paketleme:** `output/html/{il}.html` (yalnızca içerik), `output/images/{il}/`, `output/meta/{il}.json`, `output/credits/{il}.json`, `output/review/{il}.md`.
7. **Onay:** taslak insan onayına gider. KPanel'e yükleme elle yapılır. Otomatik KPanel yazması ve canlı yayın yoktur.

**Takip ve yeniden deneme**
- `output/progress.json` (completed, failed, pending)
- `npm run retry -- --resume`, `--only-failed`, `--start-from=il`
- API limitinde 1 saat beklenip otomatik denenir
- Hata bildirimi Slack'e gider; webhook ortam değişkeninden okunur, depoya yazılmaz
- 81 il tek seferde basılmaz; batch-config.json ile sınırlanır
- html-cleaner yayın paketinden data-sourcepos, geçici id ve data-clean'i siler

## 12. Açık kararlar

- **D1.** Hizmeti doğrulanmamış illerde CTA ve AutoRental ne olsun? Öneri: CTA genel rezervasyon sayfasına gider, AutoRental eklenmez.
- **D2.** Pilot 5 şehir hangileri? Öneri: Come Rent ofisi olan illerden, her tier'dan.
- **D3.** Unsplash/Pexels koşulları görseli dönüştürüp kendi sunucusunda barındırmaya izin veriyor mu? Doğrulanana kadar yedek kapalı.
- **D4.** Mekan görseli bulunamazsa görselsiz mi devam edilsin, taslak mı bloklansın?
- **D5.** Rehber sayfaları hangi URL'de yaşayacak (ör. /rehber/{il})? Kiralama sayfasının Türkçe URL kalıbı nedir?
- **D6.** Mesafe verisinin kaynağı (rota servisi) ne olacak ve Master veriyi kim doğrulayacak?
- **D7.** Mevcut fabrika kodu (scripts, data, config) henüz incelenmedi. Bu şartname hedef durumdur; koddaki farklar envanterle çıkarılacak.
- **D8.** Görsel kaynağı: sohbetteki karar (Wikimedia + Unsplash/Pexels) mi, ana hafızadaki sıra (Openverse → Wikimedia → Google/Bing) mi?
- **D9.** Site geneli envanter, KPanel'e Claude in Chrome ile salt okunur erişimle mi çıkarılacak?

## 13. Pilot ve ölçüm

5 şehir: Tier 1'den 1, Tier 2'den 2, Tier 3'ten 2 (seçim D2).

Ölçülecekler: ilk seferde doğrulamayı geçme oranı, insan düzeltme süresi, benzerlik skoru, görsel bulunma oranı (özellikle Tier 3), kelime aralığı uyumu.

Yayından sonra 4–8 hafta izlenecekler: indekslenme, gösterim, tıklama, rehberden kiralama sayfasına geçiş. Sonuçlara göre kelime aralıkları ve eşikler güncellenir, ardından 81 ile geçilir.

## 14. Çıktı kontrol formu

| Kontrol | Kriter |
|---|---|
| Mekan sayısı | Tier aralığında |
| Görsel sayısı | 1 hero + mekan sayısı |
| Boyut | Hero en fazla 80 KB, mekan görseli en fazla 35 KB |
| Alt metin | Hepsi dolu ve biçimli |
| Dosya adı | slugify, Türkçe karakter yok |
| Lisans kaydı | Her görsel için credits kaydı |
| Mekan doğrulama | Listede olmayan mekan yok |
| Veri uyumu | Sayılar Master veriyle aynı |
| Blacklist | İhlal yok |
| Benzerlik | Eşik altında |
| Linkler | Dış ve iç linkler 200 |
| Schema | Koşullu bloklar doğru |
| HTML | Tek H1, 3 CTA, geçici attribute yok |
| Meta | Title en fazla 60, description en fazla 155, og:image sayfaya özgü |

## 15. Bırakılanlar

- v3.8'den: AI araçlı görseller, renk/model ataması, "2024 model year", mekan başına H2 yapısı, eski kelime hedefleri (T1 3000–4000 vb.), toplu yayın scripti (publish-bulk).
- v5.0'dan: "4 rota parametresi her zaman zorunlu" kuralı (veri varsa zorunlu oldu) ve "81 ilin hepsine CTA'lı sayfa" varsayımı (D1).
