import { useEffect, useRef, useState } from "react";

export function useSpeech(onFinalText) {
  const recRef = useRef(null);
  const cbRef = useRef(onFinalText);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");

  // always keep the newest callback so the mic never uses stale data
  useEffect(() => {
    cbRef.current = onFinalText;
  }, [onFinalText]);

  const start = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert("Speech recognition is not supported here. Use Chrome or Edge.");
      return;
    }
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onresult = (e) => {
      let live = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) cbRef.current(t.trim());
        else live += t;
      }
      setInterim(live);
    };
    rec.onend = () => {
      setListening(false);
      setInterim("");
    };
    rec.onerror = () => setListening(false);

    rec.start();
    recRef.current = rec;
    setListening(true);
  };

  const stop = () => recRef.current?.stop();

  return { start, stop, listening, interim };
}