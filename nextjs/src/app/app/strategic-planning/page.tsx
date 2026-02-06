import CloudToolFrame from "../_components/CloudToolFrame";

export default function StrategicPlanningTool() {
  return (
    <CloudToolFrame
      toolId="strategic_planning"
      title="Strategic Planning Guide"
      iframeSrc="/legacy/main_app_prototype.html"
      storageKeys={[
        { kind: "global", key: "prototype_strategicPlan" },
        { kind: "global", key: "goalSetting_savedGoals" },
      ]}
    />
  );
}

