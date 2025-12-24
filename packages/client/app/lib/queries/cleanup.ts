import { useMutation } from "@tanstack/react-query";
import { cleanupApi, type CleanupRequest } from "~/lib/api";

export function useCleanup() {
  return useMutation({
    mutationFn: (data: CleanupRequest) => cleanupApi.cleanup(data),
  });
}

