"use client";

import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { sfx } from "@/lib/sfx";

/**
 * Global, fixed opt-in sound toggle. Off by default; the click is the user
 * gesture that unlocks the AudioContext, so audio only ever plays after intent.
 */
export function SoundToggle() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    sfx.init();
    setOn(sfx.enabled);
  }, []);

  return (
    <button
      type="button"
      onClick={() => {
        const v = !on;
        sfx.setEnabled(v);
        setOn(v);
      }}
      aria-label={on ? "Mute sound" : "Enable sound"}
      title={on ? "Sound on — click to mute" : "Sound off — click for synthesized SFX"}
      className="fixed bottom-5 left-5 z-[60] w-10 h-10 rounded-full panel-strong flex items-center justify-center text-text-mid hover:text-phosphor transition-colors press"
    >
      {on ? <Volume2 className="w-4 h-4 text-phosphor" /> : <VolumeX className="w-4 h-4" />}
    </button>
  );
}
