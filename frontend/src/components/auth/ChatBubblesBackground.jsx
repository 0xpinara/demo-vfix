import { useEffect, useRef } from 'react'
import './ChatBubblesBackground.css'

const turkishTips = [
  "Buzdolabı çok ses yapıyorsa ayaklarını kontrol edin",
  "Çamaşır makinesini fazla doldurmayın",
  "Fırınınızı düzenli temizleyin",
  "Klimanın filtrelerini ayda bir temizleyin",
  "Bulaşık makinesinin kollarını kontrol edin",
  "Elektrikli cihazları prize takmadan önce elleri kurulayın",
  "Ampul değiştirirken elektriği kapatın",
  "Buzdolabının kapı contasını kontrol edin",
  "Mikrodalganın içini limonlu suyla temizleyin",
  "Elektrik tasarrufu için LED kullanın",
  "Çamaşır makinesinin hortumlarını yılda bir değiştirin",
  "Fırın ısınırken kapağını açmayın",
  "Klima montajını profesyonele yaptırın",
  "Buzdolabını duvardan 10 cm uzağa yerleştirin",
  "Elektrikli süpürgenin torbası dolduğunda değiştirin",
  "Ütü tabanını sirkeyle temizleyin",
  "Kahve makinesini düzenli kireç çözücü ile temizleyin",
  "Tost makinesinin kırıntı tepsisini temizleyin",
  "Su ısıtıcınızı ayda bir sirkeli suyla kaynatın",
  "Mixer bıçaklarını temizlerken dikkatli olun",
  "Bulaşık makinesine makine tuzu koymayı unutmayın",
  "Fırın tepsilerine yağlı kağıt kullanın",
  "Elektrikli cihazları kullanmadığınızda fişten çekin",
  "Klima 16 derecenin altına ayarlamayın",
  "Çamaşır makinesini boş çalıştırarak temizleyin",
  "Derin dondurucuyu yılda bir kez buzdan arındırın",
  "Çamaşır makinesinin kapağını açık bırakın",
  "Fırın fanını temiz tutun",
  "Blender motorunu aşırı yüklememeye dikkat edin",
  "Elektrikli ızgara plakalarını her kullanımdan sonra temizleyin",
  "Vantilatör kanatlarını düzenli sileyin",
  "Buzdolabında hava sirkülasyonu için boşluk bırakın",
  "Elektrik süpürgesinin filtresini temizleyin",
  "Mikrodalga için uygun kaplar kullanın",
  "Çamaşır suyu ve sirkeyi karıştırmayın",
  "Klima dış ünitesini engellemeyin",
  "Tost makinesini baş aşağı çevirip silkeleyin",
  "Su filtrelerini üretici önerisine göre değiştirin",
  "Elektrikli cihazları nemli elle kullanmayın"
]

function ChatBubblesBackground() {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const numberOfBubbles = 30

    for (let i = 0; i < numberOfBubbles; i++) {
      const bubble = document.createElement('div')
      bubble.className = 'chat-bubble'

      const sizeClass = Math.random() < 0.3 ? 'small' : Math.random() < 0.7 ? 'medium' : 'large'
      bubble.classList.add(sizeClass)

      bubble.textContent = turkishTips[Math.floor(Math.random() * turkishTips.length)]

      bubble.style.left = Math.random() * 100 + '%'

      const initialBottom = -300 - (Math.random() * 400)
      bubble.style.bottom = initialBottom + 'px'
      bubble.style.setProperty('--initial-bottom', initialBottom + 'px')
      bubble.style.opacity = '0'

      const duration = 15 + Math.random() * 15
      bubble.style.animationDuration = duration + 's'

      const baseDelay = (i * 1.2)
      const randomOffset = Math.random() * 2
      bubble.style.animationDelay = (baseDelay + randomOffset) + 's'

      const drift = (Math.random() - 0.5) * 100
      bubble.style.setProperty('--drift', drift + 'px')

      const rotate = (Math.random() - 0.5) * 8
      bubble.style.setProperty('--rotate', rotate + 'deg')

      container.appendChild(bubble)
    }

    return () => {
      container.innerHTML = ''
    }
  }, [])

  return <div className="chat-bubbles-container" ref={containerRef}></div>
}

export default ChatBubblesBackground

