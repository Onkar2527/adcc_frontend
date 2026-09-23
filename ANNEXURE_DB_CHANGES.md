# Database Changes Documentation for Annexure & Form Annexure

This document details all PostgreSQL schema alterations, column additions, and seed updates required for the **Annexure & Form Annexure** feature.

---

## 1. Schema Alterations (`annexure_master`)

The `annexure_master` table has been extended to support dynamic layout types (`grid` vs. `form`) and multi-column matrix configurations.

```sql
-- 1. Add layout_type column (default to 'grid' for existing standard annexures)
ALTER TABLE annexure_master 
ADD COLUMN IF NOT EXISTS layout_type VARCHAR(50) DEFAULT 'grid';

-- 2. Add matrix_columns column to store JSON structure for form annexure headers & inputs
ALTER TABLE annexure_master 
ADD COLUMN IF NOT EXISTS matrix_columns JSONB DEFAULT '[]'::jsonb;
```

---

## 2. Matrix Columns Configuration Format

When `layout_type = 'form'`, `matrix_columns` stores an array of column definitions in JSON format.

### Example: 6-Column Standard Agriculture / Non-Agri Matrix Setup

```sql
UPDATE annexure_master 
SET 
    layout_type = 'form',
    matrix_columns = '[
        {
            "key": "limit",
            "label": "मंजूर मर्यादा (Limit)",
            "type": "number"
        },
        {
            "key": "dp",
            "label": "ड्रॉईंग पॉवर (DP)",
            "type": "number"
        },
        {
            "key": "balance",
            "label": "चालू बाकी (Balance)",
            "type": "number"
        },
        {
            "key": "overdue",
            "label": "थकबाकी (Overdue)",
            "type": "number"
        },
        {
            "key": "npa",
            "label": "NPA वर्गवारी",
            "type": "select",
            "options": [
                "Standard (नियमित)",
                "SMA-0",
                "SMA-1",
                "SMA-2",
                "Substandard (अनुत्पादक)",
                "Doubtful (संशयास्पद)",
                "Loss (बुडीत)"
            ]
        },
        {
            "key": "remark",
            "label": "शेरा (Remarks)",
            "type": "text"
        }
    ]'::jsonb
WHERE id = 36; -- Change ID according to your specific annexure ID
```

---

## 3. Verification Queries

Run the following queries to verify that your PostgreSQL database has the changes applied:

```sql
-- Check columns exist in annexure_master
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'annexure_master' 
  AND column_name IN ('layout_type', 'matrix_columns');

-- Check sample records
SELECT id, name, layout_type, matrix_columns 
FROM annexure_master 
LIMIT 5;
```

---

## 4. Affected Application Flows

1. **Annexure Master (`audit-annexure-master`)**: Admin can define whether an Annexure is a standard Grid or a Form Annexure with custom matrix columns.
2. **Category Assessment (`internal-audit`)**: Auditor sees dynamic tabbed matrix form when answering question linked to a form annexure.
3. **Compliance Workspace (`compliance-workspace`)**: Branch compliance login renders and validates the form annexure answers.
4. **Reviewer Workspace (`reviewer-workspace`)**: Reviewers can inspect and verify filled form annexure tables.
5. **Reports (`report-viewer` & `reports.service`)**: Final audit reports render the tabular matrix representation.
