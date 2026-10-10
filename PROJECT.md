# Come Rent Proje Başlangıç Görevi

## Hedefler
- Come Rent'i (comerent.net) araç kiralama sektöründe organik arama, yapay zeka aramaları ve dönüşüm performansında lider seviyeye taşımak.

## Doğrulanmış Gerçekler
- **Ana Site:** comerent.net
- **Yönetim Paneli:** KPanel
- **Tedarik Modeli:** OWN + PARTNER NETWORK.
- **Aktif Rezervasyon Lokasyonları:** İş kuralı: Canlı online rezervasyon yapılabildiği doğrulanan mevcut lokasyonlar çalışma modelinde `SERVICEABLE_LOCATION=YES` ve `LIVE_BOOKING=YES` olarak sınıflandırılır. Bunların KPanel'de fiziksel alan/kolon olarak bulunduğu doğrulanmamıştır; bu konu **UNKNOWN**'dur.
- **Ofis Tanımı:** Yalnız doğrulanmış Come Rent noktaları “ofis” olarak adlandırılabilir; diğerleri partner teslim noktasıdır.

## Çalışma Sınırları
- Hosting, source code ve deployment erişimi **yoktur**.
- Tüm canlı uygulanabilir değişiklikler **yalnızca KPanel üzerinden** yapılacaktır.
- KPanel READ-ONLY incelemesi yapılabilir; canlı sistemde (KPanel üzerinden) değişiklik yalnız açık kullanıcı onayı ve kontrollü uygulama aşamasında yapılabilir.
- Varsayımsal KPanel endpoint'i, alanı veya davranışı üretilmeyecektir (No-hallucination).

## UNKNOWN Alanlar
- Doğrulanmamış hiçbir KPanel endpoint’i, alanı veya davranışı kabul edilemez. Bilinmeyen veya doğrulanmamış her şey **UNKNOWN** olarak işaretlenmelidir.
