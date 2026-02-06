import CloudToolFrame from "../_components/CloudToolFrame";
import RequireAuth from "../_components/RequireAuth";

export default function StrategicActionPlanTool() {
  return (
    <RequireAuth>
      <CloudToolFrame
      toolId="strategic_action_plan"
      title="Strategic Action Plan"
      iframeSrc="/legacy/strategic_action_plan_prototype.html"
      storageKeys={[{ kind: "global", key: "strategicActionPlanData" }]}
    />
    </RequireAuth>
  );
}

