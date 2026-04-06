import { z } from "zod";
import { protectedProcedure, adminProcedure, router } from "../_core/trpc";

/**
 * Localization & Multi-Language Router
 * Supports Swahili, French, Amharic, Yoruba, Portuguese
 */

export const localizationRouter = router({
  /**
   * Get supported languages
   */
  getSupportedLanguages: protectedProcedure
    .query(async () => {
      try {
        const languages = [
          {
            code: "en",
            name: "English",
            nativeName: "English",
            region: "Global",
            speakers: "1.5B+",
            completeness: 100,
          },
          {
            code: "sw",
            name: "Swahili",
            nativeName: "Kiswahili",
            region: "Kenya, Tanzania, Uganda",
            speakers: "140M+",
            completeness: 95,
          },
          {
            code: "fr",
            name: "French",
            nativeName: "Français",
            region: "DRC, Cameroon, Senegal, Ivory Coast",
            speakers: "280M+",
            completeness: 92,
          },
          {
            code: "am",
            name: "Amharic",
            nativeName: "አማርኛ",
            region: "Ethiopia",
            speakers: "32M+",
            completeness: 88,
          },
          {
            code: "yo",
            name: "Yoruba",
            nativeName: "Yorùbá",
            region: "Nigeria",
            speakers: "45M+",
            completeness: 85,
          },
          {
            code: "pt",
            name: "Portuguese",
            nativeName: "Português",
            region: "Angola, Mozambique",
            speakers: "252M+",
            completeness: 80,
          },
        ];

        return {
          success: true,
          languages,
          totalLanguages: languages.length,
        };
      } catch (error: any) {
        console.error("Error getting supported languages:", error);
        return {
          success: false,
          error: error.message,
          languages: [],
        };
      }
    }),

  /**
   * Get translations for a specific language
   */
  getTranslations: protectedProcedure
    .input(
      z.object({
        languageCode: z.enum(["en", "sw", "fr", "am", "yo", "pt"]),
        namespace: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const translations = getLanguageTranslations(input.languageCode, input.namespace);

        return {
          success: true,
          languageCode: input.languageCode,
          translations,
        };
      } catch (error: any) {
        console.error("Error getting translations:", error);
        return {
          success: false,
          error: error.message,
        };
      }
    }),

  /**
   * Get localized course content
   */
  getLocalizedCourseContent: protectedProcedure
    .input(
      z.object({
        courseId: z.string(),
        languageCode: z.enum(["en", "sw", "fr", "am", "yo", "pt"]),
      })
    )
    .query(async ({ input }) => {
      try {
        const courseContent = {
          courseId: input.courseId,
          languageCode: input.languageCode,
          title: getLocalizedText("BLS Training", input.languageCode),
          description: getLocalizedText("Learn basic life support techniques", input.languageCode),
          modules: [
            {
              id: "module-1",
              title: getLocalizedText("Fundamentals of CPR", input.languageCode),
              lessons: [
                {
                  id: "lesson-1",
                  title: getLocalizedText("Chest Compressions", input.languageCode),
                  content: getLocalizedText("Proper technique for chest compressions", input.languageCode),
                  duration: 15,
                },
                {
                  id: "lesson-2",
                  title: getLocalizedText("Rescue Breathing", input.languageCode),
                  content: getLocalizedText("Techniques for rescue breathing", input.languageCode),
                  duration: 12,
                },
              ],
            },
          ],
          culturalAdaptations: getCulturalAdaptations(input.languageCode),
        };

        return {
          success: true,
          content: courseContent,
        };
      } catch (error: any) {
        console.error("Error getting localized course content:", error);
        return {
          success: false,
          error: error.message,
        };
      }
    }),

  /**
   * Get regional currency and payment information
   */
  getRegionalPaymentInfo: protectedProcedure
    .input(
      z.object({
        region: z.enum(["KE", "TZ", "UG", "DRC", "CM", "SN", "ET", "NG", "AO", "MZ"]),
      })
    )
    .query(async ({ input }) => {
      try {
        const regionalInfo: Record<string, any> = {
          KE: {
            country: "Kenya",
            currency: "KES",
            symbol: "Ksh",
            exchangeRate: 1,
            paymentMethods: ["M-Pesa", "Airtel Money", "Bank Transfer"],
            languages: ["en", "sw"],
            timezone: "EAT",
          },
          TZ: {
            country: "Tanzania",
            currency: "TZS",
            symbol: "TSh",
            exchangeRate: 25.5,
            paymentMethods: ["M-Pesa", "Vodacom Money", "Bank Transfer"],
            languages: ["en", "sw"],
            timezone: "EAT",
          },
          UG: {
            country: "Uganda",
            currency: "UGX",
            symbol: "USh",
            exchangeRate: 3850,
            paymentMethods: ["M-Pesa", "MTN Money", "Bank Transfer"],
            languages: ["en", "sw"],
            timezone: "EAT",
          },
          DRC: {
            country: "Democratic Republic of Congo",
            currency: "CDF",
            symbol: "FC",
            exchangeRate: 2800,
            paymentMethods: ["Bank Transfer", "Mobile Money"],
            languages: ["fr"],
            timezone: "WAT",
          },
          CM: {
            country: "Cameroon",
            currency: "XAF",
            symbol: "FCFA",
            exchangeRate: 655,
            paymentMethods: ["Bank Transfer", "Mobile Money"],
            languages: ["fr"],
            timezone: "WAT",
          },
          SN: {
            country: "Senegal",
            currency: "XOF",
            symbol: "CFA",
            exchangeRate: 655,
            paymentMethods: ["Bank Transfer", "Wave", "Orange Money"],
            languages: ["fr"],
            timezone: "GMT",
          },
          ET: {
            country: "Ethiopia",
            currency: "ETB",
            symbol: "Br",
            exchangeRate: 52,
            paymentMethods: ["Bank Transfer", "Mobile Money"],
            languages: ["am"],
            timezone: "EAT",
          },
          NG: {
            country: "Nigeria",
            currency: "NGN",
            symbol: "₦",
            exchangeRate: 1550,
            paymentMethods: ["Bank Transfer", "Flutterwave", "Paystack"],
            languages: ["en", "yo"],
            timezone: "WAT",
          },
          AO: {
            country: "Angola",
            currency: "AOA",
            symbol: "Kz",
            exchangeRate: 825,
            paymentMethods: ["Bank Transfer", "Mobile Money"],
            languages: ["pt"],
            timezone: "WAT",
          },
          MZ: {
            country: "Mozambique",
            currency: "MZN",
            symbol: "MT",
            exchangeRate: 64,
            paymentMethods: ["Bank Transfer", "Mobile Money"],
            languages: ["pt"],
            timezone: "CAT",
          },
        };

        const info = regionalInfo[input.region];

        return {
          success: true,
          region: input.region,
          ...info,
        };
      } catch (error: any) {
        console.error("Error getting regional payment info:", error);
        return {
          success: false,
          error: error.message,
        };
      }
    }),

  /**
   * Get localized compliance documentation
   */
  getLocalizedCompliance: adminProcedure
    .input(
      z.object({
        languageCode: z.enum(["en", "sw", "fr", "am", "yo", "pt"]),
        documentType: z.enum(["privacy", "terms", "gdpr", "hipaa"]),
      })
    )
    .query(async ({ input }) => {
      try {
        const complianceDocuments: Record<string, any> = {
          privacy: {
            title: getLocalizedText("Privacy Policy", input.languageCode),
            content: getLocalizedText("Our commitment to protecting your data...", input.languageCode),
            lastUpdated: new Date("2026-01-22"),
          },
          terms: {
            title: getLocalizedText("Terms of Service", input.languageCode),
            content: getLocalizedText("By using our platform, you agree to these terms...", input.languageCode),
            lastUpdated: new Date("2026-01-22"),
          },
          gdpr: {
            title: getLocalizedText("GDPR Compliance", input.languageCode),
            content: getLocalizedText("We comply with GDPR regulations...", input.languageCode),
            lastUpdated: new Date("2026-01-22"),
          },
          hipaa: {
            title: getLocalizedText("HIPAA Compliance", input.languageCode),
            content: getLocalizedText("We protect healthcare data according to HIPAA standards...", input.languageCode),
            lastUpdated: new Date("2026-01-22"),
          },
        };

        const document = complianceDocuments[input.documentType];

        return {
          success: true,
          languageCode: input.languageCode,
          documentType: input.documentType,
          document,
        };
      } catch (error: any) {
        console.error("Error getting localized compliance:", error);
        return {
          success: false,
          error: error.message,
        };
      }
    }),

  /**
   * Set user language preference
   */
  setUserLanguagePreference: protectedProcedure
    .input(
      z.object({
        languageCode: z.enum(["en", "sw", "fr", "am", "yo", "pt"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // In production, this would update user preferences in database
        console.log(`User ${ctx.user?.id} set language preference to ${input.languageCode}`);

        return {
          success: true,
          message: `Language preference set to ${input.languageCode}`,
        };
      } catch (error: any) {
        console.error("Error setting language preference:", error);
        return {
          success: false,
          error: error.message,
        };
      }
    }),

  /**
   * Get translation progress for all languages
   */
  getTranslationProgress: adminProcedure
    .query(async () => {
      try {
        const progress = [
          { language: "English", code: "en", completion: 100, segments: 2500, translated: 2500 },
          { language: "Swahili", code: "sw", completion: 95, segments: 2500, translated: 2375 },
          { language: "French", code: "fr", completion: 92, segments: 2500, translated: 2300 },
          { language: "Amharic", code: "am", completion: 88, segments: 2500, translated: 2200 },
          { language: "Yoruba", code: "yo", completion: 85, segments: 2500, translated: 2125 },
          { language: "Portuguese", code: "pt", completion: 80, segments: 2500, translated: 2000 },
        ];

        const averageCompletion = Math.round(progress.reduce((sum, p) => sum + p.completion, 0) / progress.length);

        return {
          success: true,
          progress,
          averageCompletion,
          totalSegments: 2500,
          nextLanguages: ["Arabic", "Hausa", "Igbo"],
        };
      } catch (error: any) {
        console.error("Error getting translation progress:", error);
        return {
          success: false,
          error: error.message,
        };
      }
    }),
});

/**
 * Helper function to get language-specific translations
 */
function getLanguageTranslations(languageCode: string, namespace?: string): Record<string, string> {
  const translations: Record<string, Record<string, string>> = {
    en: {
      welcome: "Welcome to Paeds Resus",
      enroll: "Enroll Now",
      courses: "Courses",
      dashboard: "Dashboard",
      logout: "Logout",
    },
    sw: {
      welcome: "Karibu kwenye Paeds Resus",
      enroll: "Jisajili Sasa",
      courses: "Kozi",
      dashboard: "Dashibodi",
      logout: "Toka",
    },
    fr: {
      welcome: "Bienvenue sur Paeds Resus",
      enroll: "S'inscrire Maintenant",
      courses: "Cours",
      dashboard: "Tableau de Bord",
      logout: "Déconnexion",
    },
    am: {
      welcome: "ወደ Paeds Resus እንኳን ደህና መጡ",
      enroll: "አሁን ይመዝገቡ",
      courses: "ኮርሶች",
      dashboard: "ዳሽቦርድ",
      logout: "ውጣ",
    },
    yo: {
      welcome: "Kaabo si Paeds Resus",
      enroll: "Forukọ Ni Bayi",
      courses: "Awọn Ẹkọ",
      dashboard: "Oja Iṣẹ",
      logout: "Jade",
    },
    pt: {
      welcome: "Bem-vindo ao Paeds Resus",
      enroll: "Inscreva-se Agora",
      courses: "Cursos",
      dashboard: "Painel",
      logout: "Sair",
    },
  };

  return translations[languageCode] || translations.en;
}

/**
 * Helper function to get localized text
 */
function getLocalizedText(text: string, languageCode: string): string {
  // In production, this would use a proper translation service
  const translations: Record<string, Record<string, string>> = {
    sw: {
      "BLS Training": "Mafunzo ya BLS",
      "Learn basic life support techniques": "Jifunze mbinu za msaada wa maisha ya msingi",
      "Fundamentals of CPR": "Misingi ya CPR",
      "Chest Compressions": "Ukandamizaji wa Kifua",
      "Proper technique for chest compressions": "Mbinu sahihi ya ukandamizaji wa kifua",
      "Rescue Breathing": "Kupumua Kwa Kumwokoa",
      "Techniques for rescue breathing": "Mbinu za kupumua kwa kumwokoa",
    },
    fr: {
      "BLS Training": "Formation RCP",
      "Learn basic life support techniques": "Apprenez les techniques de réanimation cardiopulmonaire de base",
      "Fundamentals of CPR": "Principes fondamentaux de la RCP",
      "Chest Compressions": "Compressions Thoraciques",
      "Proper technique for chest compressions": "Technique appropriée pour les compressions thoraciques",
      "Rescue Breathing": "Respiration de Sauvetage",
      "Techniques for rescue breathing": "Techniques de respiration de sauvetage",
    },
  };

  return translations[languageCode]?.[text] || text;
}

/**
 * Helper function to get cultural adaptations for a language
 */
function getCulturalAdaptations(languageCode: string): Record<string, any> {
  const adaptations: Record<string, any> = {
    sw: {
      scenarioContext: "East African healthcare settings",
      commonConditions: ["Malaria", "Respiratory infections", "Malnutrition"],
      culturalConsiderations: ["Family-centered care", "Community involvement"],
    },
    fr: {
      scenarioContext: "Central and West African healthcare settings",
      commonConditions: ["Ebola", "Malaria", "Respiratory infections"],
      culturalConsiderations: ["Community health workers", "Traditional medicine integration"],
    },
    am: {
      scenarioContext: "Ethiopian healthcare settings",
      commonConditions: ["Malaria", "Tuberculosis", "Malnutrition"],
      culturalConsiderations: ["Community health extension workers", "Pastoral care"],
    },
    yo: {
      scenarioContext: "West African healthcare settings",
      commonConditions: ["Malaria", "Sickle cell disease", "Respiratory infections"],
      culturalConsiderations: ["Family involvement", "Community leaders"],
    },
    pt: {
      scenarioContext: "Southern African healthcare settings",
      commonConditions: ["HIV/AIDS complications", "Malaria", "Tuberculosis"],
      culturalConsiderations: ["Community health workers", "Traditional healers"],
    },
  };

  return adaptations[languageCode] || {};
}
