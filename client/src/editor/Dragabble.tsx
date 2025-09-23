import React, { useRef } from "react";
import Draggable from "react-draggable";
import type { DraggableLatexProps } from "../types/types";

const DraggableLatex: React.FC<DraggableLatexProps> = ({
  latex,
  defaultPosition,
  onStop,
}) => {
  const nodeRef = useRef<HTMLDivElement>(null);

  return (
    <Draggable
      nodeRef={nodeRef}
      defaultPosition={defaultPosition}
      onStop={(_, data) => onStop({ x: data.x, y: data.y })}
    >
      <div
        ref={nodeRef}
        className="absolute p-2 text-white rounded shadow-md bg-black/60"
      >
        <div className="latex-content">{latex}</div>
      </div>
    </Draggable>
  );
};

export default DraggableLatex;
