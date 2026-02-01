import CloudToolFrame from "../_components/CloudToolFrame";

export default function StrategicPlanningTool() {
  return (
    <CloudToolFrame
      toolId="strategic_planning"
      title="Strategic Planning Guide"
      iframeSrc="/legacy/main_app_prototype.html"
      storageKeys={[
        { kind: "uid", prefix: "prototype_strategicPlan_" },
        { kind: "uid", prefix: "goalSetting_savedGoals_" },
      ]}
    />
  );
}

