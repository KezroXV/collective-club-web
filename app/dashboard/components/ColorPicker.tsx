"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Copy } from "lucide-react";
import { toast } from "sonner";
import { hexToHsl, hslToHex, isValidHex } from "@/lib/color-utils";

const COLOR_PRESETS = [
  "#3B82F6",
  "#06B6D4",
  "#10B981",
  "#84CC16",
  "#EF4444",
  "#F97316",
  "#8B5CF6",
  "#EC4899",
];

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  borderColor?: string;
}

export default function ColorPicker({ color, onChange, borderColor = "#E5E7EB" }: ColorPickerProps) {
  const [presets, setPresets] = useState(COLOR_PRESETS);
  const [hexInput, setHexInput] = useState(color);
  const [hsl, setHsl] = useState(() => hexToHsl(color));
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    setHexInput(color);
    setHsl(hexToHsl(color));
  }, [color]);

  const updateFromHsl = (next: Partial<{ h: number; s: number; l: number }>) => {
    const nextHsl = { ...hsl, ...next };
    setHsl(nextHsl);
    const nextHex = hslToHex(nextHsl.h, nextHsl.s, nextHsl.l);
    onChange(nextHex);
  };

  const handleHexInput = (value: string) => {
    setHexInput(value);
    if (isValidHex(value)) {
      const normalized = value.startsWith("#") ? value : `#${value}`;
      onChange(normalized.toUpperCase());
    }
  };

  const handleCopyHex = async () => {
    try {
      await navigator.clipboard.writeText(hexInput.toUpperCase());
      toast.success("Couleur copiée dans le presse-papiers");
    } catch {
      toast.error("Impossible de copier la couleur");
    }
  };

  const handleAddPreset = () => {
    if (!isValidHex(hexInput)) return;
    const normalized = hexInput.startsWith("#")
      ? hexInput.toUpperCase()
      : `#${hexInput.toUpperCase()}`;
    if (!presets.includes(normalized)) {
      setPresets((p) => [...p, normalized].slice(-12));
      toast.success("Couleur ajoutée aux presets");
    }
  };

  const handleColorPickerMove = (e: React.MouseEvent, rect: DOMRect) => {
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(
      0,
      Math.min(1, 1 - (e.clientY - rect.top) / rect.height)
    );
    const newS = Math.round(x * 100);
    const newL = Math.round(y * 100);
    updateFromHsl({ s: newS, l: newL });
  };

  return (
    <div className="mt-4">
      <div className="grid grid-cols-3 gap-4 mb-3">
        <div className="col-span-2">
          <div
            className="relative w-full h-32 rounded-xl border overflow-hidden cursor-crosshair"
            style={{ borderColor }}
            onMouseDown={(e) => {
              setIsDragging(true);
              const rect = e.currentTarget.getBoundingClientRect();
              handleColorPickerMove(e, rect);
            }}
            onMouseMove={(e) => {
              if (!isDragging) return;
              const rect = e.currentTarget.getBoundingClientRect();
              handleColorPickerMove(e, rect);
            }}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
          >
            <div
              className="absolute inset-0"
              style={{
                background: `hsl(${hsl.h}, 100%, 50%)`,
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to right, white, transparent)",
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to top, black, transparent)",
              }}
            />
            <div
              className="absolute w-4 h-4 border-2 border-white rounded-full shadow-lg pointer-events-none"
              style={{
                left: `${hsl.s}%`,
                bottom: `${hsl.l}%`,
                transform: "translate(-50%, 50%)",
              }}
            />
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium mb-2 block">
            Couleurs enregistrées
          </Label>
          <div className="grid grid-cols-3 gap-2">
            {presets.slice(0, 9).map((presetColor) => (
              <button
                key={presetColor}
                onClick={() => onChange(presetColor)}
                className={`w-8 h-8 rounded-full border-2 ${
                  color === presetColor
                    ? "border-gray-900 scale-110"
                    : "border-chart-4"
                } transition-all`}
                style={{ backgroundColor: presetColor }}
              />
            ))}
          </div>
          <button
            onClick={handleAddPreset}
            className="w-full mt-2 text-xs text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1"
            title="Ajouter la couleur actuelle"
          >
            <Plus className="h-3 w-3" />
            Ajouter
          </button>
        </div>
      </div>

      <div
        className="relative h-3 rounded-full overflow-hidden mb-3"
        style={{
          background:
            "linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)",
        }}
      >
        <input
          type="range"
          min={0}
          max={360}
          step={1}
          value={hsl.h}
          onChange={(e) =>
            updateFromHsl({ h: Number(e.target.value) })
          }
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div
          className="absolute w-4 h-4 bg-white border-2 border-gray-300 rounded-full -mt-0.5 hover:shadow-sm pointer-events-none"
          style={{
            left: `${(hsl.h / 360) * 100}%`,
            transform: "translateX(-50%)",
          }}
        />
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Label className="text-sm text-gray-700">Hex</Label>
          <Input
            value={hexInput}
            onChange={(e) => handleHexInput(e.target.value)}
            className="h-8 w-24 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm text-gray-700">100%</Label>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={color}
            onChange={(e) => onChange(e.target.value)}
            className="h-8 w-10 p-0 border rounded cursor-pointer"
          />
        </div>
        <button
          onClick={handleCopyHex}
          className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-chart-4 text-gray-600 hover:bg-gray-50"
          title="Copier"
        >
          <Copy className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}