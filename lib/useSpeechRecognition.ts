"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Minimal typings for the Web Speech API (not in the standard DOM lib).
interface SpeechRecognitionResultLike {
  0: { transcript: string };
  isFinal: boolean;
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: { length: number; [i: number]: SpeechRecognitionResultLike };
}
interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: unknown) => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export interface UseSpeechRecognition {
  supported: boolean;
  listening: boolean;
  transcript: string; // finalized text for the current session
  interim: string; // in-progress (not yet final) text
  durationSec: number; // seconds the mic was active, set when stopped
  start: () => void;
  stop: () => void;
  reset: () => void;
}

// React hook wrapping the browser's free speech recognition.
export function useSpeechRecognition(): UseSpeechRecognition {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [durationSec, setDurationSec] = useState(0);

  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const finalRef = useRef("");
  const startMsRef = useRef(0);

  useEffect(() => {
    const Ctor = getCtor();
    if (!Ctor) return;
    setSupported(true);
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onresult = (e) => {
      let live = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalRef.current += r[0].transcript;
        else live += r[0].transcript;
      }
      setTranscript(finalRef.current);
      setInterim(live);
    };
    rec.onend = () => {
      setListening(false);
      setInterim("");
      if (startMsRef.current) {
        setDurationSec((Date.now() - startMsRef.current) / 1000);
      }
    };
    rec.onerror = () => setListening(false);

    recRef.current = rec;
    return () => {
      try {
        rec.stop();
      } catch {
        /* already stopped */
      }
    };
  }, []);

  const start = useCallback(() => {
    if (!recRef.current || listening) return;
    finalRef.current = "";
    setTranscript("");
    setInterim("");
    setDurationSec(0);
    startMsRef.current = Date.now();
    try {
      recRef.current.start();
      setListening(true);
    } catch {
      /* start can throw if already running */
    }
  }, [listening]);

  const stop = useCallback(() => {
    if (!recRef.current) return;
    try {
      recRef.current.stop();
    } catch {
      /* already stopped */
    }
  }, []);

  const reset = useCallback(() => {
    finalRef.current = "";
    setTranscript("");
    setInterim("");
    setDurationSec(0);
  }, []);

  return { supported, listening, transcript, interim, durationSec, start, stop, reset };
}
