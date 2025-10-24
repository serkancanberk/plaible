export const REPORT_CATEGORIES = ["content_error","inappropriate_content","technical_bug","user_management","other"] as const;
export type ReportCategory = typeof REPORT_CATEGORIES[number];

export const REPORT_STATUS = ["open","in_progress","resolved","closed"] as const;
export type ReportStatus = typeof REPORT_STATUS[number];

export const REPORT_PRIORITY = ["low","medium","high","urgent"] as const;
export type ReportPriority = typeof REPORT_PRIORITY[number];
