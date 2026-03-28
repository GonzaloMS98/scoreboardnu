export const TEAMS = [
  { id: "t1", name: "Azul bajito", color: "#22D3EE" },
  { id: "t2", name: "Verde", color: "#22C55E" },
  { id: "t3", name: "Amarillo", color: "#EAB308" },
  { id: "t4", name: "Azul", color: "#3B82F6" },
  { id: "t5", name: "Rojo", color: "#EF4444" },
  { id: "t6", name: "Negro", color: "#171717" },
  { id: "t7", name: "Morado", color: "#8B5CF6" },
  { id: "t8", name: "Naranja", color: "#F97316" },
  { id: "t9", name: "Blanco", color: "#FFFFFF" },
  { id: "t10", name: "Verde Bandera", color: "#0a2d0dff" },
];

export const STAGES = [
  { id: "noche", name: "Rally Nocturno" },
  { id: "manana", name: "Rally Mañanero" },
];

// Games for night rally (Rally Nocturno)
export const BASES_NOCHE = [
  { id: "b1", name: "Boomerang", area: "" },
  { id: "b2", name: "Torre de bombones", area: "" },
  { id: "b3", name: "Vaso centrifugo", area: "" },
  { id: "b4", name: "pelota escondida", area: "" },
  { id: "b5", name: "bota pin pon", area: "" },
  { id: "b6", name: "atrapa globos", area: "" },
  { id: "b7", name: "laberinto con pelota", area: "" },
  { id: "b8", name: "tira bote", area: "" },
  { id: "b9", name: "caras y gestos", area: "" },
  { id: "b10", name: "Preguntas y respuesta", area: "" },
];

// Games for morning rally (Rally Mañanero)
export const BASES_MANANA = [
  { id: "b1", name: "cubreboca resortera", area: "" },
  { id: "b2", name: "Piedra papel o tijera aros", area: "" },
  { id: "b3", name: "Rolling rolling", area: "" },
  { id: "b4", name: "Voley Splash", area: "" },
  { id: "b5", name: "3 n 1", area: "" },
];

// Helper function to get bases by stage
export function getBasesByStage(stageId: string) {
  if (stageId === "noche") return BASES_NOCHE;
  if (stageId === "manana") return BASES_MANANA;
  return BASES_NOCHE; // default
}

// Legacy export for backwards compatibility
export const BASES = BASES_NOCHE;
