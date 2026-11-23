# Postpone works (ertelenen işler)

Aklımızda olan ama **şu an uygulamayacağımız** fikirler. Bir madde öne alınırsa `yapilacaklar.md` dosyasına taşınır.
Yeni bir fikir geldiğinde buraya ekleyin; ben de işin ortasında aklıma gelen ama yapmadığım şeyleri buraya yazarım.

## Envanter ve içerik

- **Envanteri genişletmek.** Daha çok eşya çeşidi gelecek, hem **kıyafet** hem **ev eşyası**. Envanter ekranı büyüyecek (sayfalar veya sekmeler: kıyafet / ev eşyası / yiyecek / diğer, arama, sıralama). Hareket hızı ve saldırı hızı ayrı istatistik olarak tutuluyor (ADR-013), yeni eşyalar ikisini de değiştirebilir.
- **Daha çok kıyafet.** Her biri `OutfitDecorator` alt sınıfı + `config.outfitBonus` / `config.outfitSpeed` satırı + manifest + dükkân fiyatı. Fikir kaynağı: `assets example/` içindeki koni şapkalı ördek.
- **Daha çok ev eşyası.** Yeni eşya = bir `ITEMS` satırı + manifest + dükkân fiyatı (ve istenirse bir hayvandan hediye).
- **Ev için ikinci katman (duvar / tavan).** Rehberde "ikinci yuva" olarak geçiyor; duvara tablo, tavana avize gibi. Şu an yalnızca zemin ızgarası var.
- **Daha büyük ev veya birden çok oda.**

## Dükkân

- Eşya geri satma.
- Stok yenilenmesi, günün saatine göre değişen mallar, indirimler.
- Dükkâncı karakteri ve konuşması (şu an yalnızca bir menü).

## Dünya

- **Daha çok süs:** bitki sayfasındaki öbür bitkiler (sazlar, mavi sarmaşık, parlayan çiçekler), taşlar, kütükler; süslerin ördekle çarpışması (şu an yok), gece parlayan çiçekler.

- **Gölde taş yol / meydan:** istenmedi, kaldırıldı; tekrar istenirse tuğla hücreleri (`B`) maskede hâlâ desteklenir.

- **Göle iskele:** `assets example/` içindeki ahşap iskele görseli. Göl arka planına ve yürünebilir alana.
- **Hafızayı diske yazmak:** çiftlik hayvanı ve göl mobu konumları şu an yalnızca oturum boyunca hatırlanıyor (ADR-008). Sayfa yenilenince kayboluyor.
- **Rastgele olaylar:** gökten ekmek düşmesi, hayvanların zamanlı davranışları (ilk fikir notlarından).
- **Çiftlik etkinlikleri:** ekme, toplama (rehberde "farm" yalnızca merkez).
- **Müze ve tablo fikri** (en eski notlar; oyunun bu sürümü dışında).

## Savaş ve moblar

- **Ormanda rastgele moblar:** ormana özel yaratıklar (ör. sincap ya da domuz mobu), bunun için yaratıcıya bölge bilgisi gerekir (diyagram dışı olabilir, sorulacak).
- **Koruyucu kodunu birleştirmek:** göldeki Reed Warden hâlâ `PondScene` içindeki kendi koduyla çalışıyor; ormandaki `GuardianPost` ile birleştirilebilir.
- **Gezgin dükkân:** ormandaki araba gerçek bir dükkân olabilir (ör. farklı mallar, bataklık görselindeki gibi).
- Domuz ve sincapla etkileşim (besleme, konuşma).

- **Mob hareketi için ayrı bir Strategy sınıfı** (ör. `MoveAI`: kovalama, durma, kaçma). Diyagramda yok; ADR-001'e göre onay gerekir.
- Boss'lar için ayrı sınıflar ve özel hamleler (şu an çarpanlı normal mob). Reed Warden ilk ayrı boss sınıfı; ona özel hamle (ör. kanat çırpma) ve başka bölgelere başka koruyucular eklenebilir.
- Daha çok hamle (Move) ve düşman yapay zekâsı (EnemyAI).
- Yenilginin başka maliyetleri (gün saati kaybı vb.); şu an: coin kaybı + evde doğmak.

- **Stamina:** "dinlen" (Rest) eylemi, stamina'nın savaş dışında da sürmesi, kıyafetlerin maksimum stamina veya yenilenme hızını değiştirmesi, mobların da stamina'sı olması.
- **Daha çok yiyecek:** HP ve stamina dışında hız veya saldırı gücü geçici artıran yiyecekler.

## Ses

- Gerçek ses ve müzik dosyaları (`public/assets/sfx`, `music`). Şu an efektler üretilmiş bip sesi, müzik sessiz.

## Teknik

- Telifli karakter adlarının (Ginger, Clarabelle, Hedwig, Puss in Boots) oyun ders dışında yayımlanacaksa değiştirilmesi (ADR-016).
- Ekran okuyucu desteği: canvas oyunun dünyasını erişilebilir yapmak (ADR-009 kapsamı dışında kaldı).
