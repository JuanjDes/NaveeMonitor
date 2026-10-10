const URL_RELEASE_DELAY_MS = 1000;

export function downloadReport(report, documentObject = document, urlApi = URL) {
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json;charset=utf-8" });
  const url = urlApi.createObjectURL(blob);
  const anchor = documentObject.createElement("a");
  try {
    anchor.href = url;
    anchor.download = "navee-gatt-report.json";
    documentObject.body.append(anchor);
    anchor.click();
  } finally {
    anchor.remove();
    setTimeout(() => urlApi.revokeObjectURL(url), URL_RELEASE_DELAY_MS);
  }
}
