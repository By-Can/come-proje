# 05-depo-guncelleme-taslaklari.md — GitHub Depo Dokümantasyon Güncelleme Paketi ve Pilot Onay Şablonu

## Giriş ve Kullanım Yönergesi

Bu belge; `04-bosluk-ve-depo-onerisi.md` içindeki öneriler, `03-ana-belge.md` hükümleri ve `COME_RENT_VE_DIGER_SOHBETLER_BIRLESIK_ANA_HAFIZA_V2_0.md` kararları doğrultusunda, GitHub `By-Can/come-proje` deposundaki ana dokümantasyon dosyalarının birebir güncellenmiş ve üretime hazır metin taslaklarını içerir.

> **Güvenlik ve Yetki Sınırı (`C-08/A`):** Bu dosyadaki taslaklar doğrudan GitHub deposuna yazılmamıştır. `C-08/A` kararı uyarınca ChatGPT sohbet dışa aktarımı denetimi tamamlanıp kullanıcıdan **ayrı açık GitHub yazma onayı** alındıktan sonra depoya aktarılacaktır `[COME_RENT_VE_DIGER_SOHBETLER_BIRLESIK_ANA_HAFIZA_V2_0.md, Bölüm 8.3, Bölüm 12 C-08]`.

---

## 1. Taslak: `README.md` (Güncelleme)

```markdown
# Come Rent Proje Çalışma Deposu

Come Rent (`comerent.net` / `www.comerent.net`) projesinin salt-okunur (READ-ONLY) güvenlik denetimi, kamuya açık SEO/taranabilirlik analizleri, çevrimdışı testleri ve içerik programı standartlarını barındıran çalışma deposudur.

> **ÖNEMLİ — Canlı Sistem ve Depo Ayrımı:** Bu depodaki kodlar canlı `comerent.net` sitesinin sunucu/hosting kaynak kodları değildir. `main` dalına yapılan değişiklikler veya PR birleştirmeleri canlı siteyi, KPanel'i veya sunucu ortamını değiştirmez. Canlı sitedeki tüm içerik ve SEO müdahaleleri yalnızca KPanel yönetim paneli üzerinden, insan operatör denetiminde ve açık kullanıcı onayıyla yürütülür.

### Temel Dokümantasyon Haritası

- **`PROJECT.md`:** Proje hedefleri, `OWN + PARTNER NETWORK` iş modeli, lokasyon kuralları ve üç aşamalı stratejik öncelik sırası.
- **`AGENTS.md`:** Projede çalışan tüm yapay zeka ajanları için bağlayıcı sözleşme (Evidence-First, Halüsinasyon Yasağı, UNKNOWN kuralı, C-09/B POST yasağı, C-16/B ajan rolleri, C-21/A insan onaylı canlı yayın).
- **`BACKLOG.md`:** Önceliklendirilmiş SEO hata kuyrukları (doğrulama bekleyen tarihsel iddialar, 15 Ekim 2026 kamuya açık crawl bulguları, 404 inceleme kuyruğu ve sitemap işlem/güvenlik kuyruğu).
- **`docs/kpanel-known-facts.md`:** Doğrulanmış KPanel 14 GET rotası, statik JS varlıkları ve endpoint sınıflandırmaları (`SAFE_GET_VERIFIED`, `POST_READ_LIKE_BLOCKED_BY_POLICY`, `UNKNOWN_DO_NOT_CALL`).
- **`docs/kpanel-audit-operations.md`:** KPanel READ-ONLY denetimlerinin 7 güvenlik değişmezi (origin doğrulaması, route allowlist, GET/HEAD kısıtı, manuel redirect, secret redaksiyonu, HTML sanitize, path traversal koruması).
- **`docs/seo-master-plan.md`:** Evidence-based SEO stratejisi, C-20/A esnek içerik mimarisi, C-19/A seçici schema ve CRO ilkeleri.

### Çevrimdışı Testler ve Güvenlik Doğrulaması

Bu depodaki tüm güvenlik katmanları ve veri işleme mantığı harici ağ erişimi gerektirmeksizin çevrimdışı çalıştırılabilir:

```bash
npm test
```

Test paketi 79/79 test ile KPanel güvenlik korumasını (`tools/test-kpanel-security.mjs`), crawler ağ/yönlendirme/eylem yolu engellemelerini (`tools/test-audit-tools.mjs`) ve çok partili sitemap inceleme mantığını (`tools/test-public-seo-review.mjs`) denetler.

### Kamuya Açık SEO Taraması Tetikleme Uyarısı

`.github/workflows/public-seo-readonly-crawl.yml` iş akışı yalnızca manuel `workflow_dispatch` ile veya `main` dalındaki `audit/triggers/public-seo-request.json` dosyasının değiştirilmesiyle tetiklenir. Açık kullanıcı izni olmadan bu dosyada değişiklik yapılmamalıdır.
```

---

## 2. Taslak: `PROJECT.md` (Güncelleme)

```markdown
# Come Rent Proje Başlangıç ve Kapsam Belgesi

## 1. Temel Hedefler
- Come Rent markasını (`comerent.net` / `www.comerent.net`) araç kiralama sektöründe organik arama (Google, Bing), yapay zeka cevap motorları (ChatGPT Search, Perplexity, Gemini, Copilot) ve rezervasyon dönüşümünde lider seviyeye taşımak.
- Türkiye'nin 81 ilinde doğru arama niyetine hizmet eden, olgusal verilere dayalı, şablonlaşmamış ve yüksek kaliteli sayfalar sunmak.

## 2. Stratejik Öncelik Sırası (Karar C-03)
Proje, 13 Ekim 2026 kullanıcı kararıyla kesinleşen aşağıdaki sıralamayla yürütülür:
1. **Faz 1 — Mevcut Come Rent Optimizasyonu (Öncelikli Aktif Faz):** KPanel kaynaklı şehir/lokasyon envanteri, teknik SEO düzeltmeleri, içerik kalitesi ve dönüşüm iyileştirmesi.
2. **Faz 2 — Dört Ayrı Rezervasyon Üreten Site (Gelecek Faz):** Mevcut yaşlı alan adları üzerinde gerçekten rezervasyon üretebilen farklı tasarımlı dört ayrı sitenin kurulması.
3. **Faz 3 — Bağımsız Rezervasyon API'si (En Son Faz):** Kendi bağımsız yazılım altyapısının geliştirilmesi ve olası entegrasyon/migrasyon.

## 3. Doğrulanmış İş Modeli ve Terminoloji
- **Tedarik Modeli:** `OWN + PARTNER NETWORK` (Broker / karma tedarikçi ağı).
- **Ofis Tanımı:** Yalnızca fiziksel olarak doğrulanmış Come Rent noktaları **"ofis"** olarak adlandırılabilir; diğer tüm lokasyonlar **"partner teslim noktası"** veya **"tedarikçi ofisi"** olarak yazılmalıdır.
- **Canlı Rezervasyon Lokasyonları:** Canlı online rezervasyon yapılabildiği doğrulanan noktalar çalışma modelinde `SERVICEABLE_LOCATION=YES` ve `LIVE_BOOKING=YES` olarak sınıflandırılır. Bunların KPanel veritabanında fiziksel alan/kolon olup olmadığı **UNKNOWN**'dur.
- **Ticari Sayfa ve CTA Yayın Kuralı (Karar C-05/A):** 81 ilin tamamı planlama ve envanter kapsamındadır; ancak bir şehir, ilçe veya havalimanı için ticari araç kiralama sayfası ve aktif rezervasyon CTA'sı **yalnızca o lokasyonda gerçek canlı online rezervasyon hizmeti kanıtlandığında** yayımlanabilir. Hizmet kanıtlanmayan yerlerde ticari sayfa açılmaz.
- **Avantaj ve Koşul Ayrımı (Karar C-13/B):** Yalnızca kurumsal düzeyde tüm marka için doğrulanan avantajlar ortak metinlerde kullanılabilir. Depozito, kredi kartı gerekliliği/istisnası, araç yılı/modeli, sigorta, teslimat ve fiyat koşulları ise yalnızca ilgili lokasyon/tedarikçi/araç seviyesinde kanıtlandığında yazılabilir; şehir geneline genellenemez.

## 4. Çalışma Sınırları ve Güvenlik
- Canlı sitenin hosting, sunucu kaynak kodu, shell ve veritabanı erişimi **yoktur**.
- Uygulanabilir tüm canlı değişiklikler **yalnızca KPanel üzerinden** yürütülür.
- KPanel üzerinde doğrudan API, arka plan yazma çağrısı veya otomatik yayın yapılmaz; ilk 3 pilot yalnızca görünür yönetim arayüzünden (`C-29/A`) uygulanır.
- KPanel GET rotaları dışındaki hiçbir işlem kullanıcı onayı olmadan yürütülmez; `C-09/B` kararı POST izni değildir.
- Varsayımsal KPanel endpoint'i, editör alanı veya sistem davranışı uydurulamaz (No-hallucination). Bilinmeyen her şey **UNKNOWN** olarak işaretlenir.
```

---

## 3. Taslak: `AGENTS.md` (Güncelleme)

```markdown
# Ajanlar İçin Davranış ve Güvenlik Sözleşmesi (Agents Rules)

Bu proje üzerinde çalışan tüm yapay zeka ajanları (ChatGPT, GitHub Copilot, Jules, Codex, Claude) aşağıdaki kurallara **kesinlikle** uymak zorundadır:

## 1. Evidence-First (Kanıt Odaklılık) ve Doğruluk
- Yapılan her değişiklik, öneri veya analiz doğrulanmış verilere, GitHub API/test kayıtlarına ve KPanel üzerinde bilinen mevcut route/endpoint'lere dayanmalıdır.
- Hiçbir iddia tahmine dayandırılmamalı; her önemli tespitin yanına kaynak belgesi ve bölümü yazılmalıdır.

## 2. No-Hallucination (Halüsinasyon Yasağı)
- Doğrulanmamış hiçbir KPanel endpoint'i, alanı, arayüz öğesi, slug veya sistem davranışı uydurulmayacaktır.
- Arama motorunda sıralama garantisi, kesin trafik artışı veya AI arama cevaplarında yer alma vaatleri doğrulanmış sayılmaz ve garanti edilemez.

## 3. UNKNOWN Prensibi
- Kesin veya bağımsız kanıtı bulunmayan her türlü özellik, arayüz alanı, veri veya sistem davranışı **UNKNOWN** olarak işaretlenmelidir.
- KPanel'de bir şeyin düzenlenebilirliği varsayılmamalı; doğrulanmadıysa `UNKNOWN/ENGELLİ` olarak kaydedilmelidir.

## 4. Canlı Sistem Güvenliği ve READ-ONLY Kısıtı
- Canlı site ile GitHub deposu aynı şey değildir. GitHub üzerinde çalışmak canlı siteye müdahale yetkisi vermez.
- KPanel erişimi varsayılan olarak salt-okunurdur (default-deny).
- **C-09/B Kararı POST İzni Değildir:** KPanel DataTables veya diğer uç noktalara POST istekleri gönderilemez; POST koruması yürürlüktedir.
- Canlı sistem üzerinde (KPanel üzerinden) her türlü kayıt, düzenleme, silme, yönlendirme, sitemap ve canonical değişikliği için **önceden işlem bazında ayrı açık insan onayı** zorunludur.

## 5. Ajan Rol Dağılımı ve Üretim Mimarisi (Karar C-16/B)
İçerik üretim hattı sıralı uzmanlaşma modeliyle çalışır:
- **Claude:** Özgün, yerel verilere ve kanıtlara dayalı taslak üretimi.
- **Codex:** Bağımsız SEO, semantik bütünlük, yerel doğruluk, schema, meta, iç/dış bağlantı ve teknik kalite denetimi.
- **Judge:** Kanıt kontrolü sonucunda `ONAY ÖNERİSİ`, `REVİZYON` veya `RET` değerlendirmesi.
- **İnsan Operatör:** Nihai kabul ve KPanel'e elle yükleme (Review sonrası publish). Otomatik canlı yayın yetkisi yoktur.

## 6. Otonomiye Geçiş ve Pilot Kabul Kapısı (Karar C-21/A – C-33/A)
Bulut ajanlarının otonom araştırma ve taslak üretimine başlayabilmesi için:
- En az 3 farklı sorun/sayfa türünde manuel SEO pilotunun başarıyla tamamlanması şarttır (`C-23/A`).
- Her pilot için değişiklik öncesi `C-30/A` ayrıntılı onay dosyası hazırlanmalı, değişiklik görünür KPanel yönetim ekranından uygulanmalı (`C-29/A`), `C-22/A` kapsamlı teknik/içerik/güvenlik kontrolünü geçmeli ve 24–72 saat sonraki izinli tekrar kabul testinden (`C-32/A`) başarıyla çıkmalıdır.
- Kritik bir hata çıkarsa işlem derhal durdurulur; geri alma ancak hata sonrası kullanıcıdan alınan ayrı açık onayla KPanel arayüzünden yapılabilir (`C-31/A`).

## 7. Tekrarlanan A/B Soru Döngüsünün Kapatılması
- `C-01`–`C-33` arasındaki strateji ve politika seçimleri çözülmüştür (`ÇÖZÜLDÜ`).
- Ajanlar daha önce çözülmüş A/B sorularını kullanıcıya tekrar sormamalıdır; geçmiş güvenli kararlardan türetilen varsayılanlarla ilerlenmeli, veri eksikse iş `UNKNOWN/ENGELLİ` olarak kaydedilmelidir.

## 8. Kapsam Dışı Projeler
- **UYAP Motor** ve **Stage 1 UYAP** projeleri kaynak seviyesinde tamamen kapsam dışıdır; bu projelere ait hiçbir bilgi, dosya veya analiz bu depoya dahil edilemez.
```

---

## 4. Taslak: `BACKLOG.md` (Güncelleme)

```markdown
# Come Rent Proje İş Listesi (Backlog)

Bu liste, Come Rent teknik SEO ve içerik optimizasyon görevlerini kanıt düzeylerine ve öncelik kuyruklarına göre sınıflandırır.

---

## A. İlk Manuel SEO Pilot Kuyruğu (Halka Açık, Yayındaki Sayfalar — Karar C-24, C-26, C-27)

Bu adaylar 15 Ekim 2026 kamuya açık taramasından çıkarılan çevrimdışı ön adaylardır (`C-25/B`). Her biri üzerinde işlem yapılmadan önce hedefli canlı URL doğrulaması (`C-28/B`) ve KPanel alan teyidi yapılmalıdır.

1. **Pilot Adayı 1 — Canonical Uyumsuzluğu (`CANONICAL_MISMATCH`):**
   - **URL:** `https://www.comerent.net/cerez-politikas%C4%B1`
   - **Gözlem:** 15 Ekim taramasında canonical mismatch sinyali verdi.
   - **Gereken:** Doğru canonical hedefinin tespiti, bugünkü HTTP durumunun teyidi ve KPanel editör alanından kontrollü düzeltme (`C-29/A`, `C-30/A`).
2. **Pilot Adayı 2 — Yönlendirme ve Niyet İncelemesi (`REDIRECT`):**
   - **URL:** `https://www.comerent.net/sss` → `/kiralama-kosullari` yönlendirmesi
   - **Gözlem:** SSS sorgu niyetinin kiralama koşullarına yönlendirilmesi.
   - **Gereken:** Arama niyeti ve KPanel yönlendirme kaydının doğrulanması; gerekirse bağımsız SSS içerik sayfası planlanması.
3. **Pilot Adayı 3 (Araştırma Bekliyor — Karar C-33/A):**
   - **Durum:** 15 Ekim raporunda farklı türde 3. bir güvenli yayındaki aday bulunmadığından, yayındaki diğer halka açık sayfalar arasından (ör. iç link veya içerik doğruluğu sorunu) kontrollü ek aday araştırması planlanacaktır.

---

## B. Tarihsel İddialar (Sayfa Bazlı Doğrulama Bekliyor — Karar C-07)

Aşağıdaki maddeler geçmiş geliştirme kayıtlarından (`TARİHSEL`) gelmektedir; bugünkü canlı sistemde varlıkları henüz doğrulanmamıştır (`UNKNOWN`). Doğrulanmadan P0/P1 onarım işlemi yapılamaz.

- **[TARİHSEL P0] Canonical Problemleri:** Gaziantep, Van ve çerez sayfalarında geçmişte raporlanan canonical hedeflerinin güncel durumu doğrulanmalıdır.
- **[TARİHSEL P0] İçerik Karışması:** Ordu ve Siirt sayfaları arasındaki içerik örtüşmesinin güncel durumu incelenmelidir.
- **[TARİHSEL P0] Hreflang Hataları:** Clio, Symbol ve Egea sayfalarında hatalı hreflang hedeflerinin varlığı ve KPanel dil desteği denetlenmelidir.
- **[TARİHSEL P1] Placeholder İletişim Bilgisi:** Erzincan içerik bağlamındaki örnek telefon numarasının kaynağı (alan/template/JSON-LD) doğrulanmalıdır.
- **[TARİHSEL P1] `/iletisim` Bağlantı Bağlamı:** Modal veya yanlış içerik alanında yer aldığı iddia edilen iletişim linklerinin incelenmesi.

---

## C. 404 ve Eksik Ticari Sayfa İnceleme Kuyruğu (Karar C-27/A — İlk 3 Pilot Dışı)

15 Ekim 2026 taramasında HTTP 404 veren ticari ve pazarlama URL'leri. Hizmet kanıtlanmadan yeni sayfa açılmaz veya otomatik 301 yapılmaz:
- `/hakkari-havalimani` (Parent şehir kaydı ve Yüksekova Havalimanı hizmet doğrulaması)
- `/arac-kiralama-firmalari` (Tedarikçi dizin sayfası karşılığı)
- `/come-rent-sadakat-programi-daha-fazla-kirala-daha-fazla-kazan` (Sadakat programı aktiflik teyidi)
- `/odemeniz-guvende-seyahatiniz-keyifli-guvenli-odeme-secenekleri-come-rentte` (Ödeme sayfası geçerlilik teyidi)
- `/zaman-fark-etmez-biz-hep-buradayiz-come-rent` (Destek saatleri taahhüdü teyidi)
- `/anket` (Form/işlem niyeti incelemesi)
- `/canakkale-arac-kiralama` (15 Ekim'de `FETCH_FAILED` verdi; 404 olduğu doğrulanmadı)

---

## D. İşlem, Hesap ve Sitemap Temizlik Kuyruğu (Karar C-18/A, C-26/A — İlk 3 Pilot Dışı)

Sitemap içinde yer alan ancak işlem, oturum veya hesap silme işlevi taşıyan URL'lerin incelenmesi ve sitemap temizlik planı:
- İşlemsel 404 URL'leri: `/reservasyon-basarili`, `/rezervasyonunuz-alindi`, `/sifremi-unuttum`, `/simdi-kirala`
- Eylem URL'leri: `/cikis-yap`, `/hesabimi-sil`, `/rezervasyon-sorgula`, `/uye-kayit`
- `CANONICAL_MISSING` sayfaları: `/uyelik-bilgilerim`, `/not-found`, `/server-error`
```

---

## 5. Taslak: `docs/kpanel-known-facts.md` (Güncelleme)

```markdown
# KPanel Bilinen Gerçekler ve Doğrulanmış Rotalar

Bu doküman, KPanel (`https://kpanel.comerent.net`) hakkında **yalnızca doğrulanmış** özellikleri, rotaları ve statik JS varlıklarını belgeler. Doğrulanmamış hiçbir bilgi bu listeye eklenemez.

## 1. Yönetim Paneli ve Erişim Sınırları
- **Yönetim Paneli Origin:** `https://kpanel.comerent.net`
- **Erişim Durumu:** Canlı sitenin hosting, sunucu kaynak kodu, deployment ve doğrudan veritabanı erişimi yoktur. Uygulanabilir tüm canlı değişiklikler KPanel üzerinden gerçekleştirilir.
- **Tedarik Modeli:** `OWN + PARTNER NETWORK` (Broker / karma tedarikçi ağı).
- **Lokasyon Sınıflandırması:** Yalnızca doğrulanmış fiziksel Come Rent noktaları "ofis"tir; diğerleri "partner teslim noktası"dır.
- **Canlı Rezervasyon Kriteri:** Rezervasyon yapılabilen lokasyonlar iş kuralı gereği `SERVICEABLE_LOCATION=YES` ve `LIVE_BOOKING=YES` kabul edilir; veritabanında fiziksel alan olup olmadığı **UNKNOWN**'dur.

## 2. Doğrulanmış 14 GET Rotası (`SAFE_GET_VERIFIED`)
Aşağıdaki yollar GitHub Actions Run `38268763677` ile taranmış, 52/52 güvenlik testini geçmiş ve varlığı doğrulanmış rotalardır:
- `/icerik-listesi/1`
- `/icerik-listesi/6`
- `/icerik-listesi/7`
- `/icerik-listesi/8`
- `/icerik-listesi/9`
- `/icerik-listesi/11`
- `/icerik-listesi/12`
- `/icerik-listesi/13` *(Kullanıcı ekranında: Şehirler)*
- `/yonlendirme`
- `/icerik-grup-listesi`
- `/etiket-listesi`
- `/sehirler`
- `/lokasyon-listesi`
- `/arac-kategorisi`

*(Not: 13 içerik tipi mevcuttur: Blog, Sayfa, Şehir, Lokasyon, Araç Sınıfı, Kampanyalar, SSS, Tedarikçi, Tedarikçi Sözleşmesi, Form, Link, Manşet, Popup. Rota numaralarının Şehirler dışındaki eşleşmeleri UNKNOWN'dur).*

## 3. Doğrulanmış Statik JS Varlıkları (Run 38390362278 & 38394967907)
- `/assets/js/kpaneljs/ContentsJS/contents.common.js`
- `/assets/js/kpaneljs/RedirectionsJS/redirections.common.js`
- `/assets/js/kpaneljs/RedirectionsJS/redirections.create.js`
- `/assets/js/kpaneljs/ContentGroupsJS/content-groups.common.js`
- `/assets/js/kpaneljs/LabelsJS/labels.common.js`
- `/assets/js/kpaneljs/CitiesJS/cities.common.js`
- `/assets/js/kpaneljs/LocationJS/locations.common.js`
- `/assets/js/kpaneljs/LocationJS/locations-vendor.modal.js`
- `/assets/js/kpaneljs/VehicleGroupsJS/vehicle-groups.common.js`

## 4. Statik JS Analiziyle Tespit Edilen Endpoint Sınıflandırmaları
- **Okuma Amaçlı Görünen Ancak POST Olduğu İçin Engellenenler (`POST_READ_LIKE_BLOCKED_BY_POLICY`):**
  - `POST /Cities/GetCities`
  - `POST /Contents/GetContents`
  - `POST /Labels/GetLabels`
  - `POST /VehicleGroups/GetVehicleGroups`
  *(Not: C-09/B kararı uyarınca bunlar için salt-okunurluk kanıtı ve ayrı açık kullanıcı yetkilendirmesi süreci tasarlanabilir; şu an POST izni yoktur).*
- **Kesinlikle Yasaklı Durum Değiştirici POST Uç Noktaları (`WRITE_POST_BLOCKED`):**
  - `POST /Contents/BulkUpdateContentOrder`
  - `POST /Locations/BulkUpdateLocationStatus`
  - `POST /Redirections/SaveNewRedirection`
- **Yöntemi Bilinmeyen ve Çağrılması Yasak Uç Nokta (`UNKNOWN_DO_NOT_CALL`):**
  - `/Locations/GetExcelReport` (Method: UNKNOWN; çağrılamaz).
- **Yasaklı Kaydetme Mekanizması:**
  - Tarihsel `Content ID 7` denemesinde tespit edilen `UpdateAllContent` mekanizması `BLOCKED_BY_SAVE_MECHANISM` durumundadır; güvenli kaydetme yöntemi kanıtlanmadan kullanılamaz.
```

---

## 6. Pilot Değişiklik ve Onay Dosyası Şablonu (Karar C-30/A)

Her canlı KPanel SEO pilotu uygulanmadan **önce** kullanıcıya sunulacak standart dosya formatıdır:

```markdown
# Pilot Değişiklik ve Onay Paketi: [PILOT_ID] — [KISA_BASLIK]

- **Hedef Canlı URL:** [Örn: https://www.comerent.net/cerez-politikas%C4%B1]
- **KPanel Rota ve Kayıt/Alan Kimliği:** [Örn: /icerik-listesi/6 — Content ID: XXX — Alan: Canonical URL / Meta Tags]
- **Tarihli Kanıt ve Kaynak:** [Örn: 15 Ekim 2026 kamuya açık tarama raporu, Batch 0 — CANONICAL_MISMATCH tespit edildi]
- **Mevcut (Eski) Değer:** [KPanel ekranından okunan doğrulanmış eski değer]
- **Önerilen Yeni Değer:** [Uygulanması teklif edilen tam yeni değer]
- **SEO ve Doğruluk Gerekçesi:** [Neden değiştirilmeli? Hangi indeksleme/canonical riskini gideriyor?]
- **Beklenen Etki:** [Kullanıcı deneyimi, arama motoru indekslemesi ve teknik taranabilirlik üzerindeki net etki]
- **Risk Değerlendirmesi:** [Yanlış yönlendirme, 404 riski veya yetkisiz işlem olasılıkları analizi]
- **Uygulanabilir Geri Dönüş (Rollback) Planı:** [Kritik hata durumunda KPanel arayüzünden eski değere nasıl dönülecek?]
- **Kabul Testleri (Karar C-22/A):**
  - [ ] 1. Canlı HTTP durum kodu (200 OK) ve yönlendirmesiz doğrudan yanıt
  - [ ] 2. Canonical etiketinin tam eşleşmesi (`MATCH`)
  - [ ] 3. İç bağlantıların ve sitemap uyumunun doğrulanması
  - [ ] 4. Müşteri odaklı bilgilerin ve işletme modelinin gerçeğe uygunluğu
  - [ ] 5. Yetkisiz hiçbir ek işlemin veya form gönderiminin yapılmadığının kanıtı
  - [ ] 6. 24–72 saat sonraki izinli tekrar kontrol planı (Karar C-32/A)

> **Kullanıcı Onay Sorusu:** Yukarıdaki `[PILOT_ID]` değişikliğinin KPanel yönetim arayüzünden (`C-29/A`) uygulanmasını onaylıyor musunuz? [EVET / HAYIR]
```
