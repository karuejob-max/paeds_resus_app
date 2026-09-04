import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import CadreProgressiveSelector from "@/components/CadreProgressiveSelector";
import { Badge } from "@/components/ui/badge";
import { BriefcaseBusiness, Loader2 } from "lucide-react";

export function ProfessionalIdentityCard() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const providerProfileQuery = trpc.provider.getProfile.useQuery();
  const [cadre, setCadre] = useState("");
  const [cadreOther, setCadreOther] = useState("");
  const [customOther, setCustomOther] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [additionalRoles, setAdditionalRoles] = useState("");
  const providerRolesQuery = trpc.provider.listProfessionalRoles.useQuery();
  const addRoleMutation = trpc.provider.addProfessionalRole.useMutation();
  const [message, setMessage] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (!user) return;
    const currentCadre = (user as { cadre?: string | null }).cadre ?? "";
    const currentCadreOther =
      (user as { cadreOther?: string | null }).cadreOther ?? "";
    setCadre(currentCadre);
    setCadreOther(currentCadreOther);
    setCustomOther(
      ["Other Staff", "Other Intern", "Other Student"].includes(currentCadre)
        ? currentCadreOther
        : ""
    );
  }, [user]);

  useEffect(() => {
    setSpecialization(providerProfileQuery.data?.specialization ?? "");
  }, [providerProfileQuery.data?.specialization]);

  useEffect(() => {
    const secondary = (providerRolesQuery.data ?? [])
      .filter(role => role.cadre !== cadre)
      .map(role => role.cadreOther ? `${role.cadre}: ${role.cadreOther}` : role.cadre)
      .join(", ");
    setAdditionalRoles(secondary);
  }, [providerRolesQuery.data, cadre]);

  const updateProviderProfile = trpc.provider.updateProfile.useMutation();

  const updateProfile = trpc.auth.updateMyProfile.useMutation({
    onSuccess: async () => {
      setMessage({ type: "ok", text: "Professional identity saved." });
      await utils.auth.me.invalidate();
      await utils.provider.getProfile.invalidate();
    },
    onError: error => setMessage({ type: "err", text: error.message }),
  });

  const save = async () => {
    setMessage(null);
    const finalCadreOther = [
      "Other Staff",
      "Other Intern",
      "Other Student",
    ].includes(cadre)
      ? customOther
      : cadreOther === "Other"
        ? customOther
        : cadreOther;
    const phone = user?.phone?.trim() ?? "";
    const phoneMode = phone.startsWith("+254") ? "ke" : "intl";
    const phoneValue = phone.startsWith("+254") ? phone.slice(4) : phone;
    try {
      await updateProfile.mutateAsync({
        name: user?.name?.trim() || "Provider",
        phoneMode,
        phoneValue,
        cadre: cadre || null,
        cadreOther: finalCadreOther || null,
      });
      await updateProviderProfile.mutateAsync({ specialization: specialization.trim() });
      const existingRoles = new Set((providerRolesQuery.data ?? []).map(role => role.cadre.toLowerCase()));
      const requestedRoles = additionalRoles.split(",").map(role => role.trim()).filter(Boolean);
      for (const role of requestedRoles) {
        const [roleCadre, roleOther] = role.split(/:\s*/, 2);
        if (!roleCadre || roleCadre.toLowerCase() === cadre.trim().toLowerCase() || existingRoles.has(roleCadre.toLowerCase())) continue;
        await addRoleMutation.mutateAsync({ cadre: roleCadre, cadreOther: roleOther?.trim() || null, specialization: specialization.trim() || null });
      }
      await utils.provider.listProfessionalRoles.invalidate();
      setMessage({ type: "ok", text: "Professional identity saved." });
      await utils.provider.getProfile.invalidate();
    } catch (error) {
      setMessage({ type: "err", text: error instanceof Error ? error.message : "Could not save professional identity." });
    }
  };

  return (
    <Card className="border-teal-200 bg-teal-50/30 dark:border-teal-900/50 dark:bg-teal-950/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BriefcaseBusiness className="h-5 w-5 text-teal-700" /> Professional
          identity
        </CardTitle>
        <CardDescription>
          Cadre and specialty describe your professional identity. They help the
          platform match you to the right learning, facility, and institutional
          workflows; they do not grant operational duty access. You can change any saved selection or use the clear button to restart the category, role, qualification, or specialty path if it was entered incorrectly.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {message ? (
          <p
            className={`text-sm ${message.type === "ok" ? "text-emerald-700" : "text-destructive"}`}
          >
            {message.text}
          </p>
        ) : null}
        <div className="rounded-lg border bg-background/70 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-sm font-medium">Current cadre</p>
            <Badge variant={cadre ? "default" : "secondary"}>
              {cadre || "Not set"}
            </Badge>
          </div>
          <CadreProgressiveSelector
            value={cadre}
            onChange={setCadre}
            cadreOtherValue={customOther}
            onCadreOtherChange={setCustomOther}
            subSpecialtyValue={cadreOther}
            onSubSpecialtyChange={setCadreOther}
          />
        </div>
        <div className="space-y-2 rounded-lg border bg-background/70 p-3">
          <Label htmlFor="professional-specialization">Specialization</Label>
          <Input
            id="professional-specialization"
            value={specialization}
            onChange={(event) => setSpecialization(event.target.value)}
            placeholder="e.g. Paediatrics, Emergency Medicine, Neonatology"
          />
          <p className="text-xs text-muted-foreground">Add your main clinical or professional area. This is part of profile completion and can be changed later.</p>
        </div>
        <div className="space-y-2 rounded-lg border bg-background/70 p-3">
          <Label htmlFor="professional-additional-roles">Additional roles or cadres</Label>
          <Input
            id="professional-additional-roles"
            value={additionalRoles}
            onChange={(event) => setAdditionalRoles(event.target.value)}
            placeholder="e.g. Nurse, Facility owner"
          />
          <p className="text-xs text-muted-foreground">Separate roles with commas. Your current primary cadre remains unchanged; additional roles are stored separately and can support multiple professional contexts.</p>
          {providerRolesQuery.data?.length ? (
            <div className="flex flex-wrap gap-2">{providerRolesQuery.data.map(role => <Badge key={role.id} variant={role.cadre === cadre ? "default" : "secondary"}>{role.cadreOther ? `${role.cadre}: ${role.cadreOther}` : role.cadre}</Badge>)}</div>
          ) : null}
        </div>
        <Button type="button" onClick={save} disabled={updateProfile.isPending || updateProviderProfile.isPending}>
          {updateProfile.isPending || updateProviderProfile.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Save professional identity
        </Button>
      </CardContent>
    </Card>
  );
}
