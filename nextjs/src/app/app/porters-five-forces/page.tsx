import CloudToolFrame from "../_components/CloudToolFrame";
import RequireAuth from "../_components/RequireAuth";

export default function PortersFiveForcesTool() {
  return (
    <RequireAuth>
      <CloudToolFrame
      toolId="porters_five_forces"
      title="Porter’s Five Forces"
      iframeSrc="/legacy/porters_five_forces_prototype.html"
      storageKeys={[{ kind: "global", key: "portersFiveForcesData" }]}
    />
    </RequireAuth>
  );
}

