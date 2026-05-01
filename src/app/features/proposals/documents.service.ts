import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../../core/services/config/config.token';

export interface DocumentMaster {
  id: number;
  doc_name: string;
  description: string;
  is_mandatory: boolean;
  entity_type: string;
  sort_order: number;
}

export interface ProposalDocument {
  id: number;
  proposal_id: string;
  document_master_id: number | null;
  custom_doc_name: string | null;
  entity_type: string;
  participant_id: number | null;
  file_name: string;
  stored_name: string;
  file_path: string;
  mime_type: string;
  file_size: number;
  status: string;
  master_doc_name?: string;
  structured_ocr_data?: any;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentsService {
  private http = inject(HttpClient);
  private config = inject(APP_CONFIG);
  private baseUrl = `${this.config.apiUrl}/documents`;

  getMasterDocuments(entityType: string = 'A'): Observable<{ data: DocumentMaster[] }> {
    return this.http.get<{ data: DocumentMaster[] }>(`${this.baseUrl}/master`, {
      params: { entityType }
    });
  }

  getProposalDocuments(proposalId: string, entityType?: string, participantId?: string): Observable<{ data: ProposalDocument[] }> {
    const params: any = {};
    if (entityType) params.entityType = entityType;
    if (participantId) params.participantId = participantId;
    
    return this.http.get<{ data: ProposalDocument[] }>(`${this.baseUrl}/proposal/${proposalId}`, { params });
  }

  uploadDocument(formData: FormData): Observable<{ data: ProposalDocument, message: string }> {
    return this.http.post<{ data: ProposalDocument, message: string }>(`${this.baseUrl}/upload`, formData);
  }

  deleteDocument(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`);
  }

  getViewUrl(id: number): string {
    return `${this.baseUrl}/view/${id}`;
  }

  updateOcrData(id: number, ocrData: any): Observable<{ data: ProposalDocument, message: string }> {
    return this.http.patch<{ data: ProposalDocument, message: string }>(`${this.baseUrl}/${id}/ocr`, { ocrData });
  }

  uploadTemporaryDocument(formData: FormData): Observable<{ data: any, ocrData: any, message: string }> {
    return this.http.post<{ data: any, ocrData: any, message: string }>(`${this.baseUrl}/temp-upload`, formData);
  }

  commitTemporaryDocument(payload: { 
    tempId: string, 
    proposalId: string, 
    entityType: string, 
    participantId?: string, 
    customDocName?: string 
  }): Observable<{ data: ProposalDocument, message: string }> {
    return this.http.post<{ data: ProposalDocument, message: string }>(`${this.baseUrl}/temp-commit`, payload);
  }

  saveVerificationMetadata(payload: {
    proposalId: string,
    entityType: string,
    customDocName: string,
    structuredOcrData: any
  }): Observable<{ data: ProposalDocument, message: string }> {
    return this.http.post<{ data: ProposalDocument, message: string }>(`${this.baseUrl}/verification`, payload);
  }
}
