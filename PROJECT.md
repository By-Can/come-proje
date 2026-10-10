# Come Rent Proje Başlangıç Görevi

## Hedefler
- Come Rent'i (comerent.net) araç kiralama sektöründe organik arama, yapay zeka aramaları ve dönüşüm performansında lider seviyeye taşımak.

## Doğrulanmış Gerçekler
- **Ana Site:** comerent.net
- **Yönetim Paneli:** KPanel
- **Tedarik Modeli:** OWN + PARTNER NETWORK.
- **Aktif Rezervasyon Lokasyonları:** Online rezervasyon yapılabilen mevcut lokasyonlar `SERVICEABLE_LOCATION=YES` ve `LIVE_BOOKING=YES` kabul edilir.
- **Ofis Tanımı:** Yalnız doğrulanmış Come Rent noktaları “ofis” olarak adlandırılabilir; diğerleri partner teslim noktasıdır.

## Çalışma Sınırları
- Hosting, source code ve deployment erişimi **yoktur**.
- Tüm canlı uygulanabilir değişiklikler **yalnızca KPanel üzerinden** yapılacaktır.
- KPanel’e bağlanma, credential isteme veya canlı sisteme yazma işlemi **yapılmayacaktır**.
- Varsayımsal KPanel endpoint'i, alanı veya davranışı üretilmeyecektir (No-hallucination).

## UNKNOWN Alanlar
- Doğrulanmamış hiçbir KPanel endpoint’i, alanı veya davranışı kabul edilemez. Bilinmeyen veya doğrulanmamış her şey **UNKNOWN** olarak işaretlenmelidir.
