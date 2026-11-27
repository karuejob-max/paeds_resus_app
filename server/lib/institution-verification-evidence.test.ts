import { describe, expect, it } from "vitest";
import { decodeEvidenceFile } from "./institution-verification-evidence";

const b64 = (bytes: number[] | string) => Buffer.from(typeof bytes === "string" ? bytes : Buffer.from(bytes)).toString("base64");

describe("decodeEvidenceFile", () => {
  it("accepts a PDF, JPEG and PNG whose first bytes match", () => {
    expect(decodeEvidenceFile({ base64: b64("%PDF-1.4 test"), fileName: "licence.pdf", contentType: "application/pdf" }).safeName).toBe("licence.pdf");
    expect(() => decodeEvidenceFile({ base64: b64([0xff, 0xd8, 0xff, 0xe0, 1, 2]), fileName: "a.jpg", contentType: "image/jpeg" })).not.toThrow();
    expect(() => decodeEvidenceFile({ base64: `data:image/png;base64,${b64([0x89, 0x50, 0x4e, 0x47, 0, 0])}`, fileName: "a.png", contentType: "image/png" })).not.toThrow();
  });

  it("refuses other types, empty files, oversize files and renamed files", () => {
    expect(() => decodeEvidenceFile({ base64: b64("hello"), fileName: "a.exe", contentType: "application/x-msdownload" })).toThrow(/PDF, JPG, PNG/);
    expect(() => decodeEvidenceFile({ base64: "", fileName: "a.pdf", contentType: "application/pdf" })).toThrow(/empty/);
    expect(() => decodeEvidenceFile({ base64: b64("not a pdf at all"), fileName: "a.pdf", contentType: "application/pdf" })).toThrow(/valid PDF/);
    const big = Buffer.concat([Buffer.from("%PDF-"), Buffer.alloc(5 * 1024 * 1024)]).toString("base64");
    expect(() => decodeEvidenceFile({ base64: big, fileName: "a.pdf", contentType: "application/pdf" })).toThrow(/5 MB/);
  });

  it("cleans the file name", () => {
    expect(decodeEvidenceFile({ base64: b64("%PDF-1"), fileName: "../my licence (1).pdf", contentType: "application/pdf" }).safeName).toBe(".._my_licence__1_.pdf");
  });
});
