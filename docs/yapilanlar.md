# Yapılanlar

Biten işlerin kaydı. Yeni biten maddeler [yapilacaklar.md](yapilacaklar.md) dosyasından buraya taşınır.
Teknik ayrıntılar ve diyagram dışı eklemeler için `../NOTES.md`; kararlar için [adr.md](adr.md).

Tarih: 2026-11-15 (bu oturum). Doğrulama: typecheck + birim testler + build. Görsel testi siz yapıyorsunuz (bkz. ADR-003); aşağıdaki "görsel kontrol" işaretleri, görselde bir kez bakılmış olanları gösterir.

## Tur 1: Rehberden ilk sürüm

- [x] Phaser 4 + TypeScript + Vite + Vitest iskeleti, klasör düzeni, `config.ts`
- [x] Placeholder asset sistemi (manifest, `Assets.key`, `Placeholders`, F2 listesi)
- [x] Singleton + Observer: `GameState`, `Subject`, `Observer`, `DayCycle`, kayıt sistemi
- [x] Decorator: `Duck`, `OutfitDecorator`, Şapka / Kazak / Repçi kıyafetleri
- [x] Command (ev): `CommandHistory`, `PlaceItemCommand`, `RemoveItemCommand`, `EquipOutfitCommand`, geri al / yinele
- [x] Command + Strategy (savaş): `Battle`, `UseMoveCommand`, `UseItemCommand`, `FleeCommand`, `Peck`, `Quack`, `RandomAI`, `BossAI`
- [x] Factory Method: `DayBeingFactory`, `NightBeingFactory`, 4 mob, `BattleEncounterFactory`, `GiftEncounterFactory`
- [x] Sahneler: Farm, House, Pond, Battle, UI; fade geçişleri; gündüz/gece; kayıt-yükleme; toast
- [x] README (artist akışı, içerik ekleme) ve NOTES.md

## Tur 2: İlk geri bildirimler

- [x] Global durdurma (P tuşu)
- [x] Ayarlar menüsü: kaydet, durdur, ses, çık
- [x] Piksel tarzı görseller (`npm run assets` ile üretilen 31 PNG)

## Tur 3: Büyük istek listesi

- [x] Ev bir karton kutu (giriş, iç mekân, zemin)
- [x] Ördek yürüdüğü yöne dönüyor; kıyafetler ördekle birlikte dönüyor ve aynı hızda hareket ediyor
- [x] WASD ile yürüme
- [x] Envanter ekranı: büyük ördek, yukarı/aşağı ile seçim, `E` ile giy/çıkar, kıyafet başına ve toplam atak bonusu
- [x] Eve eşya yerleştirme: Decorate butonu, yön tuşlarıyla konumlama, birden çok eşya, başka eşyaya basınca önceki sabitlenir
- [x] Settings: çark/ördek simgesi, ortalanmış butonlar, ördek desenli arka plan, kaydırıcı ile ses 0-100, daha düzgün font
- [x] Gece ekran gölgesi kaldırıldı; arka plan gökleri gece renklerine geçiyor (`*_night` arka planlar, `SkyTint`)
- [x] Befriend ve Fight öncesi konuşma; bazı moblar dost, bazıları düşman konuşuyor; ördek atar-gider yapıyor
- [x] Bazı moblar bize doğru yavaşça yürüyor
- [x] Pattern iskeleti denetimi + `skeleton.test.ts`

## Tur 4: İkinci istek listesi

- [x] Takip etme / etmeme mob başına rastgele ve preset (`config.beings[id].followChance`)
- [x] Gölden ayrılınca mob hatırlanıyor, dönünce aynı yerde
- [x] Göl tek ekran ve yüzülebilir; suda ayaklar kayboluyor, iz ve baloncuk bırakıyor; moblar suda veya kıyıda çıkıyor
- [x] Envanterde kıyafete çift tıklayınca giy/çıkar
- [x] WCAG 2.1 AA: renk kontrastı testi (`config.colors`), klavye erişimi, sadece renge bağlı olmayan ipuçları
- [x] Settings başlığında yazı yok, çark görseli; üst çubuktaki buton ördek kafası
- [x] Çiftlikte gündüz ve gece ikişer hayvan (tavuk, inek / baykuş, kedi); olumlu cevaplara mobilya hediyesi; başta hiç mobilya yok
- [x] Mobilya adetli değil: bir kez unlock, sonra istenildiği kadar yerleştirme; zaten açıksa hayvan bir şey vermiyor
- [x] Settings arka planı daha şeffaf; sağ üstte çarpı butonu
- [x] Çiftlik hayvanları dolaşıyor; çiftlik ve göl konumları hatırlıyor, gündüz-gece değişimi olduysa hatırlamıyor

## Tur 5: Docs notlarındaki istekler

- [x] **Hız kıyafetleri, hareket ve saldırı hızı ayrı:** `Combatant`'a `getMoveSpeed()` ve `getAttackSpeed()` eklendi. Cone Hat hareket hızını (+30), Boxing Gloves saldırı hızını (+4) artırır. Hareket hızı ördeğin yürüme hızıdır; saldırı hızı, aynı öncelikli komutlar (iki hamle) arasında kimin önce oynadığını belirler. Mobların da kendi saldırı hızı var. Envanter ekranı iki hızı ve kıyafet başına bonusu gösterir (ADR-013)
- [x] **Takip eden mob yakalayınca anında karşılaşma:** panel beklenmeden başlar; Fight mı Befriend mi rastgele (`config.catchFightChance`, Undertale tarzı) (ADR-014)
- [x] **Befriend'de öfkelenme şansı:** mob başına `angerChance`; mob sinirlenir, öfke cümlesi söyler ve karşılaşma savaşa döner
- [x] **Combat animasyonları:** saldırgan öne atılır, hedef sarsılır ve kırmızı yanar; iyileşme yeşil ve zıplama; yenilen taraf solar
- [x] **Bilgi kutuları kaybolur:** haritaların alt yazıları `config.hintSeconds` (7 sn) sonra solarak kaybolur
- [x] **Settings:** yeni çark ikonu (16x16), yazılar büyük, butonlar siyah
- [x] **Menüler ok tuşlarıyla:** Settings (Up/Down, Enter, Left/Right ses), mob paneli (Left/Right, Enter, Backspace ile çıkış), savaş menüsü; odaktaki butonda sarı çerçeve (ADR-015)
- [x] **Çizmeli Kedi sprite'ı** ve **hayvan adları:** Ginger (tavuk), Clarabelle (inek), Hedwig (baykuş), Puss in Boots (kedi) (ADR-016)

## Tur 6: Ev, ışıklar, ölüm ve dükkân

- [x] **Eşyalar R ile döner:** dekorasyonda elindeki eşya R tuşuyla saat yönünde çeyrek tur döner; yerleştirilince dönüşü korunur, tekrar alınınca da. Dönüş `GameState.placed` değerinde "eşya@tur" biçiminde saklanır (ADR-020)
- [x] **Işıklar lambalardan çıkıyor:** gece, her lamba döndüğü yöne koni biçiminde bir ışık huzmesi ve yerde yassı bir ışık lekesi bırakır; yuvarlak ışıklar kalktı (ADR-018)
- [x] **Disko topu:** yeni ev eşyası; geceleri etrafında dönen renkli huzmeler. Dükkândan alınır
- [x] **Ölünce para kaybı ve evde doğma:** yenilgide coin'lerin dörtte biri kaybolur (`config.loseCoinsFraction`), ördek evde uyanır (ADR-017)
- [x] **Evde gece/gündüz yalnızca pencereden belli olur:** oda arka planı artık değişmiyor; pencerenin camında gece görünümü bir saniyede solarak geçiyor (ADR-019)
- [x] **Dükkân:** çiftlikteki sağ arkadaki ahır dükkân oldu. Kıyafet, ev eşyası ve yiyecek (HP) alınır. Fiyatlar `config.shop` içinde (ADR-021)
- [x] **Başlangıç durumu değişti:** artık başlangıçta kıyafet yok, 40 coin var (kıyafetler dükkândan alınır)
- [x] `docs/postpone-works.md` açıldı: ertelenen fikirler (genişletilecek envanter dahil)

## Tur 7: Koli ev, can barı, stamina

- [x] **Koli ev:** ev girişi, ters çevrilmiş bir koli oldu (kapı ve pencere kesilmiş, üstünde bant, "bu yüz yukarı" okları aşağı bakıyor). İç mekân zaten koliydi
- [x] **Göl tabelası:** çiftlikteki "Pond" yönlendirmesi artık minik bir göl: kamışlar, nilüfer yaprağı, iskele ve dalga çizgileri
- [x] **Dükkândaki "too expensive" yazıları silindi:** satırda yalnızca fiyat (coin simgesiyle) veya "Owned" yazar. Alınamayan bir şeye basınca kısa bir bildirim çıkar ("Not enough coins")
- [x] **Üst çubukta can barı:** kalp simgesi, bar ve "13 / 20" yazısı; savaş sonrası canı artık hep görürsünüz (ADR-022)
- [x] **İnek yeniden çizildi:** boynuz, kulak, benekler, pembe burun, karın ve toynaklar
- [x] **Dükkân yeniden tasarlandı:** çiftlikteki giriş artık çizgili tentesi ve tezgâhı olan bir pazar tezgâhı; dükkân ekranı çizgili tente, tahta tabela ve ahşap panel
- [x] **Stamina:** hamleler stamina harcar (Peck 4, Quack 1); en güçlü hamle her tur kullanılamaz. Her tur 2 stamina geri gelir, her savaş tam stamina ile başlar. Savaş ekranında stamina barı, hamle düğmelerinde maliyet, yetmeyen hamle pasif (ADR-022)
- [x] **Stamina yiyecekleri:** Corn (+4) ve Seed Cake (+8); dükkânın "Food" sekmesinde, savaşta Items'tan yenir

## Tur 8: Harita geçişleri

- [x] **Çiftlik ile göl arasındaki kapılar kalktı:** ördek çiftliğin en sağ kenarına varınca göle, gölün en sol kenarına varınca çiftliğe geçer (Stardew Valley gibi). Aynı yükseklikte, karşı kenarın hemen içinde belirir; kenarda soluk bir ok ipucu görünür (ADR-023)
- [x] **Kenarlarda yalnızca ok değil, gidilen yerin resmi var:** çiftliğin sağ kenarında göl (kıyı, nilüferler, balıklar, yol devam eden ahşap iskele, koni şapkalı yüzen ördek); gölün sol kenarında çiftlik (çit, açık kapı, toprak yol, saman balyası, çiçekler). Çizimler `docs/assets example` içindeki iskele ve koni şapkalı ördek görsellerinden esinlendi (`entrance/edge_pond`, `entrance/edge_farm`)
- [x] Ev ve dükkân kapıdan girilmeye devam ediyor
- [x] Göl tabelası ve gölden çıkış kapısı çizimleri silindi (`to_pond`, `to_farm`)

## Tur 9: Göl haritası ve kurbağa

- [x] **Göl haritası baştan çizildi, attığınız göl görseli gibi:** üstte çimen ve çiçekler, sol üstte tuğla meydan ve ondan göle inen tuğla yol, ortada aşağı uzanan ahşap iskele (kenar korkulukları ve krem başlıklı direkler), taklit kıyı çizgisi (koyu toprak kenar, krem dudak, açık köpük), turkuaz su, nilüfer yaprakları, koyu balık gölgeleri. Gece sürümü de var (`background/pond`, `pond_night`). Çizim `tools/generate-assets.mjs` içinde (ADR-024)
- [x] **Göl artık tek bir maske ile tanımlı:** su neresiyse oyun da orada su sayıyor; ördek ve moblar yalnızca suda ayaklarını gizleyip iz bırakıyor. Maske hem resmi hem oyunu besliyor (`src/content/pondMask.json`, `pondMap.ts`)
- [x] **Gölde yüzen kurbağa:** kovboy şapkalı yeşil kurbağa (`animal/frog`, `docs/assets example` içindeki kurbağa görselinden); açık suda gezinir, dinlenir, iz bırakır, ördek yanından geçince "Ribbit!" der
- [x] **Gölün solundaki çiftlik kapısı yeni sol kıyıya taşındı:** çit, açık kapı, yol, saman; ördek çiftlikten geçince kıyıda (karada) doğuyor

## Tur 10: Göle iskeleden iniş

- [x] **İskelenin üstündeki taş yol silindi;** iskele artık ekranın en üstünden giriyor. Tuğla meydan yalnızca iskeleden uzakta, sol üstte kaldı
- [x] **Çiftlikten göle sağ kenardan değil, aşağıdan iniliyor:** çiftliğin altı artık göl; ortasındaki iskele, göl haritasındaki iskeleyle aynı hizada (x 360-480). Toprak yol doğrudan iskeleye bağlanıyor. İskeleden aşağı yürüyünce göle, gölde iskeleden yukarı yürüyünce çiftliğe geçilir (ADR-025)
- [x] Çiftlikte gölün suyuna girilemez (iskelenin iki yanı görünmez duvar); ördek iskeleye, göl haritasında da iskelenin üstüne iniyor
- [x] Gölün solundaki çiftlik kapısı resmi silindi (`edge_farm`); kenar okları (üçgen) dört yöne de çalışıyor

## Tur 11: Ev, ahır, su ve taş yol temizliği

- [x] **Çiftlik arka planından ahır silindi** (dükkânın üstündeki ev); dükkân tek başına pazar tezgâhı
- [x] **Koli ev yeniden çizildi:** artık siyah çizgili "teknolojik" değil; kahverengi çizgili, oluklu, bantlı, kenarında kargo etiketi olan, kapısı ve penceresi elle kesilmiş sade bir koli
- [x] **Çiftlikteki su azaldı:** alt kenarın tamamı göl değil; yalnızca iskelenin çevresinde küçük bir koy var, iki yanında ahşap çit. Toprak yol iskeleye bağlanıyor
- [x] **Göl ekranındaki taş yol ve tuğla meydan tamamen silindi;** yalnızca iskele var
- [x] **İskelenin genişliği yarıya indi:** 120 px yerine 60 px (x 384-444), hem göl haritasında hem çiftlikteki resimde aynı hizada

## Tur 12: Gölde bitkiler

- [x] **Gölde çok az yonca ve yosun, sazlık tarzında:** kıyıya yakın sığlıklarda 4 küçük saz demeti (kahverengi başaklı), suda 3 yosun öbeği ve 3 yonca yaprağı yüzüyor. Yalnızca süs; iskelenin yakınına konmuyor (gündüz ve gece resmi)

## Tur 13: Sazlık ve sazlığın koruyucusu

- [x] **Sazlık arttı:** göldeki dağınık saz demetleri 4'ten 9'a çıktı; sağ alt suda yoğun bir **saz yatağı** var (yaklaşık 70 saz, kahverengi başaklı, dibinde ince dalgalar)
- [x] **Sazlığı koruyan mob: Reed Warden** (balıkçıl). Saz yatağının ortasında suda bekler; ördek yaklaşınca yalnızca **Fight** veya **Leave** sunar (Befriend yok). Zorlu bir savaş: 80 can, 4 atak, boss yapay zekâsı. Yenince 45 coin ve kesin bir Seed Cake kazandırır (ADR-027)
- [x] **Çıplak ördek tek seferde yenemez:** 3 kıyafet olmadan, elindeki yiyeceklerle de kaybediyor; 3 saldırı kıyafeti ve biraz yiyecekle uzun bir savaşın sonunda yeniyor. Testle doğrulandı (`tests/battle/guardian.test.ts`, sanal oyuncu)
- [x] Yenilince Reed Warden iki gündüz-gece değişimi (bir tam gün) uzakta kalır, sonra tazelenmiş olarak döner; savaştan kaçarsanız yerinde kalır

## Tur 14: Çimen ve süs bitkileri

- [x] **Yeni çimen:** çiftlikte ve gölün karasında parlak yeşil çimen, koyu "V" filizler, beyaz papatyalar (sarı göbekli) ve küçük açık/koyu noktalar. `docs/assets example` içindeki çimen görselinden esinlendi (`ground/grass`, gölde kara kısmı da aynı havada)
- [x] **Çimen arasına süs bitkileri:** küçük ağaç, çalı, uzun ot, beyaz çiçek ve mavi çiçek (`decor/*`, bitki sayfası görselinden esinlendi). Çiftlikte 16, gölde 10 tane; yollardan, kapılardan, hayvanlardan, iskeleden ve ördeğin doğduğu yerden uzakta; her seferinde aynı yerde (sabit tohum). Ağaçlar az (en fazla 3)

## Tur 15: Sazlık boss'una her zaman saldırılabilir

- [x] **Hata düzeltildi:** göldeki rastgele bir mob varken Reed Warden'ın Fight paneli her karede kapanıyordu (mobun paneli "ben değilim, kapat" diyordu), bu yüzden boss'la dövüş başlatılamıyordu. Artık her panel yalnızca kendi sahibi için kapanıyor
- [x] **Kural netleşti:** Reed Warden ile dövüşmek için hiçbir şart yok (para, kıyafet, seviye aranmaz). Güç yetmezse dövüşü kaybedersiniz: evde uyanır, coin'lerin dörtte biri gider. Zorluk yalnızca dövüşün içinde (80 can); çıplak ördek yenilir, kıyafetli ve yiyecekli ördek kazanır

## Tur 16: Büyük ev ve dükkân, yeni yol, uzun ot kalktı

- [x] **Ev (koli) ve dükkân büyüdü:** 64 pikselden 96 piksele; yerleri de yolun başına ve dükkânın yerine oturacak şekilde ayarlandı
- [x] **Evden göle giden yol yenilendi:** köşeli üç parça toprak yerine, evin kapısından iskeleye kıvrılarak inen tek bir toprak yol (koyu kenarlı, aşınmış kenar şeridi, birkaç çakıl). Yolun üstüne süs bitkisi konmuyor (`ground/farm_path`, `content/farmPath.ts`)
- [x] **Ekran görüntüsündeki uzun ot (tall_grass) tamamen kaldırıldı;** süsler artık yalnızca küçük ağaç, çalı ve iki renk çiçek

## Tur 17: Orman haritası, Frog King ve yeni görseller

- [x] **Yeni harita: Forest (orman),** çiftliğin sağında; altı göl, sağı orman. Ağaç duvarı arasındaki bir açıklıktan girilir (çiftliğin sağ kenarı); ormandan sol kenardaki açıklıkla çiftliğe dönülür. Ormanda toprak patika, açıklık (clearing), düşmüş kütük, mantarlar, çiçekler ve yolcu arabası var. Gündüz ve gece resmi (`background/forest`, `forest_night`, `entrance/edge_forest`, `ForestScene`) (ADR-028)
- [x] **Ormanın boss'u: Frog King** (taçlı kurbağa, attığınız görselden). Reed Warden'dan çok daha kolay: 35 can, 3 atak. Çıplak ördek, biraz yiyecekle (örn. 1 ekmek) yenebiliyor; bir kıyafetle kolay. Yenince 25 coin ve kesin bir Corn (stamina yiyeceği); bir gün sonra geri döner. Yine hiçbir şart aranmadan savaşılabilir, güç yetmezse kaybedilir
- [x] **Orman canlıları:** gezinen sincaplar (hızlı, zıplayarak) ve yemlenen domuzlar (yavaş) (`animal/squirrel`, `animal/pig`; sincap ve domuz görsellerinden)
- [x] **Kumbara dükkânda:** dükkân ekranında coin sayısının yanında kumbara (`ui/piggy`; kumbara görselinden)
- [x] **Yolcu arabası:** ormandaki araba (`decor/forest_wagon`; bataklıktaki araba dükkânı görselinden). Şimdilik yalnızca süs; ileride gezgin dükkân olabilir (postpone-works)
- [x] Savaştan sonra dönüş: savaş artık kendi haritasına döner (`returnTo`), ormanda savaşan ormana, gölde savaşan göle

## Tur 18: Dükkândan çıkış

- [x] **Hata düzeltildi:** dükkândan Backspace (veya Leave) ile çıkınca ördek, büyüyen dükkân kapısının içinde doğuyor ve anında tekrar dükkâna giriyordu; bu yüzden dükkân ekranında kalıyor gibi görünüyordu. Ördek artık kapının önünde (altında) doğuyor; ev çıkışı da aynı kuralı kullanıyor (`content/farmLayout.ts`, testli)

## Tur 19: Eve dön düğmesi

- [x] **Ayarlarda "Go home" düğmesi:** bir hata olursa (ördek sıkışırsa, harita bozulursa) ördeği eve götürür. Oyunu kaydeder, durdurma açıksa kaldırır, çalışan haritayı veya savaşı durdurur ve ördeği evde (kapının önünde) başlatır. Menüde Save ile Volume arasında, klavyeyle de seçilebilir

## Tur 20: Orman geçişi, orman yolu ve ağaçlar katı

- [x] **Orman geçişi düzeltildi:** çiftliğin sağındaki ağaç şeridi düz bir çizgiyle kesilmişti (ağaçlar şeridin dışına taşıp kırpılıyordu). Şerit 96'dan 160 piksele genişledi, ağaçlar tamamen şeridin içinde ve kademeli; sol kenarda çalılar ve çiçekler çimene karışıyor; patika açıklıktan ormana kesintisiz giriyor
- [x] **Evden ormana yol:** ev-iskele yolundan (310, 372) ayrılıp çiftliği geçerek ormanın açıklığına (sağ kenar) giden ikinci bir kıvrımlı toprak yol; göle yaptığımız yolla aynı çizim (`content/farmPath.ts`, `FARM_FOREST_POINTS`). Süsler bu yolun da dışında kalıyor
- [x] **Ağaçlar artık katı (body block):** çiftlik ve göldeki küçük ağaçların gövdesinden geçilemiyor; çiftlikteki orman ağaç duvarının engeli de şeritle aynı genişlikte (140 px), ormanın sol kenar ağaçlarının engeli genişledi

## Tur 21: Ormana giden yolun birleşimi

- [x] **Ormana bağlanan yol düzeltildi:** ağaç şeridinin içinde ayrı, düz ve daha geniş bir patika vardı; çiftlikteki kıvrımlı yolla farklı yükseklikte ve genişlikte birleşip bozuk görünüyordu. Şeritteki ayrı patika kaldırıldı, çiftlikteki yol açıklıktan düz bir şekilde (aynı yükseklikte, y=266) geçiyor ve orman tarafındaki patikayla aynı yükseklikte ve aynı genişlikte (22 px yarı genişlik) başlıyor. Testle doğrulandı

## Tur 22: Yeni ev ve yeni dükkân

- [x] **Ev yeniden tasarlandı (koli bırakıldı):** sevimli bir kulübe; kırmızı kiremitli çatı ve baca, yuvarlak çatı penceresi, çapraz kirişli krem sıva duvarlar, çiçek kutulu iki pencere, taş basamaklı ahşap kapı. 100 x 100 piksel. İçi de koli yerine ahşap duvar ve ahşap döşeme oldu; iç taraftaki çıkış kapısı ahşap kapı (`entrance/to_house`, `box_exit`, `ground/floor`, `background/house`)
- [x] **Dükkân, attığınız dükkân görselindeki gibi:** iki katlı turkuaz kiremit çatılı, ahşap direkli, beyaz afişli, kırmızı-beyaz tenteli, tezgâhlı (kırmızı kitap, turuncu kavanoz), kafes sandıklı ve fidanlı saksılı ahşap bir dükkân. 140 x 110 piksel (`entrance/to_shop`). Dükkân ekranı da aynı havada: turkuaz kiremit çatı, ahşap kiriş, asılı fener ve "THE SHOP" tabelası
- [x] Çıkış yerleri ve süs engelleri yeni boyutlara göre ayarlandı (`content/farmLayout.ts`, testli: ev ve dükkân birbirine ve ördeğin doğduğu yere binmiyor)

## Tur 23: Frog King yenilendi

- [x] **Ormandaki Frog King baştan çizildi:** daha büyük (72 px) ve daha dolgun: yuvarlak yeşil gövde, açık yeşil sırt ve benekler, solgun karın, altın çerçeveli iri gözler, geniş ağız, ön ve arka bacak ve üç sivri uçlu, yakut taşlı altın taç. Attığınız taçlı kurbağa görselinden esinlendi (`being/frog_king`)

## Tur 24: Göldeki boss kuğu oldu

- [x] **Göldeki sazlık bossu (Reed Warden) balıkçıl yerine kuğu:** attığınız kuğu görselinden esinlenerek çizildi: beyaz, S biçiminde uzun boyun, koyu yüz maskesi ve turuncu gaga, mavi gölgeli kanat tüyleri, sivri kuyruk, altında su dalgaları. 72 px, sola bakıyor (`being/reed_guardian`). Adı, kimliği, statları ve davranışı aynı. **İkinci deneme (Tur 25):** ilk kuğu kısa boyunlu, kaza benziyordu; baştan çizildi: uzun S boyun, küçük baş, koyu maske, öne ve hafif aşağı bakan turuncu gaga, tüylü kanat, sivri kuyruk, siyah-kahve kenar çizgisi, 96 px

## Tur 26: Kuğu, yeni görsele göre

- [x] **Göldeki kuğu bossu yeni görsele göre baştan çizildi** (`docs/assets example` içindeki krem kuğu, 13.58.20): yumuşak kahverengi kenar çizgisi, krem-beyaz dolgun gövde ve sivri kuyruk, küçük altın taç, yuvarlak baş ve artı biçimli göz, sarı gaga, kısa kalın boyun ve boynun dibinde büyük bej fiyonk. 96 x 84 piksel, sola bakıyor (`being/reed_guardian`). Önceki iki deneme (mavi gölgeli S boyunlu kuğu) bırakıldı

## Tur 27: Desen sınıfları kitaba göre gözden geçirildi

- [x] **Altı desen Design Patterns kitabındaki rollerle karşılaştırıldı ve sapmalar düzeltildi** (ayrıntı ve diyagram farkları: ADR-030):
  - Factory Method: fabrika yöntemi `createBeing()`, `spawn()` taban sınıfta tek işlem; `spawnGuardian` tek somut yöntem; `EncounterFactory.begin()`
  - Strategy: `Being.chooseCommand(player)`, `Battle` bağlama soruyor
  - Observer: ev ve göl sahnelerinde ayrı gözlemci nesnesi (`stateObserver`), `update` ad çakışması bitti
  - Singleton: `coins` özel, `getCoins()`
  - Command: komutlar alıcılarını saklıyor
  - `ReedGuardian` yorumundaki "heron" düzeltildi (kuğu)
- [x] 3 yeni test (toplam 183); oyun davranışı değişmedi

## Çalışma düzeni

- [x] Görsel test yapılmıyor, siz yapıyorsunuz (ADR-003)
- [x] `docs/` takip merkezi oldu: yapılacaklar, yapılanlar, ADR (ADR-002)
