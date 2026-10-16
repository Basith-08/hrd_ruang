export interface InterviewEvaluationField {
  labelKey: string
  descriptionKey: string
}

export interface InterviewEvaluationRecommendationOption {
  code: string
  labelKey: string
}

export interface InterviewEvaluationCriterion {
  number: number
  titleKey: string
  descriptionKey: string
  noteKey?: string
}

export const interviewEvaluationHeaderFields: InterviewEvaluationField[] = [
  {
    labelKey: "interviewEvaluations.page.fields.candidateName",
    descriptionKey: "interviewEvaluations.headerFields.candidateName",
  },
  {
    labelKey: "interviewEvaluations.page.fields.appliedPosition",
    descriptionKey: "interviewEvaluations.headerFields.appliedPosition",
  },
  {
    labelKey: "interviewEvaluations.page.fields.interviewerName",
    descriptionKey: "interviewEvaluations.headerFields.interviewerName",
  },
  {
    labelKey: "interviewEvaluations.headerFields.dayDate.label",
    descriptionKey: "interviewEvaluations.headerFields.dayDate",
  },
  {
    labelKey: "interviewEvaluations.page.fields.comments",
    descriptionKey: "interviewEvaluations.headerFields.comments",
  },
  {
    labelKey: "interviewEvaluations.headerFields.interviewer.label",
    descriptionKey: "interviewEvaluations.headerFields.interviewer",
  },
]

export const interviewEvaluationRecommendationOptions: InterviewEvaluationRecommendationOption[] = [
  {
    code: "continue_recruitment",
    labelKey: "interviewEvaluations.recommendations.continueRecruitment",
  },
  {
    code: "find_comparison_candidate",
    labelKey: "interviewEvaluations.recommendations.findComparisonCandidate",
  },
  {
    code: "stop_recruitment",
    labelKey: "interviewEvaluations.recommendations.stopRecruitment",
  },
  {
    code: "save_as_candidate_database",
    labelKey: "interviewEvaluations.recommendations.saveAsCandidateDatabase",
  },
]

export const interviewEvaluationCriteria: InterviewEvaluationCriterion[] = [
  {
    number: 1,
    titleKey: "interviewEvaluations.criteria.workExperience.title",
    descriptionKey: "interviewEvaluations.criteria.workExperience.description",
  },
  {
    number: 2,
    titleKey: "interviewEvaluations.criteria.education.title",
    descriptionKey: "interviewEvaluations.criteria.education.description",
  },
  {
    number: 3,
    titleKey: "interviewEvaluations.criteria.jobKnowledge.title",
    descriptionKey: "interviewEvaluations.criteria.jobKnowledge.description",
  },
  {
    number: 4,
    titleKey: "interviewEvaluations.criteria.communication.title",
    descriptionKey: "interviewEvaluations.criteria.communication.description",
  },
  {
    number: 5,
    titleKey: "interviewEvaluations.criteria.motivation.title",
    descriptionKey: "interviewEvaluations.criteria.motivation.description",
  },
  {
    number: 6,
    titleKey: "interviewEvaluations.criteria.creativity.title",
    descriptionKey: "interviewEvaluations.criteria.creativity.description",
  },
  {
    number: 7,
    titleKey: "interviewEvaluations.criteria.initiative.title",
    descriptionKey: "interviewEvaluations.criteria.initiative.description",
  },
  {
    number: 8,
    titleKey: "interviewEvaluations.criteria.emotionalControl.title",
    descriptionKey: "interviewEvaluations.criteria.emotionalControl.description",
  },
  {
    number: 9,
    titleKey: "interviewEvaluations.criteria.leadership.title",
    descriptionKey: "interviewEvaluations.criteria.leadership.description",
    noteKey: "interviewEvaluations.criteria.leadership.note",
  },
  {
    number: 10,
    titleKey: "interviewEvaluations.criteria.decisionMaking.title",
    descriptionKey: "interviewEvaluations.criteria.decisionMaking.description",
  },
]

export const interviewEvaluationScoreLegendKeys = [
  "interviewEvaluations.scoreLegend.poor",
  "interviewEvaluations.scoreLegend.fair",
  "interviewEvaluations.scoreLegend.adequate",
  "interviewEvaluations.scoreLegend.good",
  "interviewEvaluations.scoreLegend.excellent",
] as const
