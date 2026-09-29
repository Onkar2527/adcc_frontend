const { Client } = require('d:/adcc-auditpro/adcc_audit_backend/node_modules/pg');

const client = new Client({
  host: 'db.kredpool.ai',
  port: 5432,
  user: 'postgres',
  password: 'dms@kredpool450',
  database: 'adcc_auditpro',
  ssl: false
});

const referenceConfigs = [
  // ==========================================
  // GROUP A: BOTH ROWS & COLUMNS -> 'form'
  // ==========================================

  // 1. Deposits (Cat3_Deposits) -> Annexure ID 339
  {
    annexureId: 339,
    layoutType: 'form',
    name: 'Deposits Position Matrix',
    mrName: 'ठेवींची स्थिती माहिती पत्रक',
    matrixColumns: [
      { key: 'col_1', label: 'As on 31/03/____', mr_label: 'दि. ३१/०३/____ अखेर', type: 'number' },
      { key: 'col_2', label: 'Previous Audit Closing Date', mr_label: 'मागील तपासणी अखेर दि.', type: 'number' },
      { key: 'col_3', label: 'Current Audit Closing Date', mr_label: 'चालू तपासणी दि. अखेर', type: 'number' }
    ],
    annexureColumns: [
      { name: 'Current Deposits', mr_name: 'करंट ठेवी', type_id: 1 },
      { name: 'Savings', mr_name: 'सेव्हिंग्ज', type_id: 1 },
      { name: 'Term Deposits', mr_name: 'मुदत ठेवी', type_id: 1 },
      { name: 'Cash Certificate', mr_name: 'कॅश सर्टिफिकेट', type_id: 1 },
      { name: 'Recurring', mr_name: 'रिकरिंग', type_id: 1 },
      { name: 'Total', mr_name: 'एकूण', type_id: 1 }
    ]
  },

  // 2. Inoperative & Unclaimed (Cat3_Inoperative) -> Annexure ID 342
  {
    annexureId: 342,
    layoutType: 'form',
    name: 'Inoperative & Unclaimed Accounts',
    mrName: 'इनऑपरेटिव्ह व अनक्लेम्ड खाते',
    matrixColumns: [
      { key: 'col_1', label: 'Deposit Amount (₹)', mr_label: 'जमा रक्कम रु.', type: 'number' },
      { key: 'col_2', label: 'No. of Accounts', mr_label: 'खाते संख्या', type: 'number' }
    ],
    annexureColumns: [
      { name: 'Inoperative Accounts', mr_name: 'इनऑपरेटिव्ह खाते', type_id: 1 },
      { name: 'Unclaimed Accounts', mr_name: 'अनक्लेम्ड खाते', type_id: 1 }
    ]
  },

  // 3. TDS Accounts (Cat10_TDS) -> Annexure ID 341
  {
    annexureId: 341,
    layoutType: 'form',
    name: 'TDS Accounts Balance',
    mrName: 'टी.डी.एस. खाती शिल्लक',
    matrixColumns: [
      { key: 'col_1', label: 'Balance (₹)', mr_label: 'बाकी रु.', type: 'number' }
    ],
    annexureColumns: [
      { name: 'TDS Payable (422)', mr_name: 'टी.डी.एस. पेएबल (४२२)', type_id: 1 },
      { name: 'TDS Recovery (421)', mr_name: 'टी.डी.एस. रिकव्हरी (४२१)', type_id: 1 }
    ]
  },

  // 4. CTS – LC – BC (CTS_LC_OBC) -> Annexure ID 345
  {
    annexureId: 345,
    layoutType: 'form',
    name: 'BC / IB / IBP Pending Position',
    mrName: 'बी.सी. / आय.बी. / आय.बी.पी. प्रलंबित स्थिती',
    matrixColumns: [
      { key: 'col_1', label: 'Pending Count', mr_label: 'प्रलंबित संख्या', type: 'number' },
      { key: 'col_2', label: 'Amount (₹)', mr_label: 'रक्कम रु.', type: 'number' }
    ],
    annexureColumns: [
      { name: 'BC', mr_name: 'बी.सी.', type_id: 1 },
      { name: 'IB', mr_name: 'आय.बी.', type_id: 1 },
      { name: 'IBP', mr_name: 'आय.बी.पी.', type_id: 1 }
    ]
  },

  // 5. Reconciliation (Cat19_Reconciliation) -> Annexure ID 346
  {
    annexureId: 346,
    layoutType: 'form',
    name: 'R.C. Reconciliation Sent Dates',
    mrName: 'आर.सी. पाठविल्याचे दिनांक',
    matrixColumns: [
      { key: 'col_1', label: 'Date R.C. Sent to Head Office', mr_label: 'दिनांक – आर.सी. मुख्यालयास पाठविला', type: 'date' }
    ],
    annexureColumns: [
      { name: 'Head Office', mr_name: 'हेड ऑफिस', type_id: 1 },
      { name: 'M.S.C. Bank', mr_name: 'एम.एस.सी. बँक', type_id: 1 },
      { name: 'State Bank', mr_name: 'स्टेट बँक', type_id: 1 }
    ]
  },

  // 6. Branch Inspection Register (Cat16_Inspection) -> Annexure ID 347
  {
    annexureId: 347,
    layoutType: 'form',
    name: 'Branch Inspection Register',
    mrName: 'शाखा तपासणी रजिस्टर',
    matrixColumns: [
      { key: 'col_1', label: 'Inspection Period', mr_label: 'तपासणी कालावधी', type: 'text' },
      { key: 'col_2', label: 'Date Report Received by Branch', mr_label: 'शाखेस अहवाल प्राप्त दिनांक', type: 'date' },
      { key: 'col_3', label: 'Date Branch Sent Rectification Report', mr_label: 'शाखेने दोष दुरुस्ती अहवाल पाठविल्याचा दिनांक', type: 'date' }
    ],
    annexureColumns: [
      { name: 'C.A. Statutory Audit', mr_name: 'सी.ए. वैधानिक तपासणी', type_id: 1 },
      { name: 'Continuous & Concurrent Audit', mr_name: 'सतत व समवर्ती लेखापरीक्षण', type_id: 1 },
      { name: 'Serious Defects in Continuous & Concurrent Audit', mr_name: 'समवर्ती गंभीर दोष', type_id: 1 },
      { name: 'State Bank Inspection', mr_name: 'राज्य बँक तपासणी', type_id: 1 },
      { name: 'Managerial Inspection', mr_name: 'व्यवस्थापकीय तपासणी', type_id: 1 },
      { name: 'T.V.A. Inspection', mr_name: 'ता.वि.अ. तपासणी', type_id: 1 },
      { name: 'Balance Sheet Inspection', mr_name: 'ताळेबंद तपासणी', type_id: 1 },
      { name: 'Surprise Visit', mr_name: 'अचानक भेट', type_id: 1 },
      { name: 'Other Inspection', mr_name: 'इतर तपासणी', type_id: 1 }
    ]
  },

  // ==========================================
  // GROUP B: ONLY COLUMNS (NO FIXED ROWS) -> 'grid'
  // ==========================================

  // 7. Lockers (Cat13_Lockers) -> Annexure ID 343 -> 'grid'
  {
    annexureId: 343,
    layoutType: 'grid',
    name: 'Lockers Status',
    mrName: 'लॉकरस् स्थिती',
    matrixColumns: [
      { key: 'col_1', label: 'Total Lockers', mr_label: 'एकूण लॉकरस्', type: 'number' },
      { key: 'col_2', label: 'Lockers Rented Out', mr_label: 'भाड्याने दिलेले', type: 'number' },
      { key: 'col_3', label: 'Vacant Lockers', mr_label: 'शिल्लक लॉकरस्', type: 'number' },
      { key: 'col_4', label: 'Defective Lockers', mr_label: 'नादुरुस्त लॉकरस्', type: 'number' },
      { key: 'col_5', label: 'Outstanding Rent (₹)', mr_label: 'थकित भाडे रु.', type: 'number' },
      { key: 'col_6', label: 'Locker Holders with Outstanding Rent', mr_label: 'थकितभाडे लॉकर धारक संख्या', type: 'number' }
    ],
    annexureColumns: [
      { name: 'Total Lockers', mr_name: 'एकूण लॉकरस्', type_id: 1 },
      { name: 'Lockers Rented Out', mr_name: 'भाड्याने दिलेले', type_id: 1 },
      { name: 'Vacant Lockers', mr_name: 'शिल्लक लॉकरस्', type_id: 1 },
      { name: 'Defective Lockers', mr_name: 'नादुरुस्त लॉकरस्', type_id: 1 },
      { name: 'Outstanding Rent (₹)', mr_name: 'थकित भाडे रु.', type_id: 1 },
      { name: 'Locker Holders with Outstanding Rent', mr_name: 'थकितभाडे लॉकर धारक संख्या', type_id: 1 }
    ]
  },

  // 8. KYC Status (Cat6_KYC) -> Annexure ID 340 -> 'grid'
  {
    annexureId: 340,
    layoutType: 'grid',
    name: 'KYC Status',
    mrName: 'के.वाय.सी. स्थिती',
    matrixColumns: [
      { key: 'col_1', label: 'Total Account Holders', mr_label: 'एकूण खातेदार', type: 'number' },
      { key: 'col_2', label: 'Operative Accounts', mr_label: 'ऑपरेटिव्ह खाते', type: 'number' },
      { key: 'col_3', label: 'KYC Completed Accounts', mr_label: 'के.वाय.सी. पूर्ण खाते', type: 'number' },
      { key: 'col_4', label: 'KYC Incomplete Accounts', mr_label: 'के.वाय.सी. अपूर्ण खाते', type: 'number' }
    ],
    annexureColumns: [
      { name: 'Total Account Holders', mr_name: 'एकूण खातेदार', type_id: 1 },
      { name: 'Operative Accounts', mr_name: 'ऑपरेटिव्ह खाते', type_id: 1 },
      { name: 'KYC Completed Accounts', mr_name: 'के.वाय.सी. पूर्ण खाते', type_id: 1 },
      { name: 'KYC Incomplete Accounts', mr_name: 'के.वाय.सी. अपूर्ण खाते', type_id: 1 }
    ]
  },

  // 9. Branch Staff Strength (Cat16_Staff) -> Annexure ID 338 -> 'grid'
  {
    annexureId: 338,
    layoutType: 'grid',
    name: 'Branch Staff Strength',
    mrName: 'शाखेतील सेवक संख्या',
    matrixColumns: [
      { key: 'col_1', label: 'Branch Manager / Officer', mr_label: 'शाखाधिकारी', type: 'number' },
      { key: 'col_2', label: 'Accountant', mr_label: 'अकाउंटंट', type: 'number' },
      { key: 'col_3', label: 'Inspector', mr_label: 'इन्स्पेक्टर', type: 'number' },
      { key: 'col_4', label: 'Cashier', mr_label: 'कॅशिअर', type: 'number' },
      { key: 'col_5', label: 'Clerk', mr_label: 'क्लार्क', type: 'number' },
      { key: 'col_6', label: 'Permanent Peon', mr_label: 'कायम शिपाई', type: 'number' },
      { key: 'col_7', label: 'Non-Permanent Peon', mr_label: 'कायम नसलेला शिपाई', type: 'number' }
    ],
    annexureColumns: [
      { name: 'Branch Manager / Officer', mr_name: 'शाखाधिकारी', type_id: 1 },
      { name: 'Accountant', mr_name: 'अकाउंटंट', type_id: 1 },
      { name: 'Inspector', mr_name: 'इन्स्पेक्टर', type_id: 1 },
      { name: 'Cashier', mr_name: 'कॅशिअर', type_id: 1 },
      { name: 'Clerk', mr_name: 'क्लार्क', type_id: 1 },
      { name: 'Permanent Peon', mr_name: 'कायम शिपाई', type_id: 1 },
      { name: 'Non-Permanent Peon', mr_name: 'कायम नसलेला शिपाई', type_id: 1 }
    ]
  },

  // 10. Gold Loan (Cat12_GoldLoan) -> Annexure ID 344 -> 'grid'
  {
    annexureId: 344,
    layoutType: 'grid',
    name: 'Gold Loan Physical Verification',
    mrName: 'सोने तारण कर्ज प्रत्यक्ष तपासणी',
    matrixColumns: [
      { key: 'col_1', label: 'Bag No.', mr_label: 'पिशवी नं.', type: 'text' },
      { key: 'col_2', label: 'Found Correct as per Register (Yes/No)', mr_label: 'रजिस्टरप्रमाणे बरोबर आढळल्या आहेत/नाहीत', type: 'select', options: ['YES', 'NO'], mr_options: ['होय', 'नाही'] },
      { key: 'col_3', label: 'Amount Receivable (₹)', mr_label: 'येणे बाकी रु.', type: 'number' },
      { key: 'col_4', label: 'Outstanding Amount as on Date (₹)', mr_label: 'थकबाकी रु. दि. अखेर', type: 'number' }
    ],
    annexureColumns: [
      { name: 'Bag No.', mr_name: 'पिशवी नं.', type_id: 1 },
      { name: 'Found Correct as per Register (Yes/No)', mr_name: 'रजिस्टरप्रमाणे बरोबर आढळल्या आहेत/नाहीत', type_id: 3, options: ['YES', 'NO'], mr_options: ['होय', 'नाही'] },
      { name: 'Amount Receivable (₹)', mr_name: 'येणे बाकी रु.', type_id: 1 },
      { name: 'Outstanding Amount as on Date (₹)', mr_name: 'थकबाकी रु. दि. अखेर', type_id: 1 }
    ]
  }
];

async function applyGridFormRules() {
  await client.connect();
  console.log('--- APPLYING STRICT GRID VS FORM RULES ---');

  for (const cfg of referenceConfigs) {
    console.log(`\nConfiguring Annexure ID ${cfg.annexureId}: ${cfg.name} (Layout: '${cfg.layoutType}')`);

    // 1. Update annexure_master
    await client.query(`
      UPDATE annexure_master 
      SET name = $1, mr_name = $2, layout_type = $3, matrix_columns = $4, updated_at = NOW()
      WHERE id = $5
    `, [cfg.name, cfg.mrName, cfg.layoutType, JSON.stringify(cfg.matrixColumns), cfg.annexureId]);

    // 2. Update annexure_columns
    await client.query("DELETE FROM annexure_columns WHERE annexure_id = $1", [cfg.annexureId]);

    for (const col of cfg.annexureColumns) {
      const colOptions = col.options
        ? JSON.stringify(col.options.map(o => ({ column_option: o })))
        : '[{"column_option":""}]';

      await client.query(`
        INSERT INTO annexure_columns (annexure_id, name, mr_name, column_type_id, column_options, admin_id, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, 1, NOW(), NOW())
      `, [cfg.annexureId, col.name, col.mr_name, col.type_id || 1, colOptions]);
    }

    console.log(`  -> Configured as '${cfg.layoutType}' with ${cfg.annexureColumns.length} columns.`);
  }

  console.log('\n--- ALL 10 ANNEXURES CONFIGURED CORRECTLY ACCORDING TO GRID & FORM RULES! ---');
  await client.end();
}

applyGridFormRules().catch(console.error);
