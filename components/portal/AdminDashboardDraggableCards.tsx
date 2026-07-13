"use client";

import { useState, type ReactNode } from "react";
import { HighRiskClientInsightsCard } from "@/components/portal/HighRiskClientInsightsCard";
import { PractitionerMobilisationStatusCard } from "@/components/portal/PractitionerMobilisationStatusCard";
import { RequestsPipelineCard } from "@/components/portal/RequestsPipelineCard";
import {
  ThisWeeksWellnessDaysCard,
  WellnessCalendarCard,
} from "@/components/portal/WellnessDaysCard";
import { cn } from "@/lib/utils/cn";

type DashboardCardId =
  | "wellness-days"
  | "calendar"
  | "high-risk-insights"
  | "requests-pipeline"
  | "practitioner-mobilisation";

const defaultDashboardCardOrder: DashboardCardId[] = [
  "wellness-days",
  "calendar",
  "high-risk-insights",
  "requests-pipeline",
  "practitioner-mobilisation",
];

const dashboardCards: Record<DashboardCardId, ReactNode> = {
  "wellness-days": <ThisWeeksWellnessDaysCard />,
  calendar: <WellnessCalendarCard />,
  "high-risk-insights": <HighRiskClientInsightsCard />,
  "requests-pipeline": <RequestsPipelineCard />,
  "practitioner-mobilisation": <PractitionerMobilisationStatusCard />,
};

export function AdminDashboardDraggableCards() {
  const [dashboardCardOrder, setDashboardCardOrder] = useState(defaultDashboardCardOrder);
  const [draggingId, setDraggingId] = useState<DashboardCardId | null>(null);
  const [dragOverId, setDragOverId] = useState<DashboardCardId | null>(null);

  return (
    <section className="columns-1 gap-5 xl:columns-2">
      {dashboardCardOrder.map((cardId) => (
        <DraggableCard
          key={cardId}
          id={cardId}
          draggingId={draggingId}
          dragOverId={dragOverId}
          onDragStart={setDraggingId}
          onDragEnd={() => {
            setDraggingId(null);
            setDragOverId(null);
          }}
          onDragOver={setDragOverId}
          onDrop={(targetId) => {
            if (draggingId) {
              setDashboardCardOrder((currentOrder) =>
                reorderItems(currentOrder, draggingId, targetId),
              );
            }
            setDraggingId(null);
            setDragOverId(null);
          }}
        >
          {dashboardCards[cardId]}
        </DraggableCard>
      ))}
    </section>
  );
}

function DraggableCard({
  id,
  children,
  draggingId,
  dragOverId,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: {
  id: DashboardCardId;
  children: ReactNode;
  draggingId: DashboardCardId | null;
  dragOverId: DashboardCardId | null;
  onDragStart: (id: DashboardCardId) => void;
  onDragEnd: () => void;
  onDragOver: (id: DashboardCardId) => void;
  onDrop: (id: DashboardCardId) => void;
}) {
  const isDragging = draggingId === id;
  const isDragTarget = dragOverId === id && draggingId !== id;

  return (
    <div
      draggable
      aria-grabbed={isDragging}
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", id);
        onDragStart(id);
      }}
      onDragEnd={onDragEnd}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        onDragOver(id);
      }}
      onDrop={(event) => {
        event.preventDefault();
        onDrop(id);
      }}
      className={cn(
        "mb-5 break-inside-avoid cursor-grab rounded-2xl transition active:cursor-grabbing",
        isDragging && "scale-[0.99] opacity-55",
        isDragTarget && "ring-2 ring-primary/35 ring-offset-2 ring-offset-[#e4e7ec]",
      )}
      title="Drag to reorder"
    >
      {children}
    </div>
  );
}

function reorderItems<T extends string>(items: T[], sourceId: T, targetId: T) {
  if (sourceId === targetId) {
    return items;
  }

  const sourceIndex = items.indexOf(sourceId);
  const targetIndex = items.indexOf(targetId);

  if (sourceIndex === -1 || targetIndex === -1) {
    return items;
  }

  const nextItems = [...items];
  const [movedItem] = nextItems.splice(sourceIndex, 1);
  nextItems.splice(targetIndex, 0, movedItem);
  return nextItems;
}
