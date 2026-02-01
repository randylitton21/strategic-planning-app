import CloudToolFrame from "../_components/CloudToolFrame";

export default function ProductCanvasTool() {
  return (
    <CloudToolFrame
      toolId="product_canvas"
      title="Product Canvas"
      iframeSrc="/legacy/product_canvas_prototype.html"
      storageKeys={[{ kind: "uid", prefix: "productCanvasData_" }]}
    />
  );
}

