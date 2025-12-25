import { useQuery, useMutation, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { resumeApi, type UpdateResumeData, type ResumeData } from "~/lib/api";

export const resumeKeys = {
  all: ["resume"] as const,
  master: () => [...resumeKeys.all, "master", "data"] as const,
};

export function useMasterResumeData(): UseQueryResult<ResumeData | null> {
  return useQuery({
    queryKey: resumeKeys.master(),
    queryFn: resumeApi.getMasterData,
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });
}

export function useUpdateMasterResumeData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateResumeData) => resumeApi.updateMasterData(data),
    onSuccess: (data) => {
      queryClient.setQueryData(resumeKeys.master(), data);
    },
  });
}

