import { useMutation } from "@tanstack/react-query";
import { refactorApi, type RefactorDataRequest } from "~/lib/api";

export function useRefactorData() {
  return useMutation({
    mutationFn: (data: RefactorDataRequest) => refactorApi.refactorData(data),
  });
}
