import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { skillGapApi, type SkillGapAnalysisRequest, type SkillGapAnalysisResponse } from "~/lib/api";

export function useAnalyzeSkillGaps(): UseMutationResult<SkillGapAnalysisResponse, Error, SkillGapAnalysisRequest> {
  return useMutation({
    mutationFn: (data: SkillGapAnalysisRequest) => skillGapApi.analyze(data),
  });
}

