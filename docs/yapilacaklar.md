# Yapılacaklar

Kaynak: [bizim-oyun.txt](bizim-oyun.txt) (ham notlarınız) ve `assets example/` klasöründeki örnek görseller.
Yeni isteklerinizi `bizim-oyun.txt` dosyasına yazmaya devam edin; ben buraya düzenli maddeler olarak aktarırım.
Biten maddeler [yapilanlar.md](yapilanlar.md) dosyasına taşınır. Kararlar [adr.md](adr.md) dosyasında.

Durum: `[ ]` yapılmadı · `[?]` önce sorum var.

## Açık maddeler

Şu an bekleyen madde yok. Önceki listenin hepsi yapıldı (bkz. yapilanlar.md, Tur 5).

## İleriye dönük planlar (henüz iş değil, karar notu)

- **Geniş envanter:** İleri aşamada büyük bir envanter planlanıyor. Bu yüzden hareket hızı ve saldırı hızı iki ayrı istatistik olarak tutuldu (ADR-013). Yeni kıyafet/eşya eklerken `config.outfitSpeed` ve `outfitSummary` kullanılabilir.

## Görsel referanslar (`assets example/`)

| Dosya | Ne gösteriyor | Nerede kullanıldı / kullanılabilir |
| --- | --- | --- |
| `...12.28.14.jpeg` | Çizmeli Kedi | `animal/cat` buna benzer çizildi |
| `...12.28.30.jpeg` | Trafik konisi şapkalı ördek | `outfit/cone_hat` ve kıyıda yüzen küçük koni şapkalı ördek (`edge_pond`) için ilham |
| `...12.29.04.jpeg` | Ahşap iskele, nilüferli göl kenarı | `background/pond` (göl haritası) ve `entrance/edge_pond` için ilham |
| `...13.55.18.jpeg` | Çimen dokusu: parlak yeşil, koyu V filizler, beyaz papatyalar | `ground/grass` ve gölün karası |
| `...13.55.56.jpeg` | Bitki sayfası: çiçekler, uzun otlar, çalılar, küçük ağaç | `decor/*` (çimen arasındaki süsler) |
| `...14.00.44.jpeg` | Taçlı kurbağa (kral) | `being/frog_king` (ormanın boss'u) |
| `...14.02.58.jpeg` | Sincap | `animal/squirrel` (orman canlısı) |
| `...14.03.45.jpeg` | Bataklıkta arabalı gezgin dükkân, dev kurbağa | `decor/forest_wagon` (ormanda araba); gezgin dükkân fikri postpone-works'te |
| `...14.06.30.jpeg` | Kumbara ve madeni paralar | `ui/piggy` (dükkân ekranı) |
| `...14.06.59.jpeg` | Pembe domuz sayfası | `animal/pig` (orman canlısı) |
| `...13.58.20.jpeg` | Krem kuğu: taç, fiyonk, artı gözlü (güncel kuğu referansı) | `being/reed_guardian` (gölün boss'u) |
| `...13.58.21.jpeg` | Mavi gölgeli beyaz kuğu (S boyunlu); beğenilmedi | eski deneme |
| `...13.31.42.jpeg` | Kovboy şapkalı kurbağa | `animal/frog` (gölde yüzen kurbağa) |
| `...12.30.31.jpeg` | Açık karton kutu | İlk ev denemesi (koli); sonra evin yerini kulübe aldı |
| `...14.03.45 (1).jpeg` | Turkuaz çatılı ahşap pazar dükkânı, fener direği, bank | `entrance/to_shop` ve dükkân ekranı |

Not: Bu görseller telifli olabilir. Doğrudan kopyalanmadı, yalnızca ilham olarak kullanıldı; son halini takım arkadaşınızın PNG'si ile değiştirebilirsiniz.

## Görsel testte bakılacaklar (sizin için kontrol listesi)

- [ ] **Tur 27 (desen düzeltmeleri, davranış değişmemeli):** evde eşya koy / kaldır / Z / Y hâlâ çalışıyor ve gece olunca pencere değişiyor; gölde gündüz-gece değişince mob değişiyor; gölde Fight ve Befriend, ormanda Frog King ve gölde kuğu ile dövüş başlıyor; düşman sırası gelince hamle yapıyor; dükkânda ve üst barda para doğru görünüyor

Görsel test yapmıyorum (ADR-003). Son turdan şunlara bakmanızı rica ederim:

0. **Kuğu boss (yeni görsele göre):** krem kuğu, taç, fiyonk ve boyun oranları; saz yatağında ve savaş ekranında nasıl duruyor, beğenilmezse `tools/generate-assets.mjs` içinde `swan()` işlevinden değiştirilir. (Önceki satırdaki S boyun notu artık geçerli değil.)
0. **Kuğu boss (eski not):** yeni kuğu (boyun, gaga, kanat) saz yatağında ve savaş ekranında nasıl duruyor; beğenilmezse `tools/generate-assets.mjs` içinde `swan()` işlevinden değiştirilir. İsmi hâlâ "Reed Warden"; "Reed Swan" gibi bir isim isterseniz söyleyin.
0. **Frog King çizimi:** yeni kurbağa (taç, gözler, karın) ormandaki kütükte ve savaş ekranında nasıl duruyor; beğenilmezse `tools/generate-assets.mjs` içinde `frogKing()` işlevinden değiştirilir. Kurbağa 72 px olduğu için etiketi veya paneli kütükle çakışırsa söyleyin.
0. **Yeni ev ve dükkân:** kulübenin dış ve iç görünümü (ahşap duvar, ahşap zemin, çıkış kapısı), dükkân resmi ve dükkân ekranı (turkuaz çatı, fener); büyüklükleri (ev 100x100, dükkân 140x110) ve yerleri; ördek evden ve dükkândan çıkınca kapının önünde mi doğuyor; süs bitkileri binalara binmiyor mu. Sonuç beğenilmezse çizimleri `tools/generate-assets.mjs` içinde `cottage()` ve `woodShop()` işlevlerinden değiştirilir (veya takım arkadaşınız aynı adlı PNG koyar).
0. **Orman yolu birleşimi:** çiftlikteki yolun açıklıktan geçip ormanın patikasına kesintisiz (basamak veya genişlik farkı olmadan) bağlanması; ormanın sol kenarında patikanın açıklıktan başlaması.
0. **Orman geçişi ve yol:** çiftliğin sağındaki ağaç şeridi artık kesik görünmüyor mu (düz kenar, yarım ağaç var mı), patika açıklığa doğru yolla birleşiyor mu, evden ormana giden yolun şekli ve iskele yoluyla ayrıldığı yer, ağaçların gövdesine yürüyünce engel var mı (ördek ağacın içinden geçmemeli; engel çok geniş veya dar gelirse `addDecor` içindeki 26x20 kutu ayarlanır).
0. **Go home:** ayarlardaki düğme çiftlikte, gölde, ormanda, dükkânda ve savaşın ortasında ördeği eve götürüyor mu (saat savaştan sonra tekrar işliyor mu, ekranda takılı kalan bir panel veya konuşma kalıyor mu).
0. **Dükkân çıkışı:** dükkândan Backspace ve Leave düğmesiyle çıkınca ördek çiftlikte dükkânın önünde duruyor mu (tekrar içeri girmiyor), evden çıkışta da evin önünde mi.
0. **Orman:** çiftliğin sağ kenarındaki ağaç duvarı ve açıklık (ördek sadece açıklıktan geçiyor mu, yolda birkaç piksel kayıyor mu), ormanın resmi (ağaç duvarları, patika, kütük, yolcu arabası, kral kütüğü), sincapların ve domuzların gezinmesi, Frog King (çizim, panel, savaş: çıplak ördekle yiyecekle yenilebiliyor mu, zor mu kolay mı), yenince 25 coin ve Corn, ormandan çıkış (çiftliğin sağında açıklıkta doğma), kumbara dükkânda.
0. **Bu turdan:** büyüyen ev ve dükkân (96 px; kapı çarpışması ve yazı yerleri), kıvrılan toprak yol (iskeleye düzgün bağlanıyor mu, evin kapısından başlıyor mu, yolun sertliği), uzun otun kalkmış olması. Yolun şekli `tools/generate-assets.mjs` içinde `FARM_PATH.points` noktalarıyla değiştirilir.
0. **Boss dövüşü:** göldeyken başka bir mob da varken (8 sn'de bir çıkar) saz yatağındaki Reed Warden'a yaklaşınca Fight / Leave paneli kalıcı açılıyor mu; çıplak ördekle dövüşü başlatıp kaybedebiliyor musunuz (evde uyanma, coin kaybı).
0. **Çimen ve süsler:** yeni çimen dokusu (çiftlik ve gölün karası), çimen arasındaki ağaç, çalı, ot ve çiçekler (fazla veya az mı, bir yolu veya yürünen yeri kapatıyor mu; sayıları `FarmScene` ve `PondScene` içindeki `count` değerlerinden ayarlanır). Bitkiler ördekle çarpışmaz, ördek üzerlerinden geçer.
0. **Sazlık ve koruyucu:** sağ alttaki saz yatağı (yoğun mu, yeterli mi), Reed Warden çizimi (balıkçıl), saz yatağında durması ve etiketi, yaklaşınca Fight / Leave paneli, savaş zorluğu (çıplak ördekle kaybetmek, kıyafet ve yiyecekle kazanmak; çok zor veya kolaysa `config.ts` içindeki `reed_guardian` satırı), yenince 45 coin ve Seed Cake, bir gün sonra geri dönmesi.
0. **Gölde bitkiler:** saz demetleri, yosun ve yonca (çok az mı, sazlık hissi veriyor mu; fazla veya az ise sayıları `makePondMap` içinde `reeds`, `algae`, `clover` sınırlarından ayarlanır).
0. **Önceki turdan:** ahırın silinmiş olması, yeni koli ev, çiftlikteki küçük göl koyu ve çitler (su artık fazla mı?), iskelenin ince hali (ördek rahat geçiyor mu; geçmekte zorlanırsa iskele ve geçit genişliğini söyleyin), tuğlanın tamamen gitmiş olması.
0. **Göle iniş:** çiftliğin altındaki göl ve iskele resmi, iskelenin göl haritasındaki iskeleyle aynı hizada olması (aynı x, ördek iskele üzerinde doğuyor mu), toprak yolun iskeleye bağlanması, suya girilemiyor mu (iskelenin iki yanı), göl haritasında iskelenin üstten girmesi ve üstteki taş yolun gitmiş olması, üst/alt ok üçgenleri.
0. **Göl haritası:** yeni göl resmi (gündüz ve gece), tuğla meydan, iskele, kıyı çizgisi; suya girince ayakların kaybolması resimdeki suyla örtüşüyor mu (kıyıda erken veya geç olursa söyleyin); kurbağanın yüzmesi, bankaya çıkmaması, "Ribbit!"; çiftlikten gelince karada doğma; moblar suda ve karada çıkıyor mu.
0. **Kenar resimleri:** çiftliğin sağındaki göl/iskele ve gölün solundaki çiftlik/çit görüntüleri; yazılar ve ok ipuçları ile birlikte okunaklı mı, ördek kenara yürürken üstünden geçiyor mu.
0. **Harita geçişi:** çiftliğin sağ kenarından göle, gölün sol kenarından çiftliğe geçiş (yükseklik korunuyor mu, geçişte ördek kenara tekrar çarpıp geri dönmüyor mu), kenardaki ok ipuçları, göle geçince ördeğin suda doğması.
0. **Önceki turdan:** üst çubuktaki can barı (renk ve yazı), savaş ekranındaki stamina barı, hamle düğmelerindeki maliyetler ve pasif düğmeler, koli ev girişi, göl tabelası, yeni inek, çizgili tenteli dükkân girişi ve dükkân ekranı, Corn ve Seed Cake simgeleri.
1. **Dükkân:** çiftlikte sağ arkadaki ahır kapısı; sekmeler (Outfits / Furniture / Food), Left/Right, Up/Down, Enter ile alma, "Owned" yazısı, Backspace ile çıkış.
2. **Evde R:** eşya taşırken R ile dönüyor mu; yerleştirince dönüş korunuyor mu; tekrar alınca.
3. **Işıklar:** geceleri lamba konisi ve yerdeki leke, lambayı döndürünce yön değişimi; disko topunun renkli huzmeleri.
4. **Pencere:** evdeyken gece/gündüz değişince yalnızca pencere camı değişiyor, oda arka planı değişmiyor (T tuşu ile deneyebilirsiniz).
5. **Ölüm:** savaşı kaybedince coin kaybı ve evde uyanma.
6. **Yeni oyun:** Shift+N ile; başlangıçta 40 coin, kıyafet yok.
7. Disko topu ve ahır kapısı çizimleri.
