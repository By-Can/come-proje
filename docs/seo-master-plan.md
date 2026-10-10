# Come Rent SEO Master Planı

Bu doküman, Come Rent (comerent.net) projesini organik arama, yapay zeka aramaları ve dönüşüm performansında lider seviyeye taşımak amacıyla uygulanacak stratejik master planı içermektedir. Tüm değişiklikler, doğrulanan KPanel arayüzü üzerinden planlanmalıdır.

## 1. Technical SEO (Teknik SEO)
- **Canonical Yönlendirmeleri:** Gaziantep, Van ve çerez sayfalarındaki mevcut canonical hatalarının analiz edilip düzeltilmesi (P0).
- **Hreflang Etiketleri:** Clio, Symbol ve Egea gibi araç sayfalarında yaşanan hatalı hreflang hedeflerinin incelenmesi ve düzeltilmesi (P0). (Not: KPanel'in uluslararası dil eşleme/generator kaynağının ve yeteneğinin henüz ne olduğu **UNKNOWN**'dur, hiçbir yapılandırma varsayılmamıştır).
- **Indexation (Dizine Ekleme):** Sitemap içinde yer alan ve inceleme gerektiren URL'lerin status, canonical ve indexability sınıflandırmasının yapılıp arama motoru bütçesi stratejisinin belirlenmesi (P1).

## 2. Semantic SEO (Anlamsal SEO) & Content
- **İçerik Karışıklıklarının Giderilmesi:** Ordu ve Siirt sayfaları arasındaki içerik örtüşmesinin/karışmasının çözülmesi (P0).
- **Placeholder Hataları:** Erzincan içeriğindeki placeholder (örnek) iletişim numarası için öncelikle kaynağın (alan/template/JSON-LD) tespit edilmesi; kaynak kesin olarak doğrulanmadan doğrudan değer değiştirme önerisi verilmemesi (P1).
- **Bilgi Mimarisinin Düzenlenmesi:** `/iletisim` gibi yanlış konumlandığından şüphelenilen bağlantıların kullanım bağlamlarının incelenmesi (P1).

## 3. Local SEO (Yerel SEO)
- **Lokasyon Doğrulaması:** READ-ONLY olarak doğrulanan `/sehirler` ve `/lokasyon-listesi` yolları kullanılarak mevcut veriler analiz edilecek; iş modeli gereği rezervasyon yapılabilen (çalışma modelinde `SERVICEABLE_LOCATION=YES` ve `LIVE_BOOKING=YES` kabul edilen) gerçek "Come Rent" ofisleri Google My Business (GMB) ve yerel arama stratejilerinde önceliklendirilecektir. (Not: Bu kriterlerin KPanel'de fiziksel alan/kolon olup olmadığı UNKNOWN'dur).
- **Partner Teslim Noktaları:** İş ortağı lokasyonlarının "ofis" olarak geçmemesi için içeriklerde doğru terminoloji ("teslim noktası") kullanılması.

## 4. Programmatic SEO (Programatik SEO)
- Daha önce READ-ONLY olarak erişilen `/icerik-listesi/*` ve `/arac-kategorisi` yolları analiz edilecektir. (Not: Bu endpoint'lerin veri yapısı ve sayfa oluşturma/yazma kabiliyeti doğrulanmamıştır, dolayısıyla bu kabiliyetler **UNKNOWN** kabul edilmelidir).

## 5. GEO / AI Search Optimizasyonu
- **Cevap Motorları Optimizasyonu (AEO):** ChatGPT, Perplexity, Gemini gibi AI tabanlı arama motorları için doğal dil, soru-cevap formatlı, zenginleştirilmiş metinlerin (SSS) KPanel içerik modülleri kullanılarak oluşturulması.
- İçeriklerin belirgin ve net (evidence-based) olması sağlanarak LLM (Büyük Dil Modeli) halüsinasyonlarının önüne geçilmesi.

## 6. Schema (Yapısal Veri) & Internal Linking
- **Schema Markup:** Organizasyon, Yerel İşletme (LocalBusiness), Araç Kiralama (RentalCarReservation), SSS (FAQ) yapısal verilerinin sayfalarla entegrasyonu (KPanel sınırları içerisinde).
- **Internal Linking (Site İçi Linkleme):** Anahtar kelime odaklı otorite sayfaları (örneğin araç modelleri, kategoriler, popüler lokasyonlar) ile destekleyici sayfalar arasında güçlü bir site içi linkleme mimarisi oluşturulması.

## 7. CRO (Dönüşüm Oranı Optimizasyonu)
- **Kullanıcı Deneyimi (UX):** Rezervasyon sürecinde online işlem yapılabilen (iş modelinde LIVE_BOOKING olarak kabul edilen) lokasyon/araçların ön plana çıkarılması.
- Ziyaretçilerin doğru lokasyonlara ve doğru araç sayfalarına en kısa sürede ulaşmalarını sağlamak adına sayfa içi net Call-to-Action (CTA) yerleşimlerinin planlanması.
