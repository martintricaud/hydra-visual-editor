import interact from 'interactjs';

interface DraggableParams {
  key: string;
  onMove: (key: string, dx: number, dy: number) => void;
}

export function draggable(node: HTMLElement, params: DraggableParams) {
  const { key, onMove } = params;
  const interactable = interact(node).draggable({
    listeners: {
      move(event) {
        onMove(key, event.dx, event.dy);
      }
    },
    inertia: false
  });

  return {
    destroy() {
      interactable.unset();
    }
  };
} 