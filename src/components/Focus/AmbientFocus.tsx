import { useState, useEffect, useRef, useCallback } from "react";
import { useStore } from "../../store";
import { X, Play, Pause, Volume2, VolumeX } from "lucide-react";
import { cn } from "../../lib/utils";

type AmbientType = "rain" | "campfire" | "dungeon" | "forest" | "silence";

const AMBIENTS: { key: AmbientType; label: string; emoji: string }[] = [
  { key: "silence", label: "Silence", emoji: "🔇" },
  { key: "rain", label: "Rain", emoji: "🌧️" },
  { key: "campfire", label: "Campfire", emoji: "🔥" },
  { key: "dungeon", label: "Dungeon", emoji: "🏰" },
  { key: "forest", label: "Forest", emoji: "🌲" },
];

function createNoise(ctx: AudioContext, type: AmbientType): AudioNode | null {
  if (type === "silence") return null;
  const bufferSize = 2 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  gain.gain.value = 0.08;

  switch (type) {
    case "rain":
      filter.type = "lowpass";
      filter.frequency.value = 800;
      break;
    case "campfire":
      filter.type = "bandpass";
      filter.frequency.value = 300;
      filter.Q.value = 0.5;
      gain.gain.value = 0.05;
      break;
    case "dungeon":
      filter.type = "lowpass";
      filter.frequency.value = 200;
      gain.gain.value = 0.04;
      break;
    case "forest":
      filter.type = "bandpass";
      filter.frequency.value = 1200;
      filter.Q.value = 1.0;
      gain.gain.value = 0.03;
      break;
  }

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start();
  return source;
}

interface Props {
  questId: number;
  questName: string;
  onClose: () => void;
}

export function AmbientFocus({ questId, questName, onClose }: Props) {
  const completePomodoro = useStore((s) => s.completePomodoro);
  const pomodoroDuration = useStore((s) => s.pomodoroDuration);

  const [secondsLeft, setSecondsLeft] = useState(pomodoroDuration);
  const [running, setRunning] = useState(false);
  const [ambient, setAmbient] = useState<AmbientType>("silence");
  const [muted, setMuted] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioNode | null>(null);

  const stopAudio = useCallback(() => {
    if (sourceRef.current && "stop" in sourceRef.current) {
      (sourceRef.current as AudioBufferSourceNode).stop();
    }
    sourceRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      stopAudio();
      audioCtxRef.current?.close();
    };
  }, [stopAudio]);

  useEffect(() => {
    stopAudio();
    if (ambient === "silence" || muted) return;
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    sourceRef.current = createNoise(audioCtxRef.current, ambient);
  }, [ambient, muted, stopAudio]);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setRunning(false);
          completePomodoro(questId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [running, questId, completePomodoro]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const progress = ((pomodoroDuration - secondsLeft) / pomodoroDuration) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-gray-950 flex flex-col items-center justify-center">
      <button onClick={onClose} className="absolute top-6 right-6 p-2 text-muted hover:text-secondary transition-colors rounded-lg hover:bg-card-hover">
        <X className="w-6 h-6" />
      </button>

      <div className="text-center space-y-8 max-w-md">
        <p className="text-sm text-muted uppercase tracking-widest">Focusing on</p>
        <h1 className="text-2xl font-bold text-primary">{questName}</h1>

        <div className="relative w-48 h-48 mx-auto">
          <svg className="w-48 h-48 -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="rgb(30 41 59)" strokeWidth="8" />
            <circle cx="60" cy="60" r="54" fill="none" stroke="url(#focusGrad)" strokeWidth="8"
              strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 54}`}
              strokeDashoffset={`${2 * Math.PI * 54 * (1 - progress / 100)}`}
              className="transition-all duration-1000" />
            <defs><linearGradient id="focusGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#00E5FF" /><stop offset="100%" stopColor="#00FF66" /></linearGradient></defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl font-mono font-bold text-primary tabular-nums">
              {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          <button onClick={() => setRunning(!running)}
            className={cn("w-14 h-14 rounded-full flex items-center justify-center transition-all border-2",
              running ? "bg-card border-secondary text-secondary hover:border-secondary" : "bg-electric-blue/20 border-electric-blue/40 text-electric-blue hover:bg-electric-blue/30"
            )}>
            {running ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
          </button>
        </div>

        <div className="space-y-3">
          <p className="text-xs text-muted uppercase tracking-wider">Ambient Sound</p>
          <div className="flex gap-2 justify-center flex-wrap">
            {AMBIENTS.map((a) => (
              <button key={a.key} onClick={() => setAmbient(a.key)}
                className={cn("px-3 py-2 rounded-lg text-sm transition-all border",
                  ambient === a.key ? "bg-electric-blue/15 text-electric-blue border-electric-blue/30" : "bg-card text-secondary border-subtle hover:text-primary"
                )}>
                <span className="mr-1.5">{a.emoji}</span>{a.label}
              </button>
            ))}
          </div>
          <button onClick={() => setMuted(!muted)} className="text-xs text-muted hover:text-secondary flex items-center gap-1 mx-auto">
            {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            {muted ? "Unmute" : "Mute"}
          </button>
        </div>
      </div>
    </div>
  );
}
