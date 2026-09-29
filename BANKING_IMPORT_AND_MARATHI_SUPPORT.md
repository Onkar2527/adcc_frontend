# ADCC Banking 21 Categories Import & Marathi Bilingual Support

## 1. Overview
This document summarizes the complete database structure, category imports, annexure mappings, and real-time Marathi bilingual translation support implemented for the ADCC Internal Audit module.

---

## 2. Database Changes & Structure

### A. New Banking Menu & Categories (Branch Section)
- **Menu ID**: `50`
  - **English Name**: `Banking`
  - **Marathi Name (`mr_name`)**: `बँकिंग`
  - **Section Type ID**: `1` (`BRANCH`)
- **Categories Created**: IDs `9134` to `9154` (21 Categories):
  1. Cash and Cash Equivalents (`रोख व रोख समतुल्य (कॅश)`)
  2. Account Opening (`खाते उघडणे`)
  3. Deposits (`ठेवी`)
  4. Matured Deposits (`मुदतपूर्ती झालेल्या ठेवी`)
  5. Account Closing Register (`अकौंट क्लोजिंग रजिस्टर`)
  6. KYC (`केवायसी`)
  7. Nominee Register (`वारस नोंदी रजिस्टर`)
  8. Death Claim (`मयत वारस (मृत्यू दावा)`)
  9. 197 TDS (`१९७ टी.डी.एस.`)
  10. TDS (`टी.डी.एस.`)
  11. Clearing Register / Inward / Outward (`क्लियरिंग रजिस्टर / इनवर्ड / आउटवर्ड`)
  12. Cheque Book Issue Register (`चेक बुक इश्यू रजिस्टर`)
  13. Cheque Returned Charges Register (`चेक रिटर्न चार्जेस रजिस्टर`)
  14. Daily Operations (`दैनंदिन कामकाज`)
  15. CTS Clearing (`सी.टी.एस. क्लियरिंग`)
  16. Stationery (`स्टेशनरी`)
  17. Locker Operations (`लॉकर कामकाज`)
  18. ATM Operations (`एटीएम कामकाज`)
  19. Suspense Accounts & Sundry (`सस्पेन्स अकौंट्स व संड्री`)
  20. Clean Cash & Cheque (`क्लिन कॅश व चेक`)
  21. Staff & Other General (`कर्मचारी व इतर सर्वसाधारण`)

### B. Questions, Question Sets & Headers
- **Question Sets**: 21 Sets (IDs `971` to `991`) with pure English `name` and Marathi `mr_name`.
- **Question Headers**: 219 Headers with pure English `name` and Marathi `mr_name`.
- **Questions**: 1,008 Questions inserted with:
  - English `question` & Marathi `mr_question`
  - Parameter JSON (`rt`, `mr_rt`, `br`, `cr`)
  - Compulsory evidence upload flags & suggestions

### C. Annexures & Dynamic Layouts
- **Annexures**: 64 Annexures created (`annexure_master` IDs `283` to `347`).
- **Annexure Columns**: 247 Columns created in `annexure_columns` table (`name`, `mr_name`, `column_type_id`, `column_options`).
- **Dropdown Options**: Populated in `annexure_column_options` (`option_label`, `mr_option_label`).
- **Layouts**: 
  - **Grid Layout**: 60 Annexures use `matrix` / `grid` layout.
  - **Form Layout**: 4 Annexures use `layout_type = 'form'` (`Cat16_Staff`, `Cat6_KYC`, `Cat13_Lockers`, and Question 16689 Section 197 TDS).

### D. Bilingual Reference Tables (10 Added Question Sets & Annexures)
- **Vertical Form Tables (Predefined Row Items & Matrix Value Columns)**:
  1. `Cat3_Deposits` (Annexure `339`, `form`):
     - **Particulars (Rows)**: `करंट ठेवी / Current Deposits`, `सेव्हिंग्ज / Savings`, `मुदत ठेवी / Term Deposits`, `कॅश सर्टिफिकेट / Cash Certificate`, `रिकरिंग / Recurring`, `एकूण / Total`
     - **Matrix Columns**: `दि. 31/03/____ / As on 31/03/____`, `मागील तपासणी अखेर दि. / Previous Audit Closing Date`, `चालू तपासणी दि. अखेर / Current Audit Closing Date`
  2. `Cat3_Inoperative` (Annexure `342`, `form`):
     - **Particulars (Rows)**: `इनऑपरेटिव्ह खाते / Inoperative Accounts`, `अनक्लेम्ड खाते / Unclaimed Accounts`
     - **Matrix Columns**: `जमा रक्कम रु. / Deposit Amount (₹)`, `खाते संख्या / No. of Accounts`
  3. `Cat10_TDS` (Annexure `341`, `form`):
     - **Particulars (Rows)**: `टी.डी.एस. पेएबल (४२२) / TDS Payable (422)`, `टी.डी.एस. रिकव्हरी (४२१) / TDS Recovery (421)`
     - **Matrix Columns**: `बाकी रु. / Balance (₹)`
  4. `Cat16_Staff` (Annexure `338`, `form`):
     - **Particulars (Rows)**: `शाखाधिकारी`, `अकाउंटंट`, `इन्स्पेक्टर`, `कॅशिअर`, `क्लार्क`, `कायम शिपाई`, `कायम नसलेला शिपाई`
     - **Matrix Columns**: `सेवक संख्या / Staff Strength Count`
  5. `Cat6_KYC` (Annexure `340`, `form`):
     - **Particulars (Rows)**: `एकूण खातेदार`, `ऑपरेटिव्ह खाते`, `के.वाय.सी. पूर्ण खाते`, `के.वाय.सी. अपूर्ण खाते`
     - **Matrix Columns**: `खाती संख्या / No. of Accounts`
  6. `Cat13_Lockers` (Annexure `343`, `form`):
     - **Particulars (Rows)**: `एकूण लॉकरस्`, `भाड्याने दिलेले`, `शिल्लक लॉकरस्`, `नादुरुस्त लॉकरस्`, `थकित भाडे रु.`, `थकितभाडे लॉकर धारक`
     - **Matrix Columns**: `संख्या / रक्कम (Count / Amount)`
  7. `CTS_LC_OBC` (Annexure `345`, `form`):
     - **Particulars (Rows)**: `बी.सी. / BC`, `आय.बी. / IB`, `आय.बी.पी. / IBP`
     - **Matrix Columns**: `प्रलंबित संख्या / Pending Count`, `रक्कम रु. / Amount (₹)`
  8. `Cat19_Reconciliation` (Annexure `346`, `form`):
     - **Particulars (Rows)**: `हेड ऑफिस / Head Office`, `एम.एस.सी. बँक / M.S.C. Bank`, `स्टेट बँक / State Bank`
     - **Matrix Columns**: `दिनांक – आर.सी. मुख्यालयास पाठविला / Date – R.C. Sent to Head Office`
  9. `Cat16_Inspection` (Annexure `347`, `form`):
     - **Particulars (Rows)**: `सी.ए. वैधानिक तपासणी`, `सतत व समवर्ती लेखापरीक्षण`, `समवर्ती गंभीर दोष`, `राज्य बँक तपासणी`, `व्यवस्थापकीय तपासणी`, `ता.वि.अ. तपासणी`, `ताळेबंद तपासणी`, `अचानक भेट`, `इतर तपासणी`
     - **Matrix Columns**: `तपासणी कालावधी`, `शाखेस अहवाल प्राप्त दिनांक`, `शाखेने दोष दुरुस्ती अहवाल पाठविल्याचा दिनांक`

- **Dynamic Table Grid (Add Rows Dynamically)**:
  10. `Cat12_GoldLoan` (Annexure `344`, `grid`):
      - **Columns**: `पिशवी नं. / Bag No.`, `रजिस्टरप्रमाणे बरोबर आढळल्या आहेत/नाहीत (YES/NO)`, `येणे बाकी रु.`, `थकबाकी रु. दि. अखेर`

### E. Assessment & Scope Linking
- 13 Branch assessments updated with `menu_ids = '50'` and `cat_ids = '9134,9135,...,9154'`.
- Akole Branch (Assessment ID `38`, Multi-Level Control ID `78`, Unit ID `1029`) linked and verified.

---

## 3. Frontend & Language Reactivity Patches

### A. Immediate Language Switching Without Refresh
- **`OfflineTranslationService`** (`src/app/core/services/offline-translation.service.ts`):
  - Emits on `language$` BehaviorSubject and triggers `app-language-changed` window event upon selection in the topbar dropdown.
- **Sidebar Menu (`app.menu.ts`)**:
  - Subscribes to `language$` and `app-language-changed`.
  - Invalidate cache key (`assessmentMenuKey`) including `selectedLang` and `mr_name`.
  - Translates `मूल्यांकन माहिती` (Assessment Info), `कार्यकारी सारांश` (Executive Summary), `वर्तमान मूल्यांकन` (Current Assessment), and progress counts (`X/Y उत्तरे दिली, Z शिल्लक`).
- **Assessment Workspace (`assessment-workspace.component.ts`)**:
  - Smoothly refreshes menus in background on language switch without triggering full-page skeleton unmounting (`showLoader = false`).
- **Category Assessment (`category-assessment.component.ts` & `.html`)**:
  - Listens for language change and re-fetches questions in real time with `language_id = 2` (Marathi) or `1` (English).
  - Translates category buttons (`सर्व हेडरवर डीफॉल्ट लागू करा`, `सर्व हेडर जतन करा`, `डीफॉल्ट लागू करा`), badge metrics (`उत्तरे दिली: X / Y`, `शिल्लक: Z`), checkbox labels (`अनुपालन आवश्यक`, `पुरावा अपलोड करणे आवश्यक`), textarea placeholders (`ऑडिट टिप्पणी`), and parameter options (`होय`, `नाही`, `लागू नाही`, `परिशिष्टानुसार`, `इतर त्रुटी`).

---

## 4. Backend Service Updates

- **`internal-audit.service.ts` & `internal-audit.service.js` (dist)**:
  - Added `mr_menu_name` and `mr_category_name` in `getMenu` query.
  - Added distinct aliases `qsm.mr_name AS set_mr_name` and `qhm.mr_name AS header_mr_name` in `getCategory` `questionResult` query to prevent SQL name collisions.
  - Mapped Marathi titles in `groupCategoryQuestions` for sets and headers.
