import type { Route } from "./+types/formations";
import { FormationDesigner } from "../features/playbook/FormationDesigner";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Diseñador de Formaciones" },
    {
      name: "description",
      content:
        "Crea tus formaciones ofensivas o defensivas de football americano y flag moviendo a los jugadores libremente.",
    },
  ];
}

export default function FormationsRoute() {
  return <FormationDesigner />;
}

