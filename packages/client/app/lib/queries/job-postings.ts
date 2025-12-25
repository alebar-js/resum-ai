import { useQuery, useMutation, useQueryClient, type UseQueryResult, type UseMutationResult } from "@tanstack/react-query";
import { jobPostingsApi, type CreateJobPostingData, type UpdateJobPostingData, type JobPostingData } from "~/lib/api";

export const jobPostingKeys = {
  all: ["job-postings"] as const,
  lists: () => [...jobPostingKeys.all, "list"] as const,
  list: (filters?: Record<string, unknown>) => [...jobPostingKeys.lists(), filters] as const,
  details: () => [...jobPostingKeys.all, "detail"] as const,
  detail: (id: string) => [...jobPostingKeys.details(), id] as const,
};

export function useJobPostings(): UseQueryResult<JobPostingData[]> {
  return useQuery({
    queryKey: jobPostingKeys.list(),
    queryFn: jobPostingsApi.list,
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });
}

export function useJobPosting(id: string | null | undefined): UseQueryResult<JobPostingData> {
  const enabled = !!id && typeof id === 'string' && id.trim() !== "";
  
  return useQuery({
    queryKey: enabled ? jobPostingKeys.detail(id) : ['job-postings', 'detail', 'disabled'],
    queryFn: () => jobPostingsApi.get(id!),
    enabled,
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds - prevents refetch if data is fresh
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus to reduce duplicate requests
  });
}

export function useCreateJobPosting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateJobPostingData) => jobPostingsApi.create(data),
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
      // Optimistically update the cache without refetching
      queryClient.setQueryData(jobPostingKeys.detail(data.id), data);
      // Only invalidate the list, not the detail query (we just updated it)
      queryClient.invalidateQueries({ 
        queryKey: jobPostingKeys.lists(),
        refetchType: 'none' // Don't refetch, just mark as stale
      });
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

// Alias hooks for backward compatibility (using same implementation)
export const useJobPostingsData = useJobPostings;
export const useJobPostingData = useJobPosting;
export const useCreateJobPostingData = useCreateJobPosting;
export const useUpdateJobPostingData = useUpdateJobPosting;

