const XLSX = require('xlsx');
const fs = require('fs');
const csv = require('csv-parser');
const { Candidate, ImportBatch } = require('../models');
const TimelineService = require('../services/timelineService');

// Step 1: Upload file and get preview + columns
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const filePath = req.file.path;
    const fileType = req.file.originalname.match(/\.csv$/i) ? 'csv' : 'excel';
    let headers = [];
    let preview = [];

    if (fileType === 'excel') {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      headers = data[0] || [];
      preview = data.slice(1, 11).map(row => {
        const obj = {};
        headers.forEach((h, i) => { obj[h] = row[i]; });
        return obj;
      });
    } else {
      // CSV
      const rows = [];
      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('headers', (h) => { headers = h; })
          .on('data', (row) => { if (rows.length < 10) rows.push(row); })
          .on('end', resolve)
          .on('error', reject);
      });
      preview = rows;
    }

    // Create import batch record
    const batch = new ImportBatch({
      fileName: req.file.originalname,
      fileType,
      uploadedBy: req.user._id,
      status: 'mapping',
    });
    await batch.save();

    // System fields that can be mapped
    const systemFields = [
      { key: 'fullName', label: 'Full Name', required: true },
      { key: 'phone', label: 'Phone / WhatsApp Number', required: true },
      { key: 'alternatePhone', label: 'Alternate Phone', required: false },
      { key: 'email', label: 'Email', required: false },
      { key: 'qualification', label: 'Qualification', required: false },
      { key: 'experienceYears', label: 'Experience (Years)', required: false },
      { key: 'currentCity', label: 'Current City', required: false },
      { key: 'currentState', label: 'Current State', required: false },
      { key: 'dateOfBirth', label: 'Date of Birth', required: false },
      { key: 'gender', label: 'Gender', required: false },
      { key: 'certifications', label: 'Certifications', required: false },
    ];

    res.json({
      batchId: batch._id,
      filePath,
      fileType,
      headers,
      preview,
      systemFields,
      totalRows: fileType === 'excel'
        ? XLSX.utils.sheet_to_json(XLSX.readFile(filePath).Sheets[XLSX.readFile(filePath).SheetNames[0]]).length
        : 'counting...',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Step 2: Process import with column mapping
exports.processImport = async (req, res) => {
  try {
    const { batchId, filePath, fileType, columnMapping } = req.body;
    // columnMapping: { "fullName": "Candidate Name", "phone": "Mobile No", ... }

    const batch = await ImportBatch.findById(batchId);
    if (!batch) return res.status(404).json({ error: 'Import batch not found' });

    batch.columnMapping = columnMapping;
    batch.status = 'processing';
    await batch.save();

    // Read all data
    let rows = [];
    if (fileType === 'excel') {
      const wb = XLSX.readFile(filePath);
      rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
    } else {
      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', (row) => rows.push(row))
          .on('end', resolve)
          .on('error', reject);
      });
    }

    batch.totalRows = rows.length;
    const results = { imported: 0, duplicates: 0, errors: 0, blacklisted: 0, errorDetails: [] };

    for (let i = 0; i < rows.length; i++) {
      try {
        const row = rows[i];
        const mapped = {};

        // Map columns
        for (const [sysField, fileCol] of Object.entries(columnMapping)) {
          if (fileCol && row[fileCol] !== undefined && row[fileCol] !== '') {
            mapped[sysField] = String(row[fileCol]).trim();
          }
        }

        if (!mapped.fullName || !mapped.phone) {
          results.errors++;
          results.errorDetails.push({ row: i + 2, error: 'Missing name or phone' });
          continue;
        }

        // Clean phone
        let phone = mapped.phone.replace(/[\s\-\+\(\)]/g, '');
        if (phone.startsWith('91') && phone.length === 12) phone = phone.slice(2);
        if (phone.length !== 10) {
          results.errors++;
          results.errorDetails.push({ row: i + 2, error: `Invalid phone: ${mapped.phone}` });
          continue;
        }

        // Check duplicate
        const existing = await Candidate.findOne({ phone });
        if (existing) {
          if (existing.blacklisted) { results.blacklisted++; continue; }
          results.duplicates++;
          continue;
        }

        // Normalize qualification
        const qualMap = {
          'iti electrical': 'ITI_Electrical', 'iti electrician': 'ITI_Electrical', 'iti - electrical': 'ITI_Electrical',
          'iti other': 'ITI_Other', 'iti': 'ITI_Other',
          'diploma electrical': 'Diploma_Electrical', 'diploma': 'Diploma_Other',
          'b.tech': 'BTech_Electrical', 'btech': 'BTech_Electrical', 'b.tech electrical': 'BTech_Electrical',
          'bsc': 'BSc', '12th': 'HSC', 'hsc': 'HSC', '10th': '10th',
        };
        const qualLower = (mapped.qualification || '').toLowerCase().trim();
        const qualification = qualMap[qualLower] || 'Other';

        const candidate = new Candidate({
          fullName: mapped.fullName,
          phone,
          alternatePhone: mapped.alternatePhone,
          email: mapped.email,
          qualification,
          experienceYears: parseInt(mapped.experienceYears) || 0,
          currentLocation: {
            city: mapped.currentCity || '',
            state: mapped.currentState || '',
          },
          dateOfBirth: mapped.dateOfBirth ? new Date(mapped.dateOfBirth) : undefined,
          gender: mapped.gender,
          source: fileType === 'csv' ? 'CSV' : 'Excel',
          sourceDetail: batch.fileName,
          importBatchId: batch._id.toString(),
          importRowNumber: i + 2,
          status: 'New',
          consentCaptured: false,
        });

        await candidate.save();
        results.imported++;
      } catch (err) {
        results.errors++;
        results.errorDetails.push({ row: i + 2, error: err.message });
      }
    }

    batch.importedRows = results.imported;
    batch.duplicateRows = results.duplicates;
    batch.errorRows = results.errors;
    batch.blacklistedRows = results.blacklisted;
    batch.errors = results.errorDetails.slice(0, 100); // store first 100 errors
    batch.status = 'completed';
    batch.completedAt = new Date();
    await batch.save();

    // Cleanup uploaded file
    try { fs.unlinkSync(filePath); } catch (e) {}

    res.json({ batch, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get import history
exports.getImports = async (req, res) => {
  try {
    const imports = await ImportBatch.find()
      .sort('-createdAt')
      .limit(50)
      .populate('uploadedBy', 'name');
    res.json({ imports });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
