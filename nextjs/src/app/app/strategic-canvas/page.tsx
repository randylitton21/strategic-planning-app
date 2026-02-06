import CloudToolFrame from "../_components/CloudToolFrame";

export default function StrategicCanvasTool() {
  return (
    <CloudToolFrame
      toolId="strategic_canvas"
      title="Strategic Canvas"
      iframeSrc="/legacy/strategic_canvas_prototype.html"
      storageKeys={[{ kind: "uid", prefix: "strategicCanvasData_" }]}
    />
  );
}
