import { useState, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid"; // for unique session IDs
import { getFeedback, saveFeedback } from "@/services/feedback";

export function useChat() {
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [attachedImages, setAttachedImages] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [feedbackBySession, setFeedbackBySession] = useState({});
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [sessions, currentSessionId]);  

  const msgs = sessions.find((s) => s.id === currentSessionId)?.messages || [];

  function getDemoResponse(userMessage) {
    const message = userMessage.toLowerCase();
    
    if (message.includes("5e") || message.includes("hata")) {
      return `Çamaşır makinenizde 5E hatası genellikle su tahliye sorununu gösterir. İşte kontrol etmeniz gerekenler:

1. **GÜVENLİK ÖNCELİKLİ**: Önce cihazın fişini çekin.

2. **Tahliye Hortumu**: 
   - Hortumun bükülmediğinden emin olun
   - Filtre tıkanmış olabilir
   - Hortum bağlantılarını kontrol edin

3. **Filtre Kontrolü**:
   - Alt kısımdaki filtreyi çıkarın
   - Temizleyin ve tekrar takın

4. **Pompa Kontrolü**:
   - Pompada takılı cisim olabilir
   
Fotoğraf gönderirseniz daha detaylı yardımcı olabilirim. Hangi açıdan fotoğraf çekmemi istersiniz?`;
    }
    
    if (message.includes("buzdolabı") || message.includes("soğut")) {
      return `Buzdolabınızın soğutmaması birkaç nedenden kaynaklanabilir:

1. **GÜVENLİK**: Cihazı kapatın ve fişini çekin.

2. **Kontrol Listesi**:
   - Termostat ayarlarını kontrol edin (orta seviye olmalı)
   - Kapı contasının sağlam olduğunu kontrol edin
   - Arka kısımdaki havalandırma deliklerinin tıkalı olmadığından emin olun
   - Kompresör çalışıyor mu? (hafif vızıltı sesi olmalı)

3. **Buzlanma Kontrolü**:
   - Evaporatörde aşırı buz oluşumu var mı?
   - Varsa, defrost sistemi arızalı olabilir

Sorunun nereden kaynaklandığını daha iyi anlamak için arka panel fotoğrafı paylaşabilir misiniz?`;
    }
    
    if (message.includes("fırın") || message.includes("ısı")) {
      return `Fırının ısı sorunu yaşaması için birkaç olası neden var:

1. **İlk Kontroller**:
   - Termostat doğru ayarlı mı?
   - Fırın ızgarası doğru konumda mı?

2. **Olası Sorunlar**:
   - Rezistans arızası (üst/alt)
   - Termostat arızası
   - Kapak contası bozuk olabilir

3. **GÜVENLİK**: Elektrik işleri için profesyonel çağırın!

Hangi kısımda sorun olduğunu anlamak için termostat ve rezistans fotoğrafı gönderebilir misiniz?`;
    }

    if (message.includes("bulaşık") || message.includes("makine")) {
      return `Bulaşık makinesi sorunları genelde şu nedenlerden olur:

1. **Su Akışı Sorunları**:
   - Su girişi musluğu açık mı?
   - Filtreler temiz mi?
   - Kollar dönüyor mu?

2. **Program Sorunları**:
   - Kapı düzgün kapanıyor mu?
   - Deterjan bölmesi açılıyor mu?

3. **Temizlik Sorunları**:
   - Su sıcaklığı yeterli mi?
   - Doğru deterjan kullanıyor musunuz?

Sorununuzu biraz daha detaylandırabilir misiniz?`;
    }

    if (message.includes("mikrodalga") || message.includes("mikro")) {
      return `Mikrodalga fırın sorunları:

1. **Isıtmıyor ama döndürüyor**:
   - Magnetron arızalı olabilir
   - Yüksek voltaj kapasitörü bozulmuş olabilir
   - Profesyonel servis gerekir (TEHLİKELİ!)

2. **Hiç çalışmıyor**:
   - Sigorta atmış olabilir
   - Kapı kilidi sensörü bozuk olabilir
   - Kontrol paneli arızalı olabilir

3. **GÜVENLİK UYARISI**: 
   Mikrodalga fırınlar yüksek voltaj içerir. Kendiniz tamir etmeyin, profesyonel servis çağırın!`;
    }
    
    return `Merhaba! Size yardımcı olmak için buradayım. 

Lütfen sorununuzu biraz daha detaylı anlatır mısınız? Örneğin:
- Hangi cihaz? (çamaşır makinesi, buzdolabı, fırın, bulaşık makinesi, mikrodalga, vb.)
- Ne tür bir sorun? (çalışmıyor, hata veriyor, ses çıkarıyor, soğutmuyor)
- Hata kodu var mı?

Varsa fotoğraf da gönderebilirsiniz, daha iyi yardımcı olabilirim! 😊`;
  }

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      name: file.name,
    }));
    setAttachedImages((prev) => [...prev, ...newImages]);
  };

  const removeImage = (index) => {
    const newImages = [...attachedImages];
    URL.revokeObjectURL(newImages[index].url);
    newImages.splice(index, 1);
    setAttachedImages(newImages);
  };

  const downloadChat = () => {
    const session = sessions.find((s) => s.id === currentSessionId);
    if (!session) return;

    const chatText = session.messages
      .map((m) => `${m.role === "user" ? "Siz" : "AI"}: ${m.content}`)
      .join("\n\n");

    const blob = new Blob([chatText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${session.title || "chat-history"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleNewChat = () => {
    // Clear input/UI for a new chat
    setInput("");
    setAttachedImages([]);
    setCurrentSessionId(null); // mark as unsaved new chat
  };

  const createNewSession = (firstMessage) => {
    const id = uuidv4();
    const title =
      firstMessage.content.length > 20
        ? firstMessage.content.substring(0, 20) + "..."
        : firstMessage.content;

    const newSession = {
      id,
      title,
      messages: [firstMessage],
    };
    setSessions((prev) => [...prev, newSession]);
    setCurrentSessionId(id);
    return id;
  };

  const addMessageToSession = (message) => {
    setSessions((prev) =>
      prev.map((session) =>
        session.id === currentSessionId
          ? { ...session, messages: [...session.messages, message] }
          : session
      )
    );
  };

  const onSubmit = (e) => {
    e?.preventDefault?.();
    if ((!input.trim() && attachedImages.length === 0) || busy) return;

    const userMessage = {
      role: "user",
      content: input.trim() || "Fotoğraf gönderildi",
      images: [...attachedImages],
    };

    setInput("");
    setAttachedImages([]);
    setBusy(true);

    let sessionId = currentSessionId;

    // If no current session, create one
    if (!sessionId) {
      sessionId = createNewSession(userMessage);
    } else {
      // Add message to existing session
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? { ...s, messages: [...s.messages, userMessage] }
            : s
        )
      );
    }

    setTimeout(() => {
      const response = getDemoResponse(userMessage.content);

      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? { ...s, messages: [...s.messages, { role: "assistant", content: response }] }
            : s
        )
      );

      setBusy(false);
    }, 800);
  };

  const fetchFeedbackForSession = async (sessionId) => {
    if (!sessionId) return null;
    if (feedbackBySession[sessionId]?.__loaded) {
      return feedbackBySession[sessionId];
    }

    try {
      setFeedbackLoading(true);
      setFeedbackError(null);
      const data = await getFeedback(sessionId);
      setFeedbackBySession((prev) => ({
        ...prev,
        [sessionId]: { ...data, __loaded: true },
      }));
      return data;
    } catch (err) {
      const status = err?.response?.status;
      if (status === 404) {
        setFeedbackBySession((prev) => ({
          ...prev,
          [sessionId]: { __loaded: true, notFound: true },
        }));
        return null;
      }
      setFeedbackError(
        err?.response?.data?.detail || "Feedback could not be loaded."
      );
      throw err;
    } finally {
      setFeedbackLoading(false);
    }
  };

  const submitFeedback = async (payload) => {
    try {
      setFeedbackLoading(true);
      setFeedbackError(null);
      const saved = await saveFeedback(payload);
      setFeedbackBySession((prev) => ({
        ...prev,
        [payload.session_id]: { ...saved, __loaded: true },
      }));
      return saved;
    } catch (err) {
      setFeedbackError(
        err?.response?.data?.detail || "Feedback could not be saved."
      );
      throw err;
    } finally {
      setFeedbackLoading(false);
    }
  };

  return {
    sessions,
    currentSessionId,
    setCurrentSessionId,
    msgs,
    input,
    setInput,
    busy,
    attachedImages,
    handleImageUpload,
    removeImage,
    onSubmit,
    sidebarOpen,
    setSidebarOpen,
    handleNewChat,
    downloadChat,
    messagesEndRef,
    fetchFeedbackForSession,
    submitFeedback,
    feedbackBySession,
    feedbackLoading,
    feedbackError,
  };
}
