// ==UserScript==
// @name          Horse Genetics Extender
// @namespace     cryptal
// @license       MIT
// @description   For Howrse: Extends the genetic information of a horse
// @author        CryptalEquine
// @include       */elevage/chevaux/cheval?id=*
// @include       */elevage/fiche/?id=*
// @version       1.2.1
// @run-at        document-start
// @noframes      true
// @grant         unsafeWindow
// @grant         GM_setValue
// @grant         GM_getValue
// @require       https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js
// @require       https://gist.githubusercontent.com/BrockA/2625891/raw/9c97aa67ff9c5d56be34a55ad6c18a314e5eb548/waitForKeyElements.js
// @updateURL     https://openuserjs.org/meta/CryptalEquine/Horse_Genetics_Extender.meta.js
// @downloadURL   https://openuserjs.org/install/CryptalEquine/Horse_Genetics_Extender.user.js
// ==/UserScript==


// Remove the elements created by the now-inferior Genetics Revealer script
waitForKeyElements('span[style="font-size: 0.85em; color: blue;"]', function(e) {
   $('span[style="font-size: 0.85em; color: blue;"]').remove();
}, false);

// Wait til the necessary HTML elements have loaded
waitForKeyElements("#origins-body-content", function(e) {
   (async function() {
      var decimals = 5; // Change this to change how many decimal points show
      var skills = ['endurance', 'vitesse', 'dressage', 'galop', 'trot', 'saut'];
      var skillsEng = ['stamina', 'speed', 'dressage', 'gallop', 'trot', 'jumping'];
      var skillsShort = ['st', 'sp', 'dr', 'ga', 'tr', 'ju'];
      var id = location.href.match(/id\=[0-9]+/g)[0].match(/[0-9]+/g)[0].trim();
      var db = JSON.parse(GM_getValue('geneticsDB', '{}'));
      var queries = [], perc = {}, parents = $('#origins-body-content').find('a.horsename');
      
      function acc(x, n) {
         return parseFloat(x.toFixed(n));
      }
      
      function abort() {
         console.log('NOT ENOUGH DATA TO DO EXTENDED GENETIC COMPARISON!');
         
         for (var i = 0; i < skillsShort.length; i++) {
            $('#' + skills[i] + 'Genetique').parent().append('<span class="genetics_perc">' + acc(perc[skillsShort[i]] * 100, 3) + '%</span>');
         }
      }
      
      function getStats(_id, _html, _owner) {
         if (_id == null || _html == null || _owner == null)
            return null;
         var dbEntry = {gp: 0, date: (new Date()).getTime()};
         for (var i = 0, stat = 0; i < skillsShort.length; i++) {
            if (!_owner)
               stat = parseFloat(_html.find('#' + skills[i] + 'Genetique').text());
            else
               stat = unsafeWindow[skills[i] + 'Genetique']; // Has better precision
            dbEntry[skillsShort[i]] = stat;
            dbEntry.gp += stat;
         }
         dbEntry.gp = acc(dbEntry.gp, decimals);
         dbEntry.blup = getBLUP(_html.find('#genetic-body-content').find('table').eq(1).find('strong.nowrap').text());
         db[_id] = dbEntry;
         GM_setValue('geneticsDB', JSON.stringify(db));
         return dbEntry;
      }
      
      function getBLUP(_value) {
         var _conversion = parseFloat(_value);
         return isNaN(_conversion) ? 100 : _conversion;
      }
      
      function checkPage(_html, _id) {
         var _page = _html == null ? null : $(typeof _html != 'string' ? _html[0] : _html);
         
         // If parent link was valid but horse is in haven/heaven
         _page = _page != null && _page.find('img[alt="paradis"]').length > 0 ? null : _page;
         
         if (_page == null && db[_id] == null)
            console.log("Cannot query " + _id + " page, as either they're dead or don't exist");
         
         return _page;
      }
      
      if (db[id] == null)
         getStats(id, $('#tab-genetics'), location.href.indexOf('elevage/fiche') == -1);
      
      // Calculate basic genetic percentages
      for (var i = 0; i < skillsShort.length; i++) {
         perc[skillsShort[i]] = (db[id][skillsShort[i]] / db[id].gp);
      }
      
      // Script only works if there's two valid parent horse links
      if (parents.length == 2) {
         var sireLink = parents.eq(0).attr('href');
         var sireID = sireLink.match(/[0-9]+/g)[0].trim();
         var damLink = parents.eq(1).attr('href');
         var damID = damLink.match(/[0-9]+/g)[0].trim();
         
         // GET request for parents horse page
         if (db[sireID] == null)
            queries.push($.ajax({method: 'GET', url: location.origin + sireLink}));
         if (db[damID] == null)
            queries.push($.ajax({method: 'GET', url: location.origin + damLink}));
         
         // Once GET requests are done
         $.when(...queries).done(function(sireHTML, damHTML) {
            if (db[sireID] != null) {
               damHTML = sireHTML;
               sireHTML = null;
            }
            
            var sirePage = checkPage(sireHTML, sireID);
            var damPage = checkPage(damHTML, damID);
            
            if ((sirePage == null && db[sireID] == null) || (damPage == null && db[damID] == null))
               return abort();
            
            var sire = getStats(sireID, sirePage, false) || db[sireID];
            var dam = getStats(damID, damPage, false) || db[damID];
            var pAvg = {}, pAvgPerc = {}, diffAbs = {}, diff = {};
            
            // Absolute values of parents GP and differences
            for (var i = 0; i < skillsShort.length; i++) {
               pAvg[skillsShort[i]] = (sire[skillsShort[i]] + dam[skillsShort[i]]) / 2;
               diffAbs[skillsShort[i]] = acc(db[id][skillsShort[i]] - pAvg[skillsShort[i]], decimals);
            }
            pAvg.gp = acc((sire.gp + dam.gp) / 2, decimals);
            pAvg.blup = acc((sire.blup + dam.blup) / 2, decimals);
            diff.gp = acc(db[id].gp - ((sire.gp + dam.gp) / 2), decimals);
            
            var ibsMaxNT = acc(db[id].gp * 0.208 * (((sire.blup + dam.blup) / 2) / 100), 2);
            var ibsMaxNT_IB = acc(db[id].gp * 0.208, 2);
            
            var ibsMaxT = acc(db[id].gp * 0.312 * (((sire.blup + dam.blup) / 2) / 100), 2);
            var ibsMaxT_IB = acc(db[id].gp * 0.312, 2);
            
            var maxSkills = acc(ibsMaxT + db[id].gp + 238.5, 2);
            var maxSkills_IB = acc(ibsMaxT_IB + db[id].gp + 238.5, 2);
            
            // Percentages of parents GP and differences
            for (var i = 0; i < skillsShort.length; i++) {
               pAvgPerc[skillsShort[i]] = pAvg[skillsShort[i]] / pAvg.gp;
               diff[skillsShort[i]] = acc(100 * (perc[skillsShort[i]] - pAvgPerc[skillsShort[i]]), decimals);
            }
            
            var css = `<style>
               .genetics_extender {color: blue; margin-top: 5px;}
               .genetics_formulas {color: blue;}
               #staminaGenetics, #speedGenetics, #dressageGenetics, #gallopGenetics, #trotGenetics, #jumpingGenetics {
                  font-size: 0.9em;
               }
            </style>`;
            
            var gtEl = $('#genetic-body-content').find('table').eq(0);
            gtEl.after(css + '<table class="width-100 genetics_extender">' + gtEl.html() + '</table>');
            
            var gpTitle = $('.genetics_extender').find('tr').eq(0).find('td').first().find('strong');
            var gpValue = $('.genetics_extender').find('tr').eq(0).find('td').last().find('strong');
            
            gpTitle.html(gpTitle.html() + ' change');
            gpValue.html('+' + diff.gp);
            
            for (var i = 0; i < skills.length; i++) {
               $('.genetics_extender').find('#' + skills[i] + 'Genetique').attr('id', skillsEng[i] + 'Genetics');
               $('#' + skillsEng[i] + 'Genetics').html((diff[skillsShort[i]] > 0 ? ('+' + diff[skillsShort[i]]) : diff[skillsShort[i]]) + '%');
               $('#' + skills[i] + 'Genetique').parent().append('<span class="genetics_perc">' + acc(perc[skillsShort[i]] * 100, 3) + '%</span>');
            }
            
            $('.genetics_extender').find('span').removeClass('bold');
            $('.genetics_extender').find('tbody').append(`
               <tr class="genetics_formulas"></tr>
               <tr class="genetics_config"></tr>
               <tr class="genetics_ibsNT"></tr>
               <tr class="genetics_ibsT"></tr>
               <tr class="genetics_maxSkills"></tr>
               <tr class="genetics_resetParents"></tr>
            `);
            $('.genetics_formulas').html('<td class="first align-left bold"></td><td class="align-left bold"></td><td></td><td class="last align-right" colspan="2"></td>');
            $('.genetics_config').html('<td class="first"></td><td></td><td class="last align-right" colspan="3"></td>');
            $('.genetics_ibsNT').html('<td class="first align-left bold" colspan="3">Max IBS (no tears):</td><td colspan="1">' + ibsMaxNT + (ibsMaxNT < ibsMaxNT_IB ? ' [' + ibsMaxNT_IB + ']' : '') + '</td>');
            $('.genetics_ibsT').html('<td class="first align-left bold" colspan="3">Max IBS (tears):</td><td colspan="1">' + ibsMaxT + (ibsMaxT < ibsMaxT_IB ? ' [' + ibsMaxT_IB + ']' : '') + '</td>');
            $('.genetics_maxSkills').html('<td class="first align-left bold" colspan="3">Max Skills (WOY/POC):</td><td colspan="1">' + maxSkills + (maxSkills < maxSkills_IB ? ' [' + maxSkills_IB + ']' : '') + '</td>');
            $('.genetics_resetParents').html('<td class="first align-left bold" colspan="4"><input type="button" value="Reset Parents Stats"></td>');
            
            $('.genetics_formulas').find('td').last().html(`<select id="genetics_weightings">
               <option id="tr45_sp30_dr20">Trot (Prix)</option>
               <option id="ga45_sp30_dr20">Gallop (Prix)</option>
               <option id="dr45_tr30_ga20">Dressage (Prix)</option>
               <option id="st45_dr30_ju20">Cross Country (Prix)</option>
               <option id="ju45_dr30_sp20">Show Jumping (Prix)</option>
               <option id="sp45_st30_ga20">Barrel Racing (Prix)</option>
               <option id="st45_dr30_sp20">Cutting (Prix)</option>
               <option id="dr45_tr30_ju20">Trail Class (Prix)</option>
               <option id="ga45_dr30_st20">Reining (Prix)</option>
               <option id="tr45_st30_dr20">Western Pleasure (Prix)</option>
               <option id="st100">Pure Stamina (Genetics)</option>
               <option id="sp100">Pure Speed (Genetics)</option>
               <option id="dr100">Pure Dressage (Genetics)</option>
               <option id="ga100">Pure Gallop (Genetics)</option>
               <option id="tr100">Pure Trot (Genetics)</option>
               <option id="ju100">Pure Jump (Genetics)</option>
            </select>`);
            
            function changeToggle(e) {
               var absolutes = $(e.target).is(':checked');
               for (var i = 0; i < skills.length; i++) {
                  if (!absolutes)
                     $('#' + skillsEng[i] + 'Genetics').html((diff[skillsShort[i]] > 0 ? ('+' + diff[skillsShort[i]]) : diff[skillsShort[i]]) + '%');
                  else
                     $('#' + skillsEng[i] + 'Genetics').html((diffAbs[skillsShort[i]] > 0 ? ('+' + diffAbs[skillsShort[i]]) : diffAbs[skillsShort[i]]));
               }
            }
            
            $('.genetics_config').find('td').last().html('<input type="checkbox" id="genetics_toggle"> <span>Show absolute values</span>');
            $('#genetics_toggle').change(changeToggle);
            $('.genetics_config').find('span').click(function(){ $('#genetics_toggle').click(); });
            
            function getFormula(obj, w) {
               var f = 0;
               for (var i = 0; i < w.length; i++) {
                  f += obj[w[0].substr(0, 2)] * parseInt(w[0].substr(2));
               }
               return f;
            }
            
            function showFormula() {
               var weightingsText = $('#genetics_weightings').children(":selected").attr('id').split('_');
               var parentFormula = getFormula(pAvgPerc, weightingsText);
               var childFormula = getFormula(perc, weightingsText);
               var formula = acc((childFormula - parentFormula) * 1000, decimals);
               var formulaHTML = '<span>' + ((formula > 0 ? '+' : '') + formula) + '</span>';
               $('.genetics_formulas').find('td').first().html('Competition:');
               $('.genetics_formulas').find('td').eq(1).html(formulaHTML);
            }
            
            function resetParents() {
               console.log("Re-requesting parents genetic data ...");
               
               var resetQueries = [];
               resetQueries.push($.ajax({method: 'GET', url: location.origin + sireLink}));
               resetQueries.push($.ajax({method: 'GET', url: location.origin + damLink}));
               
               $.when(...resetQueries).done(function(_sireHTML, _damHTML) {
                  var _sirePage = checkPage(_sireHTML, sireID);
                  var _damPage = checkPage(_damHTML, damID);
                  
                  db[sireID].blup = getBLUP(_sirePage.find('#genetic-body-content').find('table').eq(1).find('strong.nowrap').text());
                  db[damID].blup = getBLUP(_damPage.find('#genetic-body-content').find('table').eq(1).find('strong.nowrap').text());
                  console.log('Sire BLUP: ' + acc(db[sireID].blup, 2) + ',  Dam BLUP: ' + acc(db[damID].blup, 2));
                  var comboBLUP = (db[sireID].blup + db[damID].blup) / 2;
                  
                  var ibsMaxNT = acc(db[id].gp * 0.208 * (comboBLUP / 100), 2);
                  var ibsMaxNT_IB = acc(db[id].gp * 0.208, 2);
                  
                  var ibsMaxT = acc(db[id].gp * 0.312 * (comboBLUP / 100), 2);
                  var ibsMaxT_IB = acc(db[id].gp * 0.312, 2);
                  
                  var maxSkills = acc(ibsMaxT + db[id].gp + 238.5, 2);
                  var maxSkills_IB = acc(ibsMaxT_IB + db[id].gp + 238.5, 2);
                  
                  $('.genetics_ibsNT').html('<td class="first align-left bold" colspan="3">Max IBS (no tears):</td><td colspan="1">' + ibsMaxNT + (ibsMaxNT < ibsMaxNT_IB ? ' [' + ibsMaxNT_IB + ']' : '') + '</td>');
                  $('.genetics_ibsT').html('<td class="first align-left bold" colspan="3">Max IBS (tears):</td><td colspan="1">' + ibsMaxT + (ibsMaxT < ibsMaxT_IB ? ' [' + ibsMaxT_IB + ']' : '') + '</td>');
                  $('.genetics_maxSkills').html('<td class="first align-left bold" colspan="3">Max Skills (WOY/POC):</td><td colspan="1">' + maxSkills + (maxSkills < maxSkills_IB ? ' [' + maxSkills_IB + ']' : '') + '</td>');
               });
            }
            
            $('#genetics_weightings').change(showFormula);
            $('.genetics_resetParents').find('input').click(function() { resetParents(); });
            showFormula();
         });
      }
      else
         abort();
      
      $('#genetic-body-content').append('<style>.genetics_perc {color: blue; font-size: 0.85em;}</style>');
   })();
}, true);