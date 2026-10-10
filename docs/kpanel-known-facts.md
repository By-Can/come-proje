# KPanel Bilinen Gerçekler (Known Facts)

Bu doküman, KPanel hakkında **sadece doğrulanmış** bilgileri ve erişim yollarını (route) içerir. Doğrulanmamış hiçbir bilgi bu listeye eklenemez.

## Doğrulanmış Özellikler
- **Yönetim Paneli Adı:** KPanel
- **Erişim Türü:** Hosting, source, deploy, shell veya doğrudan veritabanı erişimi yoktur. Uygulanabilir canlı değişiklik kanalı tamamen KPanel'dir (ancak bu ifade, ajanların izinsiz olarak KPanel üzerinden canlı değişiklik yapabileceği anlamına gelmez).
- **Lokasyon Yönetimi:**
  - **İş kuralı:** Canlı online rezervasyon yapılabildiği doğrulanan mevcut lokasyonlar çalışma modelinde `SERVICEABLE_LOCATION=YES` ve `LIVE_BOOKING=YES` olarak sınıflandırılır. Bunların KPanel'de fiziksel alan/kolon olarak bulunduğu doğrulanmamıştır; bu konu **UNKNOWN**'dur.
  - Sadece doğrulanmış "Come Rent" noktaları "ofis" olarak adlandırılabilir.
  - Diğer lokasyonlar "partner teslim noktası" statüsündedir (Tedarik Modeli: OWN + PARTNER NETWORK).

## Doğrulanmış GET Yolları (Routes)
Aşağıdaki yollar daha önce READ-ONLY inceleme kapsamında erişilmiş/doğrulanmış KPanel yollarıdır. Bu kayıt, route'un varlığını doğrular; endpoint'in tüm davranışları veya yazma kabiliyeti hakkında ek varsayım yapılmaz:

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

*(Not: Listelenmeyen tüm yollar, özellikler veya ayar bölümleri **UNKNOWN** olarak kabul edilmelidir.)*
