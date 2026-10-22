# Come Rent Proje İş Listesi (Backlog)

Bu backlog, KPanel üzerinden yapılacak SEO ve operasyonel iyileştirme görevlerini öncelik sırasına göre listeler.

## P0 - Kritik Aciliyet (Hemen Çözülmesi Gerekenler)

### Yeni Doğrulanmış P0 Bulgularları (22 Ekim 2026) — Task Kartı Olarak İşleniyor

- [ ] **[P0] – Ana Sayfa – Title & Meta Description Placeholder Düzeltmesi**
  - Açıklama: Ana sayfa title alanı (`ARAÇ KİRALAMA -`) ve meta description (`kolayCar`) placeholder değerleri; gerçek içerikle değiştirilmeli.
  - Durum: ✅ Doğrulandı (22 Ekim 2026).
  - Öncelik: P0.
  - KPanel'deki iş: **İçerikler → Sayfa → ID `-1`** → `Meta Title`, `Meta Description`, `Header` alanları güncellenecek.

- [ ] **[P0] – Symbol Sayfası – Title / Hreflang İçerik Karışması**
  - Açıklama: Symbol sayfasında title/hreflang çakışması (`de-de → audi-a3`). Title alanının doğru hedefi (`audi-a3`) belirtildi; hreflang etiketleri düzeltilmeli.
  - Durum: ✅ Doğrulandı (22 Ekim 2026).
  - Öncelik: P0.
  - KPanel'deki iş: **Araçlar → Araç Listesi → Symbol →** `VehicleClassName` (TR) / `brandId` / `modelId` düzeltilecek; `de-de` hreflang hedefi `/de/mietwagen/renault-symbol` olacak şekilde yönlendirilecek.

### KPanel'de Yapılacak P0 İşler (Doğrulama + Eylem)

- [ ] **[P0] – Ana Sayfa Title/Description** (KPanel: **İçerikler → Sayfa → ID `-1`** → Meta Title / Meta Description / Header güncellenecek)
- [ ] **[P0] – Symbol Title/Hreflang** (KPanel: **Araçlar → Araç Listesi → Symbol →** VehicleClassName / brandId / modelId düzenlenecek; hreflang `de-de → /de/mietwagen/renault-symbol` olacak şekilde yönlendirilecek)
- [ ] **[P0] – Canonical Sorunları (Gaziantep, Van, Çerez): Routing/404** (KPanel: **Tanım → Lokasyonlar → Şehir** → rotalar aktif, 200 durumunda, canonical doğru sayfa URL'si olacak şekilde yönlendirilecek)

## P1 - Yüksek Öncelik (Kısa Vadede Çözülmesi Gerekenler)
*   **Placeholder İletişim Bilgileri:** Erzincan içerik bağlamında unutulan placeholder telefon numarasının güncellenmesi.
*   **Yanlış Konumlandırılan Bağlantılar:** `/iletisim` bağlantılarının beklenmeyen içerik alanlarında bulunduğuna dair bulgunun incelenmesi. Kullanım bağlamı ve kaynak alanı incelenerek, yalnızca gerçekten hatalı olan kullanımların düzeltilmesi.
*   **Sitemap İncelemesi:** Sitemap içinde inceleme gerektiren çok sayıda URL'in denetlenmesi. Bu URL'ler önce status code, canonical, indexability, redirect, içerik ve sitemap uygunluğu bakımından sınıflandırılacak; alınacak aksiyon (tutma, kaldırma veya düzeltme) bu analizin sonucuna göre belirlenecektir.

## P2 - Orta Öncelik (Planlı İyileştirmeler)
*   *Bu alana daha sonra KPanel denetimleri ve yeni SEO stratejileri doğrultusunda görevler eklenecektir.*

## P3 - Düşük Öncelik (Uzun Vadeli Hedefler / İyileştirmeler)
*   *Bu alana yapısal uzun vadeli optimizasyonlar ve GEO/AI Search stratejisine yönelik ileri düzey adımlar eklenecektir.*