import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { jobPostingsApi, type CreateJobPostingData, type UpdateJobPostingData } from "~/lib/api";

export const jobPostingKeys = {
  all: ["job-postings"] as const,
  lists: () => [...jobPostingKeys.all, "list"] as const,
  list: (filters?: Record<string, unknown>) => [...jobPostingKeys.lists(), filters] as const,
  details: () => [...jobPostingKeys.all, "detail"] as const,
  detail: (id: string) => [...jobPostingKeys.details(), id] as const,
};

export function useJobPostings() {
  return useQuery({
    queryKey: jobPostingKeys.list(),
    queryFn: jobPostingsApi.list,
  });
}

export function useJobPosting(id: string) {
  return useQuery({
    queryKey: jobPostingKeys.detail(id),
    queryFn: () => jobPostingsApi.get(id),
    enabled: !!id,
  });
}

export function useCreateJobPosting() {
  const queryClient = useQueryClient();

  return useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobPostingKeys.lists() });
    },
  });
}

export function useUpdateJobPosting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateJobPostingData }) =>
      jobPostingsApi.update(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(jobPostingKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: jobPostingKeys.lists() });
    },
  });
}

export function useDeleteJobPosting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => jobPostingsApi.delete(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: jobPostingKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: jobPostingKeys.lists() });
    },
  });
}

