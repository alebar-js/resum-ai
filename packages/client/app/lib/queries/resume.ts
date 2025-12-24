import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { resumeApi } from "~/lib/api";

export const resumeKeys = {
  all: ["resume"] as const,
  master: () => [...resumeKeys.all, "master"] as const,
};

export function useMasterResume() {
  return useQuery({
    queryKey: resumeKeys.master(),
    queryFn: resumeApi.getMaster,
  });
}

export function useUpdateMasterResume() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) => resumeApi.updateMaster(content),
    onSuccess: (data) => {
      queryClient.setQueryData(resumeKeys.master(), data);
    },
  });
}

