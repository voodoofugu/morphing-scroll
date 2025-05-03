import { useRef } from "react";

let idCounter = 1;

export default function useIdent() {
  const idRef = useRef<string | null>(null);

  if (idRef.current === null) {
    idRef.current = `${idCounter++}`;
  }

  return idRef.current;
}
