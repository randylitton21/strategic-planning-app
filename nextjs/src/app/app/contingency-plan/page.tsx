import CloudToolFrame from "../_components/CloudToolFrame";

export default function ContingencyPlanTool() {
  return (
    <CloudToolFrame
      toolId="contingency_plan"
      title="Contingency Plan"
      iframeSrc="/legacy/contingency_plan_prototype.html"
      storageKeys={[
        { kind: "uid", prefix: "contingencyCategoryData_" },
        { kind: "uid", prefix: "contingencyPlanData_" },
        { kind: "uid", prefix: "contingencyPlanMetadata_" },
      ]}
    />
  );
}
