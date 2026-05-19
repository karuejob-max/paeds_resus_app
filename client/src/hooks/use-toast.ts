import { toast as sonnerToast } from "sonner";

type ToastInput = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
};

export function toast(input: ToastInput) {
  const message = input.title ?? input.description ?? "";
  const description =
    input.title && input.description ? input.description : undefined;

  if (input.variant === "destructive") {
    return sonnerToast.error(message, { description });
  }

  return sonnerToast(message, { description });
}

export function useToast() {
  return {
    toast,
    dismiss: sonnerToast.dismiss,
  };
}
