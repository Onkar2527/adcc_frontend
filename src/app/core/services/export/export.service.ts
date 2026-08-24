import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx-js-style';

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  /**
   * Export data to Excel (.xlsx) using the xlsx library
   * @param data Array of objects to export. Supports _rowType for styling/merging.
   * @param columns Array of column definitions { field: string, header: string }
   * @param fileName Name of the file (without extension)
   * @param reportHeaders Optional array of strings to show as merged rows on top
   * @param columnHeader Optional custom column header rows with relative merge ranges
   */
  exportToExcel(
    data: any[],
    columns: { field: string, header: string }[],
    fileName: string,
    reportHeaders: string[] = [],
    columnHeader?: { rows: any[][]; merges?: any[] },
  ) {
    if (!data || data.length === 0) {
      console.warn('No data to export');
      return;
    }

    const worksheetData: any[][] = [];
    const merges: any[] = [];
    let currentRowIndex = 0;

    // 1. Add Report Headers (Merged rows on top)
    reportHeaders.forEach((headerText) => {
      const headerRow = new Array(columns.length).fill('');
      headerRow[0] = headerText;
      worksheetData.push(headerRow);

      merges.push({
        s: { r: currentRowIndex, c: 0 },
        e: { r: currentRowIndex, c: columns.length - 1 }
      });
      currentRowIndex++;
    });

    // 2. Add Column Headers
    let columnHeaderRowIndexes: number[] = [];

    if (columnHeader?.rows?.length) {
      const headerStartRowIndex = currentRowIndex;

      columnHeader.rows.forEach((row) => {
        worksheetData.push(row);
        columnHeaderRowIndexes.push(currentRowIndex);
        currentRowIndex++;
      });

      (columnHeader.merges || []).forEach((merge) => {
        merges.push({
          s: {
            r: headerStartRowIndex + merge.s.r,
            c: merge.s.c,
          },
          e: {
            r: headerStartRowIndex + merge.e.r,
            c: merge.e.c,
          },
        });
      });
    } else {
      worksheetData.push(columns.map(col => col.header));
      columnHeaderRowIndexes.push(currentRowIndex);
      currentRowIndex++;
    }

    // 3. Add Data Rows (with special handling for group headers)
    data.forEach((row) => {
      if (row._rowType === 'header') {
        const groupHeaderRow = new Array(columns.length).fill('');
        groupHeaderRow[0] = row._headerValue || '';
        worksheetData.push(groupHeaderRow);

        merges.push({
          s: { r: currentRowIndex, c: 0 },
          e: { r: currentRowIndex, c: columns.length - 1 }
        });
      } else {
        worksheetData.push(columns.map(col => row[col.field]));
      }
      currentRowIndex++;
    });

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Apply Merges
    if (merges.length > 0) {
      worksheet['!merges'] = merges;
    }

    columnHeaderRowIndexes.forEach((rowIndex) => {
      for (let colIndex = 0; colIndex < columns.length; colIndex++) {
        const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
        const cell = worksheet[cellRef];

        if (!cell) {
          continue;
        }

        cell.s = {
          ...(cell.s || {}),
          font: {
            ...(cell.s?.font || {}),
            bold: true,
          },
          alignment: {
            ...(cell.s?.alignment || {}),
            horizontal: 'center',
            vertical: 'center',
            wrapText: true,
          },
        };
      }
    });

    // Basic styling/formatting hints for xlsx library (AOA to Sheet doesn't do much style, but we can set widths)
    const colWidths = columns.map((c) => ({
      wch: (c as any).excelWidth || Math.min(Math.max(c.header.length, 12), 22),
    }));
    worksheet['!cols'] = colWidths;

    // Center alignment for report headers (this is tricky with utilities, but we can try)
    // For now, AOAs are best for layout as requested.

    // Create Workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');

    // Generate and download file
    XLSX.writeFile(workbook, `${fileName}_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.xlsx`);
  }

  /**
   * Export an HTML Table element directly to Excel, preserving colors, alignment, borders, and fonts.
   * @param tableElement DOM table element
   * @param fileName File name for download
   */
  exportTableToExcel(tableElement: any, fileName: string) {
    // 1. Build DOM cell grid to map worksheet cells (r, c) to DOM elements
    const rows = Array.from(tableElement.querySelectorAll('tr'));
    const domGrid: any[][] = [];
    
    let rIndex = 0;
    rows.forEach((tr: any) => {
      if (!domGrid[rIndex]) domGrid[rIndex] = [];
      let cIndex = 0;
      
      const cells = Array.from(tr.cells);
      cells.forEach((cell: any) => {
        // Find next empty column slot
        while (domGrid[rIndex][cIndex] !== undefined) {
          cIndex++;
        }
        
        const rowspan = cell.rowSpan || 1;
        const colspan = cell.colSpan || 1;
        
        for (let r = 0; r < rowspan; r++) {
          for (let c = 0; c < colspan; c++) {
            const targetR = rIndex + r;
            const targetC = cIndex + c;
            if (!domGrid[targetR]) domGrid[targetR] = [];
            domGrid[targetR][targetC] = cell;
          }
        }
        cIndex += colspan;
      });
      rIndex++;
    });

    // 2. Generate worksheet using xlsx-js-style
    const worksheet = XLSX.utils.table_to_sheet(tableElement, { raw: true });

    // 3. Helper functions for parsing colors and styles
    const parseColorToHex = (colorStr: string): string | null => {
      if (!colorStr) return null;
      colorStr = colorStr.trim();
      
      // Hex: #ffffff or #fff
      if (colorStr.startsWith('#')) {
        let hex = colorStr.slice(1);
        if (hex.length === 3) {
          hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }
        return hex.toUpperCase();
      }
      
      // RGB/RGBA: rgb(220, 53, 69)
      const rgbMatch = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/i);
      if (rgbMatch) {
        const r = parseInt(rgbMatch[1], 10).toString(16).padStart(2, '0');
        const g = parseInt(rgbMatch[2], 10).toString(16).padStart(2, '0');
        const b = parseInt(rgbMatch[3], 10).toString(16).padStart(2, '0');
        return (r + g + b).toUpperCase();
      }
      
      const namedColors: { [key: string]: string } = {
        'white': 'FFFFFF',
        'black': '000000',
        'red': 'FF0000',
        'green': '00FF00',
        'blue': '0000FF'
      };
      return namedColors[colorStr.toLowerCase()] || null;
    };

    const extractStyleValue = (styleStr: string, property: string): string => {
      if (!styleStr) return '';
      const regex = new RegExp(`(?:^|;)\\s*${property}\\s*:\\s*([^;]+)`, 'i');
      const match = styleStr.match(regex);
      return match ? match[1].trim() : '';
    };

    // 4. Apply styles to sheet cells
    for (const key in worksheet) {
      if (key[0] === '!') continue; // Skip metadata
      
      const cellAddress = XLSX.utils.decode_cell(key);
      const r = cellAddress.r;
      const c = cellAddress.c;
      
      const domCell = domGrid[r]?.[c];
      if (domCell) {
        const cell = worksheet[key];
        
        // Initialize cell style object
        cell.s = {};

        // Extract style properties
        const tdStyle = domCell.getAttribute('style') || '';
        const trStyle = domCell.parentElement?.getAttribute('style') || '';

        // Extract Background Color
        let bgStyle = extractStyleValue(tdStyle, 'background-color') || 
                      extractStyleValue(tdStyle, 'background') || 
                      extractStyleValue(trStyle, 'background-color') || 
                      extractStyleValue(trStyle, 'background') || 
                      domCell.style.backgroundColor || 
                      domCell.parentElement?.style.backgroundColor || '';
        
        // Clean rgb(220 53 69) format that might be returned in CSS variables
        bgStyle = bgStyle.replace(/\s+/g, ' ');
        
        const hexBg = parseColorToHex(bgStyle);
        if (hexBg && hexBg !== 'FFFFFF') {
          cell.s.fill = {
            patternType: 'solid',
            fgColor: { rgb: hexBg }
          };
        } else if (domCell.tagName === 'TH') {
          // Default header background color if none specified
          cell.s.fill = {
            patternType: 'solid',
            fgColor: { rgb: 'E9ECEF' }
          };
        }

        // Extract Text Color
        let colorStyle = extractStyleValue(tdStyle, 'color') || 
                         extractStyleValue(trStyle, 'color') || 
                         domCell.style.color || 
                         domCell.parentElement?.style.color || '';
        
        // Custom color classes for risk cells
        if (domCell.classList.contains('text-red-risk')) {
          colorStyle = '#e24c4c';
        } else if (domCell.classList.contains('text-orange-risk')) {
          colorStyle = '#f59e0b';
        } else if (domCell.classList.contains('text-green-risk')) {
          colorStyle = '#10b981';
        }

        const hexColor = parseColorToHex(colorStyle);
        
        // Font size parsing
        let sz = 11; // default font size
        const fontSizeStyle = extractStyleValue(tdStyle, 'font-size') || 
                              extractStyleValue(trStyle, 'font-size') || '';
        if (fontSizeStyle.endsWith('px')) {
          const px = parseFloat(fontSizeStyle);
          sz = Math.round(px * 0.75); // Convert px to points approximately
        }

        // Font Weight (Bold)
        const isBold = domCell.tagName === 'TH' || 
                       domCell.style.fontWeight === 'bold' || 
                       domCell.parentElement?.style.fontWeight === 'bold' ||
                       tdStyle.toLowerCase().includes('font-weight: bold') ||
                       trStyle.toLowerCase().includes('font-weight: bold') ||
                       domCell.classList.contains('font-bold');

        cell.s.font = {
          name: 'Calibri',
          sz: sz,
          bold: isBold
        };

        if (hexColor) {
          cell.s.font.color = { rgb: hexColor };
        } else if (domCell.tagName === 'TH' || hexBg) {
          // If the background is dark, set text to white
          if (hexBg && ['DC3545', '0D3B66', '17A2B8', '0D2942', '0F2942', '2563EB', '3B82F6', '1E40AF'].includes(hexBg)) {
            cell.s.font.color = { rgb: 'FFFFFF' };
          }
        }

        // Alignments
        const textAlign = extractStyleValue(tdStyle, 'text-align') || 
                          extractStyleValue(trStyle, 'text-align') || 
                          domCell.style.textAlign || 
                          (domCell.tagName === 'TH' ? 'center' : 'left');
        
        cell.s.alignment = {
          vertical: 'center',
          horizontal: textAlign === 'center' ? 'center' : (textAlign === 'right' ? 'right' : 'left'),
          wrapText: true
        };

        // Standard borders for neatness
        cell.s.border = {
          top: { style: 'thin', color: { rgb: 'DDE2E6' } },
          bottom: { style: 'thin', color: { rgb: 'DDE2E6' } },
          left: { style: 'thin', color: { rgb: 'DDE2E6' } },
          right: { style: 'thin', color: { rgb: 'DDE2E6' } }
        };
      }
    }

    // 5. Build Workbook and Write
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
    XLSX.writeFile(workbook, `${fileName}_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.xlsx`);
  }

  /**
   * Export data to CSV and trigger download
   * @param data Array of objects to export
   * @param columns Array of column definitions { field: string, header: string }
   * @param fileName Name of the file (without extension)
   */
  exportToCsv(data: any[], columns: { field: string, header: string }[], fileName: string) {
    if (!data || data.length === 0) {
      console.warn('No data to export');
      return;
    }

    const headers = columns.map(col => col.header).join(',');
    const rows = data.map(row => {
      return columns.map(col => {
        let val = row[col.field];
        if (val === null || val === undefined) val = '';
        const cell = String(val).replace(/"/g, '""');
        return cell.includes(',') ? `"${cell}"` : cell;
      }).join(',');
    });

    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${fileName}_${new Date().getTime()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}
