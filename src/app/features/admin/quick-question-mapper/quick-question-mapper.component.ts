import {
  Component,
  OnInit,
  inject,
  signal,
  effect,
  WritableSignal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// PrimeNG Modules
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { TextareaModule } from 'primeng/textarea';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { ProgressBarModule } from 'primeng/progressbar';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { FloatLabelModule } from 'primeng/floatlabel';
import { MessageService, ConfirmationService } from 'primeng/api';

// Shared Form Components
import {
  SelectFieldComponent,
  TextFieldComponent,
  TextareaFieldComponent,
  CheckboxFieldComponent,
  NumberFieldComponent
} from '../../../shared/components/form';

// Services & Interfaces
import {
  AuditQuestionMasterService,
  CreateQuestionDto,
  CreateQuestionSetDto,
  CreateQuestionHeaderDto,
  CreateQuestionRiskMappingDto,
  MenuMasterService,
  AuditCategoryMasterService
} from '../services/masters.service';

@Component({
  selector: 'app-quick-question-mapper',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ToastModule,
    ConfirmDialogModule,
    DialogModule,
    ButtonModule,
    CheckboxModule,
    TextareaModule,
    InputTextModule,
    TableModule,
    ProgressBarModule,
    SelectModule,
    TooltipModule,
    FloatLabelModule,
    SelectFieldComponent,
    TextFieldComponent,
    TextareaFieldComponent,
    CheckboxFieldComponent,
    NumberFieldComponent
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './quick-question-mapper.component.html',
  styleUrls: ['./quick-question-mapper.component.scss']
})
export class QuickQuestionMapperComponent implements OnInit {
  protected readonly Number = Number;
  private service = inject(AuditQuestionMasterService);
  private menuService = inject(MenuMasterService);
  private categoryService = inject(AuditCategoryMasterService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  // Dropdown list signals
  sets = signal<any[]>([]);
  headers = signal<any[]>([]);
  questions = signal<any[]>([]);

  // Master Lookup signals
  questionTypes = signal<any[]>([]);
  inputMethods = signal<any[]>([]);
  applicableToOptions = signal<any[]>([]);
  annexures = signal<any[]>([]);
  subsets = signal<any[]>([]);
  businessRiskCategories = signal<any[]>([]);
  controlRiskCategories = signal<any[]>([]);
  keyAspects = signal<any[]>([]);
  keyAspectMappings: any = {};
  residualRisks = signal<any[]>([]);
  auditAreas = signal<any[]>([]);

  // Form selections & values
  selectedSetId = signal<number | null>(null);
  selectedHeaderId = signal<number | null>(null);

  editingQuestionId = signal<number | null>(null);
  questionText = signal('');
  questionTypeId = signal<number | null>(null);
  optionId = signal<number | null>(null);
  selectedAnnexureId = signal<number | null>(null);
  selectedSubsetIds = signal<number[]>([]);
  applicableId = signal<number | null>(null);
  auditAreaId = signal<number | null>(null);
  showInstances = signal<number>(0);
  businessRiskCategoryId = signal<number | null>(null);
  controlRiskCategoryId = signal<number | null>(null);
  keyAspectId = signal<number | null>(null);
  residualRiskId = signal<number | null>(null);
  auditEvidenceUpload = signal(false);
  complianceEvidenceUpload = signal(false);
  isActive = signal(true);

  // Inline Risk Mapping list and form input signals
  currentRiskMappings = signal<any[]>([]);
  newRiskType = signal('');
  newBusinessRisk = signal<string | null>(null);
  newControlRisk = signal<string | null>(null);

  riskOptions = [
    { label: 'HIGH RISK', value: 'HIGH RISK' },
    { label: 'MEDIUM RISK', value: 'MEDIUM RISK' },
    { label: 'LOW RISK', value: 'LOW RISK' },
    { label: 'NO RISK', value: 'NO RISK' }
  ];

  // Loading & Action states
  loading = signal(false);
  saving = signal(false);

  // Dialog signals for inline creation
  showAddSetDialog = signal(false);
  newSetName = signal('');
  newSetTypeId = signal<number>(1);
  setTypes = [
    { label: 'Main Set', value: 1 },
    { label: 'Sub Set', value: 2 }
  ];

  showAddHeaderDialog = signal(false);
  newHeaderName = signal('');

  // Bulk Upload signals
  showImportDialog = signal(false);
  importing = signal(false);
  importProgress = signal(0);
  importStatusText = signal('');
  importErrors = signal<string[]>([]);

  constructor() {
    // React to Control Risk Category changes to reload Key Aspects dynamically
    effect(() => {
      const controlRiskId = this.controlRiskCategoryId();
      if (controlRiskId === null || controlRiskId === undefined) {
        this.keyAspects.set([]);
        return;
      }
      const options = this.keyAspectMappings[String(controlRiskId)] ?? [];
      this.keyAspects.set(options);
    });
  }

  ngOnInit() {
    this.loadSets();
    this.loadLookups();
  }

  // Load Question Sets
  loadSets() {
    this.service.findAllSets().subscribe({
      next: (res: any) => {
        const rows = Array.isArray(res) ? res : res?.data ?? [];
        this.sets.set(rows);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load question sets'
        });
      }
    });
  }

  // Load Headers based on selected set
  onSetChange(setId: number | null) {
    this.selectedHeaderId.set(null);
    this.headers.set([]);
    this.questions.set([]);
    this.clearQuestionForm();

    if (!setId) return;

    this.service.findHeadersBySet(setId).subscribe({
      next: (res: any) => {
        const rows = Array.isArray(res) ? res : res?.data ?? [];
        this.headers.set(rows);
        this.loadQuestions();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load headers'
        });
      }
    });
  }

  // Load Questions under Set/Header
  onHeaderChange() {
    this.loadQuestions();
  }

  loadQuestions() {
    const setId = this.selectedSetId();
    const headerId = this.selectedHeaderId();

    if (!setId) {
      this.questions.set([]);
      return;
    }

    this.loading.set(true);
    const obs = headerId
      ? this.service.findQuestionsByHeader(headerId)
      : this.service.findQuestionsBySet(setId);

    obs.subscribe({
      next: (res: any) => {
        const rows = Array.isArray(res)
          ? res
          : Array.isArray(res?.data)
            ? res.data
            : res?.rows ?? [];
        this.questions.set(rows);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load questions'
        });
      }
    });
  }

  // Load Dropdown Lookups
  loadLookups() {
    this.service.getQuestionLookups().subscribe({
      next: (res: any) => {
        this.questionTypes.set(res?.questionTypes ?? []);
        this.inputMethods.set(res?.questionInputMethods ?? []);
        this.applicableToOptions.set(res?.applicableTo ?? []);
        this.annexures.set(res?.annexures ?? []);
        this.subsets.set(res?.subsets ?? []);
        this.businessRiskCategories.set(res?.businessRiskCategories ?? []);
        this.controlRiskCategories.set(res?.controlRiskCategories ?? []);
        this.keyAspectMappings = res?.keyAspectMappings ?? {};
        this.residualRisks.set(res?.residualRisks ?? []);
        this.auditAreas.set(res?.auditAreas ?? []);
      }
    });
  }

  // Handle subset checkbox changes
  onSubsetChange(subsetId: number, checked: boolean) {
    let ids = [...this.selectedSubsetIds()];
    if (checked) {
      if (!ids.includes(subsetId)) {
        ids.push(subsetId);
      }
    } else {
      ids = ids.filter(id => id !== subsetId);
    }
    this.selectedSubsetIds.set(ids);
  }

  // Dialog actions for Inline Set Creation
  openAddSet() {
    this.newSetName.set('');
    this.newSetTypeId.set(1);
    this.showAddSetDialog.set(true);
  }

  saveNewSet() {
    const name = this.newSetName().trim();
    if (!name) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Please enter set name'
      });
      return;
    }

    const payload: CreateQuestionSetDto = {
      name,
      set_type_id: this.newSetTypeId(),
      is_active: 1
    };

    this.service.createSet(payload).subscribe({
      next: (res: any) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Question Set created successfully'
        });
        this.showAddSetDialog.set(false);
        this.loadSets();
        // Auto select the new set
        if (res && res.id) {
          this.selectedSetId.set(Number(res.id));
          this.onSetChange(Number(res.id));
        }
      },
      error: (err: any) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.message || 'Failed to create Question Set'
        });
      }
    });
  }

  // Dialog actions for Inline Header Creation
  openAddHeader() {
    if (!this.selectedSetId()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Required',
        detail: 'Please select a Question Set first'
      });
      return;
    }
    this.newHeaderName.set('');
    this.showAddHeaderDialog.set(true);
  }

  saveNewHeader() {
    const name = this.newHeaderName().trim();
    const setId = this.selectedSetId();
    if (!name || !setId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Please enter header name'
      });
      return;
    }

    const payload: CreateQuestionHeaderDto = {
      question_set_id: setId,
      name,
      is_active: 1
    };

    this.service.createHeader(payload).subscribe({
      next: (res: any) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Header created successfully'
        });
        this.showAddHeaderDialog.set(false);
        // Refresh headers
        this.service.findHeadersBySet(setId).subscribe({
          next: (headersRes: any) => {
            const rows = Array.isArray(headersRes) ? headersRes : headersRes?.data ?? [];
            this.headers.set(rows);
            if (res && res.id) {
              this.selectedHeaderId.set(Number(res.id));
              this.onHeaderChange();
            }
          }
        });
      },
      error: (err: any) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.message || 'Failed to create header'
        });
      }
    });
  }

  // Add a Risk Mapping to the current question list (local or remote)
  addRiskMapping() {
    const riskType = this.newRiskType().trim();
    const bRisk = this.newBusinessRisk();
    const cRisk = this.newControlRisk();

    if (!riskType || !bRisk || !cRisk) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Please fill all Risk Mapping fields'
      });
      return;
    }

    const newMapping: any = {
      risk_type: riskType,
      business_risk: bRisk,
      control_risk: cRisk
    };

    const qId = this.editingQuestionId();
    if (qId) {
      // Editing existing question, save mapping immediately via backend API
      const payload: CreateQuestionRiskMappingDto = {
        question_id: qId,
        risk_type: riskType,
        business_risk: bRisk,
        control_risk: cRisk
      };

      this.service.createRiskMapping(payload).subscribe({
        next: (res: any) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Risk mapping added successfully'
          });
          this.newRiskType.set('');
          this.newBusinessRisk.set(null);
          this.newControlRisk.set(null);
          this.loadRiskMappings(qId);
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to save risk mapping'
          });
        }
      });
    } else {
      // Local addition for new question
      this.currentRiskMappings.set([...this.currentRiskMappings(), newMapping]);
      this.newRiskType.set('');
      this.newBusinessRisk.set(null);
      this.newControlRisk.set(null);
    }
  }

  // Remove a Risk Mapping
  removeRiskMapping(mapping: any, index: number) {
    if (mapping.id) {
      // Exists in DB, prompt and remove
      this.confirmationService.confirm({
        message: 'Are you sure you want to delete this risk mapping?',
        header: 'Confirm Delete',
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
          this.service.removeRiskMapping(mapping.id).subscribe({
            next: () => {
              this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Risk mapping deleted'
              });
              const qId = this.editingQuestionId();
              if (qId) this.loadRiskMappings(qId);
            }
          });
        }
      });
    } else {
      // Local removal
      const mappings = [...this.currentRiskMappings()];
      mappings.splice(index, 1);
      this.currentRiskMappings.set(mappings);
    }
  }

  // Load Risk Mappings for existing question
  loadRiskMappings(questionId: number) {
    this.service.findRiskMappings(questionId).subscribe({
      next: (res: any) => {
        const rows = Array.isArray(res) ? res : res?.data ?? [];
        this.currentRiskMappings.set(rows);
      }
    });
  }

  // Clear editing question details form
  clearQuestionForm() {
    this.editingQuestionId.set(null);
    this.questionText.set('');
    this.questionTypeId.set(null);
    this.optionId.set(null);
    this.selectedAnnexureId.set(null);
    this.selectedSubsetIds.set([]);
    this.applicableId.set(null);
    this.auditAreaId.set(null);
    this.showInstances.set(0);
    this.businessRiskCategoryId.set(null);
    this.controlRiskCategoryId.set(null);
    this.keyAspectId.set(null);
    this.residualRiskId.set(null);
    this.auditEvidenceUpload.set(false);
    this.complianceEvidenceUpload.set(false);
    this.isActive.set(true);
    this.currentRiskMappings.set([]);
    this.newRiskType.set('');
    this.newBusinessRisk.set(null);
    this.newControlRisk.set(null);
  }

  // Load existing question to form for editing
  editQuestion(row: any) {
    this.clearQuestionForm();
    this.loading.set(true);

    this.service.findOneQuestion(row.id).subscribe({
      next: (data: any) => {
        this.editingQuestionId.set(data.id);
        this.questionText.set(data.question ?? '');
        this.questionTypeId.set(Number(data.question_type_id) || null);
        this.optionId.set(Number(data.option_id) || null);
        this.selectedAnnexureId.set(data.annexure_id != null ? Number(data.annexure_id) : null);
        this.selectedSubsetIds.set(
          data.subset_multi_id
            ? String(data.subset_multi_id)
                .split(',')
                .map((x: string) => Number(x.trim()))
                .filter(Boolean)
            : []
        );
        this.applicableId.set(data.applicable_id != null ? Number(data.applicable_id) : null);
        this.auditAreaId.set(data.area_of_audit_id != null ? Number(data.area_of_audit_id) : null);
        this.showInstances.set(data.show_instances != null ? Number(data.show_instances) : 0);
        this.businessRiskCategoryId.set(data.risk_category_id != null ? Number(data.risk_category_id) : null);
        this.controlRiskCategoryId.set(data.control_risk_id != null ? Number(data.control_risk_id) : null);
        this.residualRiskId.set(data.residual_risk_id != null ? Number(data.residual_risk_id) : null);
        this.auditEvidenceUpload.set(Number(data.audit_ev_upload) === 1);
        this.complianceEvidenceUpload.set(Number(data.compliance_ev_upload) === 1);
        this.isActive.set(Number(data.is_active) !== 0);

        // Preload key aspect with delay to let effect resolve first
        setTimeout(() => {
          if (data.key_aspect_id != null) {
            this.keyAspectId.set(Number(data.key_aspect_id));
          }
        }, 100);

        this.loadRiskMappings(data.id);
        this.loading.set(false);

        // Scroll to form panels
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load question details'
        });
      }
    });
  }

  // Toggle Status of a question
  toggleQuestionStatus(row: any) {
    this.service.toggleQuestionStatus(row.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `Question status updated successfully`
        });
        this.loadQuestions();
      }
    });
  }

  // Delete question
  deleteQuestion(row: any) {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this question? All risk mappings will be deleted too.',
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.service.removeQuestion(row.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Question deleted successfully'
            });
            this.loadQuestions();
            if (this.editingQuestionId() === row.id) {
              this.clearQuestionForm();
            }
          }
        });
      }
    });
  }

  // Save/Update Question logic
  saveQuestion() {
    const setId = this.selectedSetId();
    const headerId = this.selectedHeaderId();

    if (!setId || !headerId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Please select both Set and Header first'
      });
      return;
    }

    const question = this.questionText().trim();
    if (!question) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Please enter question description'
      });
      return;
    }

    if (!this.questionTypeId() || !this.optionId() || !this.applicableId()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Please fill all required question details (Type, Input Method, Applicable To)'
      });
      return;
    }

    this.saving.set(true);

    const payload: CreateQuestionDto = {
      set_id: setId,
      header_id: headerId,
      annexure_id: this.optionId() === 4 ? Number(this.selectedAnnexureId()) : 0,
      subset_multi_id: this.optionId() === 5 ? this.selectedSubsetIds().join(',') : '',
      question,
      question_type_id: Number(this.questionTypeId()),
      option_id: Number(this.optionId()),
      applicable_id: Number(this.applicableId()),
      area_of_audit_id: this.auditAreaId() ? Number(this.auditAreaId()) : 0,
      control_risk_id: this.controlRiskCategoryId() ? Number(this.controlRiskCategoryId()) : 0,
      key_aspect_id: this.keyAspectId() ? Number(this.keyAspectId()) : 0,
      residual_risk_id: this.residualRiskId() ? Number(this.residualRiskId()) : 0,
      show_instances: Number(this.showInstances() ?? 0),
      audit_ev_upload: this.auditEvidenceUpload() ? 1 : 0,
      compliance_ev_upload: this.complianceEvidenceUpload() ? 1 : 0,
      risk_category_id: this.businessRiskCategoryId() ? Number(this.businessRiskCategoryId()) : 0,
      is_active: this.isActive() ? 1 : 0
    };

    const qId = this.editingQuestionId();
    const obs = qId
      ? this.service.updateQuestion(qId, payload)
      : this.service.createQuestion(payload);

    obs.subscribe({
      next: (res: any) => {
        const resolvedId = qId || (res && res.id ? Number(res.id) : null);

        // If it's a new question and has local risk mappings, save them sequentially
        if (!qId && resolvedId && this.currentRiskMappings().length > 0) {
          const mappingCalls = this.currentRiskMappings().map(mapping => {
            const mapPayload: CreateQuestionRiskMappingDto = {
              question_id: resolvedId,
              risk_type: mapping.risk_type,
              business_risk: mapping.business_risk,
              control_risk: mapping.control_risk
            };
            return this.service.createRiskMapping(mapPayload).toPromise();
          });

          Promise.all(mappingCalls)
            .then(() => {
              this.handleSaveSuccess(qId ? 'updated' : 'created');
            })
            .catch(() => {
              this.saving.set(false);
              this.messageService.add({
                severity: 'error',
                summary: 'Partial Error',
                detail: 'Question saved, but failed to create some risk mappings'
              });
              this.loadQuestions();
            });
        } else {
          this.handleSaveSuccess(qId ? 'updated' : 'created');
        }
      },
      error: () => {
        this.saving.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to save question'
        });
      }
    });
  }

  private handleSaveSuccess(action: string) {
    this.saving.set(false);
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: `Question ${action} successfully`
    });
    this.clearQuestionForm();
    this.loadQuestions();
  }

  // --- Bulk CSV Upload & Sample Template Section ---

  // Trigger Client-side CSV Download
  downloadSampleCSV() {
    const headers = [
      'Question ID',
      'Menu Name',
      'Category Name',
      'Set Name',
      'Set Type',
      'Header Name',
      'Question',
      'Question Type',
      'Input Method',
      'Annexure Name',
      'Subset Names',
      'Applicable To',
      'Broader Area',
      'Business Risk Category',
      'Control Risk Category',
      'Key Aspect',
      'Residual Risk',
      'Show Instances',
      'Auditor Evidence Upload',
      'Compliance Evidence Upload',
      'Risk Type',
      'Mapping Business Risk',
      'Mapping Control Risk'
    ];

    const sampleRow1 = [
      '',
      'PART - A',
      'CASH MANAGEMENT',
      'Operational Audits Set',
      'Main Set',
      'Cash Counter Security',
      'Is the daily cash balance verified by the Branch Manager at end of day?',
      'Qualitative',
      'Yes/No',
      '',
      '',
      'Auditor & Reviewer',
      'CASH MANAGEMENT',
      'Medium Risk',
      'High Risk',
      'Cash Verification',
      'Low Risk',
      '0',
      'Yes',
      'Yes',
      'Yes;No;Not Applicable',
      'LOW RISK;HIGH RISK;MEDIUM RISK',
      'LOW RISK;HIGH RISK;MEDIUM RISK'
    ];

    const sampleRow2 = [
      '',
      'PART - A',
      'CASH MANAGEMENT',
      'Operational Audits Set',
      'Main Set',
      'Vault Security',
      'Are vaults locked using dual control keys and codes recorded safely?',
      'Qualitative',
      'Yes/No',
      '',
      '',
      'Auditor & Reviewer',
      'CASH MANAGEMENT',
      'High Risk',
      'High Risk',
      'Dual Control Keys',
      'Low Risk',
      '0',
      'Yes',
      'Yes',
      'Yes;No',
      'LOW RISK;HIGH RISK',
      'LOW RISK;HIGH RISK'
    ];

    const escapeCSV = (val: string) => {
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    };

    const csvContent = [
      headers.map(escapeCSV).join(','),
      sampleRow1.map(escapeCSV).join(','),
      sampleRow2.map(escapeCSV).join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'quick_questions_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Parse CSV File manually on client
  onCSVFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e: any) => {
      const text = e.target.result;
      const parsedRows = this.parseCSV(text);
      if (parsedRows.length <= 1) {
        this.messageService.add({
          severity: 'error',
          summary: 'Invalid File',
          detail: 'The file appears to be empty or missing headers'
        });
        return;
      }

      this.importErrors.set([]);
      this.importProgress.set(0);
      this.showImportDialog.set(true);
      this.importing.set(true);

      try {
        await this.processImportRows(parsedRows);
      } catch (err: any) {
        this.importErrors.set([...this.importErrors(), `Import aborted: ${err?.message || err}`]);
      } finally {
        this.importing.set(false);
        this.loadSets();
        this.onSetChange(this.selectedSetId());
      }
    };
    reader.readAsText(file);
    // Reset file input
    event.target.value = '';
  }

  // Robust RFC-4180 CSV parser handling quoted strings with commas and escaped quotes
  private parseCSV(text: string): string[][] {
    const result: string[][] = [];
    let row: string[] = [];
    let inQuotes = false;
    let currentValue = '';

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentValue += '"';
          i++; // skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(currentValue.trim());
        currentValue = '';
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++; // skip \n
        }
        row.push(currentValue.trim());
        result.push(row);
        row = [];
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    if (currentValue || row.length > 0) {
      row.push(currentValue.trim());
      result.push(row);
    }
    return result.filter(r => r.length > 0 && r.some(val => val !== ''));
  }

  // Sequentially process each row from the parsed CSV
  private async processImportRows(csvRows: string[][]) {
    const headers = csvRows[0].map(h => h.toLowerCase().trim());
    const dataRows = csvRows.slice(1);
    const total = dataRows.length;

    let lastCreatedQuestionId: number | null = null;
    let lastSetId: number | null = null;
    let lastSetName = '';
    let lastHeaderId: number | null = null;
    let lastHeaderName = '';

    // Fetch menus and categories for fast inline creation and mapping
    let menusList: any[] = [];
    let categoriesList: any[] = [];
    try {
      const menusRes: any = await this.menuService.getMenuMasters().toPromise();
      menusList = (menusRes && Array.isArray(menusRes.rows)) ? menusRes.rows : (Array.isArray(menusRes) ? menusRes : []);

      const cats: any = await this.categoryService.findAll().toPromise();
      categoriesList = (cats && Array.isArray(cats.rows)) ? cats.rows : (Array.isArray(cats) ? cats : (cats?.data ?? []));
    } catch (e) {
      console.error('Failed to fetch menus or categories:', e);
    }

    // Tracking arrays for rollback
    const newlyCreatedSetIds: number[] = [];
    const newlyCreatedHeaderIds: number[] = [];
    const newlyCreatedQuestionIds: number[] = [];
    const processedHeaderIds = new Set<number>();
    const processedQuestionIds = new Set<number>();

    // Cache lookup maps for fast lookups
    const typeMap = this.questionTypes().reduce((acc, t) => {
      acc[t.label.toLowerCase()] = Number(t.value);
      return acc;
    }, {} as Record<string, number>);

    const methodMap = this.inputMethods().reduce((acc, m) => {
      acc[m.label.toLowerCase()] = Number(m.value);
      return acc;
    }, {} as Record<string, number>);

    const applicableMap = this.applicableToOptions().reduce((acc, a) => {
      acc[a.label.toLowerCase()] = Number(a.value);
      return acc;
    }, {} as Record<string, number>);

    const annexureMap = this.annexures().reduce((acc, a) => {
      acc[a.label.toLowerCase()] = Number(a.value);
      return acc;
    }, {} as Record<string, number>);

    const subsetMap = this.subsets().reduce((acc, s) => {
      acc[s.label.toLowerCase()] = Number(s.value);
      return acc;
    }, {} as Record<string, number>);

    const businessRiskMap = this.businessRiskCategories().reduce((acc, r) => {
      acc[r.label.toLowerCase()] = Number(r.value);
      return acc;
    }, {} as Record<string, number>);

    const controlRiskMap = this.controlRiskCategories().reduce((acc, r) => {
      acc[r.label.toLowerCase()] = Number(r.value);
      return acc;
    }, {} as Record<string, number>);

    // Key aspects can reside under multiple key aspect mapping keys.
    // Flatten key aspects for name-based lookup
    const keyAspectMap: Record<string, number> = {};
    Object.keys(this.keyAspectMappings).forEach((catId: string) => {
      const aspectsList = this.keyAspectMappings[catId] ?? [];
      aspectsList.forEach((aspect: any) => {
        keyAspectMap[aspect.label.toLowerCase()] = Number(aspect.value);
      });
    });

    const residualRiskMap = this.residualRisks().reduce((acc, r) => {
      acc[r.label.toLowerCase()] = Number(r.value);
      return acc;
    }, {} as Record<string, number>);

    const auditAreaMap = this.auditAreas().reduce((acc, a) => {
      acc[a.label.toLowerCase()] = Number(a.value);
      return acc;
    }, {} as Record<string, number>);

    let hasError = false;
    let errorToReport = '';

    for (let index = 0; index < total; index++) {
      const row = dataRows[index];
      this.importProgress.set(Math.round(((index + 1) / total) * 100));
      this.importStatusText.set(`Processing row ${index + 1} of ${total}...`);

      // Construct row map
      const rowMap: Record<string, string> = {};
      headers.forEach((h, i) => {
        rowMap[h] = row[i] ?? '';
      });

      const rawSetName = rowMap['set name'] || '';
      const rawHeaderName = rowMap['header name'] || '';
      const rawQuestion = rowMap['question'] || '';

      // Check if this row is a secondary risk mapping for the preceding question
      const isRiskMappingOnly = !rawQuestion && lastCreatedQuestionId != null;

      try {
        if (!isRiskMappingOnly) {
          if (!rawSetName || !rawHeaderName || !rawQuestion) {
            throw new Error('Missing Set Name, Header Name, or Question text');
          }

          // 0. Resolve Menu & Category if provided in columns
          const rawMenuName = rowMap['menu name'] || '';
          const rawCategoryName = rowMap['category name'] || '';
          let menuId: number | null = null;
          let categoryId: number | null = null;

          if (rawMenuName) {
            const existingMenu = menusList.find(m => {
              const mName = m.menu_name || m.name || '';
              return mName.toLowerCase() === rawMenuName.toLowerCase();
            });
            if (existingMenu) {
              menuId = Number(existingMenu.id);
            } else {
              // Create Menu
              const createMenuPayload = {
                section_type_id: 1, // Default section type
                name: rawMenuName.trim().toUpperCase(),
                linked_table_id: 0,
                is_active: 1
              };
              const newMenuRes: any = await this.menuService.createMenuMaster(createMenuPayload).toPromise();
              const newMenu = (newMenuRes && newMenuRes.rows) ? newMenuRes.rows[0] : newMenuRes;
              if (newMenu) {
                menuId = Number(newMenu.id);
              }
              // Refresh list
              const menusRefresh: any = await this.menuService.getMenuMasters().toPromise();
              menusList = (menusRefresh && Array.isArray(menusRefresh.rows)) ? menusRefresh.rows : (Array.isArray(menusRefresh) ? menusRefresh : []);
            }
          }

          if (rawCategoryName && menuId) {
            const existingCat = categoriesList.find(c => (c.name || '').toLowerCase() === rawCategoryName.toLowerCase() && Number(c.menu_id) === menuId);
            if (existingCat) {
              categoryId = Number(existingCat.id);
            } else {
              // Create Category
              const createCatPayload = {
                menu_id: menuId,
                name: rawCategoryName.trim().toUpperCase(),
                linked_table_id: 0,
                question_set_ids: '',
                is_cc_acc_category: 0,
                is_active: 1
              };
              const newCatRes: any = await this.categoryService.create(createCatPayload).toPromise();
              const newCat = (newCatRes && newCatRes.rows) ? newCatRes.rows[0] : newCatRes;
              if (newCat) {
                categoryId = Number(newCat.id);
              }
              // Refresh list
              const cats: any = await this.categoryService.findAll().toPromise();
              categoriesList = (cats && Array.isArray(cats.rows)) ? cats.rows : (Array.isArray(cats) ? cats : (cats?.data ?? []));
            }
          }

          // 1. Resolve Set
          let setId: number | null = lastSetName.toLowerCase() === rawSetName.toLowerCase() ? lastSetId : null;
          if (!setId) {
            const existingSet = this.sets().find(s => s.name.toLowerCase() === rawSetName.toLowerCase());
            if (existingSet) {
              setId = Number(existingSet.id);
            } else {
              // Create set
              const rawSetType = rowMap['set type'] || '';
              const setTypeId = rawSetType.toLowerCase().includes('sub') ? 2 : 1;
              const setRes = await this.service.createSet({ name: rawSetName, set_type_id: setTypeId, is_active: 1 }).toPromise();
              setId = Number(setRes.id);
              newlyCreatedSetIds.push(setId); // Track newly created set

              // Fetch latest sets to keep list up to date
              const updatedSets = await this.service.findAllSets().toPromise();
              this.sets.set(Array.isArray(updatedSets) ? updatedSets : updatedSets?.data ?? []);
            }
            lastSetId = setId;
            lastSetName = rawSetName;
            lastHeaderId = null;
            lastHeaderName = '';
          }

          // Link Question Set to Category
          if (categoryId && setId) {
            const currentCat = categoriesList.find(c => Number(c.id) === categoryId);
            if (currentCat) {
              const setIdsStr = currentCat.question_set_ids || '';
              const setIdsArr = setIdsStr.split(',').map((s: string) => s.trim()).filter(Boolean);
              if (!setIdsArr.includes(String(setId))) {
                setIdsArr.push(String(setId));
                const newSetIdsStr = setIdsArr.join(',');
                await this.categoryService.updateQuestionMapping(categoryId, newSetIdsStr).toPromise();
                // Update the cached category's question_set_ids to avoid repeating updates
                currentCat.question_set_ids = newSetIdsStr;
              }
            }
          }

          // 2. Resolve Header
          let headerId: number | null = lastHeaderName.toLowerCase() === rawHeaderName.toLowerCase() ? lastHeaderId : null;
          if (!headerId) {
            const headersList = await this.service.findHeadersBySet(setId!).toPromise();
            const headersArr = Array.isArray(headersList) ? headersList : headersList?.data ?? [];
            const existingHeader = headersArr.find((h: any) => h.name.toLowerCase() === rawHeaderName.toLowerCase());
            if (existingHeader) {
              headerId = Number(existingHeader.id);
            } else {
              // Create header
              const headerRes = await this.service.createHeader({ question_set_id: setId!, name: rawHeaderName, is_active: 1 }).toPromise();
              headerId = Number(headerRes.id);
              newlyCreatedHeaderIds.push(headerId); // Track newly created header
            }
            lastHeaderId = headerId;
            lastHeaderName = rawHeaderName;
          }

          // 3. Resolve lookups
          const questionType = rowMap['question type'] || '';
          const qTypeId = typeMap[questionType.toLowerCase()] || 1; // Default qualitative

          const inputMethod = rowMap['input method'] || '';
          const optId = methodMap[inputMethod.toLowerCase()] || 2; // Default yes/no

          const annexureName = rowMap['annexure name'] || '';
          const annId = optId === 4 ? (annexureMap[annexureName.toLowerCase()] ?? 0) : 0;

          const subsetsStr = rowMap['subset names'] || '';
          const subIds = optId === 5
            ? subsetsStr.split(',')
                .map(s => s.trim().toLowerCase())
                .map(name => subsetMap[name])
                .filter(Boolean)
                .join(',')
            : '';

          const applicableTo = rowMap['applicable to'] || '';
          const appId = applicableMap[applicableTo.toLowerCase()] || 1; // Default Auditor

          const broaderArea = rowMap['broader area'] || '';
          const areaId = auditAreaMap[broaderArea.toLowerCase()] ?? 0;

          const bRiskCat = rowMap['business risk category'] || '';
          const bRiskId = businessRiskMap[bRiskCat.toLowerCase()] ?? 0;

          const cRiskCat = rowMap['control risk category'] || '';
          const cRiskId = controlRiskMap[cRiskCat.toLowerCase()] ?? 0;

          const keyAspect = rowMap['key aspect'] || '';
          const aspectId = keyAspectMap[keyAspect.toLowerCase()] ?? 0;

          const residualRisk = rowMap['residual risk'] || '';
          const resRiskId = residualRiskMap[residualRisk.toLowerCase()] ?? 0;

          const rawInstances = rowMap['show instances'] || '';
          const instances = Number(rawInstances) || 0;

          const auditorUpload = rowMap['auditor evidence upload'] || '';
          const audEv = auditorUpload.toLowerCase() === 'yes' || auditorUpload === '1' ? 1 : 0;

          const complianceUpload = rowMap['compliance evidence upload'] || '';
          const compEv = complianceUpload.toLowerCase() === 'yes' || complianceUpload === '1' ? 1 : 0;

          // 4. Resolve if Question Already Exists to Prevent Duplication (Supports single character edits)
          const rawQuestionIdStr = rowMap['question id'] || '';
          const rawQuestionId = Number(rawQuestionIdStr);

          // Fetch current questions under this header
          const existingQsList = await this.service.findQuestionsByHeader(headerId!).toPromise();
          const existingQs = Array.isArray(existingQsList) ? existingQsList : (existingQsList?.data ?? []);

          let matchedQuestion: any = null;
          if (rawQuestionId && !isNaN(rawQuestionId)) {
            matchedQuestion = existingQs.find((q: any) => Number(q.id) === rawQuestionId);
          }
          if (!matchedQuestion) {
            // Fallback match: exact text search under this header
            matchedQuestion = existingQs.find((q: any) => q.question.toLowerCase().trim() === rawQuestion.toLowerCase().trim());
          }

          // Build Parameters mapping array if provided
          const riskTypeStr = rowMap['risk type'] || '';
          const mBusinessRiskStr = rowMap['mapping business risk'] || '';
          const mControlRiskStr = rowMap['mapping control risk'] || '';

          let parametersJson: string | undefined = undefined;
          if (riskTypeStr && mBusinessRiskStr && mControlRiskStr) {
            const riskTypes = riskTypeStr.split(';').map(s => s.trim()).filter(Boolean);
            const businessRisks = mBusinessRiskStr.split(';').map(s => s.trim()).filter(Boolean);
            const controlRisks = mControlRiskStr.split(';').map(s => s.trim()).filter(Boolean);

            const brMapInverse: Record<string, number> = { 'HIGH RISK': 1, 'MEDIUM RISK': 2, 'LOW RISK': 3, 'NO RISK': 4 };
            const crMapInverse: Record<string, number> = { 'HIGH RISK': 1, 'MEDIUM RISK': 2, 'LOW RISK': 3, 'NO RISK': 4 };

            const count = Math.max(riskTypes.length, businessRisks.length, controlRisks.length);
            const paramsList = [];
            for (let i = 0; i < count; i++) {
              const rt = riskTypes[i] || '';
              const br = businessRisks[i] || businessRisks[0] || 'NO RISK';
              const cr = controlRisks[i] || controlRisks[0] || 'NO RISK';
              if (rt) {
                paramsList.push({
                  rt: rt.trim(),
                  br: String(brMapInverse[br.toUpperCase()] || 4),
                  cr: String(crMapInverse[cr.toUpperCase()] || 4)
                });
              }
            }
            parametersJson = JSON.stringify(paramsList);
          }

          const questionPayload: any = {
            set_id: setId!,
            header_id: headerId!,
            annexure_id: annId,
            subset_multi_id: subIds,
            question: rawQuestion,
            question_type_id: qTypeId,
            option_id: optId,
            applicable_id: appId,
            area_of_audit_id: areaId,
            control_risk_id: cRiskId,
            key_aspect_id: aspectId,
            residual_risk_id: resRiskId,
            show_instances: instances,
            audit_ev_upload: audEv,
            compliance_ev_upload: compEv,
            risk_category_id: bRiskId,
            is_active: 1
          };

          if (matchedQuestion) {
            // Update existing question
            if (parametersJson !== undefined) {
              questionPayload.parameters = parametersJson;
            }
            await this.service.updateQuestion(matchedQuestion.id, questionPayload).toPromise();
            lastCreatedQuestionId = Number(matchedQuestion.id);
          } else {
            // Create new question
            const questionRes = await this.service.createQuestion(questionPayload).toPromise();
            lastCreatedQuestionId = Number(questionRes.id);
            newlyCreatedQuestionIds.push(lastCreatedQuestionId); // Track newly created question for possible rollbacks

            // For new questions, write parameter mapping separately (backend createQuestion does not map it)
            if (parametersJson !== undefined) {
              const riskTypes = riskTypeStr.split(';').map(s => s.trim()).filter(Boolean);
              const businessRisks = mBusinessRiskStr.split(';').map(s => s.trim()).filter(Boolean);
              const controlRisks = mControlRiskStr.split(';').map(s => s.trim()).filter(Boolean);

              const count = Math.max(riskTypes.length, businessRisks.length, controlRisks.length);
              for (let i = 0; i < count; i++) {
                const rt = riskTypes[i] || '';
                const br = businessRisks[i] || businessRisks[0] || 'NO RISK';
                const cr = controlRisks[i] || controlRisks[0] || 'NO RISK';
                if (rt) {
                  const mappingPayload: CreateQuestionRiskMappingDto = {
                    question_id: lastCreatedQuestionId,
                    risk_type: rt,
                    business_risk: br.toUpperCase(),
                    control_risk: cr.toUpperCase()
                  };
                  await this.service.createRiskMapping(mappingPayload).toPromise();
                }
              }
            }
          }

          // Update main selected set to ensure dashboard matches
          this.selectedSetId.set(setId);
          this.selectedHeaderId.set(headerId);

          processedHeaderIds.add(headerId!);
          if (lastCreatedQuestionId) {
            processedQuestionIds.add(lastCreatedQuestionId);
          }
        }

      } catch (err: any) {
        hasError = true;
        let errMsg = '';
        if (err?.error) {
          if (Array.isArray(err.error.message)) {
            errMsg = err.error.message.join(', ');
          } else if (typeof err.error.message === 'string') {
            errMsg = err.error.message;
          } else if (typeof err.error === 'string') {
            errMsg = err.error;
          }
        }
        if (!errMsg) {
          errMsg = err?.message || err || 'Unknown error';
        }
        errorToReport = `Row ${index + 2}: ${errMsg}`;
        break; // Stop loop execution immediately on error
      }
    }

    if (hasError) {
      this.importProgress.set(0);
      this.importStatusText.set('Error encountered! Rolling back all imported items...');
      this.importErrors.set([errorToReport]);

      // Rollback newly created questions in reverse order
      for (const qId of newlyCreatedQuestionIds) {
        try {
          await this.service.removeQuestion(qId).toPromise();
        } catch (e) {
          console.error(`Failed to rollback question ${qId}:`, e);
        }
      }

      // Rollback newly created headers
      for (const hId of newlyCreatedHeaderIds) {
        try {
          await this.service.removeHeader(hId).toPromise();
        } catch (e) {
          console.error(`Failed to rollback header ${hId}:`, e);
        }
      }

      // Rollback newly created sets
      for (const sId of newlyCreatedSetIds) {
        try {
          await this.service.removeSet(sId).toPromise();
        } catch (e) {
          console.error(`Failed to rollback set ${sId}:`, e);
        }
      }

      this.importStatusText.set('Import failed and all changes were rolled back.');
      this.messageService.add({
        severity: 'error',
        summary: 'Import Failed',
        detail: 'Rollback completed. No questions were added.'
      });

      // Throw to let the caller handle UI state reset in its finally block
      throw new Error(errorToReport);
    } else {
      this.importStatusText.set('Reconciling questions with database...');
      // Perform reconciliation: delete questions that were removed from the CSV
      for (const hId of Array.from(processedHeaderIds)) {
        try {
          const dbQsList = await this.service.findQuestionsByHeader(hId).toPromise();
          const dbQs = Array.isArray(dbQsList) ? dbQsList : (dbQsList?.data ?? []);
          
          for (const dbQ of dbQs) {
            const dbQId = Number(dbQ.id);
            if (!processedQuestionIds.has(dbQId)) {
              // This question was in the DB but is not in the uploaded CSV -> delete/remove it
              await this.service.removeQuestion(dbQId).toPromise();
            }
          }
        } catch (err) {
          console.error(`Failed to reconcile questions for header ${hId}:`, err);
        }
      }

      this.importStatusText.set('Bulk Upload Completed!');
      this.messageService.add({
        severity: 'success',
        summary: 'Import Complete',
        detail: `Processed ${total} rows successfully.`
      });
    }
  }
}
