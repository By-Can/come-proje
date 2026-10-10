# Ajanlar İçin Kurallar (Agents Rules)

Bu proje üzerinde çalışan tüm yapay zeka ajanları aşağıdaki kurallara **kesinlikle** uymak zorundadır:

## 1. Evidence-First (Kanıt Odaklılık)
- Yapılan her değişiklik, öneri veya analiz, doğrulanmış verilere ve KPanel üzerinde bilinen mevcut route/endpoint'lere dayanmalıdır. Bu kural özellikle KPanel'e ilişkin factual/operational (olgusal/operasyonel) iddialara sıkı sıkıya uygulanmalıdır.
- İşlem yapmadan veya öneride bulunmadan önce her zaman doğrulanmış gerçeklere (örneğin `docs/kpanel-known-facts.md` veya `PROJECT.md`) başvurulmalıdır.

## 2. No-Hallucination (Halüsinasyon Yasağı)
- Doğrulanmamış hiçbir KPanel endpoint'i, alanı, arayüz öğesi veya sistem davranışı uydurulmayacaktır.
- Sistemin nasıl çalıştığına dair varsayımlarda bulunulmamalıdır; sadece bilinen gerçekler üzerinden ilerlenmelidir.

## 3. UNKNOWN Prensibi
- Hakkında kesin veya doğrulanmış bilgi olmayan her türlü özellik, arayüz, veri veya sistem davranışı **UNKNOWN** olarak işaretlenmelidir.
- Bilinmeyen bir konu ile karşılaşıldığında, varsayım yapmak yerine durum net olarak "Bilinmiyor/UNKNOWN" şeklinde raporlanmalıdır. KPanel'de bir şeyin uygulanabilirliği hiçbir zaman varsayılmamalı; doğrulanmadıysa UNKNOWN olarak işaretlenmelidir.

## 4. Production Safety (Canlı Sistem Güvenliği)
- Bu aşamada doğrudan KPanel arayüzünden canlı sisteme izinsiz yazma veya credential talep etme işlemi yapılmamalıdır (READ-ONLY izinlidir, değişiklik ancak açık onay ile yapılır).
- Tüm planlama ve öneriler canlı ortamı riske atmayacak şekilde, sadece doğrulanmış sağlanan bilgiler doğrultusunda (görev sınırları içinde kalmak kaydıyla) yapılmalıdır.
