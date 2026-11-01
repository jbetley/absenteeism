// table processing functions
// author:   jbetley (https://github.com/jbetley)
// version:  1.04
// date:     11/01/26


// Table Formatting Functions //
function moneyFormatter(params) {
   console.log(params.value)
   if (params.value == undefined || params.value == "") {
      return '\u2014'
   }
   else {
      const val = parseFloat(params.value)
      var sansDec = val.toFixed(2);
      var formatted = sansDec.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      return '$ '+ `${formatted}`;
   }
};

// TODO: Copied from above - make own function without params = dict requirement
function accountingFormatter(params) {
   if (params.value == undefined) {
      return '\u2014'
   }
   else {
      const val = parseFloat(params.value)
      var sansDec = val.toFixed(0);
      var formatted = sansDec.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      return `${formatted}`;
   }
};

// substitues em dash for undefined values
function blankFormatter(params) {
   if (params.value == undefined || params.value == "") {
      return '\u2014'
   }
   else {
      return params.value;
   }
};

function percentFormatter(params) {
   if (params.value == undefined || params.value == "") {
      return '\u2014'
   }
   else {
      const val = params.value * 100;
      var formatted = val.toFixed(2);
      return `${formatted}` + '%';
   }
};

// adds a "+" sign to positive values
function styledPercentFormatter(params) {
   if (params.value == undefined || params.value == "") {
      return '\u2014'
   }
   else {
      const val = params.value * 100;
      var formatted = val.toFixed(2);
      if (formatted > 0) {
         return '+' + `${formatted}` + '%';
      } else {
         return `${formatted}` + '%';
      }
   }
};

// Fade a div out or in. duration is ms; default is fade out,
// set fadeOut to false to fade in
function fadeDiv(element, duration, fadeOut = true) {
   let startTime;
   const startOpacity = fadeOut ? 1 : 0;
   const endOpacity = fadeOut ? 0 : 1;

   function animate(currentTime) {
      if (!startTime) {
         startTime = currentTime;
      }

      const elapsed = currentTime - startTime;
      let progress = elapsed / duration;

      if (progress > 1) {
         progress = 1;
      }

      const opacity = startOpacity + (endOpacity - startOpacity) * progress;
      element.style.opacity = opacity;

      if (progress < 1) {
         requestAnimationFrame(animate);
      } else if (fadeOut) {
         element.style.display = 'none';
      }
   }
   if (!fadeOut) {
      element.style.display = 'flex';
   }
   requestAnimationFrame(animate);
};


// Basic html table (State School Info)
function stateInfoTable(data, id) {

   let stateInfoTableDiv = document.getElementById(id);

   stateInfoTableDiv.innerHTML = '';

   var table = document.createElement('TABLE');
   table.border = '0';

   var tableBody = document.createElement('TBODY');
   table.appendChild(tableBody);

   if (Object.entries(data).length > 0) {

      for (var i = 0; i < 7; i++) {
         let tr = document.createElement('TR');
         tableBody.appendChild(tr);

         for (var j = 0; j < 2; j++) {
            var td = document.createElement('TD');
            if (j == 0) {
               td.width = '180';
            } else {
               td.width = '70';
            }
            td.height = '12';

            if (i==0) {
               if (j==0) {
                  td.appendChild(document.createTextNode('# School Districts:'));
               } else {
                  td.appendChild(document.createTextNode(data['Total School Districts']));
               }
            }
            else if (i==1) {
               if (j==0) {
                  td.appendChild(document.createTextNode('# Traditional Schools:'));
               } else {
                  td.appendChild(document.createTextNode(data['Total Schools']));
               }
            }
            else if (i==2) {
               if (j==0) {
                  td.appendChild(document.createTextNode('# Charter Schools:'));
               }
               else {
                  td.appendChild(document.createTextNode(data['Total Charters']));
               }
            }
            else if (i == 3) {
               if (j==0) {
                  td.appendChild(document.createTextNode('Charters are LEA: '));
                  td.style.fontWeight = 'bold';
               }
               else {
                  td.appendChild(document.createTextNode(data['Charter LEA']));
               }
            }
            else if (i == 4) {
               if (j==0) {
                  td.appendChild(document.createTextNode('Voucher Program:'));
               }
               else {
                  td.appendChild(document.createTextNode(data['Voucher Program']));
               }
            }
            else if (i == 5) {
               if (j==0) {
                  td.appendChild(document.createTextNode('ESA Program:'));
               }
               else {
                  td.appendChild(document.createTextNode(data['ESA Program']));
               }
            }
            else {
               if (data['Written Notice'] != null) {
                  if (j==0) {
                     td.appendChild(document.createTextNode('Written Notice Required:'));
                     td.style.fontWeight = 'bold';
                  }
                  else {
                     td.appendChild(document.createTextNode(data['Written Notice']));
                  }
               }
            }
            tr.appendChild(td);
         }
      }

      // Tooltip/Popups //
      // Rows with tooltips/popups must be given a specific ID and the 
      // data to be displayed must be set as a string dataset note
      // value. Also need to add the id to the mouseover eventListener
      // in index.html.
      table.rows[3].id = 'popup-charter-lea-notice'
      table.rows[3].dataset.note = data['Charter Notes'];

      table.rows[6].id = 'popup-written-notice'
      table.rows[6].dataset.note = data['Notice Requirements'];

   } else {

      // Empty Table
      // NOTE: approximating width of the tables by calculating the
      // width of the label and using 1/3 of that value
      const labelDiv = document.getElementById("state-label");
      const labelDivWidth = window.getComputedStyle(labelDiv).width;

      let tr = document.createElement('TR');
      tableBody.appendChild(tr);
      let td = document.createElement('TD');
      td.height = '120';
      td.width = parseFloat(labelDivWidth) * .33;
      td.style.textAlign = 'center';
      td.style.verticalAlign = 'middle';
      td.appendChild(document.createTextNode('No Data.'));
      tr.appendChild(td);
   }

   stateInfoTableDiv.appendChild(table);
};


// programatically create specific basic html table (Title Allocations)
function allocationsTable(object, id) {

   var allocationsTableDiv = document.getElementById(id);

   allocationsTableDiv.innerHTML = '';

   var table = document.createElement('TABLE');
   table.border = '0';

   var tableBody = document.createElement('TBODY');
   table.appendChild(tableBody);

   if (Object.entries(object).length > 0) {

      // get title year & strip from string
      let year = getYearString(object);
      let data = removeSubstringFromKeys(object, year);
      data = removeSubstringFromKeys(data, "Allocation");

      const keys = Object.keys(data);

      // Rows
      let count = keys.length;

      for (var i = 0; i < count; i++) {
         let tr = document.createElement('TR');
         tableBody.appendChild(tr);

         // Cols
         let td1 = document.createElement('TD');
         td1.appendChild(document.createTextNode(keys[i] + ':'));
         tr.appendChild(td1);

         let td2 = document.createElement('TD');
         const curNum = accountingFormatter({'value': data[keys[i]]});

         td2.appendChild(document.createTextNode(curNum));
         tr.appendChild(td2);
      }

   } else {

      // Empty Table
      // NOTE: approximating width of the tables by calculating the
      // width of the label and using 2/3 of that value.
      const labelDiv = document.getElementById("state-label");
      const labelDivWidth = window.getComputedStyle(labelDiv).width;
      let tr = document.createElement('TR');
      tableBody.appendChild(tr);
      let td = document.createElement('TD');
      td.height = '120';
      td.width = parseFloat(labelDivWidth) * .66;
      td.style.textAlign = 'center';
      td.style.verticalAlign = 'middle';
      td.appendChild(document.createTextNode('No Data.'));
      tr.appendChild(td);
   };

   allocationsTableDiv.appendChild(table);
};


// programatically create specific basic html table (School District Info)
function districtInfoTable(data, id) {

   let districtInfoTableDiv = document.getElementById(id);

   fadeDiv(districtInfoTableDiv, 250);

   districtInfoTableDiv.innerHTML = '';

   var table = document.createElement('TABLE');
   table.border = '0';
   var tableBody = document.createElement('TBODY');
   table.appendChild(tableBody);

   // in addition to missing data, data may be undefined if "State" or a
   // charter school (that is not an LEA and thus is not in the districts file)
   // is selected from either of the tables
   if ( data != undefined ) {

      for (var row = 0; row < 7; row++) {
         var tr = document.createElement('TR');
         tableBody.appendChild(tr);

         for (var col = 0; col < 2; col++) {

            var td = document.createElement('TD');

            if (col == 0) {
               td.width = '125';
            }
            td.height = '12';

            if (row==0) {
               if (col==0) {
                  td.appendChild(document.createTextNode('District:'));
               } else  {
                  const nameID = data['District Name'] + " (ID: " + data['Entity ID'] + ")";
                  td.appendChild(document.createTextNode(nameID));
               }
            }
            else if (row==1) {
               if (col==0) {
                  td.appendChild(document.createTextNode('Address:'));
               } else {
                  td.appendChild(document.createTextNode(proper(data['Address'])
                  ));
               }
            }
            else if (row==2) {
               if (col==0) {
                  td.appendChild(document.createTextNode(''));
               }
               else {
                  td.appendChild(document.createTextNode(
                     proper(data['City']) + ', ' + data['State Abbreviation'] + '  ' + data['ZIP']
                  ));
               }
            }
            else if (row == 3) {
               let type;

               if (data['Type'].includes('Charter')) {
                  type = 'Charter School'
               } else {
                  type = 'School District'
               }
               if (col==0) {
                  td.appendChild(document.createTextNode('School Type:'));
               } else {
                  td.appendChild(document.createTextNode(type));
               }
            }
            else if (row == 4) {
               let name, val;
               if (data['Type'].includes('Charter')) {
                  name = ''
                  val = ''
               } else {
                  name = 'Traditional / Charter:'
                  val = data['Number Public Schools'] + " / " + data['Number Charter Schools'];
               }
               if (col==0) {
                  td.appendChild(document.createTextNode(name));
               } else {
                  td.appendChild(document.createTextNode(val));
               }
            }
            else if (row == 5) {
               if (col==0) {
                  td.appendChild(document.createTextNode("Total Enrollment:"));
               } else {
                  const enrollment = accountingFormatter({'value': data["Enrollment"]});
                  td.appendChild(document.createTextNode(enrollment));
               }
            }         
            tr.appendChild(td);
         }
      }
   } 
else {
   var tr = document.createElement('TR');
   tableBody.appendChild(tr);
   var td = document.createElement('TD');
   td.width = '100%';
   td.height = '50%';
   td.style.fontWeight = 'bold';
   td.appendChild(document.createTextNode("No Data to Display."));
   tr.appendChild(td);
}
   
   // Fade in. The timeout interval must be at least equal to the fade out
   // duration, if it is less than the fade duration, the animation will
   // trigger one too many times causing the div to remain faded out
   setTimeout(() => {
      districtInfoTableDiv.appendChild(table);
      fadeDiv(districtInfoTableDiv, 250, false);
      }, 300);
};