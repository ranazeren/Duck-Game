# Mimari ve ürün kararları (ADR)

Karar verdiğimiz ana planlar burada. Her karar numaralıdır, silinmez; fikir değişirse yeni bir karar yazılır ve eskisi "Yerine geçti" olarak işaretlenir.
Biçim: Bağlam → Karar → Sonuç. Durum hepsinde "Kabul" (aksi yazılmadıkça).

## ADR-001: Sınıf diyagramı sözleşmedir

- **Bağlam:** Ders projesi; Singleton, Observer, Command, Strategy, Factory Method ve Decorator diyagramdaki yerlerinde, kitaptaki biçimiyle durmalı (`Duck Game UML-canonical2.html`).
- **Karar:** Kod diyagramın iskeletinin dışına çıkmaz. Diyagram dışına çıkmak gerekiyorsa önce size sorulur. İzin verilen küçük eklemeler (düz sınıf, düz fonksiyon, yardımcı üye) `NOTES.md` içinde işaretlenir.
- **Sonuç:** `tests/patterns/skeleton.test.ts` iskeleti korur. Şu an açık olan diyagram dışı konular: çiftlik hayvanları ve konuşmaları (düz içerik), "hız" kıyafeti (bkz. yapilacaklar, Açık soru 1).

## ADR-002: `docs/` klasörü takip merkezidir

- **Karar:** Notlar `docs/bizim-oyun.txt` (ham istekleriniz), `docs/yapilacaklar.md`, `docs/yapilanlar.md` ve bu dosya üzerinden yürür. Siz notu günceller ve yeni isteklerinizi eklersiniz; ben her geliştirmeden sonra yapılan maddeleri `yapilanlar.md` dosyasına taşırım, kararları buraya yazarım.
- **Sonuç:** Örnek görseller `docs/assets example/` altında; oyun içinde kullanılan asıl dosyalar `public/assets/` altında kalır.

## ADR-003: Görsel testi ekip yapar

- **Karar:** Ben tarayıcıda görsel veya canlı test yapmam, web görünümü açmam. Doğrulamam typecheck, birim testler ve build ile sınırlıdır; görselde bakılması gereken yerleri her teslimde listelerim.

## ADR-004: Teknoloji ve test sınırı

- **Karar:** Phaser 4 (WebGL), TypeScript strict, Vite, Vitest, Arcade fizik. Oyun kuralları Phaser'dan bağımsız klasörlerde (`core`, `patterns`, `battle`, `content`) yaşar ve tarayıcısız test edilir; sahneler yalnızca çizer, girdi okur ve abone olur.
- **Sonuç:** Rehberin kendisi `Duck Game Build Guide for Claude Code.md`.

## ADR-005: Görseller piksel art, kodla üretilir, PNG ile değiştirilir

- **Bağlam:** Görselleri başta takım arkadaşı yapacaktı; sonra benim çizmem istendi.
- **Karar:** `npm run assets` (`tools/generate-assets.mjs`) tüm görselleri üretir; çıktılar `public/assets/<kategori>/<id>.png` altındadır. Eksik dosya hata vermez, etiketli placeholder gösterilir. Takım arkadaşı aynı adlı bir PNG koyarak herhangi birini değiştirebilir.
- **Sonuç:** Betiği yeniden çalıştırmak üretilen dosyaların üzerine yazar; elle çizilmiş dosyalar için betikten çıkarılmaları gerekir. İlham görselleri `docs/assets example/` içinde.

## ADR-006: Mobilya bir kez açılır, sonra sınırsızdır

- **Bağlam:** Eşyalar sayıyla tutulunca yerleştirme kısıtlıydı.
- **Karar:** Mobilya çiftlik hayvanlarıyla konuşarak açılır (olumlu cevap → hediye). Başta hiç mobilya yoktur. Açılan mobilya istenildiği kadar yerleştirilebilir. Zaten açık mobilyayı hayvan tekrar vermez.
- **Sonuç:** `GameState.unlock / isUnlocked`. Ev komutları (Command) envantere dokunmaz.

## ADR-007: Çiftlik hayvanları diyagram dışı düz içerik

- **Karar:** Dört hayvan (gündüz 2, gece 2) ve konuşmaları düz veri ve düz kuraldır (`content/farmAnimals.ts`, `content/farmTalk.ts`), yeni desen yoktur. `FarmScene` evreyi her karede okur, Observer eklenmez.
- **Sonuç:** Diyagram dışıdır, `NOTES.md` içinde işaretli (ADR-001'e göre bilerek yapıldı; itiraz ederseniz geri alınır).

## ADR-008: Konum hatırlama kuralı

- **Karar:** Çiftlik hayvanları ve göldeki mob, oyuncu sahneden ayrılınca bulundukları yerde hatırlanır. Ayrılma ile dönüş arasında gündüz-gece değişimi olduysa (gece olup tekrar gündüz olması dahil) hiçbiri hatırlanmaz.
- **Sonuç:** `GameState.getPhaseChanges()` sayacı. Hafıza oturum süresince yaşar, sayfa yenilenince kaybolur, diske yazılmaz.

## ADR-009: Erişilebilirlik hedefi WCAG 2.1 AA

- **Karar:** Metin kontrastı en az 4.5:1 (renkler `config.colors` içinde, `tests/ui/contrast.test.ts` denetler), her menü klavyeyle kullanılabilir, durumlar yalnızca renkle belirtilmez, odaktaki öğe çerçeveyle belli edilir.
- **Sonuç:** Canvas oyunda ekran okuyucu ile oyun dünyasına erişim kapsam dışıdır.

## ADR-013: Hareket hızı ve saldırı hızı ayrı istatistiktir

- **Bağlam:** İleri aşamada geniş bir envanter planlanıyor; farklı eşyalar farklı istatistikleri değiştirecek. Hız tek bir sayı olursa genişlemek zorlaşır.
- **Karar:** İki ayrı istatistik: **hareket hızı** (piksel/sn, ördeğin yürümesi; `config.playerSpeed` taban) ve **saldırı hızı** (savaşta, aynı öncelikli komutlar arasında kim önce; `config.duck.attackSpeed` taban). Kıyafetler Decorator zinciriyle ikisine de ekleme yapar (`config.outfitSpeed`).
- **Sonuç:** `Combatant` arayüzüne iki üye eklendi (`getMoveSpeed`, `getAttackSpeed`). Bu, Decorator'ın kendi arayüzüne üye eklemektir; yeni desen veya yeni sınıf ailesi değildir. ADR-001'e göre işaretli; itiraz ederseniz geri alınır. Savaş sırası: önce öncelik (eşya hamleden önce), sonra saldırı hızı, sonra gönderim sırası.

## ADR-014: Takip eden mob yakalayınca karşılaşma kendiliğinden başlar

- **Karar:** Takip eden bir mob ördeğe değince panel açılmaz; `config.catchFightChance` (varsayılan 0.5) olasılıkla Fight, yoksa Befriend başlar (Undertale tarzı). Takip etmeyen mobda panel kalır. Befriend de `angerChance` ile savaşa dönebilir.

## ADR-015: Menüler klavyeyle gezilir, odak çerçeveyle gösterilir

- **Karar:** Her menüde (Settings, mob paneli, savaş menüsü, envanter, diyalog seçenekleri) ok tuşları odağı taşır, Enter/Space onaylar, odaktaki öğenin etrafında sarı çerçeve çizilir. Butonlar siyah zeminli beyaz yazıdır (kontrast 21:1). ADR-009'un uzantısı.
- **Sonuç:** Ortak yardımcı `MenuNav` (desen değil, düz sınıf).

## ADR-016: Hayvan adları İngilizce, bilinen film ve dizi karakterlerinden

- **Karar:** Ginger (Chicken Run), Clarabelle (Disney), Hedwig (Harry Potter), Puss in Boots (Shrek). Adlar yalnızca oyun içi isimdir; görseller ve konuşmalar özgündür.
- **Not:** Telifli karakter adları ders projesi dışında yayımlanacaksa değiştirilmeli.

## ADR-017: Yenilgi para kaybettirir ve evde uyandırır

- **Bağlam:** Rehber "yenilgide ceza yok, göle dön" diyordu (rehber bölüm 10, varsayılan).
- **Karar:** Yenilgide coin'lerin `config.loseCoinsFraction` (0.25) kadarı kaybolur, ördek evde doğar. Ev girişi canı doldurur. Kaçmak ve kazanmak değişmedi.

## ADR-018: Işıklar eşyalardan çıkar

- **Karar:** Gece ışıkları sabit daireler değil; her lamba döndüğü yöne bir ışık konisi ve yerde bir ışık lekesi bırakır, her disko topu renkli huzmeler döndürür. `HouseLights` hâlâ `GameState`'in Observer'ıdır ama artık `house-changed` olayını da dinler (yeni sınıf yok).

## ADR-019: Evin içi gece/gündüzde değişmez, yalnızca pencere değişir

- **Karar:** Ev arka planı tek resimdir. Pencerenin camı gece görünümüne solar. `SkyTint` evin arka planını artık değiştirmez (ev ona kaydolmaz).

## ADR-020: Dönüş, yerleştirilmiş eşyanın dizesinde saklanır

- **Karar:** `GameState.placed` değeri "chair" veya "chair@1" (saat yönünde çeyrek tur sayısı). Böylece ev komutları (`PlaceItemCommand`, `RemoveItemCommand`) ve kayıt dosyası değişmeden kalır; yalnızca metin taşırlar. Eski kayıtlar bozulmaz.

## ADR-021: Dükkân ahırdadır, düz içeriktir

- **Karar:** Çiftlikteki ahır dükkândır (`ShopScene`). Kıyafet ve mobilya bir kez alınır (mobilya ADR-006'daki gibi açılır), yiyecek tekrar alınabilir. Fiyatlar `config.shop`. Kurallar Phaser'dan bağımsız (`content/shop.ts`).
- **Sonuç:** Diyagram dışı düz sahne ve içerik, desen yok; `NOTES.md` içinde işaretli (ADR-001). Başlangıçta kıyafet yok ve 40 coin var.

## ADR-022: Stamina ve can barı

- **Bağlam:** Hep en ağır hasarı veren hamle seçilmesin; savaş sonrası can görülemiyordu.
- **Karar:** Ördeğin stamina'sı vardır (`config.duck.maxStamina`). Her hamlenin bir maliyeti vardır (`config.staminaCost`: Peck 4, Quack 1). Stamina her tur `config.staminaRegen` kadar geri gelir, her savaş tam stamina ile başlar. Yetmeyen hamle seçilemez (komut yine de çağrılırsa "too tired" der ve hiçbir şey yapmaz). Mobların stamina'sı sınırsızdır. Stamina yiyecekleri (Corn, Seed Cake) `UseItemCommand` ile yenir.
- **Sonuç:** Diyagram uzantıları: `Combatant`'a stamina üyeleri (`getStamina`, `getMaxStamina`, `spendStamina`, `restoreStamina`) ve `Move`'a `staminaCost` eklendi. Bu, Decorator ve Strategy arayüzlerine üye eklemektir; yeni desen veya sınıf ailesi yoktur (ADR-013 ile aynı türden). Üst çubuktaki can barı `GameState.getDuckHp()` ile her karede okunur, yeni Observer eklenmedi; savaşta can `GameState` dışında değiştiği için. İtiraz ederseniz geri alınır.

## ADR-023: Dış haritalar kenardan, binalar kapıdan geçilir

- **Karar:** Açık hava haritaları (çiftlik, göl) sol ve sağ kenarlarından birbirine bağlanır; ördek kenara yürüyünce harita değişir. Bina girişleri (ev, dükkân) kapı olarak kalır. Kural Phaser'dan bağımsızdır (`content/mapEdges.ts`).
- **Sonuç:** Eski `to_pond` ve `to_farm` kapı görselleri silindi. İleride yeni bir harita eklenirse (ör. orman) aynı yardımcıyla bağlanır.

## ADR-024: Göl haritası maskeyle tanımlanır

- **Bağlam:** Göl artık düz bir su şeridi değil, kıyı çizgisi, iskele ve tuğla meydanı olan bir harita.
- **Karar:** Göl düzeni (kara, tuğla, iskele, su) 80x45 hücrelik bir maskedir. `tools/generate-assets.mjs` hem resmi çizer hem maskeyi `src/content/pondMask.json` olarak yazar; oyun suyu bu maskeden okur (`pondMap.ts`). Böylece görünen su ile yüzülen su aynıdır.
- **Sonuç:** Gölün şeklini değiştirmek için betiğin `buildPondMask` işlevi düzenlenir ve `npm run assets` çalıştırılır. Takım arkadaşı gölün PNG'sini elle çizerse maske ona göre elle düzenlenmelidir (JSON dosyası). Kurbağa diyagram dışı süstür (desen yok).

## ADR-025: Çiftlik ile göl iskeleyle, aşağı-yukarı bağlanır (ADR-023'ün göl kısmının yerine geçti)

- **Bağlam:** İskele göl haritasında ekranın üstünden giriyor; sağ-sol kenarla bağlamak iskeleyle uyuşmuyordu.
- **Karar:** Çiftliğin alt kenarı göl haritasının üst kenarına bağlanır. İki haritadaki iskele aynı x aralığındadır (360-480), ördek geçişte iskele üzerinde belirir. ADR-023'ün genel kuralı (dış haritalar kenardan, binalar kapıdan) aynen geçerli; kenar artık dört yönlü (`left`, `right`, `top`, `bottom`, `content/mapEdges.ts`).
- **Sonuç:** Çiftlik haritasının alt 120 pikseli göl resmidir ve suya girilemez; çiftlikte ve gölde iskele hizası değişirse hem `PIER_LEFT/PIER_RIGHT` (FarmScene) hem göl maskesi (`buildPondMask`) birlikte değişmelidir.

## ADR-026: Çiftlikte yalnızca küçük bir koy, göl ekranında yalnızca iskele

- **Karar:** Çiftliğin alt kenarı artık tam genişlikte su değil; iskelenin çevresinde küçük bir koy ve iki yanında çit. Göl haritasında taş yol ve tuğla meydan yoktur; yalnızca ince bir iskele (60 px) bulunur. İskele hizası iki haritada aynıdır (ADR-025'in ölçüsü güncellendi: x 384-444).

## ADR-027: Sazlığın koruyucusu, fabrikanın ikinci yöntemiyle üretilir

- **Karar:** Reed Warden yeni bir somut ürün (`ReedGuardian extends Being`). Rastgele doğma tablosundan çıkmaz; saz yatağında durur. Üretimi için `BeingFactory`'ye ikinci bir fabrika yöntemi eklendi: `spawnGuardian()`, iki somut yaratıcıda (`DayBeingFactory`, `NightBeingFactory`) uygulanır ve `BossAI` atar. Sahne onu `new` ile üretmez.
- **Sonuç:** Factory Method yapısı korunuyor (yeni sınıf ailesi yok), ama bir yaratıcıya ikinci bir fabrika yöntemi eklemek diyagramda yok; bu yüzden ADR-001'e göre işaretlendi. İtiraz ederseniz alternatif: guardian'ı doğma tablosunda `guardian: true` girişi yapıp `spawn()`'a bağlamak.
- **Ayar:** `config.beings.reed_guardian` (can, atak, ödül, `dropChance`), `config.guardianRespawnChanges`.

## ADR-028: Orman haritası ve ikinci boss (Frog King)

- **Karar:** Çiftliğin sağı orman haritasıdır (altı göl, ADR-025). İki harita bir ağaç duvarı ve içindeki açıklıkla bağlanır (kural ADR-023'ün devamı: dış haritalar kenardan geçilir). Ormanın boss'u Frog King: Reed Warden'dan kolay (35 can, 3 atak; testle: çıplak ördek yiyecekle yener, Reed Warden'ı yenemez).
- **Diyagram notu:** `spawnGuardian` fabrika yöntemi artık hangi koruyucuyu istediğini parametre olarak alır (`spawnGuardian(which)`); yeni somut ürün `FrogKing`. ADR-027'nin devamı, aynı işaret (ikinci bir fabrika yöntemi). Ormanda rastgele moblar yoktur (postpone-works).
- **Sonuç:** Ortak yardımcı `GuardianPost` (Fight / Leave paneli) ormanda kullanılıyor; göldeki Reed Warden hâlâ kendi kodunu kullanıyor, ikisini birleştirmek postpone-works'te.

## ADR-029: Ev kulübe, dükkân ahşap pazar dükkânı

- **Karar:** Koli ev (ADR-005'teki ilk fikir) beğenilmediği için ev bir kulübeye çevrildi; içi de ahşap. Dükkân, `docs/assets example` içindeki turkuaz çatılı ahşap dükkân görselinden esinlenerek çizildi. Varlık kimliği `box_exit` (evin içinden çıkış kapısı) adı eski kalmıştır; gerekirse `house_exit` diye yeniden adlandırılabilir.
- **Sonuç:** Binaların boyutları `content/farmLayout.ts` içinde (ev 100x100, dükkân 140x110); çıkış noktaları ve süs engelleri buna göre. Davranış değişmedi.

## ADR-030: Desen sınıfları kitaba (GoF) göre düzeltildi

- **Neden:** Kod, Design Patterns kitabındaki rollerle karşılaştırıldı. Yapı doğruydu, ama birkaç yer kitabın niyetinden sapıyordu. İstek üzerine hepsi düzeltildi; bazıları sınıf diyagramına üye ekliyor, bu yüzden burada işaretlendi (ADR-001).
- **Factory Method (varlıklar):** Fabrika yöntemi artık `BeingFactory.createBeing(entry)` (korumalı, soyut). `spawn()` taban sınıfta tek bir işlem oldu (kitaptaki "AnOperation"): tabloyu atar, fabrika yöntemini çağırır, AI ve takip davranışını verir. Gündüz ve gece fabrikalarında tekrar eden kod kalktı. **Diyagram farkı:** diyagram fabrika yöntemi olarak `spawn()`'ı gösteriyor; şimdi `createBeing()`.
- **`spawnGuardian`:** İki fabrikada aynıydı, yani gerçek bir fabrika yöntemi değildi. Artık `BeingFactory` içinde tek, somut bir yöntem (ADR-027 ve ADR-028'in güncellemesi).
- **Factory Method (karşılaşmalar):** `EncounterFactory.begin(being)` eklendi: karşılaşmayı `create()` ile üretir ve başlatır. Sahneler artık `begin()` çağırıyor. **Diyagram farkı:** yeni bir yöntem.
- **Strategy:** `Being.chooseCommand(player)` eklendi; kararını AI'sına devreder. `Battle` artık `enemy.ai...` diye içeri uzanmıyor, bağlama (context) soruyor. **Diyagram farkı:** `Being`'e bir yöntem.
- **Observer:** `HouseScene` ve `PondScene` artık `Observer`'ı kendileri uygulamıyor; her biri `GameState`'e küçük bir gözlemci nesnesi (`stateObserver`) bağlıyor. Böylece Phaser'ın `update(time, delta)` yöntemi ile gözlemcinin `update(event, data)` yöntemi aynı ada sıkışmıyor (NOTES.md açık soru 1 kapandı). **Diyagram farkı:** diyagram bu iki sahneyi ConcreteObserver olarak gösteriyor; artık gözlemci sahnenin içindeki nesne.
- **Singleton:** `GameState.coins` özel oldu; okumak için `getCoins()`, değiştirmek için yalnızca `addCoins()`. Böylece para, gözlemcilere haber verilmeden değişemez.
- **Command:** Ev komutları ve `UseItemCommand` alıcılarını (receiver) kurulurken alıp saklıyor (varsayılan: `GameState.getInstance()`). Çağıran yerler değişmedi.
- **Bilerek bırakılanlar:** `GameState.resetForTests()` (yalnızca testler için, kılavuzda adı geçen ek) ve `Combatant` arayüzünün büyüklüğü (14 yöntem; küçültmek savaş ve kıyafet kodunu baştan tasarlamak demek).

## ADR-010: Takip etme şansı fabrikada atanır

- **Karar:** Bir mobun oyuncuyu takip edip etmeyeceği doğduğu anda `BeingFactory.assignFollow` ile, mob türüne bağlı hazır olasılıkla (`config.beings[id].followChance`) seçilir. Hareket yapay zekâsı için yeni bir Strategy sınıfı açılmadı (ADR-001).

## ADR-011: Dil

- **Karar:** Oyun içi metinler (menüler, konuşmalar, bildirimler) İngilizce. Dokümantasyon ve sizinle yazışma Türkçe. (Hayvan adları: ADR-016.)

## ADR-012: Çıkış tarayıcıda sekmeyi kapatamaz

- **Karar:** Settings'teki Exit kaydeder, oyunu dondurur ve "kapatabilirsiniz" ekranı gösterir; `P` ile oyuna dönülür.
