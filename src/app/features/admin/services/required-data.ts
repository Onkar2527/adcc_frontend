export const user_types = [
  { label: 'Admin', value: '1' },
  { label: 'Auditor', value: '2' },
  { label: 'Employee', value: '3' },
  { label: 'Reviewer', value: '4' },
  { label: 'Top Level Management', value: '5' },
  { label: 'Division', value: '6' },
];

export const audit_due_array = [
  { label: 'Audit', value: '15' },
  { label: 'Audit Review', value: '15' },
  { label: 'Compliance', value: '15' },
  { label: 'Compliance Review', value: '15' },
];

export const status_array = [
  { label: 'Active', value: '1' },
  { label: 'Inactive', value: '2' },
];

export const audit_type_array = [
  { label: 'RBI Audit', value: '1' },
  { label: 'Concurrent Audit', value: '2' },
];

export const review_timeline_status = [
  { label: 'Accept All Observations', value: '1' },
  { label: 'Reject All Observations', value: '2' },
];

export const audit_review_action = [
  { label: 'ACCEPTED', value: '2' },
  { label: 'RE ASSESMENT NEEDED', value: '3' },
];

export const compliance_review_action = [
  { label: 'ACCEPTED', value: '2' },
  { label: 'RE COMPLIANCE NEEDED', value: '3' },
];

export const carry_forward_array = [{ label: 'CARRY FORWARD POINTS', value: 'CF' }];

export const assesment_timeline_array = [
  { label: 'AUDIT (PENDING / ACTIVE)', value: '1' },
  { label: 'REVIEW (PENDING / ACTIVE)', value: '2' },
  { label: 'RE AUDIT (PENDING / ACTIVE)', value: '3' },
  { label: 'COMPLIANCE (PENDING / ACTIVE)', value: '4' },
  { label: 'REVIEW (PENDING / ACTIVE)', value: '5' },
  { label: 'RE COMPLIANCE (PENDING / ACTIVE)', value: '6' },
  { label: 'ASSESMENT COMPLETED', value: '7' },
  { label: 'REVIEWER TO AUDIT (All OBSERVATIONS)', value: '8' },
  { label: 'REVIEWER TO COMPLIANCE (All OBSERVATIONS)', value: '9' },
  { label: 'ADMIN INCREASE ACCEPT / REJECT LIMIT IN AUDIT', value: '10' },
  { label: 'ADMIN INCREASE ACCEPT / REJECT LIMIT IN COMPLIANCE', value: '11' },
  { label: 'ADMIN INCREASE DUE DATE IN AUDIT', value: '12' },
  { label: 'ADMIN INCREASE DUE DATE IN COMPLIANCE', value: '13' },
  { label: 'REVIEWER TO AUDIT (ENTIRE ASSESMENT BACK TO AUDIT)', value: '14' },
];

export const risk_parameters_array = [
  { label: 'HIGH RISK', value: '1' },
  { label: 'MEDIUM RISK', value: '2' },
  { label: 'LOW RISK', value: '3' },
  { label: 'NO RISK', value: '4' },
];

export const applicable_to_array = [
  { label: 'GENERAL', value: '1' },
  { label: 'INDIVIDUAL', value: '2' },
  { label: 'NON-INDIVIDUAL', value: '3' },
  { label: 'INDIVIDUAL / NON-INDIVIDUAL', value: '4' },
];

export const question_input_method_array = [
  { label: 'MULTIPLE - OPTION SELECT', value: '1' },
  { label: 'YES / NO TYPE - OPTION SELECT', value: '2' },
  { label: 'GENERAL QUESTION - ONLY TEXTAREA', value: '3' },
  { label: 'ANNEXURE', value: '4' },
  { label: 'SUBSET', value: '5' },
];

export const question_type_array = [
  { label: 'QUALITATIVE', value: '1' },
  { label: 'QUANTITATIVE', value: '2' },
];

export const scheme_types_array = [
  { label: 'DEPOSITS', value: '1' },
  { label: 'ADVANCES', value: '2' },
];

export const set_types_array = [
  { label: 'MAINSET', value: '1' },
  { label: 'SUBSET', value: '2' },
];

export const audit_frequency_array = [
  { label: '1 Month Frequency', value: '1' },
  { label: '3 Months Frequency', value: '3' },
  { label: '6 Months Frequency', value: '6' },
  { label: '12 Months Frequency', value: '12' },
];

export const column_type_array = [
  { label: 'TextBox', value: '1' },
  { label: 'TextArea', value: '2' },
  { label: 'Dropdown', value: '3' },
];

export const remark_types_array = [
  { label: 'Remark for Auditor', value: '1' },
  { label: 'Remark for Reviewer', value: '2' },
  { label: 'Remark for Compliance', value: '3' },
  { label: 'Remark for Reviewer & Compliance', value: '4' },
  { label: 'Remark for Auditor & Compliance', value: '5' },
];

export const branch_financial_position_deposits = [
  { label: 'CASA Deposit', value: '1' },
  { label: 'Term Deposit', value: '2' },
];

export const branch_financial_position_advances = [
  { label: '(Advances) Clean Loan', value: '3' },
  { label: '(Advances) Vehicle Loan', value: '4' },
  { label: '(Advances) Gold Loan', value: '5' },
  { label: '(Advances) Other Term Loan', value: '6' },
  { label: '(Advances) Cash Credit Loan', value: '7' },
  { label: '(Advances) Decreed Loan', value: '8' },
];

export const branch_financial_position_npa = [
  { label: '(NPA) Clean Loan', value: '9' },
  { label: '(NPA) Vehicle Loan', value: '10' },
  { label: '(NPA) Gold Loan', value: '11' },
  { label: '(NPA) Other Term Loan', value: '12' },
  { label: '(NPA) Cash Credit Loan', value: '13' },
  { label: '(NPA) Decreed Loan', value: '14' },
];

export const branch_fresh_accounts_deposits = [
  { label: 'CASA Deposit', value: '1' },
  { label: 'Term Deposit (NEW)', value: '2' },
  { label: 'Term Deposits (Through Auto-Renewals)', value: '3' },
];

export const branch_fresh_accounts_advances = [
  { label: 'Clean Loan', value: '4' },
  { label: 'Vehicle Loan', value: '5' },
  { label: 'Gold Loan', value: '6' },
  { label: 'Loan Against Fixed Deposits', value: '7' },
  { label: 'Other Term Loan', value: '8' },
  { label: 'Cash Credit Loans (New)', value: '9' },
  { label: 'Cash Credit Loans (Renewals)', value: '10' },
];

export const branch_fresh_accounts_npa = [
  { label: 'Clean Loan', value: '11' },
  { label: 'Vehicle Loan', value: '12' },
  { label: 'Gold Loan', value: '13' },
  { label: 'Other Term Loan', value: '14' },
  { label: 'Cash Credit Loan', value: '15' },
  { label: 'Decreed Accounts', value: '16' },
];

export const FREE_AUDIT_FLOW = false;
