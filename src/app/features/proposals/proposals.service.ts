import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../../core/services/config/config.token';

export interface ProposalPayload {
  customerIdentity: {
    isExistingCustomer: boolean;
    customerIdOrPan: string;
  };
  applicantDetails: {
    applicantName: string;
    gender: string | null;
    education: string | null;
    dob: Date | null;
    age: number | null;
    panNumber: string;
    grading: string | null;
    aadhaarNumber: string;
    midNumber: string;
    ckycNumber: string;
    emailId: string;
    mobileNo: string;
  };
  loanDetails: {
    loan_type: string | null;
    requested_amount: number | null;
    requested_amount_words: string;
    reason_of_loan: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ProposalsService {
  private http = inject(HttpClient);
  private config = inject(APP_CONFIG);

  /** 
   * Centralized Base URL for backend services. 
   */
  private baseUrl = this.config.apiUrl;
  private apiUrl = `${this.baseUrl}/proposals`;

  getProposals(): Observable<{ data: any[] }> {
    return this.http.get<{ data: any[] }>(this.apiUrl);
  }

  verifyPan(panNo: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/verify-pan`, { pan_no: panNo });
  }

  verifyAadhaarOtp(aadhaarNo: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/verify-aadhaar-otp`, { aadhaar_no: aadhaarNo });
  }

  verifyAadhaarData(clientId: string, otp: string, aadhaarNo: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/verify-aadhaar-data`, { client_id: clientId, otp, aadhaar_no: aadhaarNo });
  }

  createProposal(payload: ProposalPayload): Observable<{ data: any, message: string }> {
    return this.http.post<{ data: any, message: string }>(this.apiUrl, payload);
  }

  getPersonalInfo(id: string, entityType: string = 'B', participantId?: string): Observable<{ data: any }> {
    const params: any = { entityType };
    if (participantId) params.participantId = participantId;
    return this.http.get<{ data: any }>(`${this.apiUrl}/${id}/personal-info`, { params });
  }

  updatePersonalInfo(id: string, payload: any, entityType: string = 'B', participantId?: string): Observable<{ data: any, message: string }> {
    const params: any = { entityType };
    if (participantId) params.participantId = participantId;
    return this.http.put<{ data: any, message: string }>(`${this.apiUrl}/${id}/personal-info`, payload, { params });
  }

  getLoanInfo(id: string): Observable<{ data: any }> {
    return this.http.get<{ data: any }>(`${this.apiUrl}/${id}/loan-info`);
  }

  updateLoanInfo(id: string, payload: any): Observable<{ data: any, message: string }> {
    return this.http.put<{ data: any, message: string }>(`${this.apiUrl}/${id}/loan-info`, payload);
  }

  getBankScheme(id: string): Observable<{ data: any }> {
    return this.http.get<{ data: any }>(`${this.apiUrl}/${id}/bank-scheme`);
  }

  updateBankScheme(id: string, payload: any): Observable<{ data: any, message: string }> {
    return this.http.put<{ data: any, message: string }>(`${this.apiUrl}/${id}/bank-scheme`, payload);
  }

  getFinancialInfo(id: string, entityType: string = 'B', participantId?: string): Observable<{ data: any }> {
    const params: any = { entityType };
    if (participantId) params.participantId = participantId;
    return this.http.get<{ data: any }>(`${this.apiUrl}/${id}/financial-info`, { params });
  }

  updateFinancialInfo(id: string, payload: any, entityType: string = 'B', participantId?: string): Observable<{ data: any, message: string }> {
    const params: any = { entityType };
    if (participantId) params.participantId = participantId;
    return this.http.put<{ data: any, message: string }>(`${this.apiUrl}/${id}/financial-info`, payload, { params });
  }

  getCreditInfo(id: string, entityType: string = 'B', participantId?: string | null): Observable<{ data: any }> {
    const params: any = { entityType };
    if (participantId) params.participantId = participantId;
    return this.http.get<{ data: any }>(`${this.apiUrl}/${id}/credit-info`, { params });
  }

  upsertCreditInfo(id: string, payload: any, entityType: string = 'B', participantId?: string | null): Observable<{ data: any, message: string }> {
    const params: any = { entityType };
    if (participantId) params.participantId = participantId;
    return this.http.put<{ data: any, message: string }>(`${this.apiUrl}/${id}/credit-info`, payload, { params });
  }

  getCreditLoansThisBank(id: string, entityType: string = 'B', participantId?: string | null): Observable<{ data: any[] }> {
    const params: any = { entityType };
    if (participantId) params.participantId = participantId;
    return this.http.get<{ data: any[] }>(`${this.apiUrl}/${id}/credit-loans-this-bank`, { params });
  }

  updateCreditLoanThisBank(proposalId: string, payload: any, entityType: string = 'B', participantId?: string | null): Observable<{ data: any, message: string }> {
    const params: any = { entityType };
    if (participantId) params.participantId = participantId;
    return this.http.put<{ data: any, message: string }>(`${this.apiUrl}/${proposalId}/credit-loans-this-bank`, payload, { params });
  }

  deleteCreditLoanThisBank(loanId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/credit-loans/${loanId}/this-bank`);
  }

  getCreditLoansOtherBank(proposalId: string, entityType: string = 'B', participantId?: string | null): Observable<{ data: any[] }> {
    const params: any = { entityType };
    if (participantId) params.participantId = participantId;
    return this.http.get<{ data: any[] }>(`${this.apiUrl}/${proposalId}/credit-loans-other-banks`, { params });
  }

  updateCreditLoanOtherBank(proposalId: string, payload: any, entityType: string = 'B', participantId?: string | null): Observable<{ data: any, message: string }> {
    const params: any = { entityType };
    if (participantId) params.participantId = participantId;
    return this.http.put<{ data: any, message: string }>(`${this.apiUrl}/${proposalId}/credit-loans-other-banks`, payload, { params });
  }

  deleteCreditLoanOtherBank(loanId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/credit-loans/${loanId}/other-bank`);
  }

  getCreditGuaranteesThisBank(proposalId: string, entityType: string = 'B', participantId?: string | null): Observable<{ data: any[] }> {
    const params: any = { entityType };
    if (participantId) params.participantId = participantId;
    return this.http.get<{ data: any[] }>(`${this.apiUrl}/${proposalId}/credit-guarantees-this-bank`, { params });
  }

  updateCreditGuaranteeThisBank(proposalId: string, payload: any, entityType: string = 'B', participantId?: string | null): Observable<{ data: any, message: string }> {
    const params: any = { entityType };
    if (participantId) params.participantId = participantId;
    return this.http.put<{ data: any, message: string }>(`${this.apiUrl}/${proposalId}/credit-guarantees-this-bank`, payload, { params });
  }

  deleteCreditGuaranteeThisBank(guaranteeId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/credit-guarantees/${guaranteeId}/this-bank`);
  }

  getCreditGuaranteesOtherBank(proposalId: string, entityType: string = 'B', participantId?: string | null): Observable<{ data: any[] }> {
    const params: any = { entityType };
    if (participantId) params.participantId = participantId;
    return this.http.get<{ data: any[] }>(`${this.apiUrl}/${proposalId}/credit-guarantees-other-banks`, { params });
  }

  updateCreditGuaranteeOtherBank(proposalId: string, payload: any, entityType: string = 'B', participantId?: string | null): Observable<{ data: any, message: string }> {
    const params: any = { entityType };
    if (participantId) params.participantId = participantId;
    return this.http.put<{ data: any, message: string }>(`${this.apiUrl}/${proposalId}/credit-guarantees-other-banks`, payload, { params });
  }

  deleteCreditGuaranteeOtherBank(guaranteeId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/credit-guarantees/${guaranteeId}/other-bank`);
  }

  getPreviousLoansThisBank(proposalId: string, entityType: string = 'B', participantId?: string | null): Observable<{ data: any[] }> {
    const params: any = { entityType };
    if (participantId) params.participantId = participantId;
    return this.http.get<{ data: any[] }>(`${this.apiUrl}/${proposalId}/previous-loans-this-bank`, { params });
  }

  updatePreviousLoanThisBank(proposalId: string, payload: any, entityType: string = 'B', participantId?: string | null): Observable<{ data: any, message: string }> {
    const params: any = { entityType };
    if (participantId) params.participantId = participantId;
    return this.http.put<{ data: any, message: string }>(`${this.apiUrl}/${proposalId}/previous-loans-this-bank`, payload, { params });
  }

  deletePreviousLoanThisBank(loanId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/previous-loans/${loanId}/this-bank`);
  }

  getPreviousLoansOtherBank(proposalId: string, entityType: string = 'B', participantId?: string | null): Observable<{ data: any[] }> {
    const params: any = { entityType };
    if (participantId) params.participantId = participantId;
    return this.http.get<{ data: any[] }>(`${this.apiUrl}/${proposalId}/previous-loans-other-banks`, { params });
  }

  updatePreviousLoanOtherBank(proposalId: string, payload: any, entityType: string = 'B', participantId?: string | null): Observable<{ data: any, message: string }> {
    const params: any = { entityType };
    if (participantId) params.participantId = participantId;
    return this.http.put<{ data: any, message: string }>(`${this.apiUrl}/${proposalId}/previous-loans-other-banks`, payload, { params });
  }

  deletePreviousLoanOtherBank(loanId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/previous-loans/${loanId}/other-bank`);
  }

  getAccountsThisBank(proposalId: string, entityType: string = 'B', participantId?: string | null): Observable<{ data: any[] }> {
    const params: any = { entityType };
    if (participantId) params.participantId = participantId;
    return this.http.get<{ data: any[] }>(`${this.apiUrl}/${proposalId}/accounts-this-bank`, { params });
  }

  updateAccountThisBank(proposalId: string, payload: any, entityType: string = 'B', participantId?: string | null): Observable<{ data: any, message: string }> {
    const params: any = { entityType };
    if (participantId) params.participantId = participantId;
    return this.http.put<{ data: any, message: string }>(`${this.apiUrl}/${proposalId}/accounts-this-bank`, payload, { params });
  }

  deleteAccountThisBank(accountId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/accounts/${accountId}/this-bank`);
  }

  getAccountsOtherBank(proposalId: string, entityType: string = 'B', participantId?: string | null): Observable<{ data: any[] }> {
    const params: any = { entityType };
    if (participantId) params.participantId = participantId;
    return this.http.get<{ data: any[] }>(`${this.apiUrl}/${proposalId}/accounts-other-banks`, { params });
  }

  updateAccountOtherBank(proposalId: string, payload: any, entityType: string = 'B', participantId?: string | null): Observable<{ data: any, message: string }> {
    const params: any = { entityType };
    if (participantId) params.participantId = participantId;
    return this.http.put<{ data: any, message: string }>(`${this.apiUrl}/${proposalId}/accounts-other-banks`, payload, { params });
  }

  deleteAccountOtherBank(accountId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/accounts/${accountId}/other-bank`);
  }

  getLifeInsurances(proposalId: string, entityType: string = 'B', participantId?: string | null): Observable<{ data: any[] }> {
    const params: any = { entityType };
    if (participantId) params.participantId = participantId;
    return this.http.get<{ data: any[] }>(`${this.apiUrl}/${proposalId}/life-insurances`, { params });
  }

  updateLifeInsurance(proposalId: string, payload: any, entityType: string = 'B', participantId?: string | null): Observable<{ data: any, message: string }> {
    const params: any = { entityType };
    if (participantId) params.participantId = participantId;
    return this.http.put<{ data: any, message: string }>(`${this.apiUrl}/${proposalId}/life-insurances`, payload, { params });
  }

  deleteLifeInsurance(policyId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/life-insurance/${policyId}`);
  }

  getNewInsurances(proposalId: string, entityType: string = 'B', participantId?: string | null): Observable<{ data: any[] }> {
    const params: any = { entityType };
    if (participantId) params.participantId = participantId;
    return this.http.get<{ data: any[] }>(`${this.apiUrl}/${proposalId}/new-insurances`, { params });
  }

  updateNewInsurance(proposalId: string, payload: any, entityType: string = 'B', participantId?: string | null): Observable<{ data: any, message: string }> {
    const params: any = { entityType };
    if (participantId) params.participantId = participantId;
    return this.http.put<{ data: any, message: string }>(`${this.apiUrl}/${proposalId}/new-insurances`, payload, { params });
  }

  deleteNewInsurance(policyId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/new-insurance/${policyId}`);
  }

  getRocDebts(proposalId: string, entityType: string = 'B', participantId?: string | null): Observable<{ data: any[] }> {
    const params: any = { entityType };
    if (participantId) params.participantId = participantId;
    return this.http.get<{ data: any[] }>(`${this.apiUrl}/${proposalId}/roc-debts`, { params });
  }

  updateRocDebt(proposalId: string, payload: any, entityType: string = 'B', participantId?: string | null): Observable<{ data: any, message: string }> {
    const params: any = { entityType };
    if (participantId) params.participantId = participantId;
    return this.http.put<{ data: any, message: string }>(`${this.apiUrl}/${proposalId}/roc-debts`, payload, { params });
  }

  deleteRocDebt(debtId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/roc-debt/${debtId}`);
  }

  getIncomes(id: string, entityType: string = 'B', participantId?: string | null): Observable<{ data: any }> {
    const params: any = { entityType };
    if (participantId) params.participantId = participantId;
    return this.http.get<{ data: any }>(`${this.apiUrl}/${id}/incomes`, { params });
  }

  updateIncome(proposalId: string, category: string, payload: any, entityType: string = 'B', participantId?: string | null) {
    const params: any = { entityType };
    if (participantId) params.participantId = participantId;
    return this.http.put(`${this.apiUrl}/${proposalId}/incomes/${category}`, payload, { params });
  }

  deleteIncome(incomeId: string, category: string) {
    return this.http.delete(`${this.apiUrl}/incomes/${incomeId}/${category}`);
  }

  getProperties(id: string, entityType: string = 'B', participantId?: string) {
    const params: any = { entityType };
    if (participantId) params.participantId = participantId;
    return this.http.get<{ data: any[] }>(`${this.apiUrl}/${id}/properties`, { params });
  }

  updateProperty(proposalId: string, payload: any, entityType: string = 'B', participantId?: string) {
    const params: any = { entityType };
    if (participantId) params.participantId = participantId;
    return this.http.put(`${this.apiUrl}/${proposalId}/properties`, payload, { params });
  }

  deleteProperty(propertyId: string) {
    return this.http.post(`${this.apiUrl}/properties/delete`, { propertyId });
  }

  // Participants Registry
  getParticipants(proposalId: string): Observable<{ data: any[] }> {
    return this.http.get<{ data: any[] }>(`${this.baseUrl}/participants/proposal/${proposalId}`);
  }

  createParticipant(payload: any): Observable<{ data: any, message: string }> {
    return this.http.post<{ data: any, message: string }>(`${this.baseUrl}/participants`, payload);
  }

  updateParticipant(id: string, payload: any): Observable<{ data: any, message: string }> {
    return this.http.put<{ data: any, message: string }>(`${this.baseUrl}/participants/${id}`, payload);
  }

  deleteParticipant(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/participants/${id}`);
  }

  getTabMaster(): Observable<{ data: any[] }> {
    return this.http.get<{ data: any[] }>(`${this.apiUrl}/tabs/master`);
  }

  getProposalTabs(id: string, entityType: string = 'B', participantId?: string): Observable<{ data: any[] }> {
    const params: any = { entityType };
    if (participantId) params.participantId = participantId;
    return this.http.get<{ data: any[] }>(`${this.apiUrl}/${id}/tabs`, { params });
  }

  updateProposalTabsMapping(id: string, tabKeys: string[]): Observable<{ data: any[], message: string }> {
    return this.http.post<{ data: any[], message: string }>(`${this.apiUrl}/${id}/tabs/mapping`, { tabKeys });
  }

  downloadScrutinyReport(proposalId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${proposalId}/print/branch-report`, {
      responseType: 'blob'
    });
  }

  getMachineryInfo(id: string): Observable<{ data: any[] }> {
    return this.http.get<{ data: any[] }>(`${this.apiUrl}/${id}/machinery-info`);
  }

  getHigherPurchaseData(id: string): Observable<{ data: any }> {
    return this.http.get<{ data: any }>(`${this.apiUrl}/${id}/higher-purchase-data`);
  }

  updateHigherPurchaseData(id: string, payload: any): Observable<{ data: any, message: string }> {
    return this.http.put<{ data: any, message: string }>(`${this.apiUrl}/${id}/higher-purchase-data`, payload);
  }

  upsertMachineryItem(proposalId: string, payload: any): Observable<{ data: any, message: string }> {
    return this.http.put<{ data: any, message: string }>(`${this.apiUrl}/${proposalId}/machinery-item`, payload);
  }

  deleteMachineryItem(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/machinery/${id}`);
  }

  // Master Data (Root Level Modules)
  getBranches(): Observable<{ data: any[] }> {
    return this.http.get<{ data: any[] }>(`${this.baseUrl}/branches`);
  }

  getLoanTypes(): Observable<{ data: any[] }> {
    return this.http.get<{ data: any[] }>(`${this.baseUrl}/loan-types`);
  }

  getLoanApplicationData(id: string) {
    return this.http.get<any>(`${this.apiUrl}/loan-application-data/${id}`);
  }

  getLoanscrutinyData(id: string) {
    return this.http.get<any>(`${this.apiUrl}/loan-scrutiny-data/${id}`);
  }

   getLoangurantorData(id: string) {
    return this.http.get<any>(`${this.apiUrl}/loan-gaurantor-data/${id}`);
  }

  markTabAsFilled(proposalId: string, tabKey: string, entityType: string = 'B', participantId?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${proposalId}/tabs/mark-filled`, { 
      tabKey,
      entityType,
      participantId
    });
  }

  submitProposal(proposalId: string, remarks: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${proposalId}/submit`, { remarks });
  }
}
