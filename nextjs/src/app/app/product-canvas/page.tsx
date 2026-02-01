import CloudToolFrame from "../_components/CloudToolFrame";
import RequireAuth from "../_components/RequireAuth";

export default function ProductCanvasTool() {
  return (
    <RequireAuth>
      <CloudToolFrame
      toolId="product_canvas"
      title="Product Canvas"
      iframeSrc="/legacy/product_canvas_prototype.html"
      storageKeys={[{ kind: "uid", prefix: "productCanvasData_" }]}
    />
    </RequireAuth>
  );
}

