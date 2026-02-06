import CloudToolFrame from "../_components/CloudToolFrame";

export default function PortersFiveForcesTool() {
  return (
    <CloudToolFrame
      toolId="porters_five_forces"
      title="Porter's Five Forces"
      iframeSrc="/legacy/porters_five_forces_prototype.html"
      storageKeys={[{ kind: "uid", prefix: "portersFiveForcesData_" }]}
    />
  );
}
