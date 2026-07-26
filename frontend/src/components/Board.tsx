import React from 'react';
import { DndContext, type DragEndEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// ==========================================
// 🃏 SUBCOMPONENTE: Tarjeta Arrastrable (Punto 10)
// ==========================================
const SortableCard = ({ card }: { card: any }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="p-3 mb-2 bg-white rounded shadow cursor-grab active:cursor-grabbing border border-gray-200"
    >
      <h4 className="font-semibold text-sm text-gray-800">{card.title}</h4>
      {card.description && <p className="text-xs text-gray-500 mt-1">{card.description}</p>}
    </div>
  );
};

// ==========================================
// 📋 COMPONENTE PRINCIPAL: Tablero (Punto 10, 11 y 12)
// ==========================================
export const Board = ({ cards, setCards, token }: any) => {

  // Función que se dispara al soltar la tarjeta
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const cardId = Number(active.id);
    const targetListId = over.data.current?.listId || Number(over.id);
    const newPosition = over.data.current?.index ?? 1;

    // 1. Actualización optimista en React
    setCards((prevCards: any[]) =>
      prevCards.map((card) =>
        card.id === cardId
          ? { ...card, list_id: targetListId, position: newPosition }
          : card
      )
    );

    // 2. Comunicación con el Endpoint PATCH del Backend (Punto 11 y 12)
    try {
      const response = await fetch(`http://localhost:8000/cards/${cardId}/move`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          list_id: targetListId,
          position: newPosition
        })
      });

      if (!response.ok) {
        console.error("Error al guardar la nueva posición en la BD");
      }
    } catch (error) {
      console.error("Error de conexión al mover la tarjeta:", error);
    }
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 p-4 overflow-x-auto">
        {/* Renderizado con SortableContext para habilitar el arrastre de items */}
        <SortableContext items={cards.map((c: any) => c.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2 w-full max-w-xs bg-gray-100 p-3 rounded-md">
            {cards.map((card: any) => (
              <SortableCard key={card.id} card={card} />
            ))}
          </div>
        </SortableContext>
      </div>
    </DndContext>
  );
};