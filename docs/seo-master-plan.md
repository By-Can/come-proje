# Come Rent SEO Master Planı

Bu doküman, Come Rent (comerent.net) projesini organik arama, yapay zeka aramaları ve dönüşüm performansında lider seviyeye taşımak amacıyla uygulanacak stratejik master planı içermektedir. Tüm değişiklikler, doğrulanan KPanel arayüzü üzerinden planlanmalıdır.

## 1. Technical SEO (Teknik SEO)
- **Canonical Yönlendirmeleri:** Gaziantep, Van ve çerez sayfalarındaki mevcut canonical hatalarının analiz edilip düzeltilmesi (P0).
- **Hreflang Etiketleri:** Clio, Symbol ve Egea gibi araç sayfalarında yaşanan hatalı hreflang yapılandırmalarının KPanel üzerinden yönetilen uluslararası içerik stratejisine uygun hale getirilmesi (P0).
- **Indexation (Dizine Ekleme):** Sitemap içinde yer alan ve inceleme gerektiren gereksiz veya hatalı URL'lerin ayıklanarak arama motoru bütçesinin (crawl budget) optimize edilmesi (P1).

## 2. Semantic SEO (Anlamsal SEO) & Content
- **İçerik Karışıklıklarının Giderilmesi:** Ordu ve Siirt sayfaları arasındaki içerik örtüşmesinin/karışmasının çözülmesi (P0).
- **Placeholder Hataları:** Erzincan içeriğindeki placeholder (örnek) iletişim bilgilerinin, gerçek ve doğru bilgilerle güncellenmesi (P1).
- **Bilgi Mimarisinin Düzenlenmesi:** Yanlış konumlanmış bağlantıların (`/iletisim` gibi) tespit edilerek hiyerarşik yapıya uygun alanlara taşınması (P1).

## 3. Local SEO (Yerel SEO)
- **Lokasyon Doğrulaması:** KPanel'deki `/sehirler` ve `/lokasyon-listesi` verileri kullanılarak, sadece `SERVICEABLE_LOCATION=YES` ve `LIVE_BOOKING=YES` kriterlerine uyan gerçek "Come Rent" ofislerinin Google My Business (GMB) ve yerel arama stratejilerinde önceliklendirilmesi.
- **Partner Teslim Noktaları:** İş ortağı lokasyonlarının "ofis" olarak geçmemesi için içeriklerde doğru terminoloji ("teslim noktası") kullanılması.

## 4. Programmatic SEO (Programatik SEO)
- Ölçeklenebilir açılış sayfalarının (örneğin şehir + araç kategorisi) `/icerik-listesi/*` ve `/arac-kategorisi` endpoint verileriyle KPanel'in izin verdiği sınırlar dahilinde oluşturulması.

## 5. GEO / AI Search Optimizasyonu
- **Cevap Motorları Optimizasyonu (AEO):** ChatGPT, Perplexity, Gemini gibi AI tabanlı arama motorları için doğal dil, soru-cevap formatlı, zenginleştirilmiş metinlerin (SSS) KPanel içerik modülleri kullanılarak oluşturulması.
- İçeriklerin belirgin ve net (evidence-based) olması sağlanarak LLM (Büyük Dil Modeli) halüsinasyonlarının önüne geçilmesi.

## 6. Schema (Yapısal Veri) & Internal Linking
- **Schema Markup:** Organizasyon, Yerel İşletme (LocalBusiness), Araç Kiralama (RentalCarReservation), SSS (FAQ) yapısal verilerinin sayfalarla entegrasyonu (KPanel sınırları içerisinde).
- **Internal Linking (Site İçi Linkleme):** Anahtar kelime odaklı otorite sayfaları (örneğin araç modelleri, kategoriler, popüler lokasyonlar) ile destekleyici sayfalar arasında güçlü bir site içi linkleme mimarisi oluşturulması.

## 7. CRO (Dönüşüm Oranı Optimizasyonu)
- **Kullanıcı Deneyimi (UX):** Rezervasyon sürecinde online işlemlerin (LIVE_BOOKING) ön plana çıkarılması.
- Ziyaretçilerin doğru lokasyonlara ve doğru araç sayfalarına en kısa sürede ulaşmalarını sağlamak adına sayfa içi net Call-to-Action (CTA) yerleşimlerinin planlanması.
