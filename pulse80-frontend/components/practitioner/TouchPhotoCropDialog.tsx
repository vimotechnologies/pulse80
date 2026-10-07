"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

import { ActionButton } from "@/components/portal/ActionButton";

type Point = { x: number; y: number };

export function TouchPhotoCropDialog({ file, onCancel, onConfirm }: {
  file: File;
  onCancel: () => void;
  onConfirm: (file: File) => Promise<void>;
}) {
  const [source] = useState(() => URL.createObjectURL(file));
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const gestureRef = useRef<{ startPan: Point; startPoint?: Point; startDistance?: number; startZoom: number }>({ startPan: { x: 0, y: 0 }, startZoom: 1 });

  useEffect(() => () => URL.revokeObjectURL(source), [source]);

  function distance(a: React.PointerEvent, b: React.PointerEvent) {
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  }

  const pointers = useRef(new Map<number, React.PointerEvent>());

  function pointerDown(event: React.PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, event);
    const active = [...pointers.current.values()];
    gestureRef.current.startPan = pan;
    gestureRef.current.startZoom = zoom;
    if (active.length === 1) gestureRef.current.startPoint = { x: event.clientX, y: event.clientY };
    if (active.length === 2) gestureRef.current.startDistance = distance(active[0]!, active[1]!);
  }

  function pointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, event);
    const active = [...pointers.current.values()];
    if (active.length === 1 && gestureRef.current.startPoint) {
      setPan({
        x: gestureRef.current.startPan.x + event.clientX - gestureRef.current.startPoint.x,
        y: gestureRef.current.startPan.y + event.clientY - gestureRef.current.startPoint.y,
      });
    } else if (active.length === 2 && gestureRef.current.startDistance) {
      const next = gestureRef.current.startZoom * distance(active[0]!, active[1]!) / gestureRef.current.startDistance;
      setZoom(Math.min(3, Math.max(1, next)));
    }
  }

  function pointerUp(event: React.PointerEvent<HTMLDivElement>) {
    pointers.current.delete(event.pointerId);
    const remaining = [...pointers.current.values()];
    gestureRef.current.startPan = pan;
    gestureRef.current.startZoom = zoom;
    gestureRef.current.startDistance = undefined;
    if (remaining.length === 1) gestureRef.current.startPoint = { x: remaining[0]!.clientX, y: remaining[0]!.clientY };
  }

  async function confirmCrop() {
    const image = imageRef.current;
    if (!image || !image.naturalWidth || !image.naturalHeight) return;
    setSaving(true);
    const size = 640;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");
    if (!context) { setSaving(false); return; }

    const previewSize = 288;
    const basePreviewScale = Math.max(previewSize / image.naturalWidth, previewSize / image.naturalHeight);
    const outputScale = (size / previewSize) * basePreviewScale * zoom;
    const outputPanX = pan.x * size / previewSize;
    const outputPanY = pan.y * size / previewSize;
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, size, size);
    context.drawImage(
      image,
      (size - image.naturalWidth * outputScale) / 2 + outputPanX,
      (size - image.naturalHeight * outputScale) / 2 + outputPanY,
      image.naturalWidth * outputScale,
      image.naturalHeight * outputScale,
    );

    canvas.toBlob(async (blob) => {
      if (!blob) { setSaving(false); return; }
      const cropped = new File([blob], `${file.name.replace(/\.[^.]+$/, "")}-profile.jpg`, { type: "image/jpeg" });
      try { await onConfirm(cropped); } finally { setSaving(false); }
    }, "image/jpeg", 0.82);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4" role="dialog" aria-modal="true" aria-label="Adjust profile picture">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl">
        <h2 className="text-lg font-semibold text-navy">Adjust profile picture</h2>
        <p className="mt-1 text-xs text-subtle">Drag the picture to position it. Pinch with two fingers to zoom.</p>
        <div
          className="relative mx-auto mt-4 aspect-square max-w-72 touch-none select-none overflow-hidden rounded-full bg-soft-bg"
          onPointerDown={pointerDown}
          onPointerMove={pointerMove}
          onPointerUp={pointerUp}
          onPointerCancel={pointerUp}
        >
          <Image
            ref={imageRef}
            src={source}
            alt="Profile crop preview"
            fill
            unoptimized
            draggable={false}
            className="pointer-events-none object-cover"
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
          />
          <div className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-inset ring-white/90" />
        </div>
        <label className="mt-5 block text-xs font-semibold text-navy">
          Zoom
          <input type="range" min="1" max="3" step="0.05" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} className="mt-2 w-full" />
        </label>
        <div className="mt-5 flex justify-end gap-2">
          <ActionButton variant="secondary" onClick={onCancel}>Cancel</ActionButton>
          <ActionButton loading={saving} onClick={confirmCrop}>Use picture</ActionButton>
        </div>
      </div>
    </div>
  );
}
