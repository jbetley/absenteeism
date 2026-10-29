// general utility functions
// author:   jbetley (https://github.com/jbetley)
// version:  1.04
// date:     03.13.26 


/** Note: Actual keys have spaces.
 * @typedef TitleProperties
 * @type {object}
 * @property {string} StateAbbreviation
 * @property {string} StateFull
 * @property {string} DistrictName
 * @property {string} AltName
 * @property {string} NCESID
 * @property {string} EntityID
 * @property {string} LowGrade
 * @property {string} HighGrade
 * @property {string} Enrollment
 * @property {string} NumberCharterSchools
 * @property {string} NumberPublicSchools
 * @property {string} Address
 * @property {string} City
 * @property {string} State
 * @property {string} ZIP
 * @property {string} PhoneNumber
 * @property {string} Type
 * @property {string} Subtype
 * @property {string} AllocationYear
 * @property {string} TitleI
 * @property {string} TitleII
 * @property {string} TitleIII
 * @property {string} TitleIV
 * @property {string} TitleV
 **/

/** Note: Actual keys have spaces.
 * @typedef AttendanceProperties
 * @type {object}
 * @property {string} Year
 * @property {string} DistrictName
 * @property {string} EntityID
 * @property {string} AttendanceRate
 * @property {string} ChronicAbsenteeism
 **/

/** Note: Actual keys have spaces.
 * @typedef {Object} DistrictList
 * @property {String} DistrictName
 * @property {String} StateAbbreviation
 * @property {String} StateFull
 * @property {String} TitleI
 */

// TODO: Fix the Year type discrepancy
/** Note: Year is a string in format YYYY and there can be one or more Years.
 * @typedef {{DistrictName:String, EntityID:String, [Year:String]:Any}} AttendanceData
*/

/** Note: Year is a number in format YYYY and there can be one or more Years.
 * @typedef {{DistrictName:String, EntityID:String, [Year:Number]:Any}} AbsenteeismData
*/


/**
 * reorders keys of array of objects based on passed list
 * @param {TitleProperties|AttendanceProperties} arr array of objects
 * @param {Array<String>} order array of strings (key names)
 * @returns {Array<Object>} reordered array of objects
 */
function reorderKeys(arr, order) {
  return arr.map(obj => {
     return order.reduce((acc, key) => {
        acc[key] = obj[key];
        return acc;
     }, {});
  });
};


/**
 * Given an array and a key, find the maximum length for all
 * strings with the same key
 * @param {TitleProperties|AttendanceProperties} arr array of objects
 * @param {String} key a key name
 * @returns {Number} max length of all string properties with passed key
 */
function findMaxValueLength(arr, key) {
  if (!arr || arr.length === 0) {
    return 0;
  }
  return arr.reduce((max, obj) => {
    const value = obj[key];
    const length = value ? String(value).length : 0;
    return Math.max(max, length);
  }, 0);
}


/**
 * modifies SheetJS object formatting attributes
 * @param {Object} worksheet sheetJs worksheet
 * @param {String} col column to format (uses Excel Designation- "A", "B")
 * @param {String} fmt number formatting string (e.g., "#,##0") 
 */
function formatColumn(worksheet, col, fmt) {
  const range = XLSX.utils.decode_range(worksheet['!ref'])
  let tableCol = XLSX.utils.decode_col(col); 

  // note: range.s.r + 1 skips the header row
  for (let row = range.s.r + 1; row <= range.e.r; ++row) {
    const ref = XLSX.utils.encode_cell({ r: row, c: tableCol })
    
    if (worksheet[ref] && worksheet[ref].t === 'n') {
      worksheet[ref].z = fmt
    }
  }
};


/**
 * convert array of objects to strings for output in csv format
 * strings with the same key
 * @param {TitleProperties|AttendanceProperties} arr array of objects
 * @returns {String} a comma separated string
 */
function convertArrayToCSV(data) {
  const header = Object.keys(data[0]).join(',');
  const rows = data.map(obj => Object.values(obj).join(','));
  return `${header}\n${rows.join('\n')}`;
}


/**
 * export comma separated string to csv 
 * @param {String} csv comma separated string
 * @param {String} filename
 */
function downloadCSV(csv, filename) {
  const csvFile = new Blob([csv], { type: 'text/csv' });
  const downloadLink = document.createElement('a');
  downloadLink.href = URL.createObjectURL(csvFile);
  downloadLink.download = filename;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
}


/**
 * Given an array and key, sort by number with blanks to end
 * @param {DistrictList|AttendanceData|AbsenteeismData} arr array of objects
 * @param {String} property a key name
 * @returns {DistrictList|AttendanceData|AbsenteeismData} sorted array of objects
 */
function sortObjectsByNumberWithBlanksToEnd(arr, property) {
  arr.sort((a, b) => {
     const aValue = a[property];
     const bValue = b[property];
     if ((aValue === null || aValue === undefined || aValue === '') && 
        (bValue !== null && bValue !== undefined && bValue !== '')) {
        return 1; 
     }
     if ((bValue === null || bValue === undefined || bValue === '') &&
        (aValue !== null && aValue !== undefined && aValue !== '')) {
        return -1;
     }
     
     return (bValue || 0) - (aValue || 0);
  });
  return arr;
}


/**
 * Format raw phone number string (keeps '+1' international prefix if exists)
 * @param {String} phoneNumberString a string
 * @returns {String} 
 */
// function formatPhoneNumber(phoneNumberString) {
//   var cleaned = ('' + phoneNumberString).replace(/\D/g, '');
//   var match = cleaned.match(/^(1|)?(\d{3})(\d{3})(\d{4})$/);
//   if (match) {
//     var intlCode = (match[1] ? '+1 ' : '');
//     return [intlCode, '(', match[2], ') ', match[3], '-', match[4]].join('');
//   }
//   return null;
// };


/**
 * Converts lower/upper case strings to title case.
 * @param {String} str any string
 * @returns {String} string in title case (first letter capitalized)
 */
function proper(str) {
  let upper = true
  let newStr = ''
  
  for (let i = 0, l = str.length; i < l; i++) {
      // check for spaces with: str[i].match(/\s/)
      if (str[i] == ' ') {
          upper = true
          newStr += str[i]
          continue
      }
      newStr += upper ? str[i].toUpperCase() : str[i].toLowerCase()
      upper = false
  }
  return newStr
};


/**
 * Split object into two objects at passed index
 * Use: const [firstPart, secondPart] = splitObject(data, 6);
 * @param {Object} obj a single object
 * @param {Number} index a number representing an index
 * @returns {Array<Object,Object>} an array with two objects
 */
function splitObject(obj, index) {
  const keys = Object.keys(obj);
  const firstHalf = {};
  const secondHalf = {};

  for (let i = 0; i < keys.length; i++) {
      if (i < index) {
        firstHalf[keys[i]] = obj[keys[i]];
      } else {
        secondHalf[keys[i]] = obj[keys[i]];
      }
  }
  return [firstHalf, secondHalf];
};


/**
 * Retrieves the first year (YYYY) string found in object keys.
 * @param {Object} obj a single object
 * @returns {?String} a string year in format YYYY
 */
function getYearString(object) {
  const regex = /(20)\d{2}\b/;
  for (const key in object) {
     if (object.hasOwnProperty(key)) {
        if (regex.test(key)) {
           return key.match(regex)[0];
        }
     }
  }
  return null;
};


/**
 * Removes a substring from all keys in an object
 * @param {Object} obj a single object
 * @param {String} substring a string
 * @returns {Object} a new object with substring removed
 */
function removeSubstringFromKeys(obj, substring) {
  const newObj = {};
  for (const key in obj) {
     if (obj.hasOwnProperty(key)) {
        const newKey = key.replace(substring, '');
        newObj[newKey] = obj[key];
     }
  }
  return newObj;
}

/**
 * Removes a substring from all keys in an array of objects
 * @param {Array} arr an array of objects
 * @param {String} substring a string
 * @returns {Object} a new object with substring removed
 */
const cleanArrayOfObjects = (arr, substring) => {
  return arr.map(obj => 
    Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [
        key.replace(substring, ''), // Removes the substring from the key
        value
      ])
    )
  );
};

/**
 * Filter an array of objects by the keys listed in 'keep'
 * @param {Array<Object>} arr an array of objects
 * @param {Array} kept array of strings
 * @returns {Array<Object>} array of objects with only keys listed in kept.
 */
function filterObj(arr, kept) {
  return arr.map(o => Object.fromEntries(kept.map(k => [k, o[k]])))
};


/**
 * Get most recent year from array of object keys
 * @param {Array<Object>} arr an array of objects
 * @returns {Array<String>} array of string Years in YYYY
 */
function getYearList(arr) {

  let cols = Object.keys(arr[0]);
  let years = cols.filter(item => !["District Name", "Entity ID"].includes(item));
  years.sort()
  years.reverse()

  return years
}


/**
 * Merge objects in an array with the same "key" value
 * @param {Array<Object>} arr an array of objects
 * @param {String} key a string matching a key in obj
 * @returns {Array<Object>} merged array of objects
 */
function mergeObjectsWithSameValue(arr, key) {
  const merged = {};
  arr.forEach(obj => {
      const value = obj[key];
      if (merged[value]) {
        Object.assign(merged[value], obj);
      } else {
        merged[value] = obj;
      }
  });
  return Object.values(merged);
};

 
/**
 * Removes all existing elements from select element (dropdown)
 * @param {Object} selectElement an Element object
 */
 function removeOptions(selectElement) {
  var i, L = selectElement.options.length - 1;
  for(i = L; i >= 0; i--) {
     selectElement.remove(i);
  }
};


/**
 * Replace one Key with another in an array of objects
 * @param {Array<Object>} arr an array of objects
 * @param {String} key the replacement key
 * @param {String} key the key to be replaced
 * @returns {Array<Object>} the array of objects with replaced key
 */
function replaceKeyWithValue(arr, keyToKeep, keyToReplace) {
  return arr.map(obj => {
      if (obj.hasOwnProperty(keyToReplace)) {
        const value = obj[keyToKeep];
        obj[value] = obj[keyToReplace];
        delete obj[keyToKeep];
        delete obj[keyToReplace];
      }
      return obj;
  });
};


/**
 * Returns True if every object in an array of objects has the same
 * passed value for the passed key
 * @param {Array<Object>} arr an array of objects
 * @param {String} key the key to be checked
 * @param {String} value the value to be checked
 * @returns {Boolean} 
 */
function hasSameKeyValue(arr, key, value) {
  if (!Array.isArray(arr) || arr.length === 0) {
    return true;  // An empty array or non-array is considered to have the "same" values
                  // for a key
  }
  // Use every() to check if all subsequent objects have the same value for the key
  return arr.every(obj => obj[key] === value);
}
