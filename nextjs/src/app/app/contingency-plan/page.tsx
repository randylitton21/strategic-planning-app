import CloudToolFrame from "../_components/CloudToolFrame";
import RequireAuth from "../_components/RequireAuth";

export default function ContingencyPlanTool() {
  return (
    <RequireAuth>
      <CloudToolFrame
      toolId="contingency_plan"
      title="Contingency Plan"
      iframeSrc="/legacy/contingency_plan_prototype.html"
      storageKeys={[
        { kind: "uid", prefix: "contingencyPlanData_" },
        { kind: "uid", prefix: "contingencyPlanMetadata_" },
        { kind: "uid", prefix: "contingencyCategoryData_" },
      ]}
    />
    </RequireAuth>
  );
}

