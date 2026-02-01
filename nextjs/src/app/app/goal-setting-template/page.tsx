import CloudToolFrame from "../_components/CloudToolFrame";
import RequireAuth from "../_components/RequireAuth";

export default function GoalSettingTemplateTool() {
  return (
    <RequireAuth>
      <CloudToolFrame
      toolId="goal_setting_template"
      title="Goal Setting Template"
      iframeSrc="/legacy/goal_setting_template_prototype.html"
      storageKeys={[
        { kind: "uid", prefix: "goalSettingTemplateData_" },
        { kind: "uid", prefix: "goalSetting_savedGoals_" },
      ]}
    />
    </RequireAuth>
  );
}

