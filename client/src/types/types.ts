export interface Response{
    expr:string,
    result:string,
    assign:boolean // = operator
}

export interface GeneratedResult{
    expr:string,
    answer:string,
}

export interface DraggableLatexProps {
  latex: string;
  defaultPosition: { x: number; y: number };
  onStop: (pos: { x: number; y: number }) => void;
}