import type { PipelineRecord } from "@/types/domain";

export interface DetailField {
  key: string;
  label: string;
  type?: "text" | "textarea" | "date";
}

export interface DetailSection {
  key: string;
  label: string;
  // Stages where this section is most relevant — used to auto-open it first.
  relevantStages: PipelineRecord["stage"][];
  fields: DetailField[];
}

export const PIPELINE_DETAIL_SECTIONS: DetailSection[] = [
  {
    key: "discovery",
    label: "Discovery",
    relevantStages: ["Appointment Confirmed", "Discovery Completed"],
    fields: [
      { key: "questionnaireStatus", label: "Questionnaire Status" },
      { key: "questionnaireSentDate", label: "Questionnaire Sent", type: "date" },
      { key: "questionnaireCompletedDate", label: "Questionnaire Completed", type: "date" },
      { key: "prepStatus", label: "Discovery Prep Status" },
      { key: "date", label: "Discovery Date", type: "date" },
      { key: "completedDate", label: "Discovery Completed Date", type: "date" },
      { key: "outcome", label: "Discovery Outcome" },
      { key: "notes", label: "Discovery Notes", type: "textarea" },
    ],
  },
  {
    key: "briefing",
    label: "Briefing (Recommendation Prep)",
    relevantStages: ["Fact Finder Complete"],
    fields: [
      { key: "status", label: "Briefing Status" },
      { key: "familySituation", label: "Family Situation", type: "textarea" },
      { key: "currentCoverage", label: "Current Coverage", type: "textarea" },
      { key: "primaryConcern", label: "Primary Concern", type: "textarea" },
      { key: "emotionalDrivers", label: "Emotional Drivers", type: "textarea" },
      { key: "openQuestions", label: "Open Questions", type: "textarea" },
      { key: "doNotAssume", label: "Do Not Assume", type: "textarea" },
      { key: "customOpening", label: "Custom Opening", type: "textarea" },
      { key: "fiveQuestions", label: "Five Questions", type: "textarea" },
      { key: "objections", label: "Objections", type: "textarea" },
      { key: "desiredOutcome", label: "Desired Outcome", type: "textarea" },
      { key: "completedDate", label: "Briefing Completed", type: "date" },
    ],
  },
  {
    key: "recommendation",
    label: "Recommendation",
    relevantStages: ["Recommendation", "Decision Pending"],
    fields: [
      { key: "researchStatus", label: "Research Status" },
      { key: "meetingNeeded", label: "Meeting Needed" },
      { key: "meetingBooked", label: "Meeting Booked" },
      { key: "meetingDate", label: "Meeting Date", type: "date" },
      { key: "prepStatus", label: "Prep Status" },
      { key: "visualPrepared", label: "Visual Prepared" },
      { key: "meetingCompleted", label: "Meeting Completed" },
      { key: "meetingOutcome", label: "Meeting Outcome", type: "textarea" },
      { key: "decisionStatus", label: "Decision Status" },
      { key: "followUpRequired", label: "Follow-Up Required" },
      { key: "followUpDue", label: "Follow-Up Due", type: "date" },
      { key: "proceedDate", label: "Proceed Date", type: "date" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  },
  {
    key: "application",
    label: "Application & Underwriting",
    relevantStages: ["Application", "Underwriting", "Approved"],
    fields: [
      { key: "status", label: "Application Status" },
      { key: "startedDate", label: "App Started", type: "date" },
      { key: "submittedDate", label: "App Submitted", type: "date" },
      { key: "productCategory", label: "Product Category" },
      { key: "uwWelcomeSent", label: "UW Welcome Sent" },
      { key: "requirementsStatus", label: "Requirements Status" },
      { key: "medicalExamRequired", label: "Medical Exam Required" },
      { key: "medicalExamStatus", label: "Medical Exam Status" },
      { key: "addReqsNeeded", label: "Additional Reqs Needed" },
      { key: "addReqsDescription", label: "Additional Reqs Description", type: "textarea" },
      { key: "lastCarrierStatus", label: "Last Carrier Status" },
      { key: "lastCarrierStatusDate", label: "Last Carrier Status Date", type: "date" },
      { key: "nextUpdateDue", label: "Next Client Update Due", type: "date" },
      { key: "underwritingStatus", label: "Underwriting Status" },
      { key: "carrierDecision", label: "Carrier Decision" },
      { key: "carrierDecisionDate", label: "Carrier Decision Date", type: "date" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  },
  {
    key: "policy",
    label: "Policy",
    relevantStages: ["Approved", "Policy Delivered"],
    fields: [
      { key: "type", label: "Policy Type" },
      { key: "carrier", label: "Carrier" },
      { key: "coverageAmount", label: "Coverage Amount" },
      { key: "premium", label: "Premium" },
      { key: "paymentFrequency", label: "Payment Frequency" },
      { key: "status", label: "Policy Status" },
      { key: "issuedDate", label: "Policy Issued", type: "date" },
      { key: "deliveryMeetingDate", label: "Delivery Meeting Date", type: "date" },
      { key: "deliveredDate", label: "Policy Delivered Date", type: "date" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  },
  {
    key: "familyProtection",
    label: "Family Protection",
    relevantStages: ["Client"],
    fields: [
      { key: "status", label: "FC Status" },
      { key: "blueprintStatus", label: "Blueprint Status" },
      { key: "conversationDate", label: "Conversation Date", type: "date" },
      { key: "participants", label: "Participants" },
      { key: "relationships", label: "Relationships", type: "textarea" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  },
  {
    key: "annualReview",
    label: "Annual Review",
    relevantStages: ["Annual Review", "Client"],
    fields: [
      { key: "needed", label: "AR Needed" },
      { key: "lastDate", label: "Last AR Date", type: "date" },
      { key: "nextDate", label: "Next AR Date", type: "date" },
      { key: "outcome", label: "Outcome", type: "textarea" },
      { key: "householdChanges", label: "Household Changes", type: "textarea" },
      { key: "referralOpportunity", label: "Referral Opportunity" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  },
  {
    key: "recovery",
    label: "Recovery (Missed Appointments)",
    relevantStages: [],
    fields: [
      { key: "missedApptDate", label: "Missed Appointment Date", type: "date" },
      { key: "status", label: "Recovery Status" },
      { key: "attempts", label: "Attempts Made" },
      { key: "lastResponse", label: "Last Response" },
      { key: "movedToNurture", label: "Moved to Nurture" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  },
];
