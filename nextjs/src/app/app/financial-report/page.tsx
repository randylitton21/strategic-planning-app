import CloudToolFrame from "../_components/CloudToolFrame";

export default function FinancialReportTool() {
  return (
    <CloudToolFrame
      toolId="financial_report"
      title="Personal Financial Report"
      iframeSrc="/legacy/financial_report_prototype.html"
      storageKeys={[{ kind: "global", key: "financialReportData" }]}
    />
  );
}
