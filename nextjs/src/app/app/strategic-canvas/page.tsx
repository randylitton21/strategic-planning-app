import CloudToolFrame from "../_components/CloudToolFrame";
import RequireAuth from "../_components/RequireAuth";

export default function StrategicCanvasTool() {
  return (
    <RequireAuth>
      <CloudToolFrame
      toolId="strategic_canvas"
      title="Strategic Canvas"
      iframeSrc="/legacy/strategic_canvas_prototype.html"
      storageKeys={[{ kind: "uid", prefix: "strategicCanvasData_" }]}
    />
    </RequireAuth>
  );
}

