import { format } from "date-fns";
import { appDataSchema, type AppData } from "@/domain/types";

export type ExportPayload = AppData & {
  exportedAt: string;
};

export function getExportableData(raw: unknown): AppData {
  return appDataSchema.parse(raw);
}

export function createExportPayload(data: AppData): ExportPayload {
  return {
    ...data,
    exportedAt: new Date().toISOString(),
  };
}

export function createExportBlob(payload: ExportPayload) {
  return new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json;charset=utf-8",
  });
}

export function buildExportFileName(profileName: string) {
  const safeName = profileName.replace(/\s+/g, "-").replace(/[^\w\-]/g, "").toLowerCase() || "track-me";
  const stamp = format(new Date(), "yyyyMMdd-HHmm");
  return `${safeName}-backup-${stamp}.json`;
}

export async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => {
      reader.abort();
      reject(new Error("تعذّر قراءة الملف."));
    };
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.readAsText(file, "utf-8");
  });
}

export function parseImportPayload(raw: string): AppData {
  const parsed = JSON.parse(raw);
  // دعم الصيغة القديمة التي قد تحتوي على مفتاح data
  const candidate = parsed?.version ? parsed : parsed?.data ?? parsed;
  return appDataSchema.parse(candidate);
}
