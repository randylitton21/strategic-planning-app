import CloudToolFrame from "../_components/CloudToolFrame";
import RequireAuth from "../_components/RequireAuth";

export default function FinancialReportTool() {
  return (
    <RequireAuth>
      <CloudToolFrame
      toolId="financial_report"
      title="Personal Financial Report"
      iframeSrc="/legacy/financial_report_prototype.html"
      storageKeys={[{ kind: "global", key: "financialReportData" }]}
    />
    </RequireAuth>
  );
}

