# KPanel READ-ONLY Audit Operations

Bu doküman, KPanel üzerindeki SEO, içerik ve teknik verilerin READ-ONLY olarak güvenli biçimde nasıl audit (denetim) edileceğini açıklamaktadır.

## Temel Güvenlik Prensipleri (Security Invariants)

KPanel audit operasyonları, kesin kurallara dayalı bir `default-deny` yaklaşımını benimser. Canlı sistemin güvenliğini ve bütünlüğünü korumak adına aşağıdaki kurallar hiçbir koşulda esnetilemez:

### 1. Doğrulanmış KPanel Origin
Tüm işlemler yalnızca `https://kpanel.comerent.net` origin'i üzerinden yapılmalıdır.
- `http://`, custom port kullanımları ve `//` ile başlayan protocol-relative URL'ler tamamen reddedilir.
- Kullanıcı bilgisi içeren (embedded credentials) URL'ler kabul edilmez.

### 2. Sıkı Route (Yol) Allowlist
Yalnızca önceden tanımlanmış ve doğrulanmış `pathname` değerlerine izin verilir:
- `/icerik-listesi/1`
- `/icerik-listesi/6`
- `/icerik-listesi/7`
- `/icerik-listesi/8`
- `/icerik-listesi/9`
- `/icerik-listesi/11`
- `/icerik-listesi/12`
- `/icerik-listesi/13`
- `/yonlendirme`
- `/icerik-grup-listesi`
- `/etiket-listesi`
- `/sehirler`
- `/lokasyon-listesi`
- `/arac-kategorisi`

*(Query parametreleri, pathname izinliyse kabul edilir).*
Bu liste dışındaki herhangi bir rotaya yapılan istek, anında engellenir.

### 3. HTTP Method Kısıtlaması
Yalnızca okuma (READ-ONLY) işlemlerine izin verilir:
- İzinli: `GET`, `HEAD`
- Kesinlikle Yasaklı: `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`

### 4. Yönlendirme (Redirect) Güvenliği
Yönlendirmeler otomatik takip edilmez (`redirect: "manual"`). Her yönlendirme zincirinde (hop) yukarıdaki kurallar (origin, allowlist vb.) yeniden doğrulanır.
- Maksimum yönlendirme sınırı (max redirects = 5) aşıldığında işlem durdurulur (Redirect Loop Koruması).
- Dış (harici) yönlendirmelere ve allowlist dışı yönlendirmelere izin verilmez.

### 5. Hassas Veri (Secret/Auth Data) Redaksiyonu
Audit sonuçları raporlanırken ya da kanıt (evidence) toplanırken, hassas veriler maskelenir (`[REDACTED]`).
Maskelenen veriler arasında şunlar bulunur: `password`, `token`, `session`, `cookie`, `authorization`, `api-key`, `csrf` vb.

### 6. HTML Evidence ve XSS/CSRF Koruması
Ham HTML içeriği doğrudan kanıt klasörlerine kaydedilmez. Kaydedilmeden önce pasif olarak (`cheerio` kullanılarak) ayrıştırılır:
- Şifre (password) girdileri maskelenir.
- Gizli `input` (hidden CSRF/token) değerleri maskelenir.
- `meta` etiketlerindeki CSRF/token değerleri maskelenir.
- İstemci taraflı betikler (`<script>`) tamamen kaldırılır ve form gönderim (`action`) özellikleri temizlenir.

### 7. Dosya Yazma ve Dizin Dışına Çıkma (Path Traversal) Koruması
Audit sonuçları yalnızca `audit/evidence/`, `audit/findings/` veya `audit/reports/` klasörleri altına yazılabilir.
- `../`, mutlak yollar (absolute path) veya `null byte` içeren dosya isimleri kesinlikle reddedilir. Otomatik düzeltme (sanitize) yapılmaz; güvensiz talep doğrudan reddedilir.
