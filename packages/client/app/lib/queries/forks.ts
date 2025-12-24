import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { forksApi, type CreateForkInput, type UpdateForkInput } from "~/lib/api";

export const forkKeys = {
  all: ["forks"] as const,
  lists: () => [...forkKeys.all, "list"] as const,
  list: (filters?: Record<string, unknown>) => [...forkKeys.lists(), filters] as const,
  details: () => [...forkKeys.all, "detail"] as const,
  detail: (id: string) => [...forkKeys.details(), id] as const,
};

export function useForks() {
  return useQuery({
    queryKey: forkKeys.list(),
    queryFn: forksApi.list,
  });
}

export function useFork(id: string) {
  return useQuery({
    queryKey: forkKeys.detail(id),
    queryFn: () => forksApi.get(id),
    enabled: !!id,
  });
}

export function useCreateFork() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateForkInput) => forksApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: forkKeys.lists() });
    },
  });
}

export function useUpdateFork() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateForkInput }) =>
      forksApi.update(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(forkKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: forkKeys.lists() });
    },
  });
}

export function useDeleteFork() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => forksApi.delete(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: forkKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: forkKeys.lists() });
    },
  });
}

