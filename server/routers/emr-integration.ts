import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";

/**
 * EMR interoperability boundary.
 *
 * The platform does not currently have a live OpenMRS/Bahmni/Epic/Cerner,
 * DHIS2, or SORMAS connector. This router must not fabricate active
 * integrations, patient records, sync counts, or FHIR resources.
 */

const unavailable = () => {
  throw new TRPCError({
    code: "NOT_IMPLEMENTED",
    message:
      "EMR integration is not connected in this deployment. No patient data was read or written.",
  });
};

export const emrIntegrationRouter = router({
  getSupportedEMRSystems: protectedProcedure.query(() => ({
    success: true as const,
    systems: ["openmrs", "bahmni", "epic", "cerner", "dhis2", "sormas"].map(
      name => ({
        name,
        status: "not_configured" as const,
        dataSync: "unavailable" as const,
        supportedFeatures: [],
      })
    ),
    totalSystems: 6,
  })),

  configureEMRIntegration: adminProcedure
    .input(
      z.object({
        institutionId: z.number(),
        emrSystem: z.enum([
          "openmrs",
          "bahmni",
          "epic",
          "cerner",
          "dhis2",
          "sormas",
        ]),
        apiEndpoint: z.string().url(),
        apiKey: z.string(),
        dataSync: z.enum(["real-time", "hourly", "daily"]),
        encryptionEnabled: z.boolean().default(true),
      })
    )
    .mutation(() => unavailable()),

  syncPatientDataFromEMR: adminProcedure
    .input(
      z.object({
        institutionId: z.number(),
        patientId: z.string().optional(),
        dateRange: z.object({ start: z.date(), end: z.date() }).optional(),
      })
    )
    .mutation(() => unavailable()),

  getFHIRPatient: protectedProcedure
    .input(z.object({ patientId: z.string() }))
    .query(() => unavailable()),

  getFHIREncounter: protectedProcedure
    .input(z.object({ encounterId: z.string() }))
    .query(() => unavailable()),

  parseHL7Message: adminProcedure
    .input(z.object({ message: z.string(), messageType: z.string() }))
    .mutation(() => unavailable()),

  getDataMappingConfig: adminProcedure
    .input(z.object({ emrSystem: z.string() }))
    .query(() => unavailable()),

  getDataSyncStatus: adminProcedure
    .input(z.object({ institutionId: z.number() }))
    .query(() => unavailable()),

  getDataAccessAudit: adminProcedure
    .input(
      z.object({
        institutionId: z.number(),
        dateRange: z.object({ start: z.date(), end: z.date() }).optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(() => unavailable()),
});
