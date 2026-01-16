# 🎨 Görsel Sanatlar Değerlendirme Uygulaması

Modern, Progressive Web App (PWA) tabanlı bir öğrenci çalışma değerlendirme sistemi.

## ✨ Özellikler

### 📊 100 Puanlık Ağırlıklı Değerlendirme Sistemi
- Her ölçüte farklı ağırlık atayabilme (örn: Kompozisyon %40, Renk %30, Teknik %30)
- Ağırlık değiştirildiğinde otomatik yeniden hesaplama
- Toplam her zaman 100 puan

### 📸 Fotoğraf Takibi
- Kamera ile doğrudan fotoğraf çekme
- Dosyadan fotoğraf yükleme
- Çalışmanın gelişim sürecini görsel olarak takip
- Otomatik fotoğraf sıkıştırma

### 📱 Çevrimdışı Çalışma
- IndexedDB ile yerel veri saklama
- Service Worker ile offline desteği
- İnternet bağlantısı gerektirmez

### 📈 Raporlama ve Excel Export
- Sınıf bazında raporlar
- Öğrenci bazında detaylı analizler
- CSV formatında Excel export

### 🎯 Tam Özellik Listesi
- ✅ Sınıf yönetimi (ekleme, düzenleme, silme)
- ✅ Öğrenci yönetimi (tek tek veya Excel/CSV'den toplu ekleme)
- ✅ Özelleştirilebilir değerlendirme ölçütleri (3-5 arası)
- ✅ Çalışma takibi ve değerlendirme
- ✅ Fotoğraf geçmişi
- ✅ Detaylı raporlama
- ✅ PWA - Android ana ekrana eklenebilir

## 🚀 Kurulum ve Kullanım

### 1. Uygulamayı Açma

**Seçenek A: Doğrudan Tarayıcıda**
- `index.html` dosyasına çift tıklayın
- Tarayıcınızda açılacaktır

**Seçenek B: Yerel Sunucu (Önerilen)**
- Python yüklüyse:
  ```bash
  python -m http.server 8000
  ```
- Tarayıcıda açın: `http://localhost:8000`

### 2. Android'e Kurulum (PWA)

1. Chrome veya Edge tarayıcıda uygulamayı açın
2. Tarayıcı menüsünden "Ana ekrana ekle" seçeneğini seçin
3. Uygulama ana ekranınıza eklenecektir
4. Artık normal bir uygulama gibi kullanabilirsiniz!

### 3. İlk Kullanım Adımları

#### Adım 1: Sınıf Ekleyin
1. "Sınıflar" sekmesine gidin
2. "+ Yeni Sınıf" butonuna tıklayın
3. Sınıf adı ve yıl bilgilerini girin
4. "Kaydet" butonuna tıklayın

#### Adım 2: Öğrenci Ekleyin

**Tek Tek Ekleme:**
1. "Öğrenciler" sekmesine gidin
2. "+ Yeni Öğrenci" butonuna tıklayın
3. Öğrenci bilgilerini ve sınıfını seçin
4. "Kaydet" butonuna tıklayın

**Excel/CSV'den Toplu Ekleme:**
1. "Öğrenciler" sekmesine gidin
2. "📊 Excel'den Aktar" butonuna tıklayın
3. CSV dosyanızı seçin (örnek: `ornek-ogrenci-listesi.csv`)
4. Önizleme ekranında öğrencileri kontrol edin
5. Hangi sınıfa eklemek istediğinizi seçin
6. "✓ İçe Aktar" butonuna tıklayın

**CSV Formatı:**
```csv
Ad Soyad,Öğrenci No
Ahmet Yılmaz,1001
Ayşe Demir,1002
Mehmet Kaya,1003
```

> [!TIP]
> Excel dosyanızı CSV olarak kaydetmek için: Dosya → Farklı Kaydet → CSV (Virgülle Ayrılmış) formatını seçin.

#### Adım 3: Değerlendirme Ölçütü Şablonu Oluşturun
1. "Ölçütler" sekmesine gidin
2. "+ Yeni Şablon" butonuna tıklayın
3. Şablon adı girin (örn: "Resim Çalışması")
4. 3-5 arası ölçüt ekleyin
5. Her ölçüte ağırlık atayın (toplam %100 olmalı)
6. "Kaydet" butonuna tıklayın

**Örnek Ölçütler:**
- Kompozisyon: %40
- Renk Kullanımı: %30
- Teknik: %30

#### Adım 4: Çalışma Değerlendirin
1. "Değerlendirme" sekmesine gidin
2. Öğrenci seçin
3. "+ Yeni Çalışma" ile çalışma oluşturun
4. "Değerlendir" butonuna tıklayın
5. Fotoğraf çekin veya yükleyin
6. Her ölçüt için puan verin (0-10 arası)
7. Sistem otomatik olarak 100 üzerinden toplam puanı hesaplar
8. "Değerlendirmeyi Kaydet" butonuna tıklayın

#### Adım 5: Raporları İnceleyin
1. "Raporlar" sekmesine gidin
2. Özet istatistikleri görün
3. "Temel Rapor" veya "Detaylı Rapor" butonlarıyla Excel export alın

## 📊 Ağırlıklı Puanlama Sistemi Nasıl Çalışır?

### Örnek Hesaplama:

**Ölçütler:**
- Kompozisyon (Ağırlık: %40)
- Renk Kullanımı (Ağırlık: %30)
- Teknik (Ağırlık: %30)

**Verilen Puanlar:**
- Kompozisyon: 8/10
- Renk Kullanımı: 9/10
- Teknik: 7/10

**Hesaplama:**
```
Kompozisyon: (8/10) × 100 × 0.40 = 32 puan
Renk: (9/10) × 100 × 0.30 = 27 puan
Teknik: (7/10) × 100 × 0.30 = 21 puan
─────────────────────────────────────
TOPLAM: 80/100
```

### Ağırlık Değiştirme:
- Bir ölçütün ağırlığını değiştirdiğinizde, diğer ölçütlerin ağırlıkları otomatik olarak yeniden dağıtılır
- Toplam her zaman %100 kalır

## 🔧 Teknik Detaylar

### Kullanılan Teknolojiler
- **HTML5** - Semantic markup
- **CSS3** - Modern styling
- **Vanilla JavaScript** - Framework yok, saf JS
- **IndexedDB** - Yerel veri saklama
- **Service Worker** - Offline desteği
- **PWA** - Progressive Web App

### Tarayıcı Desteği
- ✅ Chrome/Edge (Önerilen)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers

### Veri Saklama
- Tüm veriler tarayıcınızın IndexedDB'sinde saklanır
- İnternet bağlantısı gerektirmez
- Veriler cihazınızda güvende

## 🔮 Gelecek Özellikler (Opsiyonel)

### Firebase Entegrasyonu
Şu anda uygulama tamamen offline çalışıyor. Firebase entegrasyonu için:

1. [Firebase Console](https://console.firebase.google.com/) → Yeni proje oluşturun
2. Firestore Database ekleyin
3. Storage ekleyin
4. Web app config bilgilerini `js/firebase-config.js` dosyasına ekleyin

## 📝 Notlar

- **Veri Yedekleme**: Tarayıcı verilerini temizlerseniz tüm veriler silinir. Düzenli olarak Excel export alın!
- **Kamera İzni**: İlk fotoğraf çekiminde tarayıcı kamera izni isteyecektir
- **Performans**: Binlerce kayıt için optimize edilmiştir

## 🆘 Sorun Giderme

### Kamera Çalışmıyor
- Tarayıcı kamera iznini kontrol edin
- HTTPS veya localhost kullanın (HTTP'de kamera çalışmaz)

### Veriler Kayboldu
- Tarayıcı geçmişini/önbelleği temizlediyseniz veriler silinmiş olabilir
- Excel export'larınızı kontrol edin

### PWA Kurulmuyor
- Chrome veya Edge kullanın
- HTTPS veya localhost'ta çalıştırın

## 📞 Destek

Herhangi bir sorunuz veya öneriniz için lütfen iletişime geçin.

---

**Geliştirici:** Antigravity AI
**Versiyon:** 1.0.0
**Tarih:** 2026
