import { useMutation } from "@tanstack/react-query";
import { refactorApi, type RefactorRequest } from "~/lib/api";

export function useRefactor() {
  return useMutation({
    mutationFn: (data: RefactorRequest) => refactorApi.refactor(data),
  });
}
