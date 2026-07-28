import React, { useState } from 'react';
import { DndContext, type DragEndEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// ==============================================================================
// 🃏 SUBCOMPONENTE: Tarjeta Arrastrable, Editable y Borrable
// ==============================================================================
const SortableCard = ({ card, setCards, token }: { card: any; setCards: any; token: string }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: card.id });

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || "");

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Guardar edición (PUT /cards/{id})
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:8000/cards/${card.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, description })
      });

      if (response.ok) {
        const updatedCard = await response.json();
        setCards((prev: any[]) => prev.map(c => c.id === card.id ? updatedCard : c));
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error al actualizar la tarjeta:", error);
    }
  };

  // Eliminar tarjeta (DELETE /cards/{id})
  const handleDelete = async () => {
    if (!window.confirm("¿Seguro que quieres eliminar esta tarjeta?")) return;

    try {
      const response = await fetch(`http://localhost:8000/cards/${card.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok || response.status === 204) {
        setCards((prev: any[]) => prev.filter(c => c.id !== card.id));
      }
    } catch (error) {
      console.error("Error al eliminar la tarjeta:", error);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="p-3 mb-2 bg-white rounded shadow cursor-grab active:cursor-grabbing border border-gray-200"
    >
      {isEditing ? (
        <div onPointerDown={(e) => e.stopPropagation()}>
          <form onSubmit={handleEdit} className="space-y-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border p-1 rounded text-sm text-black bg-gray-50"
              required
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border p-1 rounded text-sm text-black bg-gray-50"
              placeholder="Descripción..."
            />
            <div className="flex gap-2 justify-end">
              <button type="submit" className="px-2 py-1 bg-blue-600 text-white rounded text-xs font-medium">Guardar</button>
              <button type="button" onClick={() => setIsEditing(false)} className="px-2 py-1 bg-gray-400 text-white rounded text-xs font-medium">Cancelar</button>
            </div>
          </form>
        </div>
      ) : (
        <div>
          <h4 className="font-semibold text-sm text-gray-800">{card.title}</h4>
          {card.description && <p className="text-xs text-gray-500 mt-1">{card.description}</p>}
          
          <div className="flex justify-end gap-3 mt-3 pt-2 border-t border-gray-100" onPointerDown={(e) => e.stopPropagation()}>
            <button onClick={() => setIsEditing(true)} className="text-xs text-blue-600 hover:underline font-medium">
              ✏️ Editar
            </button>
            <button onClick={handleDelete} className="text-xs text-red-600 hover:underline font-medium">
              🗑️ Borrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ==============================================================================
// 📋 COMPONENTE PRINCIPAL: Tablero
// ==============================================================================
export const Board = ({ cards, setCards, token }: any) => {
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const cardId = Number(active.id);
    const targetListId = over.data.current?.listId || Number(over.id);
    const newPosition = over.data.current?.index ?? 1;

    setCards((prevCards: any[]) =>
      prevCards.map((card) =>
        card.id === cardId
          ? { ...card, list_id: targetListId, position: newPosition }
          : card
      )
    );

    try {
      await fetch(`http://localhost:8000/cards/${cardId}/move`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ list_id: targetListId, position: newPosition })
      });
    } catch (error) {
      console.error("Error al mover la tarjeta:", error);
    }
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 p-4 overflow-x-auto">
        <SortableContext items={cards.map((c: any) => c.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2 w-full max-w-xs bg-gray-100 p-3 rounded-md">
            {cards.map((card: any) => (
              <SortableCard key={card.id} card={card} setCards={setCards} token={token} />
            ))}
          </div>
        </SortableContext>
      </div>
    </DndContext>
  );
};