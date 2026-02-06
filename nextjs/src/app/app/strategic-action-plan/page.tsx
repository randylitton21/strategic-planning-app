import CloudToolFrame from "../_components/CloudToolFrame";

export default function StrategicActionPlanTool() {
  return (
    <CloudToolFrame
      toolId="strategic_action_plan"
      title="Strategic Action Plan"
      iframeSrc="/legacy/strategic_action_plan_prototype.html"
      storageKeys={[
        { kind: "uid", prefix: "strategicActionPlanData_" },
        { kind: "uid", prefix: "goalSetting_savedGoals_" },
      ]}
    />
  );
}
