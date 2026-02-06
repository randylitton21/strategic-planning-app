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
        { kind: "global", key: "contingencyPlanData" },
        { kind: "global", key: "contingencyPlanMetadata" },
        { kind: "global", key: "contingencyCategoryData" },
      ]}
    />
    </RequireAuth>
  );
}

