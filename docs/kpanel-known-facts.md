# KPanel Bilinen Gerçekler (Known Facts)

Bu doküman, KPanel hakkında **sadece doğrulanmış** bilgileri ve erişim yollarını (route) içerir. Doğrulanmamış hiçbir bilgi bu listeye eklenemez.

## Doğrulanmış Özellikler
- **Yönetim Paneli Adı:** KPanel
- **Erişim Türü:** Sadece arayüz üzerinden işlem yapılmaktadır. Canlı sisteme veya veritabanına doğrudan yazma, shell veya kod erişimi yoktur.
- **Lokasyon Yönetimi:**
  - `SERVICEABLE_LOCATION=YES` ve `LIVE_BOOKING=YES` işaretli lokasyonlarda online rezervasyon yapılabilmektedir.
  - Sadece doğrulanmış "Come Rent" noktaları "ofis" olarak adlandırılabilir.
  - Diğer lokasyonlar "partner teslim noktası" statüsündedir (Tedarik Modeli: OWN + PARTNER NETWORK).

## Doğrulanmış GET Yolları (Routes)
Aşağıdaki KPanel GET endpoint'leri/yolları doğrulanmıştır ve analiz veya veri inceleme amacıyla kullanımları güvenlidir:

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
